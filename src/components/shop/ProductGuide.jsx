import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import { createPortal } from 'react-dom'

import cartGuideMakdong
  from '../../assets/images/shop/cart-guide-makdong.png'
import wishlistGuideMakdong
  from '../../assets/images/shop/wishlist-guide-makdong.png'

import styles from './ProductGuide.module.scss'


const HIDDEN_UNTIL_KEY = 'jajak_product_guide_hidden_until'
const DAY_IN_MS = 24 * 60 * 60 * 1000


const GUIDE_STEPS = [
  {
    id: 'cart',
    theme: 'cart',
    character: cartGuideMakdong,
    shortcutLabel: '장바구니 바로가기',

    firstText: (
      <>
        상품의 <b>장바구니 담기</b>를 누르면
        <br />
        아래 장바구니에 추가돼요.
      </>
    ),

    secondText: (
      <>
        담은 상품을 확인하고
        <br />
        바로 장바구니로 이동할 수 있어요.
      </>
    ),
  },

  {
    id: 'wish',
    theme: 'wish',
    character: wishlistGuideMakdong,
    shortcutLabel: '찜 목록 바로가기',

    firstText: (
      <>
        상품의 <b>하트</b>를 누르면
        <br />
        찜 목록에 저장돼요.
      </>
    ),

    secondText: (
      <>
        찜한 상품을 모아서
        <br />
        한 번에 확인할 수 있어요.
      </>
    ),
  },
]


const clamp = (value, min, max) =>
  Math.min(
    Math.max(value, min),
    Math.max(min, max)
  )


const getText = (element) =>
  `${element?.textContent ?? ''} ${
    element?.getAttribute?.('aria-label') ?? ''
  } ${
    element?.getAttribute?.('title') ?? ''
  }`
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()


const getRect = (element) => {
  if (!element) {
    return null
  }

  const rect = element.getBoundingClientRect()

  if (
    rect.width <= 2
    || rect.height <= 2
  ) {
    return null
  }

  return {
    left: rect.left,
    top: rect.top,
    right: rect.right,
    bottom: rect.bottom,
    width: rect.width,
    height: rect.height,
  }
}


const findButtonByWords = (
  root,
  words
) => {
  if (!root) {
    return null
  }

  const candidates = [
    ...root.querySelectorAll(
      'button, a, [role="button"]'
    ),
  ]

  return (
    candidates.find((element) => {
      const text = getText(element)

      return words.some((word) =>
        text.includes(
          word.toLowerCase()
        )
      )
    })
    ?? null
  )
}


const getTargetButton = (
  card,
  type
) => {
  if (!card) {
    return null
  }

  const explicit =
    card.querySelector(
      `[data-product-guide-target="${type}"]`
    )

  if (explicit) {
    return explicit
  }

  if (type === 'cart') {
    return findButtonByWords(
      card,
      ['장바구니', '담기']
    )
  }

  return findButtonByWords(
    card,
    [
      '찜',
      'wishlist',
      '♥',
      '♡',
    ]
  )
}


const getCandidateCards = () => {
  const explicit = [
    ...document.querySelectorAll(
      '[data-product-guide-card="candidate"]'
    ),
  ]

  if (explicit.length > 0) {
    return explicit
  }


  const cartButtons = [
    ...document.querySelectorAll(
      'button, a, [role="button"]'
    ),
  ].filter((element) => {
    const text = getText(element)

    return (
      text.includes('장바구니')
      || text.includes('담기')
    )
  })


  const inferred =
    cartButtons
      .map((button) =>
        button.closest(
          'article, li, [class*="card"], [class*="Card"]'
        )
      )
      .filter(Boolean)


  return [
    ...new Set(inferred),
  ]
}


const findTargetCard = () => {
  const cards =
    getCandidateCards()

  if (
    cards.length === 0
  ) {
    return null
  }


  const purchasable =
    cards.find((card) => {
      const text =
        card.textContent ?? ''

      return (
        !text.includes('품절')
        && getTargetButton(
          card,
          'cart'
        )
      )
    })


  return (
    purchasable
    ?? cards.find(
      (card) =>
        !(
          card.textContent ?? ''
        ).includes('품절')
    )
    ?? cards[0]
  )
}


