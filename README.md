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
npm run dev
# http://localhost:3000
```

## Railway 배포

이 프로젝트는 Railway에 자동으로 배포됩니다.

1. Railway에서 `New Project` → `Deploy from GitHub repo` 선택
2. 이 레포지토리(`wilcoco/home`) 연결
3. Railway가 자동으로 `package.json`을 인식하고 `npm start` 실행
4. `PORT` 환경변수는 Railway가 자동으로 주입

배포 설정은 `railway.toml`에 정의되어 있습니다.

## 기술 스택

- 정적 HTML / CSS / JavaScript (프레임워크 없음)
- 폰트: Pretendard (한글), Bricolage Grotesque + Manrope (영문)
- 배포: `serve` (Node 18+)

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
├── package.json
├── railway.toml
└── README.md
```
