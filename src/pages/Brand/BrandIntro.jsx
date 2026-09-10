import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import brandBottle from '../../assets/webpImages/images/brand/O-brand01.webp'
import brandStage from '../../assets/webpImages/images/brand/O-brand02.webp'
import senseLight from '../../assets/webpImages/images/brand/brand-light-in-glass.webp'
import senseAroma from '../../assets/webpImages/images/brand/brand-aroma.webp'
import senseTaste from '../../assets/webpImages/images/brand/brand-taste.webp'
import sensePairing from '../../assets/webpImages/images/brand/brand-pairing.webp'
import senseGlassware from '../../assets/webpImages/images/brand/brand-glassware.webp'
import guideLiquor from '../../assets/webpImages/images/brand/guide-liquor.webp'
import guidePairing from '../../assets/webpImages/images/brand/guide-pairing.webp'
import guideChoice from '../../assets/webpImages/images/brand/guide-choice.webp'
import guideComfort from '../../assets/webpImages/images/brand/guide-comfort.webp'
import makdong from '../../assets/webpImages/characters/M007_Poses01.webp'
import useSectionWheelSnap from './useSectionWheelSnap'
import useStickyBrandHeader from './useStickyBrandHeader'
import styles from './BrandIntro.module.scss'
import journeyStyles from '../Main/JourneySection.module.scss'
import MobileTopButton from '../../components/ui/MobileTopButton/MobileTopButton'

const senseItems = [
  {
    number: '01',
    image: senseLight,
    alt: '저녁빛이 비치는 주안상',
    title: '잔에 담긴 빛',
    description: '맑게 빛나는 약주부터 부드럽게 흐려진 탁주까지, 술이 가진 고유한 색은 오늘의 분위기를 먼저 보여줍니다. 같은 쌀로 빚어도 발효와 여과의 방식에 따라 잔 속 빛깔은 저마다 다르게 피어납니다.',
  },
  {
    number: '02',
    image: senseAroma,
    alt: '은은한 향을 품은 전통주',
    title: '코끝에 머무는 향',
    description: '쌀의 은은한 단향과 과실의 산뜻함, 누룩의 깊은 향. 자작은 술의 향을 어렵지 않은 말로 풀어드립니다. 코끝에 스치는 첫 향부터 잔을 비운 뒤에도 은은히 남는 여운까지 함께 짚어드립니다.',
  },
  {
    number: '03',
    image: senseTaste,
    alt: '검은 병에 담긴 전통주',
    title: '입안에 남는 맛',
    description: '달콤함과 산뜻함, 담백함과 깊은 여운. 맛의 특징을 알기 쉽게 정리해 편안한 선택을 돕습니다. 처음 닿는 맛과 삼킨 뒤 남는 뒷맛까지 살펴, 오늘 당신에게 어울리는 한 잔을 더 가까이 안내합니다.',
  },
  {
    number: '04',
    image: sensePairing,
    alt: '전통주와 함께 즐기는 구운 안주',
    title: '함께할 때 완성되는 한입',
    description: '좋은 술도 무엇과 함께 먹느냐에 따라 달라집니다. 술과 안주가 서로를 돋보이게 하는 작은 한 상을 제안합니다. 짝을 잘 만난 한 잔과 한입은 서로의 맛을 한층 더 깊게 만들어줍니다.',
  },
  {
    number: '05',
    image: senseGlassware,
    alt: '전통주와 안주가 차려진 따뜻한 식탁',
    title: '손끝에 닿는 잔',
    description: '같은 술도 어떤 잔에 따르느냐에 따라 경험이 달라집니다. 도자기와 유리의 촉감까지 취향에 맞게 연결합니다. 손끝에 닿는 감촉 하나로도 오늘의 한 잔은 더 특별한 순간이 됩니다.',
  },
]

