import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Link } from 'react-router-dom'

import JourneySection from './JourneySection'
import BestSellerSection from './BestSellerSection'
import useHeroReveal from './useHeroReveal'
import useLogoScrollReset from './useLogoScrollReset'
import useMainSectionWheel from './useMainSectionWheel'
import useSectionReveals from './useSectionReveals'
import heroImage from '../../assets/images/main/hero/main-hero-table.webp'
import heroSunsetImage from '../../assets/images/main/hero/main-hero-table-sunset.webp'
import heroSunIcon from '../../assets/images/main/hero/hero-sun.png'
import heroMoonIcon from '../../assets/images/main/hero/hero-moon.png'
import tornPaperFrame from '../../assets/images/main/ai-recommendation/main-torn-paper.png'
import peekFaceDefault from '../../assets/images/main/ai-recommendation/peek-face-default.webp'
import peekFaceSmile from '../../assets/images/main/ai-recommendation/peek-face-smile.webp'
import peekFaceUp from '../../assets/images/main/ai-recommendation/peek-face-up.webp'
import happyDayFood from '../../assets/images/main/ai-recommendation/happy-day-grilled-pollock.png'
import happyDayLiquor from '../../assets/images/main/ai-recommendation/happy-day-black-liquor.png'
import happyDayCup from '../../assets/images/main/ai-recommendation/happy-day-black-cup.png'
import rainyDayFood from '../../assets/images/main/ai-recommendation/rainy-day-kimchi-pancake.png'
import rainyDayLiquor from '../../assets/images/main/ai-recommendation/rainy-day-blue-liquor.png'
import rainyDayCup from '../../assets/images/main/ai-recommendation/rainy-day-blue-cup.png'
import sweetDayFood from '../../assets/images/main/ai-recommendation/sweet-craving-yakgwa.png'
import sweetDayLiquor from '../../assets/images/main/ai-recommendation/sweet-craving-orange-liquor.png'
import sweetDayCup from '../../assets/images/main/ai-recommendation/sweet-craving-orange-cup.png'
import brandStoryImage from '../../assets/images/main/brand-story/brand-story-pouring.webp'
import brandStoryPourBefore from '../../assets/images/main/brand-story/brand-story-pour-before.png'
import brandStoryPourAfter from '../../assets/images/main/brand-story/brand-story-pour-after.png'
import brandStoryCup from '../../assets/images/main/brand-story/brand-story-cup.png'
import makdongCharacter from '../../assets/characters/M007_Poses01.png'
import eventsData from '../../data/events.json'
import { getCollection } from '../../firebase/firestore'
import styles from './MainPage.module.scss'

gsap.registerPlugin(ScrollTrigger)

const IS_JOURNEY_ENABLED = false
const eventBannerImages = import.meta.glob('../../assets/images/banner/eventBanner*.png', {
  eager: true,
  import: 'default',
})

const resolveEventBanner = (bannerUrl) => {
  const fileName = bannerUrl?.split('/').pop()
  return Object.entries(eventBannerImages).find(([path]) => path.endsWith(`/${fileName}`))?.[1]
}

const mainEvents = eventsData.map(({ event }, index) => ({
  ...event,
  id: `event-${index + 1}`,
  bannerSrc: resolveEventBanner(event.image.bannerUrl),
}))

const makdongTraits = [
  { icon: '✣', title: '다정한 안내자', description: '전통주의 매력을\n쉽고 재미있게 소개해요.' },
  { icon: '♟', title: '호기심 많은 탐험가', description: '새로운 술과 이야기를\n찾아 전국을 여행해요.' },
  { icon: '▱', title: '찐 애주가', description: '막둥이의 취향으로\n솔직하게 추천해요.' },
  { icon: '♥', title: '따뜻한 친구', description: '막둥이의 이야기가\n당신의 일상에 스며들어요.' },
]

