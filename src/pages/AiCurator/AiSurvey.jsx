import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'

import { auth } from '../../firebase/firebase'

import GuestChoiceModal from './GuestChoiceModal'

import styles from './AiSurvey.module.scss'


// ========================================
// 로그인 회원용 질문
// ========================================

const MEMBER_QUESTIONS = [
  {
    id: 'mood',
    type: 'single',
    title: '오늘은 어떤 한 잔을 원하시나요?',
    description:
      '오늘의 시간을 알려주시면 막둥이가 분위기까지 맞춰볼게요!',
    options: [
      {
        value: 'refresh',
        emoji: '🌿',
        label: '가볍게 기분 전환하고 싶어요',
      },
      {
        value: 'relax',
        emoji: '😌',
        label: '조용히 쉬면서 하루를 마무리하고 싶어요',
      },
      {
        value: 'food',
        emoji: '🍽️',
        label: '맛있는 안주와 함께 제대로 즐기고 싶어요',
      },
      {
        value: 'special',
        emoji: '✨',
        label: '평소보다 특별한 분위기를 내고 싶어요',
      },
      {
        value: 'deep',
        emoji: '🌙',
        label: '깊은 풍미를 천천히 즐기고 싶어요',
      },
      {
        value: 'random',
        emoji: '🎲',
        label: '오늘은 막둥이에게 맡길래요',
      },
    ],
  },

  {
    id: 'taste',
    type: 'single',
    title: '오늘은 어떤 느낌의 술이 끌리나요?',
    description:
      '평소 취향과 달라도 괜찮아요. 오늘 당기는 쪽을 골라주세요.',
    options: [
      {
        value: 'sweet',
        emoji: '🍯',
        label: '달콤하고 부드럽게',
      },
      {
        value: 'sour',
        emoji: '🍋',
        label: '새콤하고 산뜻하게',
      },
      {
        value: 'clean',
        emoji: '💧',
        label: '깔끔하고 가볍게',
      },
      {
        value: 'savory',
        emoji: '🌾',
        label: '구수하고 담백하게',
      },
      {
        value: 'rich',
        emoji: '🌙',
        label: '진하고 묵직하게',
      },
      {
        value: 'bitter',
        emoji: '🌿',
        label: '쌉싸름하고 개성 있게',
      },
      {
        value: 'preference',
        emoji: '🐾',
        label: '평소 제 취향대로 골라주세요',
      },
    ],
  },

  {
    id: 'alcohol',
    type: 'single',
    title: '오늘은 어느 정도 도수가 좋나요?',
    description:
      '평소와 다른 느낌이 당긴다면 오늘 기준으로 알려주세요.',
    options: [
      {
        value: 'light',
        emoji: '🫧',
        label: '가볍게 즐길래요',
        subLabel: '10도 이하',
      },
      {
        value: 'medium',
        emoji: '🍶',
        label: '적당하게',
        subLabel: '11~16도',
      },
      {
        value: 'strong',
        emoji: '🔥',
        label: '제법 진하게',
        subLabel: '17~25도',
      },
      {
        value: 'veryStrong',
        emoji: '🥃',
        label: '강한 술도 좋아요',
        subLabel: '26도 이상',
      },
      {
        value: 'preference',
        emoji: '🐾',
        label: '평소 제 취향대로 골라주세요',
      },
      {
        value: 'any',
        emoji: '👀',
        label: '오늘은 도수 상관없어요',
      },
    ],
  },

  {
    id: 'food',
    type: 'single',
    title: '오늘은 어떤 안주가 당기나요?',
    description:
      '술과 함께 놓일 한 접시도 골라볼까요?',
    options: [
      {
        value: 'meal',
        emoji: '🍳',
        label: '따뜻하게 만들어 먹는 간편식',
      },
      {
        value: 'snack',
        emoji: '🥢',
        label: '간단하게 꺼내 먹는 상온 안주',
      },
      {
        value: 'dessert',
        emoji: '🍡',
        label: '달콤하거나 고소한 디저트',
      },
      {
        value: 'recommend',
        emoji: '🍶',
        label: '술에 가장 잘 어울리는 걸 추천해주세요',
      },
    ],
  },
]


// ========================================
// 비회원용 질문
// ========================================

