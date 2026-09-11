import React from 'react'
import { useNavigate } from 'react-router-dom'

import makdongImg from '../../assets/webpImages/characters/M007_Poses01.webp'

import aiStyles from '../AiCurator/AiSurvey.module.scss'
import preferenceStyles from './PreferenceComplete.module.scss'

const styles = {
  ...preferenceStyles,
  preferenceComplete: [aiStyles.surveyPage, preferenceStyles.preferenceComplete].filter(Boolean).join(' '),
  content: [aiStyles.surveyContainer, preferenceStyles.content].filter(Boolean).join(' '),
  title: [aiStyles.questionTitle, preferenceStyles.title].filter(Boolean).join(' '),
  description: [aiStyles.questionDescription, preferenceStyles.description].filter(Boolean).join(' '),
  character: [aiStyles.guideCharacter, preferenceStyles.character].filter(Boolean).join(' '),
  aiButton: [aiStyles.nextButton, preferenceStyles.aiButton].filter(Boolean).join(' '),
  shopButton: [aiStyles.prevButton, preferenceStyles.shopButton].filter(Boolean).join(' '),
}


const PreferenceComplete = () => {
  const navigate = useNavigate()


  // ==============================
  // AI 추천으로 이동
  // ==============================

  const handleGoAi = () => {
    navigate('/ai')
  }


  // ==============================
  // 상품 목록으로 이동
  // ==============================

  const handleGoShop = () => {
    navigate('/shop')
  }


  // ==============================
  // 마이페이지로 이동
  // ==============================

  const handleGoMyPage = () => {
    navigate('/mypage/preference')
  }


  return (
    <main className={styles.preferenceComplete}>

      <section className={styles.content}>

        {/* 저장 완료 안내 */}
        <div className={styles.saveStatus}>
          <span className={styles.saveCheck}>✓</span>
          <span>취향 및 안전 정보가 저장되었어요</span>
        </div>


        {/* 완료 문구 */}
        <div className={styles.textArea}>

          <h1 className={styles.title}>
            막동이가 취향을 기억했어요!
          </h1>

          <p className={styles.description}>
            다음에는 오늘의 기분까지 알려주세요.
            <br />
            더 잘 맞는 주안상을 차려드릴게요!
          </p>

        </div>


        {/* 막동이 */}
        <div className={styles.characterArea}>

          <span
            className={`${styles.sparkle} ${styles.sparkleOne}`}
          >
            ✦
          </span>

          <span
            className={`${styles.sparkle} ${styles.sparkleTwo}`}
          >
            ·
          </span>

          <span
            className={`${styles.sparkle} ${styles.sparkleThree}`}
          >
            ✦
          </span>

          <span
            className={`${styles.sparkle} ${styles.sparkleFour}`}
          >
            ·
          </span>

          <img
            src={makdongImg}
            alt="취향을 기억한 막동이"
            className={styles.character}
           loading="lazy" decoding="async" />

        </div>


        {/* 이동 버튼 */}
        <div className={styles.buttonArea}>

          {/* 메인 CTA */}
          <button
            type="button"
            className={styles.aiButton}
            onClick={handleGoAi}
          >
            <span>AI 추천 받으러 가기</span>
            <span className={styles.arrow}>›</span>
          </button>


          {/* 보조 CTA */}
          <button
            type="button"
            className={styles.shopButton}
            onClick={handleGoShop}
          >
            <span>상품 둘러보기</span>
            <span className={styles.arrow}>›</span>
          </button>


          {/* 마이페이지 */}
          <button
            type="button"
            className={styles.myPageButton}
            onClick={handleGoMyPage}
          >
            <span>마이페이지에서 취향 확인하기</span>
            <span className={styles.textArrow}>›</span>
          </button>

        </div>

      </section>

    </main>
  )
}


export default PreferenceComplete