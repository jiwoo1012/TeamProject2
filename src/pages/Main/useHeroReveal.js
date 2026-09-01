import { useLayoutEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const HEADER_VISIBLE_CLASS = 'main-header-visible'
const HERO_COVER_EXIT_START = 'top top-=100'
const HERO_IMAGE_DURATION = 0.72
const HERO_SUN_PATH_DURATION = 4.5
const HERO_SUN_PATH_MIDPOINT = HERO_SUN_PATH_DURATION / 2
const HERO_SUN_COLOR = '#e9ae32'

const useHeroReveal = ({
  mainContentRef,
  heroCoverRef,
  heroImageRef,
  heroPhotoRef,
  heroSunsetPhotoRef,
  heroSunRef,
  leftHeroTitleRef,
  rightHeroTitleRef,
  heroCaptionRef,
  shopButtonRef,
  canMovePastHeroRef,
  heroRevealRef,
  heroSunPlayRef,
  heroSunResetRef,
  isHeroSunCompleteRef,
}) => {
  useLayoutEffect(() => {
    const root = document.documentElement
    const heroScrollGuide = heroCoverRef.current?.querySelector('div')
    const isMobile = window.matchMedia('(max-width: 767px)').matches

    gsap.set(heroCoverRef.current, { autoAlpha: 1, scale: 1 })
    gsap.set(heroImageRef.current, { clearProps: 'transform', autoAlpha: 1 })
    gsap.set(heroPhotoRef.current, { clearProps: 'transform' })
    gsap.set(heroSunsetPhotoRef.current, { autoAlpha: 0 })
    const sunProgress = { angle: 0 }
    let sunPathMetrics = null
    const updateSunPathMetrics = () => {
      const imageGroup = heroImageRef.current
      const frame = imageGroup?.querySelector('figure')
      if (!imageGroup || !frame || window.innerWidth < 1200) {
        sunPathMetrics = null
        return
      }

      const groupStyles = window.getComputedStyle(imageGroup)
      const frameStyles = window.getComputedStyle(frame)
      const outlineGap = Number.parseFloat(groupStyles.getPropertyValue('--hero-arch-outline-gap'))
      const outlineStroke = Number.parseFloat(groupStyles.getPropertyValue('--hero-arch-stroke'))
      const radiusValues = frameStyles.borderTopLeftRadius.split(' ')
      const archRadius = Number.parseFloat(radiusValues[1] || radiusValues[0])
      const groupWidth = imageGroup.offsetWidth

      sunPathMetrics = {
        frameOffset: Number.parseFloat(groupStyles.getPropertyValue('--hero-frame-offset')),
        outlineStroke,
        outlineTrim: Number.parseFloat(groupStyles.getPropertyValue('--hero-arch-trim')),
        archRadius,
        groupHalfWidth: groupWidth / 2,
        radiusX: groupWidth / 2 + outlineGap + outlineStroke / 2,
        radiusY: archRadius + outlineGap + outlineStroke / 2,
      }
    }
    const placeSunOnArch = (angle) => {
      const sun = heroSunRef.current
      if (!sun || !sunPathMetrics) return

      const {
        frameOffset,
        outlineStroke,
        outlineTrim,
        archRadius,
        groupHalfWidth,
        radiusX,
        radiusY,
      } = sunPathMetrics
      const trimAngle = Math.acos(1 - (outlineTrim - outlineStroke / 2) / radiusX)
      const pathAngle = Math.PI - trimAngle - (angle / Math.PI) * (Math.PI - trimAngle * 2)
      const x = groupHalfWidth + radiusX * Math.cos(pathAngle)
      const y = frameOffset + archRadius - radiusY * Math.sin(pathAngle)

      gsap.set(sun, {
        x,
        y,
        rotation: 0,
      })
    }

    updateSunPathMetrics()
    placeSunOnArch(sunProgress.angle)
    const originalRightTitleColor = window.getComputedStyle(rightHeroTitleRef.current).color
    const sunTimeline = gsap.timeline({
      paused: true,
      onComplete: () => {
        isHeroSunCompleteRef.current = true
      },
      onReverseComplete: () => {
        isHeroSunCompleteRef.current = false
      },
    })
      .set(heroSunRef.current, { attr: { 'data-phase': 'sun' } })
      .set(rightHeroTitleRef.current, { color: HERO_SUN_COLOR })
      .to(sunProgress, {
        angle: Math.PI,
        duration: HERO_SUN_PATH_DURATION,
        ease: 'sine.inOut',
        onUpdate: () => placeSunOnArch(sunProgress.angle),
      })
      .to(heroSunsetPhotoRef.current, {
        autoAlpha: 1,
        duration: HERO_SUN_PATH_DURATION,
        ease: 'none',
      }, '<')
      .set(heroSunRef.current, { attr: { 'data-phase': 'moon' } }, HERO_SUN_PATH_MIDPOINT)
      .to(rightHeroTitleRef.current, {
        color: originalRightTitleColor,
        duration: 0.7,
        ease: 'power1.inOut',
      }, HERO_SUN_PATH_MIDPOINT)

    heroSunPlayRef.current = () => {
      if (sunTimeline.isActive() || isHeroSunCompleteRef.current) return
      updateSunPathMetrics()
      placeSunOnArch(sunProgress.angle)
      sunTimeline.restart()
    }
    heroSunResetRef.current = () => {
      if (!isHeroSunCompleteRef.current || sunTimeline.isActive()) return
      sunTimeline.reverse()
    }

    const sunResetTrigger = ScrollTrigger.create({
      trigger: heroImageRef.current,
      start: 'bottom top',
      onEnter: () => heroSunResetRef.current?.(),
    })

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

    const mobileScrollGuideTrigger = isMobile
      ? ScrollTrigger.create({
        trigger: mainContentRef.current,
        start: 'top top-=8',
        onEnter: () => gsap.to(heroScrollGuide, {
          autoAlpha: 0,
          duration: 0.14,
          ease: 'power1.out',
          overwrite: true,
        }),
        onLeaveBack: () => gsap.to(heroScrollGuide, {
          autoAlpha: 1,
          duration: 0.12,
          ease: 'power1.out',
          overwrite: true,
        }),
      })
      : null

    const coverTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: mainContentRef.current,
        start: HERO_COVER_EXIT_START,
        toggleActions: 'play none none reverse',
        invalidateOnRefresh: true,
        onRefresh: () => {
          updateSunPathMetrics()
          placeSunOnArch(sunProgress.angle)
        },
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
      // 커버의 크기와 위치가 아치 프레임에 완전히 맞은 뒤 실제 히어로를 교체한다.
      // 축소 도중 교차 노출하면 두 이미지의 object-fit 크롭이 달라 순간적으로 어긋나 보인다.
      .addLabel('heroReady')
      .set(rightHeroTitleRef.current, { color: HERO_SUN_COLOR }, 'heroReady')
      .to(
        heroImageRef.current.parentElement,
        { autoAlpha: 1, duration: 0.16, ease: 'none' },
        'heroReady',
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
        invalidateOnRefresh: true,
        onRefresh: () => {
          updateSunPathMetrics()
          placeSunOnArch(sunProgress.angle)
        },
      },
    })
      .to(heroImageRef.current, {
        yPercent: () => {
          if (window.innerWidth <= 767) return 0
          return window.innerWidth >= 1200 ? -52 : -48
        },
        duration: HERO_IMAGE_DURATION,
        ease: 'power2.inOut',
      })
      .to(
        [leftHeroTitleRef.current, rightHeroTitleRef.current],
        {
          autoAlpha: () => (window.innerWidth <= 767 ? 1 : 0),
          y: () => (window.innerWidth <= 767 ? 0 : 12),
          duration: 0.3,
          ease: 'power1.out',
        },
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
      .addLabel('shopReveal', '-=0.28')
      .fromTo(
        shopButtonRef.current,
        { autoAlpha: 0, y: 18, scale: 0.96 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.45, ease: 'power2.out' },
        'shopReveal',
      )

    if (isMobile) {
      timeline.to(heroSunsetPhotoRef.current, {
        autoAlpha: 1,
        duration: 0.7,
        ease: 'power1.inOut',
      }, 'shopReveal')
    }

    heroRevealRef.current = timeline

    return () => {
      headerTrigger.kill()
      mobileScrollGuideTrigger?.kill()
      gsap.killTweensOf(heroScrollGuide)
      gsap.set(heroScrollGuide, { clearProps: 'opacity,visibility' })
      sunResetTrigger.kill()
      coverTimeline.scrollTrigger?.kill()
      coverTimeline.kill()
      sunTimeline.kill()
      timeline.scrollTrigger?.kill()
      timeline.kill()
      heroRevealRef.current = null
      heroSunPlayRef.current = null
      heroSunResetRef.current = null
      isHeroSunCompleteRef.current = false
      gsap.set(rightHeroTitleRef.current, { clearProps: 'color' })
      gsap.set(heroSunsetPhotoRef.current, { clearProps: 'opacity,visibility' })
      root.classList.remove(HEADER_VISIBLE_CLASS)
    }
  }, [
    canMovePastHeroRef,
    heroCaptionRef,
    heroCoverRef,
    heroImageRef,
    heroPhotoRef,
    heroSunsetPhotoRef,
    heroSunRef,
    heroRevealRef,
    heroSunPlayRef,
    heroSunResetRef,
    isHeroSunCompleteRef,
    leftHeroTitleRef,
    mainContentRef,
    rightHeroTitleRef,
    shopButtonRef,
  ])
}

export default useHeroReveal
