import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import makdongImg from '../../assets/characters/M007_Poses01.png'

// Q1 단맛
import sweetnessDryImg from '../../assets/icons/preferenceQuestions/sweetness-dry.png'
import sweetnessMildImg from '../../assets/icons/preferenceQuestions/sweetness-mild.png'
import sweetnessSweetImg from '../../assets/icons/preferenceQuestions/sweetness-sweet.png'

// Q2 신맛
import sournessLowImg from '../../assets/icons/preferenceQuestions/sourness-low.png'
import sournessMediumImg from '../../assets/icons/preferenceQuestions/sourness-medium.png'
import sournessHighImg from '../../assets/icons/preferenceQuestions/sourness-high.png'

import styles from './PreferenceQuestions.module.scss'


const QUESTIONS = [
  // Q1
  {
    id: 'sweetness',
    category: '단맛',
    title: '술은 어느 정도 달콤한 게 좋나요?',
    description: '막둥이가 먼저 좋아하는 단맛부터 알아볼게요!',
    type: 'single',
    options: [
      {
        value: 'dry',
        label: '거의 달지 않은 술',
        description: '깔끔하고 드라이한 술을 선호해요',
        image: sweetnessDryImg,
      },
      {
        value: 'mild',
        label: '은은한 술',
        description: '살짝 달콤한 정도가 좋아요',
        image: sweetnessMildImg,
      },
      {
        value: 'sweet',
        label: '달콤한 술',
        description: '단맛이 확실하게 느껴지는 술이 좋아요',
        image: sweetnessSweetImg,
      },
      {
        value: 'unknown',
        label: '아직 잘 모르겠어요',
        description: '아직 제 취향을 잘 모르겠어요',
        icon: '?',
      },
    ],
  },

  // Q2
  {
    id: 'sourness',
    category: '신맛',
    title: '새콤한 맛은 어느 정도 좋아하나요?',
    description: '상큼한 한잔도 좋아하시나요?',
    type: 'single',
    options: [
      {
        value: 'low',
        label: '산미가 거의 없는 술',
        description: '신맛이 강하지 않은 술이 좋아요',
        image: sournessLowImg,
      },
      {
        value: 'medium',
        label: '은은하게 상큼한 술',
        description: '부담 없이 산뜻한 정도가 좋아요',
        image: sournessMediumImg,
      },
      {
        value: 'high',
        label: '새콤함이 확실한 술',
        description: '상큼하고 새콤한 맛이 분명한 술이 좋아요',
        image: sournessHighImg,
      },
      {
        value: 'any',
        label: '크게 상관없어요',
        description: '신맛 여부는 크게 중요하지 않아요',
        icon: '?',
      },
    ],
  },

  // Q3
  {
    id: 'question3',
    category: '질문 3',
    title: '세 번째 질문이 들어갈 자리예요.',
    description: '질문 설명이 들어갑니다.',
    type: 'multiple',
    maxSelect: 2,
    options: [],
  },

  // Q4
  {
    id: 'question4',
    category: '질문 4',
    title: '네 번째 질문이 들어갈 자리예요.',
    description: '질문 설명이 들어갑니다.',
    type: 'single',
    options: [],
  },

  // Q5
  {
    id: 'question5',
    category: '질문 5',
    title: '다섯 번째 질문이 들어갈 자리예요.',
    description: '질문 설명이 들어갑니다.',
    type: 'multiple',
    maxSelect: 2,
    options: [],
  },
]


