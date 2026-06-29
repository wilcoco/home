/* ============================================
   SMTP 진단 스크립트
   사용법:
     1) .env 에 SMTP 값을 채운 뒤
     2) node smtp-test.js              (연결+인증만 검사)
        node smtp-test.js you@addr.com (해당 주소로 테스트 메일 발송까지)
   ============================================ */

const nodemailer = require('nodemailer');
try { require('dotenv').config(); } catch (_) { /* dotenv 없으면 무시 */ }

const {
  SMTP_HOST, SMTP_PORT = '587', SMTP_SECURE = 'false',
  SMTP_USER, SMTP_PASS,
  SMTP_IGNORE_TLS = 'false', SMTP_TLS_REJECT_UNAUTHORIZED = 'false',
  REPORT_TO = 'json@icams.co.kr', REPORT_FROM,
} = process.env;

const to = process.argv[2] || REPORT_TO;

console.log('=== SMTP 설정 확인 ===');
console.log('  HOST :', SMTP_HOST || '(미설정 ❌)');
console.log('  PORT :', SMTP_PORT);
console.log('  SECURE(SSL):', SMTP_SECURE);
console.log('  IGNORE_TLS :', SMTP_IGNORE_TLS);
console.log('  USER :', SMTP_USER || '(미설정 ❌)');
console.log('  PASS :', SMTP_PASS ? '설정됨 ('+SMTP_PASS.length+'자)' : '(미설정 ❌)');
console.log('  FROM :', REPORT_FROM || SMTP_USER);
console.log('  TO   :', to);
console.log('');

if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
  console.error('❌ SMTP_HOST / SMTP_USER / SMTP_PASS 중 빠진 값이 있습니다. .env 를 확인하세요.');
  process.exit(1);
}

const tx = nodemailer.createTransport({
  host: SMTP_HOST,
  port: parseInt(SMTP_PORT, 10),
  secure: SMTP_SECURE === 'true',
  ignoreTLS: SMTP_IGNORE_TLS === 'true',
  requireTLS: false,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
  tls: { rejectUnauthorized: SMTP_TLS_REJECT_UNAUTHORIZED === 'true' },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  logger: true,   // SMTP 대화 로그 출력
  debug: true,
});

function diagnose(err) {
  console.error('\n❌ 실패:', err.message);
  if (err.code) console.error('   code     :', err.code);
  if (err.command) console.error('   command  :', err.command);
  if (err.response) console.error('   response :', err.response);
  console.error('\n--- 해석 ---');
  switch (err.code) {
    case 'ECONNREFUSED':
      console.error('연결 거부됨 → 서버는 떴지만 해당 포트가 막혀 있거나 방화벽 차단.');
      break;
    case 'ETIMEDOUT':
    case 'ESOCKET':
      console.error('연결 시간초과/소켓오류 → 외부에서 gw.icams.co.kr:'+SMTP_PORT+' 도달 불가(방화벽/사내망 전용) 또는 TLS 협상 실패. SMTP_IGNORE_TLS=true 를 시도해보세요.');
      break;
    case 'EDNS':
    case 'ENOTFOUND':
      console.error('호스트를 찾을 수 없음 → SMTP_HOST 오타이거나 DNS에서 해석 불가.');
      break;
    case 'EAUTH':
      console.error('인증 실패 → 아이디(전체주소 json@icams.co.kr)/비밀번호 확인. XMail은 전체 이메일 주소를 아이디로 사용.');
      break;
    default:
      console.error('위 response 코드를 확인하세요. (예: 550 Not SMTP Auth = 인증 누락)');
  }
}

(async () => {
  try {
    console.log('① 연결 + 인증 검사 (verify)...');
    await tx.verify();
    console.log('✅ 연결 및 인증 성공!\n');
  } catch (err) {
    diagnose(err);
    process.exit(2);
  }

  try {
    console.log('② 테스트 메일 발송 → ' + to + ' ...');
    const info = await tx.sendMail({
      from: '"㈜캠스 SMTP 진단" <' + (REPORT_FROM || SMTP_USER) + '>',
      to,
      subject: '[SMTP 진단] 테스트 메일',
      text: 'SMTP 설정이 정상 동작합니다. 이 메일이 보이면 발송 경로 OK입니다.',
    });
    console.log('✅ 발송 성공! messageId =', info.messageId);
    console.log('   accepted :', info.accepted);
    console.log('   rejected :', info.rejected);
    console.log('\n메일이 도착하지 않으면 스팸함 또는 메일서버 측 수신 필터를 확인하세요.');
  } catch (err) {
    diagnose(err);
    process.exit(3);
  }
})();
