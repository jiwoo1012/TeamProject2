import {
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  useNavigate,
} from 'react-router-dom'

import tavernWorld from '../../assets/images/ai/tavern/background/tavern-world.webp'

import makdongWelcome from '../../assets/images/ai/tavern/makdong/makdong-welcome.png'
import makdongRun from '../../assets/images/ai/tavern/makdong/makdong-run.png'

import customerManEnter from '../../assets/images/ai/tavern/customers/customer-man-enter.png'
import customerManSeat from '../../assets/images/ai/tavern/customers/customer-man-seat.png'

import customerWomanEnter from '../../assets/images/ai/tavern/customers/customer-woman-enter.png'
import customerWomanSeat from '../../assets/images/ai/tavern/customers/customer-woman-seat.png'

import customerManPortrait from '../../assets/images/ai/tavern/portraits/customer-man-portrait.png'
import customerWomanPortrait from '../../assets/images/ai/tavern/portraits/customer-woman-portrait.png'

import liquorStorageSign from '../../assets/images/ai/tavern/signs/sign-liquor-storage.png'
import kitchenSign from '../../assets/images/ai/tavern/signs/sign-kitchen.png'
import glassDisplaySign from '../../assets/images/ai/tavern/signs/sign-glass-display.png'

import {
  TAVERN_CUSTOMERS,
  TAVERN_OPTIONS,
} from '../../data/tavernGame'

import styles from './MakdongTavern.module.scss'


const CUSTOMER_IMAGES = {
  man: {
    enter: customerManEnter,
    seat: customerManSeat,
    portrait: customerManPortrait,
  },

  woman: {
    enter: customerWomanEnter,
    seat: customerWomanSeat,
    portrait: customerWomanPortrait,
  },
}


/*
  SCSS의 실제 막동이 너비가 450px이기 때문에
  위치 계산도 같은 값을 사용
*/
const CHARACTER_WIDTH = 450

const WORLD_WIDTH = 2900

const CHARACTER_START_X = 80

const SIDE_PADDING = 30

const MOVE_SPEED = 420

const INTERACTION_DISTANCE = 100

const CAMERA_FOCUS_RATIO = 0.38

const TYPE_SPEED = 27

const CUSTOMER_APPEAR_DELAY = 1800


const WORLD_OBJECTS = {
  customerEntrance: 430,

  liquor: 930,

  food: 1450,

  glass: 1930,

  table: 2480,
}


const EMPTY_SELECTIONS = {
  liquor: null,
  food: null,
  glass: null,
}


const QUEST_STEPS = [
  'talk',
  'liquor',
  'food',
  'glass',
  'serve',
]


const STAGE_INFO = {
  talk: {
    target: 'customerEntrance',

    title:
      '손님의 주문을 들어보자',

    prompt:
      '이야기 듣기',

    objective:
      '손님에게 가까이 가서 어떤 한상을 원하는지 들어보세요.',
  },

  liquor: {
    target: 'liquor',

    title:
      '어울리는 술을 골라보자',

    prompt:
      '술 고르기',

    objective:
      '손님이 이야기한 취향을 떠올리며 술을 골라주세요.',
  },

  food: {
    target: 'food',

    title:
      '술과 어울리는 안주를 준비하자',

    prompt:
      '안주 고르기',

    objective:
      '선택한 술과 손님의 취향에 어울리는 안주를 골라주세요.',
  },

  glass: {
    target: 'glass',

    title:
      '한상을 완성할 잔을 고르자',

    prompt:
      '술잔 고르기',

    objective:
      '마지막으로 분위기까지 어울리는 술잔을 선택해주세요.',
  },

  serve: {
    target: 'table',

    title:
      '완성한 한상을 손님께 내어드리자',

    prompt:
      '주안상 내어드리기',

    objective:
      '안쪽 자리에서 기다리는 손님에게 완성한 주안상을 가져다주세요.',
  },
}


