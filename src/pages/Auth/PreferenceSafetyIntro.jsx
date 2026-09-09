import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'

import makdongImg from '../../assets/characters/M007_Poses01.png'

import aiStyles from '../AiCurator/AiSurvey.module.scss'
import preferenceStyles from './PreferenceSafetyIntro.module.scss'

const styles = {
  ...preferenceStyles,
  preferenceSafetyIntro: [aiStyles.surveyPage, preferenceStyles.preferenceSafetyIntro].filter(Boolean).join(' '),
  screen: [aiStyles.surveyContainer, preferenceStyles.screen].filter(Boolean).join(' '),
  completeTitle: [aiStyles.questionTitle, preferenceStyles.completeTitle].filter(Boolean).join(' '),
  safetyTitle: [aiStyles.questionTitle, preferenceStyles.safetyTitle].filter(Boolean).join(' '),
  completeDescription: [aiStyles.questionDescription, preferenceStyles.completeDescription].filter(Boolean).join(' '),
  safetyDescription: [aiStyles.questionDescription, preferenceStyles.safetyDescription].filter(Boolean).join(' '),
  makdong: [aiStyles.guideCharacter, preferenceStyles.makdong].filter(Boolean).join(' '),
  buttonArea: [aiStyles.buttonArea, preferenceStyles.buttonArea].filter(Boolean).join(' '),
  prevButton: [aiStyles.prevButton, preferenceStyles.prevButton].filter(Boolean).join(' '),
  nextButton: [aiStyles.nextButton, preferenceStyles.nextButton].filter(Boolean).join(' '),
}