const GUEST_QUESTIONS = [
  {
    id: 'taste',
    type: 'multiple',
    maxSelections: 2,
    title: '오늘은 어떤 맛의 술이 끌리나요?',
    description:
      '처음이어도 괜찮아요! 오늘 당기는 맛을 골라주세요.',
    hint: '복수 선택 · 최대 2개',
    options: [
      {
        value: 'sweet',
        emoji: '🍯',
        label: '달콤하고 부드러운 맛',
      },
      {
        value: 'sour',
        emoji: '🍋',
        label: '새콤하고 산뜻한 맛',
      },
      {
        value: 'savory',
        emoji: '🌾',
        label: '구수하고 담백한 맛',
      },
      {
        value: 'clean',
        emoji: '💧',
        label: '깔끔하고 개운한 맛',
      },
      {
        value: 'dry',
        emoji: '🌿',
        label: '쌉싸름하고 드라이한 맛',
      },
      {
        value: 'unknown',
        emoji: '🤔',
        label: '아직 잘 모르겠어요',
        exclusive: true,
      },
    ],
  },

  {
    id: 'alcohol',
    type: 'single',
    title: '오늘은 어느 정도의 술이 편한가요?',
    description:
      '가볍게 한잔할지, 진하게 즐길지 알려주세요.',
    hint: '단일 선택',
    options: [
      {
        value: 'light',
        emoji: '🫧',
        label: '가볍고 부담 없이',
        subLabel: '낮은 도수에 가볍게 넘어가는 술이 좋아요',
      },
      {
        value: 'medium',
        emoji: '🍶',
        label: '적당하고 균형 있게',
        subLabel: '너무 가볍지도, 무겁지도 않은 술이 좋아요',
      },
      {
        value: 'strong',
        emoji: '🌙',
        label: '진하고 묵직하게',
        subLabel: '도수와 풍미가 어느 정도 느껴지는 술이 좋아요',
      },
      {
        value: 'veryStrong',
        emoji: '🥃',
        label: '강한 술도 좋아요',
        subLabel: '높은 도수와 강한 풍미도 괜찮아요',
      },
      {
        value: 'any',
        emoji: '👀',
        label: '잘 모르겠어요 / 크게 상관없어요',
      },
    ],
  },

  {
    id: 'mood',
    type: 'single',
    title: '오늘은 어떤 시간을 보내고 싶나요?',
    description:
      '오늘의 한 잔이 어떤 시간이 되었으면 좋을까요?',
    hint: '단일 선택',
    options: [
      {
        value: 'refresh',
        emoji: '🌿',
        label: '가볍게 기분 전환하고 싶어요',
      },
      {
        value: 'relax',
        emoji: '😌',
        label: '조용히 쉬면서 하루를 마무리하고 싶어요',
      },
      {
        value: 'food',
        emoji: '🍽️',
        label: '맛있는 안주와 함께 제대로 즐기고 싶어요',
      },
      {
        value: 'special',
        emoji: '✨',
        label: '평소보다 조금 특별하게 즐기고 싶어요',
      },
      {
        value: 'deep',
        emoji: '🌙',
        label: '깊은 풍미를 천천히 음미하고 싶어요',
      },
      {
        value: 'random',
        emoji: '🎲',
        label: '오늘은 막둥이에게 맡길래요',
      },
    ],
  },

  {
    id: 'food',
    type: 'single',
    title: '오늘은 어떤 안주와 함께하고 싶나요?',
    description:
      '한 잔 옆에 어떤 한 접시를 놓아볼까요?',
    hint: '단일 선택',
    options: [
      {
        value: 'meal',
        emoji: '🍳',
        label: '따뜻하고 든든하게 즐기는 간편식',
      },
      {
        value: 'snack',
        emoji: '🥢',
        label: '간단하게 곁들이는 상온 안주',
      },
      {
        value: 'dessert',
        emoji: '🍡',
        label: '달콤하거나 고소한 디저트',
      },
      {
        value: 'recommend',
        emoji: '🐾',
        label: '술에 가장 잘 어울리는 안주로 골라주세요',
      },
    ],
  },

  {
    id: 'avoidIngredients',
    type: 'multiple',
    title: '마지막 안전 확인. 피해야 하는 재료가 있나요?',
    description:
      '막둥이가 안전하게 골라드릴 수 있도록 꼭 확인해주세요.',
    hint: '복수 선택 · 필수 응답',
    isSafety: true,
    options: [
      {
        value: 'none',
        emoji: '✅',
        label: '해당 사항 없어요',
        exclusive: true,
      },
      {
        value: 'wheat',
        label: '밀',
      },
      {
        value: 'buckwheat',
        label: '메밀',
      },
      {
        value: 'soy',
        label: '대두(콩)',
      },
      {
        value: 'nuts',
        label: '견과류',
      },
      {
        value: 'peanut',
        label: '땅콩',
      },
      {
        value: 'sesame',
        label: '참깨',
      },
      {
        value: 'dairy',
        label: '우유·유제품',
      },
      {
        value: 'egg',
        label: '달걀',
      },
      {
        value: 'fish',
        label: '생선류',
      },
      {
        value: 'mollusk',
        label: '연체류(오징어·골뱅이 등)',
      },
      {
        value: 'pork',
        label: '돼지고기',
      },
      {
        value: 'honey',
        label: '벌꿀',
      },
      {
        value: 'fruitPlant',
        label: '특정 과일·식물 원료',
      },
      {
        value: 'other',
        label: '기타 / 직접 입력',
      },
    ],
  },
]


