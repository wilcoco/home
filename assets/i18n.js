/* ============================================================
   ㈜캠스 (CAMS Korea) — Lightweight i18n (KO ↔ EN)
   ------------------------------------------------------------
   - 한국어(원문)는 HTML 안에 그대로 두고, 영어는 이 사전으로 치환합니다.
     (JS가 없거나 검색엔진에는 한국어 원문이 그대로 노출됩니다.)
   - 한국 이외 지역(브라우저 언어가 한국어가 아님)에서는 자동으로 영어로 표시.
   - 헤더의 KO/EN 토글로 사용자가 직접 전환 가능(localStorage 저장).
   ------------------------------------------------------------
   동작 방식
   1) RICH : 인라인 태그(<span>/<strong>/<br>)가 섞여 어순 치환이 필요한
             요소는 요소 전체 innerHTML 을 통째로 교체.
   2) NODE : 그 외 일반 텍스트 노드는 정규화된 한국어 → 영어로 1:1 치환.
   ============================================================ */
(function () {
  'use strict';

  var KEY = 'cams_lang';
  var norm = function (s) { return (s || '').replace(/\s+/g, ' ').trim(); };

  /* ---------- 어순/인라인 태그가 섞인 요소 (innerHTML 교체) ---------- */
  /* key = 요소의 정규화된 textContent, value = 영어 innerHTML */
  var RICH = {
    // 홈 히어로
    '물리적 범퍼에서 데이터 기반 스마트 제조까지':
      'From physical <span class="accent-text">bumpers</span><br> to data-driven <span class="accent">smart manufacturing</span>',
    '㈜캠스는 정성껏 다듬어 온 자동차 모듈 부품의 헤리티지 위에, 제조업 정보화를 바탕으로 스마트 팩토리와 공정 자동화를 접목하여 차세대 모빌리티 제조의 새로운 기준을 만들어 갑니다.':
      'Building on our carefully refined heritage in automotive module parts, CAMS blends manufacturing digitalization with <strong>smart factories</strong> and <strong>process automation</strong> to set a new standard for next-generation mobility manufacturing.',
    '기아 · 현대자동차 · 현대모비스 · 현대글로비스의 신뢰받는 파트너로서, 글로벌 시장에서 함께 성장하고 있습니다.':
      'As a trusted partner of <strong>Kia · Hyundai Motor · Hyundai Mobis · Hyundai Glovis</strong>, we grow together in the global market.',
    // 홈 섹션 타이틀
    '현장과 브랜드': 'The Floor &amp; the <span style="color: var(--accent);">Brand</span>',
    '㈜캠스 홍보영상': 'CAMS <span style="color: var(--accent);">Corporate Film</span>',
    // 페이지 타이틀 (page-header h1)
    '생산 제품': 'Our <span class="accent">Products</span>',
    '회사 정보': 'Company <span class="accent">Information</span>',
    '공사 입찰': 'Construction <span class="accent">Bidding</span>',
    '환경': '<span class="accent">Environment</span>',
    '사회': '<span class="accent">Social</span>',
    '지배구조': '<span class="accent">Governance</span>',
    // 회사정보 섹션 타이틀
    '주요 재무 지표': 'Key Financial <span style="color: var(--accent);">Indicators</span>',
    '손익 현황 3개년 추이': 'Income Statement <span style="color: var(--accent);">3-Year Trend</span>',
    '재무상태 3개년 추이': 'Balance Sheet <span style="color: var(--accent);">3-Year Trend</span>',
    '주요 재무 비율': 'Key Financial <span style="color: var(--accent);">Ratios</span>',
    // 윤리경영 제보 안내문 (공통, <br> 포함)
    '㈜캠스는 윤리적이고 투명한 기업문화를 정착시키기 위해 임직원과 이해관계자 여러분의 제보와 의견을 소중히 받고 있습니다. 윤리경영 전담자는 준법지원, 윤리경영·동반성장, 법무 및 내부감사 업무를 담당하며, 구성원들이 윤리경영을 적극적으로 실천할 수 있는 환경을 조성하기 위해 노력하고 있습니다.':
      'To establish an ethical and transparent corporate culture, CAMS values the reports and opinions of its employees and stakeholders.<br> The ethics-management team is responsible for compliance support, ethical management &amp; shared growth, legal affairs, and internal audit, and works to create an environment where members can actively practice ethical management.'
  };

  /* ---------- 일반 텍스트 노드 (1:1 치환) ---------- */
  var NODE = {
    /* 로고 / 헤더 / 네비 / 푸터 */
    '㈜캠스': 'CAMS',
    '회사 소개': 'About Us',
    '생산 제품': 'Products',
    'ESG 경영': 'ESG Management',
    '회사 정보': 'Company Info',
    '공사 입찰': 'Construction Bidding',
    '윤리경영 제보': 'Ethics Report',

    /* 홈 히어로 (일반 문단) */
    '부품 하나에 사람을 향한 마음과 데이터의 정밀함을 함께 담아, 더 안전하고 효율적인 모빌리티를 완성합니다.':
      'Into every part we put both care for people and the precision of data, completing safer and more efficient mobility.',

    /* 홈 생산 Process */
    '생산 Process': 'Production Process',
    '사출': 'Injection',
    '도장': 'Painting',
    '조립': 'Assembly',
    '사출기': 'Injection machine',
    '3,200톤 2대': '3,200 t × 2',
    '3,000톤 3대': '3,000 t × 3',
    '2,200톤 2대': '2,200 t × 2',
    '생산 능력': 'Capacity',
    '1,500,000 PCS / 년': '1,500,000 PCS / yr',
    '도장 설비': 'Painting line',
    '1개 라인': '1 line',
    '790,000 PCS / 년': '790,000 PCS / yr',
    '조립 설비': 'Assembly lines',
    '5 라인': '5 lines',
    '하남공장': 'Hanam plant',
    '4 라인': '4 lines',
    '함평공장': 'Hampyeong plant',
    '1 라인': '1 line',
    '범퍼 생산': 'Bumper output',
    '750,000 대 / 년': '750,000 units / yr',
    'C/PAD 생산': 'C/PAD output',
    '120,000 대 / 년': '120,000 units / yr',

    /* 홈 현장과 브랜드 / 모자이크 */
    '제조 현장의 사람과 자동화, 그리고 브랜드 디자인 시스템.':
      'The people and automation on the manufacturing floor, and the brand design system.',
    '사출 후 공정 로봇': 'Post-injection robot',
    '㈜캠스 공장 전경': 'CAMS plant view',
    '레이저 커팅 로봇': 'Laser-cutting robot',
    '대형 사출기 라인': 'Large injection line',
    '프라이머 도장': 'Primer coating',
    '클리어 코트': 'Clear coat',
    '사출 + 로봇 협업': 'Injection + robot collaboration',

    /* 홈 홍보영상 */
    '우리의 일터와 사람들, 그리고 만드는 모든 순간을 담았습니다 (5분 20초)':
      'A look at our workplace, our people, and every moment of making it (5 min 20 sec)',
    '🔹 윤리경영 제보 및 인권침해 신고': '🔹 Ethics Reporting & Human-Rights Complaints',
    '🔊 소리를 들으시려면 영상 컨트롤의 음소거를 해제해 주세요.':
      '🔊 Unmute the video controls to hear the sound.',

    /* 윤리경영 제보 섹션 (공통) */
    '제보 및 신고 대상': 'Scope of Reporting',
    '캠스는 다음과 같은 사항에 대하여 상담 및 제보를 접수합니다.':
      'CAMS accepts consultations and reports on the following matters.',
    '거래업체 특혜 등 불공정한 업무처리': 'Unfair business practices such as favoritism toward suppliers',
    '부당한 요구 및 금전·향응 수수 행위': 'Improper demands or acceptance of money or entertainment',
    '회사정보 및 인력 유출 행위': 'Leakage of company information or personnel',
    '하도급법 위반사항 등 거래 관련 불공정 행위': 'Unfair trade practices such as violations of the Subcontracting Act',
    '인권침해 행위 (차별, 폭언, 괴롭힘, 부당한 처우 등)':
      'Human-rights violations (discrimination, verbal abuse, harassment, unfair treatment, etc.)',
    '회사 보안조치에 관한 이해관계자 의견 및 불만 접수 (정보보호, 개인정보 관리, 시스템 접근권한 등과 관련된 개선 요청 포함)':
      'Stakeholder opinions and complaints regarding company security measures (including improvement requests on information protection, personal-data management, and system access rights)',
    '기타 부정·비리 행위 및 윤리경영 위반사항': 'Other misconduct, corruption, or violations of ethical management',
    '신고 채널 운영 원칙': 'Operating Principles of the Reporting Channel',
    '신원 기밀 보장': 'Confidentiality of Identity',
    '— 처리 전 과정에서 신고자의 신원을 기밀로 취급합니다.':
      '— The reporter’s identity is kept confidential throughout the entire process.',
    '보복 금지': 'No Retaliation',
    '— 제보·신고를 이유로 한 어떠한 보복·불이익 조치도 금지합니다.':
      '— Any retaliation or disadvantage on the grounds of reporting is strictly prohibited.',
    '익명 접수': 'Anonymous Submission',
    '— 신원 노출을 원치 않는 경우 익명으로 제보할 수 있습니다.':
      '— If you do not wish to reveal your identity, you may report anonymously.',
    '이의 제기 절차': 'Appeal Procedure',
    '— 처리 결과에 이의가 있는 경우 재검토를 요청할 수 있습니다.':
      '— If you object to the outcome, you may request a review.',
    '처리 절차 안내': 'Process Guide',
    '— 제보 → 접수 → 처리 → 통지의 단계로 진행됩니다.':
      '— The process runs as: Report → Receipt → Handling → Notification.',
    '제보자 보호': 'Protection of Reporters',
    '캠스는 제보자의 신원을 철저히 보호하며, 제보·신고·진술·자료 제공 등으로 인한 어떠한 불이익도 발생하지 않도록 보장합니다.':
      'CAMS thoroughly protects the identity of reporters and guarantees that no disadvantage results from reporting, testifying, or providing materials.',
    '모든 제보사항은 공정하고 신속하게 조사되며, 조사 결과는 제보자가 원하는 방식으로 회신드립니다. 다만, 사실관계가 불명확하거나 구체적 근거가 부족한 경우 조사가 제한될 수 있습니다.':
      'Every report is investigated fairly and promptly, and the results are shared in the manner the reporter prefers. However, an investigation may be limited when the facts are unclear or specific evidence is insufficient.',
    '개인정보 수집 및 이용 안내': 'Collection & Use of Personal Information',
    '입력하신 정보는 제보사항 확인 및 처리 목적으로만 사용됩니다.':
      'The information you enter is used only to verify and handle the report.',
    '수집항목: 성명, 연락처, 이메일 주소 (익명 제보 시 미수집)':
      'Items collected: name, contact, email address (not collected for anonymous reports)',
    '수집목적: 제보에 따른 민원처리 및 결과 회신': 'Purpose: handling the report and replying with the result',
    '보유기간: 위 목적 달성 시까지': 'Retention: until the above purpose is achieved',
    /* 제보 폼 */
    '제보 유형': 'Report Type',
    '유형을 선택해 주세요': 'Please select a type',
    '하도급법 위반 등 거래 관련 불공정 행위': 'Unfair trade practices such as violations of the Subcontracting Act',
    '인권침해 행위 (차별, 폭언, 괴롭힘 등)': 'Human-rights violations (discrimination, verbal abuse, harassment, etc.)',
    '보안조치 관련 의견 및 불만': 'Opinions and complaints on security measures',
    '기타 부정·비리 및 윤리경영 위반사항': 'Other misconduct, corruption, or ethics violations',
    '익명으로 제보합니다 (성명·연락처·이메일을 입력하지 않습니다)':
      'Report anonymously (name, contact, and email will not be entered)',
    '성명': 'Name',
    '연락처': 'Contact',
    '이메일': 'Email',
    '제보 내용': 'Report Details',
    '제보 접수': 'Submit Report',
    '제출이 완료되었습니다!': 'Your report has been submitted!',

    /* 생산 제품 페이지 */
    '과거 생산 제품': 'Past Products',

    /* 공사 입찰 페이지 */
    '공사 입찰 게시판은 더 이상 사용할 수 없습니다.': 'The construction-bidding board is no longer available.',
    '문의사항은 윤리경영 제보 페이지를 이용해 주시기 바랍니다.':
      'For inquiries, please use the ethics-reporting page.',

    /* Selfservice 리다이렉트 페이지 */
    'Selfservice 시스템으로 이동합니다': 'Redirecting to the Selfservice system',
    '잠시만 기다려 주세요. 자동으로 이동되지 않으면 아래 버튼을 클릭해 주세요.':
      'Please wait a moment. If you are not redirected automatically, click the button below.',
    'Selfservice 바로가기 →': 'Go to Selfservice →',
    '← ㈜캠스 홈으로 돌아가기': '← Back to CAMS home',

    /* 회사 정보 (기업 개요 / KPI / 표) */
    '㈜캠스의 기업 개요와 재무 현황을 한눈에 살펴보실 수 있습니다.':
      'See CAMS’s corporate overview and financial status at a glance.',
    '기업 개요': 'Company Overview',
    '설립일': 'Founded',
    '25년차 (자동차 차체용 부품 제조업)': '25th year (auto body-parts manufacturing)',
    '대표자': 'Representatives',
    '홍정수 / 김정은': 'Hong Jeong-su / Kim Jeong-eun',
    '각자 대표': 'Joint representatives',
    '기업 구분': 'Company Type',
    '중견기업': 'Mid-sized enterprise',
    '기업등급 양호': 'Good credit rating',
    '사원 수': 'Employees',
    '명': 'employees',
    '2026.04 기준': 'As of Apr 2026',
    '자본금': 'Capital',
    '억원': '×100M KRW',
    '2025.12 기준': 'As of Dec 2025',
    '매출액': 'Revenue',
    '2025년 · 전년 대비 +8%': 'FY2025 · +8% YoY',
    '소재지': 'Location',
    '광주광역시 광산구 안청동 735-5': '735-5 Ancheong-dong, Gwangsan-gu, Gwangju',
    '홈페이지: www.icams.co.kr': 'Website: www.icams.co.kr',
    '주요 사업': 'Core Business',
    '자동차 차체용 부품 제조 · 부동산 임대': 'Automotive body-parts manufacturing · Real-estate leasing',
    '기아·현대 차량 범퍼 및 크래시패드 사출/도장/조립':
      'Injection / painting / assembly of bumpers and crash pads for Kia·Hyundai vehicles',
    '영업이익': 'Operating Profit',
    '당기순이익': 'Net Income',
    '자산 합계': 'Total Assets',
    '자기자본 비율': 'Equity Ratio',
    '동종업계 순위': 'Industry Rank',
    '위': 'th',
    '전년 대비 적자전환': 'Turned to loss YoY',
    '흑자 전환': 'Turned to profit',
    '전년 23.01%': 'Prev. 23.01%',
    '2024 매출 기준': 'By 2024 revenue',
    '손익 계정 (단위: 백만원)': 'Income accounts (unit: KRW million)',
    '계정명': 'Account',
    '매출 총이익': 'Gross Profit',
    '법인세 차감 전 이익': 'Pre-tax Profit',
    '출처: NICE평가정보 · 잡코리아 (2025.12.31 기준)':
      'Source: NICE Information Service · JobKorea (as of 2025.12.31)',
    '자산 · 부채 · 자본 (단위: 백만원)': 'Assets · Liabilities · Equity (unit: KRW million)',
    '유동자산': 'Current Assets',
    '비유동자산': 'Non-current Assets',
    '유동부채': 'Current Liabilities',
    '비유동부채': 'Non-current Liabilities',
    '부채 합계': 'Total Liabilities',
    '자본 합계': 'Total Equity',
    '수익성 · 안정성 · 활동성 지표': 'Profitability · Stability · Activity Metrics',
    '지표': 'Metric',
    '매출액 순이익률': 'Net Profit Margin',
    '영업이익률': 'Operating Margin',
    'ROE (자기자본 이익률)': 'ROE (Return on Equity)',
    'ROIC (투하자본 이익률)': 'ROIC (Return on Invested Capital)',
    '부채 비율': 'Debt Ratio',
    '매출액 증가율': 'Revenue Growth',
    '총자산 증가율': 'Asset Growth',
    '출처: NICE평가정보 · 잡코리아 (2025.12.31 기준) · 본 자료는 외부 평가 데이터로, 이용 시 참고용으로만 활용하시기 바랍니다.':
      'Source: NICE Information Service · JobKorea (as of 2025.12.31) · This is external evaluation data; please use it for reference only.',

    /* ESG 공통 */
    '\'ESG\'란 기업의 비재무적 요소인 환경(Environment), 사회(Social), 지배구조(Governance)를 뜻하는 것으로, \'ESG 경영\'이란 장기적인 관점에서 친환경 및 사회적 책임경영과 투명경영을 통해 지속가능한 발전을 추구하는 것이라고 할 수 있습니다.':
      '‘ESG’ refers to a company’s non-financial factors — Environment, Social, and Governance. ‘ESG management’ means pursuing sustainable development from a long-term perspective through eco-friendly and socially responsible, transparent management.',
    '지속가능성 지표 공시': 'Sustainability Indicator Disclosure',
    '주식회사캠스는 기업의 사회적책임을 통한 지속가능한 발전을 추구하고 있으며, 이의 일환으로 지속가능성회계표준위원회(Sustainability Accounting Standards Board, SASB)의 규정을 준용하여 2023년 지속가능성 지표를 공시하고자 합니다.':
      'CAMS Co., Ltd. pursues sustainable development through corporate social responsibility and, as part of this effort, discloses its 2023 sustainability indicators in accordance with the standards of the Sustainability Accounting Standards Board (SASB).',
    'SASB 보고서 (2023)': 'SASB Report (2023)',
    'PDF · 지속가능성 지표': 'PDF · Sustainability indicators',
    '환경 세부 내용': 'Environment — details',
    '사회 세부 내용': 'Social — details',
    '지배구조 세부 내용': 'Governance — details',
    '주요 지표': 'Key Indicators',
    '주식회사 캠스는 차량의 범퍼 및 이의 구성 부품 등을 제조하여 기아, 현대자동차, 현대모비스, 현대글로비스 등 주요 고객에게 판매하는 사업을 영위하고 있습니다. SASB가 차량 부품 제조 부문에 권고하고 있는 공시 지표 결과는 아래와 같습니다.':
      'CAMS Co., Ltd. manufactures vehicle bumpers and their components and sells them to major customers such as Kia, Hyundai Motor, Hyundai Mobis, and Hyundai Glovis. The disclosure indicators recommended by SASB for the auto-parts manufacturing sector are shown below.',
    'Ⅰ. 지속가능성 지표': 'Ⅰ. Sustainability Indicators',
    'Ⅱ. 활동 지표': 'Ⅱ. Activity Indicators',
    '에너지 관리': 'Energy Management',
    '폐기물 관리': 'Waste Management',
    '제품 안전': 'Product Safety',
    '연비개선 설계': 'Fuel-efficiency Design',
    '원자재 효율성': 'Material Efficiency',
    '경쟁 행위': 'Competitive Behavior',
    '활동 지표': 'Activity Indicators',
    '세부 지표': 'Indicator',
    '지표 코드': 'Indicator Code',
    '총 전력 소비량 (기가쥴)': 'Total electricity consumption (GJ)',
    '전력 공급망을 통한 외부 조달 에너지 소비량 비율': 'Share of grid-supplied purchased energy',
    '재생에너지 소비량 비율': 'Share of renewable energy',
    '제조 과정 상 발생하는 총 폐기물': 'Total waste generated in manufacturing',
    '유해 폐기물 비율': 'Hazardous waste ratio',
    '재활용 폐기물 비율': 'Recycled waste ratio',
    '리콜 차량의 수': 'Number of recalled vehicles',
    '연비 개선 및 배기가스 저감 제품 매출액': 'Revenue from fuel-efficiency / emission-reduction products',
    '판매된 제품 중 재활용 가능 비율': 'Recyclable share of products sold',
    '투입 원자재 중 재활용되어진 원자재 비율': 'Recycled share of input raw materials',
    '반독점행위로 인한 금전적 손실': 'Monetary losses from antitrust actions',
    '총생산품 수': 'Total units produced',
    '총생산품 무게': 'Total product weight',
    '생산공장 크기': 'Production plant size',
    '좌 동': 'Same as left',
    '출처: 주식회사 캠스 2023 지속가능성 지표 공시 (SASB 규정 준용)':
      'Source: CAMS Co., Ltd. 2023 Sustainability Indicator Disclosure (per SASB standards)',
    /* 숫자+단위 셀 (ESG / Environment 공통) */
    '410.32 톤': '410.32 t',
    '380.62 톤': '380.62 t',
    '5,074 백만원': 'KRW 5,074M',
    '3,754 백만원': 'KRW 3,754M',
    '1,170,279 개': '1,170,279 units',
    '1,057,830 개': '1,057,830 units',
    '14,646 톤': '14,646 t',
    '14,033 톤': '14,033 t',

    /* Environment 페이지 */
    '인간, 환경, 사회가 조화될 수 있도록 환경보호를 통해 인간의 가치를 존중하며 기업의 사회적 책임을 완수한다.':
      'Through environmental protection that harmonizes people, the environment, and society, we respect human values and fulfill our corporate social responsibility.',
    '환경경영방침': 'Environmental Management Policy',
    '주식회사 캠스는 기업 시민 정신을 바탕으로 인간의 가치를 존중하며 풍요롭고 지속 가능한 사회를 만들기 위해 다음과 같은 글로벌 환경 방침을 제정하여 지구 환경보전에 최선을 다한다.':
      'Grounded in corporate citizenship, CAMS Co., Ltd. respects human values and, to build a prosperous and sustainable society, establishes the following global environmental policy and does its utmost to preserve the global environment.',
    '환경을 기업의 핵심 성공요소로 인식하고 능동적인 환경경영을 통해 기업 가치를 창출한다.':
      'We recognize the environment as a key success factor and create corporate value through proactive environmental management.',
    '환경 친화적 자동차의 개발과 보급을 통해 자동차 전문 기업으로서의 사회적 책임을 다한다.':
      'We fulfill our social responsibility as an automotive specialist by developing and spreading eco-friendly vehicles.',
    '제품의 개발, 생산, 판매, 사용, 폐기에 이르는 전 과정에 걸쳐 자원과 에너지의 지속 가능한 사용과 오염 물질 저감에 적극 노력한다.':
      'We actively pursue the sustainable use of resources and energy and the reduction of pollutants across the entire lifecycle — development, production, sale, use, and disposal.',
    '전 직원에 대한 환경교육과 협력업체 환경경영 활동을 적극 지원하며 사회공헌 활동에 최선을 다한다.':
      'We actively support environmental education for all employees and suppliers’ environmental-management activities, and do our best in community contribution.',
    '국내외 환경 법규와 협약을 준수하며 환경경영 추진 및 개선을 위해 노력하고 그 성과를 대내외에 공개한다.':
      'We comply with domestic and international environmental laws and agreements, strive to advance and improve environmental management, and disclose the results internally and externally.',
    '환경경영방침 적용범위': 'Scope of the Environmental Policy',
    '주식회사 캠스는 본사, 함평공장의 임직원은 본 환경정책에 따라 업무를 수행한다.':
      'Employees at the headquarters and the Hampyeong plant of CAMS Co., Ltd. carry out their work in accordance with this environmental policy.',
    '또한, 임직원은 협력사, 계약사, 합작투자사(Joint Venture), 아웃소싱 파트너 등 공급업체 및 매매/서비스업체를 대할 때에도 본 환경경영정책을 준수하도록 권장하여야 한다.':
      'Employees must also encourage suppliers and trading/service partners — including partners, contractors, joint ventures, and outsourcing partners — to comply with this environmental-management policy.',
    '환경경영방침 이행': 'Implementation of the Environmental Policy',
    '주식회사 캠스는 전 사업장의 환경, 안전 관련 분야에 대한 통합 포털 시스템을 구축하여 내부 정책에 따른 현황 점검 및 성과관리 등 전반적인 프로세스를 체계적으로 관리하도록 한다. 또한 정기적 자체 점검 및 제3자 현장 검증을 통해 온실가스, 수자원, 환경오염물질에 대한 모니터링을 강화한다.':
      'CAMS Co., Ltd. builds an integrated portal system for environment- and safety-related fields across all sites to systematically manage the overall process, including status checks and performance management under internal policy. It also strengthens monitoring of greenhouse gases, water resources, and pollutants through regular self-inspections and third-party on-site verification.',
    'Ⅰ. 제품 환경': 'Ⅰ. Product Environment',
    '· 환경 친화적 설계': '· Eco-friendly design',
    '환경 친화적인 설계 및 전 과정 환경 영향 평가에 최선의 노력을 기울이며 환경 비용 최적화를 위해 환경 영향 평가용 데이터 구축, 주요 부품 및 차량의 환경 영향 평가, 환경성적표지 인증 등 기술 개발 프로세스를 정착시키고 지속적으로 개선한다.':
      'We make our best efforts in eco-friendly design and full life-cycle environmental impact assessment, and to optimize environmental costs we establish and continuously improve technology-development processes such as building assessment datasets, assessing the environmental impact of key parts and vehicles, and obtaining Environmental Product Declaration certification.',
    '· 리싸이클 향상': '· Improving recyclability',
    '리싸이클이 용이한 차량을 개발하기 위한 설계 지원 체계를 구축하고, 시스템을 통한 중금속 등 유해물질 관리, 폐차 해체 기술 개발, 폐부품 재료 재활용 등을 통해 환경 오염을 최소화하고자 노력한다.':
      'We build a design-support system to develop easily recyclable vehicles and strive to minimize pollution through system-based management of heavy metals and other hazardous substances, end-of-life vehicle dismantling technology, and recycling of end-of-life part materials.',
    '· 친환경 차량 개발': '· Eco-friendly vehicle development',
    '전기차, 연료전지차의 핵심 요소기술 개발 및 경쟁력 확보를 통한 친환경차 보급 확대를 위해 노력한다. 또한 연비/배출가스 저감 기술력 향상을 통해 규제에 대응하는 등 환경 친화적 제품 개발에 주력한다.':
      'We work to expand eco-friendly vehicles by developing core technologies and securing competitiveness in EVs and fuel-cell vehicles. We also focus on eco-friendly product development, such as responding to regulations by improving fuel-economy and emission-reduction technologies.',
    'Ⅱ. 생산 환경': 'Ⅱ. Production Environment',
    '· 그린 구매 체제 구축': '· Building a green purchasing system',
    '협력사 평가 시 환경 요소를 반영하고 협력사의 ISO 14001 취득 및 IMDS 가입 등을 통하여 환경친화적인 부품을 공급받도록 한다.':
      'We reflect environmental factors in supplier evaluations and secure eco-friendly parts through suppliers’ ISO 14001 certification and IMDS enrollment.',
    '· 청정 생산 체제 구축': '· Building a clean production system',
    '국내/해외 전 공장 ISO 인증 체계를 구축하고 환경관리 시스템을 운영함으로써 정보공유 및 성과관리의 업무환경을 지속적으로 개선하며 환경 관련 임직원 교육 및 환경 설비 보완을 통해 배출량 저감, 에너지효율 개선, 작업환경 개선 등을 강화한다.':
      'By establishing ISO certification across all domestic and overseas plants and operating an environmental-management system, we continuously improve the work environment for information sharing and performance management, and strengthen emission reduction, energy-efficiency improvement, and workplace improvement through employee environmental training and upgraded environmental facilities.',
    '· 온실가스 / 에너지': '· Greenhouse gases / energy',
    '기후변화 대응 온실가스 배출을 저감하기 위해 제품 개발, 조달, 생산, 물류, 사용, 폐기에 걸친 전과정의 에너지 효율성 향상과 신재생에너지 확대에 최선을 다한다. 전사 온실가스 대응 협의체를 통해 사업장 온실가스 감축 아이템을 개발 적용하며 정기적인 배출량 목표 실적을 모니터링한다. 또한 생산공정의 에너지 사용 절감 혁신 기술 투자 강화, 공장 지붕 및 주차장에 태양광 발전 설비 확대 등으로 2030년 한국 온실가스 감축 규제 목표에 대응하기 노력한다. 나아가 2050년 탄소 중립 운영 체계를 구축하는 것을 목표로 지속적으로 혁신적 개선 활동을 추진한다.':
      'To reduce greenhouse-gas emissions in response to climate change, we do our utmost to improve energy efficiency and expand renewable energy across the entire process — product development, procurement, production, logistics, use, and disposal. Through a company-wide greenhouse-gas council, we develop and apply site-level reduction items and monitor emission targets regularly. We also respond to Korea’s 2030 greenhouse-gas reduction targets by strengthening investment in innovative energy-saving process technologies and expanding solar power on plant roofs and parking lots. Furthermore, we continuously drive innovative improvement toward the goal of establishing a carbon-neutral operating system by 2050.',
    '전력 / 에너지 소비 실적': 'Electricity / energy consumption',
    '구분': 'Category',
    '외부 조달 에너지 소비량 비율': 'Share of purchased energy',
    '대기오염물질 배출량 추이': 'Air-pollutant emission trend',
    '물질': 'Substance',
    '먼지': 'Dust',
    '황산화물': 'Sulfur oxides',
    '질소산화물': 'Nitrogen oxides',
    '일산화탄소': 'Carbon monoxide',
    '탄화수소 (THC)': 'Hydrocarbons (THC)',
    '포름알데히드': 'Formaldehyde',
    '에틸벤젠': 'Ethylbenzene',
    '총 합계': 'Grand total',
    '매출액 1억원당 환산 단위. 증감(%)은 2024년 원단위 vs 2023년 원단위 기준.':
      'Values converted per KRW 100M of revenue. Change (%) compares 2024 intensity vs 2023 intensity.',
    '· 용수 / 폐수': '· Water / wastewater',
    '사업 운영 과정에서 양질의 용수를 적시에 사용할 수 있도록 용수 설비를 정기적으로 점검 및 개선하며, 폐수 전용 처리시설을 구축하여 폐수 재활용률을 향상시킨다. 사업장 내 용수의 효율적인 사용을 위해 사전 수립된 계획에 따라 관리하며, 용수 사용량, 재사용량, 오폐수 방류량의 실시간 모니터링을 강화한다. 또한, 폐수처리장 방류 시스템의 개선과 폐수 무방류 시스템 운영을 통해 폐수 배출량 및 연간 오염물질을 절감한다.':
      'We regularly inspect and improve water facilities so that high-quality water is available on time during operations, and we raise the wastewater-recycling rate by building dedicated wastewater treatment facilities. Water is managed per a pre-established plan for efficient use, and real-time monitoring of water use, reuse, and effluent discharge is strengthened. We also cut wastewater discharge and annual pollutants by improving the treatment-plant discharge system and operating a zero-discharge wastewater system.',
    '· 폐기물': '· Waste',
    '차량의 생산, 운반, 폐차 등 전 사업활동에서 발생되는 폐기물을 최소화하고, 발생된 폐기물의 효율적인 처리를 위하여 보관, 운반, 처리 등에 관한 관리기준을 수립하여 운영한다. 또한, 폐기물의 종류별로 관리기준에 따라 보관 및 이송 업무를 수행하며, 폐기물 외주업체가 폐기물을 적법하게 처리하도록 엄격하게 관리하도록 한다. 본사 및 사업장은 전년도 폐기물처리 내역을 참고하여 연간 예상 발생량 및 감량 계획에 대하여 매월 자체적으로 실적을 관리하도록 한다.':
      'We minimize waste from all activities — vehicle production, transport, and scrapping — and establish and operate management standards for storage, transport, and treatment to handle waste efficiently. Storage and transfer are carried out by waste type per those standards, and waste-treatment contractors are strictly managed to dispose of waste lawfully. The headquarters and each site self-manage monthly performance against annual estimated generation and reduction plans, referencing the prior year’s waste-treatment records.',
    '폐기물 관리 실적': 'Waste-management performance',
    '총 폐기물 발생량': 'Total waste generated',
    '· 자원 / 폐제품': '· Resources / end-of-life products',
    '폐제품 회수 및 재활용 서비스를 운영하며, 고객의 올바른 폐제품 폐기를 유도할 수 있도록 회수체계에 대한 정보를 제공한다. 또한 제품의 설계 단계부터 재활용 가능 여부를 고려하는 등 폐제품의 재활용 가능성을 향상시키기 위해 노력한다. 이와 함께 자원순환 네트워크의 운영을 통해 신규 폐차 재활용 업체를 확대하며 전체 재활용률을 높이고자 노력한다. 또한 폐자동차 자원순환 역량을 지속적으로 향상시키기 위한 시스템과 제도를 도입한다.':
      'We operate collection and recycling services for end-of-life products and provide information on the collection system to encourage customers to dispose of products correctly. We also work to improve recyclability by considering it from the design stage. Through a resource-circulation network, we expand new end-of-life-vehicle recyclers and raise the overall recycling rate, and we introduce systems and policies to continuously enhance end-of-life-vehicle resource-circulation capabilities.',
    '자원관리 — 원부자재 사용량 · 폐기물 발생량 · 재활용': 'Resource management — raw-material use · waste · recycling',
    '배출량 (ton/yr)': 'Emissions (ton/yr)',
    '원단위 (kg/yr·매출액 億)': 'Intensity (kg/yr · per KRW 100M revenue)',
    '증감 (%)': 'Change (%)',
    '목표': 'Target',
    '(3% 감소)': '(−3%)',
    '목표 대비 감축률': 'Reduction vs target',
    '원부자재': 'Raw materials',
    '사용량': 'usage',
    '범퍼용 수지 (ton/yr)': 'Bumper resin (ton/yr)',
    '도료 (ton/yr)': 'Paint (ton/yr)',
    '계': 'Subtotal',
    '사용집약도': 'Usage intensity',
    'ton / 매출액 億': 'ton / KRW 100M',
    '폐기물': 'Waste',
    '발생량': 'generated',
    '일반': 'General',
    '재활용': 'Recycled',
    '소각': 'Incinerated',
    '매립': 'Landfilled',
    '지정': 'Designated',
    '합계': 'Total',
    '폐기물 집약도': 'Waste intensity',
    '(ton / 매출액 億)': '(ton / KRW 100M)',
    '재활용량': 'Recycled amount',
    '재활용 집약도': 'Recycling intensity',
    '재활용률': 'Recycling rate',
    '매년 3% 감축률 목표 · 빨간색은 매출액 1억원당 사용/배출 원단위 (집약도)':
      'Annual 3% reduction target · Red = usage/emission intensity per KRW 100M revenue',
    '매월': 'Monthly',
    '영상을 재생할 수 없습니다.': 'The video cannot be played.',
    '© ㈜캠스 (CAMS Korea). All rights reserved.': '© CAMS Korea. All rights reserved.',
    '· 물류 효율화': '· Logistics efficiency',
    '부품과 차량의 운송·탁송 과정에서 협력사 통합 효율적 물류 운영 관리, 재고 최적화 관리뿐 아니라 환경 관련 시설 및 대기, 수질, 폐기물, 토양, 해양환경, 온실가스 관련 업무 기준을 수립·운영하여 점검함으로써 환경오염 방지 및 에너지절감을 추진한다.':
      'In transporting and forwarding parts and vehicles, we pursue pollution prevention and energy savings by managing integrated, efficient supplier logistics and inventory optimization, and by establishing, operating, and inspecting work standards for environmental facilities and for air, water, waste, soil, marine environment, and greenhouse gases.',
    'Ⅲ. 경영환경': 'Ⅲ. Management Environment',
    '· 그린 마케팅 / 판매 체제 구축': '· Building green marketing / sales',
    '친환경 차량 관련 브랜드 전략과 이를 연계한 마케팅 및 판매 활동을 통해 친환경 제품 판매에 기여한다.':
      'We contribute to eco-friendly product sales through brand strategies for eco-friendly vehicles and the marketing and sales activities linked to them.',
    '· 그린 서비스 체제 구축': '· Building green services',
    '지역별 폐차 법규 대응 및 서비스센터 오염물질 최소화, 정비협력업체 ISO 14001 인증을 받는다.':
      'We respond to regional end-of-life-vehicle regulations, minimize pollutants at service centers, and obtain ISO 14001 certification for maintenance partners.',
    '· 커뮤니케이션 강화': '· Strengthening communication',
    '지속가능성보고서 및 ESG 평가를 통해 당사의 환경친화적 경영활동에 대해 대외에 공개하고, 환경 전문가를 활용하여 이해관계자의 니즈 반영 및 소통을 강화하고자 노력한다.':
      'We disclose our eco-friendly management activities externally through sustainability reports and ESG assessments, and work to reflect stakeholder needs and strengthen communication with the help of environmental experts.',
    '생산 활동 지표': 'Production activity indicators',
    '4대 중금속 글로벌 스탠다드 방침': 'Four Heavy Metals — Global Standard Policy',
    '주식회사 캠스는 글로벌 환경경영방침에 입각하여 전세계에서 판매하는 모든 차량 및 부품 또는 재료에 납, 수은, 6가 크롬, 그리고 카드뮴(이하 4대 중금속)을 사용하지 않으며, 이를 자주적으로 준수한다.':
      'In line with its global environmental-management policy, CAMS Co., Ltd. does not use lead, mercury, hexavalent chromium, or cadmium (the “four heavy metals”) in any vehicle, part, or material sold worldwide, and complies with this voluntarily.',
    '주식회사 캠스의 모든 임직원은 제품의 개발, 생산 판매, 사용, 폐기에 이르는 전 과정에서 4대 중금속이 사용되지 않도록 책임을 다한다.':
      'All employees of CAMS Co., Ltd. are responsible for ensuring the four heavy metals are not used across the entire process — development, production, sale, use, and disposal.',
    '주식회사 캠스와 거래하는 국내외 모든 협력사는 주식회사 캠스에 납품하는 부품 또는 재료에 4대 중금속이 함유되지 않도록 책임을 다한다.':
      'All domestic and overseas suppliers doing business with CAMS Co., Ltd. are responsible for ensuring the four heavy metals are not contained in parts or materials delivered to CAMS.',
    '주식회사 캠스와 국내외 모든 협력사는 4대 중금속 규제 대응 관련 프로세스를 강화하며 관련 임직원에 대한 환경 교육을 강화한다.':
      'CAMS Co., Ltd. and all domestic and overseas suppliers strengthen processes for responding to four-heavy-metal regulations and reinforce environmental training for relevant staff.',
    '4대 중금속 글로벌 스탠다드 방침을 추진함에 있어 주식회사 캠스와 국내외 모든 협력사는 상호 협력할 수 있도록 최선의 노력을 다한다.':
      'In advancing the four-heavy-metals global standard policy, CAMS Co., Ltd. and all suppliers do their best to cooperate with one another.',
    '4대 중금속 사용 금지 대상': 'Prohibited four heavy metals',
    '중금속': 'Heavy metal',
    '영문': 'English',
    '기호': 'Symbol',
    '납': 'Lead',
    '수은': 'Mercury',
    '6가 크롬': 'Hexavalent Chromium',
    '카드뮴': 'Cadmium',
    '운영실적 및 목표': 'Performance & Targets',
    '안전보건 지표': 'Safety & Health Indicators',
    '㈜캠스의 안전보건 지표는 SASB 보고서에 정량 데이터로 함께 공시되어 있습니다. 세부 항목은 본 페이지의 환경경영방침 이행 섹션의 폐기물·전력·생산 활동 지표 표를 참고해 주세요.':
      'CAMS’s safety and health indicators are disclosed together as quantitative data in the SASB report. For details, please refer to the waste, electricity, and production-activity tables in the Implementation section on this page.',
    '운영 조직': 'Operating Organization',
    '㈜캠스는 환경·안전 통합 포털 시스템을 통해 사업장 전반의 환경 영향과 안전 보건 지표를 체계적으로 관리하고 있습니다. 정기적인 자체 점검 및 제3자 현장 검증을 통해 온실가스, 수자원, 환경오염물질에 대한 모니터링을 강화합니다.':
      'Through an integrated environment-and-safety portal system, CAMS systematically manages environmental impact and safety-and-health indicators across all sites. It strengthens monitoring of greenhouse gases, water resources, and pollutants through regular self-inspections and third-party on-site verification.',

    /* Social 페이지 */
    '사회공헌': 'Community Contribution',
    '윤리경영': 'Ethical Management',
    '준법경영': 'Compliance Management',
    '공정경쟁': 'Fair Competition',
    '임직원 인권 보호': 'Protecting Employee Human Rights',
    '분쟁광물': 'Conflict Minerals',
    '㈜캠스는 지역 사회의 일원으로서 책임을 다하고자 청소년 지원 활동과 장애인 및 지역 사회 지원활동을 통해 사회공헌활동을 추진하고 있습니다.':
      'As a member of the local community, CAMS carries out community-contribution activities through youth support and support for people with disabilities and the wider community.',
    '캠스 노동조합과 사측은 사회복지법원 용진원과 협약을 체결하였습니다. 캠스와 용진원이 체결하는 협약에는 현재 중학교에 다니며 용진원에서 생활하는 학생 A군 등 2명에게 성인이 될 때까지 매달 50만 원을 지원합니다. 캠스는 성인이 돼 자립준비청년이 된 A군 등 2명이 캠스에서 일하기를 희망할 경우 일자리를 제공하는데도 적극 협조할 계획입니다.':
      'The CAMS labor union and management signed an agreement with the Yongjinwon welfare institution. Under the agreement, CAMS provides KRW 500,000 per month until adulthood to two students — including student A, currently in middle school and living at Yongjinwon. CAMS also plans to actively help provide jobs should the two, once they become self-reliant young adults, wish to work at CAMS.',
    '사회공헌 협약 — 캠스 × 사회복지법원 용진원': 'Community-contribution agreement — CAMS × Yongjinwon Welfare Institution',
    '내용': 'Details',
    '협약 주체': 'Parties',
    '캠스 노동조합 · 사측 ↔ 사회복지법원 용진원': 'CAMS union · management ↔ Yongjinwon Welfare Institution',
    '지원 대상': 'Beneficiaries',
    '중학교 재학 중이며 용진원에서 생활하는 학생 2명': 'Two students in middle school living at Yongjinwon',
    '지원 금액': 'Amount',
    '500,000원': 'KRW 500,000',
    '지원 기간': 'Period',
    '성인이 될 때까지': 'Until adulthood',
    '자립 지원': 'Independence Support',
    '자립준비청년이 된 후 캠스 입사 희망 시 일자리 제공에 적극 협조':
      'Active support in providing jobs if they wish to join CAMS as self-reliant young adults',
    '윤리경영이 가장 근본적이고 강력한 경쟁력이라는 신념을 가지고 지속경영을 위한 투명하고 깨끗한 경영을 실천하고 올바른 의사결정과 윤리적 판단 기준을 임직원에게 제공하고 있습니다.':
      'With the conviction that ethical management is the most fundamental and powerful competitive strength, we practice transparent and clean management for sustainability and provide employees with standards for sound decision-making and ethical judgment.',
    '캠스 윤리규정': 'CAMS Code of Ethics',
    '윤리경영 실천지침': 'Ethics-Management Guidelines',
    '캠스 인권헌장': 'CAMS Human-Rights Charter',
    '협력사 행동규범': 'Supplier Code of Conduct',
    '㈜캠스 분쟁광물(책임광물) 정책': 'CAMS Conflict (Responsible) Minerals Policy',
    '준법경영은 윤리규범과 행동기준을 임직원이 자발적으로 준수하도록 도와 비지니스 영역에서 발생할 수 있는 규제리스크를 사전에 예방하고 회사와 임직원을 법적 리스크로부터 보호하는 한편 지속적 경영활동을 가능하게 해 주주와 고객의 만족은 물론 국가발전에 이바지 하는 글로벌기업으로 꾸준히 자리매김 하는 것을 목표로 합니다.':
      'Compliance management helps employees voluntarily observe ethical norms and codes of conduct, preventing regulatory risks that may arise in business and protecting the company and its employees from legal risk. At the same time, it enables continuous business activity, aiming to steadily position CAMS as a global company that satisfies shareholders and customers and contributes to national development.',
    '㈜캠스는 정직하게 경쟁하여 공정한 가치를 창출합니다. 시장 경쟁제한 행위를 예방하고 고객사와 협력사, 경쟁사와 더불어 공정한 이윤을 추구하고 있습니다.':
      'CAMS competes honestly to create fair value. We prevent practices that restrict market competition and pursue fair profit together with customers, suppliers, and competitors.',
    '경쟁 행위 실적': 'Competitive-behavior results',
    '㈜캠스는 인권경영을 적극적으로 이행함과 동시에 사업 운영에 따른 인권침해를 예방하고 관련 리스크를 완화하기 위해 본 인권헌장을 선언한다.':
      'CAMS actively implements human-rights management and, to prevent human-rights violations arising from its operations and mitigate related risks, declares this Human-Rights Charter.',
    '㈜캠스는 인권경영 이행을 위해 세계인권선언(Universal Declaration of Human Rights), UN 기업과 인권 이행원칙(UN Guiding Principles on Business and Human Rights) 및 국제노동기구 헌장(International Labor Organization Constitution), OECD 다국적 기업 가이드라인(OECD Guidelines for Multinational Enterprises), OECD 실사 가이드라인(OECD Due Diligence Guidance for Responsible Business Conduct) 등 인권·노동 관련 국제 표준 및 가이드라인을 존중하고 지지합니다.':
      'To implement human-rights management, CAMS respects and supports international human-rights and labor standards and guidelines, including the Universal Declaration of Human Rights, the UN Guiding Principles on Business and Human Rights, the International Labour Organization Constitution, the OECD Guidelines for Multinational Enterprises, and the OECD Due Diligence Guidance for Responsible Business Conduct.',
    '기업활동이 인권에 미치는 부정적 영향을 파악하고 이를 방지·완화하기 위해 노력하며, 발생한 인권 피해 영향을 최소화하기 위한 구제 절차를 마련하고 있습니다.':
      'We identify the negative impacts of our business activities on human rights and strive to prevent and mitigate them, and we provide remedy procedures to minimize the impact of any human-rights harm that occurs.',
    '준수하는 인권·노동 관련 국제 표준 및 가이드라인': 'International human-rights / labor standards observed',
    '국제 표준 / 가이드라인': 'International standard / guideline',
    '세계인권선언 (Universal Declaration of Human Rights)': 'Universal Declaration of Human Rights',
    '기업과 인권 이행원칙 (UN Guiding Principles on Business and Human Rights)': 'UN Guiding Principles on Business and Human Rights',
    '국제노동기구 헌장 (International Labor Organization Constitution)': 'International Labour Organization Constitution',
    '다국적 기업 가이드라인 (OECD Guidelines for Multinational Enterprises)': 'OECD Guidelines for Multinational Enterprises',
    '실사 가이드라인 (OECD Due Diligence Guidance for Responsible Business Conduct)': 'OECD Due Diligence Guidance for Responsible Business Conduct',
    '분쟁광물이란, 콩고민주공화국 또는 그 인접국가 등 분쟁이 발생하고 있는 국가에서 생산되는 주석, 탄탈륨, 텅스텐 및 금 등의 광물을 지칭합니다.':
      'Conflict minerals refer to minerals such as tin, tantalum, tungsten, and gold produced in conflict-affected countries such as the Democratic Republic of the Congo and its neighbors.',
    '㈜캠스는 법률 준수 및 사회적 책임을 다하기 위해 분쟁광물 관리정책을 수립하였습니다.':
      'CAMS has established a conflict-minerals management policy to comply with the law and fulfill its social responsibility.',
    '분쟁지역 내 무장세력과 연관된 분쟁광물이 자사의 제품 생산을 위한 공급사슬 내에 포함되지 않도록 협력사에게 분쟁광물 정책 및 절차 수립을 비롯한 분쟁광물 사용현황 조사, 위험대응절차 계획 수립을 요구하고 있는 등 협력사들이 분쟁광물로부터 자유로운 제련소를 통해 구매할 수 있도록 지원하고 있습니다.':
      'To keep conflict minerals linked to armed groups in conflict areas out of our supply chain, we require suppliers to establish conflict-minerals policies and procedures, survey conflict-mineral usage, and prepare risk-response plans, thereby supporting suppliers in purchasing from conflict-free smelters.',
    '분쟁광물(Conflict Minerals) 관리 대상': 'Conflict-minerals management scope',
    '광물': 'Mineral',
    '주석': 'Tin',
    '탄탈륨': 'Tantalum',
    '텅스텐': 'Tungsten',
    '금': 'Gold',
    '대상 지역: 콩고민주공화국 및 그 인접국가': 'Covered region: DR Congo and neighboring countries',

    /* Governance 페이지 */
    '이사회': 'Board of Directors',
    '감사': 'Auditor',
    '이사회 운영': 'Board Operation',
    '이사회 구성': 'Board Composition',
    '감사 구성': 'Auditor Composition',
    '이사회 운영 규정': 'Board Operating Rules',
    '2026 기준': 'As of 2026',
    '정관 기준': 'Per Articles of Incorporation',
    '직위': 'Position',
    '주요 경력': 'Key Career',
    '김선구': 'Kim Seon-gu',
    '김정은': 'Kim Jeong-eun',
    '홍정수': 'Hong Jeong-su',
    '김정중': 'Kim Jeong-jung',
    '부회장': 'Vice Chairman',
    '대표이사': 'CEO (Representative Director)',
    '회장': 'Chairman',
    '현 ㈜캠스 부회장': 'Current Vice Chairman, CAMS',
    '현대자동차': 'Hyundai Motor',
    '기아자동차': 'Kia Motors',
    '효성': 'Hyosung',
    '한양대학교 기계공학과': 'Hanyang University, Mechanical Engineering',
    '현 ㈜캠스 생산담당 각자 대표': 'Current Joint Representative (Production), CAMS',
    '에스케이텔레콤': 'SK Telecom',
    '한국과학기술원 경영과학과': 'KAIST, Management Science',
    '현 ㈜캠스 관리담당 각자 대표': 'Current Joint Representative (Administration), CAMS',
    '현 ㈜캠스 회장': 'Current Chairman, CAMS',
    'LG전선': 'LG Cable',
    '고려대학교': 'Korea University',
    '이사회의 소집': 'Convening the Board',
    '이사회의 결의': 'Board Resolutions',
    '이사회의록': 'Board Minutes',
    '① 이사는 이사회를 구성하여 대표이사의 선임과 회사업무집행에 관한 중요사항을 결의하며, 의장은 대표이사가 된다.':
      '① The directors form the board of directors, which resolves important matters concerning the appointment of the representative director and the execution of company business; the chair is the representative director.',
    '② 이사의 수가 2인 이하인 경우에는 이사회를 구성하지 아니하며, 정관 또는 법률의 규정에 의한 이사회의 결의사항은 주주총회의 결의 또는 대표권 있는 이사의 결정에 의한다. 이 경우 본 정관의 ‘이사회’는 ‘주주총회’ 또는 ‘이사의 결정’으로 본다.':
      '② Where the number of directors is two or fewer, no board is formed, and matters requiring board resolution under the Articles or law are decided by the general meeting of shareholders or by the director holding representative authority. In such case, “board of directors” in these Articles is read as “general meeting of shareholders” or “decision of the director.”',
    '① 이사회는 대표이사 또는 이사회에서 따로 정한 이사가 있는 때에는 그 이사가 회일의 일주 전에 각 이사 및 감사에게 통지하여 소집한다. 그러나 이사 및 감사 전원의 동의가 있는 때에는 소집절차를 생략할 수 있다.':
      '① The board is convened by the representative director — or, where the board has separately designated a director, by that director — by giving notice to each director and auditor one week before the meeting date. However, the convening procedure may be omitted with the consent of all directors and auditors.',
    '② 이사회는 음성을 동시 송수신하는 통신수단으로 개최할 수 있다.':
      '② The board may be held by means of communication that transmits and receives voice simultaneously.',
    '① 이사회의 결의 방법은 이사 과반수 출석과 출석이사의 과반수로 한다. 단, 전환사채의 발행, 신주인수권부사채의 발행은 이사 과반수의 출석과 출석이사 3분의 2의 찬성으로 정한다.':
      '① Board resolutions require the attendance of a majority of directors and the affirmative vote of a majority of those present. However, the issuance of convertible bonds or bonds with warrants is decided by the attendance of a majority of directors and a two-thirds affirmative vote of those present.',
    '② 이사회 결의에 특별한 이해관계 있는 이사는 의결권을 행사하지 못한다.':
      '② A director with a special interest in a board resolution may not exercise voting rights.',
    '① 이사회의 의사에는 의사록을 작성하여야 한다.':
      '① Minutes must be prepared for the proceedings of the board.',
    '② 이사회의사록에는 의장과 출석한 이사 및 감사가 기명날인 또는 서명하여 본점에 비치한다.':
      '② The board minutes are signed or sealed by the chair and the attending directors and auditors, and kept at the head office.'
  };

  /* ---------- 속성 번역 (title 등) ---------- */
  var TITLE = {
    '회사 소개 | ㈜캠스': 'About Us | CAMS Korea',
    '생산 제품 | ㈜캠스': 'Products | CAMS Korea',
    'ESG 경영 | ㈜캠스': 'ESG Management | CAMS Korea',
    '회사 정보 | ㈜캠스': 'Company Info | CAMS Korea',
    '공사 입찰 | ㈜캠스': 'Construction Bidding | CAMS Korea',
    'Environment | ㈜캠스': 'Environment | CAMS Korea',
    'Social | ㈜캠스': 'Social | CAMS Korea',
    'Governance | ㈜캠스': 'Governance | CAMS Korea',
    'Selfservice | ㈜캠스': 'Selfservice | CAMS Korea'
  };
  var ALT = {
    'Bumper to Buffer — 제조를 중심에 두고 정보화를 추진합니다':
      'Bumper to Buffer — Advancing digitalization with manufacturing at the core'
  };

  /* 동적(스크립트 생성) 문자열 — main.js 에서 사용 */
  var DYN = {
    sending: 'Sending…',
    submit: 'Submit Report',
    errFail: 'Failed to submit the report. Please try again shortly.',
    errTimeout: 'The server is taking too long to respond. Please try again shortly or contact the administrator.',
    errNetwork: 'A network error prevented submission. Please try again shortly.'
  };

  /* ---------- 수집 & 적용 ---------- */
  var textNodes = [];   // {node, ko}
  var richEls = [];     // {el, koHTML, en}
  var attrItems = [];   // {el, attr, ko, en}
  var collected = false;
  var origTitle = document.title;

  function collect() {
    if (collected) return;
    collected = true;

    // 1) RICH 요소 (인라인 태그 포함)
    var richSel = document.querySelectorAll('h1, h2, p, li');
    for (var i = 0; i < richSel.length; i++) {
      var el = richSel[i];
      if (el.hasAttribute('data-i18n-skip')) continue;
      if (!el.querySelector('*')) continue;               // 자식 요소 없으면 텍스트 노드로 처리
      var key = norm(el.textContent);
      if (RICH[key]) {
        el.setAttribute('data-i18n-rich', '');
        richEls.push({ el: el, koHTML: el.innerHTML, en: RICH[key] });
      }
    }

    // 2) 일반 텍스트 노드
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (n) {
        if (!n.nodeValue || !n.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
        var p = n.parentElement;
        if (!p) return NodeFilter.FILTER_REJECT;
        if (p.closest('script, style, [data-i18n-rich], [data-i18n-skip]')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var node;
    while ((node = walker.nextNode())) {
      if (NODE[norm(node.nodeValue)] != null) textNodes.push({ node: node, ko: node.nodeValue });
    }

    // 3) 속성 (alt 등)
    var alts = document.querySelectorAll('img[alt]');
    for (var j = 0; j < alts.length; j++) {
      var a = alts[j];
      var en = ALT[norm(a.getAttribute('alt'))];
      if (en) attrItems.push({ el: a, attr: 'alt', ko: a.getAttribute('alt'), en: en });
    }
  }

  function apply(lang) {
    collect();
    var en = (lang === 'en');
    var i;
    for (i = 0; i < richEls.length; i++) {
      richEls[i].el.innerHTML = en ? richEls[i].en : richEls[i].koHTML;
    }
    for (i = 0; i < textNodes.length; i++) {
      var t = textNodes[i];
      if (!en) { t.node.nodeValue = t.ko; continue; }
      var val = NODE[norm(t.ko)];
      if (val != null) {
        var lead = (t.ko.match(/^\s*/) || [''])[0];
        var trail = (t.ko.match(/\s*$/) || [''])[0];
        t.node.nodeValue = lead + val + trail;
      }
    }
    for (i = 0; i < attrItems.length; i++) {
      attrItems[i].el.setAttribute(attrItems[i].attr, en ? attrItems[i].en : attrItems[i].ko);
    }
    // 문서 타이틀
    var tt = TITLE[norm(origTitle)];
    document.title = (en && tt) ? tt : origTitle;
    document.documentElement.lang = en ? 'en' : 'ko';
    window.__camsLang = lang;
    window.__camsDyn = DYN;
    updateToggle(lang);
  }

  /* ---------- 언어 결정 & 토글 ---------- */
  function stored() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function save(lang) {
    try { localStorage.setItem(KEY, lang); } catch (e) {}
  }
  function autoLang() {
    var langs = navigator.languages && navigator.languages.length
      ? navigator.languages : [navigator.language || navigator.userLanguage || 'en'];
    for (var i = 0; i < langs.length; i++) {
      if (langs[i] && langs[i].toLowerCase().indexOf('ko') === 0) return 'ko';
    }
    return 'en'; // 한국어가 아니면 (≈ 한국 이외 접근) 영어
  }

  function updateToggle(lang) {
    var btn = document.getElementById('langToggle');
    if (!btn) return;
    btn.innerHTML =
      '<span class="lang-opt" data-lang="ko">한국어</span>' +
      '<span class="lang-opt" data-lang="en">English</span>';
    var opts = btn.querySelectorAll('.lang-opt');
    for (var i = 0; i < opts.length; i++) {
      var on = opts[i].getAttribute('data-lang') === lang;
      opts[i].classList.toggle('active', on);
      opts[i].setAttribute('aria-pressed', on ? 'true' : 'false');
    }
    btn.setAttribute('aria-label', 'Language: ' + (lang === 'en' ? 'English' : '한국어'));
  }

  var current = (function () {
    var s = stored();
    return (s === 'ko' || s === 'en') ? s : autoLang();
  })();

  apply(current);

  document.addEventListener('click', function (e) {
    if (!e.target || !e.target.closest) return;
    var btn = e.target.closest('#langToggle');
    if (!btn) return;
    e.preventDefault();
    var seg = e.target.closest('[data-lang]');
    var target = seg ? seg.getAttribute('data-lang') : ((current === 'en') ? 'ko' : 'en');
    if (target !== 'ko' && target !== 'en') return;
    if (target === current) return;
    current = target;
    save(current);
    apply(current);
  });

  // 외부에서 접근할 수 있도록 노출
  window.CAMS_I18N = {
    get: function () { return current; },
    set: function (l) { if (l === 'ko' || l === 'en') { current = l; save(l); apply(l); } }
  };
})();
