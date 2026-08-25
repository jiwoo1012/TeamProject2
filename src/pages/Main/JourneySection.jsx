import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import entranceClosed from '../../assets/images/main/01-entrance-closed.webp'
import entranceOpen from '../../assets/images/main/02-entrance-open.webp'
import keypadHand from '../../assets/images/main/entrance-keypad-hand.png'
import doorHandleHand from '../../assets/images/main/entrance-door-handle-hand.png'
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
  const handRef = useRef(null)
  const handleHandRef = useRef(null)
  const bellRef = useRef(null)
  const lightOnRef = useRef(null)
  const windowRef = useRef(null)
  const makdongRef = useRef(null)

  useLayoutEffect(() => {
    let scrollTween
    let isMoving = false
    let removeWheelHandler = () => {}
    let removePointerHandlers = () => {}
    const root = document.documentElement
    const scrollbarClass = 'main-journey-active'
    const stage = sectionRef.current?.querySelector(`.${styles.stage}`)

    root.classList.add(scrollbarClass)
    root.classList.remove('main-header-visible')

    const context = gsap.context(() => {
      const sceneElements = sceneRefs.current
      const handElements = [handRef.current, handleHandRef.current]
      gsap.set(sceneElements, { opacity: 0, scale: 1.06 })
      gsap.set(sceneElements[0], { opacity: 1, scale: 1 })
      gsap.set(handRef.current, { autoAlpha: 0, xPercent: -7, yPercent: -8 })
      gsap.set(handleHandRef.current, { autoAlpha: 0, xPercent: -18, yPercent: -20 })
      gsap.set(bellRef.current, { autoAlpha: 1 })
      gsap.set([lightOnRef.current, windowRef.current, makdongRef.current], { opacity: 0 })
      gsap.set(windowRef.current, { scale: 1.04 })
      gsap.set(makdongRef.current, { xPercent: -24, rotate: -2 })
      stage?.classList.add(styles.cursorHidden)

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
          onUpdate: ({ progress }) => {
            stage?.classList.toggle(styles.cursorHidden, progress <= 0.04)
            gsap.set(bellRef.current, { autoAlpha: progress <= 0.04 ? 1 : 0 })
            if (progress > 0.04) gsap.to(handElements, { autoAlpha: 0, duration: 0.16, overwrite: 'auto' })
          },
          onEnter: () => root.classList.add(scrollbarClass),
          onLeave: () => {
            stage?.classList.remove(styles.cursorHidden)
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

      const canTrackPointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
      if (stage && canTrackPointer) {
        const moveHandX = gsap.quickTo(handRef.current, 'x', { duration: 0.12, ease: 'power2.out' })
        const moveHandY = gsap.quickTo(handRef.current, 'y', { duration: 0.12, ease: 'power2.out' })
        const moveHandleHandX = gsap.quickTo(handleHandRef.current, 'x', { duration: 0.12, ease: 'power2.out' })
        const moveHandleHandY = gsap.quickTo(handleHandRef.current, 'y', { duration: 0.12, ease: 'power2.out' })
        let isHandleMode = null

        const isFirstScene = () => {
          const sectionStart = sectionRef.current.offsetTop
          const sectionEnd = sectionStart + sectionRef.current.offsetHeight - window.innerHeight
          const progress = Math.min(1, Math.max(0, (window.scrollY - sectionStart) / (sectionEnd - sectionStart)))
          return progress <= 0.04
        }

        const handlePointerMove = (event) => {
          moveHandX(event.clientX)
          moveHandY(event.clientY)
          moveHandleHandX(event.clientX)
          moveHandleHandY(event.clientY)
          if (isFirstScene()) {
            const pointerX = event.clientX / window.innerWidth
            const pointerY = event.clientY / window.innerHeight
            const isOverDoorHandle = pointerX >= 0.56 && pointerX <= 0.77
              && pointerY >= 0.61 && pointerY <= 0.89

            const activeHand = isOverDoorHandle ? handleHandRef.current : handRef.current
            if (isHandleMode !== isOverDoorHandle || Number(gsap.getProperty(activeHand, 'opacity')) < 0.5) {
              isHandleMode = isOverDoorHandle
              gsap.to(handRef.current, {
                autoAlpha: isOverDoorHandle ? 0 : 1,
                duration: 0.2,
                overwrite: 'auto',
              })
              gsap.to(handleHandRef.current, {
                autoAlpha: isOverDoorHandle ? 1 : 0,
                duration: 0.2,
                overwrite: 'auto',
              })
            }
          }
        }

        stage.addEventListener('pointermove', handlePointerMove)
        removePointerHandlers = () => {
          stage.removeEventListener('pointermove', handlePointerMove)
        }
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
      if (targetIndex > 0) gsap.to(handElements, { autoAlpha: 0, duration: 0.12, overwrite: 'auto' })
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
      removePointerHandlers()
      scrollTween?.kill()
      stage?.classList.remove(styles.cursorHidden)
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
        <img ref={handRef} className={styles.keypadHand} src={keypadHand} alt="" aria-hidden="true" />
        <img ref={handleHandRef} className={`${styles.keypadHand} ${styles.doorHandleHand}`} src={doorHandleHand} alt="" aria-hidden="true" />
        <span ref={bellRef} className={styles.doorBell} aria-hidden="true" />
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
