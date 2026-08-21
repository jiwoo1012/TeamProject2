import { useLayoutEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Link } from 'react-router-dom'

import JourneySection from './JourneySection'
import heroImage from '../../assets/images/main/05-livingroom-table.webp'
import styles from './MainPage.module.scss'

gsap.registerPlugin(ScrollTrigger)

const MainPage = () => {
  const [isIntroSkipped, setIsIntroSkipped] = useState(false)
  const mainContentRef = useRef(null)
  const transitionRef = useRef(null)
  const isTransitioningRef = useRef(false)
  const heroCaptionRef = useRef(null)
  const shopButtonRef = useRef(null)
  const heroImageRef = useRef(null)
  const heroPhotoRef = useRef(null)
  const leftHeroTitleRef = useRef(null)
  const rightHeroTitleRef = useRef(null)
  const promoIntroRef = useRef(null)
  const aiIntroRef = useRef(null)
  const featureSectionRef = useRef(null)
  const bestSellerRef = useRef(null)
  const eventsGridRef = useRef(null)
  const canMoveToPromoRef = useRef(false)

  useLayoutEffect(() => {
    const root = document.documentElement
    const headerVisibleClass = 'main-header-visible'

    gsap.set(heroImageRef.current, {
      clearProps: 'opacity,visibility,transform',
    })
    gsap.set(heroPhotoRef.current, {
      clearProps: 'transform',
    })
    gsap.set([leftHeroTitleRef.current, rightHeroTitleRef.current], {
      autoAlpha: 1,
      y: 0,
    })
    gsap.set(transitionRef.current, {
      autoAlpha: 0,
    })
    gsap.set(
      [aiIntroRef.current, featureSectionRef.current, bestSellerRef.current]
        .flatMap((section) => [...section.querySelectorAll('*')]),
      { clearProps: 'opacity,visibility' },
    )

    const trigger = ScrollTrigger.create({
      trigger: mainContentRef.current,
      start: 'top top',
      onEnter: () => root.classList.add(headerVisibleClass),
      onEnterBack: () => root.classList.add(headerVisibleClass),
    })
    let promoScrollTween
    let previousScrollBehavior = ''
    const heroReveal = gsap.timeline({
      onComplete: () => {
        canMoveToPromoRef.current = true
      },
      onReverseComplete: () => {
        canMoveToPromoRef.current = false
      },
      scrollTrigger: {
        trigger: mainContentRef.current,
        start: 'top top-=100',
        toggleActions: 'play none none reverse',
      },
    })
      .to(heroImageRef.current, {
        yPercent: () => (window.innerWidth >= 1200 ? -66 : -48),
        duration: 0.72,
        ease: 'power2.inOut',
      })
      .to(
        [leftHeroTitleRef.current, rightHeroTitleRef.current],
        { autoAlpha: 0, y: 12, duration: 0.3, ease: 'power1.out' },
        0,
      )
      .fromTo(
        heroCaptionRef.current,
        { autoAlpha: 0, y: 28 },
        { autoAlpha: 1, y: 0, duration: 0.65, ease: 'power2.out' },
        '-=0.48',
      )
      .fromTo(
        shopButtonRef.current,
        { autoAlpha: 0, y: 18, scale: 0.96 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: 'power2.out' },
        '-=0.28',
      )

    const handleSectionWheel = (event) => {
      const mainContent = mainContentRef.current
      const promoIntro = promoIntroRef.current
      const sections = [
        promoIntroRef.current,
        aiIntroRef.current,
        featureSectionRef.current,
        bestSellerRef.current,
        eventsGridRef.current,
      ]
      if (!mainContent || sections.some((section) => !section)) return

      if (promoScrollTween) {
        event.preventDefault()
        return
      }

      const direction = Math.sign(event.deltaY)
      if (!direction) return

      const currentScroll = window.scrollY
      const mainTop = mainContent.offsetTop
      const promoTop = promoIntro.offsetTop
      const sectionTops = sections.map((section) => section.offsetTop)
      let targetTop

      if (currentScroll < promoTop - 2) {
        if (currentScroll < mainTop) return

        if (direction < 0) {
          if (currentScroll <= mainTop + 2) return
          targetTop = mainTop
        } else if (canMoveToPromoRef.current) {
          targetTop = promoTop
        } else {
          targetTop = Math.min(mainTop + window.innerHeight, promoTop - 2)
        }
      } else {
        const currentIndex = sectionTops.reduce((closestIndex, top, index) => (
          Math.abs(top - currentScroll) < Math.abs(sectionTops[closestIndex] - currentScroll)
            ? index
            : closestIndex
        ), 0)
        const targetIndex = currentIndex + direction

        if (targetIndex < 0) {
          targetTop = mainTop + window.innerHeight
        } else if (targetIndex >= sectionTops.length) {
          return
        } else {
          targetTop = sectionTops[targetIndex]
        }
      }

      event.preventDefault()
      previousScrollBehavior = root.style.scrollBehavior
      root.style.scrollBehavior = 'auto'

      const scrollState = { y: currentScroll }
      promoScrollTween = gsap.to(scrollState, {
        y: targetTop,
        duration: 0.95,
        ease: 'power2.inOut',
        onUpdate: () => window.scrollTo(0, scrollState.y),
        onComplete: () => {
          root.style.scrollBehavior = previousScrollBehavior
          gsap.delayedCall(0.22, () => {
            promoScrollTween = null
          })
        },
      })
    }

    window.addEventListener('wheel', handleSectionWheel, { passive: false })

    const handleLogoClick = (event) => {
      const logoLink = event.target.closest('header a[href="/"]')
      if (!logoLink || !mainContentRef.current) return

      event.preventDefault()
      const targetTop = mainContentRef.current.offsetTop
      if (Math.abs(window.scrollY - targetTop) < 2) return

      const transition = transitionRef.current
      gsap.killTweensOf(transition)
      gsap.timeline()
        .to(transition, {
          autoAlpha: 1,
          duration: 0.5,
          ease: 'power2.inOut',
        })
        .call(() => {
          const previousBehavior = root.style.scrollBehavior
          root.style.scrollBehavior = 'auto'
          window.scrollTo(0, targetTop)
          ScrollTrigger.update()
          heroReveal.pause(0)
          canMoveToPromoRef.current = false
          root.style.scrollBehavior = previousBehavior
        })
        .to({}, { duration: 0.45 })
        .to(transition, {
          autoAlpha: 0,
          duration: 0.75,
          ease: 'power2.inOut',
        })
    }

    document.addEventListener('click', handleLogoClick)

    const aiReveal = gsap.timeline({
      scrollTrigger: {
        trigger: aiIntroRef.current,
        start: 'top 72%',
        toggleActions: 'play none none reverse',
      },
    })
      .from(`.${styles.moodIcons}`, { y: 24, duration: 0.45 })
      .from(`.${styles.moodHeading}`, { y: 36, duration: 0.6, ease: 'power2.out' }, '-=0.15')
      .from(`.${styles.aiIntro} h2`, { y: 24, duration: 0.45 }, '-=0.25')
      .from(`.${styles.recommendCards} > div`, { y: 42, duration: 0.5, stagger: 0.12 }, '-=0.2')
      .from(`.${styles.aiButton}`, { y: 20, scale: 0.97, duration: 0.4 }, '-=0.2')

    const featureReveal = gsap.timeline({
      scrollTrigger: {
        trigger: featureSectionRef.current,
        start: 'top 72%',
        toggleActions: 'play none none reverse',
      },
    })
      .from(`.${styles.featureCopy}`, { x: -48, duration: 0.7, ease: 'power2.out' })
      .from(`.${styles.featureImage}`, { x: 48, duration: 0.7, ease: 'power2.out' }, '-=0.48')

    const bestSellerReveal = gsap.timeline({
      scrollTrigger: {
        trigger: bestSellerRef.current,
        start: 'top 72%',
        toggleActions: 'play none none reverse',
      },
    })
      .from(`.${styles.bestSellerTitle}`, { y: 24, duration: 0.45 })
      .from(`.${styles.productMock}`, { y: 80, rotate: 0, scale: 0.92, duration: 0.7, stagger: 0.12, ease: 'back.out(1.25)' }, '-=0.18')
      .from(`.${styles.allProductsButton}`, { y: 20, duration: 0.4 }, '-=0.2')

    const eventsGridReveal = gsap.timeline({
      scrollTrigger: {
        trigger: eventsGridRef.current,
        start: 'top 72%',
        toggleActions: 'play none none reverse',
      },
    })
      .from(`.${styles.eventsCopy}`, { x: -44, duration: 0.65, ease: 'power2.out' })
      .from(`.${styles.eventMock}`, { y: 54, scale: 0.96, duration: 0.55, stagger: 0.1, ease: 'power2.out' }, '-=0.35')

    return () => {
      window.removeEventListener('wheel', handleSectionWheel)
      document.removeEventListener('click', handleLogoClick)
      promoScrollTween?.kill()
      root.style.scrollBehavior = previousScrollBehavior
      trigger.kill()
      heroReveal.scrollTrigger?.kill()
      heroReveal.kill()
      aiReveal.scrollTrigger?.kill()
      aiReveal.kill()
      featureReveal.scrollTrigger?.kill()
      featureReveal.kill()
      bestSellerReveal.scrollTrigger?.kill()
      bestSellerReveal.kill()
      eventsGridReveal.scrollTrigger?.kill()
      eventsGridReveal.kill()
      root.classList.remove(headerVisibleClass)
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
        root.classList.add('main-header-visible')
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
          <div className={styles.heroVisual}>
            <h1 ref={leftHeroTitleRef} id="main-content-title" className={`${styles.heroTitle} ${styles.heroTitleLeft}`}>
              오늘의
              <br />
              자작
            </h1>

            <div ref={heroImageRef} className={styles.imageGroup}>
              <figure className={styles.imageFrame}>
                <img ref={heroPhotoRef} src={heroImage} alt="전통주와 안주가 차려진 자작의 공간" />
                <figcaption ref={heroCaptionRef}>
                  자작이 준비한 전통주와 안주로
                  <br />
                  나만의 시간을 완성하세요
                </figcaption>
              </figure>
              <Link ref={shopButtonRef} className={styles.shopButton} to="/shop">
                SHOP NOW
              </Link>
            </div>
          </div>

          <p ref={rightHeroTitleRef} className={`${styles.heroTitle} ${styles.heroTitleRight}`} aria-hidden="true">
            오늘의
            <br />
            자작
          </p>

        </div>
      </section>

      <section ref={promoIntroRef} className={styles.promoIntro} aria-labelledby="promo-intro-title">
        <h2 id="promo-intro-title">Events &amp; Promos</h2>
        <p>
          자작이 준비한 특별한 이벤트와 혜택으로
          <br />
          오늘의 한 잔을 더 즐겁게 만나보세요.
        </p>
      </section>

      <section ref={aiIntroRef} className={styles.aiIntro} aria-labelledby="ai-intro-title">
        <div className={styles.moodIcons} aria-hidden="true">
          <span>☁</span>
          <strong>●</strong>
          <span>☂</span>
        </div>

        <div className={styles.moodHeading}>
          <p>HAPPY</p>
          <div className={styles.eyePlaceholder} aria-label="추천 분위기 이미지 영역">
            IMAGE
          </div>
          <p className={styles.mirroredMood} aria-hidden="true">HAPPY</p>
        </div>

        <h2 id="ai-intro-title">기분이 우울할 때는 이런 조합 어때요?</h2>

        <div className={styles.recommendCards} aria-label="막동이 추천 미리보기">
          <div className={styles.sideCard}>IMAGE</div>
          <div className={styles.mainCard}>IMAGE</div>
          <div className={styles.sideCard}>IMAGE</div>
        </div>

        <Link className={styles.aiButton} to="/ai">
          AI NOW
        </Link>
      </section>

      <section ref={featureSectionRef} className={styles.featureSection} aria-labelledby="feature-title">
        <div className={styles.featureCopy}>
          <h2 id="feature-title">Events &amp; Promos</h2>
          <p>
            자작이 제안하는 특별한 큐레이션으로
            <br />
            취향에 맞는 전통주와 안주를 만나보세요.
          </p>
          <Link className={styles.featureButton} to="/ai">
            AI NOW
          </Link>
        </div>

        <div className={styles.featureImage} role="img" aria-label="AI 큐레이션 대표 이미지 영역">
          IMAGE
        </div>
      </section>

      <section ref={bestSellerRef} className={styles.bestSeller} aria-labelledby="best-seller-title">
        <h2 id="best-seller-title" className={styles.bestSellerTitle}>BEST SELLER</h2>

        <div className={styles.productDeck} aria-label="베스트셀러 상품 미리보기">
          <article className={`${styles.productMock} ${styles.productOne}`}>
            <span>JAJAK PICK</span><div>IMAGE</div>
          </article>
          <article className={`${styles.productMock} ${styles.productTwo}`}>
            <span>TRADITIONAL</span><div>IMAGE</div>
          </article>
          <article className={`${styles.productMock} ${styles.productThree}`}>
            <span>NEW TASTE</span><div>IMAGE</div>
          </article>
          <article className={`${styles.productMock} ${styles.productFour}`}>
            <span>BEST PAIRING</span><div>IMAGE</div>
          </article>
        </div>

        <Link className={styles.allProductsButton} to="/shop">
          See All Products
        </Link>
      </section>

      <section ref={eventsGridRef} className={styles.eventsGrid} aria-labelledby="events-grid-title">
        <div className={styles.eventsCopy}>
          <p>Events</p>
          <h2 id="events-grid-title">
            다양한 혜택과
            <br />
            이벤트 지금 확인하세요
          </h2>
          <Link className={styles.eventsButton} to="/events">
            See All Events
          </Link>
        </div>

        <div className={styles.eventGallery} aria-label="이벤트 이미지 미리보기">
          <div className={`${styles.eventMock} ${styles.eventOne}`}>IMAGE</div>
          <div className={`${styles.eventMock} ${styles.eventTwo}`}>IMAGE</div>
          <div className={`${styles.eventMock} ${styles.eventThree}`}>IMAGE</div>
          <div className={`${styles.eventMock} ${styles.eventFour}`}>IMAGE</div>
          <div className={`${styles.eventMock} ${styles.eventFive}`}>IMAGE</div>
        </div>
      </section>

      <div ref={transitionRef} className={styles.skipTransition} aria-hidden="true" />
    </div>
  )
}

export default MainPage
