import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import brandBottle from '../../assets/images/brand/O-brand01.png'
import brandStage from '../../assets/images/brand/O-brand02.png'
import senseLight from '../../assets/images/brand/brand-light-in-glass.webp'
import senseAroma from '../../assets/images/brand/brand-aroma.webp'
import senseTaste from '../../assets/images/brand/brand-taste.webp'
import sensePairing from '../../assets/images/brand/brand-pairing.webp'
import senseGlassware from '../../assets/images/brand/brand-glassware.webp'
import guideLiquor from '../../assets/images/brand/guide-liquor.png'
import guidePairing from '../../assets/images/brand/guide-pairing.png'
import guideChoice from '../../assets/images/brand/guide-choice.png'
import guideComfort from '../../assets/images/brand/guide-comfort.png'
import leafStone from '../../assets/images/brand/leaf-stone.png'
import makdongPawMark from '../../assets/images/brand/makdong-paw-mark.png'
import makdong from '../../assets/characters/M007_Poses01.png'
import useSectionWheelSnap from './useSectionWheelSnap'
import useStickyBrandHeader from './useStickyBrandHeader'
import styles from './BrandIntro.module.scss'

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

const BrandIntro = () => {
  const secondSectionRef = useRef(null)
  const bottleRef = useRef(null)
  const stageRef = useRef(null)
  const [activeSenseIndex, setActiveSenseIndex] = useState(0)
  const [senseTrackIndex, setSenseTrackIndex] = useState(1)
  const [isSenseTransitionEnabled, setIsSenseTransitionEnabled] = useState(true)
  const [hasManualSenseInteraction, setHasManualSenseInteraction] = useState(false)
  const [isSenseTemporarilyPaused, setIsSenseTemporarilyPaused] = useState(false)

  const activeSense = senseItems[activeSenseIndex]
  const senseTrackItems = [senseItems.at(-1), ...senseItems, senseItems[0]]

  const handleSenseChange = (nextIndex) => {
    setHasManualSenseInteraction(true)
    setActiveSenseIndex(nextIndex)
    setSenseTrackIndex(nextIndex + 1)
  }

  const handlePreviousSense = () => {
    setHasManualSenseInteraction(true)
    const previousIndex = (activeSenseIndex - 1 + senseItems.length) % senseItems.length
    setActiveSenseIndex(previousIndex)
    setSenseTrackIndex((currentIndex) => currentIndex - 1)
  }

  const handleNextSense = () => {
    setHasManualSenseInteraction(true)
    const nextIndex = (activeSenseIndex + 1) % senseItems.length
    setActiveSenseIndex(nextIndex)
    setSenseTrackIndex((currentIndex) => currentIndex + 1)
  }

  const handleSenseTransitionEnd = () => {
    const lastTrackIndex = senseItems.length + 1
    if (senseTrackIndex !== 0 && senseTrackIndex !== lastTrackIndex) return

    // 양 끝의 복제 이미지에 도착하면 애니메이션 없이 실제 이미지 위치로 정렬한다.
    setIsSenseTransitionEnabled(false)
    setSenseTrackIndex(senseTrackIndex === 0 ? senseItems.length : 1)

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setIsSenseTransitionEnabled(true))
    })
  }

  useStickyBrandHeader()
  useSectionWheelSnap([{ ref: secondSectionRef }])

  useEffect(() => {
    // 사용자가 모션 감소를 설정한 경우 자동 슬라이드를 실행하지 않는다.
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion || hasManualSenseInteraction || isSenseTemporarilyPaused) return undefined

    // 다섯 감각 슬라이드를 8초마다 다음 항목으로 자동 전환한다.
    const intervalId = window.setInterval(() => {
      setActiveSenseIndex((currentIndex) => (currentIndex + 1) % senseItems.length)
      setSenseTrackIndex((currentIndex) => currentIndex + 1)
    }, 8000)

    // 페이지를 벗어날 때 interval을 제거해 중복 실행과 메모리 누수를 방지한다.
    return () => window.clearInterval(intervalId)
  }, [hasManualSenseInteraction, isSenseTemporarilyPaused])

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger)

    const section = secondSectionRef.current
    const bottle = bottleRef.current
    const stage = stageRef.current

    if (!section || !bottle || !stage) return undefined

    const media = gsap.matchMedia()

    media.add({
      desktop: '(min-width: 768px)',
      reduce: '(prefers-reduced-motion: reduce)',
    }, ({ conditions }) => {
      const { desktop, reduce } = conditions
      if (!desktop) return undefined

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
              trigger: el,
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
              trigger: group,
              start: 'top 85%',
              once: true,
            },
          })
        })
      })
    })

    return () => {
      media.revert()
      context.revert()
    }
  }, [])

  return (
    <main className={styles.page}>
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
        </div>
      </section>

      <section className={styles.reason} aria-labelledby="traditional-liquor-title">
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

      <section className={styles.curation} aria-labelledby="curation-title">
        <div className={styles.curationHeading} data-reveal>
          <h2 id="curation-title">
            전통주를 고르는 일을 넘어
            <br />
            오늘의 나를 돌보는 한 상을 만듭니다.
          </h2>
          <p>
            술의 종류와 향, 도수만이 아니라 오늘의 기분과 함께 먹을 음식,
            <br className={styles.desktopBreak} />
            어떤 잔에 따라 마실지까지 하나의 경험으로 연결합니다.
          </p>
        </div>

        <ol className={styles.curationSteps} data-reveal-group>
          <li data-reveal-item>
            <span className={styles.stepIcon} aria-hidden="true">01</span>
            <strong>기분과 상황 이해</strong>
          </li>
          <li data-reveal-item>
            <span className={styles.stepIcon} aria-hidden="true">02</span>
            <strong>전통주 추천</strong>
          </li>
          <li data-reveal-item>
            <span className={styles.stepIcon} aria-hidden="true">03</span>
            <strong>페어링 안주 제안</strong>
          </li>
          <li data-reveal-item>
            <span className={styles.stepIcon} aria-hidden="true">04</span>
            <strong>어울리는 잔 추천</strong>
          </li>
          <li data-reveal-item>
            <span className={styles.stepIcon} aria-hidden="true">05</span>
            <strong>오늘의 한 상 완성</strong>
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
        </header>

        <div
          className={styles.senseSlider}
          onMouseEnter={() => setIsSenseTemporarilyPaused(true)}
          onMouseLeave={() => setIsSenseTemporarilyPaused(false)}
          onFocus={() => setIsSenseTemporarilyPaused(true)}
          onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) {
              setIsSenseTemporarilyPaused(false)
            }
          }}
        >
          <div className={styles.senseCards} aria-live="polite">
            <article className={styles.senseCard}>
              <div className={styles.senseImageFrame}>
                <div
                  className={`${styles.senseImageTrack} ${isSenseTransitionEnabled ? '' : styles.isTransitionDisabled}`}
                  style={{ transform: `translateX(-${senseTrackIndex * 100}%)` }}
                  onTransitionEnd={handleSenseTransitionEnd}
                >
                  {senseTrackItems.map((item, index) => (
                    <img
                      key={`${item.number}-${index}`}
                      src={item.image}
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
              </div>
            </article>
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
        </div>
      </section>

      <section className={styles.message} aria-labelledby="brand-message-title">
        <div className={styles.messageInner} data-reveal>
          <h2 id="brand-message-title">
            <span className={styles.messageBrand}><span className={styles.messageQuote}>『</span>자작<span className={styles.messageQuote}>』</span></span>은 혼자 마시는 시간을
            {' '}외로운 시간이 아닌
            {' '}나를 돌보는 시간으로 바꿉니다.
          </h2>
          <p className={styles.messageDescription}>
            술을 많이 마시게 하는 것이 아니라, 나에게 맞는 술을 천천히 이해하고
            <br className={styles.desktopBreak} />
            좋은 안주와 함께 즐길 수 있도록 돕는 것. 그것이 자작의 따뜻한 출발입니다.
          </p>
        </div>
      </section>

      <section className={styles.closing} aria-labelledby="closing-title">
        <div className={styles.closingInner}>
          <div className={styles.closingIntro} data-reveal>
            <h2 id="closing-title">
              막동이가
              <br />
              <span className={styles.closingTitleLine}>
                <span className={styles.closingTitleAccent}>도와드립니다.</span>
                <img className={styles.closingPawMark} src={makdongPawMark} alt="" aria-hidden="true" />
              </span>
            </h2>
            <p className={styles.closingIntroText}>
              전통주와 안주의 연결부터
              <br />
              나에게 맞는 선택까지 함께할게요.
            </p>
            <div className={styles.makdongVisual}>
              <img className={styles.makdongCharacter} src={makdong} alt="자작의 전통주 큐레이터 막동이" />
              <img className={styles.makdongDecoration} src={leafStone} alt="" aria-hidden="true" />
            </div>
            <Link className={styles.shopLink} to="/brand/makdong">
              막동이 이야기 보기 <span aria-hidden="true">→</span>
            </Link>
          </div>

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
    </main>
  )
}

export default BrandIntro
