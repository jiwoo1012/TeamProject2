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
import heroImage from '../../assets/images/main/main-hero-table.webp'
import tornPaperFrame from '../../assets/images/main/main-torn-paper.png'
import peekFaceDefault from '../../assets/images/main/peek-face-default.webp'
import peekFaceSmile from '../../assets/images/main/peek-face-smile.webp'
import peekFaceUp from '../../assets/images/main/peek-face-up.webp'
import happyDayFood from '../../assets/images/main/happy-day-grilled-pollock.png'
import happyDayLiquor from '../../assets/images/main/happy-day-black-liquor.png'
import happyDayCup from '../../assets/images/main/happy-day-black-cup.png'
import rainyDayFood from '../../assets/images/main/rainy-day-kimchi-pancake.png'
import rainyDayLiquor from '../../assets/images/main/rainy-day-blue-liquor.png'
import rainyDayCup from '../../assets/images/main/rainy-day-blue-cup.png'
import sweetDayFood from '../../assets/images/main/sweet-craving-yakgwa.png'
import sweetDayLiquor from '../../assets/images/main/sweet-craving-orange-liquor.png'
import sweetDayCup from '../../assets/images/main/sweet-craving-orange-cup.png'
import brandStoryImage from '../../assets/images/main/brand-story-pouring.webp'
import brandStoryPourBefore from '../../assets/images/main/brand-story-pour-before.png'
import brandStoryPourAfter from '../../assets/images/main/brand-story-pour-after.png'
import brandStoryCup from '../../assets/images/main/brand-story-cup.png'
import makdongImage from '../../assets/characters/M007_Poses01.png'
import { getCollection } from '../../firebase/firestore'
import styles from './MainPage.module.scss'

gsap.registerPlugin(ScrollTrigger)

const IS_JOURNEY_ENABLED = true

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
  const leftHeroTitleRef = useRef(null)
  const rightHeroTitleRef = useRef(null)
  const aiIntroRef = useRef(null)
  const featureSectionRef = useRef(null)
  const bestSellerSectionRef = useRef(null)
  const eventsGridRef = useRef(null)
  const makdongSectionRef = useRef(null)
  const canMovePastHeroRef = useRef(false)
  const heroRevealRef = useRef(null)
  const bestSellerTransitionRef = useRef(false)

  useMainSectionWheel({
    mainContentRef,
    aiIntroRef,
    featureSectionRef,
    bestSellerSectionRef,
    eventsGridRef,
    makdongSectionRef,
    canMovePastHeroRef,
    bestSellerTransitionRef,
  })

  useHeroReveal({
    mainContentRef,
    heroCoverRef,
    heroImageRef,
    heroPhotoRef,
    leftHeroTitleRef,
    rightHeroTitleRef,
    heroCaptionRef,
    shopButtonRef,
    canMovePastHeroRef,
    heroRevealRef,
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
      {!isIntroSkipped && <JourneySection onSkip={handleSkipIntro} />}

      <section ref={mainContentRef} className={styles.mainContent} aria-labelledby="main-content-title">
        <div className={styles.heroInner}>
          <div ref={heroCoverRef} className={styles.heroCover} aria-hidden="true">
            <img src={heroImage} alt="" />
          </div>
          <div className={styles.heroVisual}>
            <h1 ref={leftHeroTitleRef} id="main-content-title" className={`${styles.heroTitle} ${styles.heroTitleLeft}`}>
              오늘의
            </h1>

            <div ref={heroImageRef} className={styles.imageGroup}>
              <figure className={styles.imageFrame}>
                <img ref={heroPhotoRef} src={heroImage} alt="전통주와 안주가 차려진 자작의 공간" />
              </figure>
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
          <span className={styles.moodHappy}>기분 좋은 날에는 이런 조합 어때요?</span>
          <span className={styles.moodRainy}>비가 많이 내리는 날에는 이런 조합 어때요?</span>
          <span className={styles.moodSweet}>달달한 게 당기는 날에는 이런 조합 어때요?</span>
        </h2>

        <div className={styles.recommendCards} aria-label="막동이 추천 미리보기">
          <div className={styles.sideCard}>
            <img className={styles.moodHappy} src={happyDayFood} alt="행복한 날 추천 안주" />
            <img className={styles.moodRainy} src={rainyDayFood} alt="우울한 날 추천 안주" />
            <img className={styles.moodSweet} src={sweetDayFood} alt="달콤한 날 추천 안주" />
          </div>
          <div className={styles.mainCard}>
            <img className={styles.moodHappy} src={happyDayLiquor} alt="행복한 날 추천 전통주" />
            <img className={styles.moodRainy} src={rainyDayLiquor} alt="우울한 날 추천 전통주" />
            <img className={styles.moodSweet} src={sweetDayLiquor} alt="달콤한 날 추천 전통주" />
          </div>
          <div className={styles.sideCard}>
            <img className={styles.moodHappy} src={happyDayCup} alt="행복한 날 추천 술잔" />
            <img className={styles.moodRainy} src={rainyDayCup} alt="우울한 날 추천 술잔" />
            <img className={styles.moodSweet} src={sweetDayCup} alt="달콤한 날 추천 술잔" />
          </div>
        </div>

        <Link className={styles.aiButton} to="/ai">
          추천 받으러 가기
        </Link>
        </div>

      </section>

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
          <img className={styles.featureCup} src={brandStoryCup} alt="" aria-hidden="true" />
        </div>
      </section>

      <BestSellerSection
        products={bestSellerProducts}
        sectionRef={bestSellerSectionRef}
        nextSectionRef={eventsGridRef}
        transitionActiveRef={bestSellerTransitionRef}
      />

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
          {[
            styles.eventOne,
            styles.eventTwo,
            styles.eventThree,
            styles.eventFour,
            styles.eventFive,
          ].map((positionClass, index) => (
            <Link
              key={positionClass}
              className={`${styles.eventMock} ${positionClass}`}
              to="/events"
              aria-label={`이벤트 ${index + 1}로 이동`}
            >
              <span className={styles.eventCardInner}>
                <span className={styles.eventCardFront}>IMAGE</span>
                <span className={styles.eventCardBack}>보러가기</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section
        ref={makdongSectionRef}
        className={styles.makdongSection}
        aria-labelledby="makdong-title"
      >
        <div className={styles.makdongCopy}>
          <h2 id="makdong-title">
            <span>우리 술 곁의</span>
            <span>다정한 친구, 막동이</span>
          </h2>
          <p className={styles.makdongDescription}>
            우리 술이 있는 순간마다 막동이가 다정함을 건넵니다.
          </p>
          <Link className={styles.makdongButton} to="/brand/makdong">
            더 알아보기
          </Link>
        </div>

        <div className={styles.makdongVisual}>
          <div className={styles.makdongCharacter}>
            <img
              className={styles.makdongBase}
              src={makdongImage}
              alt="술을 따르는 자작 캐릭터 막동이"
              draggable="false"
            />
          </div>
        </div>
      </section>

      <div ref={transitionRef} className={styles.skipTransition} aria-hidden="true" />
    </div>
  )
}

export default MainPage
