# JAJAK AGENTS.md

> Version: 1.6  
> Last updated: 2026-08-24  
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
- React Router
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
14. Runtime 상품 정보는 Firestore를 기준으로 하며 seed/reference JSON을 Runtime 데이터처럼 사용하지 않는다.

---

# 4. Team Ownership

## 김지우 — 공통 구조 / Routing / AI / PreferenceSurvey

담당:

### 공통 구조 / Routing

- Header 전체
- DesktopHeader / MobileHeader / MobileBottomNav
- SiteLayout
- Footer
- AdultModal
- SearchModal
- GNB / 검색 진입 및 이동 흐름
- 전체 URL / Routing
- MyPage nested routing
- Admin access control / routing

### PreferenceSurvey / 성인인증

- `PreferenceSurvey.jsx`
- `PreferenceSurvey.module.scss`
- 회원가입 후 기본 취향 설문
- `constants/preferenceSurvey.js`
- `users/{uid}.userPreference` 저장 구조 관리
- `useAdultCheck.js`
- 비회원 성인인증 흐름

### AI

- AI 큐레이션 페이지
- AI 추천 결과
- AI 추천 기록 저장
- 비회원 AI 서비스 흐름
- MyPage AI 추천 내역
- Admin AI 추천 로그
- Firebase Cloud Functions / OpenAI 연동 구조

### 통합 / 공통 관리

- 최종 페이지 통합
- 전체 경로 점검
- 최종 기능 시나리오 정리
- 공통 용어 통합

※ 성인인증 팝업과 검색창은 Header와 연결되는 공통 기능으로 김지우가 담당한다.
※ `useAdultCheck.js`와 비회원 AI 흐름은 `src/firebase/auth.js`의 익명 인증 함수를 호출해 실제 서비스 흐름에 연결한다.

## 김태은 — 상품 / 상품 데이터 / 검색 / 이벤트

담당:

### 상품 / 데이터

- 상품 seed/reference JSON 관리 및 데이터 검증
- 상품 ID / 카테고리 / 상태 / 필드 구조 관리
- Firestore 상품 데이터 등록 및 상품 데이터 연동
- ProductCard
- 상품 목록
- 상품 상세 협업
- 카테고리 / 필터 / 정렬 / 검색
- 상품 상태 및 재고 표시
- Admin 상품관리

### 이벤트

- 이벤트 목록
- 이벤트 상세
- RouletteEvent
- 이벤트 참여 / 추첨 로직
- 이벤트 결과 및 경품 정보 처리
- MyPage 이벤트 참여 내역
- Admin 이벤트관리

※ 상품 seed/reference JSON의 최종 관리자는 김태은이다.
※ Runtime 상품 정보는 Firestore를 기준으로 하며, 상품 화면 / 이벤트 연계 기능에서 현재 상품 데이터를 사용한다.
※ 상품 ID, 카테고리, 상품 상태 등 공통 상품 데이터 규칙 변경이 필요한 경우 팀원과 먼저 공유한다.

## 백현정 — Main / Brand / Admin Dashboard / Design

담당:

### Main

- MainPage
- SplashIntro
- Hero 영역
- 대표 상품 노출
- AI 추천 진입 영역
- 이벤트 진입 영역
- 메인 페이지 주요 섹션 구성

### Brand

- BrandIntro
- MakdongIntro
- 브랜드 소개 콘텐츠
- 자작 브랜드 및 막동이 캐릭터 소개 영역

### Admin

- Admin Dashboard
- 관리자 메인 요약 화면
- 주요 관리 데이터의 Dashboard UI 구성

### Design

- 공통 디자인 규칙 협의
- Figma 기준 디자인 톤 정리
- 공통 색상 / 타이포 / 여백 / 반응형 기준 협의
- 페이지별 디자인 구현 시 기존 JAJAK 디자인 톤 유지 여부 확인

※ Main / Brand는 사용자가 서비스의 브랜드와 주요 기능을 처음 접하는 Entry 영역으로 구성한다.
※ Admin Dashboard는 AdminLayout 내부에서 사용하며, 관리자 공통 Layout 자체는 수정하지 않는다.
※ 디자인에 정의되지 않은 신규 스타일을 임의로 확장하지 않고 공통 Design Token과 기존 UI 패턴을 우선한다.

## 이영기 — Auth / 고객센터 / Wishlist / 상품 상세 협업

담당:

### Auth

- Login
- Signup
- Logout
- Firebase Authentication 기본 인증 흐름
- `src/firebase/auth.js`의 로그인 / 회원가입 / 로그아웃 관련 구현
- `signInAnonymously()` 등 Firebase 익명 인증 함수 구현
- 회원가입 성공 후 `/preference` 이동 연결

### 고객센터

- 공지사항 목록 / 상세
- 문의하기 페이지
- 자주 묻는 질문 영역
- 문의 유형 구성
  - 주문 / 결제
  - 배송
  - 교환 / 환불
  - 회원 / 기타
- 1:1 문의 등록
- 문의 제목 / 내용 입력
- 문의 내역 및 답변 확인

### Wishlist / 상품

- Wishlist / 찜
- 상품 상세 협업
- 찜 상품 장바구니 이동

※ 로그인 / 회원가입 / 로그아웃 기능 자체는 이영기가 담당한다.
※ 고객센터는 공지사항과 문의하기를 중심으로 구성하며, FAQ와 배송 / 교환 / 환불은 별도 페이지로 분리하지 않고 InquiryQnA 내부의 자주 묻는 질문 영역에 포함한다.
※ 회원가입 성공 후 `/preference` 이동 연결까지 이영기가 담당하며, `PreferenceSurvey.jsx` 진입 이후 설문 UI / 진행 / 저장은 김지우가 담당한다.

## 이유진 — Cart / Order / MyPage / Admin / 회원관리 / 공통 구조

담당:

### Cart / Order

- Cart
- 장바구니 상품 / 수량 처리
- `src/utils/cartStorage.js`
- `jajak_cart` localStorage 연동
- Checkout
- 주문정보 확인 및 주문 저장
- OrderComplete
- 주문 완료 후 Cart 초기화
- OrderHistory / OrderDetail
- MyPage 주문내역 연동

