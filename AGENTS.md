# JAJAK AGENTS.md

> Version: 1.9
> Last updated: 2026-09-10
> Purpose: JAJAK 팀 프로젝트의 프론트엔드 아키텍처, 데이터 계약, 개발 컨벤션과 협업 규칙을 Codex 및 모든 팀원이 동일하게 따르기 위한 공통 지침이다.  
> 이 문서는 코드 작성 전 우선 확인한다. 확정된 팀 규칙과 충돌하는 임의 구현은 하지 않는다.

---

# 1. Project Overview

JAJAK은 전통주를 중심으로 안주와 주류용품을 함께 추천하는 AI 큐레이션 쇼핑몰 프로젝트이다.

주요 기능:

- 이메일 기반 회원가입 / 로그인
- 성인인증
- 전통주 / 안주 / 주류용품 상품 조회
- AI 주안상 큐레이션
- 막둥이 주막 체험형 콘텐츠
- 찜
- 장바구니
- Mock 결제 / 주문
- 마이페이지
- 이벤트 룰렛
- 관리자 페이지
- 공지사항 / 문의하기 / 자주 묻는 질문

본 프로젝트는 학습용 포트폴리오 프로젝트이며 실제 상용 판매/결제 서비스가 아니다.

---

# 2. Tech Stack

## Frontend

- React 19
- Vite 8
- JavaScript + JSX
- React Router 7
- Sass / SCSS Modules
- GSAP
- Chart.js
- react-chartjs-2
- react-helmet-async

## Backend / External

- Firebase Authentication
- Cloud Firestore
- Firebase Cloud Functions
- OpenAI API

## Runtime / Deploy

- Frontend: Vercel
- Firebase Functions: Node.js 24

## Package Manager

- npm
- `package-lock.json`을 기준으로 한다.
- 새로운 npm package는 팀 합의 없이 임의로 추가하지 않는다.

---

# 3. Core Collaboration Rules

1. 작업 전 반드시 루트의 `AGENTS.md`를 읽는다.
2. 이미 존재하는 Component / Hook / Service / Utility / Constant를 우선 재사용한다.
3. 다른 담당자의 페이지나 공통 파일을 요청 없이 임의 수정하지 않는다.
4. 새로운 Firebase Collection / Field / Status 값을 임의 생성하지 않는다.
5. 상태는 필요한 가장 가까운 범위에서 React 기본 상태 관리로 처리한다.
6. Custom Hook은 반복되는 동작 로직이 실제로 필요할 때만 만든다.
7. 동일 목적의 공통 UI를 중복 생성하지 않는다.
8. 확정된 Figma / 화면설계 구조를 임의로 재디자인하지 않는다.
9. 구현 범위가 불명확하면 기능을 임의 확장하지 않고 담당자와 확인한다.
10. API Key / Firebase Secret / OpenAI Secret을 소스 코드에 직접 작성하지 않는다.
11. 작업 후 수정한 파일과 변경 내용을 명확히 보고한다.
12. 팀에서 확정한 필드명 / enum / route / schema를 임의로 변경하지 않는다.
13. 기존 JSON의 필드 타입을 데이터 담당자 협의 없이 임의 변환하지 않는다.
14. Runtime 상품 정보는 Firestore를 기준으로 하며, 이 문서에 명시한 표시용 fallback 외에는 seed/reference JSON을 Runtime 데이터처럼 사용하지 않는다.

---

# 4. Team Ownership

판단 순서:

1. 아래 `소유 경로`로 기본 담당자를 확인한다.
2. 공통 파일이나 공동 작업은 `연동 경계`를 따른다.
3. 담당 밖의 기능·데이터·디자인을 변경해야 하면 해당 담당자에게 먼저 공유한다.

경로의 `{A,B}`는 문서용 묶음 표기이며, 명령 실행 전 실제 파일 경로를 확인한다.

## 김지우 — 공통 UI / Routing / Preference / AI

### 소유 경로

- 공통 UI: `src/components/common/{Header,DesktopHeader,MobileHeader,MobileBottomNav,SearchModal,MobileSearchModal,SiteLayout,Footer,ScrollToTop,AdultModal}*`
- 관리자 공통 UI: `src/components/admin/*`, `src/styles/admin/*`
- 마이페이지 공통 UI 통합: `src/components/mypage/*`
- Preference: `src/pages/Auth/Preference*`, `src/constants/{preferenceSurvey,tasteAxis}.js`
- AI: `src/pages/AiCurator/*`, `src/components/ai/*`, `src/hooks/{useAiSurvey,useAdultCheck}.js`, `src/constants/aiSurvey.js`
- AI 기록·관리: `src/pages/MyPage/{AiHistory,AiHistoryDetail,AiPreference}*`, `src/pages/Admin/AiLogManage*`
- Functions: `functions/src/*`
- Routing: `src/App.jsx`, `src/routes/*`

### 책임

- Header·Footer·검색·GNB와 전체 Route / nested routing
- Preference 단계와 `users/{uid}.userPreference` 계약
- 회원·비회원 AI 설문, 추천, 기록, 막둥이 주막, OpenAI / Functions 연동
- 관리자 공통 UI·반응형 통합과 Dashboard Firestore 집계 연동
- 최종 페이지·사용자 흐름·공통 용어·`dev` 통합본 점검

### 연동 경계

- Auth 성공 후 `/preference` 진입까지는 이영기, 이후 Preference 흐름은 김지우가 담당한다.
- AdminLayout 기본 구조와 개별 관리 기능은 기존 담당자가 유지하며 김지우는 공통 UI·Routing·디자인 통합을 담당한다.
- `src/components/mypage/*`는 여러 담당자의 MyPage 화면이 공유하는 통합 UI이며 기능·데이터 책임은 각 화면 담당자가 유지한다.
- Dashboard 초기 UI는 백현정, Firestore 집계와 상세 경로 연결은 김지우가 담당한다.
- `useAdultCheck.js`와 익명 인증 연결은 목표 구조이며 현재 placeholder / 미연결 상태다.

## 김태은 — 상품 / 상품 데이터 / 이벤트

### 소유 경로

- 상품 데이터: `src/data/products/*`, `src/data/pairings.json`, `src/services/productCatalog.js`
- 상품 UI: `src/components/ui/ProductCard/*`, `src/components/shop/*`, `src/pages/Shop/*`
- 상품 관리: `src/pages/Admin/ProductManage*`
- 이벤트: `src/pages/Event/*`, `src/data/{events,quizs}.json`, `src/constants/eventStatus.js`
- 이벤트 데이터: `src/services/eventParticipation.js`
- 이벤트 기록·관리: `src/pages/MyPage/{EventHistory,EventWinningHistory}*`, `src/pages/Admin/EventManage*`

### 책임

- 상품 ID·Schema·카테고리·상태·재고와 seed/reference·Firestore 연동
- 상품 목록·상세·검색·필터·정렬·페이지네이션·카테고리 안내·반응형 UI
- 상품 갤러리·구매 패널·리뷰·페어링과 `pairedProductIds`
- Admin 상품 CRUD, 이미지·맛 키워드·재고·노출·리뷰 집계
- EventList / Ready / Roulette / CardGame / OX Quiz 전체 흐름
- 이벤트 참여 제한·추첨·결과·경품·포인트·당첨 내역
- Admin 이벤트 CRUD·배너·참여 현황·당첨자 UI
- `products`·`pairings`·`events`·`eventParticipations`와 관련 Rules 점검

### 연동 경계

- 상품 seed/reference JSON의 최종 관리자는 김태은이다.
- Runtime 상품 정보는 Firestore를 기준으로 하며 표시용 fallback은 12장의 규칙을 따른다.
- 참여형 이벤트는 `eventParticipations/{eventId}_{uid}` 구조를 공통으로 사용한다.
- 참여 제한은 각 이벤트의 `participationLimit`을 기준으로 하며 관리자는 제한 없이 참여할 수 있다.
- Wishlist의 사용자 흐름은 이영기, 상품 데이터 조합은 상품 계약을 따른다.

## 백현정 — Main / Brand / Dashboard / Design

### 소유 경로

- Main: `src/pages/Main/*`, `src/components/ui/MainSectionNav/*`
- Brand: `src/pages/Brand/*`
- Dashboard UI: `src/pages/Admin/Dashboard*`
- 예외 화면: `src/pages/NotFound/*`
- 담당 화면의 브랜드·캐릭터·배너 에셋

### 책임

- Splash, Journey, Hero, Best Seller와 메인 전체 섹션·상태
- Main / Brand의 GSAP Reveal·Wheel·Snap·Sticky 인터랙션
- 브랜드 스토리와 막동이 소개
- Dashboard 초기 Layout·차트·반응형 UI
- NotFound 안내와 복귀 동선
- Figma 기준 색상·타이포·여백·이미지·반응형 기준 협의
- Shop·Event·Support·Cart와 DesktopHeader의 디자인 보완

### 연동 경계

- Main / Brand 전용 Section과 Hook은 각 페이지 폴더 안에서 관리할 수 있다.
- Dashboard 초기 UI는 백현정, Firestore 집계 연동과 관리자 상세 이동은 김지우의 통합 작업으로 구분한다.
- Dashboard는 AdminLayout을 사용하며 Layout 기본 구조는 이유진, 공통 UI 통합은 김지우 영역이다.
- 공통 디자인 Token 파일 변경은 팀 협의 후 진행한다.
- 다른 담당 페이지를 디자인 보완할 때 기능·데이터 구조와 원 담당자의 결정권을 유지한다.

## 이영기 — Auth / 고객센터 / Wishlist

### 소유 경로

- Auth: `src/pages/Auth/{Login,Signup}*`, `src/firebase/auth.js`
- 고객센터: `src/pages/Support/*`
- Wishlist: `src/pages/MyPage/WishList*`
- 상품 상세의 인증·찜 연동 영역

### 책임

- 이메일 회원가입·로그인·로그아웃, 유효성, 로그인 유지와 정지 회원 차단
- 회원 문서 초기값 생성, 익명 인증 함수, `/preference` 진입 연결
- Notice 목록·상세, FAQ 검색·분류
- 1:1 문의 작성·등록·조회와 문의 유형
- `notices`·`inquiries` Firestore 연동
- Wishlist 조회·삭제와 장바구니 이동
- ProductDetail의 찜·회원 연동 협업

### 연동 경계

- 로그인·회원가입·로그아웃 기능 자체는 이영기가 담당한다.
- `/preference` 진입 이후 설문 UI와 저장은 김지우가 담당한다.
- 익명 인증 함수는 존재하지만 AdultModal / AI 흐름에는 아직 연결되지 않았다.
- Wishlist가 표시하는 현재 상품 정보는 김태은의 상품 데이터 계약을 따른다.

## 이유진 — Cart / Order / MyPage / Admin / Docs

### 소유 경로

- Cart / Order: `src/pages/CartOrder/*`, `src/utils/cartStorage.js`
- MyPage 공통·회원·주문: `src/pages/MyPage/{MyPageLayout,MyHome,ProfileEdit,AddressBook,PointHistory,FrequentPurchase,ClaimHistory,InquiryHistory,OrderHistory,OrderDetail}*`
- Admin 공통·운영: `src/pages/Admin/{AdminLayout,UserManage,OrdersManage,NoticeManage,ReviewManage}*`
- 문서: `AGENTS.md`, `README.md`

### 책임

- Cart 선택·수량·삭제와 `jajak_cart` 계약
- Checkout 상품 검증·배송지·포인트·Mock 결제·주문 저장
- 주문 완료·목록·검색·필터·상세·취소·Cart 초기화
- MyPage Layout·회원 요약·프로필·배송지·포인트·자주 구매·클레임·문의
- Admin Layout과 회원·주문·공지·리뷰 관리
- `users/{uid}`·주문 데이터·`role`·`status` 연동
- MyPage / Admin 공통 디자인·반응형 구조
- 프로젝트 문서와 담당 데이터 계약 관리

### 연동 경계

- AdminHeader / AdminFooter는 김지우 공통 영역이며 AdminLayout에서 재사용한다.
- 로그인·회원가입·로그아웃 인증 기능 자체는 이영기 영역이다.
- 비밀번호 변경과 회원탈퇴는 이번 구현 범위에 포함하지 않는다.
- AiHistory / AiPreference / EventHistory / EventWinningHistory는 각각 김지우·김태은 기능 영역이며 MyPageLayout을 공유한다.