const AiSurvey = () => {
  const navigate = useNavigate()

  const [isAuthLoading, setIsAuthLoading] = useState(true)
  const [isMember, setIsMember] = useState(false)
  const [isGuestMode, setIsGuestMode] = useState(false)

  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState({})
  const [otherIngredient, setOtherIngredient] = useState('')


  // ========================================
  // 로그인 상태 확인
  // ========================================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        const member = Boolean(
          user &&
          !user.isAnonymous
        )

        setIsMember(member)
        setIsAuthLoading(false)
      }
    )

    return () => unsubscribe()
  }, [])


  // ========================================
  // 로그인 페이지 이동
  // ========================================
  const handleLogin = () => {
    navigate('/login', {
      state: {
        from: '/ai/survey',
      },
    })
  }


  // ========================================
  // 비회원으로 계속하기
  // ========================================
  const handleGuest = () => {
    setIsGuestMode(true)
    setCurrentStep(0)
    setAnswers({})
  }


  // ========================================
  // 모달 닫기
  // ========================================
  const handleClose = () => {
    navigate('/ai')
  }


  // ========================================
  // 현재 사용해야 할 질문
  // ========================================
  const questions =
    isMember
      ? MEMBER_QUESTIONS
      : GUEST_QUESTIONS

  const currentQuestion =
    questions[currentStep]


  // ========================================
  // 단일 선택
  // ========================================
  const handleSingleSelect = (
    questionId,
    value
  ) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }))
  }


  // ========================================
  // 복수 선택
  // ========================================
  const handleMultipleSelect = (
    question,
    option
  ) => {
    const currentValues =
      answers[question.id] || []

    const isSelected =
      currentValues.includes(
        option.value
      )

    // 이미 선택된 항목 → 해제
    if (isSelected) {
      setAnswers((prev) => ({
        ...prev,
        [question.id]:
          currentValues.filter(
            (value) =>
              value !== option.value
          ),
      }))

      if (option.value === 'other') {
        setOtherIngredient('')
      }

      return
    }


    // 단독 선택 옵션
    if (option.exclusive) {
      setAnswers((prev) => ({
        ...prev,
        [question.id]: [
          option.value,
        ],
      }))

      setOtherIngredient('')

      return
    }


    // 기존 단독 선택 옵션 제거
    const exclusiveValues =
      question.options
        .filter(
          (item) =>
            item.exclusive
        )
        .map(
          (item) =>
            item.value
        )

    const filteredValues =
      currentValues.filter(
        (value) =>
          !exclusiveValues.includes(
            value
          )
      )


    // 최대 선택 개수 제한
    if (
      question.maxSelections &&
      filteredValues.length >=
        question.maxSelections
    ) {
      return
    }


    setAnswers((prev) => ({
      ...prev,
      [question.id]: [
        ...filteredValues,
        option.value,
      ],
    }))
  }


  // ========================================
  // 선택 처리
  // ========================================
  const handleSelect = (
    question,
    option
  ) => {
    if (
      question.type ===
      'multiple'
    ) {
      handleMultipleSelect(
        question,
        option
      )

      return
    }

    handleSingleSelect(
      question.id,
      option.value
    )
  }


  // ========================================
  // 현재 질문 응답 여부 확인
  // ========================================
  const isAnswered = () => {
    if (!currentQuestion) {
      return false
    }

    const answer =
      answers[currentQuestion.id]

    if (
      currentQuestion.type ===
      'multiple'
    ) {
      if (
        !Array.isArray(answer) ||
        answer.length === 0
      ) {
        return false
      }

      // 기타 선택 시 직접 입력 필수
      if (
        currentQuestion.id ===
          'avoidIngredients' &&
        answer.includes('other') &&
        !otherIngredient.trim()
      ) {
        return false
      }

      return true
    }

    return Boolean(answer)
  }


  // ========================================
  // 다음
  // ========================================
  const handleNext = () => {
    if (!isAnswered()) {
      return
    }

    const isLastQuestion =
      currentStep ===
      questions.length - 1

    if (isLastQuestion) {
      const finalAnswers = {
        ...answers,
      }

      if (
        !isMember &&
        answers.avoidIngredients?.includes(
          'other'
        )
      ) {
        finalAnswers.otherIngredient =
          otherIngredient.trim()
      }

      navigate('/ai/result', {
        state: {
          surveyType:
            isMember
              ? 'member'
              : 'guest',

          answers:
            finalAnswers,
        },
      })

      return
    }

    setCurrentStep(
      (prev) => prev + 1
    )
  }


  // ========================================
  // 이전
  // ========================================
  const handlePrev = () => {
    if (currentStep === 0) {
      navigate('/ai')
      return
    }

    setCurrentStep(
      (prev) => prev - 1
    )
  }


  // ========================================
  // Firebase 인증 확인 중
  // ========================================
  if (isAuthLoading) {
    return (
      <div
        className={
          styles.loadingPage
        }
      >
        <div
          className={
            styles.loadingSpinner
          }
        />
      </div>
    )
  }


  // ========================================
  // 비로그인 사용자
  // 비회원 진행 선택 전
  // ========================================
  if (
    !isMember &&
    !isGuestMode
  ) {
    return (
      <div
        className={
          styles.guestPage
        }
      >
        <GuestChoiceModal
          isOpen
          onLogin={handleLogin}
          onGuest={handleGuest}
          onClose={handleClose}
        />
      </div>
    )
  }


  // ========================================
  // 실제 설문
  // ========================================

  const selectedAnswer =
    answers[currentQuestion.id]

  const progress =
    ((currentStep + 1) /
      questions.length) *
    100

  const isLastQuestion =
    currentStep ===
    questions.length - 1


  return (
    <main
      className={
        styles.surveyPage
      }
    >
      <div
        className={
          styles.surveyContainer
        }
      >

        {/* 진행 상태 */}
        <div
          className={
            styles.progressArea
          }
        >
          <div
            className={
              styles.progressTop
            }
          >
            <span
              className={
                styles.surveyType
              }
            >
              {isMember
                ? '오늘의 주안상'
                : '막둥이와 취향 찾기'}
            </span>

            <div
              className={
                styles.progressText
              }
            >
              <strong>
                {currentStep + 1}
              </strong>

              <span>
                / {questions.length}
              </span>
            </div>
          </div>

          <div
            className={
              styles.progressBar
            }
          >
            <div
              className={
                styles.progressFill
              }
              style={{
                width: `${progress}%`,
              }}
            />
          </div>
        </div>


        {/* 질문 카드 */}
        <section
          className={`${styles.questionCard} ${
            currentQuestion.isSafety
              ? styles.safetyCard
              : ''
          }`}
        >

          {/* Q */}
          <span
            className={
              styles.questionNumber
            }
          >
            {currentQuestion.isSafety
              ? 'SAFETY'
              : `Q${currentStep + 1}`}
          </span>


          {/* 제목 */}
          <div
            className={
              styles.questionHeader
            }
          >
            <h1
              className={
                styles.questionTitle
              }
            >
              {currentQuestion.title}
            </h1>

            <p
              className={
                styles.questionDescription
              }
            >
              {
                currentQuestion.description
              }
            </p>

            {currentQuestion.hint && (
              <span
                className={
                  styles.questionHint
                }
              >
                {currentQuestion.hint}
              </span>
            )}
          </div>


          {/* 일반 선택지 */}
          {!currentQuestion.isSafety && (
            <div
              className={
                styles.optionList
              }
            >
              {currentQuestion.options.map(
                (option) => {
                  const isSelected =
                    currentQuestion.type ===
                    'multiple'
                      ? (
                          selectedAnswer ||
                          []
                        ).includes(
                          option.value
                        )
                      : selectedAnswer ===
                        option.value

                  return (
                    <button
                      type="button"
                      key={
                        option.value
                      }
                      className={`${styles.optionButton} ${
                        isSelected
                          ? styles.selected
                          : ''
                      }`}
                      onClick={() =>
                        handleSelect(
                          currentQuestion,
                          option
                        )
                      }
                      aria-pressed={
                        isSelected
                      }
                    >
                      <div
                        className={
                          styles.optionContent
                        }
                      >
                        <span
                          className={
                            styles.optionEmoji
                          }
                        >
                          {
                            option.emoji
                          }
                        </span>

                        <div
                          className={
                            styles.optionText
                          }
                        >
                          <span
                            className={
                              styles.optionLabel
                            }
                          >
                            {
                              option.label
                            }
                          </span>

                          {option.subLabel && (
                            <span
                              className={
                                styles.optionSubLabel
                              }
                            >
                              {
                                option.subLabel
                              }
                            </span>
                          )}
                        </div>
                      </div>


                      <span
                        className={`${styles.selectIndicator} ${
                          isSelected
                            ? styles.selectIndicatorActive
                            : ''
                        }`}
                      >
                        {currentQuestion.type ===
                        'multiple' ? (
                          isSelected
                            ? '✓'
                            : ''
                        ) : (
                          <span
                            className={
                              isSelected
                                ? styles.radioDot
                                : ''
                            }
                          />
                        )}
                      </span>
                    </button>
                  )
                }
              )}
            </div>
          )}


          {/* 안전 확인 */}
          {currentQuestion.isSafety && (
            <div
              className={
                styles.safetyOptionGrid
              }
            >
              {currentQuestion.options.map(
                (option) => {
                  const isSelected =
                    (
                      selectedAnswer ||
                      []
                    ).includes(
                      option.value
                    )

                  return (
                    <div
                      key={
                        option.value
                      }
                      className={
                        option.value ===
                          'none'
                          ? styles.safetyWide
                          : ''
                      }
                    >
                      <button
                        type="button"
                        className={`${styles.safetyOption} ${
                          isSelected
                            ? styles.safetySelected
                            : ''
                        }`}
                        onClick={() =>
                          handleSelect(
                            currentQuestion,
                            option
                          )
                        }
                        aria-pressed={
                          isSelected
                        }
                      >
                        <span
                          className={
                            styles.checkbox
                          }
                        >
                          {isSelected &&
                            '✓'}
                        </span>

                        {option.emoji && (
                          <span>
                            {
                              option.emoji
                            }
                          </span>
                        )}

                        <span>
                          {
                            option.label
                          }
                        </span>
                      </button>
                    </div>
                  )
                }
              )}


              {(
                selectedAnswer ||
                []
              ).includes('other') && (
                <div
                  className={
                    styles.otherInputArea
                  }
                >
                  <label
                    htmlFor="otherIngredient"
                  >
                    피해야 하는 재료를
                    입력해주세요.
                  </label>

                  <input
                    id="otherIngredient"
                    type="text"
                    value={
                      otherIngredient
                    }
                    onChange={(e) =>
                      setOtherIngredient(
                        e.target.value
                      )
                    }
                    placeholder="예: 복숭아, 계피 등"
                    maxLength={50}
                  />
                </div>
              )}
            </div>
          )}


          {/* 버튼 */}
          <div
            className={
              styles.buttonArea
            }
          >
            <button
              type="button"
              className={
                styles.prevButton
              }
              onClick={
                handlePrev
              }
            >
              ← 이전
            </button>

            <button
              type="button"
              className={
                styles.nextButton
              }
              onClick={
                handleNext
              }
              disabled={
                !isAnswered()
              }
            >
              {isLastQuestion
                ? '막둥이 추천 보기'
                : '다음으로'}

              <span>
                →
              </span>
            </button>
          </div>

        </section>


        {/* 안내 */}
        <p
          className={
            styles.helperText
          }
        >
          {isMember
            ? '저장된 취향과 오늘의 답변을 함께 살펴보고 있어요.'
            : currentQuestion.isSafety
              ? '안전 확인 정보는 추천 상품을 제외하는 데 사용돼요.'
              : '조금만 더 알려주시면 막둥이가 오늘의 주안상을 골라드릴게요.'}
        </p>

      </div>
    </main>
  )
}


export default AiSurvey