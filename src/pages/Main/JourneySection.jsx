import { useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import entranceClosed from '../../assets/images/main/journey/001-entrance-closed.webp'
import entranceClosedMobile from '../../assets/images/main/journey/0001-entrance-closed.png'
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
import livingroomWindowMobile from '../../assets/images/main/journey/0008-livingroom-window.png'
import livingroomNightView from '../../assets/images/main/journey/livingroom-night-view.webp'
import livingroomNightViewMobile from '../../assets/images/main/journey/0010-livingroom-night-view.png'
import livingroomWindowFrame from '../../assets/images/main/journey/livingroom-window-frame.png'
import livingroomWindowFrameMobile from '../../assets/images/main/journey/0009-livingroom-window-frame.png'
import makdongWindowPeek from '../../assets/images/main/journey/makdong02.png'
import makdongBundleHold from '../../assets/images/main/journey/makdong01.png'
import makdongChangingClothes from '../../assets/images/main/journey/makdong03.png'
import makdongTableFront from '../../assets/images/main/journey/makdong04.png'
import makdongTableSpread from '../../assets/images/main/journey/makdong05.png'
import makdongTableSpreadMobile from '../../assets/images/main/journey/makdong005.png'
import hanokEntrance from '../../assets/images/main/journey/J-005.png'
import hanokEntranceMobile from '../../assets/images/main/journey/J-0005.png'
import hanokMakdong from '../../assets/images/main/journey/makdong06.png'
import hanokInterior from '../../assets/images/main/journey/J-003-2.png'
import hanokInteriorMobile from '../../assets/images/main/journey/J-0003-2.png'
import servingMakdong from '../../assets/images/main/journey/makdong07.png'
import hanokFoodTray from '../../assets/images/main/journey/O-003.png'
import styles from './JourneySection.module.scss'

gsap.registerPlugin(ScrollTrigger)

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
  livingroomWindowMobile,
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
  const progressRef = useRef(null)
  const progressFillRef = useRef(null)
  const progressValueRef = useRef(null)

  useLayoutEffect(() => {
    let scrollTween
    let autoScrollTween
    let isAutoPlaying = false
    let hasAutoPlayed = false
    let startAutoScroll = () => {}
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const isMobilePlayback = window.matchMedia('(max-width: 767px)').matches
    let isMoving = false
    let removeWheelHandler = () => {}
    let removeTouchHandlers = () => {}
    let removeKeyHandler = () => {}
    let removePointerHandlers = () => {}
    let removeCursorPointerHandler = () => {}
    const root = document.documentElement
    const scrollbarClass = 'main-journey-active'
    const section = sectionRef.current
    const sceneCursor = sceneCursorRef.current
    const stage = section?.querySelector(`.${styles.stage}`)
    const progressElement = progressRef.current
    const progressValue = progressValueRef.current

    root.classList.add(scrollbarClass)
    root.classList.remove('main-header-visible')
    if (isMobilePlayback) {
      root.classList.add('main-journey-mobile-playback')
      section.classList.add(styles.mobilePlayback)
    }

    const context = gsap.context(() => {
      const sceneElements = sceneRefs.current
      const handElements = [handRef.current, handleHandRef.current]

      // Journey가 처음 열렸을 때 각 이미지의 투명도와 크기를 초기화합니다.
      gsap.set(sceneElements, { opacity: 0, scale: 1.06 })
      gsap.set(sceneElements[0], { opacity: 1, scale: 1 })
      // 이미지의 투명 여백을 포함한 손끝 위치를 마우스 좌표에 맞춥니다.
      gsap.set(handRef.current, { autoAlpha: 0, xPercent: -17, yPercent: -13 })
      gsap.set(handleHandRef.current, { autoAlpha: 0, xPercent: -9, yPercent: -9 })
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
      gsap.set(sceneElements[sceneElements.length - 1], { '--finale-tone': 0 })
      gsap.set(finaleTransitionRef.current, { autoAlpha: 0 })
      gsap.set(sceneCursor, { autoAlpha: 0, x: -100, y: -100 })
      if (isMobilePlayback) {
        sceneCursor?.classList.add(styles.mobilePlaybackCursor)
        gsap.set(sceneCursor, { x: 0, y: 0 })
      }
      stage?.classList.add(styles.cursorHidden)

      const followCursor = (event) => {
        if (isMobilePlayback) return
        gsap.set(sceneCursor, { x: event.clientX, y: event.clientY })
      }
      window.addEventListener('pointermove', followCursor)
      removeCursorPointerHandler = () => window.removeEventListener('pointermove', followCursor)

      let isFinishing = false
      const setProgressFill = gsap.quickSetter(progressFillRef.current, 'scaleX')
      let lastProgressPercent = -1
      const updateProgress = (progress) => {
        const value = Math.min(1, Math.max(0, progress))
        setProgressFill(value)
        const percent = value === 1 ? 100 : Math.floor(value * 100)
        if (percent === lastProgressPercent) return
        lastProgressPercent = percent
        progressElement.setAttribute('aria-valuenow', String(percent))
        progressValue.textContent = `${percent}%`
      }
      updateProgress(0)
      const finishJourney = () => {
        if (isFinishing) return
        isFinishing = true
        updateProgress(1)
        autoScrollTween?.kill()
        isAutoPlaying = false
        sceneCursor?.classList.remove(styles.autoScrolling)
        if (isMobilePlayback) gsap.set(sceneCursor, { autoAlpha: 0 })
        isMoving = true
        gsap.timeline()
          .to(finaleCopyRef.current, { autoAlpha: 0, y: -16, duration: 0.3, ease: 'power2.in' })
          .to(finaleTransitionRef.current, { autoAlpha: 1, duration: 0.75, ease: 'power2.inOut' }, '-=0.1')
          .call(onSkip)
      }
      finishJourneyRef.current = finishJourney

      // [자주 수정하는 곳 2] 기본 장면의 전체 재생 방식
      // 첫 장면은 직접 시작하고, 중간 장면은 스크롤 위치를 자동으로 이동시킵니다.
      // 마지막 메시지에서는 멈추며 기존 버튼으로 메인에 진입합니다.
      const timeline = gsap.timeline({
        paused: isMobilePlayback,
        onUpdate: function () {
          if (!isFinishing) updateProgress(this.progress())
          if (!isMobilePlayback) return
          const isOpening = this.progress() <= 0.04
          stage?.classList.toggle(styles.openingScene, isOpening)
          gsap.set(bellRef.current, { autoAlpha: isOpening ? 1 : 0 })
        },
        scrollTrigger: isMobilePlayback ? undefined : {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 1,
          invalidateOnRefresh: true,
          onUpdate: ({ progress }) => {
            stage?.classList.toggle(styles.openingScene, progress <= 0.04)
            const finalSceneOpacity = Number(gsap.getProperty(finaleCopyRef.current, 'opacity'))
            const showScrollCursor = progress > 0.04 && finalSceneOpacity < 0.5
            stage?.classList.toggle(styles.cursorHidden, progress <= 0.04)
            stage?.classList.toggle(styles.customCursorActive, showScrollCursor)
            gsap.set(sceneCursor, { autoAlpha: showScrollCursor ? 1 : 0 })
            gsap.set(bellRef.current, { autoAlpha: progress <= 0.04 ? 1 : 0 })
            if (progress > 0.04) gsap.to(handElements, { autoAlpha: 0, duration: 0.16, overwrite: 'auto' })
            if (progress > 0.04 && progress < 1 && !isMoving) startAutoScroll()
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

        // ?? ?? ??? ??? ???? ???? ??? ???? ?????.
        if (sceneElements[index].classList.contains(styles.hanokRoomScene)) {
          timeline
            .to({}, { duration: 0.7 })
            .to(servingMakdongRef.current, {
              autoAlpha: 1, xPercent: 0, yPercent: 0, scale: 1,
              duration: 0.9, ease: 'power2.out',
            })
            .to({}, { duration: 0.8 })
            .to(servingMakdongRef.current, {
              autoAlpha: 0, xPercent: 18, duration: 0.7, ease: 'power2.in',
            })
            .to({}, { duration: 0.4 })
            .to(hanokFoodTrayRef.current, {
              autoAlpha: 1, yPercent: 0, scale: 1,
              duration: 0.9, ease: 'power2.out',
            })
            .to({}, { duration: 0.8 })
            .to(skipButtonRef.current, { autoAlpha: 0, duration: 0.2 })
            .to(sceneElements[index], { '--finale-tone': 1, duration: 0.7, ease: 'power2.out' })
            .to(finaleCopyRef.current, {
              autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.out',
            }, '<')
        }

        timeline
          .to({}, { duration: 0.35 })
        if (index === 1) timeline.addLabel('entranceOpenReady')
      }

      // 첫 스크롤 이후 PC와 모바일 모두 마지막 메시지까지 자동으로 진행합니다.
      startAutoScroll = () => {
        if (isMobilePlayback) {
          if (hasAutoPlayed || isFinishing) return
          hasAutoPlayed = true
          stage?.classList.remove(styles.cursorHidden)
          if (isReducedMotion) {
            timeline.progress(1)
            return
          }
          isAutoPlaying = true
          sceneCursor?.classList.add(styles.autoScrolling)
          gsap.set(sceneCursor, { autoAlpha: 1 })
          // 페이지 위치를 고정하고 기존 장면 타임라인만 재생합니다.
          autoScrollTween = timeline.tweenTo(timeline.duration(), {
            duration: timeline.duration() * 1.3,
            ease: 'none',
            onComplete: () => {
              isAutoPlaying = false
              sceneCursor?.classList.remove(styles.autoScrolling)
              gsap.set(sceneCursor, { autoAlpha: 0 })
            },
          })
          return
        }
        if (isReducedMotion || isAutoPlaying || hasAutoPlayed || isFinishing) return
        const trigger = timeline.scrollTrigger
        if (!trigger || trigger.progress <= 0 || trigger.progress >= 1) return

        hasAutoPlayed = true
        isAutoPlaying = true
        sceneCursor?.classList.add(styles.autoScrolling)
        const scrollState = { progress: trigger.progress }
        autoScrollTween = gsap.to(scrollState, {
          progress: 1,
          duration: timeline.duration() * (1 - scrollState.progress) * 1.3,
          ease: 'none',
          onUpdate: () => {
            window.scrollTo({
              top: trigger.start + (trigger.end - trigger.start) * scrollState.progress,
              behavior: 'instant',
            })
          },
          onComplete: () => {
            isAutoPlaying = false
            sceneCursor?.classList.remove(styles.autoScrolling)
          },
        })
      }

      const canTrackPointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
      if (stage && canTrackPointer && !isMobilePlayback) {
        const moveHandX = gsap.quickSetter(handRef.current, 'x', 'px')
        const moveHandY = gsap.quickSetter(handRef.current, 'y', 'px')
        const moveHandleHandX = gsap.quickSetter(handleHandRef.current, 'x', 'px')
        const moveHandleHandY = gsap.quickSetter(handleHandRef.current, 'y', 'px')
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
        if (isMobilePlayback) {
          event.preventDefault()
          if (event.deltaY > 0) startAutoScroll()
          return
        }
        const section = sectionRef.current
        const sectionStart = section.offsetTop
        const sectionEnd = sectionStart + section.offsetHeight - window.innerHeight
        const currentScroll = window.scrollY
        if (currentScroll < sectionStart - 2 || currentScroll > sectionEnd + 2) return

        const direction = Math.sign(event.deltaY)
        if (!direction) return
        if (isMoving || isAutoPlaying) {
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
        const isOpeningTransition = direction > 0 && currentIndex === 0
        const targetProgress = isOpeningTransition
          ? timeline.labels.entranceOpenReady / timeline.duration()
          : targetIndex / lastIndex
        const targetScroll = sectionStart + (sectionEnd - sectionStart) * targetProgress
        scrollTween?.kill()
        scrollTween = gsap.to(scrollState, {
          y: targetScroll,
          duration: isOpeningTransition ? 2.2 : 0.9,
          ease: isOpeningTransition ? 'sine.inOut' : 'power2.inOut',
          onUpdate: () => window.scrollTo({ top: scrollState.y, behavior: 'instant' }),
          onComplete: () => {
            isMoving = false
            startAutoScroll()
          },
        })
      }

      const isDesktopStepMode = window.matchMedia('(hover: hover) and (pointer: fine)').matches
      if (isDesktopStepMode || isMobilePlayback) {
        window.addEventListener('wheel', handleWheel, { passive: false })
        removeWheelHandler = () => window.removeEventListener('wheel', handleWheel)
      }

      // 마지막 메시지는 버튼을 눌렀을 때만 종료합니다.
      // 모바일 터치와 키보드의 아래 방향 스크롤도 마지막 장면에서 멈춥니다.
      const getJourneyEnd = () => timeline.scrollTrigger?.end ?? 0
      const isAtFinalScene = () => {
        return window.scrollY >= getJourneyEnd() - 2
      }

      let touchStartY = 0
      const handleTouchStart = (event) => {
        touchStartY = event.touches[0]?.clientY ?? 0
      }
      const handleTouchMove = (event) => {
        const currentY = event.touches[0]?.clientY ?? touchStartY
        const deltaY = touchStartY - currentY
        touchStartY = currentY
        if (isMobilePlayback) {
          if (event.touches.length !== 1) return
          event.preventDefault()
          if (deltaY > 0) startAutoScroll()
          return
        }
        if (isAutoPlaying) {
          event.preventDefault()
          return
        }
        if (deltaY > 0 && isAtFinalScene()) event.preventDefault()
      }
      const handleKeyDown = (event) => {
        if (event.target instanceof Element && event.target.closest('button, a, input, textarea, select, [contenteditable="true"]')) return
        const scrollDownKeys = ['ArrowDown', 'PageDown', 'End', ' ']
        const scrollKeys = [...scrollDownKeys, 'ArrowUp', 'PageUp', 'Home']
        if (isMobilePlayback && scrollKeys.includes(event.key)) {
          event.preventDefault()
          if (scrollDownKeys.includes(event.key)) startAutoScroll()
          return
        }
        if (isAutoPlaying && scrollKeys.includes(event.key)) {
          event.preventDefault()
          return
        }
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
      autoScrollTween?.kill()
      stage?.classList.remove(styles.cursorHidden)
      stage?.classList.remove(styles.customCursorActive)
      sceneCursor?.classList.remove(styles.mobilePlaybackCursor, styles.autoScrolling)
      finishJourneyRef.current = null
      context.revert()
      root.classList.remove(scrollbarClass)
      root.classList.remove('main-journey-mobile-playback')
      section?.classList.remove(styles.mobilePlayback)
    }
  }, [])

  return (
    <>
    <section ref={sectionRef} className={styles.journey} aria-label="자작의 공간으로 들어가는 스크롤 이야기">
      <div className={`${styles.stage} ${styles.openingScene}`}>
        {/* scenes 배열의 사진을 같은 위치에 겹쳐 놓고 투명도로 전환합니다. */}
        {scenes.map((scene, index) => (
          index < mobileOpeningScenes.length ? (
            <picture
              key={`${scene}-${index}`}
              ref={(element) => { sceneRefs.current[index] = element }}
              className={`${styles.scene} ${styles.mobileCoverScene}`}
              aria-hidden="true"
            >
              <source media="(max-width: 767px)" srcSet={mobileOpeningScenes[index]} />
              <img className={styles.sceneLayer} src={scene} alt="" />
            </picture>
          ) : scene === livingroomNightView ? (
            <div
              key={`${scene}-${index}`}
              ref={(element) => { sceneRefs.current[index] = element }}
              className={`${styles.scene} ${styles.compositeScene} ${styles.mobileCoverScene}`}
              aria-hidden="true"
            >
              <picture>
                <source media="(max-width: 767px)" srcSet={livingroomNightViewMobile} />
                <img className={styles.sceneLayer} src={livingroomNightView} alt="" />
              </picture>
              <img ref={makdongPeekRef} className={styles.makdongWindowPeek} src={makdongWindowPeek} alt="" />
              <img ref={makdongBundleRef} className={styles.makdongBundleHold} src={makdongBundleHold} alt="" />
              <picture>
                <source media="(max-width: 767px)" srcSet={livingroomWindowFrameMobile} />
                <img className={styles.sceneLayer} src={livingroomWindowFrame} alt="" />
              </picture>
            </div>
          ) : scene === livingroomTable && index > scenes.indexOf(livingroomNightView) ? (
            <div
              key={`${scene}-${index}`}
              ref={(element) => { sceneRefs.current[index] = element }}
              className={`${styles.scene} ${styles.tableCompositeScene} ${styles.mobileCoverScene}`}
              aria-hidden="true"
            >
              <picture>
                <source media="(max-width: 767px)" srcSet={livingroomTableMobile} />
                <img className={styles.sceneLayer} src={livingroomTable} alt="" />
              </picture>
              <img ref={makdongChangingRef} className={styles.makdongChangingClothes} src={makdongChangingClothes} alt="" />
            </div>
          ) : scene === makdongTableFront ? (
            <div
              key={`${scene}-${index}`}
              ref={(element) => { sceneRefs.current[index] = element }}
              className={`${styles.scene} ${styles.tableFrontScene} ${styles.mobileCoverScene}`}
              aria-hidden="true"
            >
              <picture>
                <source media="(max-width: 767px)" srcSet={livingroomTableMobile} />
                <img className={styles.sceneLayer} src={livingroomTable} alt="" />
              </picture>
              <img ref={makdongTableFrontRef} className={styles.makdongTableFront} src={makdongTableFront} alt="" />
            </div>
          ) : scene === makdongTableSpread ? (
            <div
              key={`${scene}-${index}`}
              ref={(element) => { sceneRefs.current[index] = element }}
              className={`${styles.scene} ${styles.tableSpreadScene} ${styles.mobileCoverScene}`}
              aria-hidden="true"
            >
              <picture>
                <source media="(max-width: 767px)" srcSet={livingroomTableMobile} />
                <img className={styles.sceneLayer} src={livingroomTable} alt="" />
              </picture>
              <picture>
                <source media="(max-width: 767px)" srcSet={makdongTableSpreadMobile} />
                <img ref={makdongTableSpreadRef} className={styles.makdongTableSpread} src={makdongTableSpread} alt="" />
              </picture>
              <div ref={darkOverlayRef} className={styles.darkOverlay} />
            </div>
          ) : scene === hanokEntrance ? (
            <div
              key={`${scene}-${index}`}
              ref={(element) => { sceneRefs.current[index] = element }}
              className={`${styles.scene} ${styles.hanokEntranceScene} ${styles.mobileCoverScene}`}
              aria-hidden="true"
            >
              <picture>
                <source media="(max-width: 767px)" srcSet={hanokEntranceMobile} />
                <img className={styles.sceneLayer} src={hanokEntrance} alt="" />
              </picture>
              <img ref={entrancePeekRef} className={styles.entrancePeekMakdong} src={makdongWindowPeek} alt="" />
              <img ref={entranceMakdongRef} className={styles.entranceMakdong} src={hanokMakdong} alt="" />
              <div ref={backgroundBlinkRef} className={styles.darkOverlay} />
            </div>
          ) : scene === hanokInterior ? (
            <div
              key={`${scene}-${index}`}
              ref={(element) => { sceneRefs.current[index] = element }}
              className={`${styles.scene} ${styles.hanokRoomScene} ${styles.finalMessageScene} ${styles.mobileCoverScene}`}
              aria-hidden="true"
            >
              <picture>
                <source media="(max-width: 767px)" srcSet={hanokInteriorMobile} />
                <img className={styles.sceneLayer} src={hanokInterior} alt="" />
              </picture>
              <img ref={servingMakdongRef} className={styles.servingMakdong} src={servingMakdong} alt="" />
              <img ref={hanokFoodTrayRef} className={styles.hanokFoodTray} src={hanokFoodTray} alt="" />
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
        <div
          ref={progressRef}
          className={styles.introProgress}
          role="progressbar"
          aria-label="인트로 재생 진행률"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={0}
        >
          <div className={styles.progressTrack} aria-hidden="true">
            <span ref={progressFillRef} className={styles.progressFill} />
          </div>
          <span ref={progressValueRef} className={styles.progressValue} aria-hidden="true">0%</span>
        </div>

        {/* [자주 수정하는 곳 4] 인트로 건너뛰기 버튼 문구 */}
        <button ref={skipButtonRef} className={styles.skipButton} type="button" onClick={onSkip}>
          <span>인트로 건너뛰기</span><span className={styles.skipArrow} aria-hidden="true" />
        </button>

        <div ref={guideRef} className={styles.scrollGuide}>
          <span>자작의 공간으로 들어가 볼까요?</span>
          <svg className={styles.mobileScrollHand} viewBox="0 0 64 64" aria-hidden="true" focusable="false">
            <path d="M25 37V10C25 4 33 4 33 10V27C33 22 41 22 41 27V30C41 25 49 25 49 30V33C49 29 56 29 56 34V42C56 51 50 58 41 58H35C29 58 25 55 22 51L12 38C9 34 14 29 18 33L25 40" />
            <path d="M33 27V36M41 30V37M49 33V39" />
          </svg>
          <span className={styles.scrollLine} aria-hidden="true" />
          <small>SCROLL</small>
        </div>
      </div>
    </section>
    {createPortal(
      <span ref={sceneCursorRef} className={styles.sceneScrollCursor} aria-hidden="true">
        <i />
        <span className={styles.autoScrollLabel}>
          자동재생중<span className={styles.autoScrollDots}><span>.</span><span>.</span><span>.</span></span>
        </span>
      </span>,
      document.body
    )}
    </>
  )
}

export default JourneySection