---

# 5. Protected / Shared Files

아래 파일 또는 영역은 프로젝트 전체에 영향을 주는 공통 파일이므로 담당자 또는 팀 합의 없이 임의 수정하지 않는다.

## 공통 레이아웃 / 라우팅

- `src/components/admin/AdminHeader.jsx`
- `src/components/admin/AdminHeader.module.scss`
- `src/components/admin/AdminFooter.jsx`
- `src/components/admin/AdminFooter.module.scss`
- `src/components/admin/AdminEmptyState.jsx`
- `src/components/admin/AdminEmptyState.module.scss`
- `src/components/admin/AdminFilterBar.jsx`
- `src/components/admin/AdminFilterBar.module.scss`
- `src/components/admin/AdminPageHeader.jsx`
- `src/components/admin/AdminPageHeader.module.scss`
- `src/components/admin/AdminPanel.jsx`
- `src/components/admin/AdminPanel.module.scss`
- `src/components/admin/AdminStatusBadge.jsx`
- `src/components/admin/AdminStatusBadge.module.scss`
- `src/components/admin/AdminSummaryCard.jsx`
- `src/components/admin/AdminSummaryCard.module.scss`
- `src/components/common/Header.jsx`
- `src/components/common/DesktopHeader.jsx`
- `src/components/common/MobileHeader.jsx`
- `src/components/common/MobileBottomNav.jsx`
- `src/components/common/Footer.jsx`
- `src/components/common/SiteLayout.jsx`
- `src/components/common/AdultModal.jsx`
- `src/components/common/SearchModal.jsx`
- `src/components/common/MobileSearchModal.jsx`
- `src/components/common/ScrollToTop.jsx`
- 공통 Header / Footer 관련 `*.module.scss`
- `src/pages/MyPage/MyPageLayout.jsx`
- `src/pages/MyPage/MyPageLayout.module.scss`
- `src/pages/MyPage/MyPageErrorContent.jsx`
- `src/pages/MyPage/MyPageErrorContent.module.scss`
- `src/pages/Admin/AdminLayout.jsx`
- `src/pages/Admin/AdminLayout.module.scss`
- `src/pages/Admin/AdminErrorContent.jsx`
- `src/pages/Admin/AdminErrorContent.module.scss`
- `src/components/mypage/*`
- `src/App.jsx`
- `src/routes/*`

## Firebase / Functions

- `src/firebase/firebase.js`
- `src/firebase/auth.js`
- `src/firebase/firestore.js`
- `firebase.json`
- `.firebaserc`
- `firestore.rules`
- `firestore.indexes.json`
- `functions/package.json`
- `functions/package-lock.json`
- `functions/src/index.js`
- `functions/src/recommendation.js`
- `functions/src/utils/*`

## 공통 스타일

- `src/styles/*`

## 공용 데이터 / 설정

- `src/data/products/*.json`
- `src/data/products/index.js`
- `src/data/events.json`
- `src/data/pairings.json`
- `src/data/quizs.json`
- `src/data/tavernGame.js`
- `src/services/eventParticipation.js`
- `src/services/productCatalog.js`
- `src/services/recommendationApi.js`
- `src/components/shop/*`
- `src/components/ui/MainSectionNav/*`
- `src/constants/*`
- `src/utils/cartStorage.js`
- `vite.config.js`
- `vercel.json`
- `.oxlintrc.json`
- `.gitignore`
- `.env.example`
- `AGENTS.md`
- `README.md`
- `package.json`
- `package-lock.json`

공용 JSON 데이터는 해당 데이터 담당자가 관리하며, 다른 팀원이 수정해야 하는 경우 담당자에게 먼저 공유한 뒤 수정한다.
공통 파일 수정이 필요한 경우 기존 담당자 또는 관련 팀원에게 먼저 공유한 뒤 수정한다.

## 패키지 관련 주의

- 새로운 라이브러리가 필요한 경우 팀원에게 먼저 공유하고 합의한 뒤 설치한다.
- 패키지는 `npm install <package-name>` 명령으로 설치한다.
- `package.json`, `package-lock.json`을 임의로 직접 수정하거나 삭제하지 않는다.
- 최신 `dev`를 반영한 뒤 dependency가 변경되었거나 누락된 경우 프로젝트 루트에서 `npm install`을 실행한다.
- Functions dependency가 변경된 경우에는 `functions/`에서 별도로 `npm install`이 필요할 수 있다.

## 환경변수 주의

- `.env.local`은 개인 로컬 환경설정 파일이므로 GitHub에 절대 업로드하지 않는다.
- `functions/.secret.local` 역시 GitHub에 절대 업로드하지 않는다.
- Frontend 환경변수를 추가해야 하는 경우 실제 값은 `.env.local`에 작성하고 변수명만 `.env.example`에 추가한다.
- OpenAI API Key 등 비밀값을 React의 `VITE_` 환경변수로 저장하지 않는다.
- OpenAI Secret 등 서버 비밀값은 Frontend 코드 또는 Frontend 환경변수에 노출하지 않는다.

## Git 작업 주의

- `main`, `dev` 브랜치에는 직접 작업하거나 push하지 않는다.
- 실제 작업은 팀장이 할당한 각자의 개인 브랜치에서 진행한다.
- 작업 시작 전 최신 `dev`를 자신의 브랜치에 반영한다.
- 공통 파일 충돌이 발생한 경우 임의로 한쪽 코드를 선택하지 않고 담당자와 확인한 뒤 해결한다.
- `git push --force`는 사용하지 않는다.
- 작업 완료 후 `npm run dev`로 수정 화면을 확인하고, 가능하면 `npm run build`까지 확인한 뒤 개인 브랜치에 push한다.

---

# 6. Project Folder Structure

아래 구조는 현재 저장소의 실제 구조를 기준으로 한다.

`assets/`는 이미지 파일 단위까지 나열하지 않고 주요 폴더만 기록한다.
페이지 전용 Section / Hook은 해당 페이지 폴더 안에 함께 둘 수 있으며, 여러 영역에서 재사용되는 경우에만 공통 영역으로 이동한다.

