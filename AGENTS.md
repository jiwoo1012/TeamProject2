JAJAK AGENTS.md
Version: 1.0
Last updated: 2026-08-18
Purpose: JAJAK 팀 프로젝트에서 Codex와 모든 팀원이 동일한 구조, 데이터 규칙, 권한 기준, 상태 관리 방식으로 개발하기 위한 공통 지침이다.
이 문서는 코드 작성 전 우선 확인한다. 확정된 팀 규칙과 충돌하는 임의 구현은 하지 않는다.

1. Project Overview
JAJAK은 전통주를 중심으로 안주와 주류용품을 함께 추천하는 AI 큐레이션 쇼핑몰 프로젝트이다.

주요 기능:

이메일 기반 회원가입 / 로그인
성인인증
전통주 / 안주 / 주류용품 상품 조회
AI 주안상 큐레이션
찜
장바구니
Mock 결제 / 주문
마이페이지
이벤트 룰렛
관리자 페이지
공지사항 / FAQ / 1:1 문의
본 프로젝트는 학습용 포트폴리오 프로젝트이며 실제 상용 판매/결제 서비스가 아니다.

2. Tech Stack
Frontend
React 19
Vite 8
JavaScript + JSX
React Router
Zustand
Sass / SCSS Modules
GSAP
Chart.js
react-chartjs-2
react-helmet-async
Backend / External
Firebase Authentication
Cloud Firestore
Firebase Cloud Functions
OpenAI API
Package Manager
npm
package-lock.json을 기준으로 한다.
새로운 npm package는 팀 합의 없이 임의로 추가하지 않는다.
3. Core Collaboration Rules
작업 전 반드시 루트의 AGENTS.md를 읽는다.
이미 존재하는 Component / Hook / Store / Service / Constant를 우선 재사용한다.
다른 담당자의 페이지나 공통 파일을 요청 없이 임의 수정하지 않는다.
새로운 Firebase Collection / Field / Status 값을 임의 생성하지 않는다.
새로운 Zustand Store를 팀 합의 없이 생성하지 않는다.
동일 목적의 공통 UI를 중복 생성하지 않는다.
확정된 Figma / 화면설계 구조를 임의로 재디자인하지 않는다.
구현 범위가 불명확하면 기능을 임의 확장하지 않고 담당자와 확인한다.
API Key / Firebase Secret / OpenAI Secret을 소스 코드에 직접 작성하지 않는다.
작업 후 수정한 파일과 변경 내용을 명확히 보고한다.
팀에서 확정한 필드명 / enum / route / schema를 임의로 변경하지 않는다.
기존 JSON의 필드 타입을 데이터 담당자 협의 없이 임의 변환하지 않는다.
4. Team Ownership
김지우 — 팀장 / 공통 구조 / Routing / AI
담당:

Header / Footer / GNB
전체 URL / Routing
MyPage nested routing
Admin access control / routing
검색 이동 흐름
AI 큐레이션 페이지
AI 추천 결과
AI 추천 기록 저장
MyPage AI 추천 내역
Admin AI 추천 로그
Firebase Cloud Functions / OpenAI 연동 구조
최종 페이지 통합 / 경로 점검
최종 기능 시나리오 / 용어 통합
김태은 — 상품 / 검색 / 이벤트
담당:

상품 JSON 및 상품 데이터 검증
ProductCard
상품 목록 / 상세
카테고리 / 필터
상품 관리
이벤트 목록 / 상세 / 룰렛
이벤트 참여 결과
MyPage 이벤트 참여 내역
Admin 상품관리
Admin 이벤트관리
상품 초기 JSON의 최종 관리자는 김태은이다.

백현정 — Main / Brand / Entry / Admin Dashboard
담당:

Main
Brand Story
Hero / 대표상품 / AI·이벤트 진입
Splash
404
Admin Dashboard
디자인 공통 규칙 협의
이영기 — 고객센터 / Wishlist / 상품 상세 협업
담당:

공지사항
FAQ
배송 / 교환 / 환불
1:1 문의
Wishlist / 찜
상품 상세 협업
찜 상품 장바구니 이동
이유진 — Auth / Cart / Order / MyPage·Admin Common Layout
담당:

Login
Signup
인증 연동
Logout
로그인 상태 처리
사용자 role 데이터
Cart
Checkout
OrderComplete
주문 저장
MyPage 주문내역
MyPage 공통 Layout
MyPage Sidebar / Summary / Outlet
회원정보 / 닉네임 수정
Admin 공통 Layout
Admin Sidebar / Header / Content
Admin 회원관리
AGENTS.md / README 정리
5. Protected / Shared Files
아래 파일 또는 영역은 담당자 또는 팀 합의 없이 임의 수정하지 않는다.

