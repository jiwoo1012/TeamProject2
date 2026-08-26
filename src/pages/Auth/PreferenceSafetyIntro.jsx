import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import makdongImg from '../../assets/characters/M007_Poses01.png'

import styles from './PreferenceSafetyIntro.module.scss'


const PreferenceSafetyIntro = () => {
  const navigate = useNavigate()

  const [phase, setPhase] = useState('complete')
  const [isLeaving, setIsLeaving] = useState(false)


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
    navigate('/')
  }


  return (
    <main className={styles.preferenceSafetyIntro}>

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
              막둥이가 나리의 취향을 거의 다 알아냈어요!
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