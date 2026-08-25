# Main 폴더 안내

이 폴더는 JAJAK 메인 페이지와 인트로 화면, 메인 전용 애니메이션 훅을 관리합니다.

## 페이지 및 컴포넌트

- `MainPage.jsx`: 메인 페이지의 전체 섹션 구성과 각 섹션의 ref, 메인 전용 훅 연결을 담당합니다.
- `MainPage.module.scss`: 메인 페이지의 Hero, AI 추천, 브랜드 소개, 이벤트 영역과 반응형 스타일을 관리합니다.
- `SplashIntro.jsx`: 메인 페이지 진입 전에 표시되는 초기 스플래시 화면을 구성합니다.
- `SplashIntro.module.scss`: 스플래시 화면의 레이아웃과 애니메이션 스타일을 관리합니다.
- `JourneySection.jsx`: 사용자가 공간 안으로 들어가는 연출을 보여주는 스크롤 기반 인트로 컴포넌트입니다.
- `JourneySection.module.scss`: JourneySection의 장면 이미지, 스크롤 안내, 건너뛰기 버튼 스타일을 관리합니다.
- `BestSellerSection.jsx`: 브랜드 이야기 다음에 노출되는 베스트셀러 상품과 휠 스텝 카드 애니메이션을 관리합니다.

## 메인 전용 훅

- `useHeroReveal.js`: Hero 이미지, 제목, 설명, 버튼이 스크롤에 따라 나타나는 GSAP 애니메이션을 관리합니다.
- `useLogoScrollReset.js`: 로고 클릭 시 메인 페이지의 스크롤과 인트로 상태를 초기화하는 동작을 관리합니다.
- `useMainSectionWheel.js`: 메인 페이지의 주요 섹션 사이를 휠 스크롤로 이동하는 스냅 동작을 관리합니다.
- `useSectionReveals.js`: AI 추천, 브랜드 소개, 이벤트 섹션의 등장 애니메이션을 관리합니다.

## 관리 기준

- 위 훅들은 메인 페이지의 DOM 구조와 애니메이션에 연결된 전용 훅이므로 현재 폴더에서 관리합니다.
- 여러 페이지에서 재사용하게 된 훅만 `src/hooks`로 이동합니다.
- 메인 화면의 구조를 변경하면 JSX와 연결된 훅 및 SCSS의 selector도 함께 확인합니다.
- GSAP 애니메이션을 추가할 때는 생성한 tween, timeline, event listener가 cleanup에서 정리되는지 확인합니다.