const moodRecommendations = [
  {
    badge: '안주',
    variants: [
      { mood: 'moodHappy', name: '황태구이', description: '담백하게 구운 황태로\n기분 좋은 한 잔을 열어요.', image: happyDayFood, alt: '행복한 날 추천 안주' },
      { mood: 'moodRainy', name: '김치전', description: '바삭하고 고소한 전에\n부드러운 술과 잘 어울려요.', image: rainyDayFood, alt: '비 오는 날 추천 안주' },
      { mood: 'moodSweet', name: '약과', description: '은은한 단맛이 번지는\n달콤한 한입을 곁들여요.', image: sweetDayFood, alt: '달콤한 날 추천 안주' },
    ],
  },
  {
    badge: '전통주',
    variants: [
      { mood: 'moodHappy', name: '오늘의 전통주', description: '깔끔한 풍미와 부드러운 끝맛으로\n기분 좋은 날을 채워요.', image: happyDayLiquor, alt: '행복한 날 추천 전통주' },
      { mood: 'moodRainy', name: '오늘의 전통주', description: '은은한 단맛과 깔끔한 목넘김으로\n비 오는 날을 따뜻하게.', image: rainyDayLiquor, alt: '비 오는 날 추천 전통주' },
      { mood: 'moodSweet', name: '오늘의 전통주', description: '향긋하고 산뜻한 한 잔으로\n달콤한 여운을 더해요.', image: sweetDayLiquor, alt: '달콤한 날 추천 전통주' },
    ],
  },
  {
    badge: '잔',
    variants: [
      { mood: 'moodHappy', name: '먹빛잔', description: '깊은 빛의 잔에 담아\n오늘의 기분을 선명하게.', image: happyDayCup, alt: '행복한 날 추천 술잔' },
      { mood: 'moodRainy', name: '구름잔', description: '구름을 닮은 잔에 담아\n마음까지 편안해지는 시간.', image: rainyDayCup, alt: '비 오는 날 추천 술잔' },
      { mood: 'moodSweet', name: '노을잔', description: '따뜻한 빛의 잔에 담아\n달콤한 시간을 완성해요.', image: sweetDayCup, alt: '달콤한 날 추천 술잔' },
    ],
  },
]