### MyPage

- MyPage 공통 Layout
- MyHome
- MyPage Sidebar / 회원 요약 / Content / Outlet 구조
- ProfileEdit
- 회원 기본정보 표시 / 수정
- MyPage 하위 페이지 공통 디자인 및 반응형 구조 유지

### Admin

- Admin 공통 Layout
- Admin Sidebar / Header / Content / Outlet 구조
- UserManage
- 회원 목록 / 검색 / 상태 관리
- 관리자 페이지 공통 디자인 및 반응형 구조 유지

### 회원 / 공통 연동

- Firebase 로그인 사용자 정보를 MyPage / Cart / Order에 연결
- `users/{uid}` 회원 데이터 연동
- `role` 데이터를 Admin 화면에서 사용
- 회원 `status`를 `active / suspended` 기준으로 처리

### 문서

- AGENTS.md 정리
- README 정리
- 담당 기능의 공통 데이터 계약 및 구현 규칙 반영

※ 이유진은 로그인 / 회원가입 / 로그아웃 인증 기능 자체를 구현하지 않는다.
※ MyPage / Admin / Cart / Order에서는 Auth 담당이 제공한 인증 함수와 Firebase 회원 데이터를 사용한다.
※ 비밀번호 변경 및 회원탈퇴 기능은 이번 구현 범위에 포함하지 않는다.
---

# 5. Protected / Shared Files

아래 파일 또는 영역은 프로젝트 전체에 영향을 주는 공통 파일이므로 담당자 또는 팀 합의 없이 임의 수정하지 않는다.

## 공통 레이아웃 / 라우팅

- `src/components/common/Header.jsx`
- `src/components/common/DesktopHeader.jsx`
- `src/components/common/MobileHeader.jsx`
- `src/components/common/MobileBottomNav.jsx`
- `src/components/common/Footer.jsx`
- `src/components/common/SiteLayout.jsx`
- `src/components/common/AdultModal.jsx`
- `src/components/common/SearchModal.jsx`
- 공통 Header / Footer 관련 `*.module.scss`
- `src/pages/MyPage/MyPageLayout.jsx`
- `src/pages/MyPage/MyPageLayout.module.scss`
- `src/pages/MyPage/MyPageErrorContent.jsx`
- `src/pages/MyPage/MyPageErrorContent.module.scss`
- `src/pages/Admin/AdminLayout.jsx`
- `src/pages/Admin/AdminLayout.module.scss`
- `src/pages/Admin/AdminErrorContent.jsx`
- `src/pages/Admin/AdminErrorContent.module.scss`
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

## 공통 스타일

- `src/styles/*`

공통 스타일 파일은 팀 공통 기준이므로 임의 수정하지 않는다.

## 공용 데이터 / 설정

- `src/data/products/*.json`
- `src/data/products/index.js`
- `src/data/events.json`
- `src/data/pairings.json`
- `src/constants/*`
- `src/utils/cartStorage.js`
- `vite.config.js`
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

아래 구조는 팀장이 전달한 **최종 GitHub 구조와 각 파일 역할 설명**을 기준으로 한다.

`src/pages/Admin/`과 `src/pages/MyPage/`에는 작업 과정에서 추가된 에러 콘텐츠 컴포넌트를 현재 구조에 함께 반영한다.