```text
jajak/
│
├── .env.example
├── .env.local
├── .firebaserc
├── .gitignore
├── .oxlintrc.json
├── AGENTS.md
├── firebase.json
├── firestore.indexes.json
├── firestore.rules
├── event-review.mjs
├── index.html
├── package.json
├── package-lock.json
├── README.md
├── vercel.json
├── vite.config.js
│
├── docs/
│   └── images/
│       ├── design/
│       └── screenshots/
│
├── functions/
│   ├── src/
│   │   ├── utils/
│   │   │   ├── buildCandidateTables.js
│   │   │   └── filterProducts.js
│   │   ├── index.js
│   │   └── recommendation.js
│   ├── .gitignore
│   ├── package.json
│   └── package-lock.json
│
├── public/
│   └── favicon.png
│
└── src/
    ├── assets/
    │   ├── characters/
    │   ├── fonts/
    │   ├── icons/
    │   │   └── preferenceQuestions/
    │   ├── images/
    │   │   ├── admin/
    │   │   ├── ai/
    │   │   ├── banner/
    │   │   ├── brand/
    │   │   ├── common/
    │   │   ├── eventPage/
    │   │   ├── main/
    │   │   ├── mypage/
    │   │   ├── products/
    │   │   └── splash/
    │   ├── logos/
    │   └── videos/
    │
    ├── components/
    │   ├── admin/
    │   │   ├── AdminEmptyState.jsx
    │   │   ├── AdminEmptyState.module.scss
    │   │   ├── AdminFilterBar.jsx
    │   │   ├── AdminFilterBar.module.scss
    │   │   ├── AdminHeader.jsx
    │   │   ├── AdminHeader.module.scss
    │   │   ├── AdminFooter.jsx
    │   │   ├── AdminFooter.module.scss
    │   │   ├── AdminPageHeader.jsx
    │   │   ├── AdminPageHeader.module.scss
    │   │   ├── AdminPanel.jsx
    │   │   ├── AdminPanel.module.scss
    │   │   ├── AdminStatusBadge.jsx
    │   │   ├── AdminStatusBadge.module.scss
    │   │   ├── AdminSummaryCard.jsx
    │   │   └── AdminSummaryCard.module.scss
    │   │
    │   ├── ai/
    │   │   ├── AiLoginModal.jsx
    │   │   └── AiLoginModal.module.scss
    │   │
    │   ├── common/
    │   │   ├── AdultModal.jsx
    │   │   ├── AdultModal.module.scss
    │   │   ├── DesktopHeader.jsx
    │   │   ├── DesktopHeader.module.scss
    │   │   ├── ErrorBoundary.jsx
    │   │   ├── Footer.jsx
    │   │   ├── Footer.module.scss
    │   │   ├── Header.jsx
    │   │   ├── Header.module.scss
    │   │   ├── MobileBottomNav.jsx
    │   │   ├── MobileBottomNav.module.scss
    │   │   ├── MobileHeader.jsx
    │   │   ├── MobileHeader.module.scss
    │   │   ├── MobileSearchModal.jsx
    │   │   ├── MobileSearchModal.module.scss
    │   │   ├── PagePlaceholder.jsx
    │   │   ├── ScrollToTop.jsx
    │   │   ├── SearchModal.jsx
    │   │   ├── SearchModal.module.scss
    │   │   └── SiteLayout.jsx
    │   │
    │   ├── mypage/
    │   │   ├── MyPageCard.jsx
    │   │   ├── MyPageCard.module.scss
    │   │   ├── MyPageEmpty.jsx
    │   │   ├── MyPageEmpty.module.scss
    │   │   ├── MyPageHeader.jsx
    │   │   ├── MyPageHeader.module.scss
    │   │   ├── StatusBadge.jsx
    │   │   └── StatusBadge.module.scss
    │   │
    │   ├── shop/
    │   │   ├── ProductActionBar.jsx
    │   │   ├── ProductActionBar.module.scss
    │   │   ├── ProductGuide.jsx
    │   │   └── ProductGuide.module.scss
    │   │
    │   └── ui/
    │       ├── Badge/
    │       ├── Button/
    │       ├── EmptyState/
    │       ├── ErrorState/
    │       ├── Loading/
    │       ├── MainSectionNav/
    │       ├── MobileTopButton/
    │       ├── Modal/
    │       ├── Pagination/
    │       ├── ProductCard/
    │       ├── QuestionCard/
    │       └── Tabs/
    │
    ├── constants/
    │   ├── aiSurvey.js
    │   ├── eventStatus.js
    │   ├── orderStatus.js
    │   ├── preferenceSurvey.js
    │   ├── tasteAxis.js
    │   └── userRole.js
    │
    ├── data/
    │   ├── products/
    │   │   ├── foods.json
    │   │   ├── gifts.json
    │   │   ├── glasses.json
    │   │   ├── index.js
    │   │   └── liquors.json
    │   ├── events.json
    │   ├── pairings.json
    │   ├── quizs.json
    │   └── tavernGame.js
    │
    ├── firebase/
    │   ├── auth.js
    │   ├── firebase.js
    │   └── firestore.js
    │
    ├── hooks/
    │   ├── useAdultCheck.js
    │   ├── useAiSurvey.js
    │   └── useDebounce.js
    │
    ├── pages/
    │   ├── Admin/
    │   │   ├── AdminErrorContent.jsx
    │   │   ├── AdminErrorContent.module.scss
    │   │   ├── AdminLayout.jsx
    │   │   ├── AdminLayout.module.scss
    │   │   ├── AiLogManage.jsx
    │   │   ├── AiLogManage.module.scss
    │   │   ├── Dashboard.jsx
    │   │   ├── Dashboard.module.scss
    │   │   ├── EventManage.jsx
    │   │   ├── EventManage.module.scss
    │   │   ├── NoticeManage.jsx
    │   │   ├── NoticeManage.module.scss
    │   │   ├── OrdersManage.jsx
    │   │   ├── OrdersManage.module.scss
    │   │   ├── ProductManage.jsx
    │   │   ├── ProductManage.module.scss
    │   │   ├── ReviewManage.jsx
    │   │   ├── ReviewManage.module.scss
    │   │   ├── UserManage.jsx
    │   │   └── UserManage.module.scss
    │   │
    │   ├── AiCurator/
    │   │   ├── AiIntro.jsx
    │   │   ├── AiIntro.module.scss
    │   │   ├── AiRecommendationLoading.jsx
    │   │   ├── AiRecommendationLoading.module.scss
    │   │   ├── AiResult.jsx
    │   │   ├── AiResult.module.scss
    │   │   ├── AiSurvey.jsx
    │   │   ├── AiSurvey.module.scss
    │   │   ├── GuestChoiceModal.jsx
    │   │   ├── GuestChoiceModal.module.scss
    │   │   ├── MakdongTavern.jsx
    │   │   └── MakdongTavern.module.scss
    │   │
    │   ├── Auth/
    │   │   ├── Login.jsx
    │   │   ├── Login.module.scss
    │   │   ├── PreferenceSurvey.jsx
    │   │   ├── PreferenceSurvey.module.scss
    │   │   ├── PreferenceSafetyIntro.jsx
    │   │   ├── PreferenceSafetyIntro.module.scss
    │   │   ├── PreferenceSafety.jsx
    │   │   ├── PreferenceSafety.module.scss
    │   │   ├── PreferenceQuestions.jsx
    │   │   ├── PreferenceQuestions.module.scss
    │   │   ├── PreferenceComplete.jsx
    │   │   ├── PreferenceComplete.module.scss
    │   │   ├── Signup.jsx
    │   │   └── Signup.module.scss
    │   │
    │   ├── Brand/
    │   │   ├── BrandIntro.jsx
    │   │   ├── BrandIntro.module.scss
    │   │   ├── MakdongIntro.jsx
    │   │   ├── MakdongIntro.module.scss
    │   │   ├── useMakdongSectionWheel.js
    │   │   ├── useSectionWheelSnap.js
    │   │   └── useStickyBrandHeader.js
    │   │
    │   ├── CartOrder/
    │   │   ├── Cart.jsx
    │   │   ├── Cart.module.scss
    │   │   ├── Checkout.jsx
    │   │   ├── Checkout.module.scss
    │   │   ├── OrderComplete.jsx
    │   │   └── OrderComplete.module.scss
    │   │
    │   ├── Event/
    │   │   ├── _eventShared.scss
    │   │   ├── CardGame.jsx
    │   │   ├── CardGame.module.scss
    │   │   ├── EventList.jsx
    │   │   ├── EventList.module.scss
    │   │   ├── EventReady.jsx
    │   │   ├── EventReady.module.scss
    │   │   ├── OxQuizEvent.jsx
    │   │   ├── OxQuizEvent.module.scss
    │   │   ├── RouletteEvent.jsx
    │   │   └── RouletteEvent.module.scss
    │   │
    │   ├── Main/
    │   │   ├── BestSellerSection.jsx
    │   │   ├── JourneySection.jsx
    │   │   ├── JourneySection.module.scss
    │   │   ├── MainPage.jsx
    │   │   ├── MainPage.module.scss
    │   │   ├── SplashIntro.jsx
    │   │   ├── SplashIntro.module.scss
    │   │   ├── useHeroReveal.js
    │   │   ├── useLogoScrollReset.js
    │   │   ├── useMainSectionWheel.js
    │   │   ├── useSectionReveals.js
    │   │   └── README.md
    │   │
    │   ├── MyPage/
    │   │   ├── AddressBook.jsx
    │   │   ├── AddressBook.module.scss
    │   │   ├── AiHistory.jsx
    │   │   ├── AiHistory.module.scss
    │   │   ├── AiHistoryDetail.jsx
    │   │   ├── AiHistoryDetail.module.scss
    │   │   ├── AiPreference.jsx
    │   │   ├── AiPreference.module.scss
    │   │   ├── ClaimHistory.jsx
    │   │   ├── ClaimHistory.module.scss
    │   │   ├── EventHistory.jsx
    │   │   ├── EventHistory.module.scss
    │   │   ├── EventWinningHistory.jsx
    │   │   ├── EventWinningHistory.module.scss
    │   │   ├── FrequentPurchase.jsx
    │   │   ├── FrequentPurchase.module.scss
    │   │   ├── InquiryHistory.jsx
    │   │   ├── InquiryHistory.module.scss
    │   │   ├── MyPageErrorContent.jsx
    │   │   ├── MyPageErrorContent.module.scss
    │   │   ├── MyHome.jsx
    │   │   ├── MyHome.module.scss
    │   │   ├── MyPageLayout.jsx
    │   │   ├── MyPageLayout.module.scss
    │   │   ├── OrderDetail.jsx
    │   │   ├── OrderDetail.module.scss
    │   │   ├── OrderHistory.jsx
    │   │   ├── OrderHistory.module.scss
    │   │   ├── PointHistory.jsx
    │   │   ├── PointHistory.module.scss
    │   │   ├── profileAvatars.js
    │   │   ├── ProfileEdit.jsx
    │   │   ├── ProfileEdit.module.scss
    │   │   ├── WishList.jsx
    │   │   └── WishList.module.scss
    │   │
    │   ├── NotFound/
    │   │   ├── NotFound.jsx
    │   │   └── NotFound.module.scss
    │   │
    │   ├── Shop/
    │   │   ├── ProductDetail.jsx
    │   │   ├── ProductDetail.module.scss
    │   │   ├── ProductList.jsx
    │   │   └── ProductList.module.scss
    │   │
    │   └── Support/
    │       ├── FAQ.jsx
    │       ├── FAQ.module.scss
    │       ├── InquiryQnA.jsx
    │       ├── InquiryQnA.module.scss
    │       ├── NoticeDetail.jsx
    │       ├── NoticeDetail.module.scss
    │       ├── NoticeList.jsx
    │       └── NoticeList.module.scss
    │
    ├── routes/
    │   ├── AdminRoute.jsx
    │   ├── paths.js
    │   └── ProtectedRoute.jsx
    │
    ├── services/
    │   ├── eventParticipation.js
    │   ├── productCatalog.js
    │   └── recommendationApi.js
    │
    ├── styles/
    │   ├── admin/
    │   │   ├── _adminCommon.scss
    │   │   ├── _adminMixins.scss
    │   │   └── _adminVariables.scss
    │   ├── global.scss
    │   ├── _mixins.scss
    │   ├── _reset.scss
    │   └── _variables.scss
    │
    ├── utils/
    │   ├── cartStorage.js
    │   ├── format.js
    │   └── validation.js
    │
    ├── App.jsx
    └── main.jsx
```

## Structure Rules

- 실제 저장소에 존재하는 경로를 우선한다.
- `assets/`는 주요 폴더만 문서화하며 이미지 파일 단위 변경은 AGENTS 버전 변경 사유로 삼지 않는다.
- Main처럼 특정 페이지에만 사용하는 Section / Hook은 해당 페이지 폴더에 함께 둘 수 있다.
- 여러 페이지에서 재사용되는 Component / Hook만 공통 영역으로 이동한다.
- 폴더 또는 파일 위치 변경이 필요하면 팀장과 먼저 협의한다.
- `src/utils/cartStorage.js`는 승인된 공통 Cart localStorage Utility이다.
- 현재 `functions/src/`는 `index.js`, `recommendation.js`, `utils/buildCandidateTables.js`, `utils/filterProducts.js`로 구성한다.
- Functions 파일을 추가하거나 책임을 다시 분리해야 하는 경우 팀장과 협의한다.
- 신규 페이지 / 컴포넌트 스타일은 SCSS Modules를 사용한다.

---

# 7. Naming Convention

## JavaScript / React

- 변수 / 함수 / 객체 필드: `camelCase`
- React Component: `PascalCase`
- Event Handler: `handleXxx`
- Boolean: `isXxx`, `hasXxx`, `canXxx`

예:

```js
const productId = "liq_001";
const isAdultVerified = true;

function handleSubmit() {}
```

## Firebase

Collection 이름은 소문자 복수형을 기본으로 한다.

사용 예정/확정 예:

```text
users
products
pairings
orders
events
recommendations
aiRecommendationLogs
guestSessions
aiRequestGuards
inquiries
```

새로운 Collection을 임의로 추가하지 않는다.

---

# 8. Styling / Design Rules

확정된 Figma / 와이어프레임과 JAJAK 공통 디자인 시스템을 우선한다.

## Common Rules

- 공통 Design Token은 `src/styles/_variables.scss`를 우선 사용한다.
- 기본 UI 폰트는 Pretendard를 사용한다.
- 강조용 폰트는 JS Arirang HON을 사용한다.
- JS Arirang HON은 Hero / 이벤트 대표 타이틀 / 브랜드 감성 카피에만 제한적으로 사용한다.
- 페이지 / 컴포넌트 스타일은 SCSS Modules(`*.module.scss`)로 작성한다.
- Sass 모듈 참조는 `@use`를 사용한다.
- 공통 Token이 있으면 임의 HEX / spacing / font-size / radius를 새로 만들지 않는다.
- `_variables.scss`, `_mixins.scss`, `_reset.scss`, `global.scss`는 공통 파일이므로 담당자 협의 없이 임의 수정하지 않는다.
- `global.scss`는 `main.jsx`에서 한 번만 import한다.
- Mobile은 Desktop 단순 축소가 아니라 재배치형 responsive layout으로 구현한다.
- 디자인이 애매하거나 정의되지 않은 부분은 임의의 새 UI를 만들지 않고 먼저 공유한다.

## HTML / JSX

- `main`, `section`, `nav`, `header`, `footer` 등 의미에 맞는 semantic tag를 우선 사용한다.
- 동작은 `button`, 페이지 이동은 `Link` / `a`를 사용한다.
- 이미지에는 목적에 맞는 `alt`를 작성한다.
- Form은 `label`과 입력 요소를 연결한다.

## Breakpoints

```text
Mobile  : 0 ~ 767px
Tablet  : 768 ~ 1199px
Desktop : 1200px 이상
```

## Layout Tokens

```text
PC 기준 폭       : 1440px
Content max      : 1280px
Desktop side     : 80px
Tablet side      : 40px
Mobile side      : 20px
Gutter           : 24px
```

## Color Tokens

```text
Primary       : #4D7E7B
Primary Light : #56BEB7
Background    : #FDFBF9
Surface       : #E1D9CE
Taupe         : #8C7E6F
```

## Font Tokens

```text
기본 Font : Pretendard
강조 Font : JS Arirang HON
```

## Spacing / Radius

```text
Spacing base : 4px
Radius       : 4 / 8 / 12 / 20 / pill
```

실제 SCSS에서는 위 값을 페이지마다 직접 반복하기보다 `_variables.scss`에 정의된 공통 변수를 우선 사용한다.

## Shared UI

아래 공통 UI가 존재하면 반드시 우선 재사용한다.

- Button
- Modal
- Loading
- ErrorState
- EmptyState
- Badge
- Pagination
- Tabs
- ProductCard
- QuestionCard
- MainSectionNav
- MyPageHeader
- StatusBadge
- AdminPageHeader
- AdminSummaryCard
- AdminFilterBar
- AdminPanel
- AdminStatusBadge
- AdminEmptyState

동일 목적의 컴포넌트를 다른 이름으로 중복 생성하지 않는다.

## MyPage Design

- 좌우 여백을 반드시 유지한다.
- 기존 Sidebar + Content 비율을 하위 페이지에서도 유지한다.
- 카드 / 정렬 / 여백 패턴을 하위 MyPage에서도 일관되게 사용한다.
- Codex 요청 시 기존 MyPage 디자인 형식을 그대로 따르도록 명시한다.

## Admin Design

- 관리자 상세 디자인은 일부 영역이 미완성일 수 있다.
- 새로운 디자인 언어를 임의로 만들지 않는다.
- MyPage의 카드 / 여백 / 타이포 / 버튼 / 상태 UI를 기준으로 JAJAK 톤을 통일한다.
- 관리자 작업자는 공통 디자인 시스템과 MyPage 레이아웃을 우선 참고한다.

---

# 9. React State Management

프로젝트 상태 관리는 React 기본 기능을 우선 사용한다.

## Core Rule

상태는 **필요한 가장 가까운 범위**에 둔다.

