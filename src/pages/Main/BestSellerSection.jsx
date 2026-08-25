import { useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { Link } from 'react-router-dom'

import styles from './MainPage.module.scss'

const productImages = import.meta.glob('../../assets/images/products/product*.png', {
  eager: true,
  import: 'default',
})

const resolveProductImage = (imageUrl) => Object.entries(productImages)
  .find(([path]) => path.endsWith(`/${imageUrl}`))?.[1]

const IS_SCROLL_SEQUENCE_ENABLED = true

const BestSellerSection = ({
  products,
  sectionRef,
  nextSectionRef,
  transitionActiveRef,
}) => {
  const [isRevealComplete, setIsRevealComplete] = useState(false)
  const cardRefs = useRef([])
  const displayProducts = products.length > 0
    ? products
    : Array.from({ length: 4 }, (_, index) => ({
        productId: `placeholder-${index}`,
        isPlaceholder: true,
      }))
  const cardCount = displayProducts.length

  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!IS_SCROLL_SEQUENCE_ENABLED || !section || !cardCount) return undefined

    let scrollTween
    let exitTimeline
    let transitionCard
    let isMoving = false
    let currentStep = 0
    let lastStepTime = 0
    let finalStepReachedAt = 0
    let exitWheelDelta = 0
    let exitWheelResetTimer
    let removeWheelHandler = () => {}

    const context = gsap.context(() => {
      const cards = cardRefs.current.slice(0, cardCount)
      gsap.set(cards, { autoAlpha: 0, y: 48, scale: 0.94 })

      const setCardsForStep = (step) => {
        cards.forEach((card, index) => {
          gsap.set(card, {
            autoAlpha: index < step ? 1 : 0,
            y: index < step ? 0 : 48,
            scale: index < step ? 1 : 0.94,
          })
        })
      }

      const handleWheel = (event) => {
        const sectionStart = section.offsetTop
        const sectionEnd = sectionStart + section.offsetHeight - window.innerHeight
        const currentScroll = window.scrollY
        if (currentScroll < sectionStart - 2 || currentScroll > sectionEnd + 2) return

        const direction = Math.sign(event.deltaY)
        if (!direction) return
        if (transitionActiveRef.current) {
          event.preventDefault()
          return
        }

        const currentIndex = currentStep
        const targetIndex = Math.min(cardCount, Math.max(0, currentIndex + direction))

        if (direction > 0 && currentIndex === cardCount && nextSectionRef.current) {
          event.preventDefault()

          if (performance.now() - finalStepReachedAt < 650) return

          exitWheelDelta += Math.abs(event.deltaY)
          window.clearTimeout(exitWheelResetTimer)
          exitWheelResetTimer = window.setTimeout(() => {
            exitWheelDelta = 0
          }, 450)
          if (exitWheelDelta < 140) return

          exitWheelDelta = 0
          isMoving = true
          transitionActiveRef.current = true

          const lastCard = cards[cardCount - 1]
          const cardVisual = lastCard?.querySelector(`.${styles.bestSellerCardVisual}`)
          if (!cardVisual) {
            window.scrollTo(0, nextSectionRef.current.offsetTop)
            isMoving = false
            transitionActiveRef.current = false
            return
          }

          const rect = cardVisual.getBoundingClientRect()
          transitionCard = cardVisual.cloneNode(true)
          transitionCard.classList.add(styles.bestSellerTransitionCard)
          transitionCard.setAttribute('aria-hidden', 'true')
          Object.assign(transitionCard.style, {
            position: 'fixed',
            top: `${rect.top}px`,
            left: `${rect.left}px`,
            zIndex: '9998',
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            margin: '0',
            pointerEvents: 'none',
            transition: 'none',
          })
          document.body.appendChild(transitionCard)

          const exitScroll = { y: currentScroll }
          exitTimeline = gsap.timeline({
            onComplete: () => {
              window.scrollTo(0, nextSectionRef.current.offsetTop)
              transitionCard?.remove()
              transitionCard = null
              isMoving = false
              transitionActiveRef.current = false
              window.dispatchEvent(new Event('main:events-reveal'))
            },
          })
            .to(transitionCard, {
              top: 0,
              left: 0,
              width: window.innerWidth,
              height: window.innerHeight,
              borderRadius: 0,
              borderColor: '#4D7E7B',
              backgroundColor: '#4D7E7B',
              backgroundImage: 'none',
              boxShadow: 'none',
              duration: 0.68,
              ease: 'power3.inOut',
            })
            .to(exitScroll, {
              y: nextSectionRef.current.offsetTop,
              duration: 0.72,
              ease: 'power2.inOut',
              onUpdate: () => window.scrollTo(0, exitScroll.y),
            }, 0.08)
            .to(transitionCard, {
              autoAlpha: 0,
              duration: 0.24,
              ease: 'power1.out',
            }, 1.85)
          return
        }

        if (targetIndex === currentIndex) return

        event.preventDefault()
        const stepTime = performance.now()
        if (stepTime - lastStepTime < 90) return
        lastStepTime = stepTime
        currentStep = targetIndex
        if (targetIndex === cardCount) finalStepReachedAt = stepTime
        if (direction < 0) exitWheelDelta = 0
        setIsRevealComplete(targetIndex === cardCount)
        setCardsForStep(currentIndex)

        const targetCard = direction > 0
          ? cards[targetIndex - 1]
          : cards[currentIndex - 1]

        gsap.to(targetCard, {
          autoAlpha: direction > 0 ? 1 : 0,
          y: direction > 0 ? 0 : 48,
          scale: direction > 0 ? 1 : 0.94,
          duration: direction > 0 ? 0.32 : 0.24,
          ease: direction > 0 ? 'back.out(1.4)' : 'power2.in',
          overwrite: 'auto',
        })

        const scrollState = { y: currentScroll }
        const targetScroll = sectionStart + (sectionEnd - sectionStart) * (targetIndex / cardCount)
        scrollTween?.kill()
        scrollTween = gsap.to(scrollState, {
          y: targetScroll,
          duration: 0.36,
          ease: 'power2.inOut',
          onUpdate: () => window.scrollTo(0, scrollState.y),
        })
      }

      window.addEventListener('wheel', handleWheel, { passive: false })
      removeWheelHandler = () => window.removeEventListener('wheel', handleWheel)
    }, section)

    return () => {
      removeWheelHandler()
      scrollTween?.kill()
      exitTimeline?.kill()
      window.clearTimeout(exitWheelResetTimer)
      transitionCard?.remove()
      transitionActiveRef.current = false
      context.revert()
    }
  }, [cardCount, nextSectionRef, sectionRef, transitionActiveRef])

  return (
    <section
      ref={sectionRef}
      className={styles.bestSeller}
      style={{
        '--best-seller-steps': IS_SCROLL_SEQUENCE_ENABLED ? cardCount + 1 : 1,
      }}
      aria-labelledby="best-seller-title"
    >
      <div className={styles.bestSellerStage}>
        <h2 id="best-seller-title">BEST SELLER</h2>

        <div className={styles.bestSellerContent}>
          <div
            className={`${styles.cardStack} ${isRevealComplete ? styles.isBestSellerComplete : ''}`}
            aria-label="베스트셀러 상품"
          >
            {displayProducts.map((product, index) => {
              const cardProps = {
                ref: (element) => { cardRefs.current[index] = element },
                className: styles.bestSellerCard,
                style: {
                  '--card-index': index,
                  '--rotate': `${(index - (cardCount - 1) / 2) * 6}deg`,
                },
              }

              if (product.isPlaceholder) {
                return (
                  <div key={product.productId} {...cardProps} aria-hidden="true">
                    <div className={`${styles.bestSellerCardVisual} ${styles.bestSellerPlaceholder}`} />
                  </div>
                )
              }

              return (
                <div key={product.productId ?? product.id} {...cardProps}>
                  <Link
                    className={styles.bestSellerCardVisual}
                    to={`/shop/${product.productId ?? product.id}`}
                  >
                    <span>{product.brandManufacturer ?? 'JAJAK'}</span>
                    <img src={resolveProductImage(product.imageUrl)} alt={product.productName} />
                    <strong>{product.productName}</strong>
                  </Link>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </section>
  )
}

export default BestSellerSection