```text
jajak/
│
├── .env.example                         // 환경변수 이름 공유용 예시 파일 (실제 값 작성 X)
├── .env.local                           // 개인 Firebase 환경변수 실제 값 저장 (GitHub 업로드 X)
├── .firebaserc                          // Firebase 프로젝트 연결 정보
├── .gitignore                           // GitHub에 올리지 않을 파일/폴더 설정
├── .oxlintrc.json                       // Oxlint 코드 검사 설정
├── AGENTS.md                            // 팀 공통 개발 규칙 / 역할 / 데이터 계약 문서
├── firebase.json                        // Firebase Functions/Emulator 등 Firebase 설정
├── firestore.indexes.json               // Firestore 복합 인덱스 설정
├── firestore.rules                      // Firestore 읽기/쓰기 보안 규칙
├── index.html                           // Vite 앱의 기본 HTML 진입점
├── package.json                         // 프로젝트 패키지/스크립트 정보
├── package-lock.json                    // 설치된 패키지 버전 고정 파일
├── README.md                            // 프로젝트 소개 및 실행 방법 문서
├── vite.config.js                       // Vite 빌드/개발 서버 설정
│
│
├── functions/                           // Firebase Cloud Functions 서버 영역
│   │
│   ├── src/
│   │   └── index.js                     // Cloud Functions 진입점 / 서버 함수 export
│   │
│   ├── .gitignore                       // Functions 내부 Git 제외 설정
│   ├── package.json                     // Functions 전용 패키지/스크립트
│   └── package-lock.json                // Functions 패키지 버전 고정
│
│
├── public/                              // 빌드 시 그대로 제공되는 정적 파일
│   └── favicon.png                      // 브라우저 탭 JAJAK 파비콘
│
│
└── src/                                 // React 프론트엔드 소스
    │
    │
    ├── assets/                          // 이미지 / 아이콘 / 캐릭터 등 정적 리소스
    │   │
    │   ├── characters/                  // 캐릭터 이미지
    │   │   └── makdong                  // JAJAK 캐릭터 '막둥이' 이미지 모음
    │   │
    │   ├── icons/                       // 사이트 공통 아이콘
    │   │   ├── cartIcon.png             // 장바구니 아이콘
    │   │   ├── categoryIcon.png         // 모바일 카테고리 아이콘
    │   │   ├── homeIcon.png             // 모바일 홈 아이콘
    │   │   ├── loginIcon.png            // 로그인 아이콘
    │   │   ├── mypageIcon.png           // 마이페이지 아이콘
    │   │   ├── searchIcon.png           // 검색 아이콘
    │   │   └── wishIcon.png             // 찜 / Wishlist 아이콘
    │   │
    │   ├── images/                      // 페이지별 이미지
    │   │   ├── brand/                   // 브랜드 소개 / 막둥이 소개 이미지
    │   │   ├── events/                  // 이벤트 페이지 이미지
    │   │   ├── main/                    // 메인 페이지 배너/섹션 이미지
    │   │   ├── mypage/                  // 마이페이지 관련 이미지
    │   │   └── products/                // 상품 이미지
    │   │
    │   └── logos/
    │       └── jajakLogo.png            // JAJAK 공통 로고
    │
    │
    │
    ├── components/                      // 여러 페이지에서 재사용하는 공통 컴포넌트
    │   │
    │   ├── common/                      // 사이트 공통 레이아웃/기능 컴포넌트
    │   │   │
    │   │   ├── AdultModal.jsx           // 성인인증 안내/확인 모달
    │   │   ├── AdultModal.module.scss   // 성인인증 모달 스타일
    │   │   │
    │   │   ├── DesktopHeader.jsx        // PC/태블릿용 Header 및 GNB/SNB
    │   │   ├── DesktopHeader.module.scss// PC/태블릿 Header 스타일
    │   │   │
    │   │   ├── ErrorBoundary.jsx        // React 렌더링 오류 발생 시 예외 처리
    │   │   │
    │   │   ├── Footer.jsx               // 사이트 공통 Footer
    │   │   ├── Footer.module.scss       // Footer 반응형 스타일
    │   │   │
    │   │   ├── Header.jsx               // DesktopHeader/MobileHeader를 묶는 Header
    │   │   ├── Header.module.scss       // Header 공통 스타일
    │   │   │
    │   │   ├── MobileBottomNav.jsx      // 모바일 하단 고정 네비게이션
    │   │   ├── MobileBottomNav.module.scss
    │   │   │                             // 모바일 하단 네비게이션 스타일
    │   │   │
    │   │   ├── MobileHeader.jsx         // 모바일 상단 Header / 햄버거 메뉴
    │   │   ├── MobileHeader.module.scss // 모바일 Header 스타일
    │   │   │
    │   │   ├── PagePlaceholder.jsx      // 개발 전 임시 페이지/빈 화면 표시용
    │   │   │
    │   │   ├── SearchModal.jsx          // 공통 상품 검색 모달/검색 UI
    │   │   ├── SearchModal.module.scss  // 검색 모달 스타일
    │   │   │
    │   │   └── SiteLayout.jsx           // Header + 본문 + Footer + 모바일 하단Nav 공통 Layout
    │   │
    │   │
    │   └── ui/                          // 재사용 가능한 작은 UI 컴포넌트
    │       │
    │       ├── Badge/
    │       │   ├── Badge.jsx            // 상태/카테고리 등 작은 배지 UI
    │       │   └── Badge.module.scss     // Badge 스타일
    │       │
    │       ├── Button/
    │       │   ├── Button.jsx           // 공통 버튼 컴포넌트
    │       │   └── Button.module.scss    // 공통 버튼 스타일
    │       │
    │       ├── EmptyState/
    │       │   ├── EmptyState.jsx       // 찜/주문/기록 등이 없을 때 표시
    │       │   └── EmptyState.module.scss
    │       │                             // EmptyState 스타일
    │       │
    │       ├── ErrorState/
    │       │   ├── ErrorState.jsx       // 데이터 조회 실패 등 오류 상태 UI
    │       │   └── ErrorState.module.scss
    │       │                             // ErrorState 스타일
    │       │
    │       ├── Loading/
    │       │   ├── Loading.jsx          // 로딩 상태 UI
    │       │   └── Loading.module.scss  // 로딩 스타일
    │       │
    │       ├── Modal/
    │       │   ├── Modal.jsx            // 범용 모달 컴포넌트
    │       │   └── Modal.module.scss     // 공통 모달 스타일
    │       │
    │       ├── Pagination/
    │       │   ├── Pagination.jsx       // 상품/공지 등 목록 페이지 번호 이동
    │       │   └── Pagination.module.scss
    │       │                             // Pagination 스타일
    │       │
    │       ├── ProductCard/
    │       │   ├── ProductCard.jsx      // 상품 목록 등에 사용하는 공통 상품 카드
    │       │   └── ProductCard.module.scss
    │       │                             // 상품 카드 스타일
    │       │
    │       ├── QuestionCard/
    │       │   ├── QuestionCard.jsx     // AI/취향 설문 질문 카드 공통 UI
    │       │   └── QuestionCard.module.scss
    │       │                             // 질문 카드 스타일
    │       │
    │       └── Tabs/
    │           ├── Tabs.jsx             // 탭 전환 공통 UI
    │           └── Tabs.module.scss      // Tabs 스타일
    │
    │
    │
    ├── constants/                       // 프로젝트에서 공통으로 사용하는 고정 값
    │   ├── aiSurvey.js                  // 당일 AI 추천 설문 질문/선택지 정의
    │   ├── eventStatus.js               // 이벤트 상태값 정의
    │   ├── orderStatus.js               // 주문 상태값 정의
    │   ├── preferenceSurvey.js          // 회원가입 후 기본 취향 설문 정의
    │   ├── tasteAxis.js                 // AI 추천용 맛/취향 기준 축 정의
    │   └── userRole.js                  // 일반회원/관리자 등 사용자 권한 정의
    │
    │
    │
    ├── data/                            // 초기/정적 데이터
    │   │
    │   ├── products/                    // Firestore 등록용 초기 상품 데이터
    │   │   ├── foods.json               // 안주 상품 데이터
    │   │   ├── gifts.json               // 선물세트 상품 데이터
    │   │   ├── glasses.json             // 술잔 상품 데이터
    │   │   ├── index.js                 // 각 상품 JSON 통합/export
    │   │   └── liquors.json             // 전통주 상품 데이터
    │   │
    │   ├── events.json                  // 이벤트 초기/기본 데이터
    │   └── pairings.json                // 전통주-안주-술잔 페어링 참고 데이터
    │
    │
    │
    ├── firebase/                        // Firebase 클라이언트 연동 모듈
    │   ├── auth.js                      // 로그인/회원가입/로그아웃/익명 인증 함수
    │   ├── firebase.js                  // Firebase 앱/Auth/Firestore 초기화
    │   └── firestore.js                 // Firestore 공통 조회/저장/수정/삭제 함수
    │
    │
    │
    ├── hooks/                           // React 공통 Custom Hook
    │   ├── useAdultCheck.js             // 성인인증 상태 및 AdultModal 흐름 관리
    │   ├── useAiSurvey.js               // AI 설문 단계/답변/검증 로직 관리
    │   └── useDebounce.js               // 검색 입력 등의 debounce 처리
    │
    │
    │
    ├── pages/                           // 실제 URL에 연결되는 페이지
    │   │
    │   │
    │   ├── Admin/                       // 관리자 페이지 영역
    │   │   │
    │   │   ├── AdminErrorContent.jsx    // 관리자 영역 에러 상태 콘텐츠
    │   │   ├── AdminErrorContent.module.scss
    │   │   │                             // 관리자 에러 콘텐츠 스타일
    │   │   ├── AdminLayout.jsx          // 관리자 공통 Sidebar/Header/Layout
    │   │   ├── AdminLayout.module.scss  // 관리자 공통 Layout 스타일
    │   │   │
    │   │   ├── AiLogManage.jsx          // 관리자 AI 추천 사용/기록 관리 페이지
    │   │   ├── AiLogManage.module.scss  // AI 추천 관리 페이지 스타일
    │   │   │
    │   │   ├── Dashboard.jsx            // 관리자 메인 대시보드
    │   │   ├── Dashboard.module.scss    // 관리자 대시보드 스타일
    │   │   │
    │   │   ├── EventManage.jsx          // 관리자 이벤트 관리 페이지
    │   │   ├── EventManage.module.scss  // 이벤트 관리 스타일
    │   │   │
    │   │   ├── ProductManage.jsx        // 관리자 상품/재고 관리 페이지
    │   │   ├── ProductManage.module.scss
    │   │   │                             // 상품/재고 관리 스타일
    │   │   ├── UserManage.jsx           // 관리자 회원 조회/상태 관리 페이지
    │   │   └── UserManage.module.scss   // 회원관리 스타일
    │   │
    │   │
    │   │
    │   ├── AiCurator/                   // AI 개인 맞춤 큐레이션 영역
    │   │   ├── AiIntro.jsx              // AI 큐레이션 소개 / 추천 시작 페이지 (/ai)
    │   │   ├── AiIntro.module.scss      // AI 소개 페이지 스타일
    │   │   ├── AiResult.jsx             // AI 추천 결과 페이지
    │   │   ├── AiResult.module.scss     // AI 추천 결과 스타일
    │   │   ├── AiSurvey.jsx             // 당일 상황/취향 AI 추천 설문 페이지
    │   │   └── AiSurvey.module.scss     // AI 설문 스타일
    │   │
    │   │
    │   │
    │   ├── Auth/                        // 회원 인증 및 기본 취향 설정 영역
    │   │   ├── Login.jsx                // 로그인 페이지
    │   │   ├── Login.module.scss        // 로그인 페이지 스타일
    │   │   ├── PreferenceSurvey.jsx     // 회원가입 후 기본 취향 설문 페이지
    │   │   ├── PreferenceSurvey.module.scss
    │   │   │                             // 기본 취향 설문 스타일
    │   │   ├── Signup.jsx               // 회원가입 페이지
    │   │   └── Signup.module.scss       // 회원가입 스타일
    │   │
    │   │
    │   │
    │   ├── Brand/                       // JAJAK 브랜드 소개 영역
    │   │   ├── BrandIntro.jsx           // 자작 브랜드 소개 페이지 (/brand)
    │   │   ├── BrandIntro.module.scss   // 브랜드 소개 스타일
    │   │   ├── MakdongIntro.jsx         // 자작 캐릭터 '막둥이' 소개 페이지
    │   │   └── MakdongIntro.module.scss // 막둥이 소개 스타일
    │   │
    │   │
    │   │
    │   ├── CartOrder/                   // 장바구니 및 주문 흐름
    │   │   ├── Cart.jsx                 // 장바구니 페이지
    │   │   ├── Cart.module.scss         // 장바구니 스타일
    │   │   ├── Checkout.jsx             // 주문/배송정보/결제수단 입력 페이지
    │   │   ├── Checkout.module.scss     // 주문/결제 페이지 스타일
    │   │   ├── OrderComplete.jsx        // 주문 완료 페이지
    │   │   └── OrderComplete.module.scss
    │   │                                 // 주문 완료 스타일
    │   │
    │   │
    │   │
    │   ├── Event/                       // 사용자 이벤트 영역
    │   │   ├── EventList.jsx            // 이벤트 목록 페이지
    │   │   ├── EventList.module.scss    // 이벤트 목록 스타일
    │   │   ├── RouletteEvent.jsx        // 룰렛/경품 추천 이벤트 상세 및 응모
    │   │   └── RouletteEvent.module.scss
    │   │                                 // 룰렛 이벤트 스타일
    │   │
    │   │
    │   │
    │   ├── Main/                        // 사이트 메인 영역
    │   │   ├── MainPage.jsx             // JAJAK 메인 홈페이지 (/)
    │   │   ├── MainPage.module.scss     // 메인 페이지 스타일
    │   │   ├── SplashIntro.jsx          // Header/Footer 없는 초기 Splash 화면
    │   │   └── SplashIntro.module.scss  // Splash 애니메이션/화면 스타일
    │   │
    │   │
    │   │
    │   ├── MyPage/                      // 로그인 회원 마이페이지 영역
    │   │   ├── AiHistory.jsx            // 사용자의 이전 AI 추천 결과 목록
    │   │   ├── AiHistory.module.scss    // AI 추천 기록 스타일
    │   │   ├── EventHistory.jsx         // 사용자의 이벤트 참여/당첨 내역
    │   │   ├── EventHistory.module.scss // 이벤트 참여 내역 스타일
    │   │   ├── MyPageErrorContent.jsx   // 마이페이지 영역 에러 상태 콘텐츠
    │   │   ├── MyPageErrorContent.module.scss
    │   │   │                             // 마이페이지 에러 콘텐츠 스타일
    │   │   ├── MyHome.jsx               // 마이페이지 메인/요약 대시보드
    │   │   ├── MyHome.module.scss       // 마이페이지 홈 스타일
    │   │   ├── MyPageLayout.jsx         // 마이페이지 Sidebar/공통 Layout
    │   │   ├── MyPageLayout.module.scss // 마이페이지 공통 Layout 스타일
    │   │   ├── OrderDetail.jsx          // 개별 주문 상세 페이지
    │   │   ├── OrderDetail.module.scss  // 주문 상세 스타일
    │   │   ├── OrderHistory.jsx         // 사용자의 주문 내역 목록
    │   │   ├── OrderHistory.module.scss // 주문 내역 스타일
    │   │   ├── ProfileEdit.jsx          // 회원 정보 조회/수정 페이지
    │   │   ├── ProfileEdit.module.scss  // 회원정보 수정 스타일
    │   │   ├── WishList.jsx             // 사용자가 찜한 상품 목록 페이지
    │   │   └── WishList.module.scss     // 찜 목록 스타일
    │   │
    │   │
    │   │
    │   ├── NotFound/                    // 존재하지 않는 URL 처리
    │   │   ├── NotFound.jsx             // 404 Not Found 페이지
    │   │   └── NotFound.module.scss     // 404 페이지 스타일
    │   │
    │   │
    │   │
    │   ├── Shop/                        // 상품 탐색/상세 영역
    │   │   ├── ProductDetail.jsx        // 개별 상품 상세 페이지
    │   │   ├── ProductDetail.module.scss
    │   │   │                             // 상품 상세 스타일
    │   │   ├── ProductList.jsx          // 전체 상품 목록/카테고리/필터 페이지
    │   │   └── ProductList.module.scss  // 상품 목록 스타일
    │   │
    │   │
    │   │
    │   └── Support/                     // 고객센터 영역
    │   │       ├── InquiryQnA.jsx       // 문의하기 페이지 (FAQ + 1:1 문의)
    │   │       ├── InquiryQnA.module.scss
    │   │       │                         // 문의하기/FAQ 스타일
    │   │       ├── NoticeDetail.jsx     // 공지사항 상세 페이지
    │   │       ├── NoticeDetail.module.scss
    │   │       │                         // 공지사항 상세 스타일
    │   │       ├── NoticeList.jsx       // 공지사항 목록 페이지
    │   │       └── NoticeList.module.scss
    │   │                                 // 공지사항 목록 스타일
    │
    │
    │
    ├── routes/                          // 접근 권한 및 URL 관련 공통 설정
    │   ├── AdminRoute.jsx               // 관리자 권한이 필요한 페이지 접근 제한
    │   ├── paths.js                     // 사이트 URL 경로 상수 관리
    │   └── ProtectedRoute.jsx           // 로그인 회원 전용 페이지 접근 제한
    │
    │
    │
    ├── services/                        // 외부 API / 서버 통신 로직
    │   └── recommendationApi.js         // AI 추천 Cloud Functions 호출 모듈
    │
    │
    │
    ├── styles/                          // 프로젝트 전체 공통 SCSS
    │   ├── global.scss                  // 사이트 전체 기본/공통 스타일
    │   ├── _mixins.scss                 // 반응형/container/flex 등 SCSS mixin
    │   ├── _reset.scss                  // 브라우저 기본 CSS 초기화
    │   └── _variables.scss              // 색상/폰트/간격/반응형 등 디자인 변수
    │
    │
    │
    ├── utils/                           // 특정 UI에 종속되지 않는 공통 함수
    │   ├── cartStorage.js               // localStorage 장바구니 읽기/저장/삭제
    │   ├── format.js                    // 가격/날짜 등 공통 데이터 포맷 함수
    │   └── validation.js                // 입력값/폼 공통 검증 함수
    │
    │
    ├── App.jsx                          // 전체 페이지 Route 연결 및 Layout 구성
    └── main.jsx                         // React 앱 실행 진입점 / BrowserRouter 연결
```