우선순위:

1. 단일 Component / Page에서만 필요한 값 → `useState`
2. 값의 변화에 따른 동작이 필요할 때 → `useEffect`
3. 부모-자식 간 공유 → props
4. 반복되는 동작 로직이 실제로 생길 때 → 기존 Custom Hook 활용
5. 여러 화면이 공유해야 하는 지속 데이터 → Firebase 또는 확정된 localStorage 계약 사용

단순한 값을 불필요하게 전역화하거나 같은 상태를 여러 위치에 중복 생성하지 않는다.

## Authentication State

- 로그인 여부 / UID / email은 Firebase Authentication 기준
- nickname / role / status / isAdultVerified / points / userPreference 등 회원 데이터는 Firestore `users/{uid}` 기준
- 인증 변화 감지는 Firebase Auth의 `onAuthStateChanged`를 사용한다.
- UI에서 필요한 React 상태는 해당 Route / Layout / Component에서 최소 범위로 관리한다.
- 실제 관리자 보안의 최종 기준은 Firestore Rules / 서버 검증이다.

## AI Survey State

AI 설문 상태는 `useAiSurvey`와 React 기본 상태를 이용한다.

`useAiSurvey`는 필요에 따라 다음 동작을 담당한다.

- 현재 질문 단계
- 설문 응답값
- 다음 / 이전 이동
- 답변 검증
- 설문 진행 로직

불필요한 Context나 Custom Hook을 추가하지 않는다.

## Guest AI Result

비회원 추천 결과는 React 임시 상태로만 관리한다.

- Firestore 저장 금지
- localStorage 저장 금지
- 정회원 계정으로 자동 이전 금지
- 새로고침 또는 세션 초기화 시 결과가 유지된다고 가정하지 않는다.

## Adult Verification State

현재 전역 성인 확인은 `App.jsx`에서 `sessionStorage`의 `jajak_adult_verified` 값을 사용한다.

현재 상태:

- `useAdultCheck.js`는 placeholder이며 실제 흐름에 연결되지 않았다.
- `AdultModal`의 확인 버튼은 현재 세션의 성인 확인 상태를 저장한다.
- Checkout은 회원의 `users/{uid}.isAdultVerified`를 확인하고 필요한 경우 현재 세션 확인값을 회원 문서에 반영한다.
- `guestSessions/{anonymousUid}` 저장은 목표 구조이며 현재 구현되지 않았다.

## Cart State

장바구니의 지속 데이터는 `localStorage`의 `jajak_cart`를 사용한다.
화면에서는 React 기본 상태로 표시하며, localStorage 입출력은 `src/utils/cartStorage.js`의 공통 함수만 사용한다.

- `getCart()`
- `saveCart()`
- `clearCart()`

---

# 10. Authentication / User Rules

## Ownership

이영기는 사용자 기능으로서 다음 세 가지 Auth 기능을 담당한다.

```text
Login
Signup
Logout
```

또한 `src/firebase/auth.js`의 Firebase Authentication 함수 구현을 담당한다.

- login
- signup
- logout
- anonymous auth (`signInAnonymously` 등)
- auth state 확인

익명 인증 함수는 구현되어 있으나 현재 화면에서 호출하지 않는다. 향후 `AdultModal` / `useAdultCheck` / 비회원 AI 흐름을 연결할 때 재사용한다.

## Login

- 이메일 + 비밀번호 방식만 사용한다.
- UI 및 코드에서 로그인 식별자를 `아이디`라고 표현하지 않는다.
- Firebase Authentication을 사용한다.
- 로그인 완료 후 Firestore `users/{uid}` 데이터를 조회하여 필요한 회원 정보를 사용한다.

## Signup

기본 입력:

```text
nickname
email
password
passwordConfirm
약관 동의
```

- `phone`, `address`는 회원가입에서 받지 않는다.
- 비밀번호 / 비밀번호 확인값은 Firestore에 저장하지 않는다.
- 비밀번호는 Firebase Authentication이 관리한다.
- 회원가입 성공 후 이영기는 `/preference`로 이동시키는 연결까지만 담당한다.
- `/preference` 진입 이후 기본 취향 설문은 김지우 담당이다.

## Password Change

비밀번호 변경 기능은 이번 프로젝트 구현 범위에서 제외한다.

## User Document

기본 구조:

```js
{
  uid,
  email,
  nickname,
  role,
  status,
  isAdultVerified,
  points,
  userPreference,
  createdAt,
  updatedAt
}
```

`userPreference`는 회원가입 후 기본 취향 설문 결과를 저장하는 필드이다.

저장 위치:

```text
users/{uid}.userPreference
```

회원 포인트 저장 위치:

```text
users/{uid}.points
```

## User Role

```text
user
admin
```

규칙:

- 신규 회원 기본값은 `user`
- 관리자 계정만 `admin`
- 일반 사용자는 자신의 `role`을 직접 생성/변경할 수 없다.
- 관리자 여부의 실제 보안 기준은 Firestore Security Rules 및 서버 측 `users/{uid}.role` 검증이다.
- React에 보관한 `role` 값은 UI 표시 및 Router 판단에 사용할 수 있으나 보안의 최종 기준으로 사용하지 않는다.

## User Status

사용하는 상태:

```text
active
suspended
```

UI 표시:

```text
active    → 정상 회원
suspended → 이용 정지
```

신규 회원 기본값:

```text
active
```

회원탈퇴 및 탈퇴 상태는 이번 프로젝트 구현 범위에 포함하지 않는다.

## Profile

회원 프로필에 지속 저장하지 않는 값:

- phone
- address

회원정보 수정은 닉네임 등 기본 프로필 중심으로 처리한다.
배송지 / 연락처는 Checkout 주문 시점에만 입력한다.

---

# 11. Adult Verification

## Ownership

### 이영기

`src/firebase/auth.js`의 `signInAnonymously()` 함수 레벨을 담당한다. 함수는 존재하지만 현재 화면 흐름에서는 호출하지 않는다.

### 김지우

다음 서비스 흐름을 담당한다.

- `AdultModal.jsx`
- `useAdultCheck.js`
- Header와 연결되는 성인인증 팝업
- AI 비회원 흐름
- `auth.js`의 익명 인증 함수를 호출해 성인인증 / 비회원 AI 흐름에 연결

현재 `useAdultCheck.js`와 익명 인증 연결은 미완료 상태다.

실제 본인인증 외부 API를 연결하지 않고 학습용 Mock 방식으로 처리한다.

기본 UI:

```text
만 19세 이상입니다
나가기
```

## Adult User

`만 19세 이상입니다` 선택:

```text
isAdultVerified = true
```

`나가기` 선택:

- 이전 페이지로 이동

생년월일 입력 및 실제 나이 계산 로직은 구현 범위에 포함하지 않는다.

## Logged-in User

- 로그인 회원의 성인인증 상태는 `users/{uid}.isAdultVerified`에서 확인한다.
- 전역 AdultModal 자체는 현재 로그인 여부와 관계없이 `sessionStorage`를 기준으로 표시한다.
- React 화면에서는 필요한 범위에서만 상태를 사용한다.

## Guest User

- 현재 비회원 성인 확인은 `sessionStorage`의 `jajak_adult_verified`를 사용한다.
- 새 브라우저 세션에서는 다시 확인한다.
- Firebase Anonymous Auth 함수는 준비되어 있으나 AdultModal / AI 흐름에 연결되지 않았다.
- `guestSessions/{anonymousUid}`, TTL, rate limit은 향후 연결 시 함께 구현할 목표 계약이다.

---

# 12. Product Data Rules

## Seed / Reference Data

초기 상품 데이터:

```text
src/data/products/
├── liquors.json
├── foods.json
├── glasses.json
├── gifts.json
└── index.js
```

초기 페어링 데이터:

```text
src/data/pairings.json
```

이 JSON들은 **초기 상품 데이터 작성 및 Firestore 등록을 위한 seed / reference 데이터**이다.

- 상품 seed/reference JSON의 최종 관리자는 상품 담당자이다.
- 다른 담당자는 필드명 / ID / 카테고리 / 타입을 임의 변경하지 않는다.
- Runtime 화면에서 JSON을 현재 상품 데이터의 기준으로 직접 사용하지 않는다.

## Runtime Source of Truth

실제 앱 Runtime의 상품 및 페어링 Source of Truth는 **Firestore**이다.

다음 정보는 현재 Firestore 상품 데이터를 기준으로 한다.

- 상품명
- 가격
- 할인율
- 이미지
- 재고
- 판매상태
- 카테고리 및 상품 속성
- 현재 페어링

적용 범위:

- Shop 상품 목록 / 상세
- Wishlist 화면 조합
- Cart 화면 조합
- Checkout 현재 상품 확인
- Admin 상품관리
- AI 후보 상품 구성

현재 호환 상태:

- `src/services/productCatalog.js`는 Firestore 조회 실패 시 seed/reference 상품을 표시하는 fallback을 포함한다.
- Main 일부 섹션과 Event 화면은 Firestore 데이터가 없거나 조회에 실패할 때 로컬 표시 데이터를 사용한다.
- fallback은 화면 표시를 위한 임시 보완이며 주문 가격, 재고, 판매상태의 최종 기준으로 사용하지 않는다.
- Checkout과 주문 생성은 Firestore 현재 상품을 기준으로 검증한다.
- AI Client는 Firestore에서 조회한 후보를 Functions에 전달하며, Functions는 전달된 후보의 형식과 참조를 검증한다.
- fallback을 추가하거나 범위를 넓힐 때는 데이터 담당자와 협의하고 이 문서에 사용 위치를 기록한다.

## Common Product Fields

```js
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
```

## Product ID Prefix

```text
liq_ → 전통주
snk_ → 안주
gls_ → 술잔 / 선물세트
```

## productType

```text
전통주
안주
주류용품
```

`ALL`은 UI 필터값으로만 사용한다.

## liquorType

```text
탁주
약주
청주
과실주
증류주
리큐르
```

## timeOfDay

```text
낮의 결
밤의 결
```

`timeOfDay`는 `liquorType`과 분리한다.

## snackType

```text
간편식
상온안주
디저트
```

`즉석조리` 값은 사용하지 않는다.

## glassType

```text
술잔
선물세트
```

## Product Status

```text
selling
soldOut
hidden
```

UI 표시:

```text
selling → 판매 중
soldOut → 품절
hidden  → 숨김
```

## Pairing Rules

seed/reference 관계:

```js
{
  liquorId,
  pairedFoodIds,
  recommendedGlassIds
}
```

규칙:

- 상품 이름이 아닌 `productId`로 연결한다.
- `pairedFoodIds`는 안주 ID 배열이다.
- `recommendedGlassIds`는 AI에서 추천할 술잔/주류용품 ID 배열이다.
- `recommendedGlassIds`에는 술잔뿐 아니라 선물세트 ID가 포함될 수 있다.
- 동일한 페어링 관계를 여러 상품 JSON에 중복 정의하지 않는다.
- Runtime에서는 Firestore의 현재 페어링 데이터를 기준으로 한다.

## Wishlist

Wishlist는 로그인 회원 전용 개인 데이터이다.

저장 위치:

```text
users/{uid}/wishlist/{productId}
```

최소 저장 데이터:

```js
{
  productId,
  createdAt
}
```

규칙:

- 상품명 / 가격 / 이미지 / 재고 / 판매상태 등 상품 전체 정보를 Wishlist 문서에 중복 저장하지 않는다.
- Wishlist 화면은 저장된 `productId`를 기준으로 Firestore의 현재 상품 정보를 조회해 조합한다.
- Firestore에서 해당 상품을 찾을 수 없는 경우 화면에 유효 상품으로 표시하지 않는다.
- 비회원 Wishlist는 구현하지 않는다.

---

# 13. Survey Rules

## PreferenceSurvey

담당:

- 김지우
- `PreferenceSurvey.jsx`
- `PreferenceSafetyIntro.jsx`
- `PreferenceSafety.jsx`
- `PreferenceQuestions.jsx`
- `PreferenceComplete.jsx`
- `constants/preferenceSurvey.js`
- `users/{uid}.userPreference` 저장 구조 관리

목적:

