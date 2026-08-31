import { useLayoutEffect } from 'react'
import { gsap } from 'gsap'

const EDGE_TOLERANCE = 4
const DESKTOP_HEADER_HEIGHT = 80

const useMakdongSectionWheel = ({ guideRef, storyRef, outroRef }) => {
  useLayoutEffect(() => {
    const isDesktopWheel = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    if (!isDesktopWheel) return undefined

    const root = document.documentElement
    let scrollTween
    let previousScrollBehavior = ''

    const moveTo = (targetTop) => {
      previousScrollBehavior = root.style.scrollBehavior
      root.style.scrollBehavior = 'auto'

      const scrollState = { y: window.scrollY }
      scrollTween = gsap.to(scrollState, {
        y: targetTop,
        duration: 0.9,
        ease: 'power2.inOut',
        onUpdate: () => window.scrollTo(0, scrollState.y),
        onComplete: () => {
          root.style.scrollBehavior = previousScrollBehavior
          gsap.delayedCall(0.18, () => {
            scrollTween = null
          })
        },
      })
    }

    const handleWheel = (event) => {
      if (event.defaultPrevented) return

      const guide = guideRef.current
      const story = storyRef.current
      const outro = outroRef.current
      if (!guide || !story || !outro) return

      if (scrollTween) {
        event.preventDefault()
        return
      }

      const direction = Math.sign(event.deltaY)
      if (!direction) return

      const currentScroll = window.scrollY
      const guideTop = Math.max(0, guide.offsetTop - DESKTOP_HEADER_HEIGHT)
      const storyTop = Math.max(0, story.offsetTop - DESKTOP_HEADER_HEIGHT)
      const storyEnd = Math.max(
        storyTop,
        story.offsetTop + story.offsetHeight - window.innerHeight,
      )
      const outroTop = Math.max(0, outro.offsetTop - DESKTOP_HEADER_HEIGHT)
      let targetTop

      // 첫 섹션과 첫 섹션에서 두 번째 섹션으로 들어오는 스크롤은 자연스럽게 둔다.
      if (currentScroll < guideTop - EDGE_TOLERANCE) return

      if (currentScroll < storyTop - EDGE_TOLERANCE) {
        if (direction < 0) return
        targetTop = storyTop
      } else if (currentScroll <= storyEnd + EDGE_TOLERANCE) {
        if (direction < 0 && currentScroll <= storyTop + EDGE_TOLERANCE) {
          targetTop = guideTop
        } else if (direction > 0 && currentScroll >= storyEnd - EDGE_TOLERANCE) {
          targetTop = outroTop
        } else {
          return
        }
      } else if (
        direction < 0 &&
        Math.abs(currentScroll - outroTop) <= EDGE_TOLERANCE
      ) {
        targetTop = storyEnd
      } else {
        return
      }

      event.preventDefault()
      moveTo(targetTop)
    }

    window.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      window.removeEventListener('wheel', handleWheel)
      scrollTween?.kill()
      root.style.scrollBehavior = previousScrollBehavior
    }
  }, [guideRef, outroRef, storyRef])
}

export default useMakdongSectionWheel
