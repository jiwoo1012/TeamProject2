import React from 'react'
import { useNavigate } from 'react-router-dom'
import makdongImg from '../../assets/characters/M007_Poses06.png'

import styles from './PreferenceSurvey.module.scss'

const PreferenceSurvey = () => {
  const navigate = useNavigate()

  // 취향 설문 시작
  const handleStart = () => {
    navigate('/preference/questions')
  }

  // 메인으로 돌아가기
  const handleBackToMain = () => {
    navigate('/')
  }

  return (
    <main className={styles.preferenceSurvey}>
      <section className={styles.surveyBox}>

        {/* 메인으로 돌아가기 */}
        <button
          type="button"
          className={styles.backButton}
          onClick={handleBackToMain}
        >
          <span className={styles.backArrow}>‹</span>
          <span>메인으로 돌아가기</span>
        </button>

        {/* 모서리 장식 */}
        <span className={`${styles.corner} ${styles.topLeft}`} />
        <span className={`${styles.corner} ${styles.topRight}`} />
        <span className={`${styles.corner} ${styles.bottomLeft}`} />
        <span className={`${styles.corner} ${styles.bottomRight}`} />

        <div className={styles.content}>

          {/* 왼쪽 텍스트 영역 */}
          <div className={styles.textArea}>

            <div className={styles.infoBadge}>
              <span className={styles.clockIcon}>◷</span>
              <span>5가지 질문 · 약 30초</span>
            </div>

            <h1 className={styles.title}>
              막둥이에게
              <br />
              당신의 취향을 알려주세요
            </h1>

            <p className={styles.description}>
              다섯 가지 질문이면 충분해요.
              <br />
              알려주신 취향을 기억해두고 다음 추천에 활용할게요.
            </p>

            {/* 설문 시작 */}
            <button
              type="button"
              className={styles.startButton}
              onClick={handleStart}
            >
              <span>내 취향 등록하기</span>
              <span className={styles.arrow}>›</span>
            </button>

            <p className={styles.notice}>
              <span className={styles.noticeIcon}>◎</span>
              언제든 마이페이지에서 수정할 수 있어요.
            </p>

          </div>


          {/* 오른쪽 막둥이 이미지 */}
          <div className={styles.characterArea}>
            <img
              src={makdongImg}
              alt="막둥이"
              className={styles.character}
            />
          </div>

        </div>
      </section>
    </main>
  )
}

export default PreferenceSurvey