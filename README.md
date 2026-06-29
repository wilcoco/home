# ㈜캠스 (CAMS Korea) Website

> Creative Automotive Module System

자동차 모듈 시스템 전문 기업 ㈜캠스의 공식 홈페이지입니다.

## 페이지 구성

| 경로 | 페이지 |
| --- | --- |
| `/` | 회사 소개 (Home) |
| `/products.html` | 생산 제품 |
| `/esg.html` | ESG 경영 |
| `/environment.html` | Environment |
| `/social.html` | Social |
| `/governance.html` | Governance |
| `/company-info.html` | 회사 정보 (재무현황) |
| `/shop.html` | 온라인 몰 |
| `/bidding.html` | 공사 입찰 |

## 로컬 개발

```bash
npm install
npm run dev
# http://localhost:3000
```

## 윤리경영 제보 메일 발송 (SMTP)

홈페이지 하단 윤리경영 제보 폼(`/#contact`)은 `POST /api/report`로 접수되어
SMTP를 통해 **json@icams.co.kr** 로 메일이 발송됩니다.

발송을 활성화하려면 아래 환경변수를 설정해야 합니다 (`.env.example` 참고).
미설정 시 폼은 동작하지만 "메일 시스템 미설정" 안내가 표시됩니다.

| 환경변수 | 설명 | 기본값 |
| --- | --- | --- |
| `SMTP_HOST` | SMTP 서버 호스트 (자체서버: `gw.icams.co.kr`) | (필수) |
| `SMTP_PORT` | SMTP 포트 | `587` |
| `SMTP_SECURE` | SSL(465) 사용 여부 | `false` |
| `SMTP_USER` | SMTP 사용자 (전체 이메일 주소) | (필수) |
| `SMTP_PASS` | SMTP 비밀번호 | (필수) |
| `SMTP_IGNORE_TLS` | STARTTLS 미지원 서버(XMail 등)면 `true` | `false` |
| `SMTP_TLS_REJECT_UNAUTHORIZED` | 자체서명 인증서 검증, 정식 인증서면 `true` | `false` |
| `REPORT_TO` | 제보 수신 주소 | `json@icams.co.kr` |
| `REPORT_FROM` | 발신 주소 | `SMTP_USER` |

> **자체 메일서버(XMail) 사용 시:** `SMTP_HOST=gw.icams.co.kr`, `SMTP_PORT=587`,
> `SMTP_SECURE=false`, `SMTP_USER=json@icams.co.kr`(전체 주소), SMTP 인증 필수.
> 발신지(Railway) 서버에서 `gw.icams.co.kr:587` 로 접속이 가능해야 하며,
> 메일서버 방화벽/접근제어에서 해당 접속을 허용해야 합니다.

### 고정 IP로 메일서버 방화벽 통과 (Railway)

회사 메일서버가 외부/클라우드 IP의 SMTP 접속을 차단하는 경우, 발신지 IP를 고정해
방화벽에 허용해야 합니다.

1. Railway 서비스 설정에서 **Static Outbound IPs** 를 활성화 → 고정 출발지 IP 발급
2. 발급된 IP를 메일서버 관리자에게 전달 → 방화벽에서 `587` 포트 허용
   (그루웨어 관리자 메뉴 **웹메일 접근 IP 관리**가 SMTP에도 적용되면 거기도 허용)
3. 별도 코드 변경 불필요 — 앱은 기존처럼 직접 연결하되 고정 IP로 나갑니다.

> 다른 호스팅을 쓰거나 네이티브 고정 IP가 없을 때만, `SMTP_PROXY=socks5://...`
> 환경변수로 SOCKS 프록시 경유가 가능합니다 (`npm i socks` 필요).

로컬 개발 시 `.env.example`을 `.env`로 복사해 값을 채우면 됩니다.
(`.env`는 `.gitignore`에 포함되어 커밋되지 않습니다.)

제보 폼은 제보 유형 선택, **익명 접수** 옵션, 봇 차단용 허니팟을 지원하며,
신원 기밀 보장·보복 금지·이의 제기 절차 안내를 함께 제공합니다.

## Railway 배포

이 프로젝트는 Railway에 자동으로 배포됩니다.

1. Railway에서 `New Project` → `Deploy from GitHub repo` 선택
2. 이 레포지토리(`wilcoco/home`) 연결
3. Railway가 자동으로 `package.json`을 인식하고 `npm start` (`node server.js`) 실행
4. `PORT` 환경변수는 Railway가 자동으로 주입
5. **SMTP 환경변수**(위 표 참고)를 Railway 프로젝트 Variables에 등록

배포 설정은 `railway.toml`에 정의되어 있습니다.

## 기술 스택

- 프론트엔드: 정적 HTML / CSS / JavaScript (프레임워크 없음)
- 백엔드: Node.js + Express (정적 서빙 + 제보 메일 API)
- 메일 발송: Nodemailer (SMTP)
- 폰트: Pretendard (한글), Bricolage Grotesque + Manrope (영문)
- 실행 환경: Node 18+

## 디렉터리 구조

```
.
├── index.html              # 회사 소개 (메인)
├── products.html           # 생산 제품
├── esg.html                # ESG 경영
├── environment.html        # Environment
├── social.html             # Social
├── governance.html         # Governance
├── company-info.html       # 회사 정보
├── shop.html               # 온라인 몰
├── bidding.html            # 공사 입찰
├── assets/
│   ├── style.css           # 공통 스타일
│   └── main.js             # 공통 스크립트
├── server.js               # Express 서버 (정적 서빙 + 제보 메일 API)
├── .env.example            # SMTP 환경변수 예시
├── package.json
├── railway.toml
└── README.md
```