const fallbackTarget = (
  card,
  type
) => {
  const cardRect =
    getRect(card)

  if (!cardRect) {
    return null
  }


  if (type === 'wish') {
    const rect = {
      left:
        cardRect.right - 54,

      top:
        cardRect.top + 14,

      width: 42,
      height: 42,
    }

    return {
      x:
        rect.left
        + rect.width / 2,

      y:
        rect.top
        + rect.height / 2,

      rect,
    }
  }


  const rect = {
    left:
      cardRect.left + 20,

    top:
      cardRect.bottom - 58,

    width:
      Math.max(
        140,
        cardRect.width - 40
      ),

    height: 42,
  }


  return {
    x:
      rect.left
      + rect.width / 2,

    y:
      rect.top
      + rect.height / 2,

    rect,
  }
}


const ProductGuide = ({
  enabled = true,
}) => {
  const [phase, setPhase] =
    useState('idle')

  const [step, setStep] =
    useState(0)

  const [
    primaryTarget,
    setPrimaryTarget,
  ] = useState(null)

  const [
    shortcutTarget,
    setShortcutTarget,
  ] = useState(null)

  const [
    barRect,
    setBarRect,
  ] = useState(null)


  const targetCardRef =
    useRef(null)

  const shortcutRef =
    useRef(null)

  const barRef =
    useRef(null)

  const startedRef =
    useRef(false)

  const openTimerRef =
    useRef(null)

  const closeTimerRef =
    useRef(null)


  const currentStep =
    GUIDE_STEPS[step]


  // ========================================
  // TARGET MEASURE
  // ========================================

  const measure =
    useCallback(() => {
      const card =
        targetCardRef.current

      if (!card) {
        return
      }


      const targetButton =
        getTargetButton(
          card,
          currentStep.id
        )


      const targetRect =
        getRect(targetButton)


      if (targetRect) {
        setPrimaryTarget({
          x:
            targetRect.left
            + targetRect.width / 2,

          y:
            targetRect.top
            + targetRect.height / 2,

          rect:
            targetRect,
        })
      } else {
        setPrimaryTarget(
          fallbackTarget(
            card,
            currentStep.id
          )
        )
      }


      const shortcutRect =
        getRect(
          shortcutRef.current
        )


      if (shortcutRect) {
        setShortcutTarget({
          x:
            shortcutRect.left
            + shortcutRect.width / 2,

          y:
            shortcutRect.top
            + shortcutRect.height / 2,

          rect:
            shortcutRect,
        })
      }


      const measuredBar =
        getRect(
          barRef.current
        )


      if (measuredBar) {
        setBarRect(
          measuredBar
        )
      }
    }, [
      currentStep.id,
    ])


  // ========================================
  // CLOSE
  // ========================================

  const finishGuide =
    useCallback(
      ({
        hideToday = false,
      } = {}) => {
        if (hideToday) {
          localStorage.setItem(
            HIDDEN_UNTIL_KEY,
            String(
              Date.now()
              + DAY_IN_MS
            )
          )
        }


        setPhase('closing')


        window.clearTimeout(
          closeTimerRef.current
        )


        closeTimerRef.current =
          window.setTimeout(
            () => {
              const card =
                targetCardRef.current


              if (card) {
                card.removeAttribute(
                  'data-product-guide-active'
                )
              }


              setPhase('idle')
              setStep(0)

              setPrimaryTarget(null)
              setShortcutTarget(null)
              setBarRect(null)

              targetCardRef.current =
                null
            },
            220
          )
      },
      []
    )


  const handleNext = () => {
    if (
      step
      < GUIDE_STEPS.length - 1
    ) {
      setStep(
        (current) =>
          current + 1
      )

      return
    }

    finishGuide()
  }


  const handlePrevious = () => {
    setStep(
      (current) =>
        Math.max(
          0,
          current - 1
        )
    )
  }


  // ========================================
  // START
  // ========================================

  useEffect(() => {
    if (
      !enabled
      || startedRef.current
    ) {
      return undefined
    }


    const hiddenUntil =
      Number(
        localStorage.getItem(
          HIDDEN_UNTIL_KEY
        ) || 0
      )


    if (
      hiddenUntil
      > Date.now()
    ) {
      return undefined
    }


    if (
      hiddenUntil > 0
    ) {
      localStorage.removeItem(
        HIDDEN_UNTIL_KEY
      )
    }


    startedRef.current =
      true

    setPhase(
      'preparing'
    )


    let attempts = 0
    let retryTimer = null


    const prepare = () => {
      const card =
        findTargetCard()


      if (
        !card
        && attempts < 50
      ) {
        attempts += 1

        retryTimer =
          window.setTimeout(
            prepare,
            100
          )

        return
      }


      if (!card) {
        setPhase('idle')

        return
      }


      targetCardRef.current =
        card


      /*
       * 실제 hover 상태 먼저 강제.
       * 장바구니 담기 / 하트가
       * 렌더링된 상태에서 측정한다.
       */
      card.setAttribute(
        'data-product-guide-active',
        'true'
      )


      /*
       * 여기 중요.
       *
       * 하단 가이드 바가 카드의
       * 장바구니 버튼을 덮지 않도록
       * 카드 자체를 화면 위쪽으로 올린다.
       */
      const cardRect =
        card.getBoundingClientRect()


      const targetCardTop =
        clamp(
          window.innerHeight * 0.12,
          95,
          125
        )


      const nextScrollY =
        Math.max(
          0,
          window.scrollY
          + cardRect.top
          - targetCardTop
        )


      window.scrollTo({
        top: nextScrollY,
        left: 0,
        behavior: 'auto',
      })


      /*
       * 스크롤 + hover CSS가
       * 실제 DOM에 반영된 다음 open
       */
      openTimerRef.current =
        window.setTimeout(
          () => {
            setStep(0)
            setPhase('open')
          },
          180
        )
    }


    retryTimer =
      window.setTimeout(
        prepare,
        100
      )


    return () => {
      window.clearTimeout(
        retryTimer
      )

      window.clearTimeout(
        openTimerRef.current
      )
    }
  }, [
    enabled,
  ])


  // ========================================
  // SCROLL LOCK
  //
  // preparing에는 절대 막지 않음.
  // 먼저 상품 카드 위치를 위로 옮긴 뒤
  // open 상태에서만 스크롤 잠금.
  // ========================================

  useEffect(() => {
    if (
      phase !== 'open'
      && phase !== 'closing'
    ) {
      return undefined
    }


    const previousBodyOverflow =
      document.body.style.overflow

    const previousHtmlOverflow =
      document
        .documentElement
        .style
        .overflow


    document.body.style.overflow =
      'hidden'

    document
      .documentElement
      .style
      .overflow =
      'hidden'


    return () => {
      document.body.style.overflow =
        previousBodyOverflow

      document
        .documentElement
        .style
        .overflow =
        previousHtmlOverflow
    }
  }, [
    phase,
  ])


  // ========================================
  // MEASURE
  // ========================================

  useLayoutEffect(() => {
    if (
      phase !== 'open'
    ) {
      return undefined
    }


    let firstFrame = null
    let secondFrame = null


    const update = () => {
      window.cancelAnimationFrame(
        firstFrame
      )

      window.cancelAnimationFrame(
        secondFrame
      )


      firstFrame =
        window.requestAnimationFrame(
          () => {
            secondFrame =
              window.requestAnimationFrame(
                measure
              )
          }
        )
    }


    update()


    window.addEventListener(
      'resize',
      update
    )


    return () => {
      window.cancelAnimationFrame(
        firstFrame
      )

      window.cancelAnimationFrame(
        secondFrame
      )

      window.removeEventListener(
        'resize',
        update
      )
    }
  }, [
    phase,
    step,
    measure,
  ])


  // ========================================
  // KEYBOARD
  // ========================================

  useEffect(() => {
    if (
      phase !== 'open'
    ) {
      return undefined
    }


    const handleKeyDown = (
      event
    ) => {
      if (
        event.key
        === 'Escape'
      ) {
        finishGuide()

        return
      }


      if (
        event.key
        === 'ArrowRight'
      ) {
        handleNext()

        return
      }


      if (
        event.key
        === 'ArrowLeft'
        && step > 0
      ) {
        handlePrevious()
      }
    }


    document.addEventListener(
      'keydown',
      handleKeyDown
    )


    return () => {
      document.removeEventListener(
        'keydown',
        handleKeyDown
      )
    }
  }, [
    phase,
    step,
    finishGuide,
  ])


  // ========================================
  // CLEANUP
  // ========================================

  useEffect(
    () => () => {
      window.clearTimeout(
        openTimerRef.current
      )

      window.clearTimeout(
        closeTimerRef.current
      )


      const card =
        targetCardRef.current


      if (card) {
        card.removeAttribute(
          'data-product-guide-active'
        )
      }
    },
    []
  )


  if (
    phase === 'idle'
  ) {
    return null
  }


  const viewportWidth =
    window.innerWidth

  const viewportHeight =
    window.innerHeight


  const isMobile =
    viewportWidth <= 640


  const calloutWidth =
    isMobile
      ? 178
      : 250


  // ========================================
  // CALLOUT 1
  // ========================================

  let primaryCallout =
    null


  if (
    primaryTarget?.rect
  ) {
    const rect =
      primaryTarget.rect


    if (
      currentStep.id
      === 'cart'
    ) {
      /*
       * 장바구니:
       * 실제 버튼의 바로 위.
       *
       * top을 계산하지 않고
       * bottom 기준으로 잡아서
       * 텍스트 높이에 상관없이
       * 절대 버튼과 겹치지 않음.
       */
      const left =
        clamp(
          primaryTarget.x
          - calloutWidth / 2,

          18,

          viewportWidth
          - calloutWidth
          - 18
        )


      primaryCallout = {
        left,

        bottom:
          viewportHeight
          - rect.top
          + 22,
      }
    } else {
      /*
       * 찜은 현재 화면이 괜찮았으므로
       * 왼쪽에 배치.
       */
      const left =
        clamp(
          rect.left
          - calloutWidth
          - 24,

          18,

          viewportWidth
          - calloutWidth
          - 18
        )


      const top =
        clamp(
          rect.top - 4,

          80,

          viewportHeight - 180
        )


      primaryCallout = {
        left,
        top,
      }
    }
  }


  // ========================================
  // CALLOUT 2
  // ========================================

  let shortcutCallout =
    null


  if (
    shortcutTarget?.rect
    && barRect
  ) {
    const rect =
      shortcutTarget.rect


    const left =
      clamp(
        shortcutTarget.x
        - calloutWidth / 2,

        18,

        viewportWidth
        - calloutWidth
        - 18
      )


    /*
     * 버튼의 TOP 기준으로
     * 안내 박스 전체를 위에 둔다.
     *
     * 높이가 몇 줄이든
     * 버튼과 절대 겹치지 않는다.
     */
    shortcutCallout = {
      left,

      bottom:
        viewportHeight
        - rect.top
        + 20,
    }
  }


  return createPortal(
    <div
      className={`
        ${styles.guideRoot}
        ${
          phase === 'closing'
            ? styles.closing
            : ''
        }
      `}
      role="dialog"
      aria-modal="true"
      aria-label="스토어 이용 안내"
    >
      {(
        phase !== 'open'
        || !primaryTarget?.rect
      ) && (
        <div
          className={
            styles.backdrop
          }
          aria-hidden="true"
        />
      )}


      {phase === 'open' && (
        <>
          {/* =========================
              SPOTLIGHT
          ========================= */}

          {primaryTarget?.rect && (
            <div
              className={`
                ${styles.spotlight}
                ${
                  styles[
                    currentStep.theme
                  ]
                }
                ${
                  styles[
                    currentStep.id
                  ]
                }
              `}
              style={{
                left:
                  primaryTarget
                    .rect
                    .left
                  - (
                    currentStep.id
                    === 'wish'
                      ? 8
                      : 6
                  ),

                top:
                  primaryTarget
                    .rect
                    .top
                  - (
                    currentStep.id
                    === 'wish'
                      ? 8
                      : 5
                  ),

                width:
                  primaryTarget
                    .rect
                    .width
                  + (
                    currentStep.id
                    === 'wish'
                      ? 16
                      : 12
                  ),

                height:
                  primaryTarget
                    .rect
                    .height
                  + (
                    currentStep.id
                    === 'wish'
                      ? 16
                      : 10
                  ),
              }}
              aria-hidden="true"
            />
          )}


          {/* =========================
              TOP ACTIONS
          ========================= */}

          <div
            className={
              styles.topActions
            }
          >
            <button
              className={
                styles.closeButton
              }
              type="button"
              aria-label="스토어 이용 안내 닫기"
              onClick={() =>
                finishGuide()
              }
            >
              ×
            </button>


            <button
              className={
                styles.hideToday
              }
              type="button"
              onClick={() =>
                finishGuide({
                  hideToday: true,
                })
              }
            >
              <span
                aria-hidden="true"
              >
                ✓
              </span>

              하루동안 보지 않기
            </button>
          </div>


          {/* =========================
              CALLOUT 1
          ========================= */}

          {primaryCallout && (
            <div
              className={`
                ${styles.callout}
                ${
                  currentStep.id
                  === 'cart'
                    ? styles.cartCallout
                    : styles.wishCallout
                }
              `}
              style={{
                ...primaryCallout,

                width:
                  calloutWidth,
              }}
            >
              <span
                className={`
                  ${styles.numberBadge}
                  ${
                    styles[
                      currentStep.theme
                    ]
                  }
                `}
              >
                1
              </span>


              <strong>
                {
                  currentStep.firstText
                }
              </strong>
            </div>
          )}


          {/* =========================
              CALLOUT 2
          ========================= */}

          {shortcutCallout && (
            <div
              className={`
                ${styles.callout}
                ${styles.shortcutCallout}
              `}
              style={{
                ...shortcutCallout,

                width:
                  calloutWidth,
              }}
            >
              <span
                className={`
                  ${styles.numberBadge}
                  ${
                    styles[
                      currentStep.theme
                    ]
                  }
                `}
              >
                2
              </span>


              <strong>
                {
                  currentStep.secondText
                }
              </strong>
            </div>
          )}


          {/* =========================
              FEATURE BAR
          ========================= */}

          <section
            ref={barRef}
            className={`
              ${styles.featureBar}
              ${
                styles[
                  currentStep.theme
                ]
              }
            `}
            aria-live="polite"
          >
            <div
              className={
                styles.characterWrap
              }
              aria-hidden="true"
            >
              <img
                src={
                  currentStep.character
                }
                alt=""
              />
            </div>


            <div
              className={
                styles.demoItems
              }
              aria-hidden="true"
            >
              {Array
                .from({
                  length: 4,
                })
                .map(
                  (_, index) => (
                    <span
                      className={
                        styles.demoItem
                      }
                      key={index}
                    >
                      <i>×</i>
                    </span>
                  )
                )}


              <span
                className={
                  styles.addItem
                }
              >
                +
              </span>
            </div>


            <button
              ref={shortcutRef}
              className={
                styles.mockShortcut
              }
              type="button"
              tabIndex={-1}
              aria-label={`${currentStep.shortcutLabel} 안내 예시`}
            >
              {
                currentStep
                  .shortcutLabel
              }


              <span
                aria-hidden="true"
              >
                →
              </span>
            </button>
          </section>


          {/* =========================
              BOTTOM CONTROLS
          ========================= */}

          <div
            className={
              styles.bottomControls
            }
          >
            <span
              className={
                styles.pageCount
              }
            >
              {step + 1}
              {' / '}
              {
                GUIDE_STEPS.length
              }
            </span>


            <div
              className={
                styles.controlRow
              }
            >
              {step === 0 ? (
                <button
                  className={
                    styles.skipButton
                  }
                  type="button"
                  onClick={() =>
                    finishGuide()
                  }
                >
                  ← SKIP
                </button>
              ) : (
                <button
                  className={
                    styles.skipButton
                  }
                  type="button"
                  onClick={
                    handlePrevious
                  }
                >
                  ← BACK
                </button>
              )}


              <span
                className={
                  styles.divider
                }
                aria-hidden="true"
              />


              <button
                className={
                  styles.nextButton
                }
                type="button"
                onClick={
                  handleNext
                }
              >
                {
                  step
                  === GUIDE_STEPS.length
                    - 1
                    ? 'DONE'
                    : 'NEXT →'
                }
              </button>
            </div>
          </div>
        </>
      )}
    </div>,
    document.body
  )
}


export default ProductGuide