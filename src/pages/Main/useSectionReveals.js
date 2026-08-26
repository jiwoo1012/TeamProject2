import { useLayoutEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import styles from './MainPage.module.scss'

const SECTION_REVEAL_START = 'top 72%'
const SECTION_TOGGLE_ACTIONS = 'play none none reverse'
const FEATURE_HEADER_CLASS = 'main-feature-header-transparent'
const EVENTS_HEADER_CLASS = 'main-events-header-transparent'
const MAKDONG_HEADER_CLASS = 'main-makdong-header-transparent'

gsap.registerPlugin(ScrollTrigger)

const useSectionReveals = ({
  aiIntroRef,
  featureSectionRef,
  featureCupRef,
  eventsGridRef,
  makdongSectionRef,
}) => {
  useLayoutEffect(() => {
    const aiSection = aiIntroRef.current
    const featureSection = featureSectionRef.current
    const startMoodCycle = () => aiSection.classList.add(styles.aiMoodReady)
    const showAiActions = () => aiSection.classList.add(styles.aiActionsReady)
    const resetMoodCycle = () => {
      aiSection.classList.remove(styles.aiMoodReady)
      aiSection.classList.remove(styles.aiActionsReady)
    }

    resetMoodCycle()

    gsap.set(
      [aiIntroRef.current, featureSectionRef.current]
        .flatMap((section) => [...section.querySelectorAll('*')]),
      { clearProps: 'opacity,visibility' },
    )

    const aiReveal = gsap.timeline({
      scrollTrigger: {
        trigger: aiIntroRef.current,
        start: SECTION_REVEAL_START,
        toggleActions: SECTION_TOGGLE_ACTIONS,
        onLeaveBack: resetMoodCycle,
      },
    })
      .from(`.${styles.moodHeading}`, { y: 36, duration: 0.6, ease: 'power2.out' })
      .fromTo(
        `.${styles.aiIntro} h2`,
        { autoAlpha: 0, y: 30, filter: 'blur(6px)' },
        {
          autoAlpha: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.8,
          ease: 'power2.out',
        },
        '-=0.18',
      )
      .call(startMoodCycle)
      .fromTo(
        `.${styles.recommendCard}`,
        {
          autoAlpha: 0,
          y: 90,
          scale: 0.92,
        },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.82,
          stagger: 0.16,
          ease: 'back.out(1.35)',
        },
        '-=0.12',
      )
      .call(showAiActions)
      .fromTo(
        `.${styles.aiButton}`,
        { autoAlpha: 0, y: 18 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.45,
          ease: 'power2.out',
        },
      )

    const featureHeading = featureSectionRef.current.querySelector(`.${styles.featureCopy} h2`)
    const featureDescription = featureSectionRef.current.querySelector(`.${styles.featureCopy} p`)
    const featureButton = featureSectionRef.current.querySelector(`.${styles.featureButton}`)
    const featureCup = featureCupRef.current
    const canFollowPointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const moveCupX = gsap.quickTo(featureCup, 'x', { duration: 0.32, ease: 'power3.out' })
    const moveCupY = gsap.quickTo(featureCup, 'y', { duration: 0.32, ease: 'power3.out' })
    const handleFeaturePointerMove = (event) => {
      if (!canFollowPointer) return
      const rect = featureSection.getBoundingClientRect()
      const cupRect = featureCup.getBoundingClientRect()
      const currentX = Number(gsap.getProperty(featureCup, 'x')) || 0
      const currentY = Number(gsap.getProperty(featureCup, 'y')) || 0
      const baseCenterX = cupRect.left + cupRect.width / 2 - currentX
      const baseCenterY = cupRect.top + cupRect.height / 2 - currentY
      const maxX = rect.width * 0.42
      const maxY = rect.height * 0.36

      moveCupX(gsap.utils.clamp(-maxX, maxX, event.clientX - baseCenterX))
      moveCupY(gsap.utils.clamp(-maxY, maxY, event.clientY - baseCenterY))
    }
    const resetFeatureCup = () => {
      moveCupX(0)
      moveCupY(0)
    }

    featureSection.addEventListener('pointermove', handleFeaturePointerMove)
    featureSection.addEventListener('pointerleave', resetFeatureCup)

    gsap.set([featureHeading, featureDescription, featureButton], {
      autoAlpha: 0,
      x: () => (window.innerWidth >= 768 ? -64 : -36),
    })

    const featureReveal = gsap.timeline({
      scrollTrigger: {
        trigger: featureSectionRef.current,
        start: 'top 82%',
        toggleActions: SECTION_TOGGLE_ACTIONS,
      },
      })
      .to(featureHeading, {
        autoAlpha: 1,
        x: 0,
        duration: 1.05,
        ease: 'power3.out',
      })
      .to(featureDescription, {
        autoAlpha: 1,
        x: 0,
        duration: 0.9,
        ease: 'power2.out',
      }, '-=0.58')
      .to(featureButton, {
        autoAlpha: 1,
        x: 0,
        duration: 0.55,
        ease: 'power2.out',
      }, '-=0.32')

    const featureHeaderTrigger = ScrollTrigger.create({
      trigger: featureSectionRef.current,
      start: 'top 72px',
      end: 'bottom 72px',
      onToggle: ({ isActive }) => {
        document.documentElement.classList.toggle(FEATURE_HEADER_CLASS, isActive)
      },
    })

    const makdongHeaderTrigger = ScrollTrigger.create({
      trigger: makdongSectionRef.current,
      start: 'top 72px',
      end: 'bottom 72px',
      onToggle: ({ isActive }) => {
        document.documentElement.classList.toggle(MAKDONG_HEADER_CLASS, isActive)
      },
    })

    const eventsHeaderTrigger = ScrollTrigger.create({
      trigger: eventsGridRef.current,
      start: 'top 72px',
      end: 'bottom 72px',
      onToggle: ({ isActive }) => {
        document.documentElement.classList.toggle(EVENTS_HEADER_CLASS, isActive)
      },
    })

    const makdongHeading = makdongSectionRef.current.querySelector(`.${styles.makdongCopy} h2`)
    const makdongDescription = makdongSectionRef.current.querySelector(`.${styles.makdongDescription}`)
    const makdongButton = makdongSectionRef.current.querySelector(`.${styles.makdongButton}`)

    gsap.set([makdongHeading, makdongDescription, makdongButton], {
      autoAlpha: 0,
      x: () => (window.innerWidth >= 768 ? -64 : -36),
    })

    const makdongReveal = gsap.timeline({
      scrollTrigger: {
        trigger: makdongSectionRef.current,
        start: 'top 82%',
        toggleActions: SECTION_TOGGLE_ACTIONS,
      },
    })
      .to(makdongHeading, {
        autoAlpha: 1,
        x: 0,
        duration: 1.05,
        ease: 'power3.out',
      })
      .to(makdongDescription, {
        autoAlpha: 1,
        x: 0,
        duration: 0.9,
        ease: 'power2.out',
      }, '-=0.55')
      .to(makdongButton, {
        autoAlpha: 1,
        x: 0,
        duration: 0.55,
        ease: 'power2.out',
      }, '-=0.25')

    const eventCards = gsap.utils.toArray(`.${styles.eventMock}`)
    const eventLabel = document.querySelector(`.${styles.eventsCopy} p`)
    const eventHeading = document.querySelector(`.${styles.eventsCopy} h2`)
    const eventButton = document.querySelector(`.${styles.eventsButton}`)
    const setEventCardsInitial = () => gsap.set(eventCards, {
      autoAlpha: 0,
      rotateY: -720,
      scale: 0.97,
      transformOrigin: 'center center',
      transformPerspective: 900,
    })
    const setEventCopyInitial = () => {
      gsap.set([eventLabel, eventHeading], { autoAlpha: 0, y: 22 })
      gsap.set(eventButton, { autoAlpha: 0, y: 16 })
    }

    setEventCardsInitial()
    setEventCopyInitial()

    const eventsReveal = gsap.timeline({ paused: true })
      .to([eventLabel, eventHeading], {
        autoAlpha: 1,
        y: 0,
        duration: 0.9,
        stagger: 0.32,
        ease: 'power2.out',
      })
      .to({}, { duration: 0.28 })
      .to(eventCards, {
        autoAlpha: 1,
        rotateY: 0,
        scale: 1,
        duration: 0.78,
        stagger: 0.13,
        ease: 'power2.out',
      })
      .to(eventButton, {
        autoAlpha: 1,
        y: 0,
        duration: 0.72,
        ease: 'power2.out',
      })

    const replayEventsReveal = () => {
      setEventCopyInitial()
      setEventCardsInitial()
      eventsReveal.restart(true)
    }
    window.addEventListener('main:events-reveal', replayEventsReveal)

    return () => {
      const timelines = [aiReveal, featureReveal, makdongReveal, eventsReveal]
      window.removeEventListener('main:events-reveal', replayEventsReveal)
      featureSection.removeEventListener('pointermove', handleFeaturePointerMove)
      featureSection.removeEventListener('pointerleave', resetFeatureCup)
      gsap.killTweensOf(featureCup)
      featureHeaderTrigger.kill()
      eventsHeaderTrigger.kill()
      makdongHeaderTrigger.kill()
      document.documentElement.classList.remove(FEATURE_HEADER_CLASS)
      document.documentElement.classList.remove(EVENTS_HEADER_CLASS)
      document.documentElement.classList.remove(MAKDONG_HEADER_CLASS)
      resetMoodCycle()
      timelines.forEach((timeline) => {
        timeline.scrollTrigger?.kill()
        timeline.kill()
      })
    }
  }, [aiIntroRef, eventsGridRef, featureCupRef, featureSectionRef, makdongSectionRef])
}

export default useSectionReveals
