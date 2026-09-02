import { useLayoutEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const LOGO_FADE_IN_DURATION = 0.5
const LOGO_RESET_HOLD_DURATION = 1.6
const LOGO_FADE_OUT_DURATION = 0.85

const useLogoScrollReset = ({
  mainContentRef,
  transitionRef,
  canMovePastHeroRef,
  heroRevealRef,
  resetTargetRef,
}) => {
  useLayoutEffect(() => {
    const root = document.documentElement
    gsap.set(transitionRef.current, { autoAlpha: 0 })

    const handleLogoClick = (event) => {
      const logoLink = event.target.closest('header a[href="/"]')
      if (!logoLink || !mainContentRef.current) return

      event.preventDefault()
      const targetTop = (resetTargetRef?.current || mainContentRef.current).offsetTop
      if (Math.abs(window.scrollY - targetTop) < 2) return

      const transition = transitionRef.current
      gsap.killTweensOf(transition)
      gsap.timeline()
        .to(transition, {
          autoAlpha: 1,
          duration: LOGO_FADE_IN_DURATION,
          ease: 'power2.inOut',
        })
        .call(() => {
          const previousBehavior = root.style.scrollBehavior
          root.style.scrollBehavior = 'auto'
          window.scrollTo(0, targetTop)
          ScrollTrigger.update()
          heroRevealRef.current?.pause(0)
          canMovePastHeroRef.current = false
          root.style.scrollBehavior = previousBehavior
        })
        .to({}, { duration: LOGO_RESET_HOLD_DURATION })
        .call(() => {
          window.scrollTo(0, targetTop)
          ScrollTrigger.update()
        })
        .to(transition, {
          autoAlpha: 0,
          duration: LOGO_FADE_OUT_DURATION,
          ease: 'power2.inOut',
        })
    }

    document.addEventListener('click', handleLogoClick)
    return () => document.removeEventListener('click', handleLogoClick)
  }, [canMovePastHeroRef, heroRevealRef, mainContentRef, resetTargetRef, transitionRef])
}

export default useLogoScrollReset