- 회원가입 후 신규 회원의 평소 취향 저장
- 알레르기 / 주의사항 및 기본 취향 정보 수집
- AI 추천용 장기 취향 데이터 구성

Route:

```text
/preference
/preference/safety-intro
/preference/safety
/preference/questions
/preference/complete
```

화면 흐름:

```text
PreferenceSafetyIntro
↓
PreferenceSafety
↓
PreferenceQuestions
↓
PreferenceComplete
```

규칙:

- 각 단계는 위 Route를 사용하며 `src/App.jsx`에서 연결한다.
- `/preference`는 취향 등록 시작 화면이다.
- 회원가입 성공 후 이영기가 `/preference`까지 연결한다.
- `/preference` 진입 이후 설문 UI / 진행 / 저장은 김지우가 담당한다.
- 설문 건너뛰기 가능
- 완료된 결과는 `users/{uid}.userPreference`에 저장한다.
- AI 추천 시 사용하는 `AiSurvey`와 목적이 다르다.

## AiSurvey

목적:

- 현재 상황에 맞는 주안상 추천 입력 수집

Route:

```text
/ai/survey
```

질문 데이터:

```text
constants/aiSurvey.js
```

### 로그인 회원

```text
회원 로그인
↓
request.auth.uid 확인
↓
users/{uid}.userPreference 조회
↓
오늘 AiSurvey 답변과 결합
↓
Client가 전달한 상품 / 페어링 후보 검증 및 필터
↓
Prompt 구성
↓
OpenAI 호출
↓
추천 결과 생성
```

- OpenAI 모드의 `userPreference`는 서버에서 `request.auth.uid` 기준으로 다시 조회한다.
- Mock 모드에서는 Client가 전달한 `userPreference`를 사용한다.
- 현재 상품 / 페어링 배열은 Client Request에 포함되며 Functions에서 배열 형식과 참조를 검증한다.
- 서버가 Firestore에서 상품 / 페어링을 직접 읽는 구조로 변경하기 전까지 이를 현재 구현으로 설명하지 않는다.
- 평소 취향 + 현재 상황을 함께 추천에 반영한다.

### 비회원

- 저장된 기본 취향 없음
- 간소화된 비회원용 질문 진행
- 현재 설문 응답만 추천에 반영

## Shared Survey UI

- 두 설문 모두 `QuestionCard` 재사용 가능
- 공통 취향 기준값은 `constants/tasteAxis.js`에서 관리
- 질문 데이터 / 저장 목적을 서로 혼용하지 않는다.

---

# 14. AI Architecture

프론트에서 OpenAI API를 직접 호출하지 않는다.

기본 흐름:

```text
AiSurvey
   ↓
Firebase Cloud Functions
   ↓
functions/src/index.js
   ↓
회원 userPreference 조회 (회원인 경우)
   ↓
Client가 전달한 현재 상품 / 페어링 후보 검증
   ↓
functions/src/recommendation.js
   ↓
후보 상품 필터링
   ↓
Prompt 구성
   ↓
OpenAI 호출
   ↓
Response 검증
   ↓
Response 반환 / 추천 기록 저장
```

## Current Functions Structure

현재 저장소 기준 Functions 구현 파일:

```text
functions/src/index.js
functions/src/recommendation.js
functions/src/utils/buildCandidateTables.js
functions/src/utils/filterProducts.js
```

- `index.js`: Callable Function 진입점, 요청 검증, 회원 취향 조회, 추천 기록 저장
- `recommendation.js`: 후보 구성, Mock/OpenAI 추천, 응답 검증
- `utils/buildCandidateTables.js`: 추천 후보 테이블 구성
- `utils/filterProducts.js`: 설문과 안전 조건을 반영한 후보 필터
- `src/services/recommendationApi.js`는 현재 placeholder이며, `AiResult.jsx`가 `httpsCallable`로 `recommendJajak`을 직접 호출한다.
- 서비스 계층으로 호출 책임을 이동하기 전까지 `recommendationApi.js`가 실제 연결 파일이라고 문서화하지 않는다.
- 현재 구조에 없는 Functions 하위 폴더를 팀원이 임의 생성하지 않는다.

## Logical Responsibilities

Functions 구현에서는 다음 책임을 구분한다.

### Request Validation
- `surveyType`
- `todaySurvey`
- `liquors` / `foods` / `glasses` / `pairings`
- 자료형 / enum / 배열 형식

### Product Filtering
- 알레르기
- 제외 원재료
- 품절
- 판매 불가
- 절대 도수 제한

### Prompt Building
- 회원 `userPreference`와 당일 `AiSurvey`를 필요한 형태로 결합
- 후보 상품 정보를 이용해 Prompt 구성
- Prompt 구조 변경 시 `recommendation.js`의 Schema와 검증 로직을 함께 점검

### AI Response Validation
- 필수 필드
- 추천 개수
- 전달된 후보 테이블의 `tableId` 존재 여부
- reason 형식
- 추천 조합 중복 여부

### Rate Limit
- `aiRequestGuards/{uid}` 기반 제한은 목표 계약이며 현재 미연결

---

# 15. AI Request Rules

현재 `AiResult.jsx`가 Callable Function에 아래 데이터를 전달한다.

Client Request:

```js
{
  surveyType,
  todaySurvey,
  userPreference,
  liquors,
  foods,
  glasses,
  pairings
}
```

규칙:

- `surveyType`은 `member` 또는 `guest`만 허용한다.
- `todaySurvey`의 key / enum은 `constants/aiSurvey.js` 기준이다.
- 로그인 회원 식별은 Client `userId`가 아니라 `request.auth.uid` 기준
- 로그인 회원의 `userPreference`는 Firestore에서 `request.auth.uid` 기준 조회
- 비회원은 Firebase Anonymous Auth UID 사용
- 익명 UID는 성인인증 / rate limit용 임시 식별자
- 익명 UID를 회원 추천 기록의 userId로 저장하지 않는다.
- Mock 회원 추천에서는 Client가 전달한 `userPreference`를 사용한다.
- 상품 / 페어링 배열은 현재 Client Request에 포함된다.
- `requestId`, `surveyVersion`, `promptVersion`, `filterVersion`은 현재 구현 계약에 포함되지 않는다.

## Validation Order

Cloud Functions는 아래 순서로 처리한다.

1. `surveyType` 검증
2. `todaySurvey` 객체 검증
3. 상품 / 페어링 배열 검증
4. 회원 인증 및 `userPreference` 준비
5. OpenAI Secret 확인
6. `filterProducts` 실행
7. Mock 추천 또는 OpenAI 호출
8. 응답 검증
9. 로그인 회원 추천 기록 저장

앞 단계가 실패하면 뒤 단계를 실행하지 않는다.

---

# 16. AI Request ID / Rate Limit

## requestId

현재 추천 기록 ID는 Firestore subcollection의 자동 생성 문서 ID를 사용하며 별도 `requestId` 멱등성 처리는 구현하지 않았다.

향후 `requestId`를 도입하는 경우 중복 OpenAI 호출과 중복 저장을 막는 목적, 충돌 판정 기준, 기존 기록 호환 방식을 먼저 팀에서 확정한다.

## Rate Limit

Collection:

```text
aiRequestGuards/{uid}
```

최소 데이터:

```js
{
  lastRequestAt,
  expiresAt
}
```

규칙:

- `aiRequestGuards` 기반 rate limit은 목표 계약이며 현재 `recommendJajak`에는 연결되지 않았다.
- 도입 시 로그인 UID / 익명 UID를 같은 기준으로 처리한다.
- Client 직접 write는 허용하지 않고 Admin SDK로 기록한다.
- 제한 시간과 TTL을 코드 및 Firestore 설정과 함께 확정한다.

---

# 17. AI Product Filtering / Fallback

상품 화면의 Source of Truth는 Firestore이다. 현재 AI Client는 Firestore에서 읽은 상품과 페어링 후보를 Callable Request에 포함하고, Functions는 전달받은 배열에서 후보 테이블을 구성하고 필터링한다.

- Client 입력을 서버의 절대적 Source of Truth로 간주하지 않는다.
- 서버가 Firestore에서 직접 후보를 조회하도록 변경하는 경우 Client Request와 Functions 검증을 함께 갱신한다.

`filterProducts` 적용 후 생성된 주안상 후보 테이블 개수 기준:

```text
3개 이상 → 3개 추천
1~2개   → 존재하는 후보 개수만큼 추천
0개     → NO_SAFE_CANDIDATES
```

규칙:

- Mock 모드와 OpenAI 모드 모두 동일한 후보 테이블과 필터 결과를 사용한다.
- 알레르기 및 강제 제외 조건을 해제하지 않는다.
- Filter 구조 변경 시 입력 계약과 응답 검증을 함께 갱신한다.

---

# 18. AI Response Rules

OpenAI는 서버가 제공한 후보 안에서만 상품을 선택한다.

추천 항목:

```js
{
  tableId,
  liquorId,
  foodId,
  glassId,
  reason,
  liquorReason,
  foodReason,
  glassReason,
  recommendedTimeText,
  recommendedTimeRange
}
```

성공 Response:

```js
{
  recommendations,
  meta,
  recommendationId
}
```

## meta

```js
{
  userType,
  model,
  isMock,
  candidateCount,
  recommendationCount,
  excluded,
  invalidReferences
}
```

규칙:

- OpenAI 응답은 Structured Output Schema로 요청한다.
- 응답의 `tableId`가 실제 후보 테이블에 존재하는지 검증한다.
- 중복 `tableId`는 결과에서 제외한다.
- Mock 모드는 후보 테이블 안에서 결과를 만들고 `meta.isMock = true`를 반환한다.
- 추천 조합은 항목 간 중복되지 않아야 한다.

---

# 19. AI Error Codes

현재 내부 오류 식별자:

```text
INVALID_USER_TYPE
NO_SAFE_CANDIDATES
OPENAI_API_KEY_MISSING
EMPTY_OPENAI_RESPONSE
INVALID_RECOMMENDATION_COUNT
INVALID_OPENAI_RESPONSE
```

Callable Function은 사용자에게 노출할 메시지를 `HttpsError`로 변환한다. `recommendationApi.js`의 공통 오류 정규화는 아직 구현되지 않았다.

---

# 20. AI Recommendation Save Rules

추천 기록은 **Cloud Functions에서만 생성**한다.

클라이언트는 `recommendations`에 직접 create/update 하지 않는다.

## Save Target

- 로그인 회원: 저장
- 비회원: 저장하지 않음

문서 경로:

```text
users/{uid}/recommendations/{recommendationId}
```

AI 추천 실행 1회 = Firestore 문서 1개

여러 추천 세트는 하나의 `recommendations` 배열로 저장한다.
`recommendationId`는 Firestore가 자동 생성하며 성공 Response에 포함한다.

## Recommendation Document

```js
{
  uid,
  userType,
  createdAt,
  isSaved,
  todaySurvey,
  recommendations,
  meta: {
    model,
    isMock,
    candidateCount,
    recommendationCount
  }
}
```

규칙:

- `uid`: `request.auth.uid`
- `createdAt`: 서버 기준 timestamp
- 추천 당시 `todaySurvey` Snapshot 보존
- `isSaved` 초기값은 `false`
- 추천 결과의 상품 참조는 `liquorId`, `foodId`, `glassId`를 포함한다.
- AI Response 정상 검증 직후 1회 저장
- AiResult 렌더링 / 새로고침 시 재저장하지 않는다.
- 외부 OpenAI 호출은 Firestore Transaction 밖에서 처리

## Save Failure

현재 로그인 회원의 추천 기록 저장 실패는 Callable Function 실패로 처리한다. `saveStatus` 필드는 사용하지 않는다.

비회원은 추천 기록을 저장하지 않으며 Response의 `recommendationId`는 `null`이다.

## Guest Result

비회원 설문 / 추천 결과:

- React 임시 상태만 사용
- Firestore 저장 금지
- localStorage 저장 금지
- 새로고침 / 세션 초기화 시 소멸
- 회원가입 / 로그인 후 정회원 추천 기록으로 소급 저장하지 않는다.
- 익명 상태의 성인인증 / 추천 결과도 정회원 계정으로 자동 이전하지 않는다.

## History Compatibility

