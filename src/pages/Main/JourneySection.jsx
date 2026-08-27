import { useLayoutEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import entranceClosed from '../../assets/images/main/journey/01-entrance-closed.webp'
import entranceOpen from '../../assets/images/main/journey/02-entrance-open.webp'
import keypadHand from '../../assets/images/main/journey/entrance-keypad-hand.png'
import doorHandleHand from '../../assets/images/main/journey/entrance-door-handle-hand.png'
import hallwayFar from '../../assets/images/main/journey/03-hallway-far.webp'
import livingroomWide from '../../assets/images/main/journey/04-livingroom-wide.webp'
import livingroomTable from '../../assets/images/main/journey/05-livingroom-table.webp'
import styles from './JourneySection.module.scss'

gsap.registerPlugin(ScrollTrigger)

// [자주 수정하는 곳 1] 기본 장면의 재생 순서
// 새 사진 추가 방법:
// 1. 위 import 구간에서 이미지에 사용할 변수 이름과 파일 경로를 추가합니다.
// 2. 아래 scenes 배열의 원하는 위치에 그 변수 이름을 추가합니다.
// 배열의 왼쪽 이미지부터 차례대로 재생됩니다.
const scenes = [entranceClosed, entranceOpen, hallwayFar, livingroomWide, livingroomTable]

const JourneySection = ({ onSkip }) => {
  // 화면 요소를 GSAP 애니메이션과 연결하는 참조값입니다.
  // 장면 요소를 추가하거나 삭제하지 않는다면 이 부분은 수정하지 않아도 됩니다.
  const sectionRef = useRef(null)
  const sceneRefs = useRef([])
  const guideRef = useRef(null)
  const handRef = useRef(null)
  const handleHandRef = useRef(null)
  const bellRef = useRef(null)

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

      // Journey가 처음 열렸을 때 각 이미지의 투명도와 크기를 초기화합니다.
      gsap.set(sceneElements, { opacity: 0, scale: 1.06 })
      gsap.set(sceneElements[0], { opacity: 1, scale: 1 })
      gsap.set(handRef.current, { autoAlpha: 0, xPercent: -7, yPercent: -8 })
      gsap.set(handleHandRef.current, { autoAlpha: 0, xPercent: -18, yPercent: -20 })
      gsap.set(bellRef.current, { autoAlpha: 1 })
      stage?.classList.add(styles.cursorHidden)

      // [자주 수정하는 곳 2] 기본 장면의 전체 재생 방식
      // PC와 모바일 모두 사용자의 스크롤 위치에 맞춰 재생됩니다.
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
          },
          onEnterBack: () => {
            root.classList.add(scrollbarClass)
            root.classList.remove('main-header-visible')
          },
        },
      })

      // 첫 스크롤이 시작되면 하단 스크롤 안내를 숨깁니다.
      timeline.to(guideRef.current, { opacity: 0, duration: 0.25 })

      // [자주 수정하는 곳 3] 기본 사진 전환 속도
      // duration: 1을 줄이면 빨라지고, 늘리면 느려집니다.
      // 마지막 0.35는 다음 사진으로 넘어가기 전에 머무는 시간입니다.
      for (let index = 1; index < sceneElements.length; index += 1) {
        timeline
          .to(sceneElements[index - 1], { opacity: 0, scale: 1.1, duration: 1, ease: 'none' })
          .to(sceneElements[index], { opacity: 1, scale: 1, duration: 1, ease: 'none' }, '-=1')
          .to({}, { duration: 0.35 })
      }

      // 마우스를 사용하는 PC에서만 손 이미지가 포인터를 따라갑니다.
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

      // PC에서 휠을 한 번 움직일 때 다음 사진 단계로 이동시키는 로직입니다.
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

      const isDesktopStepMode = window.matchMedia('(hover: hover) and (pointer: fine)').matches
      if (isDesktopStepMode) {
        window.addEventListener('wheel', handleWheel, { passive: false })
        removeWheelHandler = () => window.removeEventListener('wheel', handleWheel)
      }
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
        {/* scenes 배열의 사진을 같은 위치에 겹쳐 놓고 투명도로 전환합니다. */}
        {scenes.map((scene, index) => (
          <img key={scene} ref={(element) => { sceneRefs.current[index] = element }} className={styles.scene} src={scene} alt="" aria-hidden="true" />
        ))}
        <img ref={handRef} className={styles.keypadHand} src={keypadHand} alt="" aria-hidden="true" />
        <img ref={handleHandRef} className={`${styles.keypadHand} ${styles.doorHandleHand}`} src={doorHandleHand} alt="" aria-hidden="true" />
        <span ref={bellRef} className={styles.doorBell} aria-hidden="true" />
        <div className={styles.shade} aria-hidden="true" />

        {/* [자주 수정하는 곳 4] 인트로 건너뛰기 버튼 문구 */}
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
