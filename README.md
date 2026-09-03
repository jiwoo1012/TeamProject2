# JAJAK (자작)

<p align="center">
  <img src="src/assets/logos/jajakLogo.png" alt="JAJAK 로고" width="180" />
</p>

> 오늘의 기분과 취향에 어울리는 전통주 한 상을 제안하는 AI 큐레이션 쇼핑몰

JAJAK은 전통주를 어렵지 않게 발견하고, 어울리는 안주와 주류용품까지 한 번에 탐색할 수 있도록 기획한 팀 포트폴리오 프로젝트입니다. 브랜드 캐릭터 **막동이**가 취향 설문과 상황별 질문을 바탕으로 사용자의 주안상을 큐레이션합니다.

본 프로젝트는 학습 및 포트폴리오 목적으로 제작되었으며, 실제 주류 판매·본인인증·결제가 이루어지는 상용 서비스가 아닙니다.

## 핵심 경험

- **브랜드 탐색**: 스플래시와 스크롤 인터랙션, 자작의 브랜드 스토리, 막동이 캐릭터 소개
- **AI 주안상 큐레이션**: 회원·비회원 설문, 사용자 취향과 오늘의 상황을 반영한 전통주·안주·잔 추천
- **상품 탐색**: 카테고리, 검색, 필터, 정렬, 페이지네이션과 상품 상세 정보
- **구매 흐름**: 찜, 장바구니 수량·선택 관리, 포인트 적용, 배송지 입력, Mock 결제와 주문 저장
- **마이페이지**: 회원 요약, 프로필·배송지 관리, 찜 목록, 주문 내역 검색·필터와 주문 상세
- **참여형 이벤트**: 룰렛, 카드 짝 맞추기, OX 퀴즈와 참여 결과·포인트 반영
- **고객센터**: 공지사항 목록·상세와 FAQ 검색·분류
- **관리자 운영**: 회원·공지·리뷰 관리 및 상품·이벤트·대시보드 시연 화면

## 주요 기능과 구현 상태

| 영역 | 주요 내용 | 데이터 상태 |
| --- | --- | --- |
| 인증 | 이메일 회원가입·로그인·로그아웃, 로그인 유지, 정지 회원 차단 | Firebase Authentication + `users` |
| 취향 등록 | 기본 취향, 알레르기·기피 재료, 음용 성향 저장 | Firestore `users/{uid}.userPreference` |
| AI 추천 | 회원·비회원 설문, Cloud Functions 추천, 추천 결과 저장 | OpenAI 연동 / 개발용 Mock 모드 지원 |
| 상품 | 목록·상세, 검색·필터·정렬, 찜, 장바구니, 구매 리뷰 | Firestore 전환 중이며 reference JSON을 호환 데이터로 사용 |
| 장바구니·주문 | 선택 주문, 수량 변경, 포인트, 배송지, 주문 스냅샷 저장 | `jajak_cart` + Firestore `orders` |
| 이벤트 | 룰렛·카드 게임·OX 퀴즈, 중복 참여 방지, 포인트 지급 | Firestore `eventParticipations` |
| 마이페이지 | 회원 요약, 정보·배송지, 찜, 주문 목록·상세·취소 | Firebase 연동 |
| 관리자 회원 | 회원 검색·필터, 상태·권한 변경, 활동 요약 | Firestore `users`, `orders` |
| 관리자 공지 | 공지 등록·수정·삭제, 공개·임시 저장 상태 관리 | Firestore `notices` |
| 관리자 리뷰 | 검색·필터, 신고·별점 확인, 노출·삭제 관리 | Firestore `reviews`; 데이터가 없으면 시연용 목업 표시 |

### 시연 화면으로 유지되는 영역

- 관리자 대시보드의 운영 지표와 차트는 데이터 연결 전 상태를 명시해 표시합니다.
- 관리자 상품 관리와 이벤트 관리는 시연용 로컬 데이터 기반 UI입니다.
- 관리자 리뷰 관리는 실제 리뷰가 없을 때만 시연용 목업 리뷰를 표시하며, 목업은 수정하거나 삭제하지 않습니다.
- AI 추천 내역, 이벤트 참여 내역, 관리자 AI 로그, 1:1 문의는 현재 준비 중 화면입니다.
- 결제와 성인인증은 학습용 Mock 흐름이며 실제 외부 결제·본인인증 API를 호출하지 않습니다.

## 기술 스택

| 구분 | 기술 |
| --- | --- |
| Frontend | React 19, JavaScript, Vite 8 |
| Routing | React Router 7 |
| Styling | Sass, SCSS Modules, Pretendard |
| Interaction | GSAP |
| Data visualization | Chart.js, react-chartjs-2 |
| Backend | Firebase Authentication, Cloud Firestore, Cloud Functions |
| AI | OpenAI API |
| Quality | Oxlint, Vite production build |

## 서비스 구조

```text
사용자
  ├─ 상품 탐색 ──> 찜 / 장바구니 ──> 주문서 ──> 주문 완료
  ├─ 취향 등록 ──> AI 설문 ──> Cloud Functions ──> 추천 결과
  ├─ 이벤트 참여 ──────────────────> 참여 기록 / 포인트
  └─ 마이페이지 ───────────────────> 회원 / 주문 / 배송지 조회

관리자
  └─ 회원 / 상품 / 이벤트 / 공지 / 리뷰 운영 화면

Firebase
  ├─ Authentication: 로그인 사용자 식별
  ├─ Firestore: 회원, 상품, 주문, 리뷰, 공지, 참여 기록
  └─ Cloud Functions: AI 추천 요청 검증 및 결과 처리
```

