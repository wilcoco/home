/* ============================================
   ㈜캠스 (CAMS Korea) - Web Server
   - 정적 파일 서빙 (cleanUrls)
   - 윤리경영 제보 접수 API (POST /api/report) → SQLite DB 저장
   - 관리자 전용 리포트 (/admin) → Basic 인증
   - (선택) MAIL_ON_REPORT=true 시 SMTP 메일도 발송
   ============================================ */

try { require('dotenv').config(); } catch (_) { /* dotenv 없으면 무시 (Railway는 환경변수 직접 주입) */ }
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const nodemailer = require('nodemailer');
const Database = require('better-sqlite3');

const app = express();
app.set('trust proxy', true); // Railway 등 프록시 뒤에서 req.ip 정확히
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

/* ---------- 설정 (환경변수) ---------- */
// 관리자 (리포트 열람용 아이디/비번)
const ADMIN_USER = process.env.ADMIN_USER || '';
const ADMIN_PASS = process.env.ADMIN_PASS || '';
// DB 저장 위치 (Railway는 볼륨을 /data 에 붙이고 DATA_DIR=/data 권장)
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data');

// (선택) 메일도 함께 발송할지 — 기본 꺼짐. 메일서버 접속 가능할 때만 true
const MAIL_ON_REPORT = String(process.env.MAIL_ON_REPORT || 'false') === 'true';
const REPORT_TO = process.env.REPORT_TO || 'json@icams.co.kr';
const REPORT_FROM = process.env.REPORT_FROM || process.env.SMTP_USER || 'no-reply@cams-korea.com';
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_SECURE = String(process.env.SMTP_SECURE || 'false') === 'true';
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const SMTP_IGNORE_TLS = String(process.env.SMTP_IGNORE_TLS || 'false') === 'true';
const SMTP_TLS_REJECT_UNAUTHORIZED = String(process.env.SMTP_TLS_REJECT_UNAUTHORIZED || 'false') === 'true';
const SMTP_PROXY = process.env.SMTP_PROXY || '';

const REPORT_TYPES = {
  'unfair-trade': '거래업체 특혜 등 불공정한 업무처리',
  'bribery': '부당한 요구 및 금전·향응 수수 행위',
  'info-leak': '회사정보 및 인력 유출 행위',
  'subcontract': '하도급법 위반 등 거래 관련 불공정 행위',
  'human-rights': '인권침해 행위 (차별, 폭언, 괴롭힘, 부당한 처우 등)',
  'security': '보안조치 관련 의견 및 불만 (정보보호, 개인정보, 접근권한 등)',
  'etc': '기타 부정·비리 행위 및 윤리경영 위반사항',
};

/* ---------- DB ---------- */
fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new Database(path.join(DATA_DIR, 'reports.db'));
db.pragma('journal_mode = WAL');
db.exec(`
  CREATE TABLE IF NOT EXISTS reports (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at  TEXT NOT NULL,
    type        TEXT,
    type_label  TEXT,
    anonymous   INTEGER NOT NULL DEFAULT 0,
    name        TEXT,
    contact     TEXT,
    email       TEXT,
    message     TEXT NOT NULL,
    ip          TEXT
  );
`);
const insertReport = db.prepare(`
  INSERT INTO reports (created_at, type, type_label, anonymous, name, contact, email, message, ip)
  VALUES (@created_at, @type, @type_label, @anonymous, @name, @contact, @email, @message, @ip)
`);

/* ---------- SMTP transporter (선택적 메일 발송용) ---------- */
let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;
  const opts = {
    host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_SECURE,
    ignoreTLS: SMTP_IGNORE_TLS, requireTLS: false,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
    tls: { rejectUnauthorized: SMTP_TLS_REJECT_UNAUTHORIZED },
    connectionTimeout: 15000, greetingTimeout: 10000, socketTimeout: 20000,
  };
  if (SMTP_PROXY) opts.proxy = SMTP_PROXY;
  transporter = nodemailer.createTransport(opts);
  if (SMTP_PROXY && SMTP_PROXY.startsWith('socks')) {
    try { transporter.set('proxy_socks_module', require('socks')); }
    catch (e) { console.error('[smtp] SOCKS 프록시를 쓰려면 `npm i socks` 가 필요합니다.'); }
  }
  return transporter;
}