## Structure Rules

- 실제 저장소에 존재하는 경로와 팀장이 전달한 최종 구조 설명을 우선한다.
- 파일 역할에 대한 주석은 각 경로가 어떤 책임을 가지는지 이해하기 위한 기준으로 사용한다.
- 폴더 또는 파일 위치 변경이 필요하면 팀장과 먼저 협의한다.
- 기존 경로가 존재하는데 동일 목적의 새 폴더를 임의 생성하지 않는다.
- `src/utils/cartStorage.js`는 승인된 공통 Cart localStorage Utility이다.
- 현재 `functions/src/`에는 `index.js`만 두며, Functions 세부 파일 분리는 팀장 협의 없이 임의 진행하지 않는다.
- 신규 페이지 / 컴포넌트 스타일은 SCSS Modules를 사용한다.
- `global.scss`, `_variables.scss`, `_mixins.scss`, `_reset.scss`는 공통 스타일 기준으로 사용한다.
- `AdminErrorContent.jsx` / `MyPageErrorContent.jsx`는 각각 Admin / MyPage 영역에서 사용하는 에러 상태 콘텐츠로 관리한다.
- `src/App.jsx`는 공통 Route 연결 파일이므로 에러 콘텐츠 연결을 포함한 수정이 필요할 때도 팀장에게 공유한 뒤 작업한다.
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

