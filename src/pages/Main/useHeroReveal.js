import { useLayoutEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const HEADER_VISIBLE_CLASS = 'main-header-visible'
const HERO_COVER_EXIT_START = 'top top-=100'
const HERO_IMAGE_DURATION = 0.72

const useHeroReveal = ({
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
}) => {
  useLayoutEffect(() => {
    const root = document.documentElement

    gsap.set(heroCoverRef.current, { autoAlpha: 1, scale: 1 })
    gsap.set(heroImageRef.current, { clearProps: 'transform', autoAlpha: 1 })
    gsap.set(heroPhotoRef.current, { clearProps: 'transform' })
    gsap.set(heroImageRef.current.parentElement, { autoAlpha: 0 })
    gsap.set([leftHeroTitleRef.current, rightHeroTitleRef.current], {
      autoAlpha: 1,
      y: 0,
    })

    const headerTrigger = ScrollTrigger.create({
      trigger: mainContentRef.current,
      start: () => `top top-=${window.innerHeight - 2}`,
      onEnter: () => root.classList.add(HEADER_VISIBLE_CLASS),
      onEnterBack: () => root.classList.add(HEADER_VISIBLE_CLASS),
      onLeaveBack: () => root.classList.remove(HEADER_VISIBLE_CLASS),
      invalidateOnRefresh: true,
    })

    const coverTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: mainContentRef.current,
        start: HERO_COVER_EXIT_START,
        toggleActions: 'play none none reverse',
        invalidateOnRefresh: true,
      },
    })
      .to(heroCoverRef.current, {
        x: () => {
          const coverRect = heroCoverRef.current.getBoundingClientRect()
          const frameRect = heroImageRef.current.querySelector('figure').getBoundingClientRect()
          return frameRect.left + frameRect.width / 2 - (coverRect.left + coverRect.width / 2)
        },
        y: () => {
          const coverRect = heroCoverRef.current.getBoundingClientRect()
          const frameRect = heroImageRef.current.querySelector('figure').getBoundingClientRect()
          return frameRect.top - coverRect.top
        },
        width: () => heroImageRef.current.querySelector('figure').getBoundingClientRect().width,
        height: () => heroImageRef.current.querySelector('figure').getBoundingClientRect().height,
        borderRadius: () => {
          const frame = heroImageRef.current.querySelector('figure')
          return window.getComputedStyle(frame).borderRadius
        },
        duration: 0.92,
        ease: 'power3.inOut',
      })
      .to(
        heroImageRef.current.parentElement,
        { autoAlpha: 1, duration: 0.16, ease: 'none' },
        '-=0.16',
      )
      .to(
        heroCoverRef.current,
        { autoAlpha: 0, duration: 0.16, ease: 'none' },
        '<',
      )

    const timeline = gsap.timeline({
      onComplete: () => { canMovePastHeroRef.current = true },
      onReverseComplete: () => { canMovePastHeroRef.current = false },
      scrollTrigger: {
        trigger: mainContentRef.current,
        start: () => `top top-=${window.innerHeight + 100}`,
        toggleActions: 'play none none reverse',
      },
    })
      .to(heroImageRef.current, {
        yPercent: () => (window.innerWidth >= 1200 ? -52 : -48),
        duration: HERO_IMAGE_DURATION,
        ease: 'power2.inOut',
      })
      .to(
        [leftHeroTitleRef.current, rightHeroTitleRef.current],
        { autoAlpha: 0, y: 12, duration: 0.3, ease: 'power1.out' },
        0,
      )
      .fromTo(
        heroCaptionRef.current,
        { autoAlpha: 0, y: 42, filter: 'blur(7px)' },
        {
          autoAlpha: 1,
          y: 0,
          filter: 'blur(0px)',
          duration: 0.9,
          ease: 'power2.out',
        },
        '-=0.12',
      )
      .fromTo(
        shopButtonRef.current,
        { autoAlpha: 0, y: 18, scale: 0.96 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: 'power2.out' },
        '-=0.28',
      )

    heroRevealRef.current = timeline

    return () => {
      headerTrigger.kill()
      coverTimeline.scrollTrigger?.kill()
      coverTimeline.kill()
      timeline.scrollTrigger?.kill()
      timeline.kill()
      heroRevealRef.current = null
      root.classList.remove(HEADER_VISIBLE_CLASS)
    }
  }, [
    canMovePastHeroRef,
    heroCaptionRef,
    heroCoverRef,
    heroImageRef,
    heroPhotoRef,
    heroRevealRef,
    leftHeroTitleRef,
    mainContentRef,
    rightHeroTitleRef,
    shopButtonRef,
  ])
}

export default useHeroReveal
