import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import { createPortal } from 'react-dom'

import cartGuideMakdong from '../../assets/images/shop/cart-guide-makdong.png'
import wishlistGuideMakdong from '../../assets/images/shop/wishlist-guide-makdong.png'

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
        담기를 누르시면
        <br />
        상품이 추가됩니다.
      </>
    ),
    secondText: (
      <>
        원하는 상품을 담아
        <br />
        구매해보세요!
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
        하트를 누르시면
        <br />
        찜 목록에 추가됩니다.
      </>
    ),
    secondText: (
      <>
        찜한 상품을 모아
        <br />
        한 번에 확인해보세요!
      </>
    ),
  },
]


const clamp = (value, min, max) =>
  Math.min(Math.max(value, min), max)


const getText = (element) =>
  `${element?.textContent ?? ''} ${element?.getAttribute?.('aria-label') ?? ''} ${element?.getAttribute?.('title') ?? ''}`
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()


const findButtonByWords = (root, words) => {
  if (!root) return null

  const candidates = [
    ...root.querySelectorAll('button, a, [role="button"]'),
  ]

  return candidates.find((element) => {
    const text = getText(element)
    return words.some((word) => text.includes(word.toLowerCase()))
  }) ?? null
}


const getRect = (element) => {
  if (!element) return null

  const rect = element.getBoundingClientRect()

  if (rect.width <= 2 || rect.height <= 2) {
    return null
  }

  return rect
}


const getCardImageRect = (card) => {
  if (!card) return null

  const images = [...card.querySelectorAll('img')]

  const image = images.find((item) => {
    const rect = item.getBoundingClientRect()
    return rect.width > 180 && rect.height > 180
  }) ?? images[0]

  return getRect(image)
}


const getCardFromWrapper = (wrapper) =>
  wrapper?.firstElementChild ?? wrapper


const getCandidateCards = () => {
  const explicit = [
    ...document.querySelectorAll(
      '[data-product-guide-card="candidate"], [data-product-guide-card]'
    ),
  ]
    .map(getCardFromWrapper)
    .filter(Boolean)

  if (explicit.length > 0) {
    return explicit
  }

  const cartButtons = [
    ...document.querySelectorAll('button, a, [role="button"]'),
  ].filter((element) => {
    const text = getText(element)
    return text.includes('장바구니') || text.includes('담기')
  })

  const inferred = cartButtons
    .map((button) => (
      button.closest('article, li, [class*="card"], [class*="Card"]')
      ?? button.parentElement?.parentElement?.parentElement
      ?? null
    ))
    .filter(Boolean)

  return [...new Set(inferred)]
}


const findTargetCard = () => {
  const cards = getCandidateCards()

  if (cards.length === 0) return null

  const purchasable = cards.find((card) => {
    const text = card.textContent ?? ''
    const cartButton = findButtonByWords(card, ['장바구니', '담기'])

    return !text.includes('품절') && cartButton
  })

  return (
    purchasable
    ?? cards.find((card) => !(card.textContent ?? '').includes('품절'))
    ?? cards[0]
  )
}


const fallbackTarget = (card, type) => {
  const baseRect = getCardImageRect(card) ?? getRect(card)

  if (!baseRect) {
    return {
      x: window.innerWidth * 0.38,
      y: window.innerHeight * 0.4,
      rect: null,
    }
  }

  if (type === 'wish') {
    return {
      x: baseRect.right - 30,
      y: baseRect.top + 30,
      rect: {
        left: baseRect.right - 52,
        top: baseRect.top + 8,
        width: 44,
        height: 44,
      },
    }
  }

  return {
    x: baseRect.left + baseRect.width / 2,
    y: baseRect.bottom - 30,
    rect: {
      left: baseRect.left + 18,
      top: baseRect.bottom - 58,
      width: Math.max(140, baseRect.width - 36),
      height: 42,
    },
  }
}