`useAdultCheck`는 김지우가 성인인증 확인 / 처리 및 비회원 AI 흐름에 사용한다.

실제 지속 데이터 기준:

- 로그인 회원 → Firestore `users/{uid}.isAdultVerified`
- 비회원 → `guestSessions/{anonymousUid}`

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

익명 인증 함수는 김지우의 `AdultModal` / `useAdultCheck` / 비회원 AI 흐름에서 호출해 사용한다.

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

`src/firebase/auth.js`에서 `signInAnonymously()` 등 익명 인증 함수 레벨을 담당한다.

### 김지우

다음 서비스 흐름을 담당한다.

- `AdultModal.jsx`
- `useAdultCheck.js`
- Header와 연결되는 성인인증 팝업
- AI 비회원 흐름
- `auth.js`의 익명 인증 함수를 호출해 성인인증 / 비회원 AI 흐름에 연결

실제 본인인증 외부 API를 연결하지 않고 학습용 Mock 방식으로 처리한다.

기본 UI:

```text
만 19세 이상입니다
만 19세 미만입니다
```

## Adult User

`만 19세 이상입니다` 선택:

```text
isAdultVerified = true
```

`만 19세 미만입니다` 선택:

- 성인 전용 AI 추천 / Checkout 접근 불가

생년월일 입력 및 실제 나이 계산 로직은 구현 범위에 포함하지 않는다.

