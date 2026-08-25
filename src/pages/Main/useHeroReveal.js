import { useLayoutEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const HEADER_VISIBLE_CLASS = 'main-header-visible'
const HERO_REVEAL_START = 'top top-=100'
const HERO_IMAGE_DURATION = 0.72

const useHeroReveal = ({
  mainContentRef,
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

    gsap.set(heroImageRef.current, { clearProps: 'opacity,visibility,transform' })
    gsap.set(heroPhotoRef.current, { clearProps: 'transform' })
    gsap.set([leftHeroTitleRef.current, rightHeroTitleRef.current], {
      autoAlpha: 1,
      y: 0,
    })

    const headerTrigger = ScrollTrigger.create({
      trigger: mainContentRef.current,
      start: 'top top',
      onEnter: () => root.classList.add(HEADER_VISIBLE_CLASS),
      onEnterBack: () => root.classList.add(HEADER_VISIBLE_CLASS),
    })

    const timeline = gsap.timeline({
      onComplete: () => { canMovePastHeroRef.current = true },
      onReverseComplete: () => { canMovePastHeroRef.current = false },
      scrollTrigger: {
        trigger: mainContentRef.current,
        start: HERO_REVEAL_START,
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

    heroRevealRef.current = timeline

    return () => {
      headerTrigger.kill()
      timeline.scrollTrigger?.kill()
      timeline.kill()
      heroRevealRef.current = null
      root.classList.remove(HEADER_VISIBLE_CLASS)
    }
  }, [
    canMovePastHeroRef,
    heroCaptionRef,
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
