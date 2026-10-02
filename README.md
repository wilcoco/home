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

## ESG 환경 공시 데이터 갱신 (연 1회)

`environment.html` 의 환경 실적 표는 손으로 고치지 않고 빌드 스크립트로 생성합니다.
표는 항상 **최근 3개년 + 목표 + 목표 대비**로 열 수가 고정되어, 해가 바뀌어도 열이 늘어나지 않습니다.
결과물이 정적 HTML 이라 자바스크립트 없이 검색엔진·스크린리더에 그대로 노출됩니다.

```bash
# 1) content/esg.json 의 연도별 수치를 갱신 (원천: 환경배출·자원관리 워크북)
# 2) 표 재생성
py -3 tools/build_esg.py
# 3) 변경된 environment.html 을 커밋
```

표준 라이브러리만 쓰므로 별도 설치가 필요 없습니다 (Python 3.8+). macOS/Linux 는 `python3 tools/build_esg.py`.
스크립트는 멱등이라 같은 JSON 으로 몇 번을 돌려도 결과가 바이트 단위로 같습니다 — 빌드 후 `git diff` 가
비어 있으면 페이지가 JSON 과 일치한다는 뜻입니다.

`environment.html` 안의 `<!-- ESG:*:START -->` ~ `<!-- ESG:*:END -->` 구간이 생성 대상입니다.
이 주석을 지우면 빌드가 실패하니 그대로 두세요. 마커 밖의 본문·이미지는 직접 수정해도 됩니다.

**수치의 원천(워크북 시트·셀), 총 에너지 소비량 산출식, 목표 계산 규칙은
[`content/README.md`](content/README.md) 에 정리되어 있습니다.**

| 블록 | 내용 |
|---|---|
| `ESG:ENERGY` | 총 에너지 소비 실적 (SASB TR-AP-130a.1) |
| `ESG:GHG` | 온실가스 배출량 · 에너지 사용량 |
| `ESG:AIR` | 대기오염물질 배출량 |
| `ESG:WATER` | 용수 사용량 · 폐수 위탁처리량 |
| `ESG:WASTE` | 폐기물 발생 및 처리 실적 (SASB TR-AP-150a.1) |
| `ESG:MATERIAL` | 원부자재 사용량 |
| `ESG:CIRCULARITY` | 재활용 실적 · 자원순환 성과 |

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
