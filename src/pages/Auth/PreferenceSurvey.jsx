import React from 'react'
import { useNavigate } from 'react-router-dom'

import makdongImg from '../../assets/webpImages/characters/M007_Poses06.webp'

import styles from './PreferenceSurvey.module.scss'


const PreferenceSurvey = () => {
  const navigate = useNavigate()


  // 취향 설문 시작
  const handleStart = () => {
    navigate('/preference/questions')
  }


  // 나중에 하기
  const handleSkip = () => {
    navigate('/', {
      replace: true,
      state: {
        skipJourney: true,
      },
    })
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


        <div className={styles.content}>

          {/* 오른쪽 텍스트 영역 */}
          <div className={styles.textArea}>

            <div className={styles.infoBadge}>
              <span className={styles.clockIcon}>◷</span>
              <span>5가지 질문 · 약 30초</span>
            </div>


            <h1 className={styles.title}>
              막동이에게
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


            {/* 나중에 하기 */}
            <button
              type="button"
              className={styles.skipButton}
              onClick={handleSkip}
            >
              나중에 하기
            </button>


            <p className={styles.notice}>
              <span className={styles.noticeIcon}>◎</span>
              언제든 마이페이지에서 수정할 수 있어요.
            </p>

          </div>


          {/* 왼쪽 막동이 이미지 */}
          <div className={styles.characterArea}>
            <img
              src={makdongImg}
              alt="막동이"
              className={styles.character}
             loading="lazy" decoding="async" />
          </div>

        </div>
      </section>
    </main>
  )
}


export default PreferenceSurvey
