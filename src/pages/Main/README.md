# Main 폴더 안내

이 폴더는 JAJAK 메인 페이지와 인트로 화면, 메인 전용 애니메이션 훅을 관리합니다.

## 페이지 및 컴포넌트

- `MainPage.jsx`: 메인 페이지의 전체 섹션 구성과 각 섹션의 ref, 메인 전용 훅 연결을 담당합니다.
- `MainPage.module.scss`: 메인 페이지의 Hero, AI 추천, 브랜드 소개, 베스트셀러, 이벤트, 막동이 영역과 반응형 스타일을 관리합니다.
- `SplashIntro.jsx`: 메인 페이지 진입 전에 표시되는 초기 스플래시 화면을 구성합니다.
- `SplashIntro.module.scss`: 스플래시 화면의 레이아웃과 애니메이션 스타일을 관리합니다.
- `JourneySection.jsx`: 사용자가 공간 안으로 들어가는 연출을 보여주는 스크롤 기반 인트로 컴포넌트입니다. 현재 메인 진입 시 활성화되어 있습니다.
- `JourneySection.module.scss`: JourneySection의 장면 이미지, 스크롤 안내, 건너뛰기 버튼 스타일을 관리합니다.
- `BestSellerSection.jsx`: 브랜드 이야기 다음에 노출되는 베스트셀러 상품을 관리합니다. PC에서는 휠 스텝 카드, 모바일에서는 가로 스와이프 카드로 동작합니다.

## Journey 장면 관리

현재 Journey 장면은 다음 순서로 연결되어 있습니다.

1. `01-entrance-closed.webp`
2. `02-entrance-open.webp`
3. `03-hallway-far.webp`
4. `04-livingroom-wide.webp`
5. `05-livingroom-table.webp`

- 장면 import와 순서는 `JourneySection.jsx` 상단의 `scenes` 배열에서 관리합니다.
- 새 장면을 추가할 때는 이미지를 import한 뒤 `scenes` 배열의 원하는 위치에 변수명을 추가합니다.
- Journey는 자동 재생하지 않으며 사용자 스크롤에 맞춰 전환됩니다.
- PC에서는 휠 한 번에 다음 장면 단계로 이동하고, 모바일에서는 자연 스크롤 진행률에 맞춰 전환됩니다.
- 장면 수가 달라지면 `JourneySection.module.scss`의 `.journey` 높이도 장면 하나당 약 `100svh` 기준으로 함께 조정합니다.
- 현재 5장면이므로 PC와 모바일 모두 `500svh`입니다.
- `인트로 건너뛰기` 버튼은 Journey를 종료하고 기존 메인 Hero로 이동합니다.

## 반응형 동작

- 모바일 기준은 `767px 이하`, PC/태블릿 기준은 각 파일의 미디어쿼리를 따릅니다.
- 메인 섹션 이동용 휠 스냅은 `(hover: hover) and (pointer: fine)` 환경에서만 동작합니다.
- 모바일 Hero, AI 추천, 브랜드 이야기, 베스트셀러, 이벤트, 막동이 영역은 자연 스크롤을 기준으로 구성되어 있습니다.
- 모바일 이벤트 reveal은 일반 ScrollTrigger로 한 번만 실행됩니다.
- 모바일 베스트셀러 카드는 가로 `scroll-snap`과 스와이프 안내 표시를 사용합니다.

## 메인 전용 훅

- `useHeroReveal.js`: Hero 이미지, 제목, 설명, 버튼이 스크롤에 따라 나타나는 GSAP 애니메이션을 관리합니다.
- `useLogoScrollReset.js`: 로고 클릭 시 메인 페이지의 스크롤과 인트로 상태를 초기화하는 동작을 관리합니다.
- `useMainSectionWheel.js`: 포인터가 정밀한 PC 환경에서 메인 페이지의 주요 섹션 사이를 휠 스크롤로 이동하는 스냅 동작을 관리합니다.
- `useSectionReveals.js`: AI 추천, 브랜드 소개, 이벤트, 막동이 섹션의 등장 애니메이션을 관리합니다.

## 관리 기준

- 위 훅들은 메인 페이지의 DOM 구조와 애니메이션에 연결된 전용 훅이므로 현재 폴더에서 관리합니다.
- 여러 페이지에서 재사용하게 된 훅만 `src/hooks`로 이동합니다.
- 메인 화면의 구조를 변경하면 JSX와 연결된 훅 및 SCSS의 selector도 함께 확인합니다.
- GSAP 애니메이션을 추가할 때는 생성한 tween, timeline, event listener가 cleanup에서 정리되는지 확인합니다.