- 과거 추천 기록은 기본적으로 수정하지 않는다.
- 설문 Schema 변경 시 과거 추천 기록을 강제 마이그레이션하지 않는다.
- `AiHistory`는 실제 필드 존재 여부를 확인해 이전 기록도 안전하게 렌더링한다.

---

# 21. AI Admin / Security Rules

관리자 권한 기준:

```text
users/{uid}.role === "admin"
```

## Server

Cloud Functions에서 관리자 여부 확인이 필요한 경우:

1. `request.auth.uid` 확인
2. `users/{uid}` 조회
3. `role === "admin"` 검증

## Firestore Rules

관리자 권한 역시 현재 로그인 사용자의 `users/{uid}.role === "admin"` 기준으로 검증한다.

## Client

- React에 읽어온 `role` 값은 UI 표시용
- `AdminRoute`는 관리자 화면 접근 판단용 목표 컴포넌트이며 현재 placeholder / 미연결 상태
- 실제 데이터 보안의 최종 기준은 Firestore Rules / 서버 검증

## Recommendation Access

일반 회원:

- 자신의 `users/{uid}/recommendations` 하위 기록만 조회 가능
- 추천 기록 직접 create/update 금지

관리자:

- Firestore Rules의 role 검증을 통과한 범위에서 회원별 추천 기록 조회 가능

## AiLogManage

- 현재 `AiLogManage.jsx`는 시연용 `mockLogs`를 사용한다.
- `recommendJajak` Function은 회원·비회원 요청마다 `aiRecommendationLogs/{logId}`를 생성하고 `pending`에서 `success` 또는 `failed`로 상태를 갱신한다.
- `aiRecommendationLogs`의 client read는 관리자에게만 허용하며 create/update/delete는 금지한다.
- 관리 화면이 이 collection을 아직 조회하지 않으므로 실제 로그 화면이라고 문서화하지 않는다.
- 실제 UI 연결 시 관리자 권한, 페이지네이션, 필요한 index를 함께 검토한다.

## Role Protection

- 일반 사용자는 자신의 `role`을 직접 생성/수정할 수 없다.
- 회원정보 수정에서 nickname 등 일반 필드는 수정 가능
- `role`은 별도 보호

---

# 22. Firebase Client Rules

## `firebase/firebase.js`

Firebase App 초기화

## `firebase/auth.js`

담당자: 이영기

담당:

- signup
- login
- anonymous auth
- logout
- auth state 확인

`AdultModal` / `useAdultCheck` / 비회원 AI 흐름을 연결할 때 이 파일의 익명 인증 함수를 재사용한다.

## `firebase/firestore.js`

담당:

- Firestore 공통 조회
- 공통 CRUD

페이지별 비즈니스 로직을 `firestore.js` 하나에 무제한 추가하지 않는다.
복잡한 도메인 로직은 팀 협의 후 Service 또는 Utility로 분리한다.

## Preferred Call Direction

기본:

```text
Component / Page
       ↓
Service / Firebase Module
       ↓
Firebase
```

반복되는 React 동작 로직이 있을 때만 필요한 Custom Hook을 중간에 사용할 수 있다.
UI 컴포넌트에 Firebase 비즈니스 로직을 과도하게 직접 작성하지 않는다.

---

# 23. Cart Rules

## Access

- `/cart`는 로그인 회원 전용
- 비회원 장바구니는 구현하지 않는다.
- Cart 자체는 Firestore에 저장하지 않는다.

## localStorage Contract

key:

```text
jajak_cart
```

저장 데이터:

```js
[
  {
    productId,
    quantity
  }
]
```

규칙:

- Cart에는 `productId`, `quantity`만 저장한다.
- 상품명 / 가격 / 이미지 / 재고 / 판매상태를 localStorage에 중복 저장하지 않는다.
- Cart 화면과 Checkout에서는 `productId` 기준으로 Firestore의 현재 상품 정보를 조회해 조합한다.
- 현재 가격 / 재고 / 판매상태 판단은 Firestore 기준이다.

## Common Utility

경로:

```text
src/utils/cartStorage.js
```

공통 함수:

```text
getCart()
saveCart()
clearCart()
```

Cart localStorage를 직접 여러 화면에서 제각각 읽고 쓰지 않고 위 Utility를 사용한다.

## Logout

로그아웃 성공 시 `clearCart()`를 호출하여 `jajak_cart`를 삭제한다.

## React State

Cart 화면 표시 및 사용자 조작은 React 기본 상태를 사용한다.
별도의 복잡한 상태 계층을 새로 만들지 않는다.

---

# 24. Order / Checkout Rules

## Current Product Validation

Checkout 진입 및 주문 생성 시 Cart의 `productId`를 기준으로 Firestore의 현재 상품 정보를 조회한다.

- 현재 판매상태 확인
- 현재 재고 확인
- 현재 가격 확인
- 주문 성공 시 Order Item Snapshot 저장

## Payment

- 실제 PG 미연동
- Mock 결제
- 주문 완료 시 Firestore `orders` 저장
- 저장 성공 후 장바구니 비우기
- OrderComplete 이동

## Shipping

배송 정보는 회원 Profile에 지속 저장하지 않는다.

Checkout에서만 입력:

```js
shipping: {
  recipient,
  phone,
  address,
  detailAddress
}
```

## Order Item Snapshot

상품 데이터가 이후 변경되어도 과거 주문이 변하지 않도록 주문 당시 최소 Snapshot을 저장한다.

```js
items: [
  {
    productId,
    productName,
    price,
    quantity,
    imageUrl
  }
]
```

규칙:

- `price`는 주문 당시 실제 적용 가격
- `originalPrice`, `salePrice`, `discountRate` 등은 주문에 불필요하게 중복 저장하지 않는다.

## Order Document

```js
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
```

복잡한 주문 Schema로 임의 확장하지 않는다.

## Order Status

Firestore:

```text
paid
preparing
shipped
delivered
cancelled
```

UI:

```text
paid       → 결제 완료
preparing  → 상품 준비 중
shipped    → 배송 중
delivered  → 배송 완료
cancelled  → 주문 취소
```

공통 상수:

```text
constants/orderStatus.js
```

---

# 25. Event Rules

## Access / Participation

- 이벤트 목록은 전체 접근 가능
- Roulette / CardGame / OX Quiz 참여는 로그인 회원만 가능
- 동일 회원은 동일 이벤트에 1회 참여
- 회원 식별 기준은 Firebase Auth `uid`
- 참여 결과 / 이벤트별 결과 정보는 Firestore에 기록
- MyPage 이벤트 참여 내역에서 확인

공통 참여 기록 경로:

```text
eventParticipations/{eventId}_{uid}
```

규칙:

- Roulette / CardGame / OX Quiz 모두 동일한 참여 문서 경로 규칙을 사용한다.
- 공통 식별 / 참여 정보는 동일 구조로 관리한다.
- 이벤트마다 필요한 결과값이 다를 경우 document 내부 field만 이벤트 유형에 맞게 추가한다.
- 새로운 이벤트 전용 Collection을 임의로 만들지 않는다.

회원 포인트 저장 위치:

```text
users/{uid}.points
```

포인트 경품 당첨 시 해당 회원의 `points`에 누적한다.

## Roulette

- 프론트에서 `Math.random()` 기반 가중치 추첨 사용
- 학습용 Mock 추첨
- 실제 서비스 수준의 보안 추첨 목적이 아님

확률:

```text
1등  1%
2등  4%
3등 10%
4등 20%
5등 30%
6등 35%
```

전체 합계: 100%

- 낙첨 없음
- `미당첨` / `낙첨` 상태 사용하지 않음

## Additional Events

현재 참여형 이벤트:

```text
RouletteEvent
CardGame
OxQuizEvent
```

각 이벤트는 동일한 참여 기록 규칙을 사용하고 결과 field만 이벤트별로 구분한다.

## Reward Type

```text
product
point
```

- coupon 타입 사용하지 않음
- 상품 / 포인트 지급 결과는 MyPage에서 확인
- 포인트는 `users/{uid}.points`에 누적
- 장바구니 / Checkout에서 포인트 또는 이벤트 보상을 실제 적용하는 기능은 구현하지 않는다.
- `포인트 지급 후 30일 소멸` 등 안내 문구는 UI 문구로만 사용
- 실제 만료 / 자동 소멸 로직 미구현

## Event Status

```text
upcoming
ongoing
ended
```

UI:

```text
upcoming → 진행 예정
ongoing  → 진행 중
ended    → 종료
```

공통 상수:

```text
constants/eventStatus.js
```

---

# 26. Routes

공통 진입 URL은 `src/routes/paths.js`를 우선 사용하며 전체 Route 등록은 `src/App.jsx`를 기준으로 한다.
`paths.js`에 없는 경로가 현재 존재하므로, 경로를 추가하거나 변경할 때 두 파일과 Header / Footer 링크를 함께 점검한다.

## Main / Shop

| Page | URL | Access |
|---|---|---|
| MainPage | `/` | 전체 |
| SplashIntro | `/intro` | 전체 |
| BrandIntro | `/brand` | 전체 |
| MakdongIntro | `/brand/makdong` | 전체 |
| ProductList | `/shop` | 전체 |
| ProductDetail | `/shop/:productId` | 전체 |

`/brand/story`는 `/brand`로 redirect한다.

## Auth

| Page | URL | Access |
|---|---|---|
| Login | `/login` | 비로그인 사용자 |
| Signup | `/signup` | 비로그인 사용자 |
| PreferenceSurvey | `/preference` | 기본 취향 설문 대상 로그인 회원 |
| PreferenceSafetyIntro | `/preference/safety-intro` | 기본 취향 설문 대상 로그인 회원 |
| PreferenceSafety | `/preference/safety` | 기본 취향 설문 대상 로그인 회원 |
| PreferenceQuestions | `/preference/questions` | 기본 취향 설문 대상 로그인 회원 |
| PreferenceComplete | `/preference/complete` | 기본 취향 설문 대상 로그인 회원 |

규칙:

- Signup 성공 후 이영기가 `/preference` 연결까지 담당
- Preference 세부 화면은 단계별 Route를 사용한다.
- `/preference` 진입 이후 김지우가 PreferenceSurvey 흐름을 담당
- PreferenceSurvey 건너뛰기 가능

## AI

| Page | URL | Access |
|---|---|---|
| AiIntro | `/ai` | 전체 |
| AiSurvey | `/ai/survey` | 성인인증 완료 사용자 |
| AiResult | `/ai/result` | 정상 추천 완료 + 성인인증 사용자 |
| MakdongTavern | `/ai/tavern` | 전체 |

규칙:

- 로그인 / 비회원 AI URL을 분리하지 않는다.
- 로그인 회원: `users/{uid}.userPreference` + 현재 상황 설문
- 비회원: 간소화된 현재 설문만 사용
- 로그인 회원 결과는 Firestore 저장
- 비회원 결과는 React 임시 상태
- 추천 결과 없이 `/ai/result` 직접 접근 시 `/ai` 또는 `/ai/survey` 이동
- 막둥이 주막은 `src/data/tavernGame.js`와 전용 에셋을 사용하는 체험형 콘텐츠다.

## Cart / Order

| Page | URL | Access |
|---|---|---|
| Cart | `/cart` | 로그인 회원 |
| Checkout | `/checkout` | 로그인 + 성인인증 완료 |
| OrderComplete | `/order-complete` | 로그인 회원 |

규칙:

- 장바구니 상품 없으면 Checkout 진행 불가
- OrderComplete는 정상 생성 주문 정보가 있는 경우에만 표시
- 주문 정보 없이 직접 접근 시 주문내역 또는 메인 이동

## MyPage

| Page | URL | Access |
|---|---|---|
| MyHome | `/mypage` | 로그인 회원 |
| ProfileEdit | `/mypage/profile` | 로그인 회원 |
| OrderHistory | `/mypage/orders` | 로그인 회원 |
| OrderDetail | `/mypage/orders/:orderId` | 로그인 회원 |
| WishList | `/mypage/wishlist` | 로그인 회원 |
| AddressBook | `/mypage/addresses` | 로그인 회원 |
| PointHistory | `/mypage/points` | 로그인 회원 |
| FrequentPurchase | `/mypage/frequent` | 로그인 회원 |
| ClaimHistory | `/mypage/claims` | 로그인 회원 |
| InquiryHistory | `/mypage/inquiries` | 로그인 회원 |
| AiHistory | `/mypage/ai-history` | 로그인 회원 |
| AiHistoryDetail | `/mypage/ai-history/:recommendationId` | 로그인 회원 |
| AiPreference | `/mypage/preference` | 로그인 회원 |
| EventHistory | `/mypage/events` | 로그인 회원 |
| EventWinningHistory | `/mypage/event-winnings` | 로그인 회원 |