// 메일 발송 (best-effort, 실패해도 제보 저장에는 영향 없음)
async function sendReportMail(r) {
  const tx = getTransporter();
  if (!tx) { console.warn('[mail] SMTP 미설정 — 메일 생략'); return; }
  const subject = `[윤리경영 제보] ${r.type_label}${r.anonymous ? ' (익명)' : ` - ${r.name}`}`;
  const text = [
    '㈜캠스 윤리경영 제보가 접수되었습니다.', '',
    `■ 제보 유형 : ${r.type_label}`,
    `■ 익명 여부 : ${r.anonymous ? '익명 제보' : '실명 제보'}`,
    `■ 성명     : ${r.anonymous ? '(익명)' : r.name}`,
    `■ 연락처   : ${r.anonymous ? '-' : (r.contact || '-')}`,
    `■ 이메일   : ${r.anonymous ? '-' : r.email}`,
    `■ 접수일시 : ${r.created_at}`, '',
    '■ 제보 내용', '----------------------------------------', r.message,
    '----------------------------------------',
  ].join('\n');
  const opts = { from: `"㈜캠스 윤리경영 제보" <${REPORT_FROM}>`, to: REPORT_TO, subject, text };
  if (!r.anonymous && r.email) opts.replyTo = r.email;
  await tx.sendMail(opts);
  console.log('[mail] ✅ 알림 메일 발송 →', REPORT_TO);
}

/* ---------- 유틸 ---------- */
function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function fmtKST(iso) {
  try {
    return new Date(iso).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul', hour12: false });
  } catch (_) { return iso; }
}

/* ---------- 제보 접수 API ---------- */
app.use('/api', express.json({ limit: '64kb' }));

app.post('/api/report', async (req, res) => {
  console.log(`[report] 📨 접수 요청 수신 (${req.ip})`);
  try {
    const body = req.body || {};
    if (body.website) { // 허니팟
      console.log('[report] 허니팟 감지 — 무시');
      return res.json({ ok: true });
    }

    const anonymous = body.anonymous === true || body.anonymous === 'true';
    const name = String(body.name || '').trim();
    const contact = String(body.contact || '').trim();
    const email = String(body.email || '').trim();
    const type = String(body.type || '').trim();
    const message = String(body.message || '').trim();

    if (!message || message.length < 5) {
      return res.status(400).json({ ok: false, error: '제보 내용을 입력해 주세요.' });
    }
    if (message.length > 10000) {
      return res.status(400).json({ ok: false, error: '제보 내용이 너무 깁니다.' });
    }
    if (!anonymous) {
      if (!name) return res.status(400).json({ ok: false, error: '성명을 입력해 주세요.' });
      if (!email) return res.status(400).json({ ok: false, error: '이메일을 입력해 주세요.' });
    }

    const row = {
      created_at: new Date().toISOString(),
      type,
      type_label: REPORT_TYPES[type] || (type ? type : '미지정'),
      anonymous: anonymous ? 1 : 0,
      // 익명 제보는 신원 정보를 저장하지 않음
      name: anonymous ? '' : name,
      contact: anonymous ? '' : contact,
      email: anonymous ? '' : email,
      message,
      ip: req.ip || '',
    };

    const info = insertReport.run(row);
    console.log(`[report] ✅ 저장 완료 #${info.lastInsertRowid} (유형:${row.type_label}, ${anonymous ? '익명' : name})`);

    // 선택적 메일 알림 (응답을 막지 않도록 비동기 best-effort)
    if (MAIL_ON_REPORT) {
      sendReportMail({ ...row, anonymous }).catch(err =>
        console.error('[mail] ❌ 발송 실패:', err && err.code, err && err.message));
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error('[report] ❌ 저장 실패:', err);
    return res.status(500).json({ ok: false, error: '제보 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' });
  }
});

/* ---------- 관리자 (Basic 인증) ---------- */
function timingEqual(a, b) {
  const ab = Buffer.from(String(a)); const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}
function adminAuth(req, res, next) {
  if (!ADMIN_USER || !ADMIN_PASS) {
    return res.status(503).send('<meta charset="utf-8">관리자 계정이 설정되지 않았습니다. 서버 환경변수 ADMIN_USER / ADMIN_PASS 를 설정하세요.');
  }
  const m = (req.headers.authorization || '').match(/^Basic (.+)$/);
  if (m) {
    const idx = Buffer.from(m[1], 'base64').toString();
    const sep = idx.indexOf(':');
    const u = idx.slice(0, sep), p = idx.slice(sep + 1);
    if (timingEqual(u, ADMIN_USER) && timingEqual(p, ADMIN_PASS)) return next();
  }
  res.set('WWW-Authenticate', 'Basic realm="CAMS Admin", charset="UTF-8"');
  return res.status(401).send('<meta charset="utf-8">인증이 필요합니다.');
}

function renderAdmin(rows) {
  const trs = rows.map(r => `
    <tr>
      <td class="num">${r.id}</td>
      <td class="nowrap">${escapeHtml(fmtKST(r.created_at))}</td>
      <td>${escapeHtml(r.type_label)}</td>
      <td>${r.anonymous ? '<span class="tag anon">익명</span>' : '실명'}</td>
      <td>${r.anonymous ? '-' : escapeHtml(r.name || '-')}</td>
      <td>${r.anonymous ? '-' : escapeHtml(r.contact || '-')}</td>
      <td>${r.anonymous ? '-' : escapeHtml(r.email || '-')}</td>
      <td class="msg">${escapeHtml(r.message)}</td>
    </tr>`).join('');
  return `<!DOCTYPE html><html lang="ko"><head>
    <meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="robots" content="noindex,nofollow">
    <title>제보 관리 | ㈜캠스</title>
    <style>
      *{box-sizing:border-box} body{font-family:-apple-system,'Pretendard',sans-serif;margin:0;background:#f4f5f7;color:#1a1a1a}
      header{background:#111;color:#fff;padding:16px 24px;display:flex;justify-content:space-between;align-items:center}
      header h1{font-size:18px;margin:0} header .meta{font-size:13px;color:#aaa}
      header a{color:#7fb3ff;font-size:13px;text-decoration:none;margin-left:14px}
      .wrap{padding:20px;overflow-x:auto}
      table{border-collapse:collapse;width:100%;background:#fff;font-size:13px;box-shadow:0 1px 3px rgba(0,0,0,.08);border-radius:8px;overflow:hidden}
      th,td{padding:10px 12px;border-bottom:1px solid #eee;text-align:left;vertical-align:top}
      th{background:#fafafa;font-weight:600;white-space:nowrap;position:sticky;top:0}
      td.num{color:#999} td.nowrap{white-space:nowrap}
      td.msg{white-space:pre-wrap;min-width:280px;max-width:520px}
      tr:hover{background:#fbfdff}
      .tag{display:inline-block;padding:1px 8px;border-radius:10px;font-size:11px}
      .tag.anon{background:#ffe9e9;color:#c5282d}
      .empty{padding:60px;text-align:center;color:#888}
    </style></head><body>
    <header>
      <h1>윤리경영 제보 관리</h1>
      <div class="meta">총 ${rows.length}건${rows.length >= 1000 ? ' (최근 1000건)' : ''}
        <a href="/admin/export.csv">CSV 내려받기</a>
      </div>
    </header>
    <div class="wrap">
      ${rows.length ? `<table>
        <thead><tr><th>#</th><th>접수일시(KST)</th><th>유형</th><th>구분</th><th>성명</th><th>연락처</th><th>이메일</th><th>제보 내용</th></tr></thead>
        <tbody>${trs}</tbody></table>` : '<div class="empty">접수된 제보가 없습니다.</div>'}
    </div></body></html>`;
}

app.get('/admin', adminAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM reports ORDER BY id DESC LIMIT 1000').all();
  res.set('Cache-Control', 'no-store');
  res.send(renderAdmin(rows));
});