const PreferenceQuestions = () => {
  const navigate = useNavigate()

  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState({})

  const currentQuestion = QUESTIONS[currentStep]
  const selectedValues = answers[currentQuestion.id] || []

  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === QUESTIONS.length - 1
  const hasAnswer = selectedValues.length > 0


  // ==============================
  // 선택지 클릭
  // ==============================

  const handleSelect = (value) => {
    const { id, type, maxSelect } = currentQuestion

    if (type === 'single') {
      setAnswers((prev) => ({
        ...prev,
        [id]: [value],
      }))

      return
    }

    setAnswers((prev) => {
      const currentValues = prev[id] || []

      if (currentValues.includes(value)) {
        return {
          ...prev,
          [id]: currentValues.filter((item) => item !== value),
        }
      }

      if (maxSelect && currentValues.length >= maxSelect) {
        return prev
      }

      return {
        ...prev,
        [id]: [...currentValues, value],
      }
    })
  }


  // ==============================
  // 이전
  // ==============================

  const handlePrev = () => {
    if (isFirstStep) {
      navigate('/preference')
      return
    }

    setCurrentStep((prev) => prev - 1)
  }


  // ==============================
  // 다음
  // ==============================

  const handleNext = () => {
    if (!hasAnswer) return

    if (isLastStep) {
      console.log('최종 취향 답변:', answers)
      return
    }

    setCurrentStep((prev) => prev + 1)
  }


  // ==============================
  // 나중에 하기
  // ==============================

  const handleSkip = () => {
    navigate('/')
  }


  return (
    <main className={styles.preferenceQuestions}>
      <div className={styles.inner}>

        {/* 나중에 하기 */}
        <div className={styles.skipArea}>
          <button
            type="button"
            className={styles.skipButton}
            onClick={handleSkip}
          >
            나중에 할게요
            <span>›</span>
          </button>
        </div>


        {/* 진행 영역 */}
        <section className={styles.progressSection}>

          <div className={styles.categoryBadge}>
            취향 알아보기
          </div>

          <div className={styles.progress}>
            <div className={styles.progressLine} />

            {QUESTIONS.map((question, index) => (
              <span
                key={question.id}
                className={`
                  ${styles.progressDot}
                  ${index <= currentStep ? styles.activeDot : ''}
                `}
              />
            ))}
          </div>

          <p className={styles.progressText}>
            {currentStep + 1} / {QUESTIONS.length}
            {' · '}
            {currentQuestion.category}
          </p>

        </section>


        {/* 질문 제목 + 막둥이 */}
        <section className={styles.questionHeader}>

          <div className={styles.makdongArea}>

            <div className={styles.speechBubble}>
              막둥이가 취향을
              <br />
              알아가는 중이에요!
            </div>

            <img
              src={makdongImg}
              alt="취향을 알아보는 막둥이"
              className={styles.makdong}
            />

          </div>

          <h1 className={styles.questionTitle}>
            {currentQuestion.title}
          </h1>

          <p className={styles.questionDescription}>
            {currentQuestion.description}
          </p>

        </section>


        {/* 선택지 */}
        <section className={styles.optionsArea}>

          <div className={styles.optionGrid}>

            {currentQuestion.options.length > 0 ? (

              currentQuestion.options.map((option) => {
                const isSelected = selectedValues.includes(option.value)

                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`
                      ${styles.optionCard}
                      ${isSelected ? styles.selected : ''}
                    `}
                    onClick={() => handleSelect(option.value)}
                  >

                    {isSelected && (
                      <span className={styles.check}>
                        ✓
                      </span>
                    )}


                    <div className={styles.optionVisual}>

                      {option.image && (
                        <img
                          src={option.image}
                          alt=""
                          className={styles.optionImage}
                        />
                      )}

                      {!option.image && option.icon && (
                        <span className={styles.optionIcon}>
                          {option.icon}
                        </span>
                      )}

                    </div>


                    <div className={styles.optionText}>

                      <strong className={styles.optionLabel}>
                        {option.label}
                      </strong>

                      <span className={styles.optionDescription}>
                        {option.description}
                      </span>

                    </div>

                  </button>
                )
              })

            ) : (

              <div className={styles.placeholder}>
                다음 질문의 선택지를 여기에 추가하면 됩니다.
              </div>

            )}

          </div>


          {/* 안내 문구 */}
          <div className={styles.notice}>
            <span className={styles.noticeIcon}>i</span>
            선택한 취향은 언제든지 마이페이지에서 변경할 수 있어요.
          </div>


          {/* 이전 / 다음 */}
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
              onClick={handleNext}
              disabled={!hasAnswer}
            >
              {isLastStep ? '완료' : '다음'}
              <span>›</span>
            </button>

          </div>

        </section>

      </div>
    </main>
  )
}

export default PreferenceQuestions