src/components/common/Header.jsx
src/components/common/Footer.jsx
src/pages/MyPage/MyPageLayout.jsx
src/pages/Admin/AdminLayout.jsx
src/App.jsx
src/routes/*
src/styles/*
src/firebase/firebase.js
firestore.rules
firestore.indexes.json
AGENTS.md
package.json
package-lock.json
공통 파일 수정이 필요한 경우 기존 담당자에게 먼저 공유한다.

6. Project Folder Structure
jajak/
│
├── AGENTS.md
│
├── functions/
│   ├── src/
│   │   ├── index.js
│   │   ├── handlers/
│   │   │   └── recommendation.js
│   │   ├── services/
│   │   │   └── openai.js
│   │   └── utils/
│   │       ├── filterProducts.js
│   │       ├── buildPrompt.js
│   │       ├── validateSurvey.js
│   │       ├── validateAiResponse.js
│   │       └── rateLimit.js
│   ├── .secret.local
│   ├── package.json
│   └── .gitignore
│
├── public/
│   └── favicon.ico
│
├── src/
│   ├── assets/
│   │   ├── characters/
│   │   │   └── makdong/
│   │   ├── icons/
│   │   ├── logos/
│   │   └── images/
│   │       ├── main/
│   │       ├── brand/
│   │       ├── products/
│   │       ├── events/
│   │       └── mypage/
│   │
│   ├── data/
│   │   ├── products/
│   │   │   ├── liquors.json
│   │   │   ├── foods.json
│   │   │   ├── glasses.json
│   │   │   ├── gifts.json
│   │   │   └── index.js
│   │   ├── pairings.json
│   │   └── events.json
│   │
│   ├── constants/
│   │   ├── preferenceSurvey.js
│   │   ├── aiSurvey.js
│   │   ├── tasteAxis.js
│   │   ├── userRole.js
│   │   ├── orderStatus.js
│   │   └── eventStatus.js
│   │
│   ├── hooks/
│   │   ├── useAiSurvey.js
│   │   ├── useAdultCheck.js
│   │   └── useDebounce.js
│   │
│   ├── routes/
│   │   ├── paths.js
│   │   ├── ProtectedRoute.jsx
│   │   └── AdminRoute.jsx
│   │
│   ├── styles/
│   │   ├── _variables.scss
│   │   ├── _mixins.scss
│   │   ├── _reset.scss
│   │   └── global.scss
│   │
│   ├── firebase/
│   │   ├── firebase.js
│   │   ├── auth.js
│   │   └── firestore.js
│   │
│   ├── services/
│   │   └── recommendationApi.js
│   │
│   ├── store/
│   │   ├── useAuthStore.js
│   │   ├── useAiStore.js
│   │   └── useCartStore.js
│   │
│   ├── utils/
│   │   ├── format.js
│   │   └── validation.js
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── Header.jsx
│   │   │   ├── Header.module.scss
│   │   │   ├── Footer.jsx
│   │   │   ├── Footer.module.scss
│   │   │   ├── AdultModal.jsx
│   │   │   ├── AdultModal.module.scss
│   │   │   ├── SearchModal.jsx
│   │   │   ├── SearchModal.module.scss
│   │   │   └── ErrorBoundary.jsx
│   │   └── ui/
│   │       ├── Button/
│   │       ├── Modal/
│   │       ├── Loading/
│   │       ├── ErrorState/
│   │       ├── EmptyState/
│   │       ├── Badge/
│   │       ├── Pagination/
│   │       ├── Tabs/
│   │       ├── ProductCard/
│   │       └── QuestionCard/
│   │
│   ├── pages/
│   │   ├── Main/
│   │   │   ├── MainPage.jsx
│   │   │   ├── MainPage.module.scss
│   │   │   ├── SplashIntro.jsx
│   │   │   └── SplashIntro.module.scss
│   │   ├── Brand/
│   │   │   ├── BrandStory.jsx
│   │   │   └── BrandStory.module.scss
│   │   ├── Shop/
│   │   │   ├── ProductList.jsx
│   │   │   ├── ProductList.module.scss
│   │   │   ├── ProductDetail.jsx
│   │   │   └── ProductDetail.module.scss
│   │   ├── Auth/
│   │   │   ├── Login.jsx
│   │   │   ├── Login.module.scss
│   │   │   ├── Signup.jsx
│   │   │   ├── Signup.module.scss
│   │   │   ├── PreferenceSurvey.jsx
│   │   │   └── PreferenceSurvey.module.scss
│   │   ├── AiCurator/
│   │   │   ├── AiIntro.jsx
│   │   │   ├── AiIntro.module.scss
│   │   │   ├── AiSurvey.jsx
│   │   │   ├── AiSurvey.module.scss
│   │   │   ├── AiResult.jsx
│   │   │   └── AiResult.module.scss
│   │   ├── CartOrder/
│   │   │   ├── Cart.jsx
│   │   │   ├── Cart.module.scss
│   │   │   ├── Checkout.jsx
│   │   │   ├── Checkout.module.scss
│   │   │   ├── OrderComplete.jsx
│   │   │   └── OrderComplete.module.scss
│   │   ├── MyPage/
│   │   │   ├── MyPageLayout.jsx
│   │   │   ├── MyPageLayout.module.scss
│   │   │   ├── MyHome.jsx
│   │   │   ├── MyHome.module.scss
│   │   │   ├── ProfileEdit.jsx
│   │   │   ├── ProfileEdit.module.scss
│   │   │   ├── OrderHistory.jsx
│   │   │   ├── OrderHistory.module.scss
│   │   │   ├── OrderDetail.jsx
│   │   │   ├── OrderDetail.module.scss
│   │   │   ├── WishList.jsx
│   │   │   ├── WishList.module.scss
│   │   │   ├── AiHistory.jsx
│   │   │   ├── AiHistory.module.scss
│   │   │   ├── EventHistory.jsx
│   │   │   └── EventHistory.module.scss
│   │   ├── Event/
│   │   │   ├── EventList.jsx
│   │   │   ├── EventList.module.scss
│   │   │   ├── RouletteEvent.jsx
│   │   │   └── RouletteEvent.module.scss
│   │   ├── Support/
│   │   │   ├── NoticeList.jsx
│   │   │   ├── NoticeList.module.scss
│   │   │   ├── NoticeDetail.jsx
│   │   │   ├── NoticeDetail.module.scss
│   │   │   ├── InquiryQnA.jsx
│   │   │   └── InquiryQnA.module.scss
│   │   ├── Admin/
│   │   │   ├── AdminLayout.jsx
│   │   │   ├── AdminLayout.module.scss
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Dashboard.module.scss
│   │   │   ├── UserManage.jsx
│   │   │   ├── UserManage.module.scss
│   │   │   ├── ProductManage.jsx
│   │   │   ├── ProductManage.module.scss
│   │   │   ├── AiLogManage.jsx
│   │   │   ├── AiLogManage.module.scss
│   │   │   ├── EventManage.jsx
│   │   │   └── EventManage.module.scss
│   │   └── NotFound/
│   │       ├── NotFound.jsx
│   │       └── NotFound.module.scss
│   │
│   ├── App.jsx
│   └── main.jsx
│
├── .env.local
├── .env.example
├── .gitignore
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── package.json
├── package-lock.json
├── README.md
└── vite.config.js
7. Naming Convention
JavaScript / React
변수 / 함수 / 객체 필드: camelCase
React Component: PascalCase
Event Handler: handleXxx
Boolean: isXxx, hasXxx, canXxx
예:

const productId = "liq_001";
const isAdultVerified = true;

function handleSubmit() {}
Firebase
Collection 이름은 소문자 복수형을 기본으로 한다.

사용 예정/확정 예:

users
products
pairings
orders
events
recommendations
guestSessions
aiRequestGuards
inquiries
새로운 Collection을 임의로 추가하지 않는다.

8. Styling Rules
기존 Figma / 화면설계를 기준으로 구현한다.
확정 UI를 임의로 재디자인하지 않는다.
페이지/컴포넌트 스타일은 SCSS Modules를 사용한다.
파일명은 ComponentName.module.scss 형식을 사용한다.
컬러 / 폰트 / spacing / breakpoint는 _variables.scss를 우선 사용한다.
공통 mixin은 _mixins.scss에서 관리한다.
global.scss는 main.jsx에서 한 번만 import한다.
모바일은 PC 화면을 단순 축소하지 않고 반응형으로 구성한다.
디자인이 확정되지 않은 부분은 임의의 새로운 디자인 규칙을 만들지 않는다.
Shared UI
아래 공통 UI가 존재하면 반드시 우선 재사용한다.

Button
Modal
Loading
ErrorState
EmptyState
Badge
Pagination
Tabs
ProductCard
QuestionCard
동일 목적의 컴포넌트를 다른 이름으로 중복 생성하지 않는다.

Deferred Design Tokens
정확한 아래 값은 팀 디자인 협의 후 _variables.scss에 반영한다.

breakpoint
color token
font token
spacing token
이 항목은 기능 개발을 막는 TBD로 취급하지 않는다.

9. Zustand / State Management
프로젝트 전역 상태 관리는 Zustand를 사용한다.

Core Rule
Store는 상태의 단일 원본(Source of Truth)이다.

Custom Hook은 상태를 별도로 중복 소유하지 않고 Store 상태를 사용하는 동작 로직만 담당한다.

useAuthStore
담당:

로그인 사용자 정보
role
isAdultVerified
useAiStore
담당:

AI 설문 응답
AI 추천 결과 임시 상태
비회원 AI 추천 결과는 useAiStore에서만 임시 유지한다.

useCartStore
담당:

장바구니 상품
상품별 수량
상품 추가
상품 삭제
수량 변경
장바구니 비우기
장바구니는 Zustand persist를 이용해 localStorage에 저장한다.

장바구니 데이터는 Firestore에 저장하지 않는다.

로그아웃 시 장바구니 상태와 관련 localStorage 데이터를 초기화한다.

useAiSurvey
상태 저장이 아닌 설문 동작 로직을 담당한다.

예:

nextStep
prevStep
답변 검증
설문 진행률 / 이동 로직
설문 답변의 실제 상태는 useAiStore를 사용한다.

useAdultCheck
성인인증 상태를 중복 저장하지 않는다.

담당:

성인인증 필요 여부 확인
성인인증 처리 흐름
실제 상태는 useAuthStore.isAdultVerified를 사용한다.

10. Authentication / User Rules
Login
이메일 + 비밀번호 방식만 사용한다.
UI 및 코드에서 로그인 식별자를 아이디라고 표현하지 않는다.
Firebase Authentication을 사용한다.
로그인 완료 후 회원의 Firestore users/{uid} 데이터를 조회하여 사용자 정보를 구성한다.
Signup
기본 입력:

nickname
email
password
passwordConfirm
약관 동의
phone, address는 회원가입에서 받지 않는다.
비밀번호 / 비밀번호 확인값은 Firestore에 저장하지 않는다.
비밀번호는 Firebase Authentication이 관리한다.
User Document
기본 구조:

{
  uid,
  email,
  nickname,
  role,
  status,
  isAdultVerified,
  createdAt,
  updatedAt
}
User Role
user
admin
규칙:

신규 회원 기본값은 user
관리자 계정만 admin
일반 사용자는 자신의 role을 직접 생성/변경할 수 없다.
관리자 여부의 실제 보안 기준은 Firestore Security Rules 및 서버 측 users/{uid}.role 검증이다.
useAuthStore.role은 UI 표시 및 Router 판단에 사용할 수 있으나 보안의 최종 기준으로 사용하지 않는다.
User Status
active
suspended
withdrawn
UI 표시:

active      → 정상 회원
suspended   → 이용 정지
withdrawn   → 탈퇴 회원
신규 회원 기본값:

active
휴면 회원 상태 등 추가 enum은 현재 구현 범위에 포함하지 않는다.

Profile
회원 프로필에 지속 저장하지 않는 값:

phone
address
회원정보 수정은 닉네임 등 기본 프로필 중심으로 처리한다.

배송지 / 연락처는 Checkout 주문 시점에만 입력한다.

11. Adult Verification
실제 본인인증 외부 API를 연결하지 않고 학습용 Mock 방식으로 처리한다.

기본 UI:

만 19세 이상입니다
만 19세 미만입니다
Adult User
만 19세 이상입니다 선택:

isAdultVerified = true
만 19세 미만입니다 선택:

성인 전용 AI 추천 / Checkout 접근 불가
생년월일 입력 및 실제 나이 계산 로직은 구현 범위에 포함하지 않는다.

Logged-in User
로그인 회원의 성인인증 상태는 회원 데이터에서 확인한다.
React 상태는 useAuthStore.isAdultVerified에서 관리한다.
Guest User
비회원 AI 추천을 위해 Firebase Anonymous Auth를 사용한다.
익명 UID는 성인인증 / rate limit을 위한 임시 식별자로만 사용한다.
성인인증 상태는 guestSessions/{anonymousUid}에서 확인한다.
guestSessions에는 최소 임시 정보만 저장한다.
예:

{
  adultVerified: true,
  expiresAt
}
규칙:

guestSessions 직접 client write 금지
Cloud Functions(Admin SDK)을 통해 기록
expiresAt 기반 Firestore TTL 적용
비회원 성인인증 상태를 로그인/회원가입 후 정회원 계정으로 자동 이전하지 않는다.
12. Product Data Rules
Initial Data Source
프로젝트 초기 상품 JSON:

src/data/products/
├── liquors.json
├── foods.json
├── glasses.json
├── gifts.json
└── index.js
페어링 초기 JSON:

src/data/pairings.json
초기 JSON의 최종 관리자는 상품 담당자이다.

다른 담당자는 상품 JSON의 필드명 / ID / 카테고리 / 타입을 임의 변경하지 않는다.

Runtime Source of Truth
앱에서 사용하는 실제 상품·페어링 데이터의 기준은 Firestore이다.

초기 JSON은 초기 데이터 / Mock 원본으로 사용한다.
실제 서비스 실행 중 상품 상태, 재고, 페어링은 Firestore 데이터를 기준으로 한다.
AI Cloud Functions 역시 Firestore의 실제 상품·페어링 데이터를 조회한다.
Common Product Fields
camelCase 사용:

{
  productId,
  productName,
  brandManufacturer,
  price,
  discountRate,
  volume,
  productDescription,
  allergyCautionInfo,
  productType,
  stock,
  status,
  imageUrl
}
상품 JSON에 이미 정의된 필드 타입은 데이터 담당자 협의 없이 변경하지 않는다.

Product ID Prefix
liq_ → 전통주
snk_ → 안주
gls_ → 술잔 / 선물세트
productType
전통주
안주
주류용품
ALL은 실제 상품 데이터 값으로 저장하지 않고 UI 필터값으로만 사용한다.

liquorType
탁주
약주
청주
과실주
증류주
리큐르
timeOfDay
낮의 결
밤의 결
timeOfDay는 liquorType과 분리한다.

snackType
간편식
상온안주
디저트
즉석조리 값은 사용하지 않는다.

glassType
술잔
선물세트
Product Status
selling
soldOut
hidden
UI 표시:

selling → 판매 중
soldOut → 품절
hidden  → 숨김
Pairing Rules
초기 페어링 관계:

{
  liquorId,
  pairedFoodIds,
  recommendedGlassIds
}
규칙:

상품 이름이 아닌 productId로 연결한다.
pairedFoodIds는 안주 ID 배열이다.
recommendedGlassIds는 AI에서 추천할 술잔/주류용품 ID 배열이다.
recommendedGlassIds에는 술잔뿐 아니라 선물세트 ID가 포함될 수 있다.
동일한 페어링 관계를 여러 상품 JSON에 중복 정의하지 않는다.
Runtime에서는 Firestore의 실제 페어링 데이터를 기준으로 한다.

앞 단계가 실패하면 뒤 단계를 실행하지 않는다.

16. AI Request ID / Rate Limit
requestId
동일 requestId 기존 기록과 현재 요청의 아래 값이 모두 동일하면 기존 결과를 반환한다.

userId
surveyVersion
정규화된 surveyAnswers
surveyAnswers 비교:

객체 key 정렬
deep equality
단순 JSON.stringify() 문자열 비교에만 의존하지 않는다.
동일 requestId에 다른 내용:

REQUEST_ID_CONFLICT
Rate Limit
Collection:

aiRequestGuards/{uid}
최소 데이터:

{
  lastRequestAt,
  expiresAt
}
규칙:

로그인 UID / 익명 UID 모두 동일 기준
10초 이내 반복 요청 차단
OpenAI 호출하지 않음
RATE_LIMITED 반환
client 직접 write 금지
Admin SDK 기록
expiresAt 기반 TTL 적용
17. AI Product Filtering / Fallback
상품 후보는 Firestore의 실제 상품 / 페어링 데이터를 사용한다.

filterProducts.js 적용 후 liquorId 후보 개수 기준:

3개 이상 → OpenAI 추천 진행
1~2개   → OpenAI 미호출 / 안전 후보 기반 fallback
0개     → NO_AVAILABLE_PRODUCTS
규칙:

foodId / glassId 개수와 liquor 후보 판단을 혼동하지 않는다.
fallback에서도 알레르기 및 강제 제외 조건을 해제하지 않는다.
Filter 구조 변경 시 filterVersion을 증가시킨다.
18. AI Response Rules
OpenAI는 서버가 제공한 후보 안에서만 상품을 선택한다.

추천 항목:

{
  rank,
  liquorId,
  foodId,
  glassId,
  reason
}
성공 Response:

{
  requestId,
  recommendations,
  aiMeta,
  saveStatus
}
aiMeta
{
  model,
  promptVersion,
  filterVersion,
  fallbackUsed,
  candidateCount,
  filteredOutCount,
  latencyMs
}
saveStatus
success
failed
not_applicable
규칙:

OpenAI Response 검증 실패 시 최대 1회 재요청
재요청 후에도 실패하면 안전 후보 fallback
fallback 사용 시 aiMeta.fallbackUsed = true
timeout / quota 발생 시 안전 후보가 있으면 fallback
timeout / quota fallback 성공 시 aiMeta.model = null
추천 조합은 항목 간 중복되지 않아야 한다.
19. AI Error Codes
공통 오류 코드:

INVALID_SURVEY
UNSUPPORTED_SURVEY_VERSION
ADULT_VERIFICATION_REQUIRED
NO_AVAILABLE_PRODUCTS
RATE_LIMITED
REQUEST_ID_CONFLICT
AI_TIMEOUT
AI_QUOTA_EXCEEDED
INVALID_AI_RESPONSE
AI_RECOMMENDATION_FAILED
recommendationApi.js는 오류를 다음 형태로 정규화한다.

{
  code,
  message
}
20. AI Recommendation Save Rules
추천 기록은 Cloud Functions에서만 생성한다.

클라이언트는 recommendations에 직접 create/update 하지 않는다.

Save Target
로그인 회원: 저장
비회원: 저장하지 않음
문서 경로:

recommendations/{requestId}
AI 추천 실행 1회 = Firestore 문서 1개

여러 추천 세트는 하나의 recommendations 배열로 저장한다.

Recommendation Document
{
  requestId,
  userId,
  createdAt,
  surveyVersion,
  surveyAnswers,
  userPreferenceSnapshot,
  recommendations,
  aiMeta
}
규칙:

userId: request.auth.uid
createdAt: 서버 기준 timestamp
추천 당시 surveyAnswers Snapshot 보존
추천 당시 userPreferenceSnapshot 보존
기본 취향이 없는 회원은 userPreferenceSnapshot: null
AiHistory는 null인 경우 별도 UI 처리
상품 전체 객체를 중복 저장하지 않는다.
추천 상품은 liquorId, foodId, glassId 기준 저장
상품명 등 최소 Snapshot은 필요 시 표시용으로만 추가
AI Response 정상 검증 직후 1회 저장
AiResult 렌더링 / 새로고침 시 재저장하지 않는다.
외부 OpenAI 호출은 Firestore Transaction 밖에서 처리
저장 확인 / 생성 단계만 Transaction 또는 원자적 create 방식 사용
Save Failure
AI 성공 + Firestore 저장 실패:

saveStatus: failed
추천 결과는 사용자에게 반환
자동 재시도하지 않음
Functions 로그에 requestId / userId / 오류 기록
정상 저장 또는 동일 정상 기록 존재:

saveStatus: success
비회원:

saveStatus: not_applicable
Guest Result
비회원 설문 / 추천 결과:

useAiStore 임시 상태만 사용
Firestore 저장 금지
localStorage 저장 금지
새로고침 / 세션 초기화 시 소멸
회원가입 / 로그인 후 정회원 추천 기록으로 소급 저장하지 않는다.
익명 상태의 성인인증 / 추천 결과도 정회원 계정으로 자동 이전하지 않는다.
History Compatibility
과거 추천 기록은 기본적으로 수정하지 않는다.
설문 Schema 변경 시 과거 추천 기록을 강제 마이그레이션하지 않는다.
AiHistory는 surveyVersion과 실제 필드 존재 여부를 확인해 이전 기록도 안전하게 렌더링한다.
21. AI Admin / Security Rules
관리자 권한 기준:

users/{uid}.role === "admin"
Server
Cloud Functions에서 관리자 여부 확인이 필요한 경우:

request.auth.uid 확인
users/{uid} 조회
role === "admin" 검증
Firestore Rules
관리자 권한 역시 현재 로그인 사용자의 users/{uid}.role === "admin" 기준으로 검증한다.

Client
useAuthStore.role은 UI 표시용
AdminRoute는 관리자 화면 접근 판단용
실제 데이터 보안의 최종 기준은 Firestore Rules / 서버 검증
Recommendation Access
일반 회원:

자신의 userId와 일치하는 추천 기록만 조회 가능
추천 기록 직접 create/update 금지
관리자:

role 검증 후 전체 AI 추천 로그 조회 가능
AiLogManage
전체 로그를 한 번에 조회하지 않는다.
createdAt 기준 페이지네이션
기간 / 회원 / fallback 여부 등의 필터는 가능한 범위에서 Firestore Query 사용
필요한 Composite Index는 firestore.indexes.json에 정의
Role Protection
일반 사용자는 자신의 role을 직접 생성/수정할 수 없다.
회원정보 수정에서 nickname 등 일반 필드는 수정 가능
role은 별도 보호
22. Firebase Client Rules
firebase/firebase.js
Firebase App 초기화

firebase/auth.js
담당:

signup
login
anonymous auth
logout
auth state 확인
firebase/firestore.js
담당:

Firestore 공통 조회
공통 CRUD
페이지별 비즈니스 로직을 firestore.js 하나에 무제한 추가하지 않는다.

복잡한 도메인 로직은 팀 협의 후 Service로 분리한다.

Preferred Call Direction
Component / Page
       ↓
Hook / Store
       ↓
Service / Firebase Module
       ↓
Firebase
UI 컴포넌트에 Firebase 비즈니스 로직을 과도하게 직접 작성하지 않는다.

23. Cart Rules
/cart는 로그인 회원 전용
비회원 장바구니 미구현
Firestore 저장 금지
useCartStore 사용
Zustand persist + localStorage
상품 / 수량 중심 최소 상태 사용
로그아웃 시 장바구니 초기화
24. Order / Checkout Rules
Payment
실제 PG 미연동
Mock 결제
주문 완료 시 Firestore orders 저장
저장 성공 후 장바구니 비우기
OrderComplete 이동
Shipping
배송 정보는 회원 Profile에 지속 저장하지 않는다.

Checkout에서만 입력:

shipping: {
  recipient,
  phone,
  address,
  detailAddress
}
Order Item Snapshot
상품 데이터가 이후 변경되어도 과거 주문이 변하지 않도록 주문 당시 최소 Snapshot을 저장한다.

items: [
  {
    productId,
    productName,
    price,
    quantity,
    imageUrl
  }
]
규칙:

price는 주문 당시 실제 적용 가격
originalPrice, salePrice, discountRate 등은 주문에 불필요하게 중복 저장하지 않는다.
Order Document
{
  orderId,
  userId,
  items,
  shipping,
  paymentMethod,
  totalAmount,
  status,
  createdAt
}
복잡한 주문 Schema로 임의 확장하지 않는다.

Order Status
Firestore:

paid
preparing
shipped
delivered
cancelled
UI:

paid       → 결제 완료
preparing  → 상품 준비 중
shipped    → 배송 중
delivered  → 배송 완료
cancelled  → 주문 취소
공통 상수:

constants/orderStatus.js
25. Event Rules
Access / Participation
이벤트 목록은 전체 접근 가능
룰렛 이벤트 참여는 로그인 회원만 가능
동일 회원은 동일 이벤트에 1회 참여
회원 식별 기준은 Firebase Auth uid
참여 결과 / 경품 정보는 Firestore에 기록
MyPage 이벤트 참여 내역에서 확인
Roulette
프론트에서 Math.random() 기반 가중치 추첨 사용
학습용 Mock 추첨
실제 서비스 수준의 보안 추첨 목적이 아님
확률:

1등  1%
2등  4%
3등 10%
4등 20%
5등 30%
6등 35%
전체 합계: 100%

낙첨 없음
미당첨 / 낙첨 상태 사용하지 않음
Reward Type
product
point
coupon 타입 사용하지 않음
상품 / 포인트 지급 결과는 MyPage에서 확인
포인트는 회원에게 누적
장바구니 / Checkout에서 포인트 또는 이벤트 보상을 실제 적용하는 기능은 구현하지 않는다.
포인트 지급 후 30일 소멸 등 안내 문구는 UI 문구로만 사용
실제 만료 / 자동 소멸 로직 미구현
Event Status
Firestore:

upcoming
ongoing
ended
UI:

upcoming → 진행 예정
ongoing  → 진행 중
ended    → 종료
공통 상수:

constants/eventStatus.js

규칙:

장바구니 상품 없으면 Checkout 진행 불가
OrderComplete는 정상 생성 주문 정보가 있는 경우에만 표시
주문 정보 없이 직접 접근 시 주문내역 또는 메인 이동
MyPage
Page
URL
Access
MyHome
/mypage
로그인 회원
ProfileEdit
/mypage/profile
로그인 회원
OrderHistory
/mypage/orders
로그인 회원
OrderDetail
/mypage/orders/:orderId
로그인 회원
WishList
/mypage/wishlist
로그인 회원
AiHistory
/mypage/ai-history
로그인 회원
EventHistory
/mypage/events
로그인 회원
규칙:

주문 상세는 본인 주문만 조회
AI 추천 기록은 본인 기록만 조회
Event
Page
URL
Access
EventList
/events
전체
RouletteEvent
/events/roulette
로그인 회원
Support
Page	URL	Access
NoticeList	/support/notices	전체
NoticeDetail	/support/notices/:noticeId	전체
InquiryQnA	/support/inquiry	FAQ 전체 / 문의 작성 로그인 회원
Admin
Page
URL
Access
Dashboard
/admin
관리자
UserManage
/admin/users
관리자
ProductManage
/admin/products
관리자
AiLogManage
/admin/ai-logs
관리자
EventManage
/admin/events
관리자
관리자 기준:

users/{uid}.role === "admin"
NotFound
* → NotFound.jsx
Route Notes
SplashIntro.jsx 별도 URL 없음
/ 진입 시 MainPage 전에 표시되는 인트로 컴포넌트
동적 route의 :productId, :orderId, :noticeId에는 실제 데이터 ID 사용
로그인 회원 전용 페이지는 ProtectedRoute
관리자 페이지는 AdminRoute
관리자 URL 접근 제한만으로 보안을 보장하지 않는다.
실제 데이터 접근은 Firestore Rules 및 서버 검증 적용
27. Loading / Error / Empty Rules
공통 상태 UI를 우선 사용한다.

Loading
ErrorState
EmptyState
ErrorBoundary
페이지별로 동일한 Loading / Error / Empty 컴포넌트를 중복 생성하지 않는다.

AI 오류는 공통 Error Code를 기준으로 사용자용 메시지로 변환한다.

28. Environment / Secret Rules
Frontend
.env.local

Firebase Client 환경변수
Git에 실제 값을 올리지 않는다.
.env.example

필요한 환경변수 이름만 공유
실제 secret 값 금지
Functions
functions/.secret.local

로컬 OpenAI Secret
Git commit 금지
Never
API Key를 JSX / JS에 직접 작성
OpenAI Secret을 Frontend 환경에 노출
Secret 파일 commit
29. Firestore / Security Rules
보안은 UI Route Guard만으로 처리하지 않는다.

반드시 실제 firestore.rules에 데이터 접근 정책을 반영한다.

최소 원칙:

일반 사용자 role 직접 수정 불가
일반 회원 본인 추천 기록만 조회
추천 기록 client create/update 금지
AI 추천 기록 생성은 Cloud Functions
Admin 권한은 users/{uid}.role === "admin"
관리자 전용 데이터는 동일 role 기준으로 보호
guestSessions client direct write 금지
aiRequestGuards client direct write 금지
복합 Query에 필요한 Index는:

firestore.indexes.json
에 명시한다.

30. Source of Truth Summary
중복 기준을 만들지 않는다.

Domain
Source of Truth
로그인 사용자 전역 상태
useAuthStore
AI 설문 상태
useAiStore
장바구니 상태
useCartStore
상품 초기 원본
src/data/products/*.json
페어링 초기 원본
src/data/pairings.json
Runtime 상품 / 페어링
Firestore
AI 상품 / 페어링 기준
Firestore
상품 간 관계
Firestore pairings / 초기 pairings.json
URL
src/routes/paths.js
AI 설문 key / enum
constants/aiSurvey.js
Preference 질문
constants/preferenceSurvey.js
공통 취향 축
constants/tasteAxis.js
주문 상태
constants/orderStatus.js
이벤트 상태
constants/eventStatus.js
관리자 실제 권한
users/{uid}.role + Firestore Rules / server validation
AI 추천 기록
Firestore recommendations/{requestId}
31. Codex Rules
Codex는 다음 순서와 규칙을 따른다.

Before Work
AGENTS.md 읽기
요청 범위 확인
담당자 소유 영역 확인
기존 Component / Hook / Store / Service / Constant 검색
재사용 가능한 기존 코드 확인
During Work
요청받지 않은 페이지를 동시에 리팩터링하지 않는다.
새 dependency를 임의 설치하지 않는다.
새 Store를 임의 생성하지 않는다.
Firebase Collection / Field / Enum을 임의 생성하지 않는다.
상품 JSON 구조를 임의 변경하지 않는다.
기존 공통 UI를 중복 생성하지 않는다.
기존 UI를 임의 재설계하지 않는다.
Secret을 코드에 직접 작성하지 않는다.
다른 담당자 파일을 불필요하게 수정하지 않는다.
Store의 상태를 별도 useState로 복제하지 않는다.
Route 문자열을 페이지에 임의 하드코딩하지 않는다.
AI Request / Response 필드명을 임의 변경하지 않는다.
상품 Runtime Source를 Client Mock JSON로 임의 대체하지 않는다.
After Work
수정 파일 목록 확인
요청 범위를 벗어난 변경 확인
import path 확인
lint 오류 확인
build 오류 확인
변경 내용 보고
남은 문제 / 의존사항 보고
32. Definition of Done
기능 완료 전 확인:

☐담당 범위 안에서 작업했는가
☐기존 공통 UI를 재사용했는가
☐Store / Hook 상태가 중복되지 않는가
☐Firebase Schema를 임의 추가하지 않았는가
☐관리자 role 보안 기준을 지켰는가
☐상품 ID / 카테고리 / 상태 규칙을 지켰는가
☐Runtime 상품 데이터는 Firestore 기준인가
☐SCSS Modules 규칙을 지켰는가
☐반응형을 확인했는가
☐Loading / Error / Empty 상태를 처리했는가
☐Route Guard를 적용했는가
☐실제 데이터 권한은 Firestore Rules에서도 보호되는가
☐API Key / Secret 노출이 없는가
☐lint 오류가 없는가
☐build 오류가 없는가
☐다른 담당자의 기능을 깨뜨리지 않았는가
33. Change Management
이 문서는 프로젝트 진행 중 변경될 수 있다.

아래 항목은 변경 전에 반드시 관련 담당자 또는 팀과 협의한다.

Folder Structure
Routes
Firebase Schema
Firestore Security Rules
Product JSON Schema
Pairing Schema
AI Request / Response Contract
Zustand Store 책임
Status Enum
공통 UI
디자인 공통 변수
Dependency
규칙이 변경되면 코드만 바꾸지 말고 AGENTS.md도 함께 갱신한다.

34. Deferred Non-blocking Item
현재 기능 개발을 막는 기술 TBD는 없다.

다만 아래 디자인 공통값은 팀 일정에 따라 추후 확정하여 _variables.scss에 반영한다.

breakpoint 실제 수치
color token
font token
spacing token
해당 값이 확정되기 전까지 기존 Figma / 팀 공통 디자인 기준을 우선하며 임의 값을 프로젝트 표준으로 확정하지 않는다.