const MainPage = () => {
  const [isIntroSkipped, setIsIntroSkipped] = useState(!IS_JOURNEY_ENABLED)
  const [bestSellerProducts, setBestSellerProducts] = useState([])
  const mainContentRef = useRef(null)
  const transitionRef = useRef(null)
  const isTransitioningRef = useRef(false)
  const heroCaptionRef = useRef(null)
  const shopButtonRef = useRef(null)
  const heroCoverRef = useRef(null)
  const heroImageRef = useRef(null)
  const heroPhotoRef = useRef(null)
  const heroSunsetPhotoRef = useRef(null)
  const heroSunRef = useRef(null)
  const leftHeroTitleRef = useRef(null)
  const rightHeroTitleRef = useRef(null)
  const aiIntroRef = useRef(null)
  const featureSectionRef = useRef(null)
  const featureCupRef = useRef(null)
  const bestSellerSectionRef = useRef(null)
  const eventsGridRef = useRef(null)
  const makdongSectionRef = useRef(null)
  const canMovePastHeroRef = useRef(false)
  const heroRevealRef = useRef(null)
  const bestSellerTransitionRef = useRef(false)
  const heroSunPlayRef = useRef(null)
  const heroSunResetRef = useRef(null)
  const isHeroSunCompleteRef = useRef(false)

  useMainSectionWheel({
    mainContentRef,
    aiIntroRef,
    featureSectionRef,
    bestSellerSectionRef,
    eventsGridRef,
    makdongSectionRef,
    canMovePastHeroRef,
    bestSellerTransitionRef,
    heroSunPlayRef,
    heroSunResetRef,
    isHeroSunCompleteRef,
  })

  useHeroReveal({
    mainContentRef,
    heroCoverRef,
    heroImageRef,
    heroPhotoRef,
    heroSunsetPhotoRef,
    heroSunRef,
    leftHeroTitleRef,
    rightHeroTitleRef,
    heroCaptionRef,
    shopButtonRef,
    canMovePastHeroRef,
    heroRevealRef,
    heroSunPlayRef,
    heroSunResetRef,
    isHeroSunCompleteRef,
  })

  useLogoScrollReset({
    mainContentRef,
    transitionRef,
    canMovePastHeroRef,
    heroRevealRef,
  })

  useSectionReveals({
    aiIntroRef,
    featureSectionRef,
    featureCupRef,
    eventsGridRef,
    makdongSectionRef,
  })

  useEffect(() => {
    if (IS_JOURNEY_ENABLED) return undefined

    const root = document.documentElement
    root.classList.add('main-header-visible')

    return () => root.classList.remove('main-header-visible')
  }, [])

  useEffect(() => {
    let isMounted = true

    getCollection('products')
      .then((items) => {
        if (!isMounted) return
        setBestSellerProducts(items.filter(({ status }) => status === 'selling').slice(0, 4))
      })
      .catch(() => {
        if (isMounted) setBestSellerProducts([])
      })

    return () => {
      isMounted = false
    }
  }, [])

  const handleSkipIntro = () => {
    if (isTransitioningRef.current) return

    const transition = transitionRef.current
    const mainContent = mainContentRef.current
    if (!transition || !mainContent) return

    isTransitioningRef.current = true

    gsap.timeline({
      onComplete: () => {
        isTransitioningRef.current = false
      },
    })
      .to(transition, {
        autoAlpha: 1,
        duration: 0.55,
        ease: 'power2.inOut',
      })
      .call(() => {
        const root = document.documentElement
        const previousScrollBehavior = root.style.scrollBehavior

        root.style.scrollBehavior = 'auto'
        flushSync(() => setIsIntroSkipped(true))
        window.scrollTo(0, 0)
        ScrollTrigger.refresh()
        root.style.scrollBehavior = previousScrollBehavior
      })
      .to({}, { duration: 0.2 })
      .to(transition, {
        autoAlpha: 0,
        duration: 0.75,
        ease: 'power2.inOut',
        delay: 0.12,
      })
  }

  return (
    <div className={styles.page} data-main-page>
      {/* 여정 인트로 섹션 */}
      {!isIntroSkipped && <JourneySection onSkip={handleSkipIntro} />}

      {/* 메인 히어로 섹션 */}
      <section ref={mainContentRef} className={styles.mainContent} aria-labelledby="main-content-title">
        <div className={styles.heroInner}>
          <div ref={heroCoverRef} className={styles.heroCover} aria-hidden="true">
            <img src={heroImage} alt="" />
            <div className={styles.heroScrollGuide}>
              <span className={styles.scrollMouse}><i /></span>
              <span>SCROLL</span>
            </div>
          </div>
          <div className={styles.heroVisual}>
            <h1 ref={leftHeroTitleRef} id="main-content-title" className={`${styles.heroTitle} ${styles.heroTitleLeft}`}>
              오늘의
            </h1>

            <div ref={heroImageRef} className={styles.imageGroup}>
              <figure className={styles.imageFrame}>
                <img ref={heroPhotoRef} src={heroImage} alt="전통주와 안주가 차려진 자작의 공간" />
                <img
                  ref={heroSunsetPhotoRef}
                  className={styles.heroSunsetPhoto}
                  src={heroSunsetImage}
                  alt=""
                  aria-hidden="true"
                />
              </figure>
              <span ref={heroSunRef} className={styles.heroSun} data-phase="sun" aria-hidden="true">
                <img className={styles.heroSunIcon} src={heroSunIcon} alt="" />
                <img className={styles.heroMoonIcon} src={heroMoonIcon} alt="" />
              </span>
              <p ref={heroCaptionRef} className={styles.heroCaption}>
                오늘 하루도 수고한 나에게,
                <br />
                다정하게 한 잔을 따라보세요.
              </p>
              <Link ref={shopButtonRef} className={styles.shopButton} to="/shop">
                상품 보러가기
              </Link>
            </div>

            <p ref={rightHeroTitleRef} className={`${styles.heroTitle} ${styles.heroTitleRight}`} aria-hidden="true">
              자작
            </p>
          </div>

        </div>
      </section>

      {/* AI 맞춤 추천 소개 섹션 */}
      <section ref={aiIntroRef} className={styles.aiIntro} aria-labelledby="ai-intro-title">
        <div className={styles.aiIntroContent}>
        <div className={styles.moodHeading}>
          <p className={styles.moodLabel} aria-label="HAPPY, RAINY, SWEET">
            <span className={styles.moodHappy} aria-hidden="true">HAPPY</span>
            <span className={`${styles.moodHappy} ${styles.happyShower}`} aria-hidden="true">
              {Array.from({ length: 7 }, (_, index) => <i key={index} />)}
            </span>
            <span className={styles.moodRainy} aria-hidden="true">RAINY</span>
            <span className={`${styles.moodRainy} ${styles.rainShower}`} aria-hidden="true">
              {Array.from({ length: 7 }, (_, index) => <i key={index} />)}
            </span>
            <span className={styles.moodSweet} aria-hidden="true">SWEET</span>
            <span className={`${styles.moodSweet} ${styles.flowerShower}`} aria-hidden="true">
              {Array.from({ length: 8 }, (_, index) => <i key={index} />)}
            </span>
          </p>
          <div className={styles.eyePlaceholder}>
            <div className={styles.faceViewport}>
              <img className={styles.peekFaceDefault} src={peekFaceDefault} alt="살짝 얼굴을 내민 막동이" />
              <img className={styles.peekFaceUp} src={peekFaceUp} alt="위를 바라보는 막동이" />
              <img className={styles.peekFaceSmile} src={peekFaceSmile} alt="미소 짓는 막동이" />
            </div>
            <img className={styles.tornPaperFrame} src={tornPaperFrame} alt="" aria-hidden="true" />
          </div>
          <p className={`${styles.moodLabel} ${styles.mirroredMood}`} aria-hidden="true">
            <span className={styles.moodHappy}>HAPPY</span>
            <span className={`${styles.moodHappy} ${styles.happyShower}`}>
              {Array.from({ length: 7 }, (_, index) => <i key={index} />)}
            </span>
            <span className={styles.moodRainy}>RAINY</span>
            <span className={`${styles.moodRainy} ${styles.rainShower}`}>
              {Array.from({ length: 7 }, (_, index) => <i key={index} />)}
            </span>
            <span className={styles.moodSweet}>SWEET</span>
            <span className={`${styles.moodSweet} ${styles.flowerShower}`}>
              {Array.from({ length: 8 }, (_, index) => <i key={index} />)}
            </span>
          </p>
        </div>

        <h2 id="ai-intro-title" className={styles.moodCopy} aria-label="오늘의 기분에 어울리는 조합 추천">
          <span className={styles.moodHappy}><em className={styles.moodKeyword}>기분 좋은 날</em>에는 이런 조합 어때요?</span>
          <span className={styles.moodRainy}><em className={styles.moodKeyword}>비가 많이 내리는 날</em>에는 이런 조합 어때요?</span>
          <span className={styles.moodSweet}><em className={styles.moodKeyword}>달달한 게 당기는 날</em>에는 이런 조합 어때요?</span>
        </h2>

        <div className={styles.recommendCards} aria-label="막동이 추천 미리보기">
          {moodRecommendations.map(({ badge, variants }) => (
            <article key={badge} className={styles.recommendCard}>
              <div className={styles.recommendCardTitle}>
                {variants.map(({ mood, name }) => (
                  <strong key={mood} className={styles[mood]}>{name}</strong>
                ))}
              </div>
              <div className={styles.recommendCardVisual}>
                {variants.map(({ mood, image, alt }) => (
                  <img key={mood} className={styles[mood]} src={image} alt={alt} />
                ))}
              </div>
              <div className={styles.recommendCardDescription}>
                {variants.map(({ mood, description }) => (
                  <p key={mood} className={styles[mood]}>{description}</p>
                ))}
              </div>
            </article>
          ))}
        </div>

        <Link className={styles.aiButton} to="/ai">
          나만의 조합 추천받기
        </Link>
        </div>

      </section>

      {/* 자작 브랜드 스토리 섹션 */}
      <section ref={featureSectionRef} className={styles.featureSection} aria-labelledby="feature-title">
        <div className={styles.featureCopy}>
          <h2 id="feature-title">
            <span>자작은 술잔에</span>
            <span>다정함을 담습니다</span>
          </h2>
          <p>
            우리 술과 안주가 건네는
            <br />
            소박하고 따뜻한 순간을 이야기합니다.
          </p>
          <Link className={styles.featureButton} to="/brand">
            자작 이야기 보기
          </Link>
        </div>

        <div className={styles.featureImage} role="img" aria-label="AI 큐레이션 대표 이미지 영역">
          <div className={styles.featurePhotoFrame}>
            <img className={styles.featureBackground} src={brandStoryImage} alt="전통주를 잔에 따르는 모습" />
          </div>
          <img className={`${styles.featurePourOverlay} ${styles.featurePourBefore}`} src={brandStoryPourBefore} alt="술을 따르기 전 술병을 든 모습" />
          <img className={`${styles.featurePourOverlay} ${styles.featurePourAfter}`} src={brandStoryPourAfter} alt="잔에 술을 따르는 모습" />
          <img ref={featureCupRef} className={styles.featureCup} src={brandStoryCup} alt="" aria-hidden="true" />
        </div>
      </section>

      {/* 베스트셀러 상품 섹션 */}
      <BestSellerSection
        products={bestSellerProducts}
        sectionRef={bestSellerSectionRef}
        nextSectionRef={eventsGridRef}
        transitionActiveRef={bestSellerTransitionRef}
      />

      {/* 이벤트 섹션 */}
      <section ref={eventsGridRef} className={styles.eventsGrid} aria-labelledby="events-grid-title">
        <div className={styles.eventsCopy}>
          <p>Events</p>
          <h2 id="events-grid-title">
            <span>다양한 혜택과</span>
            <span>이벤트 지금 확인하세요</span>
          </h2>
          <Link className={styles.eventsButton} to="/events">
            전체 이벤트 보기
          </Link>
        </div>

        <div className={styles.eventGallery} aria-label="이벤트 이미지 미리보기">
          {mainEvents.map((event, index) => {
            const positionClass = [
            styles.eventOne,
            styles.eventTwo,
            styles.eventThree,
            styles.eventFour,
            styles.eventFive,
            ][index]
            const destination = index === 0 && event.isActive
              ? '/events/roulette'
              : event.isActive ? '/events' : '/mypage/events'

            return (
              <Link
                key={event.id}
                className={`${styles.eventMock} ${positionClass}`}
                to={destination}
                aria-label={`${event.title}로 이동`}
              >
                <span className={styles.eventCardInner}>
                  <span className={styles.eventCardFront}>
                    <img src={event.bannerSrc} alt="" />
                  </span>
                  <span className={styles.eventCardBack}>
                    <strong>{event.title}</strong>
                    <small>{event.isActive ? '보러가기' : '종료된 이벤트'}</small>
                  </span>
                </span>
              </Link>
            )
          })}
          <div
            className={`${styles.eventMock} ${styles.eventFive} ${styles.eventPlaceholder}`}
            aria-hidden="true"
          >
            <span className={styles.eventCardInner}>
              <span className={styles.eventCardFront} />
            </span>
          </div>
        </div>
      </section>

      {/* 막동이 소개 페이지 진입 섹션 */}
      <section
        ref={makdongSectionRef}
        className={styles.makdongSection}
        aria-labelledby="makdong-title"
      >
        <div className={styles.makdongVisual} aria-hidden="true">
          <img className={styles.makdongCharacter} src={makdongCharacter} alt="" />
        </div>
        <div className={styles.makdongCopy}>
          <h2 id="makdong-title">
            <span>우리 술 곁의</span>
            <span>다정한 친구, <em>막동이</em></span>
          </h2>
          <p className={styles.makdongDescription}>
            우리 술이 있는 순간마다 막동이가 다정함을 건넵니다.
            <br />
            전통주의 즐거움을 전하는 막동이와 함께해요.
          </p>
          <Link className={styles.makdongButton} to="/brand/makdong">
            막둥이 이야기 보기 <span aria-hidden="true">→</span>
          </Link>

          <div className={styles.makdongTraits} aria-label="막동이의 특징">
            {makdongTraits.map(({ icon, title, description }) => (
              <article className={styles.makdongTrait} key={title}>
                <span className={styles.makdongTraitIcon} aria-hidden="true">{icon}</span>
                <strong>{title}</strong>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <div ref={transitionRef} className={styles.skipTransition} aria-hidden="true" />
    </div>
  )
}

export default MainPage
