import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'

const EDGE_TOLERANCE = 4
const FALLBACK_HEADER_HEIGHT = 80
const HEADER_SELECTOR = 'body > #root > div > header'
const DESKTOP_WHEEL_QUERY = '(min-width: 768px) and (hover: hover) and (pointer: fine)'
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

const useSectionWheelSnap = (stops, options = {}) => {
  const { headerSelector = HEADER_SELECTOR, fallbackHeaderHeight = FALLBACK_HEADER_HEIGHT } = options
  const stopsRef = useRef(stops)
  stopsRef.current = stops

  useLayoutEffect(() => {
    const root = document.documentElement
    const desktopMedia = window.matchMedia(DESKTOP_WHEEL_QUERY)
    const reducedMotionMedia = window.matchMedia(REDUCED_MOTION_QUERY)
    let scrollTween
    let unlockCall
    let previousScrollBehavior = ''
    let isListening = false

    const getHeaderHeight = () => {
      const header = document.querySelector(headerSelector)
      return header?.getBoundingClientRect().height ?? fallbackHeaderHeight
    }

    const stopScrolling = () => {
      scrollTween?.kill()
      unlockCall?.kill()
      scrollTween = null
      unlockCall = null
      root.style.scrollBehavior = previousScrollBehavior
    }

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
          unlockCall = gsap.delayedCall(0.18, () => {
            scrollTween = null
            unlockCall = null
          })
        },
      })
    }

    const handleWheel = (event) => {
      if (event.defaultPrevented) return

      if (scrollTween) {
        event.preventDefault()
        return
      }

      const direction = Math.sign(event.deltaY)
      if (!direction) return

      const headerHeight = getHeaderHeight()
      const resolved = stopsRef.current.map(({ ref, endRef }) => {
        const element = ref.current
        if (!element) return null

        const top = Math.max(0, element.offsetTop - headerHeight)
        const endElement = endRef?.current
        const end = endElement
          ? Math.max(top, endElement.offsetTop + endElement.offsetHeight - window.innerHeight)
          : top

        return { top, end }
      })

      if (resolved.some((stop) => !stop)) return

      const currentScroll = window.scrollY
      let targetTop

      for (let index = 0; index < resolved.length; index += 1) {
        const stop = resolved[index]

        if (currentScroll < stop.top - EDGE_TOLERANCE) {
          if (index === 0) return
          continue
        }

        if (currentScroll <= stop.end + EDGE_TOLERANCE) {
          const previous = resolved[index - 1]
          const next = resolved[index + 1]

          if (direction < 0 && currentScroll <= stop.top + EDGE_TOLERANCE && previous) {
            targetTop = previous.top
            break
          }

          if (direction > 0 && currentScroll >= stop.end - EDGE_TOLERANCE && next) {
            targetTop = next.top
            break
          }

          return
        }
      }

      if (targetTop === undefined) return

      event.preventDefault()
      moveTo(targetTop)
    }

    const syncWheelListener = () => {
      const shouldListen = desktopMedia.matches && !reducedMotionMedia.matches

      if (shouldListen && !isListening) {
        window.addEventListener('wheel', handleWheel, { passive: false })
        isListening = true
      } else if (!shouldListen && isListening) {
        window.removeEventListener('wheel', handleWheel)
        isListening = false
        stopScrolling()
      }
    }

    syncWheelListener()
    desktopMedia.addEventListener('change', syncWheelListener)
    reducedMotionMedia.addEventListener('change', syncWheelListener)

    return () => {
      desktopMedia.removeEventListener('change', syncWheelListener)
      reducedMotionMedia.removeEventListener('change', syncWheelListener)
      if (isListening) window.removeEventListener('wheel', handleWheel)
      stopScrolling()
    }
  }, [fallbackHeaderHeight, headerSelector])
}

export default useSectionWheelSnap
