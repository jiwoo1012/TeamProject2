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

// Q3 무게감
import bodyLightImg from '../../assets/icons/preferenceQuestions/body-light.png'
import bodyMediumImg from '../../assets/icons/preferenceQuestions/body-medium.png'
import bodyHighImg from '../../assets/icons/preferenceQuestions/body-full.png'

// Q4 향
import aromaMildImg from '../../assets/icons/preferenceQuestions/aroma-mild.png'
import aromaMediumImg from '../../assets/icons/preferenceQuestions/aroma-medium.png'
import aromaStrongImg from '../../assets/icons/preferenceQuestions/aroma-strong.png'

// Q5 도수
import ABVLightImg from '../../assets/icons/preferenceQuestions/ABV-light.png'
import ABVModerateImg from '../../assets/icons/preferenceQuestions/ABV-moderate.png'
import ABVStrongImg from '../../assets/icons/preferenceQuestions/ABV-strong.png'
import ABVVeryStrongImg from '../../assets/icons/preferenceQuestions/ABV-verystrong.png'

import styles from './PreferenceQuestions.module.scss'


const QUESTIONS = [
  // Q1 단맛
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

  // Q2 신맛
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

  // Q3 무게감
  {
    id: 'body',
    category: '무게감',
    title: '입안에서 어느 정도 무게감이 느껴지는 술을 좋아하나요?',
    description:
      '가볍게 퍼지는 술부터 진하고 묵직한 술까지, 평소 더 편하게 느끼는 쪽을 골라주세요.',
    type: 'single',
    options: [
      {
        value: 'light',
        label: '가볍고 깔끔한 술',
        description: '입안에 오래 남지 않고 가볍게 마실 수 있는 술',
        image: bodyLightImg,
      },
      {
        value: 'medium',
        label: '적당한 무게감의 술',
        description: '가볍지도 무겁지도 않은 균형 잡힌 술',
        image: bodyMediumImg,
      },
      {
        value: 'full',
        label: '진하고 묵직한 술',
        description: '풍미와 여운이 입안에 오래 남는 술',
        image: bodyHighImg,
      },
      {
        value: 'unknown',
        label: '아직 잘 모르겠어요',
        description: '어떤 무게감이 좋은지 아직 잘 모르겠어요',
        icon: '?',
      },
    ],
  },

  // Q4 향
  {
    id: 'aroma',
    category: '향',
    title: '향은 어느 정도 또렷한 게 좋나요?',
    description: '술잔을 들었을 때 향이 얼마나 느껴졌으면 좋을까요?',
    type: 'single',
    options: [
      {
        value: 'mild',
        label: '은은한 향',
        description: '향이 튀지 않고 편안한 게 좋아요.',
        image: aromaMildImg,
      },
      {
        value: 'medium',
        label: '적당히 느껴지는 향',
        description: '마실 때 자연스럽게 향이 느껴지면 좋아요.',
        image: aromaMediumImg,
      },
      {
        value: 'strong',
        label: '향이 확실한 술',
        description:
          '과실·꽃·곡물·허브처럼 개성 있는 향이 또렷한 게 좋아요.',
        image: aromaStrongImg,
      },
      {
        value: 'any',
        label: '향은 크게 상관없어요',
        description: '향의 강도는 크게 중요하지 않아요.',
        icon: '?',
      },
    ],
  },

  // Q5 도수
  {
    id: 'abv',
    category: '도수',
    title: '평소 어느 정도 도수가 편한가요?',
    description: '부담 없이 즐길 수 있는 정도를 알려주세요.',
    type: 'single',
    options: [
      {
        value: 'light',
        label: '가볍게',
        description: '10도 이하',
        image: ABVLightImg,
      },
      {
        value: 'moderate',
        label: '적당하게',
        description: '11~16도',
        image: ABVModerateImg,
      },
      {
        value: 'strong',
        label: '제법 진하게',
        description: '17~25도',
        image: ABVStrongImg,
      },
      {
        value: 'veryStrong',
        label: '강한 술도 좋아요',
        description: '26도 이상',
        image: ABVVeryStrongImg,
      },
      {
        value: 'any',
        label: '도수는 크게 상관없어요',
        description: '술의 도수는 크게 중요하지 않아요.',
        icon: '?',
      },
    ],
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

  const isAbvQuestion = currentQuestion.id === 'abv'


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
      navigate('/preference/safety-intro')
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

          <div
            className={`
              ${styles.optionGrid}
              ${isAbvQuestion ? styles.fiveOptions : ''}
            `}
          >

            {currentQuestion.options.map((option) => {
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
            })}

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