import { useLayoutEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Link } from 'react-router-dom'

import bestSellerTransitionImage from '../../assets/webpImages/images/main/best-seller/bestseller.webp'
import jadeBottleSetImage from '../../assets/webpImages/images/main/best-seller/bestseller-products01.webp'
import styles from './MainPage.module.scss'

gsap.registerPlugin(ScrollTrigger)

const productImages = import.meta.glob('../../assets/webpImages/images/products/product*.webp', {
  eager: true,
  import: 'default',
})

const resolveProductImage = (imageUrl) => Object.entries(productImages)
  .find(([path]) => (path.endsWith(`/${imageUrl}`) || path.endsWith((`/${imageUrl}`).replace(/\.(png|jpe?g)$/i, '.webp'))))?.[1]

const fallbackProducts = [
  { productId: 'liq_001', productName: '햇쌀 맑은 이화주', imageUrl: 'product1.webp' },
  { productId: 'liq_002', productName: '새벽 솔잎 막걸리', imageUrl: 'product2.webp' },
  { productId: 'liq_003', productName: '메밀밭 생 막걸리', imageUrl: 'product3.webp' },
  { productId: 'liq_004', productName: '들꽃 국화주', imageUrl: 'product4.webp' },
].map((product) => ({ ...product, imageSrc: resolveProductImage(product.imageUrl) }))

const EXIT_EXPAND_DURATION = 1.15
const EXIT_SCROLL_DURATION = 1.2
const EXIT_SCROLL_DELAY = 0.1
const EXIT_HOLD_DURATION = 0.65
const EXIT_FADE_DURATION = 0.38

const BestSellerSection = ({
  products,
  sectionRef,
  nextSectionRef,
  transitionActiveRef,
}) => {
  const [isRevealComplete, setIsRevealComplete] = useState(false)
  const cardRefs = useRef([])
  const hasDirectNavigationRef = useRef(false)
  const displayProducts = products.length > 0
    ? products
    : fallbackProducts
  const cardCount = displayProducts.length
  const productsKey = displayProducts.map((product) => product.productId ?? product.id).join('|')

  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section || !cardCount) return undefined

    let scrollTween
    let exitTimeline
    let transitionCard
    let isMoving = false
    let currentStep = 0
    let lastStepTime = 0
    let finalStepReachedAt = 0
    let removeWheelHandler = () => {}
    let removeNavigationHandler = () => {}

    const context = gsap.context(() => {
      const cards = cardRefs.current.slice(0, cardCount)
      const isDesktopStepMode = window.matchMedia('(hover: hover) and (pointer: fine)').matches
      gsap.set(cards, { autoAlpha: 0, y: 48, scale: 0.94 })
      setIsRevealComplete(false)

      const setCardsForStep = (step) => {
        cards.forEach((card, index) => {
          gsap.set(card, {
            autoAlpha: index < step ? 1 : 0,
            y: index < step ? 0 : 48,
            scale: index < step ? 1 : 0.94,
          })
        })
      }

      const handleDirectNavigation = () => {
        hasDirectNavigationRef.current = true
        scrollTween?.kill()
        gsap.killTweensOf(cards)
        currentStep = cardCount
        finalStepReachedAt = performance.now()
        setCardsForStep(cardCount)
        setIsRevealComplete(true)
      }

      section.addEventListener('main:section-select', handleDirectNavigation)
      removeNavigationHandler = () => section.removeEventListener('main:section-select', handleDirectNavigation)
      if (hasDirectNavigationRef.current) handleDirectNavigation()

      if (!isDesktopStepMode) {
        setIsRevealComplete(true)
        gsap.to(cards, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.55,
          stagger: 0.14,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: section,
            start: 'top 72%',
            once: true,
          },
        })
        return
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

          if (isMoving || performance.now() - finalStepReachedAt < 360) return

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
          const transitionImage = transitionCard.querySelector('img')
          if (transitionImage) {
            transitionImage.src = bestSellerTransitionImage
            transitionImage.alt = ''
          }
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
              duration: EXIT_EXPAND_DURATION,
              ease: 'power3.inOut',
            })
            .to(exitScroll, {
              y: nextSectionRef.current.offsetTop,
              duration: EXIT_SCROLL_DURATION,
              ease: 'power2.inOut',
              onUpdate: () => window.scrollTo(0, exitScroll.y),
            }, EXIT_SCROLL_DELAY)
            .to(transitionCard, {
              autoAlpha: 0,
              duration: EXIT_FADE_DURATION,
              ease: 'power1.out',
            }, EXIT_SCROLL_DELAY + EXIT_SCROLL_DURATION + EXIT_HOLD_DURATION)
          return
        }

        if (targetIndex === currentIndex) return

        event.preventDefault()
        const stepTime = performance.now()
        if (stepTime - lastStepTime < 90) return
        lastStepTime = stepTime
        currentStep = targetIndex
        if (targetIndex === cardCount) finalStepReachedAt = stepTime
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
      removeNavigationHandler()
      removeWheelHandler()
      scrollTween?.kill()
      exitTimeline?.kill()
      transitionCard?.remove()
      transitionActiveRef.current = false
      context.revert()
    }
  }, [cardCount, productsKey, nextSectionRef, sectionRef, transitionActiveRef])

  return (
    <section
      id="best-seller-section"
      ref={sectionRef}
      className={styles.bestSeller}
      style={{
        '--best-seller-steps': cardCount + 1,
      }}
      aria-labelledby="best-seller-title"
    >
      <div className={styles.bestSellerStage}>
        <h2 id="best-seller-title">BEST SELLER</h2>

        <div className={styles.bestSellerContent}>
          <div className={styles.bestSellerSwipeHint} aria-hidden="true">
            <svg viewBox="0 0 64 64" focusable="false">
              <path d="M27 36V13a5 5 0 0 1 10 0v17-8a5 5 0 0 1 10 0v11-5a5 5 0 0 1 10 0v13c0 11-8 19-19 19h-4c-8 0-13-4-17-10L8 40a5 5 0 0 1 8-6l11 10Z" />
            </svg>
          </div>
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

              return (
                <div key={product.productId ?? product.id} {...cardProps}>
                  <Link
                    className={styles.bestSellerCardVisual}
                    to={`/shop/${product.productId ?? product.id}`}
                    aria-label={`${product.productName} 상세 페이지로 이동`}
                  >
                    {product.brandManufacturer && <span>{product.brandManufacturer}</span>}
                    <img
                      src={product.productId === 'gft_001' ? jadeBottleSetImage : product.imageSrc ?? resolveProductImage(product.imageUrl)}
                      alt={product.productName}
                     loading="lazy" decoding="async" />
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