## Logged-in User

- 로그인 회원의 성인인증 상태는 `users/{uid}.isAdultVerified`에서 확인한다.
- React 화면에서는 필요한 범위에서만 상태를 사용한다.

## Guest User

- 비회원 AI 추천을 위해 Firebase Anonymous Auth를 사용한다.
- 익명 UID는 성인인증 / rate limit을 위한 임시 식별자로만 사용한다.
- 성인인증 상태는 `guestSessions/{anonymousUid}`에서 확인한다.
- `guestSessions`에는 최소 임시 정보만 저장한다.

예:

```js
{
  adultVerified: true,
  expiresAt
}
```

규칙:

- `guestSessions` 직접 client write 금지
- Cloud Functions(Admin SDK)을 통해 기록
- `expiresAt` 기반 Firestore TTL 적용
- 비회원 성인인증 상태를 로그인/회원가입 후 정회원 계정으로 자동 이전하지 않는다.

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

AI Cloud Functions도 Firestore의 현재 상품 / 페어링 데이터를 조회한다.

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
- `PreferenceSurvey.module.scss`
- `constants/preferenceSurvey.js`
- `users/{uid}.userPreference` 저장 구조 관리

목적:

- 회원가입 후 신규 회원의 평소 취향 저장
- AI 추천용 장기 취향 데이터 구성

Route:

```text
/preference
```

회원가입 연결:

```text
Signup 성공 (이영기)
↓
/preference 이동
↓
PreferenceSurvey 진행 (김지우)
↓
users/{uid}.userPreference 저장
```

규칙:

- 로그인 회원 중 기본 취향 설문 대상 사용자에게 제공
- 설문 건너뛰기 가능
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
Firestore 현재 상품 / 페어링 조회 및 후보 필터
↓
Prompt 구성
↓
OpenAI 호출
↓
추천 결과 생성
```

- `userPreference`는 Client Request에 다시 실어 보내지 않고 서버에서 UID 기준 조회한다.
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
src/services/recommendationApi.js
   ↓
Firebase Cloud Functions
   ↓
functions/src/index.js
   ↓
회원 userPreference 조회 (회원인 경우)
   ↓
Firestore 현재 상품 / 페어링 조회
   ↓
Request 검증
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
```

- Cloud Function 진입점 및 현재 서버 구현 기준 파일
- AI 추천 검증 / 필터 / Prompt / OpenAI 호출 로직을 구현한다.
- 코드가 복잡해져 파일 분리가 필요해지면 팀장 협의 후 구조를 추가한다.
- 현재 구조에 없는 Functions 하위 폴더를 팀원이 임의 생성하지 않는다.

## Logical Responsibilities

Functions 구현에서는 다음 책임을 구분한다.

### Request Validation
- `surveyAnswers`
- `surveyVersion`
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
- Prompt 구조 변경 시 `promptVersion` 증가

### AI Response Validation
- 필수 필드
- 추천 개수
- 실제 Firestore 상품 ID 존재 여부
- reason 형식
- 추천 조합 중복 여부

### Rate Limit
- UID 기준 AI 요청 제한
- Firestore `aiRequestGuards/{uid}` 사용

---

# 15. AI Request Rules

AI 추천 실행 1회마다 UUID 기반 `requestId`를 생성한다.

Client Request:

```js
{
  requestId,
  surveyVersion,
  surveyAnswers
}
```

규칙:

- Request → Response → 추천 기록 저장까지 동일한 `requestId` 사용
- `surveyAnswers`의 key / enum은 `constants/aiSurvey.js` 기준
- `surveyVersion`, `promptVersion`, `filterVersion`은 정수형 사용
- 로그인 회원 식별은 Client `userId`가 아니라 `request.auth.uid` 기준
- 로그인 회원의 `userPreference`는 Firestore에서 `request.auth.uid` 기준 조회
- 비회원은 Firebase Anonymous Auth UID 사용
- 익명 UID는 성인인증 / rate limit용 임시 식별자
- 익명 UID를 회원 추천 기록의 userId로 저장하지 않는다.
- 상품 / 페어링 전체 데이터를 Client Request에 포함하지 않는다.

## Validation Order

Cloud Functions는 아래 순서로 처리한다.

1. `requestId` 중복 / 충돌 확인
2. rate limit 확인
3. `surveyVersion` 지원 여부 확인
4. `surveyAnswers` 유효성 검증
5. 성인인증 확인
6. Firestore 실제 상품 / 페어링 조회
7. `filterProducts` 실행
8. OpenAI 호출

앞 단계가 실패하면 뒤 단계를 실행하지 않는다.

---

# 16. AI Request ID / Rate Limit

## requestId

동일 requestId 기존 기록과 현재 요청의 아래 값이 모두 동일하면 기존 결과를 반환한다.

- userId
- surveyVersion
- 정규화된 surveyAnswers

`surveyAnswers` 비교:

- 객체 key 정렬
- deep equality
- 단순 `JSON.stringify()` 문자열 비교에만 의존하지 않는다.

동일 requestId에 다른 내용:

```text
REQUEST_ID_CONFLICT
```

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

