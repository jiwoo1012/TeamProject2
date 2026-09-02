import { useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import entranceClosed from '../../assets/images/main/journey/001-entrance-closed.webp'
import entranceClosedMobile from '../../assets/images/main/journey/0001-entrance-closed.webp'
import entranceOpen from '../../assets/images/main/journey/002-entrance-open.webp'
import entranceOpenMobile from '../../assets/images/main/journey/0002-entrance-open.webp'
import keypadHand from '../../assets/images/main/journey/entrance-keypad-hand.png'
import doorHandleHand from '../../assets/images/main/journey/entrance-door-handle-hand.png'
import hallwayFar from '../../assets/images/main/journey/003-hallway-far.webp'
import hallwayFarMobile from '../../assets/images/main/journey/0003-hallway-far.webp'
import livingroomWide from '../../assets/images/main/journey/004-livingroom-wide.webp'
import livingroomWideMobile from '../../assets/images/main/journey/0004-livingroom-wide.webp'
import livingroomTable from '../../assets/images/main/journey/005-livingroom-table.webp'
import livingroomTableMobile from '../../assets/images/main/journey/0005-livingroom-table.webp'
import livingroomLightOff from '../../assets/images/main/journey/006-livingroom-light-off.png'
import livingroomLightOffMobile from '../../assets/images/main/journey/0006-livingroom-light-off.png'
import livingroomLightOn from '../../assets/images/main/journey/007-livingroom-light-on.png'
import livingroomLightOnMobile from '../../assets/images/main/journey/0007-livingroom-light-on.png'
import livingroomWindow from '../../assets/images/main/journey/008-livingroom-window.png'
import livingroomNightView from '../../assets/images/main/journey/livingroom-night-view.webp'
import livingroomWindowFrame from '../../assets/images/main/journey/livingroom-window-frame.png'
import makdongWindowPeek from '../../assets/images/main/journey/makdong02.png'
import makdongBundleHold from '../../assets/images/main/journey/makdong01.png'
import makdongChangingClothes from '../../assets/images/main/journey/makdong03.png'
import makdongTableFront from '../../assets/images/main/journey/makdong04.png'
import makdongTableSpread from '../../assets/images/main/journey/makdong05.png'
import livingroomTableOverlay from '../../assets/images/main/journey/O-001.png'
import hanokEntrance from '../../assets/images/main/journey/J-005.png'
import hanokMakdong from '../../assets/images/main/journey/makdong06.png'
import hanokInterior from '../../assets/images/main/journey/J-003-2.png'
import servingMakdong from '../../assets/images/main/journey/makdong07.png'
import hanokTableOverlay from '../../assets/images/main/journey/O-002.png'
import hanokFoodTray from '../../assets/images/main/journey/O-003.png'
import styles from './JourneySection.module.scss'

gsap.registerPlugin(ScrollTrigger)

const FINAL_MESSAGE_SCENE = 'final-message-scene'

// [자주 수정하는 곳 1] 기본 장면의 재생 순서
// 새 사진 추가 방법:
// 1. 위 import 구간에서 이미지에 사용할 변수 이름과 파일 경로를 추가합니다.
// 2. 아래 scenes 배열의 원하는 위치에 그 변수 이름을 추가합니다.
// 배열의 왼쪽 이미지부터 차례대로 재생됩니다.
const scenes = [
  entranceClosed,
  entranceOpen,
  hallwayFar,
  livingroomWide,
  livingroomTable,
  livingroomLightOff,
  livingroomLightOn,
  livingroomWindow,
  livingroomNightView,
  livingroomTable,
  makdongTableFront,
  makdongTableSpread,
  hanokEntrance,
  hanokInterior,
  servingMakdong,
  hanokInterior,
  hanokFoodTray,
  FINAL_MESSAGE_SCENE,
]

const LIGHT_OFF_INDEX = scenes.indexOf(livingroomLightOff)
const LIGHT_ON_INDEX = scenes.indexOf(livingroomLightOn)
const mobileOpeningScenes = [
  entranceClosedMobile,
  entranceOpenMobile,
  hallwayFarMobile,
  livingroomWideMobile,
  livingroomTableMobile,
  livingroomLightOffMobile,
  livingroomLightOnMobile,
]

const JourneySection = ({ onSkip }) => {
  // 화면 요소를 GSAP 애니메이션과 연결하는 참조값입니다.
  // 장면 요소를 추가하거나 삭제하지 않는다면 이 부분은 수정하지 않아도 됩니다.
  const sectionRef = useRef(null)
  const sceneCursorRef = useRef(null)
  const sceneRefs = useRef([])
  const guideRef = useRef(null)
  const handRef = useRef(null)
  const handleHandRef = useRef(null)
  const bellRef = useRef(null)
  const makdongPeekRef = useRef(null)
  const makdongBundleRef = useRef(null)
  const makdongChangingRef = useRef(null)
  const makdongTableFrontRef = useRef(null)
  const makdongTableSpreadRef = useRef(null)
  const darkOverlayRef = useRef(null)
  const backgroundBlinkRef = useRef(null)
  const entranceMakdongRef = useRef(null)
  const entrancePeekRef = useRef(null)
  const servingMakdongRef = useRef(null)
  const hanokFoodTrayRef = useRef(null)
  const finaleCopyRef = useRef(null)
  const finaleTransitionRef = useRef(null)
  const skipButtonRef = useRef(null)
  const finishJourneyRef = useRef(null)

  useLayoutEffect(() => {
    let scrollTween
    let isMoving = false
    let removeWheelHandler = () => {}
    let removeTouchHandlers = () => {}
    let removeKeyHandler = () => {}
    let removePointerHandlers = () => {}
    let removeCursorPointerHandler = () => {}
    const root = document.documentElement
    const scrollbarClass = 'main-journey-active'
    const stage = sectionRef.current?.querySelector(`.${styles.stage}`)

    root.classList.add(scrollbarClass)
    root.classList.remove('main-header-visible')

    const context = gsap.context(() => {
      const sceneElements = sceneRefs.current
      const handElements = [handRef.current, handleHandRef.current]
      const sceneCursor = sceneCursorRef.current

      // Journey가 처음 열렸을 때 각 이미지의 투명도와 크기를 초기화합니다.
      gsap.set(sceneElements, { opacity: 0, scale: 1.06 })
      gsap.set(sceneElements[0], { opacity: 1, scale: 1 })
      gsap.set(handRef.current, { autoAlpha: 0, xPercent: -7, yPercent: -8 })
      gsap.set(handleHandRef.current, { autoAlpha: 0, xPercent: -18, yPercent: -20 })
      gsap.set(bellRef.current, { autoAlpha: 1 })
      gsap.set(makdongPeekRef.current, { autoAlpha: 0, xPercent: 38, rotate: 2 })
      gsap.set(makdongBundleRef.current, { autoAlpha: 0, yPercent: 42, scale: 0.92 })
      gsap.set(makdongChangingRef.current, { autoAlpha: 0, yPercent: 18, scale: 0.96 })
      gsap.set(makdongTableFrontRef.current, { autoAlpha: 0, yPercent: 24, scale: 0.94 })
      gsap.set(makdongTableSpreadRef.current, { autoAlpha: 0, yPercent: 20, scale: 0.9 })
      gsap.set(darkOverlayRef.current, { autoAlpha: 0 })
      gsap.set(backgroundBlinkRef.current, { autoAlpha: 1 })
      gsap.set(entranceMakdongRef.current, { autoAlpha: 0, yPercent: 18, scale: 0.95 })
      gsap.set(entrancePeekRef.current, { autoAlpha: 1, xPercent: 0 })
      gsap.set(servingMakdongRef.current, { autoAlpha: 0, xPercent: 14, yPercent: 8, scale: 0.94 })
      gsap.set(hanokFoodTrayRef.current, { autoAlpha: 0, yPercent: 12, scale: 0.95 })
      gsap.set(finaleCopyRef.current, { autoAlpha: 0, y: 24 })
      gsap.set(finaleTransitionRef.current, { autoAlpha: 0 })
      gsap.set(sceneCursor, { autoAlpha: 0, x: -100, y: -100 })
      stage?.classList.add(styles.cursorHidden)

      const followCursor = (event) => {
        gsap.set(sceneCursor, { x: event.clientX, y: event.clientY })
      }
      window.addEventListener('pointermove', followCursor)
      removeCursorPointerHandler = () => window.removeEventListener('pointermove', followCursor)

      let isFinishing = false
      const finishJourney = () => {
        if (isFinishing) return
        isFinishing = true
        isMoving = true
        gsap.timeline()
          .to(finaleCopyRef.current, { autoAlpha: 0, y: -16, duration: 0.3, ease: 'power2.in' })
          .to(finaleTransitionRef.current, { autoAlpha: 1, duration: 0.75, ease: 'power2.inOut' }, '-=0.1')
          .call(onSkip)
      }
      finishJourneyRef.current = finishJourney

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
            const finalSceneOpacity = Number(gsap.getProperty(sceneElements[sceneElements.length - 1], 'opacity'))
            const showScrollCursor = progress > 0.04 && finalSceneOpacity < 0.5
            stage?.classList.toggle(styles.cursorHidden, progress <= 0.04)
            stage?.classList.toggle(styles.customCursorActive, showScrollCursor)
            gsap.set(sceneCursor, { autoAlpha: showScrollCursor ? 1 : 0 })
            gsap.set(bellRef.current, { autoAlpha: progress <= 0.04 ? 1 : 0 })
            if (progress > 0.04) gsap.to(handElements, { autoAlpha: 0, duration: 0.16, overwrite: 'auto' })
          },
          onEnter: () => root.classList.add(scrollbarClass),
          onLeave: () => {
            stage?.classList.remove(styles.cursorHidden)
            stage?.classList.remove(styles.customCursorActive)
            gsap.set(sceneCursor, { autoAlpha: 0 })
            root.classList.add(scrollbarClass)
            root.classList.remove('main-header-visible')
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
        if (index === LIGHT_ON_INDEX) {
          timeline
            .set(sceneElements[LIGHT_ON_INDEX], { opacity: 0, scale: 1 })
            .to(sceneElements[LIGHT_ON_INDEX], { opacity: 1, duration: 0.22, ease: 'power1.inOut' })
            .to(sceneElements[LIGHT_ON_INDEX], { opacity: 0, duration: 0.16, ease: 'power1.inOut' })
            .to(sceneElements[LIGHT_ON_INDEX], { opacity: 1, duration: 0.2, ease: 'power1.inOut' })
            .to(sceneElements[LIGHT_ON_INDEX], { opacity: 0, duration: 0.14, ease: 'power1.inOut' })
            .to(sceneElements[LIGHT_ON_INDEX], { opacity: 1, duration: 0.28, ease: 'power1.inOut' })
            .set(sceneElements[LIGHT_OFF_INDEX], { opacity: 0 })
            .to({}, { duration: 0.35 })
          continue
        }

        timeline
          .to(sceneElements[index - 1], { opacity: 0, scale: 1.1, duration: 1, ease: 'none' })
          .to(sceneElements[index], { opacity: 1, scale: 1, duration: 1, ease: 'none' }, '-=1')

        if (sceneElements[index].classList.contains(styles.compositeScene)) {
          timeline
            .to(makdongPeekRef.current, {
              autoAlpha: 1,
              xPercent: 0,
              rotate: 0,
              duration: 0.65,
              ease: 'back.out(1.35)',
            }, '-=0.45')
            .to({}, { duration: 0.3 })
            .to(makdongPeekRef.current, {
              autoAlpha: 0,
              xPercent: 38,
              duration: 0.35,
              ease: 'power2.in',
            })
            .to(makdongBundleRef.current, {
              autoAlpha: 1,
              yPercent: 0,
              scale: 1,
              duration: 0.75,
              ease: 'back.out(1.2)',
            }, '-=0.1')
        }

        if (sceneElements[index].classList.contains(styles.tableCompositeScene)) {
          timeline
            .to(makdongChangingRef.current, {
              autoAlpha: 1,
              yPercent: 0,
              scale: 1,
              duration: 0.65,
              ease: 'back.out(1.15)',
            }, '-=0.55')
            .to(makdongChangingRef.current, {
              rotate: -1.5,
              duration: 0.16,
              yoyo: true,
              repeat: 3,
              ease: 'sine.inOut',
            })
        }

        if (sceneElements[index].classList.contains(styles.tableFrontScene)) {
          timeline.to(makdongTableFrontRef.current, {
            autoAlpha: 1,
            yPercent: 0,
            scale: 1,
            duration: 0.7,
            ease: 'back.out(1.2)',
          }, '-=0.55')
        }

        if (sceneElements[index].classList.contains(styles.tableSpreadScene)) {
          timeline
            .to(makdongTableSpreadRef.current, {
              autoAlpha: 1,
              yPercent: 0,
              scale: 1,
              duration: 0.75,
              ease: 'power2.out',
            }, '-=0.6')
            .to({}, { duration: 0.25 })
            .to(darkOverlayRef.current, {
              autoAlpha: 1,
              duration: 0.85,
              ease: 'power2.inOut',
            })
        }

        if (sceneElements[index].classList.contains(styles.hanokEntranceScene)) {
          timeline
            .to({}, { duration: 0.2 })
            .to(backgroundBlinkRef.current, { autoAlpha: 0, duration: 0.2, ease: 'power2.out' })
            .to(backgroundBlinkRef.current, { autoAlpha: 1, duration: 0.14, ease: 'power2.in' })
            .to(backgroundBlinkRef.current, { autoAlpha: 0, duration: 0.2, ease: 'power2.out' })
            .to({}, { duration: 0.14 })
            .to(backgroundBlinkRef.current, { autoAlpha: 1, duration: 0.14, ease: 'power2.in' })
            .to(backgroundBlinkRef.current, { autoAlpha: 0, duration: 0.22, ease: 'power2.out' })
            .to({}, { duration: 0.28 })
            .to(entrancePeekRef.current, {
              autoAlpha: 0,
              xPercent: 35,
              duration: 0.35,
              ease: 'power2.in',
            })
            .to(entranceMakdongRef.current, {
              autoAlpha: 1,
              yPercent: 0,
              scale: 1,
              duration: 0.65,
              ease: 'back.out(1.15)',
            }, '-=0.05')
        }

        if (sceneElements[index].classList.contains(styles.servingScene)) {
          timeline.to(servingMakdongRef.current, {
            autoAlpha: 1,
            xPercent: 0,
            yPercent: 0,
            scale: 1,
            duration: 0.75,
            ease: 'back.out(1.15)',
          }, '-=0.55')
        }

        if (sceneElements[index].classList.contains(styles.foodTrayScene)) {
          timeline.to(hanokFoodTrayRef.current, {
            autoAlpha: 1,
            yPercent: 0,
            scale: 1,
            duration: 0.7,
            ease: 'power2.out',
          }, '-=0.55')
        }

        if (sceneElements[index].classList.contains(styles.finalMessageScene)) {
          timeline
            .to(skipButtonRef.current, {
              autoAlpha: 0,
              duration: 0.2,
              ease: 'power1.out',
            }, '-=0.8')
            .to(finaleCopyRef.current, {
              autoAlpha: 1,
              y: 0,
              duration: 0.55,
              ease: 'power2.out',
            }, '-=0.4')
        }

        timeline
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
        if (targetIndex === currentIndex) {
          if (direction > 0 && currentIndex === lastIndex) {
            event.preventDefault()
          }
          return
        }

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

      // 마지막 메시지는 버튼을 눌렀을 때만 종료합니다.
      // 모바일 터치와 키보드의 아래 방향 스크롤도 마지막 장면에서 멈춥니다.
      const isAtFinalScene = () => {
        const section = sectionRef.current
        const sectionEnd = section.offsetTop + section.offsetHeight - window.innerHeight
        return window.scrollY >= sectionEnd - 2
      }

      let touchStartY = 0
      const handleTouchStart = (event) => {
        touchStartY = event.touches[0]?.clientY ?? 0
      }
      const handleTouchMove = (event) => {
        const currentY = event.touches[0]?.clientY ?? touchStartY
        const isScrollingDown = currentY < touchStartY
        if (isScrollingDown && isAtFinalScene()) event.preventDefault()
      }
      const handleKeyDown = (event) => {
        const scrollDownKeys = ['ArrowDown', 'PageDown', 'End', ' ']
        if (scrollDownKeys.includes(event.key) && isAtFinalScene()) event.preventDefault()
      }

      window.addEventListener('touchstart', handleTouchStart, { passive: true })
      window.addEventListener('touchmove', handleTouchMove, { passive: false })
      window.addEventListener('keydown', handleKeyDown)
      removeTouchHandlers = () => {
        window.removeEventListener('touchstart', handleTouchStart)
        window.removeEventListener('touchmove', handleTouchMove)
      }
      removeKeyHandler = () => window.removeEventListener('keydown', handleKeyDown)
    }, sectionRef)

    return () => {
      removeWheelHandler()
      removeTouchHandlers()
      removeKeyHandler()
      removePointerHandlers()
      removeCursorPointerHandler()
      scrollTween?.kill()
      stage?.classList.remove(styles.cursorHidden)
      stage?.classList.remove(styles.customCursorActive)
      finishJourneyRef.current = null
      context.revert()
      root.classList.remove(scrollbarClass)
    }
  }, [])

  return (
    <>
    <section ref={sectionRef} className={styles.journey} aria-label="자작의 공간으로 들어가는 스크롤 이야기">
      <div className={styles.stage}>
        {/* scenes 배열의 사진을 같은 위치에 겹쳐 놓고 투명도로 전환합니다. */}
        {scenes.map((scene, index) => (
          index <= LIGHT_ON_INDEX ? (
            <picture
              key={`${scene}-${index}`}
              ref={(element) => { sceneRefs.current[index] = element }}
              className={`${styles.scene} ${[
                livingroomWide,
                livingroomTable,
                livingroomLightOff,
                livingroomLightOn,
              ].includes(scene) ? styles.mobileCoverScene : ''}`}
              aria-hidden="true"
            >
              <source media="(max-width: 767px)" srcSet={mobileOpeningScenes[index]} />
              <img className={styles.sceneLayer} src={scene} alt="" />
            </picture>
          ) : scene === livingroomNightView ? (
            <div
              key={`${scene}-${index}`}
              ref={(element) => { sceneRefs.current[index] = element }}
              className={`${styles.scene} ${styles.compositeScene}`}
              aria-hidden="true"
            >
              <img className={styles.sceneLayer} src={livingroomNightView} alt="" />
              <img ref={makdongPeekRef} className={styles.makdongWindowPeek} src={makdongWindowPeek} alt="" />
              <img ref={makdongBundleRef} className={styles.makdongBundleHold} src={makdongBundleHold} alt="" />
              <img className={styles.sceneLayer} src={livingroomWindowFrame} alt="" />
            </div>
          ) : scene === livingroomTable && index > scenes.indexOf(livingroomNightView) ? (
            <div
              key={`${scene}-${index}`}
              ref={(element) => { sceneRefs.current[index] = element }}
              className={`${styles.scene} ${styles.tableCompositeScene}`}
              aria-hidden="true"
            >
              <img className={styles.sceneLayer} src={livingroomTable} alt="" />
              <img ref={makdongChangingRef} className={styles.makdongChangingClothes} src={makdongChangingClothes} alt="" />
              <img className={styles.livingroomTableOverlay} src={livingroomTableOverlay} alt="" />
            </div>
          ) : scene === makdongTableFront ? (
            <div
              key={`${scene}-${index}`}
              ref={(element) => { sceneRefs.current[index] = element }}
              className={`${styles.scene} ${styles.tableFrontScene}`}
              aria-hidden="true"
            >
              <img className={styles.sceneLayer} src={livingroomTable} alt="" />
              <img className={styles.livingroomTableOverlay} src={livingroomTableOverlay} alt="" />
              <img ref={makdongTableFrontRef} className={styles.makdongTableFront} src={makdongTableFront} alt="" />
            </div>
          ) : scene === makdongTableSpread ? (
            <div
              key={`${scene}-${index}`}
              ref={(element) => { sceneRefs.current[index] = element }}
              className={`${styles.scene} ${styles.tableSpreadScene}`}
              aria-hidden="true"
            >
              <img className={styles.sceneLayer} src={livingroomTable} alt="" />
              <img className={styles.livingroomTableOverlay} src={livingroomTableOverlay} alt="" />
              <img ref={makdongTableSpreadRef} className={styles.makdongTableSpread} src={makdongTableSpread} alt="" />
              <div ref={darkOverlayRef} className={styles.darkOverlay} />
            </div>
          ) : scene === hanokEntrance ? (
            <div
              key={`${scene}-${index}`}
              ref={(element) => { sceneRefs.current[index] = element }}
              className={`${styles.scene} ${styles.hanokEntranceScene}`}
              aria-hidden="true"
            >
              <img className={styles.sceneLayer} src={hanokEntrance} alt="" />
              <img ref={entrancePeekRef} className={styles.entrancePeekMakdong} src={makdongWindowPeek} alt="" />
              <img ref={entranceMakdongRef} className={styles.entranceMakdong} src={hanokMakdong} alt="" />
              <div ref={backgroundBlinkRef} className={styles.darkOverlay} />
            </div>
          ) : scene === servingMakdong ? (
            <div
              key={`${scene}-${index}`}
              ref={(element) => { sceneRefs.current[index] = element }}
              className={`${styles.scene} ${styles.servingScene}`}
              aria-hidden="true"
            >
              <img className={styles.sceneLayer} src={hanokInterior} alt="" />
              <img ref={servingMakdongRef} className={styles.servingMakdong} src={servingMakdong} alt="" />
              <img className={styles.hanokTableOverlay} src={hanokTableOverlay} alt="" />
            </div>
          ) : scene === hanokInterior ? (
            <div
              key={`${scene}-${index}`}
              ref={(element) => { sceneRefs.current[index] = element }}
              className={`${styles.scene} ${styles.hanokRoomScene}`}
              aria-hidden="true"
            >
              <img className={styles.sceneLayer} src={hanokInterior} alt="" />
              <img className={styles.hanokTableOverlay} src={hanokTableOverlay} alt="" />
            </div>
          ) : scene === hanokFoodTray ? (
            <div
              key={`${scene}-${index}`}
              ref={(element) => { sceneRefs.current[index] = element }}
              className={`${styles.scene} ${styles.foodTrayScene}`}
              aria-hidden="true"
            >
              <img className={styles.sceneLayer} src={hanokInterior} alt="" />
              <img className={styles.hanokTableOverlay} src={hanokTableOverlay} alt="" />
              <img ref={hanokFoodTrayRef} className={styles.hanokFoodTray} src={hanokFoodTray} alt="" />
            </div>
          ) : scene === FINAL_MESSAGE_SCENE ? (
            <div
              key={`${scene}-${index}`}
              ref={(element) => { sceneRefs.current[index] = element }}
              className={`${styles.scene} ${styles.finalMessageScene}`}
              aria-hidden="true"
            >
              <img className={styles.sceneLayer} src={hanokInterior} alt="" />
              <img className={styles.hanokTableOverlay} src={hanokTableOverlay} alt="" />
              <img className={styles.hanokFoodTray} src={hanokFoodTray} alt="" />
              <div ref={finaleCopyRef} className={styles.finaleCopy}>
                <p>
                  <span>오늘 하루도 수고했어요.</span>
                  <span>당신을 위한 한 상을 준비했어요.</span>
                </p>
                <button type="button" onClick={() => finishJourneyRef.current?.()}>
                  <span>자작 둘러보기</span>
                  <span className={styles.finaleArrow} aria-hidden="true">→</span>
                </button>
              </div>
            </div>
          ) : (
            <img key={`${scene}-${index}`} ref={(element) => { sceneRefs.current[index] = element }} className={styles.scene} src={scene} alt="" aria-hidden="true" />
          )
        ))}
        <img ref={handRef} className={styles.keypadHand} src={keypadHand} alt="" aria-hidden="true" />
        <img ref={handleHandRef} className={`${styles.keypadHand} ${styles.doorHandleHand}`} src={doorHandleHand} alt="" aria-hidden="true" />
        <span ref={bellRef} className={styles.doorBell} aria-hidden="true" />
        <div className={styles.shade} aria-hidden="true" />
        <div ref={finaleTransitionRef} className={styles.finaleTransition} aria-hidden="true" />

        {/* [자주 수정하는 곳 4] 인트로 건너뛰기 버튼 문구 */}
        <button ref={skipButtonRef} className={styles.skipButton} type="button" onClick={onSkip}>
          <span>인트로 건너뛰기</span><span className={styles.skipArrow} aria-hidden="true" />
        </button>

        <div ref={guideRef} className={styles.scrollGuide}>
          <span>자작의 공간으로 들어가 볼까요?</span>
          <span className={styles.scrollLine} aria-hidden="true" />
          <small>SCROLL</small>
        </div>
      </div>
    </section>
    {createPortal(
      <span ref={sceneCursorRef} className={styles.sceneScrollCursor} aria-hidden="true"><i /></span>,
      document.body
    )}
    </>
  )
}

export default JourneySection
