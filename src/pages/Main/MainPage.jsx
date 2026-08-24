import { useLayoutEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Link } from 'react-router-dom'

import JourneySection from './JourneySection'
import heroImage from '../../assets/images/main/main-hero-table.webp'
import tornPaperFrame from '../../assets/images/main/main-torn-paper.png'
import peekFaceDefault from '../../assets/images/main/peek-face-default.webp'
import peekFaceSmile from '../../assets/images/main/peek-face-smile.webp'
import peekFaceUp from '../../assets/images/main/peek-face-up.webp'
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
  const aiIntroRef = useRef(null)
  const featureSectionRef = useRef(null)
  const bestSellerRef = useRef(null)
  const eventsGridRef = useRef(null)
  const canMovePastHeroRef = useRef(false)

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
    let bestCardTween
    let bestCardStep = 0
    let isBestWheelLocked = false
    let bestWheelReleaseTimer
    let previousScrollBehavior = ''
    const isDesktop = window.innerWidth >= 1200
    const bestCards = [...bestSellerRef.current.querySelectorAll(`.${styles.productMock}`)]
    const bestProductsButton = bestSellerRef.current.querySelector(`.${styles.allProductsButton}`)

    if (isDesktop) {
      gsap.set(bestCards, {
        y: window.innerHeight * 0.58,
        autoAlpha: 0,
      })
      gsap.set(bestProductsButton, { autoAlpha: 0, y: 20 })
    }
    const heroReveal = gsap.timeline({
      onComplete: () => {
        canMovePastHeroRef.current = true
      },
      onReverseComplete: () => {
        canMovePastHeroRef.current = false
      },
      scrollTrigger: {
        trigger: mainContentRef.current,
        start: 'top top-=100',
        toggleActions: 'play none none reverse',
      },
    })
      .to(heroImageRef.current, {
        yPercent: () => (window.innerWidth >= 1200 ? -52 : -48),
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
      const sections = [
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
      const firstSectionTop = aiIntroRef.current.offsetTop
      const sectionTops = sections.map((section) => section.offsetTop)
      let targetTop

      if (currentScroll < firstSectionTop - 2) {
        if (currentScroll < mainTop) return

        if (direction < 0) {
          if (currentScroll <= mainTop + 2) return
          targetTop = mainTop
        } else if (canMovePastHeroRef.current) {
          targetTop = firstSectionTop
        } else {
          targetTop = Math.min(mainTop + window.innerHeight, firstSectionTop - 2)
        }
      } else {
        const currentIndex = sectionTops.reduce((closestIndex, top, index) => (
          Math.abs(top - currentScroll) < Math.abs(sectionTops[closestIndex] - currentScroll)
            ? index
            : closestIndex
        ), 0)
        const bestSellerRect = bestSellerRef.current.getBoundingClientRect()
        const isBestSectionActive = bestSellerRect.top <= window.innerHeight * 0.12
          && bestSellerRect.bottom >= window.innerHeight * 0.88

        if (isDesktop && isBestSectionActive) {
          const releaseBestWheelAfterPause = () => {
            window.clearTimeout(bestWheelReleaseTimer)
            bestWheelReleaseTimer = window.setTimeout(() => {
              isBestWheelLocked = false
            }, 280)
          }

          if (isBestWheelLocked) {
            event.preventDefault()
            releaseBestWheelAfterPause()
            return
          }

          if (bestCardTween) {
            event.preventDefault()
            return
          }

          if (direction > 0 && bestCardStep < bestCards.length) {
            event.preventDefault()
            isBestWheelLocked = true
            releaseBestWheelAfterPause()
            const card = bestCards[bestCardStep]
            bestCardStep += 1
            bestCardTween = gsap.to(card, {
              y: 0,
              autoAlpha: 1,
              duration: 0.58,
              ease: 'power3.out',
              onComplete: () => {
                if (bestCardStep === bestCards.length) {
                  gsap.to(bestProductsButton, { autoAlpha: 1, y: 0, duration: 0.35 })
                }
                gsap.delayedCall(0.32, () => {
                  bestCardTween = null
                })
              },
            })
            return
          }

          if (direction < 0 && bestCardStep > 0) {
            event.preventDefault()
            isBestWheelLocked = true
            releaseBestWheelAfterPause()
            bestCardStep -= 1
            if (bestCardStep < bestCards.length) {
              gsap.to(bestProductsButton, { autoAlpha: 0, y: 20, duration: 0.2 })
            }
            bestCardTween = gsap.to(bestCards[bestCardStep], {
              y: window.innerHeight * 0.58,
              autoAlpha: 0,
              duration: 0.45,
              ease: 'power2.in',
              onComplete: () => {
                gsap.delayedCall(0.32, () => {
                  bestCardTween = null
                })
              },
            })
            return
          }
        }

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
          canMovePastHeroRef.current = false
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
      .from(`.${styles.moodHeading}`, { y: 36, duration: 0.6, ease: 'power2.out' })
      .from(`.${styles.aiIntro} h2`, { y: 24, duration: 0.45 }, '-=0.25')
      .from(`.${styles.recommendCards} > div`, { y: 42, duration: 0.5, stagger: 0.12 }, '-=0.2')
      .from(`.${styles.aiButton}`, { y: 20, opacity: 0, duration: 0.4 }, '-=0.2')

    const featureReveal = gsap.timeline({
      scrollTrigger: {
        trigger: featureSectionRef.current,
        start: 'top 72%',
        toggleActions: 'play none none reverse',
      },
    })
      .from(`.${styles.featureCopy}`, {
        x: () => (window.innerWidth >= 1200 ? -48 : 0),
        duration: 0.7,
        ease: 'power2.out',
      })
      .from(`.${styles.featureImage}`, {
        x: () => (window.innerWidth >= 1200 ? 48 : 0),
        duration: 0.7,
        ease: 'power2.out',
      }, '-=0.48')

    const bestSellerReveal = gsap.timeline({
      scrollTrigger: {
        trigger: bestSellerRef.current,
        start: 'top 86%',
        toggleActions: 'play none none reverse',
      },
    })
      .from(`.${styles.bestSellerTitle}`, { y: 24, duration: 0.45 })

    if (!isDesktop) {
      bestSellerReveal
        .from(`.${styles.productMock}`, {
          y: 80,
          autoAlpha: 0,
          rotate: 0,
          scale: 0.96,
          duration: 0.56,
          stagger: 0.16,
          ease: 'power3.out',
        }, '-=0.12')
        .from(`.${styles.allProductsButton}`, { y: 20, duration: 0.4 }, '-=0.2')
    }

    const eventsGridReveal = gsap.timeline({
      scrollTrigger: {
        trigger: eventsGridRef.current,
        start: 'top 72%',
        toggleActions: 'play none none reverse',
      },
    })
      .from(`.${styles.eventsCopy}`, {
        x: () => (window.innerWidth >= 1200 ? -44 : 0),
        duration: 0.65,
        ease: 'power2.out',
      })
      .from(`.${styles.eventMock}`, { y: 54, scale: 0.96, duration: 0.55, stagger: 0.1, ease: 'power2.out' }, '-=0.35')

    return () => {
      window.removeEventListener('wheel', handleSectionWheel)
      document.removeEventListener('click', handleLogoClick)
      promoScrollTween?.kill()
      bestCardTween?.kill()
      window.clearTimeout(bestWheelReleaseTimer)
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
        <div className={styles.moodHeading}>
          <p className={styles.moodLabel} aria-label="HAPPY, RAINY, SWEET">
            <span className={styles.moodHappy} aria-hidden="true">HAPPY</span>
            <span className={styles.moodRainy} aria-hidden="true">RAINY</span>
            <span className={styles.moodSweet} aria-hidden="true">SWEET</span>
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
            <span className={styles.moodRainy}>RAINY</span>
            <span className={styles.moodSweet}>SWEET</span>
          </p>
        </div>

        <h2 id="ai-intro-title" className={styles.moodCopy} aria-label="오늘의 기분에 어울리는 조합 추천">
          <span className={styles.moodHappy}>기분 좋은 오늘에는 이런 조합 어때요?</span>
          <span className={styles.moodRainy}>기분이 우울할 때는 이런 조합 어때요?</span>
          <span className={styles.moodSweet}>달달한 게 당기는 날에는 이런 조합 어때요?</span>
        </h2>

        <div className={styles.recommendCards} aria-label="막동이 추천 미리보기">
          <div className={styles.sideCard}>IMAGE</div>
          <div className={styles.mainCard}>IMAGE</div>
          <div className={styles.sideCard}>IMAGE</div>
        </div>

        <Link className={styles.aiButton} to="/ai">
          추천 받으러 가기
        </Link>

      </section>

      <section ref={featureSectionRef} className={styles.featureSection} aria-labelledby="feature-title">
        <div className={styles.featureCopy}>
          <h2 id="feature-title">한 잔의 시간에 다정함을 담습니다</h2>
          <p>
            자작은 우리 술과 안주가 건네는
            <br />
            소박하고 따뜻한 순간을 이야기합니다.
          </p>
          <Link className={styles.featureButton} to="/brand">
            자작 이야기 보기
          </Link>
        </div>

        <div className={styles.featureImage} role="img" aria-label="AI 큐레이션 대표 이미지 영역">
          IMAGE
        </div>
      </section>

      <section ref={bestSellerRef} className={styles.bestSeller} aria-labelledby="best-seller-title">
        <h2 id="best-seller-title" className={styles.bestSellerTitle}>베스트 상품</h2>

        <div className={styles.productDeck} aria-label="베스트셀러 상품 미리보기">
          <article className={`${styles.productMock} ${styles.productOne}`}>
            <header className={styles.productMockHeader}>
              <span><strong>JAJAK</strong><small>Traditional Selection</small></span>
              <i aria-hidden="true">♥</i>
            </header>
            <div>IMAGE</div>
          </article>
          <article className={`${styles.productMock} ${styles.productTwo}`}>
            <header className={styles.productMockHeader}>
              <span><strong>JAJAK</strong><small>Traditional Selection</small></span>
              <i aria-hidden="true">♥</i>
            </header>
            <div>IMAGE</div>
          </article>
          <article className={`${styles.productMock} ${styles.productThree}`}>
            <header className={styles.productMockHeader}>
              <span><strong>JAJAK</strong><small>Traditional Selection</small></span>
              <i aria-hidden="true">♥</i>
            </header>
            <div>IMAGE</div>
          </article>
          <article className={`${styles.productMock} ${styles.productFour}`}>
            <header className={styles.productMockHeader}>
              <span><strong>JAJAK</strong><small>Traditional Selection</small></span>
              <i aria-hidden="true">♥</i>
            </header>
            <div>IMAGE</div>
          </article>
        </div>

        <Link className={styles.allProductsButton} to="/shop">
          전체 상품 보기
        </Link>
      </section>

      <section ref={eventsGridRef} className={styles.eventsGrid} aria-labelledby="events-grid-title">
        <div className={styles.eventsCopy}>
          <h2 id="events-grid-title">
            자작에서 만나는
            <br />
            작은 즐거움
          </h2>
          <Link className={styles.eventsButton} to="/events">
            전체 이벤트 보기
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