- 로그인 UID / 익명 UID 모두 동일 기준
- 10초 이내 반복 요청 차단
- OpenAI 호출하지 않음
- `RATE_LIMITED` 반환
- client 직접 write 금지
- Admin SDK 기록
- `expiresAt` 기반 TTL 적용

---

# 17. AI Product Filtering / Fallback

상품 후보는 Firestore의 실제 상품 / 페어링 데이터를 사용한다.

`filterProducts` 후보 필터링 로직 적용 후 **liquorId 후보 개수** 기준:

```text
3개 이상 → OpenAI 추천 진행
1~2개   → OpenAI 미호출 / 안전 후보 기반 fallback
0개     → NO_AVAILABLE_PRODUCTS
```

규칙:

- foodId / glassId 개수와 liquor 후보 판단을 혼동하지 않는다.
- fallback에서도 알레르기 및 강제 제외 조건을 해제하지 않는다.
- Filter 구조 변경 시 `filterVersion`을 증가시킨다.

---

# 18. AI Response Rules

OpenAI는 서버가 제공한 후보 안에서만 상품을 선택한다.

추천 항목:

```js
{
  rank,
  liquorId,
  foodId,
  glassId,
  reason
}
```

성공 Response:

```js
{
  requestId,
  recommendations,
  aiMeta,
  saveStatus
}
```

## aiMeta

```js
{
  model,
  promptVersion,
  filterVersion,
  fallbackUsed,
  candidateCount,
  filteredOutCount,
  latencyMs
}
```

## saveStatus

```text
success
failed
not_applicable
```

규칙:

- OpenAI Response 검증 실패 시 최대 1회 재요청
- 재요청 후에도 실패하면 안전 후보 fallback
- fallback 사용 시 `aiMeta.fallbackUsed = true`
- timeout / quota 발생 시 안전 후보가 있으면 fallback
- timeout / quota fallback 성공 시 `aiMeta.model = null`
- 추천 조합은 항목 간 중복되지 않아야 한다.

---

# 19. AI Error Codes

공통 오류 코드:

```text
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
```

`recommendationApi.js`는 오류를 다음 형태로 정규화한다.

```js
{
  code,
  message
}
```

---

# 20. AI Recommendation Save Rules

추천 기록은 **Cloud Functions에서만 생성**한다.

클라이언트는 `recommendations`에 직접 create/update 하지 않는다.

## Save Target

- 로그인 회원: 저장
- 비회원: 저장하지 않음

문서 경로:

```text
recommendations/{requestId}
```

AI 추천 실행 1회 = Firestore 문서 1개

여러 추천 세트는 하나의 `recommendations` 배열로 저장한다.

## Recommendation Document

```js
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
```

규칙:

- `userId`: `request.auth.uid`
- `createdAt`: 서버 기준 timestamp
- 추천 당시 `surveyAnswers` Snapshot 보존
- 추천 당시 `userPreferenceSnapshot` 보존
- 기본 취향이 없는 회원은 `userPreferenceSnapshot: null`
- `AiHistory`는 null인 경우 별도 UI 처리
- 상품 전체 객체를 중복 저장하지 않는다.
- 추천 상품은 `liquorId`, `foodId`, `glassId` 기준 저장
- 상품명 등 최소 Snapshot은 필요 시 표시용으로만 추가
- AI Response 정상 검증 직후 1회 저장
- AiResult 렌더링 / 새로고침 시 재저장하지 않는다.
- 외부 OpenAI 호출은 Firestore Transaction 밖에서 처리
- 저장 확인 / 생성 단계만 Transaction 또는 원자적 create 방식 사용

## Save Failure

AI 성공 + Firestore 저장 실패:

```text
saveStatus: failed
```

- 추천 결과는 사용자에게 반환
- 자동 재시도하지 않음
- Functions 로그에 requestId / userId / 오류 기록

정상 저장 또는 동일 정상 기록 존재:

```text
saveStatus: success
```

비회원:

```text
saveStatus: not_applicable
```

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
- `AiHistory`는 `surveyVersion`과 실제 필드 존재 여부를 확인해 이전 기록도 안전하게 렌더링한다.

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
- `AdminRoute`는 관리자 화면 접근 판단용
- 실제 데이터 보안의 최종 기준은 Firestore Rules / 서버 검증

## Recommendation Access

일반 회원:

- 자신의 `userId`와 일치하는 추천 기록만 조회 가능
- 추천 기록 직접 create/update 금지

관리자:

- role 검증 후 전체 AI 추천 로그 조회 가능

## AiLogManage

- 전체 로그를 한 번에 조회하지 않는다.
- `createdAt` 기준 페이지네이션
- 기간 / 회원 / fallback 여부 등의 필터는 가능한 범위에서 Firestore Query 사용
- 필요한 Composite Index는 `firestore.indexes.json`에 정의

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

`AdultModal` / `useAdultCheck` / 비회원 AI 흐름에서는 이 파일의 익명 인증 함수를 재사용한다.

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
- 룰렛 이벤트 참여는 로그인 회원만 가능
- 동일 회원은 동일 이벤트에 1회 참여
- 회원 식별 기준은 Firebase Auth `uid`
- 참여 결과 / 경품 정보는 Firestore에 기록
- MyPage 이벤트 참여 내역에서 확인

참여 기록 경로:

```text
eventParticipations/{eventId}_{uid}
```

이 문서 ID를 동일 회원의 동일 이벤트 중복 참여 확인 기준으로 사용한다.

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

URL 문자열은 `src/routes/paths.js`에서 공통 관리한다.
페이지 내부에서 route 문자열을 임의 하드코딩하지 않는다.

## Main / Shop

| Page | URL | Access |
|---|---|---|
| MainPage | `/` | 전체 |
| BrandIntro | `/brand` | 전체 |
| ProductList | `/shop` | 전체 |
| ProductDetail | `/shop/:productId` | 전체 |

Brand 영역은 현재 `/brand`를 사용한다. `MakdongIntro`는 Brand 영역 구성에 사용하며 별도 URL을 임의 생성하지 않는다.

## Auth

| Page | URL | Access |
|---|---|---|
| Login | `/login` | 비로그인 사용자 |
| Signup | `/signup` | 비로그인 사용자 |
| PreferenceSurvey | `/preference` | 기본 취향 설문 대상 로그인 회원 |