const MakdongTavern = () => {
  const navigate =
    useNavigate()


  const viewportRef =
    useRef(null)


  const pressedKeysRef =
    useRef(new Set())


  const positionRef =
    useRef(
      CHARACTER_START_X
    )


  const animationFrameRef =
    useRef(null)


  const lastTimeRef =
    useRef(null)


  const movingRef =
    useRef(false)


  const gameStageRef =
    useRef('talk')


  const movementBlockedRef =
    useRef(false)


  const isNearTargetRef =
    useRef(false)


  const isCustomerVisibleRef =
    useRef(false)


  const typingTimerRef =
    useRef(null)


  const [
    viewportWidth,
    setViewportWidth,
  ] = useState(1200)


  const [
    gameStarted,
    setGameStarted,
  ] = useState(false)

  const [
    isCustomerVisible,
    setIsCustomerVisible,
  ] = useState(false)

  const [
    characterX,
    setCharacterX,
  ] = useState(
    CHARACTER_START_X
  )


  const [
    direction,
    setDirection,
  ] = useState('right')


  const [
    isMoving,
    setIsMoving,
  ] = useState(false)


  const [
    customerIndex,
    setCustomerIndex,
  ] = useState(0)


  const [
    gameStage,
    setGameStage,
  ] = useState('talk')


  const [
    customerAtTable,
    setCustomerAtTable,
  ] = useState(false)


  const [
    isNearTarget,
    setIsNearTarget,
  ] = useState(false)


  const [
    selections,
    setSelections,
  ] = useState({
    ...EMPTY_SELECTIONS,
  })


  const [
    currentScore,
    setCurrentScore,
  ] = useState(0)


  const [
    results,
    setResults,
  ] = useState([])


  const [
    isDialogueOpen,
    setIsDialogueOpen,
  ] = useState(false)


  const [
    dialogueIndex,
    setDialogueIndex,
  ] = useState(0)


  const [
    displayedText,
    setDisplayedText,
  ] = useState('')


  const [
    isTyping,
    setIsTyping,
  ] = useState(false)


  const [
    activeChoice,
    setActiveChoice,
  ] = useState(null)


  const [
    choiceFeedback,
    setChoiceFeedback,
  ] = useState(null)


  const [
    isCustomerResultOpen,
    setIsCustomerResultOpen,
  ] = useState(false)


  const [
    isQuestClear,
    setIsQuestClear,
  ] = useState(false)


  const currentCustomer =
    TAVERN_CUSTOMERS[
      customerIndex
    ]


  const currentCustomerImages =
    CUSTOMER_IMAGES[
      currentCustomer.characterKey
    ]


  const currentCustomerImage =
    customerAtTable
      ? currentCustomerImages.seat
      : currentCustomerImages.enter


  const currentStageInfo =
    STAGE_INFO[
      gameStage
    ]


  const currentQuestStep =
    QUEST_STEPS.indexOf(
      gameStage
    ) + 1


  const currentDialogueText =
    currentCustomer
      ?.dialogue[
        dialogueIndex
      ] ?? ''


  const currentMakdongImage =
    isMoving
      ? makdongRun
      : makdongWelcome


  const currentSatisfaction =
    Math.min(
      100,

      Math.round(
        (
          currentScore /
          90
        ) *
          100
      )
    )


  const movementBlocked =
    isDialogueOpen ||
    Boolean(activeChoice) ||
    isCustomerResultOpen ||
    isQuestClear


  useEffect(() => {
    gameStageRef.current =
      gameStage
  }, [gameStage])


  useEffect(() => {
    movementBlockedRef.current =
      movementBlocked
  }, [movementBlocked])


  useEffect(() => {
    isNearTargetRef.current =
      isNearTarget
  }, [isNearTarget])


  useEffect(() => {
    isCustomerVisibleRef.current =
      isCustomerVisible
  }, [isCustomerVisible])


  useEffect(() => {
    if (!gameStarted) {
      setIsCustomerVisible(false)

      return undefined
    }


    setIsCustomerVisible(false)


    const timer =
      window.setTimeout(
        () => {
          setIsCustomerVisible(true)
        },
        CUSTOMER_APPEAR_DELAY
      )


    return () => {
      window.clearTimeout(timer)
    }
  }, [
    gameStarted,
    customerIndex,
  ])


  useEffect(() => {
    if (!gameStarted) {
      return undefined
    }


    const element =
      viewportRef.current


    if (!element) {
      return undefined
    }


    const updateWidth = () => {
      setViewportWidth(
        element.clientWidth
      )
    }


    updateWidth()


    const observer =
      new ResizeObserver(
        updateWidth
      )


    observer.observe(
      element
    )


    return () => {
      observer.disconnect()
    }
  }, [gameStarted])


  const maxCameraX =
    Math.max(
      0,

      WORLD_WIDTH -
        viewportWidth
    )


  const cameraX =
    Math.max(
      0,

      Math.min(
        characterX -
          viewportWidth *
            CAMERA_FOCUS_RATIO,

        maxCameraX
      )
    )


  const customerWorldX =
    customerAtTable
      ? WORLD_OBJECTS.table
      : WORLD_OBJECTS.customerEntrance


  const getTargetX = (
    stage
  ) => {
    const info =
      STAGE_INFO[
        stage
      ]


    if (!info) {
      return null
    }


    return WORLD_OBJECTS[
      info.target
    ]
  }


  const resetCharacter = () => {
    positionRef.current =
      CHARACTER_START_X


    setCharacterX(
      CHARACTER_START_X
    )


    setDirection(
      'right'
    )


    setIsMoving(
      false
    )


    movingRef.current =
      false


    pressedKeysRef.current.clear()
  }


  const resetCurrentCustomer = () => {
    setIsCustomerVisible(
      false
    )


    setGameStage(
      'talk'
    )


    setCustomerAtTable(
      false
    )


    setSelections({
      ...EMPTY_SELECTIONS,
    })


    setCurrentScore(
      0
    )


    setDialogueIndex(
      0
    )


    setDisplayedText(
      ''
    )


    setIsDialogueOpen(
      false
    )


    setActiveChoice(
      null
    )


    setChoiceFeedback(
      null
    )


    setIsCustomerResultOpen(
      false
    )


    setIsNearTarget(
      false
    )


    resetCharacter()
  }


  const handleStartGame = () => {
    setCustomerIndex(
      0
    )


    setResults(
      []
    )


    setIsQuestClear(
      false
    )


    setGameStarted(
      true
    )


    resetCurrentCustomer()
  }


  useEffect(() => {
    if (
      !isDialogueOpen
    ) {
      return undefined
    }


    window.clearInterval(
      typingTimerRef.current
    )


    setDisplayedText(
      ''
    )


    setIsTyping(
      true
    )


    let index = 0


    typingTimerRef.current =
      window.setInterval(
        () => {
          index += 1


          setDisplayedText(
            currentDialogueText.slice(
              0,
              index
            )
          )


          if (
            index >=
            currentDialogueText.length
          ) {
            window.clearInterval(
              typingTimerRef.current
            )


            setIsTyping(
              false
            )
          }
        },

        TYPE_SPEED
      )


    return () => {
      window.clearInterval(
        typingTimerRef.current
      )
    }
  }, [
    isDialogueOpen,
    dialogueIndex,
    currentDialogueText,
  ])


  const finishTyping = () => {
    window.clearInterval(
      typingTimerRef.current
    )


    setDisplayedText(
      currentDialogueText
    )


    setIsTyping(
      false
    )
  }


  const openDialogue = () => {
    pressedKeysRef.current.clear()


    setIsMoving(
      false
    )


    movingRef.current =
      false


    setDialogueIndex(
      0
    )


    setIsDialogueOpen(
      true
    )
  }


  const handleDialogueNext = () => {
    if (
      isTyping
    ) {
      finishTyping()

      return
    }


    const lastIndex =
      currentCustomer
        .dialogue.length -
      1


    if (
      dialogueIndex <
      lastIndex
    ) {
      setDialogueIndex(
        (prev) =>
          prev + 1
      )

      return
    }


    setIsDialogueOpen(
      false
    )


    setDialogueIndex(
      0
    )


    setCustomerAtTable(
      true
    )


    setGameStage(
      'liquor'
    )


    setIsNearTarget(
      false
    )
  }


  const openChoice = (
    type
  ) => {
    pressedKeysRef.current.clear()


    setIsMoving(
      false
    )


    movingRef.current =
      false


    setChoiceFeedback(
      null
    )


    setActiveChoice(
      type
    )
  }


  const getChoiceLabel = (
    type
  ) => {
    if (
      type === 'liquor'
    ) {
      return '술'
    }


    if (
      type === 'food'
    ) {
      return '안주'
    }


    return '술잔'
  }


  const getChoiceQuestion = (
    type
  ) => {
    if (
      type === 'liquor'
    ) {
      return '어떤 술을 내어드릴까요?'
    }


    if (
      type === 'food'
    ) {
      return '어떤 안주를 함께 준비할까요?'
    }


    return '어떤 잔에 담아드릴까요?'
  }


  const getScoreFeedback = (
    score
  ) => {
    if (
      score >= 25
    ) {
      return {
        tone:
          'Best',

        label:
          '딱 맞는 선택',

        text:
          '손님이 말한 취향과 아주 잘 어울려요.',
      }
    }


    if (
      score >= 15
    ) {
      return {
        tone:
          'Good',

        label:
          '괜찮은 선택',

        text:
          '손님의 취향과 무난하게 잘 어울리는 선택이에요.',
      }
    }


    return {
      tone:
        'Miss',

      label:
        '조금 아쉬워요',

      text:
        '손님이 이야기한 취향을 한 번 더 떠올려보는 것도 좋겠어요.',
    }
  }


  const handleSelectChoice = (
    option
  ) => {
    if (
      !activeChoice
    ) {
      return
    }


    const score =
      currentCustomer
        .scores[
          activeChoice
        ][
          option.id
        ] ?? 0


    const feedback =
      getScoreFeedback(
        score
      )


    setSelections(
      (prev) => ({
        ...prev,

        [activeChoice]:
          option,
      })
    )


    setCurrentScore(
      (prev) =>
        prev + score
    )


    setChoiceFeedback({
      option,

      score,

      ...feedback,
    })
  }


  const handleChoiceContinue = () => {
    if (
      !choiceFeedback ||
      !activeChoice
    ) {
      return
    }


    const nextStage = {
      liquor:
        'food',

      food:
        'glass',

      glass:
        'serve',
    }


    setGameStage(
      nextStage[
        activeChoice
      ]
    )


    setChoiceFeedback(
      null
    )


    setActiveChoice(
      null
    )


    setIsNearTarget(
      false
    )
  }


  const handleServe = () => {
    pressedKeysRef.current.clear()


    setIsMoving(
      false
    )


    movingRef.current =
      false


    setIsCustomerResultOpen(
      true
    )
  }


  const getCustomerReaction = () => {
    if (
      currentSatisfaction >=
      80
    ) {
      return currentCustomer
        .reactions.high
    }


    if (
      currentSatisfaction >=
      55
    ) {
      return currentCustomer
        .reactions.medium
    }


    return currentCustomer
      .reactions.low
  }


  const finishCustomer = () => {
    const result = {
      customerId:
        currentCustomer.id,

      customerName:
        currentCustomer.name,

      satisfaction:
        currentSatisfaction,

      score:
        currentScore,

      selections,
    }


    const updatedResults = [
      ...results,
      result,
    ]


    setResults(
      updatedResults
    )


    const isLastCustomer =
      customerIndex ===
      TAVERN_CUSTOMERS.length -
        1


    if (
      isLastCustomer
    ) {
      setIsCustomerResultOpen(
        false
      )


      setIsQuestClear(
        true
      )

      return
    }


    setCustomerIndex(
      (prev) =>
        prev + 1
    )


    resetCurrentCustomer()
  }


  const averageSatisfaction =
    results.length > 0
      ? Math.round(
          results.reduce(
            (
              total,
              result
            ) =>
              total +
              result.satisfaction,

            0
          ) /
            results.length
        )
      : 0


  const handleInteraction = () => {
    if (
      !isNearTargetRef.current
    ) {
      return
    }


    if (
      gameStageRef.current === 'talk' &&
      !isCustomerVisibleRef.current
    ) {
      return
    }


    switch (
      gameStageRef.current
    ) {
      case 'talk':
        openDialogue()
        break


      case 'liquor':
        openChoice(
          'liquor'
        )
        break


      case 'food':
        openChoice(
          'food'
        )
        break


      case 'glass':
        openChoice(
          'glass'
        )
        break


      case 'serve':
        handleServe()
        break


      default:
        break
    }
  }


  useEffect(() => {
    if (
      !gameStarted
    ) {
      return undefined
    }


    const movementKeys = [
      'ArrowLeft',
      'ArrowRight',
      'a',
      'A',
      'd',
      'D',
    ]


    const handleKeyDown = (
      event
    ) => {
      if (
        isDialogueOpen
      ) {
        if (
          event.key === 'e' ||
          event.key === 'E' ||
          event.key === 'Enter' ||
          event.key === ' '
        ) {
          event.preventDefault()


          handleDialogueNext()
        }

        return
      }


      if (
        movementBlockedRef.current
      ) {
        return
      }


      if (
        event.key === 'e' ||
        event.key === 'E'
      ) {
        if (
          isNearTargetRef.current
        ) {
          event.preventDefault()


          handleInteraction()
        }

        return
      }


      if (
        !movementKeys.includes(
          event.key
        )
      ) {
        return
      }


      event.preventDefault()


      pressedKeysRef.current.add(
        event.key
      )
    }


    const handleKeyUp = (
      event
    ) => {
      pressedKeysRef.current.delete(
        event.key
      )
    }


    const handleBlur = () => {
      pressedKeysRef.current.clear()


      movingRef.current =
        false


      setIsMoving(
        false
      )
    }


    window.addEventListener(
      'keydown',
      handleKeyDown
    )


    window.addEventListener(
      'keyup',
      handleKeyUp
    )


    window.addEventListener(
      'blur',
      handleBlur
    )


    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown
      )


      window.removeEventListener(
        'keyup',
        handleKeyUp
      )


      window.removeEventListener(
        'blur',
        handleBlur
      )
    }
  }, [
    gameStarted,
    isDialogueOpen,
    isTyping,
    dialogueIndex,
    currentDialogueText,
    activeChoice,
    isCustomerResultOpen,
    isQuestClear,
    customerIndex,
  ])


  useEffect(() => {
    if (
      !gameStarted
    ) {
      return undefined
    }


    const updateCharacter = (
      currentTime
    ) => {
      if (
        !lastTimeRef.current
      ) {
        lastTimeRef.current =
          currentTime
      }


      const deltaTime =
        Math.min(
          (
            currentTime -
            lastTimeRef.current
          ) /
            1000,

          0.05
        )


      lastTimeRef.current =
        currentTime


      if (
        movementBlockedRef.current
      ) {
        pressedKeysRef.current.clear()


        if (
          movingRef.current
        ) {
          movingRef.current =
            false


          setIsMoving(
            false
          )
        }
      } else {
        const keys =
          pressedKeysRef.current


        const movingLeft =
          keys.has(
            'ArrowLeft'
          ) ||
          keys.has('a') ||
          keys.has('A')


        const movingRight =
          keys.has(
            'ArrowRight'
          ) ||
          keys.has('d') ||
          keys.has('D')


        let moveDirection =
          0


        if (
          movingLeft &&
          !movingRight
        ) {
          moveDirection =
            -1


          setDirection(
            'left'
          )
        }


        if (
          movingRight &&
          !movingLeft
        ) {
          moveDirection =
            1


          setDirection(
            'right'
          )
        }


        const moving =
          moveDirection !== 0


        if (
          movingRef.current !==
          moving
        ) {
          movingRef.current =
            moving


          setIsMoving(
            moving
          )
        }


        if (
          moving
        ) {
          const maxX =
            WORLD_WIDTH -
            CHARACTER_WIDTH -
            SIDE_PADDING


          const nextX =
            positionRef.current +
            moveDirection *
              MOVE_SPEED *
              deltaTime


          const clampedX =
            Math.max(
              SIDE_PADDING,

              Math.min(
                nextX,
                maxX
              )
            )


          positionRef.current =
            clampedX


          setCharacterX(
            clampedX
          )
        }
      }


      const targetX =
        getTargetX(
          gameStageRef.current
        )


      if (
        targetX !== null
      ) {
        const characterCenter =
          positionRef.current +
          CHARACTER_WIDTH /
            2


        const distance =
          Math.abs(
            characterCenter -
            targetX
          )


        const near =
          distance <=
          INTERACTION_DISTANCE


        if (
          isNearTargetRef.current !==
          near
        ) {
          isNearTargetRef.current =
            near


          setIsNearTarget(
            near
          )
        }
      }


      animationFrameRef.current =
        requestAnimationFrame(
          updateCharacter
        )
    }


    animationFrameRef.current =
      requestAnimationFrame(
        updateCharacter
      )


    return () => {
      lastTimeRef.current =
        null


      if (
        animationFrameRef.current
      ) {
        cancelAnimationFrame(
          animationFrameRef.current
        )
      }
    }
  }, [
    gameStarted,
  ])


  if (
    !gameStarted
  ) {
    return (
      <main
        className={
          styles.page
        }
      >
        <section
          className={
            styles.intro
          }
        >
          <img
            src={
              makdongWelcome
            }
            className={
              styles.introMakdong
            }
            alt="막동이"
          />


          <h1>
            막동이 주막,
            <br />
            오늘도 정상 영업합니다!
          </h1>


          <p>
            오늘 하루 막동이와 함께
            주막을 맡아보세요.
            <br />

            손님의 이야기를 듣고
            취향에 맞는 한상을
            차려주면 됩니다.
          </p>


          <div
            className={
              styles.introMission
            }
          >
            <span>
              오늘의 미션
            </span>

            <strong>
              손님 2명 만족시키기
            </strong>
          </div>


          <button
            type="button"
            className={
              styles.startButton
            }
            onClick={
              handleStartGame
            }
          >
            영업 시작하기
          </button>
        </section>
      </main>
    )
  }


  return (
    <main
      className={
        styles.page
      }
    >
      <section
        className={
          styles.gameShell
        }
      >

        <header
          className={
            styles.gameHud
          }
        >
          <strong>
            막동이 주막
          </strong>


          <div
            className={
              styles.hudStatus
            }
          >
            <span>
              손님{' '}
              {customerIndex + 1}
              {' / '}
              {
                TAVERN_CUSTOMERS.length
              }
            </span>


            <span>
              {gameStage ===
              'serve'
                ? '한상 준비 완료'
                : '영업 중'}
            </span>
          </div>
        </header>


        <div
          ref={
            viewportRef
          }
          className={
            styles.viewport
          }
        >

          {!isQuestClear && (
            <div
              key={
                gameStage
              }
              className={
                styles.questCard
              }
            >
              <div
                className={
                  styles.questCardTop
                }
              >
                <span
                  className={
                    styles.questBadge
                  }
                >
                  오늘의 의뢰
                </span>

                <span
                  className={
                    styles.questCount
                  }
                >
                  {currentQuestStep}
                  {' / '}
                  {QUEST_STEPS.length}
                </span>
              </div>


              <strong
                className={
                  styles.questTitle
                }
              >
                {
                  currentStageInfo
                    ?.title
                }
              </strong>


              <p
                className={
                  styles.questDescription
                }
              >
                {
                  currentStageInfo
                    ?.objective
                }
              </p>


              <div
                className={
                  styles.questProgress
                }
              >
                {QUEST_STEPS.map(
                  (
                    step,
                    index
                  ) => {
                    const stepNumber =
                      index + 1


                    const complete =
                      stepNumber <
                      currentQuestStep


                    const current =
                      step ===
                      gameStage


                    return (
                      <span
                        key={
                          step
                        }
                        className={[
                          complete
                            ? styles.questComplete
                            : '',

                          current
                            ? styles.questCurrent
                            : '',
                        ].join(' ')}
                      />
                    )
                  }
                )}
              </div>
            </div>
          )}


          <div
            className={
              styles.world
            }
            style={{
              width:
                `${WORLD_WIDTH}px`,

              transform:
                `translate3d(-${cameraX}px, 0, 0)`,

              backgroundImage:
                `url(${tavernWorld})`,
            }}
          >

            <div
              className={`${styles.signBoard} ${
                gameStage ===
                'liquor'
                  ? styles.signActive
                  : ''
              }`}
              style={{
                left:
                  `${WORLD_OBJECTS.liquor}px`,
              }}
            >
              <img
                src={
                  liquorStorageSign
                }
                alt="술곶간"
                draggable="false"
              />
            </div>


            <div
              className={`${styles.signBoard} ${
                gameStage ===
                'food'
                  ? styles.signActive
                  : ''
              }`}
              style={{
                left:
                  `${WORLD_OBJECTS.food}px`,
              }}
            >
              <img
                src={
                  kitchenSign
                }
                alt="주방"
                draggable="false"
              />
            </div>


            <div
              className={`${styles.signBoard} ${
                gameStage ===
                'glass'
                  ? styles.signActive
                  : ''
              }`}
              style={{
                left:
                  `${WORLD_OBJECTS.glass}px`,
              }}
            >
              <img
                src={
                  glassDisplaySign
                }
                alt="잔 진열대"
                draggable="false"
              />
            </div>


            <div
              key={`${currentCustomer.id}-${customerAtTable ? 'seat' : 'enter'}`}
              className={`${styles.customer} ${
                customerAtTable
                  ? styles.customerSeated
                  : styles.customerEntering
              }`}
              style={{
                left:
                  `${customerWorldX}px`,

                opacity:
                  isCustomerVisible
                    ? 1
                    : 0,

                transform:
                  `translateX(-50%) translateY(${
                    isCustomerVisible
                      ? '0px'
                      : '18px'
                  })`,

                filter:
                  isCustomerVisible
                    ? 'blur(0px)'
                    : 'blur(4px)',

                transition:
                  'left 1.15s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.8s ease, transform 0.85s cubic-bezier(0.16, 1, 0.3, 1), filter 0.8s ease',
              }}
            >
              <img
                src={
                  currentCustomerImage
                }
                alt={
                  currentCustomer.name
                }
                draggable="false"
              />

              {!customerAtTable && (
                <span>
                  {
                    currentCustomer.name
                  }
                </span>
              )}
            </div>


            <div
              className={
                styles.character
              }
              style={{
                left:
                  `${characterX}px`,

                /*
                  현재 달리는 원본 이미지가
                  왼쪽 방향을 보고 있어서
                  오른쪽 이동 시 반전
                */
                transform:
                  `scaleX(${
                    direction ===
                    'right'
                      ? -1
                      : 1
                  })`,
              }}
            >
              <div
                className={`${styles.characterInner} ${
                  isMoving
                    ? styles.walking
                    : ''
                }`}
              >
                <img
                  src={
                    currentMakdongImage
                  }
                  alt="막동이"
                  draggable="false"
                />
              </div>


              <div
                className={
                  styles.characterShadow
                }
              />
            </div>

          </div>


          {isNearTarget &&
            !movementBlocked &&
            (
              gameStage !== 'talk' ||
              isCustomerVisible
            ) && (
              <div
                className={
                  styles.worldPrompt
                }
              >
                <span
                  className={
                    styles.interactionKey
                  }
                >
                  E
                </span>

                <span>
                  {
                    currentStageInfo
                      ?.prompt
                  }
                </span>
              </div>
            )}


          {isDialogueOpen && (
            <div
              className={
                styles.dialogueOverlay
              }
            >
              <div
                className={
                  styles.dialogueBox
                }
              >
                <div
                  className={
                    styles.dialogueSpeaker
                  }
                >
                  <div
                    className={
                      styles.dialogueAvatar
                    }
                  >
                    <img
                      src={
                        currentCustomerImages.portrait
                      }
                      alt={`${currentCustomer.name} 프로필`}
                    />
                  </div>


                  <div>
                    <strong>
                      {
                        currentCustomer.name
                      }
                    </strong>
                  </div>
                </div>


                <div
                  className={
                    styles.dialogueContent
                  }
                >
                  <p>
                    {
                      displayedText
                    }

                    {isTyping && (
                      <i
                        className={
                          styles.typeCursor
                        }
                      />
                    )}
                  </p>


                  <button
                    type="button"
                    className={
                      styles.dialogueNext
                    }
                    onClick={
                      handleDialogueNext
                    }
                  >
                    <span>
                      {isTyping
                        ? '한번에 보기'
                        : dialogueIndex ===
                            currentCustomer
                              .dialogue
                              .length -
                              1
                          ? '주문 확인'
                          : '다음'}
                    </span>

                    <span
                      className={
                        styles.dialogueKey
                      }
                    >
                      E
                    </span>
                  </button>
                </div>


                <div
                  className={
                    styles.dialogueProgress
                  }
                >
                  {currentCustomer
                    .dialogue
                    .map(
                      (
                        _,
                        index
                      ) => (
                        <span
                          key={
                            index
                          }
                          className={
                            index <=
                            dialogueIndex
                              ? styles.dialogueProgressActive
                              : ''
                          }
                        />
                      )
                    )}
                </div>
              </div>
            </div>
          )}


          {activeChoice && (
            <div
              className={
                styles.choiceOverlay
              }
            >
              <div
                className={
                  styles.choicePanel
                }
              >
                {!choiceFeedback ? (
                  <>
                    <div
                      className={
                        styles.choiceHeader
                      }
                    >
                      <span>
                        {
                          getChoiceLabel(
                            activeChoice
                          )
                        }{' '}
                        고르기
                      </span>


                      <h2>
                        {
                          getChoiceQuestion(
                            activeChoice
                          )
                        }
                      </h2>


                      <div
                        className={
                          styles.requestTags
                        }
                      >
                        {currentCustomer
                          .request
                          .map(
                            (
                              keyword
                            ) => (
                              <span
                                key={
                                  keyword
                                }
                              >
                                {
                                  keyword
                                }
                              </span>
                            )
                          )}
                      </div>
                    </div>


                    <div
                      className={
                        styles.choiceGrid
                      }
                    >
                      {TAVERN_OPTIONS[
                        activeChoice
                      ].map(
                        (
                          option
                        ) => (
                          <button
                            key={
                              option.id
                            }
                            type="button"
                            className={
                              styles.choiceCard
                            }
                            onClick={() =>
                              handleSelectChoice(
                                option
                              )
                            }
                          >
                            <span
                              className={
                                styles.choiceEmoji
                              }
                            >
                              {
                                option.emoji
                              }
                            </span>


                            <strong>
                              {
                                option.name
                              }
                            </strong>


                            <p>
                              {
                                option.description
                              }
                            </p>


                            <span
                              className={
                                styles.choiceSelect
                              }
                            >
                              이걸로 할래요
                            </span>
                          </button>
                        )
                      )}
                    </div>
                  </>
                ) : (
                  <div
                    className={
                      styles.feedback
                    }
                  >
                    <span
                      className={`${styles.feedbackGrade} ${
                        styles[
                          `feedback${choiceFeedback.tone}`
                        ]
                      }`}
                    >
                      {
                        choiceFeedback.label
                      }
                    </span>


                    <div
                      className={
                        styles.feedbackEmoji
                      }
                    >
                      {
                        choiceFeedback
                          .option
                          .emoji
                      }
                    </div>


                    <h2>
                      {
                        choiceFeedback
                          .option
                          .name
                      }
                    </h2>


                    <p>
                      {
                        choiceFeedback.text
                      }
                    </p>


                    <button
                      type="button"
                      onClick={
                        handleChoiceContinue
                      }
                    >
                      다음 준비하기
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}


          {isCustomerResultOpen && (
            <div
              className={
                styles.resultOverlay
              }
            >
              <div
                className={
                  styles.resultPanel
                }
              >

                <div
                  className={
                    styles.resultVisual
                  }
                >
                  <span
                    className={
                      styles.resultVisualTitle
                    }
                  >
                    손님의 한마디
                  </span>


                  <img
                    src={
                      currentCustomerImages.seat
                    }
                    alt={
                      currentCustomer.name
                    }
                  />
                </div>


                <div
                  className={
                    styles.resultContent
                  }
                >
                  <span
                    className={
                      styles.resultLabel
                    }
                  >
                    오늘의 주안상
                  </span>


                  <h2>
                    {
                      currentCustomer.name
                    }
                    의 취향을
                    <br />
                    얼마나 잘 맞췄을까요?
                  </h2>


                  <div
                    className={
                      styles.tableSetting
                    }
                  >
                    {Object.entries(
                      selections
                    ).map(
                      ([
                        key,
                        item,
                      ]) =>
                        item && (
                          <div
                            key={
                              key
                            }
                          >
                            <span>
                              {
                                item.emoji
                              }
                            </span>

                            <strong>
                              {
                                item.name
                              }
                            </strong>
                          </div>
                        )
                    )}
                  </div>


                  <div
                    className={
                      styles.customerReaction
                    }
                  >
                    “
                    {
                      getCustomerReaction()
                    }
                    ”
                  </div>


                  <div
                    className={
                      styles.resultBottom
                    }
                  >
                    <div
                      className={
                        styles.satisfactionResult
                      }
                    >
                      <strong>
                        {
                          currentSatisfaction
                        }
                        %
                      </strong>

                      <span>
                        만족도
                      </span>
                    </div>


                    <button
                      type="button"
                      onClick={
                        finishCustomer
                      }
                    >
                      {customerIndex ===
                      TAVERN_CUSTOMERS.length -
                        1
                        ? '영업 마치기'
                        : '다음 손님 맞이하기'}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}


          {isQuestClear && (
            <div
              className={
                styles.clearOverlay
              }
            >
              <div
                className={
                  styles.clearPanel
                }
              >

                <div
                  className={
                    styles.clearVisual
                  }
                >
                  <span
                    className={
                      styles.clearStamp
                    }
                  >
                    영업 완료
                  </span>


                  <img
                    src={
                      makdongWelcome
                    }
                    alt="막동이"
                  />
                </div>


                <div
                  className={
                    styles.clearContent
                  }
                >
                  <span
                    className={
                      styles.clearLabel
                    }
                  >
                    오늘도 수고했어요!
                  </span>


                  <h2>
                    두 손님의 한상을
                    <br />
                    모두 완성했어요.
                  </h2>


                  <div
                    className={
                      styles.clearStats
                    }
                  >
                    <div>
                      <span>
                        평균 만족도
                      </span>

                      <strong>
                        {
                          averageSatisfaction
                        }
                        %
                      </strong>
                    </div>


                    <div>
                      <span>
                        맞이한 손님
                      </span>

                      <strong>
                        {
                          results.length
                        }
                        명
                      </strong>
                    </div>


                    <div>
                      <span>
                        받은 포인트
                      </span>

                      <strong>
                        +300P
                      </strong>
                    </div>
                  </div>


                  <div
                    className={
                      styles.aiBridge
                    }
                  >
                    <span>
                      막동이가 이번에는 당신의 취향이 궁금하대요.
                    </span>

                    <strong>
                      손님들의 한상을 골라봤으니,
                      <br />
                      이제 나에게 어울리는 한상도 만나볼까요?
                    </strong>
                  </div>


                  <div
                    className={
                      styles.clearActions
                    }
                  >
                    <button
                      type="button"
                      className={
                        styles.aiButton
                      }
                      onClick={() =>
                        navigate(
                          '/ai'
                        )
                      }
                    >
                      내 주안상 추천받기
                    </button>


                    <button
                      type="button"
                      className={
                        styles.retryButton
                      }
                      onClick={
                        handleStartGame
                      }
                    >
                      다시 영업하기
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>


        <footer
          className={
            styles.controls
          }
        >
          <div
            className={
              styles.controlGroup
            }
          >
            <span
              className={
                styles.key
              }
            >
              A
            </span>

            <span
              className={
                styles.key
              }
            >
              D
            </span>

            <span>
              이동
            </span>
          </div>


          <div
            className={
              styles.controlDivider
            }
          />


          <div
            className={
              styles.controlGroup
            }
          >
            <span
              className={
                styles.key
              }
            >
              ←
            </span>

            <span
              className={
                styles.key
              }
            >
              →
            </span>

            <span>
              이동
            </span>
          </div>


          <div
            className={
              styles.controlDivider
            }
          />


          <div
            className={
              styles.controlGroup
            }
          >
            <span
              className={
                styles.key
              }
            >
              E
            </span>

            <span>
              상호작용
            </span>
          </div>
        </footer>

      </section>
    </main>
  )
}


export default MakdongTavern