const closingValueItems = [
  {
    number: '01',
    image: guideLiquor,
    alt: '전통주 병과 잔 일러스트',
    title: '이해하기 쉬운 전통주',
    description: '어려운 술의 특징을 누구나 이해하기 쉬운 언어로 소개합니다.',
  },
  {
    number: '02',
    image: guidePairing,
    alt: '술과 어울리는 안주 일러스트',
    title: '술과 안주, 잔의 연결',
    description: '한 잔의 맛을 온전히 즐길 수 있도록 어울리는 한 상을 제안합니다.',
  },
  {
    number: '03',
    image: guideChoice,
    alt: '취향에 맞는 선택을 나타내는 일러스트',
    title: '나에게 맞는 선택',
    description: '오늘의 기분과 취향을 살펴 부담 없이 선택할 수 있게 돕습니다.',
  },
  {
    number: '04',
    image: guideComfort,
    alt: '편안한 휴식을 나타내는 의자 일러스트',
    title: '혼자여도 충분한 한 상',
    description: '나를 위해 차린 한 상이 따뜻한 휴식으로 이어지게 합니다.',
  },
]

const BRAND_MESSAGE = '『자작』은 혼자 마시는 시간을 외로운 시간이 아닌 나를 돌보는 시간으로 바꿉니다.'

const renderMessageCharacters = (text) => Array.from(text, (character, index) => (
  <span key={`${character}-${index}`} data-message-character>
    {character === ' ' ? '\u00a0' : character}
  </span>
))

