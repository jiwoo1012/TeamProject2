import { useLayoutEffect } from 'react'
import { gsap } from 'gsap'

const useMainSectionWheel = ({
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
}) => {
  useLayoutEffect(() => {
    const isDesktopStepMode = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    if (!isDesktopStepMode) return undefined

    const root = document.documentElement
    let scrollTween
    let previousScrollBehavior = ''

    const handleSectionWheel = (event) => {
      if (bestSellerTransitionRef.current) {
        event.preventDefault()
        return
      }

      if (event.defaultPrevented) return

      const mainContent = mainContentRef.current
      const sections = [
        aiIntroRef.current,
        featureSectionRef.current,
        bestSellerSectionRef.current,
        eventsGridRef.current,
        makdongSectionRef.current,
      ]

      if (!mainContent || sections.some((section) => !section)) return

      if (scrollTween) {
        event.preventDefault()
        return
      }

      const direction = Math.sign(event.deltaY)
      if (!direction) return

      const currentScroll = window.scrollY
      const mainTop = mainContent.offsetTop
      const firstSectionTop = aiIntroRef.current.offsetTop
      const heroEnterStop = mainTop
      const heroSunStageStop = Math.min(mainTop + window.innerHeight, firstSectionTop - 2)
      const heroExitStop = Math.min(mainTop + window.innerHeight * 2, firstSectionTop - 2)
      const heroStops = [heroEnterStop, heroSunStageStop, heroExitStop]
      const sectionTops = sections.map((section) => section.offsetTop)
      const bestSeller = bestSellerSectionRef.current
      const bestSellerEnd = bestSeller.offsetTop + bestSeller.offsetHeight - window.innerHeight
      const hasBestSellerSteps = bestSellerEnd > bestSeller.offsetTop + 2
      let targetTop

      const isAtSunStage = Math.abs(currentScroll - heroSunStageStop) <= 2
      if (isAtSunStage && direction < 0 && isHeroSunCompleteRef.current) {
        event.preventDefault()
        heroSunResetRef.current?.()
        return
      }

      if (isAtSunStage && direction > 0) {
        event.preventDefault()

        if (!isHeroSunCompleteRef.current) {
          heroSunPlayRef.current?.()
          return
        }

        targetTop = firstSectionTop
      }

      if (hasBestSellerSteps && (
        currentScroll > bestSeller.offsetTop + 2 &&
        currentScroll < bestSellerEnd - 2
      )) return
      if (
        hasBestSellerSteps &&
        Math.abs(currentScroll - bestSeller.offsetTop) <= 2 &&
        direction > 0
      ) return
      if (hasBestSellerSteps && Math.abs(currentScroll - bestSellerEnd) <= 2) return

      if (targetTop === undefined) {
        if (currentScroll < firstSectionTop - 2) {
          if (currentScroll < mainTop) return

          const currentHeroIndex = heroStops.reduce(
            (closestIndex, top, index) => (
              Math.abs(top - currentScroll) < Math.abs(heroStops[closestIndex] - currentScroll)
                ? index
                : closestIndex
            ),
            0,
          )
          const targetHeroIndex = currentHeroIndex + direction

          if (targetHeroIndex < 0) return
          if (targetHeroIndex >= heroStops.length) {
            if (!canMovePastHeroRef.current) {
              event.preventDefault()
              return
            }
            targetTop = firstSectionTop
          } else {
            targetTop = heroStops[targetHeroIndex]
          }
        } else {
          const currentIndex = sectionTops.reduce(
            (closestIndex, top, index) => (
              Math.abs(top - currentScroll) <
              Math.abs(sectionTops[closestIndex] - currentScroll)
                ? index
                : closestIndex
            ),
            0,
          )
          const targetIndex = currentIndex + direction

          if (targetIndex < 0) {
            targetTop = heroExitStop
          } else if (targetIndex >= sectionTops.length) {
            return
          } else {
            const targetSection = sections[targetIndex]
            targetTop = targetSection === bestSeller && direction < 0
              ? bestSellerEnd
              : sectionTops[targetIndex]
          }
        }
      }

      event.preventDefault()
      previousScrollBehavior = root.style.scrollBehavior
      root.style.scrollBehavior = 'auto'

      const scrollState = { y: currentScroll }
      scrollTween = gsap.to(scrollState, {
        y: targetTop,
        duration: 0.95,
        ease: 'power2.inOut',
        onUpdate: () => window.scrollTo(0, scrollState.y),
        onComplete: () => {
          root.style.scrollBehavior = previousScrollBehavior
          gsap.delayedCall(0.22, () => {
            scrollTween = null
          })
        },
      })
    }

    window.addEventListener('wheel', handleSectionWheel, { passive: false })

    return () => {
      window.removeEventListener('wheel', handleSectionWheel)
      scrollTween?.kill()
      root.style.scrollBehavior = previousScrollBehavior
    }
  }, [
    aiIntroRef,
    bestSellerSectionRef,
    bestSellerTransitionRef,
    canMovePastHeroRef,
    eventsGridRef,
    featureSectionRef,
    heroSunPlayRef,
    heroSunResetRef,
    isHeroSunCompleteRef,
    mainContentRef,
    makdongSectionRef,
  ])
}

export default useMainSectionWheel