const ProductGuide = ({ enabled = true }) => {
  const [phase, setPhase] = useState('idle')
  const [step, setStep] = useState(0)
  const [primaryTarget, setPrimaryTarget] = useState(null)
  const [shortcutTarget, setShortcutTarget] = useState(null)
  const [barRect, setBarRect] = useState(null)

  const targetCardRef = useRef(null)
  const shortcutRef = useRef(null)
  const barRef = useRef(null)
  const startedRef = useRef(false)
  const openTimerRef = useRef(null)
  const closeTimerRef = useRef(null)

  const currentStep = GUIDE_STEPS[step]


  const measure = useCallback(() => {
    const card = targetCardRef.current
    if (!card) return

    const isCart = currentStep.id === 'cart'

    const targetButton = isCart
      ? findButtonByWords(card, ['장바구니', '담기'])
      : findButtonByWords(card, ['찜', 'wishlist', '♥', '♡'])

    const targetRect = getRect(targetButton)

    if (targetRect) {
      setPrimaryTarget({
        x: targetRect.left + targetRect.width / 2,
        y: targetRect.top + targetRect.height / 2,
        rect: {
          left: targetRect.left,
          top: targetRect.top,
          width: targetRect.width,
          height: targetRect.height,
        },
      })
    } else {
      setPrimaryTarget(fallbackTarget(card, currentStep.id))
    }

    const shortcutRect = getRect(shortcutRef.current)
    if (shortcutRect) {
      setShortcutTarget({
        x: shortcutRect.right - Math.min(34, shortcutRect.width * 0.14),
        y: shortcutRect.top + shortcutRect.height / 2,
        rect: {
          left: shortcutRect.left,
          top: shortcutRect.top,
          width: shortcutRect.width,
          height: shortcutRect.height,
        },
      })
    }

    const measuredBar = getRect(barRef.current)
    if (measuredBar) {
      setBarRect({
        left: measuredBar.left,
        top: measuredBar.top,
        right: measuredBar.right,
        bottom: measuredBar.bottom,
        width: measuredBar.width,
        height: measuredBar.height,
      })
    }
  }, [currentStep.id])


  const finishGuide = useCallback(({ hideToday = false } = {}) => {
    if (hideToday) {
      localStorage.setItem(
        HIDDEN_UNTIL_KEY,
        String(Date.now() + DAY_IN_MS)
      )
    }

    setPhase('closing')

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'auto',
    })

    window.clearTimeout(closeTimerRef.current)

    closeTimerRef.current = window.setTimeout(() => {
      setPhase('idle')
      setStep(0)
      setPrimaryTarget(null)
      setShortcutTarget(null)
      setBarRect(null)
    }, 240)
  }, [])


  const handleNext = () => {
    if (step < GUIDE_STEPS.length - 1) {
      setStep((current) => current + 1)
      return
    }

    finishGuide()
  }


  const handlePrevious = () => {
    setStep((current) => Math.max(0, current - 1))
  }


  useEffect(() => {
    if (!enabled || startedRef.current) {
      return undefined
    }

    const hiddenUntil = Number(
      localStorage.getItem(HIDDEN_UNTIL_KEY) || 0
    )

    if (hiddenUntil > Date.now()) {
      return undefined
    }

    if (hiddenUntil > 0) {
      localStorage.removeItem(HIDDEN_UNTIL_KEY)
    }

    startedRef.current = true
    setPhase('preparing')

    let attempts = 0
    let retryTimer = null

    const prepare = () => {
      const card = findTargetCard()

      if (!card && attempts < 50) {
        attempts += 1
        retryTimer = window.setTimeout(prepare, 100)
        return
      }

      if (!card) {
        setPhase('idle')
        return
      }

      targetCardRef.current = card

      const cardRect = card.getBoundingClientRect()
      const desiredTop = clamp(window.innerHeight * 0.16, 120, 165)

      window.scrollTo({
        top: Math.max(0, window.scrollY + cardRect.top - desiredTop),
        left: 0,
        behavior: 'auto',
      })

      openTimerRef.current = window.setTimeout(() => {
        setStep(0)
        setPhase('open')
      }, 120)
    }

    retryTimer = window.setTimeout(prepare, 100)

    return () => {
      window.clearTimeout(retryTimer)
      window.clearTimeout(openTimerRef.current)
    }
  }, [enabled])


  useEffect(() => {
    if (phase !== 'preparing' && phase !== 'open' && phase !== 'closing') {
      return undefined
    }

    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow

    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
    }
  }, [phase])


  useEffect(() => {
    if (phase !== 'open') return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        finishGuide()
        return
      }

      if (event.key === 'ArrowRight') {
        handleNext()
      }

      if (event.key === 'ArrowLeft' && step > 0) {
        handlePrevious()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [finishGuide, phase, step])


  useLayoutEffect(() => {
    if (phase !== 'open') return undefined

    let frame = null

    const update = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(measure)
    }

    update()
    window.addEventListener('resize', update)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', update)
    }
  }, [measure, phase, step])


  useEffect(() => () => {
    window.clearTimeout(openTimerRef.current)
    window.clearTimeout(closeTimerRef.current)
  }, [])


  if (phase === 'idle') {
    return null
  }

  const viewportWidth = window.innerWidth
  const viewportHeight = window.innerHeight

  const safeBarTop = barRect?.top ?? (viewportHeight - 210)

  const primaryCallout = primaryTarget
    ? currentStep.id === 'cart'
      ? {
          left: clamp(primaryTarget.x + 28, 28, viewportWidth - 300),
          top: clamp(primaryTarget.y - 150, 110, safeBarTop - 145),
        }
      : {
          left: clamp(primaryTarget.x - 250, 28, viewportWidth - 300),
          top: clamp(primaryTarget.y + 30, 115, safeBarTop - 145),
        }
    : null

  const shortcutCallout = shortcutTarget
    ? {
        left: clamp(shortcutTarget.x - 235, 28, viewportWidth - 300),
        top: clamp(
          (barRect?.top ?? shortcutTarget.y) - 112,
          130,
          safeBarTop - 95
        ),
      }
    : null

  const primaryArrowStart = primaryCallout
    ? currentStep.id === 'cart'
      ? {
          x: primaryCallout.left + 18,
          y: primaryCallout.top + 56,
        }
      : {
          x: primaryCallout.left + 230,
          y: primaryCallout.top + 18,
        }
    : null

  const shortcutArrowStart = shortcutCallout
    ? {
        x: shortcutCallout.left + 205,
        y: shortcutCallout.top + 58,
      }
    : null


  return createPortal(
    <div
      className={`${styles.guideRoot} ${phase === 'closing' ? styles.closing : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="스토어 이용 안내"
    >
      <div className={styles.backdrop} aria-hidden="true" />

      {phase === 'open' && (
        <>
          <div className={styles.topActions}>
            <button
              className={styles.closeButton}
              type="button"
              aria-label="스토어 이용 안내 닫기"
              onClick={() => finishGuide()}
            >
              ×
            </button>

            <button
              className={styles.hideToday}
              type="button"
              onClick={() => finishGuide({ hideToday: true })}
            >
              <span aria-hidden="true">✓</span>
              하루동안 보지 않기
            </button>
          </div>

          {primaryTarget?.rect && (
            <div
              className={`${styles.targetGhost} ${styles[currentStep.theme]} ${styles[currentStep.id]}`}
              style={{
                left: primaryTarget.rect.left,
                top: primaryTarget.rect.top,
                width: primaryTarget.rect.width,
                height: primaryTarget.rect.height,
              }}
              aria-hidden="true"
            >
              {currentStep.id === 'cart' ? '장바구니 담기' : '♡'}
            </div>
          )}

          {primaryCallout && (
            <div className={styles.callout} style={primaryCallout}>
              <span className={`${styles.numberBadge} ${styles[currentStep.theme]}`}>1</span>
              <strong>{currentStep.firstText}</strong>
            </div>
          )}

          {shortcutCallout && (
            <div className={styles.callout} style={shortcutCallout}>
              <span className={`${styles.numberBadge} ${styles[currentStep.theme]}`}>2</span>
              <strong>{currentStep.secondText}</strong>
            </div>
          )}

          <svg
            className={styles.arrowLayer}
            viewBox={`0 0 ${viewportWidth} ${viewportHeight}`}
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <defs>
              <marker
                id="product-guide-arrow"
                markerWidth="8"
                markerHeight="8"
                refX="6.5"
                refY="4"
                orient="auto"
              >
                <path
                  d="M0,0 L8,4 L0,8"
                  fill="none"
                  stroke="rgba(255,255,255,.94)"
                  strokeWidth="1.3"
                />
              </marker>
            </defs>

            {primaryTarget && primaryArrowStart && (
              <path
                d={
                  currentStep.id === 'cart'
                    ? `M ${primaryArrowStart.x} ${primaryArrowStart.y} C ${primaryArrowStart.x - 38} ${primaryArrowStart.y + 12}, ${primaryTarget.x + 34} ${primaryTarget.y - 28}, ${primaryTarget.x} ${primaryTarget.y}`
                    : `M ${primaryArrowStart.x} ${primaryArrowStart.y} C ${primaryArrowStart.x + 24} ${primaryArrowStart.y - 18}, ${primaryTarget.x - 28} ${primaryTarget.y + 24}, ${primaryTarget.x} ${primaryTarget.y}`
                }
                markerEnd="url(#product-guide-arrow)"
              />
            )}

            {shortcutTarget && shortcutArrowStart && (
              <path
                d={`M ${shortcutArrowStart.x} ${shortcutArrowStart.y} C ${shortcutArrowStart.x + 28} ${shortcutArrowStart.y + 18}, ${shortcutTarget.x - 42} ${shortcutTarget.y - 36}, ${shortcutTarget.x} ${shortcutTarget.y}`}
                markerEnd="url(#product-guide-arrow)"
              />
            )}
          </svg>

          <section
            ref={barRef}
            className={`${styles.featureBar} ${styles[currentStep.theme]}`}
            aria-live="polite"
          >
            <div className={styles.characterWrap} aria-hidden="true">
              <img src={currentStep.character} alt="" />
            </div>

            <div className={styles.demoItems} aria-hidden="true">
              {Array.from({ length: 4 }).map((_, index) => (
                <span className={styles.demoItem} key={index}>
                  <i>×</i>
                </span>
              ))}

              <span className={styles.addItem}>+</span>
            </div>

            <button
              ref={shortcutRef}
              className={styles.mockShortcut}
              type="button"
              tabIndex={-1}
              aria-label={`${currentStep.shortcutLabel} 안내 예시`}
            >
              {currentStep.shortcutLabel}
              <span aria-hidden="true">→</span>
            </button>
          </section>

          <div className={styles.bottomControls}>
            <span className={styles.pageCount}>
              {step + 1} / {GUIDE_STEPS.length}
            </span>

            <div className={styles.controlRow}>
              {step === 0 ? (
                <button
                  className={styles.skipButton}
                  type="button"
                  onClick={() => finishGuide()}
                >
                  ← SKIP
                </button>
              ) : (
                <button
                  className={styles.skipButton}
                  type="button"
                  onClick={handlePrevious}
                >
                  ← BACK
                </button>
              )}

              <span className={styles.divider} aria-hidden="true" />

              <button
                className={styles.nextButton}
                type="button"
                onClick={handleNext}
              >
                {step === GUIDE_STEPS.length - 1 ? 'DONE' : 'NEXT →'}
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