app.get('/admin/export.csv', adminAuth, (req, res) => {
  const rows = db.prepare('SELECT * FROM reports ORDER BY id DESC').all();
  const cols = ['id', 'created_at', 'type_label', 'anonymous', 'name', 'contact', 'email', 'message', 'ip'];
  const esc = v => `"${String(v == null ? '' : v).replace(/"/g, '""')}"`;
  const csv = [cols.join(',')]
    .concat(rows.map(r => cols.map(c => esc(c === 'anonymous' ? (r[c] ? '익명' : '실명') : r[c])).join(',')))
    .join('\r\n');
  res.set('Cache-Control', 'no-store');
  res.set('Content-Type', 'text/csv; charset=utf-8');
  res.set('Content-Disposition', 'attachment; filename="cams-reports.csv"');
  res.send('﻿' + csv); // BOM (엑셀 한글 깨짐 방지)
});

/* ---------- 정적 파일 서빙 (cleanUrls, trailingSlash=false) ---------- */
app.use('/assets', express.static(path.join(ROOT, 'assets'), {
  setHeaders: (res) => { res.set('Cache-Control', 'no-cache'); },
}));

app.get(/^\/[^.]*$/, (req, res, next) => {
  if (req.path === '/') return res.sendFile(path.join(ROOT, 'index.html'));
  const candidate = path.join(ROOT, decodeURIComponent(req.path) + '.html');
  if (candidate.startsWith(ROOT) && fs.existsSync(candidate)) {
    res.set('Cache-Control', 'no-cache');
    return res.sendFile(candidate);
  }
  return next();
});

app.use(express.static(ROOT, {
  extensions: ['html'],
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) res.set('Cache-Control', 'no-cache');
  },
}));

app.use((req, res) => { res.status(404).sendFile(path.join(ROOT, 'index.html')); });

app.listen(PORT, '0.0.0.0', () => {
  console.log(`㈜캠스 website running on http://0.0.0.0:${PORT}`);
  console.log(`🗄️  제보 DB: ${path.join(DATA_DIR, 'reports.db')}`);
  console.log(`🔐 관리자 리포트: /admin  (${ADMIN_USER && ADMIN_PASS ? '계정 설정됨' : '⚠️ ADMIN_USER/ADMIN_PASS 미설정'})`);
  if (MAIL_ON_REPORT) console.log(`✉️  제보 시 메일 알림: 켜짐 → ${REPORT_TO}`);
});