규칙:

- 로그인 사용자가 `/login` 접근 시 메인 또는 이전 페이지 이동
- 로그인 사용자가 `/signup` 접근 시 메인 이동
- Signup 성공 후 이영기가 `/preference` 연결까지 담당
- `/preference` 진입 이후 김지우가 PreferenceSurvey 담당
- PreferenceSurvey는 회원가입 후 평소 취향 저장용
- PreferenceSurvey 건너뛰기 가능

## AI

| Page | URL | Access |
|---|---|---|
| AiIntro | `/ai` | 전체 |
| AiSurvey | `/ai/survey` | 성인인증 완료 사용자 |
| AiResult | `/ai/result` | 정상 추천 완료 + 성인인증 사용자 |

규칙:

- 로그인 / 비회원 AI URL을 분리하지 않는다.
- `/ai/survey` 하나에서 로그인 여부에 따라 질문 구성 분기
- 로그인 회원: `users/{uid}.userPreference` + 현재 상황 설문
- 비회원: 간소화된 현재 설문만 사용
- AiResult는 로그인 / 비회원 모두 접근 가능
- 로그인 회원 결과는 Firestore 저장
- 비회원 결과는 React 임시 상태
- 추천 결과 없이 `/ai/result` 직접 접근 시 `/ai` 또는 `/ai/survey` 이동

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
| AiHistory | `/mypage/ai-history` | 로그인 회원 |
| EventHistory | `/mypage/events` | 로그인 회원 |

규칙:

- MyHome은 MyPage 공통 레이아웃 담당자가 구현한다.
- 주문 상세는 본인 주문만 조회
- AI 추천 기록은 본인 기록만 조회

## Event

| Page | URL | Access |
|---|---|---|
| EventList | `/events` | 전체 |
| RouletteEvent | `/events/roulette` | 로그인 회원 |

## Support

| Page | URL | Access |
|---|---|---|
| NoticeList | `/support/notices` | 전체 |
| NoticeDetail | `/support/notices/:noticeId` | 전체 |
| InquiryQnA | `/support/inquiry` | FAQ 열람 전체 / 문의 작성 로그인 회원 |

규칙:

- 별도 FAQ Route를 만들지 않는다.
- 배송 / 교환 / 환불 별도 Route를 만들지 않는다.
- 자주 묻는 질문은 `InquiryQnA` 내부 영역에 포함한다.

## Admin

| Page | URL | Access |
|---|---|---|
| Dashboard | `/admin` | 관리자 |
| UserManage | `/admin/users` | 관리자 |
| ProductManage | `/admin/products` | 관리자 |
| AiLogManage | `/admin/ai-logs` | 관리자 |
| EventManage | `/admin/events` | 관리자 |

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

- 각 파일은 해당 영역에서 발생한 에러 상태를 화면에 표시하기 위한 콘텐츠로 사용한다.
- 스타일은 각각의 `*.module.scss`에서 관리한다.
- 전체 Route 연결은 `src/App.jsx`에서 관리하므로 연결 방식 변경 시 팀장에게 공유한다.
- 존재하지 않는 URL을 처리하는 `NotFound.jsx`와 역할을 혼동하지 않는다.

## NotFound

```text
* → NotFound.jsx
```

## Route Notes

- `SplashIntro.jsx` 별도 URL 없음
- `/` 진입 시 MainPage 전에 표시되는 인트로 컴포넌트
- 동적 route의 `:productId`, `:orderId`, `:noticeId`에는 실제 데이터 ID 사용
- 로그인 회원 전용 페이지는 `ProtectedRoute`
- 관리자 페이지는 `AdminRoute`
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
- Admin 권한은 `users/{uid}.role === "admin"`
- 관리자 전용 데이터는 동일 role 기준으로 보호
- `guestSessions` client direct write 금지
- `aiRequestGuards` client direct write 금지

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
| 성인인증(비회원) | `guestSessions/{anonymousUid}` |
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
| AI 상품 / 페어링 기준 | Firestore |
| URL | `src/routes/paths.js` |
| AI 설문 key / enum | `constants/aiSurvey.js` |
| Preference 질문 | `constants/preferenceSurvey.js` |
| 공통 취향 축 | `constants/tasteAxis.js` |
| 주문 상태 | `constants/orderStatus.js` |
| 이벤트 상태 | `constants/eventStatus.js` |
| 관리자 실제 권한 | `users/{uid}.role` + Firestore Rules / server validation |
| AI 추천 기록 | Firestore `recommendations/{requestId}` |
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

팀 전체 개발 시작에 필요한 공통 프론트엔드 아키텍처, 역할 분담, 주요 Route, 디자인 규칙, Runtime 데이터 기준 및 핵심 데이터 계약은 확정되었다.

확정된 주요 기준:

- 실제 Runtime 상품 / 페어링 Source of Truth → Firestore
- 상품 JSON → Firestore 등록용 seed/reference
- 회원 기본 취향 → `users/{uid}.userPreference`
- Wishlist → `users/{uid}/wishlist/{productId}`
- Cart → `jajak_cart` + `cartStorage.js`
- 이벤트 참여 → `eventParticipations/{eventId}_{uid}`
- 회원 포인트 → `users/{uid}.points`
- 회원 status → `active` / `suspended`
- 비밀번호 변경 / 회원탈퇴 → 구현 범위 제외

구현 중 세부 필드가 추가로 필요하더라도 기존 확정 구조를 임의 확장하지 않고 관련 담당자와 협의 후 `AGENTS.md`에 반영한다.

---

# 36. Version History

## v1.6 — 2026-08-24

- Section 6 Project Folder Structure를 팀장이 전달한 파일별 역할 설명 포함 최종 구조로 갱신
- `src/pages/Admin/AdminErrorContent.jsx` 및 `AdminErrorContent.module.scss` 추가 반영
- `src/pages/MyPage/MyPageErrorContent.jsx` 및 `MyPageErrorContent.module.scss` 추가 반영
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