## 주요 데이터 계약

- 장바구니는 `localStorage`의 `jajak_cart`에 `[{ productId, quantity }]` 형태로 저장합니다.
- 주문 생성 시 상품명·가격·이미지 등 주문 시점 정보를 item snapshot으로 보존합니다.
- 회원 정보는 `users/{uid}`, 배송지는 `users/{uid}/addresses`에서 관리합니다.
- 찜은 `users/{uid}/wishlist`, 이벤트 참여는 `eventParticipations/{eventId}_{uid}` 구조를 사용합니다.
- 관리자 권한과 회원 상태는 각각 `role: user | admin`, `status: active | suspended`를 기준으로 합니다.
- 실제 관리자 접근과 데이터 변경 권한의 최종 기준은 Firestore Security Rules입니다.

세부 스키마와 협업 규칙은 [AGENTS.md](./AGENTS.md)를 참고해주세요.

## 시작하기

### 1. 요구 환경

- Node.js
- npm
- Firebase 프로젝트 설정값

### 2. 설치

```bash
git clone <repository-url>
cd TeamProject2
npm install
```

### 3. 환경변수

루트의 `.env.example`을 참고해 `.env.local`을 생성합니다.

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

OpenAI API Key는 프론트엔드 환경변수에 작성하지 않습니다. 실제 AI 모드에서는 Firebase Functions Secret으로 관리하며, 로컬 시연 환경은 Functions의 `USE_MOCK_AI=true` 설정을 사용할 수 있습니다.

### 4. 실행

```bash
npm run dev
```

개발 서버가 출력하는 주소에서 확인할 수 있습니다. Vite의 기본 주소는 `http://localhost:5173`입니다.

### 5. 검증

```bash
npm run lint
npm run build
npm run preview
```

## 주요 라우트

| 경로 | 화면 |
| --- | --- |
| `/` | 메인 |
| `/brand`, `/brand/makdong` | 브랜드·막동이 소개 |
| `/shop`, `/shop/:productId` | 상품 목록·상세 |
| `/ai`, `/ai/survey`, `/ai/result` | AI 추천 흐름 |
| `/events` | 이벤트 목록 및 게임 진입 |
| `/cart`, `/checkout`, `/order-complete` | 장바구니·주문 |
| `/mypage` | 마이페이지와 하위 메뉴 |
| `/notices`, `/faq`, `/inquiry` | 고객센터 |
| `/admin` | 관리자 페이지 |

## 폴더 구조

```text
TeamProject2/
├─ functions/                 # Firebase Cloud Functions와 AI 추천 로직
├─ public/
├─ src/
│  ├─ assets/                 # 브랜드, 캐릭터, 상품 이미지와 영상
│  ├─ components/
│  │  ├─ admin/               # 관리자 공통 Header / Footer
│  │  ├─ common/              # 공통 Layout, Header, Footer, Modal
│  │  └─ ui/                  # Button, Badge, Tabs 등 공통 UI
│  ├─ constants/              # 공통 상태값과 설문 상수
│  ├─ data/                   # 상품 reference JSON과 이벤트 데이터
│  ├─ firebase/               # Auth / Firestore 공통 함수
│  ├─ hooks/                  # 공통 React hooks
│  ├─ pages/                  # 도메인별 페이지
│  ├─ routes/                 # 경로 상수와 접근 제어
│  ├─ services/               # 외부 서비스 연결
│  ├─ styles/                 # 전역 스타일과 디자인 토큰
│  └─ utils/                  # 장바구니, 포맷, 검증 유틸리티
├─ AGENTS.md                  # 팀 데이터 계약과 협업 규칙
├─ firestore.rules
└─ package.json
```

## 팀 구성

| 팀원 | 담당 영역 |
| --- | --- |
| 김지우 | 공통 구조·라우팅, AI 큐레이션, 취향 설문, 성인인증 |
| 김태은 | 상품·상품 데이터·검색, 상품 관리, 참여형 이벤트 |
| 백현정 | 메인, 브랜드·막동이 소개, 관리자 대시보드, 디자인 |
| 이영기 | 로그인·회원가입·로그아웃, 고객센터, 찜, 상품 상세 협업 |
| 이유진 | 장바구니·주문, 마이페이지, 관리자 공통·회원·공지·리뷰 관리, 문서 |

## 협업 방식

- `main`, `dev`에 직접 작업하지 않고 기능별 개인 브랜치에서 작업합니다.
- 최신 `dev`를 개인 브랜치에 반영한 뒤 Pull Request로 통합합니다.
- 공통 파일과 Firebase 스키마는 담당자 협의 없이 변경하지 않습니다.
- 확정된 와이어프레임과 공통 디자인 토큰을 유지하며, 모바일은 재배치형 반응형으로 구현합니다.
- 작업 후 `npm run lint`와 `npm run build`로 정적 검사와 프로덕션 빌드를 확인합니다.

## 참고

- 상품 Runtime 데이터는 최종적으로 Firestore를 기준으로 통일할 예정입니다.
- 저장소에는 실제 API Key, Firebase Secret 또는 개인 `.env.local`을 커밋하지 않습니다.
- 프로젝트의 기능 범위와 데이터 계약은 팀 협의에 따라 변경될 수 있습니다.