const PreferenceSafetyIntro = () => {
  const navigate = useNavigate()

  const [phase, setPhase] = useState('complete')
  const [isLeaving, setIsLeaving] = useState(false)
  const confettiLayerRef = useRef(null)


  // ========================================
  // 취향 질문 완료 축하 컨페티
  // '완료' 단계가 항상 최초 마운트 시점이므로 한 번만 실행된다.
  // ========================================

  useEffect(() => {
    const container = confettiLayerRef.current
    if (!container) return undefined
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    const colors = ['#4D7E7B', '#56BEB7', '#E59C35', '#C65D4B', '#E1D9CE']
    const pieces = Array.from({ length: 26 }, () => {
      const piece = document.createElement('span')
      const size = 6 + Math.random() * 6
      Object.assign(piece.style, {
        position: 'absolute',
        top: '-24px',
        left: `${Math.random() * 100}%`,
        width: `${size}px`,
        height: `${size * 0.42}px`,
        borderRadius: '2px',
        background: colors[Math.floor(Math.random() * colors.length)],
        opacity: '0',
      })
      container.appendChild(piece)
      return piece
    })

    // Timed to fully resolve within ~1.5s, comfortably inside the 1.7s the
    // '완료' card stays on screen before it starts fading (see isLeaving below) —
    // keeps the burst from overlapping the card's own exit transition.
    const timelines = pieces.map((piece) => {
      const fallDistance = window.innerHeight * (0.5 + Math.random() * 0.35)
      const drift = (Math.random() - 0.5) * 240
      const rotation = (Math.random() - 0.5) * 520

      return gsap.timeline({ delay: Math.random() * 0.2 })
        .set(piece, { opacity: 1 })
        .to(piece, {
          y: fallDistance,
          x: drift,
          rotation,
          duration: 0.9 + Math.random() * 0.4,
          ease: 'power1.in',
        })
        .to(piece, { opacity: 0, duration: 0.25 }, '-=0.25')
    })

    return () => {
      timelines.forEach((timeline) => timeline.kill())
      pieces.forEach((piece) => piece.remove())
    }
  }, [])


  // ========================================
  // 완료 화면 → 안전 확인 안내 화면
  // ========================================

  useEffect(() => {
    // 완료 화면을 약 1.7초 보여준 뒤 사라지기 시작
    const leaveTimer = setTimeout(() => {
      setIsLeaving(true)
    }, 1700)

    // 페이드 아웃 후 안전 확인 화면으로 전환
    const changeTimer = setTimeout(() => {
      setPhase('safety')
      setIsLeaving(false)
    }, 2050)

    return () => {
      clearTimeout(leaveTimer)
      clearTimeout(changeTimer)
    }
  }, [])


  // ========================================
  // 이전
  // ========================================

  const handlePrev = () => {
    navigate('/preference/questions')
  }


  // ========================================
  // 안전 확인하기
  // ========================================

  const handleSafetyCheck = () => {
    navigate('/preference/safety')
  }


  // ========================================
  // 메인으로 돌아가기
  // 취향 등록 완료 처리는 하지 않고 과정 종료
  // ========================================

  const handleGoMain = () => {
    navigate('/', {
      replace: true,
      state: {
        skipJourney: true,
      },
    })
  }


  return (
    <main className={styles.preferenceSafetyIntro}>

      {phase === 'complete' && (
        <div className={styles.confettiLayer} ref={confettiLayerRef} aria-hidden="true" />
      )}

      <section
        className={`
          ${styles.screen}
          ${isLeaving ? styles.leaving : ''}
        `}
      >

        {/* ========================================
            취향 질문 완료
        ======================================== */}

        {phase === 'complete' && (
          <div className={styles.completeContent}>

            {/* 완료 진행바 */}
            <div className={styles.progress}>
              <div className={styles.progressLine} />

              {[0, 1, 2, 3, 4].map((item) => (
                <span
                  key={item}
                  className={styles.progressDot}
                >
                  ✓
                </span>
              ))}
            </div>


            <h1 className={styles.completeTitle}>
              취향 질문 완료!
            </h1>

            <p className={styles.completeDescription}>
              막둥이가 나으리의 취향을 거의 다 알아냈어요!
              <br />
              마지막으로 안전한 추천을 위해 꼭 확인할 게 하나 있어요.
            </p>


            <img
              src={makdongImg}
              alt="취향을 기억한 막둥이"
              className={styles.makdong}
            />

          </div>
        )}


        {/* ========================================
            안전 확인 안내
        ======================================== */}

        {phase === 'safety' && (
          <div className={styles.safetyContent}>

            {/* 방패 아이콘 */}
            <div className={styles.shieldIcon}>
              <svg
                viewBox="0 0 80 90"
                aria-hidden="true"
              >
                <path
                  d="M40 4C50 12 61 15 71 16V39C71 59 59 76 40 85C21 76 9 59 9 39V16C19 15 30 12 40 4Z"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                />

                <circle
                  cx="40"
                  cy="43"
                  r="17"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                />

                <path
                  d="M32 43L38 49L49 36"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <span className={styles.shieldSparkle}>
                ✦
              </span>
            </div>


            <h1 className={styles.safetyTitle}>
              알레르기나 피해야 할 재료를 확인할게요
            </h1>

            <p className={styles.safetyDescription}>
              입력한 정보는 안전한 추천을 위한 필터링에만 사용돼요.
            </p>


            {/* 이전 / 안전 확인 */}
            <div className={styles.buttonArea}>

              <button
                type="button"
                className={styles.prevButton}
                onClick={handlePrev}
              >
                <span>‹</span>
                이전
              </button>

              <button
                type="button"
                className={styles.nextButton}
                onClick={handleSafetyCheck}
              >
                안전 확인하기
                <span>›</span>
              </button>

            </div>


            {/* 메인으로 돌아가기 */}
            <button
              type="button"
              className={styles.mainButton}
              onClick={handleGoMain}
            >
              <span>메인으로 돌아가기</span>
              <span className={styles.mainArrow}>›</span>
            </button>

          </div>
        )}

      </section>

    </main>
  )
}


export default PreferenceSafetyIntro