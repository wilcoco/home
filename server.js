/* ============================================
   ㈜캠스 (CAMS Korea) - Web Server
   - 정적 파일 서빙 (cleanUrls)
   - 윤리경영 제보 접수 API (POST /api/report) → SMTP 메일 발송
   ============================================ */

const path = require('path');
const fs = require('fs');
const express = require('express');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

/* ---------- 설정 (환경변수) ---------- */
const REPORT_TO = process.env.REPORT_TO || 'json@icams.co.kr';
const REPORT_FROM = process.env.REPORT_FROM || process.env.SMTP_USER || 'no-reply@cams-korea.com';
const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_SECURE = String(process.env.SMTP_SECURE || 'false') === 'true';
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;

const REPORT_TYPES = {
  'unfair-trade': '거래업체 특혜 등 불공정한 업무처리',
  'bribery': '부당한 요구 및 금전·향응 수수 행위',
  'info-leak': '회사정보 및 인력 유출 행위',
  'subcontract': '하도급법 위반 등 거래 관련 불공정 행위',
  'human-rights': '인권침해 행위 (차별, 폭언, 괴롭힘, 부당한 처우 등)',
  'security': '보안조치 관련 의견 및 불만 (정보보호, 개인정보, 접근권한 등)',
  'etc': '기타 부정·비리 행위 및 윤리경영 위반사항',
};

/* ---------- SMTP transporter ---------- */
let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null; // 미설정 시 null → 호출부에서 503 처리
  }
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

/* ---------- 유틸 ---------- */
function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ---------- 제보 접수 API ---------- */
app.use('/api', express.json({ limit: '64kb' }));

app.post('/api/report', async (req, res) => {
  try {
    const body = req.body || {};

    // 허니팟(봇 차단): 보이지 않는 필드가 채워지면 무시
    if (body.website) {
      return res.json({ ok: true });
    }

    const anonymous = body.anonymous === true || body.anonymous === 'true';
    const name = String(body.name || '').trim();
    const contact = String(body.contact || '').trim();
    const email = String(body.email || '').trim();
    const type = String(body.type || '').trim();
    const message = String(body.message || '').trim();

    // 검증
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

    const typeLabel = REPORT_TYPES[type] || (type ? type : '미지정');

    const tx = getTransporter();
    if (!tx) {
      console.error('[report] SMTP 미설정 — 메일 발송 불가');
      return res.status(503).json({ ok: false, error: '현재 제보 접수 메일 시스템이 설정되지 않았습니다. 관리자에게 문의해 주세요.' });
    }

    const submittedAt = new Date().toISOString();
    const subject = `[윤리경영 제보] ${typeLabel}${anonymous ? ' (익명)' : ` - ${name}`}`;

    const textBody = [
      '㈜캠스 윤리경영 제보가 접수되었습니다.',
      '',
      `■ 제보 유형 : ${typeLabel}`,
      `■ 익명 여부 : ${anonymous ? '익명 제보' : '실명 제보'}`,
      `■ 성명     : ${anonymous ? '(익명)' : name}`,
      `■ 연락처   : ${anonymous ? '-' : (contact || '-')}`,
      `■ 이메일   : ${anonymous ? '-' : email}`,
      `■ 접수일시 : ${submittedAt}`,
      '',
      '■ 제보 내용',
      '----------------------------------------',
      message,
      '----------------------------------------',
    ].join('\n');

    const htmlBody = `
      <div style="font-family:'Pretendard',sans-serif;line-height:1.7;color:#111;">
        <h2 style="margin:0 0 16px;">㈜캠스 윤리경영 제보 접수</h2>
        <table style="border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:4px 12px 4px 0;color:#666;">제보 유형</td><td>${escapeHtml(typeLabel)}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666;">익명 여부</td><td>${anonymous ? '익명 제보' : '실명 제보'}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666;">성명</td><td>${anonymous ? '(익명)' : escapeHtml(name)}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666;">연락처</td><td>${anonymous ? '-' : escapeHtml(contact || '-')}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666;">이메일</td><td>${anonymous ? '-' : escapeHtml(email)}</td></tr>
          <tr><td style="padding:4px 12px 4px 0;color:#666;">접수일시</td><td>${escapeHtml(submittedAt)}</td></tr>
        </table>
        <h3 style="margin:20px 0 8px;">제보 내용</h3>
        <div style="white-space:pre-wrap;border:1px solid #eee;border-radius:8px;padding:14px;background:#fafafa;font-size:14px;">${escapeHtml(message)}</div>
      </div>`;

    const mailOptions = {
      from: `"㈜캠스 윤리경영 제보" <${REPORT_FROM}>`,
      to: REPORT_TO,
      subject,
      text: textBody,
      html: htmlBody,
    };
    // 실명 + 이메일이 있으면 회신 가능하도록 replyTo 설정
    if (!anonymous && email) {
      mailOptions.replyTo = email;
    }

    await tx.sendMail(mailOptions);
    return res.json({ ok: true });
  } catch (err) {
    console.error('[report] 발송 실패:', err);
    return res.status(500).json({ ok: false, error: '제보 접수 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' });
  }
});

/* ---------- 정적 파일 서빙 (cleanUrls, trailingSlash=false) ---------- */
// /assets 는 장기 캐시
app.use('/assets', express.static(path.join(ROOT, 'assets'), {
  maxAge: '1d',
}));

// cleanUrls: "/products" → "products.html"
app.get(/^\/[^.]*$/, (req, res, next) => {
  if (req.path === '/') {
    return res.sendFile(path.join(ROOT, 'index.html'));
  }
  const candidate = path.join(ROOT, decodeURIComponent(req.path) + '.html');
  if (candidate.startsWith(ROOT) && fs.existsSync(candidate)) {
    res.set('Cache-Control', 'no-cache');
    return res.sendFile(candidate);
  }
  return next();
});

// 그 외 정적 파일 (직접 .html 접근 포함)
app.use(express.static(ROOT, {
  extensions: ['html'],
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.set('Cache-Control', 'no-cache');
    }
  },
}));

// 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(ROOT, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`㈜캠스 website running on http://0.0.0.0:${PORT}`);
  if (!getTransporter()) {
    console.warn('⚠️  SMTP 미설정: 제보 메일 발송이 비활성화되어 있습니다. (SMTP_HOST/SMTP_USER/SMTP_PASS 환경변수 필요)');
  } else {
    console.log(`✉️  제보 수신 메일: ${REPORT_TO}`);
  }
});