## Event

| Page | URL | Access |
|---|---|---|
| EventList | `/events` | 전체 |
| EventReady | `/events/ready/:eventType` | 전체 |
| RouletteEvent | `/events/roulette` | 로그인 회원 |
| CardGame | `/events/card-game` | 로그인 회원 |
| OxQuizEvent | `/events/ox-quiz` | 로그인 회원 |

규칙:

- 이벤트 Public Route는 `/events` 복수형으로 통일한다.
- 세 참여형 이벤트 모두 `eventParticipations/{eventId}_{uid}`를 사용한다.

## Support

| Page | URL | Access |
|---|---|---|
| NoticeList | `/notices` | 전체 |
| NoticeDetail | `/notices/:noticeId` | 전체 |
| FAQ | `/faq` | 전체 |
| InquiryQnA | `/inquiry` | 페이지 접근 전체 / 문의 등록·내역 로그인 회원 |

규칙:

- FAQ는 `/faq` Route를 사용한다.
- Footer 고객센터 링크는 공지사항 / 자주 묻는 질문 / 1:1 문의하기를 제공한다.
- 배송 / 교환 / 환불 내용은 고객센터 콘텐츠 범위에서 관리한다.

## Admin

| Page | URL | Access |
|---|---|---|
| Dashboard | `/admin` | 관리자 |
| UserManage | `/admin/users` | 관리자 |
| ProductManage | `/admin/products` | 관리자 |
| OrdersManage | `/admin/orders` | 관리자 |
| AiLogManage | `/admin/ai-logs` | 관리자 |
| EventManage | `/admin/events` | 관리자 |
| NoticeManage | `/admin/notices` | 관리자 |
| ReviewManage | `/admin/reviews` | 관리자 |

규칙:

- NoticeManage / ReviewManage 구현 담당은 이유진
- Routing 연결 확인은 김지우 공통 Routing 영역에서 담당

관리자 기준:

```text
users/{uid}.role === "admin"
```

## Layout Error Content

Admin / MyPage 영역에는 각 Layout에 맞는 에러 콘텐츠 컴포넌트를 사용한다.

```text
src/pages/Admin/AdminErrorContent.jsx
src/pages/MyPage/MyPageErrorContent.jsx
```

- 전체 Route 연결은 `src/App.jsx`에서 관리하므로 연결 방식 변경 시 팀장에게 공유한다.
- 존재하지 않는 URL을 처리하는 `NotFound.jsx`와 역할을 혼동하지 않는다.

## NotFound

```text
* → NotFound.jsx
```

## Route Notes

- `SplashIntro.jsx`는 초기 진입 연출과 `/intro` Route에서 사용한다.
- `ScrollToTop.jsx`는 공통 Routing 영역에서 라우트 이동 시 스크롤 위치를 초기화한다.
- 동적 route의 `:productId`, `:orderId`, `:noticeId`, `:recommendationId`에는 실제 데이터 ID 사용
- `ProtectedRoute.jsx`와 `AdminRoute.jsx`는 현재 placeholder이며 `App.jsx` Route에 연결되지 않았다.
- 로그인 회원 전용 페이지와 관리자 페이지의 Route guard 연결은 남은 필수 작업이다.
- guard 연결 전에도 각 화면의 Firebase 사용자 확인과 Firestore Rules를 유지한다.
- 관리자 URL 접근 제한만으로 보안을 보장하지 않는다.
- 실제 데이터 접근은 Firestore Rules 및 서버 검증 적용

---

# 27. Loading / Error / Empty Rules

공통 상태 UI를 우선 사용한다.

- Loading
- ErrorState
- EmptyState
- ErrorBoundary

페이지별로 동일한 Loading / Error / Empty 컴포넌트를 중복 생성하지 않는다.

AI 오류는 공통 Error Code를 기준으로 사용자용 메시지로 변환한다.

---

# 28. Environment / Secret Rules

## Frontend

`.env.local`

- Firebase Client 환경변수
- Git에 실제 값을 올리지 않는다.

`.env.example`

- 필요한 환경변수 이름만 공유
- 실제 secret 값 금지

## Functions

`functions/.secret.local`

- 로컬 OpenAI Secret
- Git commit 금지

## Never

- API Key를 JSX / JS에 직접 작성
- OpenAI Secret을 Frontend 환경에 노출
- Secret 파일 commit

---

# 29. Firestore / Security Rules

보안은 UI Route Guard만으로 처리하지 않는다.
반드시 실제 `firestore.rules`에 데이터 접근 정책을 반영한다.

최소 원칙:

- 일반 사용자는 자신의 `role`을 직접 수정할 수 없다.
- 일반 회원은 본인 사용자 데이터의 허용 필드만 접근한다.
- Wishlist는 로그인 회원 본인의 `users/{uid}/wishlist/*`만 접근 가능하게 한다.
- 일반 회원은 본인 추천 기록만 조회한다.
- 추천 기록 client create/update 금지
- AI 추천 기록 생성은 Cloud Functions
- 관리자 AI 이용 로그 생성·수정은 Cloud Functions Admin SDK만 허용
- Admin 권한은 `users/{uid}.role === "admin"`
- 관리자 전용 데이터는 동일 role 기준으로 보호
- `guestSessions`와 `aiRequestGuards`를 도입하는 경우 client direct write를 허용하지 않는다.

복합 Query에 필요한 Index는 `firestore.indexes.json`에 명시한다.

---

# 30. Source of Truth Summary

중복 기준을 만들지 않는다.

| Domain | Source of Truth |
|---|---|
| 로그인 / 인증 기준 | Firebase Authentication + Firestore `users/{uid}` |
| 회원 기본 취향 | `users/{uid}.userPreference` |
| 회원 포인트 | `users/{uid}.points` |
| 회원 상태 | `active` / `suspended` |
| 성인인증(회원) | `users/{uid}.isAdultVerified` |
| 성인인증(비회원) | 현재 `sessionStorage:jajak_adult_verified` / 목표 `guestSessions/{anonymousUid}` |
| AI 설문 상태 | `useAiSurvey` + React 기본 상태 |
| Cart localStorage key | `jajak_cart` |
| Cart 저장 형태 | `[{ productId, quantity }]` |
| Cart 공통 입출력 | `src/utils/cartStorage.js` |
| Wishlist | `users/{uid}/wishlist/{productId}` |
| 이벤트 참여 기록 | `eventParticipations/{eventId}_{uid}` |
| 주문 기록 | Firestore `orders` |
| 상품 seed/reference | `src/data/products/*.json` |
| 페어링 seed/reference | `src/data/pairings.json` |
| Runtime 상품 / 페어링 | Firestore |
| AI 상품 / 페어링 기준 | Client가 Firestore에서 조회한 후보 + Functions 검증 |
| URL | `src/App.jsx` + `src/routes/paths.js` |
| AI 설문 key / enum | `constants/aiSurvey.js` |
| Preference 질문 | `constants/preferenceSurvey.js` |
| 공통 취향 축 | `constants/tasteAxis.js` |
| 주문 상태 | `constants/orderStatus.js` |
| 이벤트 상태 | `constants/eventStatus.js` |
| 관리자 실제 권한 | `users/{uid}.role` + Firestore Rules / server validation |
| AI 추천 기록 | Firestore `users/{uid}/recommendations/{recommendationId}` |
| 관리자 AI 이용 로그 | Firestore `aiRecommendationLogs/{logId}` / 현재 관리 UI는 `mockLogs` |
| 리뷰 | Firestore `reviews/{reviewId}` |
| 디자인 Token | `src/styles/_variables.scss` |
| Git 통합 기준 | `dev` |
| 안정 버전 기준 | `main` |

---

# 31. Git / Branch Workflow

브랜치는 크게 다음 구조로 운영한다.

```text
main
dev
개인 브랜치
```

## Branch Roles

### `main`

- 전체 기능이 정상 동작하는 안정 버전
- 팀장이 검증 완료된 `dev`를 반영한다.
- 팀원은 `main`에 직접 push하지 않는다.

### `dev`

- 개인 브랜치의 작업을 팀장이 통합하고 확인하는 브랜치
- 팀원은 `dev`에 직접 push하지 않는다.
- 팀장이 각 개인 브랜치 작업을 `dev`에 merge한다.

### 개인 브랜치

- 각 팀원의 실제 작업 브랜치
- 팀원은 자신의 개인 브랜치에서만 작업하고 push한다.

## Daily Work Flow

작업 시작 전:

```bash
git switch dev
git pull origin dev
git switch <개인-브랜치>
git merge dev
```

작업 중에는 수시로 확인한다.

```bash
git status
```

작업 완료 후:

```bash
git add .
git commit -m "<type>: <작업 내용>"
git push origin <개인-브랜치>
```

팀장은 개인 브랜치 작업을 `dev`에 통합하여 정상 동작 여부를 확인하고, 안정된 버전을 `main`에 반영한다.

## Git Rules

- `main` 직접 push 금지
- `dev` 직접 push 금지
- 작업 시작 시 최신 `dev`를 개인 브랜치에 반영
- 작업 완료 후 자신의 개인 브랜치에만 push
- 하나의 거대한 commit보다 기능 단위 commit을 권장
- merge 전 `git status`로 미추적 / 불필요 파일을 확인
- `.env.local`, secret 파일은 commit하지 않는다.
- 충돌 해결 시 다른 담당자의 코드를 임의로 삭제하거나 변경하지 않는다.
- 충돌 원인을 이해하기 어려우면 팀장 또는 해당 담당자와 확인 후 처리한다.

Commit 예:

```text
feat: 마이페이지 공통 레이아웃 구현
style: 마이페이지 반응형 스타일 적용
feat: 관리자 공통 레이아웃 구현
fix: 장바구니 수량 계산 오류 수정
docs: AGENTS 협업 규칙 업데이트
```

---

# 32. Codex Rules

Codex는 다음 순서와 규칙을 따른다.

## Before Work

1. `AGENTS.md` 읽기
2. 요청 범위 확인
3. 담당자 소유 영역 확인
4. 기존 Component / Hook / Service / Utility / Constant 검색
5. 재사용 가능한 기존 코드 확인
6. 실제 GitHub 폴더 구조와 경로 확인

## During Work

1. 요청받지 않은 페이지를 동시에 리팩터링하지 않는다.
2. 새 dependency를 임의 설치하지 않는다.
3. 새로운 전역 상태관리 구조를 임의 도입하지 않는다.
4. Firebase Collection / Field / Enum을 임의 생성하지 않는다.
5. seed/reference JSON 구조를 임의 변경하지 않는다.
6. 기존 공통 UI를 중복 생성하지 않는다.
7. 기존 UI를 임의 재설계하지 않는다.
8. Secret을 코드에 직접 작성하지 않는다.
9. 다른 담당자 파일을 불필요하게 수정하지 않는다.
10. 같은 상태를 여러 Component / Hook에서 불필요하게 중복 관리하지 않는다.
11. Route 문자열을 페이지에 임의 하드코딩하지 않는다.
12. AI Request / Response 필드명을 임의 변경하지 않는다.
13. Runtime 상품 Source를 seed/reference JSON으로 대체하지 않는다.
14. Cart localStorage는 `jajak_cart`와 `cartStorage.js` 계약을 따른다.
15. Wishlist에 상품 전체 객체를 중복 저장하지 않는다.
16. 현재 구조에 없는 Functions 하위 폴더를 임의 생성하지 않는다.

## After Work

1. 수정 파일 목록 확인
2. 요청 범위를 벗어난 변경 확인
3. import path 확인
4. lint 오류 확인
5. build 오류 확인
6. 변경 내용 보고
7. 남은 문제 / 의존사항 보고

---

# 33. Definition of Done

기능 완료 전 확인:

