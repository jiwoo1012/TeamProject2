import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import entranceClosed from '../../assets/images/main/01-entrance-closed.webp'
import entranceOpen from '../../assets/images/main/02-entrance-open.webp'
import hallwayFar from '../../assets/images/main/03-hallway-far.webp'
import livingroomWide from '../../assets/images/main/04-livingroom-wide.webp'
import livingroomTable from '../../assets/images/main/05-livingroom-table.webp'
import lightOff from '../../assets/images/main/06-livingroom-light-off.png'
import lightOn from '../../assets/images/main/07-livingroom-light-on.png'
import livingroomWindow from '../../assets/images/main/08-livingroom-window.png'
import makdongWindow from '../../assets/images/main/M-window-peek.png'
import styles from './JourneySection.module.scss'

gsap.registerPlugin(ScrollTrigger)

const scenes = [entranceClosed, entranceOpen, hallwayFar, livingroomWide, livingroomTable, lightOff]

const JourneySection = ({ onSkip }) => {
  const sectionRef = useRef(null)
  const sceneRefs = useRef([])
  const guideRef = useRef(null)
  const lightOnRef = useRef(null)
  const windowRef = useRef(null)
  const makdongRef = useRef(null)

  useEffect(() => {
    let scrollTween
    let isMoving = false
    let removeWheelHandler = () => {}
    const root = document.documentElement
    const scrollbarClass = 'main-journey-active'

    root.classList.add(scrollbarClass)
    root.classList.remove('main-header-visible')

    const context = gsap.context(() => {
      const sceneElements = sceneRefs.current
      gsap.set(sceneElements, { opacity: 0, scale: 1.06 })
      gsap.set(sceneElements[0], { opacity: 1, scale: 1 })
      gsap.set([lightOnRef.current, windowRef.current, makdongRef.current], { opacity: 0 })
      gsap.set(windowRef.current, { scale: 1.04 })
      gsap.set(makdongRef.current, { xPercent: -24, rotate: -2 })

      const endingTimeline = gsap.timeline({ paused: true })
        .to(lightOnRef.current, { opacity: 1, duration: 0.22 })
        .to(lightOnRef.current, { opacity: 0.15, duration: 0.16 })
        .to(lightOnRef.current, { opacity: 0.9, duration: 0.28 })
        .to(lightOnRef.current, { opacity: 0.28, duration: 0.14 })
        .to(lightOnRef.current, { opacity: 1, duration: 0.45 })
        .to({}, { duration: 0.25 })
        .to(sceneElements[4], { opacity: 1, scale: 1, duration: 0.65 }, 'table')
        .to([sceneElements[5], lightOnRef.current], { opacity: 0, duration: 0.65 }, 'table')
        .to({}, { duration: 0.45 })
        .to(windowRef.current, { opacity: 1, scale: 1, duration: 0.8 }, 'window')
        .to(sceneElements[4], { opacity: 0, duration: 0.8 }, 'window')
        .to(makdongRef.current, { opacity: 1, xPercent: 0, rotate: 0, duration: 0.85, ease: 'back.out(1.35)' }, '>-=0.15')
        .to({}, { duration: 0.8 })
        .to(sceneElements[4], { opacity: 1, scale: 1, duration: 0.8 }, 'return')
        .to([windowRef.current, makdongRef.current], { opacity: 0, duration: 0.8 }, 'return')

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
          invalidateOnRefresh: true,
          onEnter: () => root.classList.add(scrollbarClass),
          onLeave: () => {
            root.classList.remove(scrollbarClass)
            root.classList.add('main-header-visible')
            endingTimeline.restart()
          },
          onEnterBack: () => {
            root.classList.add(scrollbarClass)
            root.classList.remove('main-header-visible')
            endingTimeline.pause(0)
            gsap.set([lightOnRef.current, windowRef.current, makdongRef.current], { opacity: 0 })
          },
        },
      })

      timeline.to(guideRef.current, { opacity: 0, duration: 0.25 })
      for (let index = 1; index < sceneElements.length; index += 1) {
        timeline
          .to(sceneElements[index - 1], { opacity: 0, scale: 1.1, duration: 1, ease: 'none' })
          .to(sceneElements[index], { opacity: 1, scale: 1, duration: 1, ease: 'none' }, '-=1')
          .to({}, { duration: 0.35 })
      }

      const handleWheel = (event) => {
        const section = sectionRef.current
        const sectionStart = section.offsetTop
        const sectionEnd = sectionStart + section.offsetHeight - window.innerHeight
        const currentScroll = window.scrollY
        if (currentScroll < sectionStart - 2 || currentScroll > sectionEnd + 2) return

        const direction = Math.sign(event.deltaY)
        if (!direction) return
        if (isMoving) {
          event.preventDefault()
          return
        }

        const lastIndex = sceneElements.length - 1
        const progress = Math.min(1, Math.max(0, (currentScroll - sectionStart) / (sectionEnd - sectionStart)))
        const currentIndex = Math.round(progress * lastIndex)
        const targetIndex = Math.min(lastIndex, Math.max(0, currentIndex + direction))
        if (targetIndex === currentIndex) return

        event.preventDefault()
        isMoving = true
        const scrollState = { y: currentScroll }
        const targetScroll = sectionStart + (sectionEnd - sectionStart) * (targetIndex / lastIndex)
        scrollTween?.kill()
        scrollTween = gsap.to(scrollState, {
          y: targetScroll,
          duration: 0.9,
          ease: 'power2.inOut',
          onUpdate: () => window.scrollTo(0, scrollState.y),
          onComplete: () => { isMoving = false },
        })
      }

      window.addEventListener('wheel', handleWheel, { passive: false })
      removeWheelHandler = () => window.removeEventListener('wheel', handleWheel)
    }, sectionRef)

    return () => {
      removeWheelHandler()
      scrollTween?.kill()
      context.revert()
      root.classList.remove(scrollbarClass)
    }
  }, [])

  return (
    <section ref={sectionRef} className={styles.journey} aria-label="자작의 공간으로 들어가는 스크롤 이야기">
      <div className={styles.stage}>
        {scenes.map((scene, index) => (
          <img key={scene} ref={(element) => { sceneRefs.current[index] = element }} className={styles.scene} src={scene} alt="" aria-hidden="true" />
        ))}
        <img ref={lightOnRef} className={`${styles.scene} ${styles.lightOn}`} src={lightOn} alt="" aria-hidden="true" />
        <img ref={windowRef} className={`${styles.scene} ${styles.windowScene}`} src={livingroomWindow} alt="" aria-hidden="true" />
        <img ref={makdongRef} className={styles.makdong} src={makdongWindow} alt="창문에서 고개를 내민 막동이" />
        <div className={styles.shade} aria-hidden="true" />

        <button className={styles.skipButton} type="button" onClick={onSkip}>
          <span>인트로 건너뛰기</span><span className={styles.skipArrow} aria-hidden="true" />
        </button>

        <div ref={guideRef} className={styles.scrollGuide}>
          <span>자작의 공간으로 들어가 볼까요?</span>
          <span className={styles.scrollLine} aria-hidden="true" />
          <small>SCROLL</small>
        </div>
      </div>
    </section>
  )
}

export default JourneySection
