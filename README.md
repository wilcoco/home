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

## 윤리경영 제보 (DB 저장 + 관리자 리포트)

홈페이지 하단 제보 폼(`/#contact`)은 `POST /api/report`로 접수되어 **SQLite DB에 저장**됩니다.
관리자는 **`/admin`** 페이지에서 아이디/비번으로 로그인해 제보 목록을 조회·CSV 내려받기 할 수 있습니다.

### 필수 환경변수

| 환경변수 | 설명 | 기본값 |
| --- | --- | --- |
| `ADMIN_USER` | 관리자 리포트(`/admin`) 로그인 아이디 | (필수) |
| `ADMIN_PASS` | 관리자 리포트 로그인 비밀번호 | (필수) |
| `DATA_DIR` | DB 저장 폴더 (Railway 볼륨 경로) | `./data` |

> `ADMIN_USER`/`ADMIN_PASS` 미설정 시 `/admin` 은 503 으로 막힙니다.

### Railway 영구 저장 (중요)

Railway는 컨테이너 파일시스템이 **휘발성**이라, 재배포 시 DB가 사라집니다.
영구 보관하려면 **볼륨(Volume)** 을 붙여야 합니다.

1. Railway 서비스 → **Volumes** → 새 볼륨 생성, **마운트 경로 `/data`**
2. 서비스 **Variables** 에 `DATA_DIR=/data`, `ADMIN_USER`, `ADMIN_PASS` 추가
3. 재배포 → 이후 제보는 `/data/reports.db` 에 영구 저장

### (선택) 메일 알림도 함께

메일서버 접속이 가능해지면, 제보 접수 시 메일 알림도 보낼 수 있습니다.
`MAIL_ON_REPORT=true` + SMTP 관련 변수(`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` 등, `.env.example` 참고)를
설정하세요. 기본은 꺼짐(DB 저장만).

제보 폼은 제보 유형 선택, **익명 접수**(신원 미저장) 옵션, 봇 차단 허니팟을 지원하며,
신원 기밀 보장·보복 금지·이의 제기 절차 안내를 함께 제공합니다.

## Railway 배포

이 프로젝트는 Railway에 자동으로 배포됩니다.

1. Railway에서 `New Project` → `Deploy from GitHub repo` 선택
2. 이 레포지토리(`wilcoco/home`) 연결
3. Railway가 자동으로 `package.json`을 인식하고 `npm start` (`node server.js`) 실행
4. `PORT` 환경변수는 Railway가 자동으로 주입
5. **볼륨(`/data`) + 환경변수(`DATA_DIR`, `ADMIN_USER`, `ADMIN_PASS`)** 설정

배포 설정은 `railway.toml`에 정의되어 있습니다.

## 기술 스택

- 프론트엔드: 정적 HTML / CSS / JavaScript (프레임워크 없음)
- 백엔드: Node.js + Express (정적 서빙 + 제보 API + 관리자 리포트)
- 저장소: SQLite (better-sqlite3)
- 메일 발송(선택): Nodemailer (SMTP)
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