const BrandIntro = () => {
  const pageRef = useRef(null)
  const reasonRef = useRef(null)
  const secondSectionRef = useRef(null)
  const bottleRef = useRef(null)
  const stageRef = useRef(null)
  const [senseTrackIndex, setSenseTrackIndex] = useState(1)
  const [isSenseTransitionEnabled, setIsSenseTransitionEnabled] = useState(true)
  const activeSenseIndex = (senseTrackIndex - 1 + senseItems.length) % senseItems.length
  const [hasManualSenseInteraction, setHasManualSenseInteraction] = useState(false)
  const [isSenseHovered, setIsSenseHovered] = useState(false)
  const [isScrollGuideVisible, setIsScrollGuideVisible] = useState(true)
  const senseTouchRef = useRef(null)
  const activeSense = senseItems[activeSenseIndex]

  const handleSenseChange = (index) => {
    setHasManualSenseInteraction(true)
    setSenseTrackIndex(index + 1)
  }
  const handlePreviousSense = () => {
    setHasManualSenseInteraction(true)
    setSenseTrackIndex((index) => Math.max(0, index - 1))
  }
  const handleNextSense = () => {
    setHasManualSenseInteraction(true)
    setSenseTrackIndex((index) => Math.min(senseItems.length + 1, index + 1))
  }

  const handleSenseTransitionEnd = (event) => {
    if (event.target !== event.currentTarget || event.propertyName !== 'transform') return
    if (senseTrackIndex !== 0 && senseTrackIndex !== senseItems.length + 1) return
    setIsSenseTransitionEnabled(false)
    setSenseTrackIndex(senseTrackIndex === 0 ? senseItems.length : 1)
  }

  useLayoutEffect(() => {
    if (isSenseTransitionEnabled) return undefined
    let secondFrame
    const firstFrame = window.requestAnimationFrame(() => {
      secondFrame = window.requestAnimationFrame(() => setIsSenseTransitionEnabled(true))
    })
    return () => {
      window.cancelAnimationFrame(firstFrame)
      window.cancelAnimationFrame(secondFrame)
    }
  }, [isSenseTransitionEnabled])

  useEffect(() => {
    if (hasManualSenseInteraction || isSenseHovered) return undefined
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    let intervalId
    const updatePlayback = () => {
      window.clearInterval(intervalId)
      if (motionQuery.matches || document.hidden) return
      intervalId = window.setInterval(() => {
        setSenseTrackIndex((index) => Math.min(senseItems.length + 1, index + 1))
      }, 1800)
    }
    updatePlayback()
    motionQuery.addEventListener('change', updatePlayback)
    document.addEventListener('visibilitychange', updatePlayback)
    return () => {
      window.clearInterval(intervalId)
      motionQuery.removeEventListener('change', updatePlayback)
      document.removeEventListener('visibilitychange', updatePlayback)
    }
  }, [hasManualSenseInteraction, isSenseHovered])

  const handleSenseTouchEnd = (event) => {
    const start = senseTouchRef.current
    senseTouchRef.current = null
    if (!start) return
    const touch = event.changedTouches[0]
    const deltaX = touch.clientX - start.x
    const deltaY = touch.clientY - start.y
    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) < Math.abs(deltaY) * 1.5) return
    if (deltaX < 0) handleNextSense()
    else handlePreviousSense()
  }

  useStickyBrandHeader()
  useSectionWheelSnap([{ ref: secondSectionRef }])

  useEffect(() => {
    if (!isScrollGuideVisible) return undefined
    const handleScroll = () => setIsScrollGuideVisible(false)
    const handleWheel = (event) => {
      if (event.deltaY !== 0) handleScroll()
    }
    window.addEventListener('wheel', handleWheel, { passive: true })
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [isScrollGuideVisible])

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const section = secondSectionRef.current
    const bottle = bottleRef.current
    const stage = stageRef.current

    if (!section || !bottle || !stage) return undefined

    const media = gsap.matchMedia()

    media.add({
      desktop: '(min-width: 768px)',
      mobile: '(max-width: 767px)',
      reduce: '(prefers-reduced-motion: reduce)',
    }, ({ conditions }) => {
      const { desktop, reduce } = conditions
      if (!desktop) {
        if (reduce) return undefined

        gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top 80px',
            end: 'bottom bottom',
            scrub: 0.7,
            invalidateOnRefresh: true,
          },
        })
          .fromTo(stage, { yPercent: 115 }, { yPercent: 0, duration: 1, ease: 'none' }, 0)
          .fromTo(bottle,
            { y: () => -section.querySelector(`.${styles.storyScene}`).clientHeight * 0.22 },
            { y: 0, duration: 0.72, ease: 'power1.inOut' }, 0.28)
        return undefined
      }

      const landingScale = 1
      const bottleLandingY = '-2svh' // 술병
      const stageLandingY = '8svh' // 나뭇가지

      if (reduce) {
        gsap.set(stage, { yPercent: 0, y: stageLandingY })
        gsap.set(bottle, { x: 0, y: bottleLandingY, scale: landingScale })
        return undefined
      }

      const context = gsap.context(() => {
        gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.7,
            invalidateOnRefresh: true,
          },
        })
          .fromTo(
            stage,
            { yPercent: 115, y: 0 },
            { yPercent: 0, y: stageLandingY, ease: 'none', duration: 1 },
            0,
          )
          .fromTo(
            bottle,
            { x: 0, y: 0, scale: 1 },
            {
              x: 0,
              y: bottleLandingY,
              scale: landingScale,
              ease: 'power1.inOut',
              duration: 0.72,
            },
            0.28,
          )
      }, section)

      return () => context.revert()
    })

    return () => {
      media.revert()
      gsap.set([bottle, stage], { clearProps: 'transform' })
    }
  }, [])

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const media = gsap.matchMedia()
    const context = gsap.context(() => {
      media.add('(prefers-reduced-motion: no-preference)', () => {
        // 단일 텍스트 블록(제목/설명)이 화면에 들어올 때 한 번 페이드인
        gsap.utils.toArray('[data-reveal]').forEach((el) => {
          gsap.from(el, {
            autoAlpha: 0,
            y: 28,
            duration: 1.2,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: el.closest('section'),
              start: 'top 85%',
              once: true,
            },
          })
        })

        // 리스트·카드 그룹은 항목을 순차적으로 페이드인
        gsap.utils.toArray('[data-reveal-group]').forEach((group) => {
          const items = group.querySelectorAll('[data-reveal-item]')
          if (!items.length) return

          gsap.from(items, {
            autoAlpha: 0,
            y: 24,
            duration: 1.2,
            stagger: 0.2,
            ease: 'power2.out',
            scrollTrigger: {
              trigger: group.closest('section'),
              start: 'top 85%',
              once: true,
            },
          })
        })

        const messageTitle = document.querySelector('[data-message-title]')
        const messageCharacters = messageTitle?.querySelectorAll('[data-message-character]')

        if (messageTitle && messageCharacters?.length) {
          gsap.from(messageCharacters, {
            autoAlpha: 0,
            y: 8,
            duration: 0.16,
            stagger: 0.055,
            ease: 'power1.out',
            scrollTrigger: {
              trigger: messageTitle.closest('section'),
              start: 'top 82%',
              once: true,
            },
          })
        }
      })
    }, pageRef)

    return () => {
      media.revert()
      context.revert()
    }
  }, [])

  return (
    <main ref={pageRef} className={styles.page}>
      <MobileTopButton contentRef={reasonRef} />
      <section
        ref={secondSectionRef}
        className={styles.storySequence}
        aria-label="전통주 병이 자작의 받침에 놓이는 브랜드 이야기"
      >
        <div className={styles.storyScene}>
          <img
            ref={stageRef}
            className={styles.storyStage}
            src={brandStage}
            alt="덩굴 장식이 어우러진 자작의 돌 받침"
          />
          <img
            ref={bottleRef}
            className={styles.storyBottle}
            src={brandBottle}
            alt="자작 전통주 병"
          />
          <div
            className={`${styles.storyScrollGuide} ${!isScrollGuideVisible ? styles.storyScrollGuideHidden : ''}`}
            aria-hidden={!isScrollGuideVisible}
          >
            <p className={styles.storyScrollDesktop}>아래로 스크롤해 자작의 이야기를 만나보세요</p>
            <p className={styles.storyScrollMobile}>위로 쓸어 자작의 이야기를 만나보세요</p>
            <span className={`${journeyStyles.sceneScrollCursor} ${styles.storyScrollIcon}`} aria-hidden="true">
              <i />
            </span>
            <svg className={styles.storySwipeIcon} width="24" height="28" viewBox="0 0 24 28" fill="none" aria-hidden="true">
              <path d="M12 24V4M5 11l7-7 7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </section>

      <section ref={reasonRef} className={styles.reason} aria-labelledby="traditional-liquor-title">
        <div className={styles.reasonHeading} data-reveal>
          <h2 id="traditional-liquor-title">왜 전통주인가?</h2>
          <p>
            전통주 한 병에는 지역의 자연과 재료, 그리고 빚는 사람의 시간이 담겨 있습니다.
            <br className={styles.desktopBreak} />
            자작은 그 안에 담긴 저마다의 이야기를 오늘의 식탁으로 이어갑니다.
          </p>
        </div>

        <ol className={styles.reasonList} data-reveal-group>
          <li data-reveal-item>
            <strong>지역의 풍경</strong>
            <p>술이 태어난 고장의 계절과 풍토를 한 잔 안에서 만납니다. 봄볕과 장마, 
            서늘한 가을바람까지 그 땅이 지나온 시간이 잔 속에 스며듭니다. 
            같은 쌀이라도 자란 곳에 따라 전혀 다른 향과 빛깔을 품게 되는 이유입니다.</p>
          </li>
          <li data-reveal-item>
            <strong>우리의 재료</strong>
            <p>쌀과 과실, 꽃과 약초가 가진 고유한 맛과 향을 발견합니다. 
            같은 재료도 어떤 손을 거치고 어떤 시간을 지나느냐에 따라 전혀 다른 표정을 짓습니다. 
            자작은 그 섬세한 차이를 놓치지 않고 술 한 잔에 담아냅니다.</p>
          </li>
          <li data-reveal-item>
            <strong>빚는 사람</strong>
            <p>오랜 시간 술을 지켜온 사람들의 손길과 마음을 전합니다. 
            발효의 속도를 서두르지 않고 기다릴 줄 아는 인내가 그 안에 함께 담겨 있습니다. 
            그 정성이 쌓여야 비로소 한 잔의 깊은 맛이 완성됩니다.</p>
          </li>
        </ol>
      </section>

      <section className={styles.senses} aria-labelledby="senses-title">
        <header className={styles.sensesHeading} data-reveal>
          <h2 id="senses-title">
            한 상을 이루는{' '}
            <span className={styles.sensesAccent}>
              <span>다</span>
              <span>섯</span>
            </span>{' '}
            가지 감각
          </h2>
          <p>빛과 향, 맛을 천천히 살펴보세요. 마음이 가는 감각부터 시작해도 좋습니다.</p>
        </header>

        <div
          className={styles.senseSlider}
          data-reveal
          onMouseEnter={() => setIsSenseHovered(true)}
          onMouseLeave={() => setIsSenseHovered(false)}
          onFocus={() => setHasManualSenseInteraction(true)}
          onTouchStart={() => setHasManualSenseInteraction(true)}
        >
          <div className={styles.senseCards} aria-live={hasManualSenseInteraction ? 'polite' : 'off'}>
            <article className={styles.senseCard}>
              <div className={styles.senseImageFrame}
                tabIndex={0}
                role="group"
                aria-label="감각 이미지, 좌우 화살표 키 또는 스와이프로 넘기기"
                onTouchStart={(event) => {
                  const touch = event.touches[0]
                  senseTouchRef.current = event.touches.length === 1 ? { x: touch.clientX, y: touch.clientY } : null
                }}
                onTouchEnd={handleSenseTouchEnd}
                onTouchCancel={() => { senseTouchRef.current = null }}
                onKeyDown={(event) => {
                  if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                    event.preventDefault()
                    if (event.key === 'ArrowRight') handleNextSense()
                    else handlePreviousSense()
                  }
                }}
              >
                <div
                  className={styles.senseImageTrack}
                  style={{
                    transform: `translateX(-${senseTrackIndex * 100}%)`,
                    transition: isSenseTransitionEnabled ? undefined : 'none',
                  }}
                  onTransitionEnd={handleSenseTransitionEnd}
                >
                  {[senseItems.at(-1), ...senseItems, senseItems[0]].map((item, index) => (
                    <img
                      key={`${item.number}-${index}`}
                      src={item.image}
                      draggable={false}
                      alt={index === senseTrackIndex ? item.alt : ''}
                      aria-hidden={index !== senseTrackIndex}
                    />
                  ))}
                </div>
              </div>
              <div className={styles.senseText}>
                <span>{activeSense.number}</span>
                <h3>{activeSense.title}</h3>
                <p>{activeSense.description}</p>
            <div className={styles.senseControlButtons} aria-label="다섯 가지 감각 슬라이드 조작">
              <button type="button" onClick={handlePreviousSense} aria-label="이전 감각 보기">
                <span aria-hidden="true">←</span>
              </button>
              <div className={styles.sensePagination}>
                {senseItems.map((item, index) => (
                  <button
                    key={item.number}
                    type="button"
                    className={index === activeSenseIndex ? styles.isActive : undefined}
                    onClick={() => handleSenseChange(index)}
                    aria-label={`${item.number} ${item.title} 보기`}
                    aria-current={index === activeSenseIndex ? 'true' : undefined}
                  />
                ))}
              </div>
              <button type="button" onClick={handleNextSense} aria-label="다음 감각 보기">
                <span aria-hidden="true">→</span>
              </button>
            </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.message} aria-labelledby="brand-message-title">
        <img className={styles.messageBottle} src={brandBottle} alt="" aria-hidden="true" loading="lazy" />
        <div className={styles.messageInner}>
          <h2 id="brand-message-title" data-message-title aria-label={BRAND_MESSAGE}>
            <span className={styles.messageBrand} aria-hidden="true">
              <span className={styles.messageQuote}>{renderMessageCharacters('『')}</span>
              {renderMessageCharacters('자작')}
              <span className={styles.messageQuote}>{renderMessageCharacters('』')}</span>
            </span>
            <span className={styles.messageCharacters} aria-hidden="true">
              {renderMessageCharacters('은 혼자 마시는 시간을 외로운 시간이 아닌 나를 돌보는 시간으로 바꿉니다.')}
            </span>
          </h2>
          <p className={styles.messageDescription} data-reveal>
            술을 많이 마시게 하는 것이 아니라, 나에게 맞는 술을 천천히 이해하고
            <br className={styles.desktopBreak} />
            좋은 안주와 함께 즐길 수 있도록 돕는 것. 그것이 자작의 따뜻한 출발입니다.
          </p>
        </div>
      </section>

      <section className={styles.values} aria-labelledby="values-title">
        <div className={styles.valuesInner}>
          <h2 id="values-title" data-reveal>한 잔을 권할 때, 자작이 생각하는 것</h2>
          <ol className={styles.closingValues} data-reveal-group>
            {closingValueItems.map((item) => (
              <li key={item.number} data-reveal-item>
                <span className={styles.closingNumber} aria-hidden="true">{item.number}</span>
                <div className={styles.closingIllustration}>
                  <img src={item.image} alt={item.alt} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className={styles.closing} aria-labelledby="closing-title">
        <div className={styles.closingInner} data-reveal>
          <div className={styles.makdongVisual}>
            <img className={styles.makdongCharacter} src={makdong} alt="자작의 다정한 길잡이 막동이" loading="lazy" />
          </div>
          <div className={styles.closingIntro}>
            <h2 id="closing-title">한 잔 곁에, 막동이</h2>
            <p className={styles.closingIntroText}>자작의 주막에는 마음을 먼저 살피는 작은 길잡이가 있습니다.</p>
            <Link className={styles.shopLink} to="/brand/makdong">
              막동이 이야기 보기 <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}

export default BrandIntro