- [ ] 담당 범위 안에서 작업했는가
- [ ] 기존 공통 UI를 재사용했는가
- [ ] 동일 상태를 여러 위치에서 불필요하게 중복 관리하지 않는가
- [ ] 확정되지 않은 상태관리 구조를 새로 만들지 않았는가
- [ ] Firebase Schema를 임의 추가하지 않았는가
- [ ] 관리자 role 보안 기준을 지켰는가
- [ ] 상품 ID / 카테고리 / 상태 규칙을 지켰는가
- [ ] Runtime 상품 데이터는 Firestore 기준인가
- [ ] Cart / Wishlist는 확정된 productId 참조 규칙을 지켰는가
- [ ] SCSS Modules 규칙을 지켰는가
- [ ] 반응형을 확인했는가
- [ ] Loading / Error / Empty 상태를 처리했는가
- [ ] Route Guard를 적용했는가
- [ ] 실제 데이터 권한은 Firestore Rules에서도 보호되는가
- [ ] API Key / Secret 노출이 없는가
- [ ] lint 오류가 없는가
- [ ] build 오류가 없는가
- [ ] 다른 담당자의 기능을 깨뜨리지 않았는가
- [ ] 최신 `dev`를 개인 브랜치에 반영하고 작업했는가
- [ ] `main` / `dev`에 직접 push하지 않았는가
- [ ] 자신의 개인 브랜치에만 작업 결과를 push했는가

---

# 34. Change Management

이 문서는 프로젝트 진행 중 변경될 수 있다.

아래 항목은 변경 전에 반드시 관련 담당자 또는 팀과 협의한다.

- Folder Structure
- Routes
- Firebase Schema
- Firestore Security Rules
- Product JSON Schema
- Pairing Schema
- AI Request / Response Contract
- React 상태 관리 / 공통 데이터 계약
- Status Enum
- 공통 UI
- 디자인 공통 변수
- Dependency
- Git / Branch Workflow

규칙이 변경되면 코드만 바꾸지 말고 `AGENTS.md`도 함께 갱신한다.

---

# 35. Current Status

현재 저장소 구조와 팀 역할은 실제 개발 진행에 맞춰 확장되었으며, AGENTS는 실제 저장소 구조를 기준으로 유지한다.

최근 확정된 추가 기준:

- AdminHeader / AdminFooter → 김지우 공통 영역
- MobileSearchModal → 김지우 Header / Search 공통 영역
- ScrollToTop → 김지우 Routing 공통 영역
- NoticeManage / ReviewManage → 이유진 구현, 김지우 Routing 연결 확인
- Preference 세부 화면 → `/preference/*` 단계별 Route
- FAQ → `/faq`
- 공지 / 문의 → `/notices`, `/inquiry`
- Public Event Route → `/events` 복수형
- 참여형 이벤트 → `/events/roulette`, `/events/card-game`, `/events/ox-quiz`
- 이벤트 준비 화면 → `/events/ready/:eventType`
- 이벤트 참여 저장 → `eventParticipations/{eventId}_{uid}` 공통 사용
- AI 추천 저장 → `users/{uid}/recommendations/{recommendationId}`
- 막둥이 주막 → `/ai/tavern` + `src/data/tavernGame.js`
- AI 추천 기록 상세 → `/mypage/ai-history/:recommendationId`
- 관리자 AI 이용 로그 → Functions가 `aiRecommendationLogs/{logId}` 저장 / `AiLogManage` 화면은 현재 `mockLogs`
- 관리자·마이페이지 공통 UI → `src/components/admin/*`, `src/components/mypage/*`
- `MyPageCard*`, `MyPageEmpty*` → 현재 빈 placeholder 파일
- 상품 안내·액션 공통 UI → `src/components/shop/*`
- `ProtectedRoute` / `AdminRoute` → placeholder 상태이며 Route guard 연결 필요

기존 핵심 데이터 계약:

- Runtime 상품 / 페어링 Source of Truth → Firestore
- 상품 JSON → Firestore 등록용 seed/reference
- 회원 기본 취향 → `users/{uid}.userPreference`
- Wishlist → `users/{uid}/wishlist/{productId}`
- Cart → `jajak_cart` + `cartStorage.js`
- 회원 포인트 → `users/{uid}.points`
- 회원 status → `active` / `suspended`
- 비밀번호 변경 / 회원탈퇴 → 구현 범위 제외

구현 중 구조 또는 계약 변경이 필요하면 관련 담당자와 협의 후 코드와 `AGENTS.md`를 함께 갱신한다.

---

# 36. Version History

## v1.9 — 2026-09-10

- 최신 `origin/dev` 통합본 `25d7631` 기준으로 실제 구조 재점검
- 막둥이 주막 `MakdongTavern`, `tavernGame.js`, `/ai/tavern` Route 반영
- `AiHistoryDetail`과 `/mypage/ai-history/:recommendationId` Route 반영
- 관리자·마이페이지·상품·메인 공통 컴포넌트와 관리자 전용 스타일 폴더 반영
- `MyPageCard*`, `MyPageEmpty*`의 빈 placeholder 상태 명시
- Functions의 `aiRecommendationLogs/{logId}` 저장 및 관리자 전용 read Rules 반영
- `AiLogManage`는 실제 collection에 아직 연결되지 않고 `mockLogs`를 표시하는 상태로 구분
- README용 `docs/images/*` 폴더와 `event-review.mjs`를 실제 루트 구조에 반영

## v1.8 — 2026-09-08

- Team Ownership의 전체 담당 범위를 유지하면서 `소유 경로 / 책임 / 연동 경계` 형식으로 압축
- 김지우·김태은·백현정의 팀원별 Codex 보완자료를 실제 파일 및 Git 이력과 대조해 세부 기여와 공동 작업 경계를 추가
- README 팀 구성 표를 Team Ownership과 동일한 담당 범위 및 공동 작업 경계로 갱신
- 실제 `src/App.jsx` 기준으로 Preference, Brand, Event, Support, MyPage, Admin Route 갱신
- `/event/*`를 `/events/*`로, `/support/*`를 `/notices`·`/faq`·`/inquiry`로 수정
- Preference 세부 화면의 단계별 Route와 `/brand/makdong` 반영
- 신규 MyPage 화면, `OrdersManage`, `EventReady`, AI 보조 화면과 서비스 파일을 폴더 구조에 반영
- Functions 구조를 `index.js`, `recommendation.js`, `utils/*` 기준으로 갱신
- 현재 Callable Request / Response와 `users/{uid}/recommendations/{recommendationId}` 저장 계약 반영
- `recommendationApi.js`, `ProtectedRoute.jsx`, `AdminRoute.jsx`의 placeholder / 미연결 상태 명시
- 전역 성인 확인의 `sessionStorage:jajak_adult_verified` 구현과 익명 인증 / `guestSessions` 목표 상태 구분
- Firestore Runtime 원칙과 상품·이벤트 seed/reference fallback의 현재 상태 구분
- 관리자 AI 로그가 시연 데이터임을 명시

## v1.7 — 2026-08-31

- 주말 이후 실제 저장소 구조 확장분 반영
- `src/components/admin/`에 AdminHeader / AdminFooter 추가
- `MobileSearchModal.jsx`, `ScrollToTop.jsx` 추가
- AdminHeader / AdminFooter / MobileSearchModal / ScrollToTop 담당을 김지우 공통 영역으로 확정
- Admin `NoticeManage`, `ReviewManage` 추가 및 이유진 구현 담당 반영
- PreferenceSurvey 세부 화면 4개 추가 및 `/preference` 내부 step 전환 방식 확정
- `CardGame`, `OxQuizEvent` 추가
- Public Event Route를 `/event` 단수형으로 통일
- Roulette / CardGame / OX Quiz 참여 기록을 `eventParticipations/{eventId}_{uid}`로 통일
- `FAQ.jsx` 추가 및 `/support/faq` 별도 Route 확정
- Footer 고객센터 링크에 공지사항 / FAQ / 1:1 문의하기 반영
- Main 전용 Section / Hook 구조 반영
- assets는 실제 구조에 맞추되 주요 폴더 단위로만 간략 문서화
- 페이지 전용 Component / Hook co-location 원칙을 Structure Rules에 추가

## v1.6 — 2026-08-24

- Section 6 Project Folder Structure를 팀장이 전달한 파일별 역할 설명 포함 최종 구조로 갱신
- `src/pages/Admin/AdminErrorContent.jsx` 및 `AdminErrorContent.module.scss` 추가 반영
- `src/pages/MyPage/MyPageErrorContent.jsx` 및 `MyPageErrorContent.module.scss` 추가 반영
- Team Ownership의 이유진 MyPage / Admin 담당 범위에 각 ErrorContent 파일 추가
- Protected / Shared Files에 MyPage / Admin ErrorContent 파일 추가
- Routes 설명에 Layout별 Error Content와 `NotFound.jsx`의 역할 구분 추가
- `src/App.jsx`는 에러 콘텐츠 연결을 포함한 Route 공통 파일이므로 변경 시 팀장 공유 원칙 재확인
- 문서 기준일을 2026-08-24로 갱신

## v1.5 — 2026-08-21

- 팀 전체 공유 전 최종 프론트엔드 아키텍처 / 데이터 계약 정리
- 상태 관리 문구를 React 기본 상태 관리 중심으로 정리하고 이전 전역 상태관리 계획 관련 표현 제거
- 김지우 담당에 PreferenceSurvey / `preferenceSurvey.js` / `userPreference` / `useAdultCheck` / 비회원 AI 흐름 추가
- 이영기 Auth 범위를 Login / Signup / Logout으로 확정하고 Firebase 익명 인증 함수 구현 경계 명시
- 회원가입 성공 후 `/preference` 연결까지만 이영기 담당으로 확정
- 고객센터를 공지사항 + InquiryQnA 내부 FAQ 구조로 통합
- 이유진 담당에 MyHome / `cartStorage.js` 추가
- 비밀번호 변경 / 회원탈퇴 기능 제외
- 회원 status를 `active` / `suspended`로 확정
- `users/{uid}.userPreference`, `users/{uid}.points` 저장 위치 확정
- Wishlist를 `users/{uid}/wishlist/{productId}`로 확정
- 이벤트 참여 기록을 `eventParticipations/{eventId}_{uid}`로 확정
- Cart key를 `jajak_cart`, 데이터 구조를 `[{ productId, quantity }]`로 확정
- `src/utils/cartStorage.js` 및 `getCart / saveCart / clearCart` 계약 추가
- 로그아웃 시 `jajak_cart` 삭제 규칙 확정
- 상품 JSON을 seed/reference로, 실제 Runtime 상품 / 페어링 Source of Truth를 Firestore로 확정
- Wishlist / Cart는 productId만 저장하고 현재 상품 정보는 Firestore에서 조회하도록 통일
- AI 후보 상품도 Firestore 현재 상품 기준으로 구성하도록 통일
- 팀장 최종 GitHub 구조 반영: BrandIntro / MakdongIntro, Support 구조, 기본 CSS 파일 제거, cartStorage 추가
- 현재 Functions 구조를 `functions/src/index.js` 기준으로 정리하고 미승인 하위 폴더 생성 금지

## v1.4 — 2026-08-21

- Protected / Shared Files 범위 확대
- 패키지 / 환경변수 / Git 작업 주의사항 강화
- `main`, `dev` 직접 작업 및 push 금지 명확화

## v1.3 — 2026-08-21

- Auth 담당을 이영기로 통합
- AdultModal / SearchModal을 Header 담당인 김지우 영역으로 정리
- 실제 GitHub 저장소 구조를 문서 기준으로 반영

## v1.2 — 2026-08-21

- 상태 관리 구조를 React 기본 상태 관리 중심으로 단순화
- 인증 기준을 Firebase Authentication + Firestore 회원 데이터로 정리
- AI 설문 / 비회원 결과 / Cart 상태 처리 원칙 단순화

## v1.1 — 2026-08-21

- Auth 담당 조정
- Design Token / responsive / Sass / semantic HTML 규칙 추가
- MyPage / Admin 디자인 인수인계 규칙 추가
- Git Branch Workflow 추가

## v1.0 — 2026-08-18

- 프로젝트 구조, 역할, Firebase, 상품, 주문, 이벤트, AI, Route의 초기 공통 규칙 확정
