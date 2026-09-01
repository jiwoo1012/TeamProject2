import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import sitting from '../../assets/characters/M007_Poses04.png'
import front from '../../assets/characters/M007_Poses05.png'
import makdongLookUp from '../../assets/images/brand/makdong-look-up-hands-behind.png'
import makdongTransition from '../../assets/images/brand/makdong01.png'
import makdongSittingWave from '../../assets/images/brand/makdong-sitting-wave.png'
import makdongSide from '../../assets/images/brand/mk_side.png'
import makdongBack from '../../assets/images/brand/mk_back.png'
import useMakdongSectionWheel from './useMakdongSectionWheel'
import useStickyBrandHeader from './useStickyBrandHeader'
import styles from './MakdongIntro.module.scss'

gsap.registerPlugin(ScrollTrigger)

const MAKDONG_GUIDE_IMAGES = {
  turnaround: [
    { label: 'FRONT', image: front, alt: '막동이 정면 모습' },
    { label: 'SIDE', image: makdongSide, alt: '막동이 측면 모습' },
    { label: 'BACK', image: makdongBack, alt: '막동이 후면 모습' },
  ],
}

const jobs = [
  { number: '01', title: '오늘은 어떤 하루였나요?', text: '먼저 오늘의 기분과 함께하고 싶은 순간을 가만히 들어요.' },
  { number: '02', title: '취향을 살펴보고', text: '좋아하는 맛과 향, 원하는 분위기를 하나씩 함께 찾아봐요.' },
  { number: '03', title: '술과 안주를 골라', text: '당신의 하루와 취향에 잘 어울리는 조합을 정성껏 골라요.' },
  { number: '04', title: '오늘의 한 상을 준비해요.', text: '술과 안주, 잔이 조화로운 오늘만의 한 상을 완성해요.' },
]

const MakdongIntro = () => {
  const [hasStarted, setHasStarted] = useState(false)
  const guideRef = useRef(null)
  const blankSectionRef = useRef(null)
  const storyRef = useRef(null)
  const outroRef = useRef(null)

  useStickyBrandHeader()
  useMakdongSectionWheel({ guideRef, blankSectionRef, storyRef, outroRef })

  useLayoutEffect(() => {
    if (hasStarted) return undefined

    const previousOverflowY = document.body.style.overflowY
    document.body.style.overflowY = 'hidden'

    return () => {
      document.body.style.overflowY = previousOverflowY
    }
  }, [hasStarted])

  useLayoutEffect(() => {
    if (!hasStarted) return undefined

    const section = guideRef.current
    if (!section) return undefined

    const media = gsap.matchMedia()
    const context = gsap.context(() => {
      media.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top 72%',
            once: true,
          },
        })
          .from('[data-guide-title]', { autoAlpha: 0, y: 36, duration: 0.7, ease: 'power2.out' })
          .from('[data-guide-view]', { autoAlpha: 0, y: 24, duration: 0.55, stagger: 0.12, ease: 'power2.out' }, '-=0.3')
      })
    }, section)

    return () => {
      media.revert()
      context.revert()
    }
  }, [hasStarted])

  useLayoutEffect(() => {
    if (!hasStarted) return undefined

    const frameId = window.requestAnimationFrame(() => {
      ScrollTrigger.refresh()
      blankSectionRef.current?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      })
    })

    return () => window.cancelAnimationFrame(frameId)
  }, [hasStarted])

  return (
    <main className={styles.page}>
      <section className={styles.blankIntro} aria-label="막동이 소개 첫 화면">
        <button
          className={styles.blankIntroLink}
          type="button"
          aria-label="막동이 소개 시작하기"
          onClick={() => setHasStarted(true)}
        >
          <span className={styles.blankIntroWord} aria-hidden="true">MAKDONG</span>
          <span className={styles.introRiceBurst} aria-hidden="true">
            {Array.from({ length: 14 }, (_, index) => <i key={index} />)}
          </span>
          <img src={makdongLookUp} alt="두 손을 뒤로 하고 위를 바라보는 막동이" />
        </button>
      </section>

      {hasStarted && (
        <>
      <section
        ref={blankSectionRef}
        className={styles.blankCharacterSection}
        aria-labelledby="makdong-transition-title"
      >
        <h2 id="makdong-transition-title">MAKDONG</h2>
        <div className={styles.flowRibbons} aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <div className={styles.ceramicStillLife} aria-hidden="true">
          <i className={styles.ceramicBottle} />
          <i className={styles.ceramicCup} />
        </div>
        <img
          className={styles.transitionMakdong}
          src={makdongTransition}
          alt="잔을 머리에 올리고 손을 흔드는 막동이"
        />
        <div className={styles.riceGrains} aria-hidden="true">
          <i /><i /><i /><i /><i /><i />
        </div>
        <div className={styles.transitionFloor} aria-hidden="true" />
      </section>

      <section
        ref={guideRef}
        id="makdong-intro"
        className={styles.characterGuide}
        aria-labelledby="makdong-guide-title"
      >
        <div className={styles.characterGuideInner}>
          <div className={styles.characterIntro} data-guide-title>
            <h2 className={styles.characterGuideTitle}>MAKDONG</h2>
            <p className={styles.characterName}>막동이</p>
            <p className={styles.characterRole}>
              오늘 당신의 한 잔을 함께 골라줄<br />
              자작의 작은 큐레이터, 막동이를 소개합니다.
            </p>
            <p className={styles.characterSummary}>
              오늘의 기분과 취향을 살피고,<br />
              당신에게 어울리는 한 잔을 찾아주는<br />
              다정하고 호기심 많은 친구예요.
            </p>
          </div>

          <aside className={styles.guideBoard} aria-label="막동이 캐릭터 가이드">
            <header className={styles.guideBoardHeader}>
              <h2 id="makdong-guide-title">MAKDONG CHARACTER GUIDE</h2>
              <span>JAJAK ARCHIVE · 01</span>
            </header>

            <div className={styles.turnaroundBoard}>
              {MAKDONG_GUIDE_IMAGES.turnaround.map(({ label, image, alt }) => (
                <figure key={label} data-guide-view>
                  <div className={styles.turnaroundVisual}>
                    {image ? (
                      <img src={image} alt={alt} />
                    ) : (
                      <span className={styles.imagePlaceholder} aria-label={`${alt} 이미지 준비 중`}>
                        IMAGE<br />TO COME
                      </span>
                    )}
                  </div>
                  <figcaption>{label}</figcaption>
                </figure>
              ))}
            </div>

            <dl className={styles.characterMeta}>
              <div>
                <dt><i aria-hidden="true">○</i>ROLE</dt>
                <dd>
                  <strong>AI CURATOR</strong>
                  <span>당신의 기분과 취향을 이해하고 어울리는 전통주와 안주, 잔을 제안하는 큐레이터</span>
                </dd>
              </div>
              <div>
                <dt><i aria-hidden="true">☺</i>PERSONALITY</dt>
                <dd>
                  <strong>WARM · CURIOUS · PLAYFUL</strong>
                  <span>다정하고 호기심이 많으며, 장난기가 가득한 성격</span>
                </dd>
              </div>
              <div>
                <dt><i aria-hidden="true">◇</i>FAVORITE</dt>
                <dd>
                  <strong>TRADITIONAL DRINK &amp; FOOD</strong>
                  <span>전통주와 다양한 음식, 잔을 모으고 페어링하는 것을 좋아해요.</span>
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </section>

      <section ref={storyRef} className={styles.characterStory} aria-labelledby="character-story-title">
        <div className={styles.characterStoryInner}>
          <figure className={styles.characterStoryVisual}>
            <img src={makdongSittingWave} alt="앉아서 손을 흔들며 인사하는 막동이" />
          </figure>

          <div className={styles.characterStoryCopy}>
            <header className={styles.characterStoryHeader}>
              <h2 id="character-story-title">
                막동이와 함께하는
                <br />
                다정한 한 잔의 이야기
              </h2>
              <p>
                막동이는 오늘의 마음을 천천히 들여다보고, 당신의 하루에 잘 어울리는
                한 상을 함께 찾아갑니다. 이곳에는 막동이의 성격과 이야기를 담을 예정입니다.
              </p>
            </header>

            <div className={styles.characterPurpose}>
              <p className={styles.characterPurposeEyebrow}>WHY MAKDONG?</p>
              <h3>
                혼자여도, 함께여도
                <br />
                오늘의 시간이 조금 더 다정해질 수 있도록.
              </h3>
              <p>
                막동이는 무엇을 마실지 고민되는 날, 오늘의 기분을 먼저 물어봐요.
                어려운 술 이름보다 당신이 어떤 하루를 보냈는지, 지금 어떤 시간이
                필요한지를 더 궁금해하는 친구예요.
              </p>
              <strong>술을 고르는 것보다, 오늘의 당신을 먼저 살펴보는 큐레이터.</strong>
            </div>

            <div className={styles.curationIntro}>
              <p>MAKDONG&apos;S CURATION</p>
              <h3>그래서 막동이가 뭘 해주는데?</h3>
            </div>

            <ol className={styles.characterStorySteps}>
              {jobs.map(({ number, title, text }) => (
                <li key={number}>
                  <span>{number}</span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section ref={outroRef} className={styles.outro} aria-labelledby="outro-title">
        <div className={styles.outroVisual}>
          <i aria-hidden="true" />
          <img src={sitting} alt="술병을 안고 앉은 막동이" />
        </div>
        <div className={styles.outroCopy}>
          <h2 id="outro-title">오늘은 어떤 한 잔이 필요하세요?</h2>
          <p>
            기분 좋은 날도, 조금 지친 날도.<br />
            막동이가 오늘의 당신에게 어울리는<br />
            한 상을 준비해드릴게요.
          </p>
          <Link to="/ai">막동이에게 추천받기 <span aria-hidden="true">→</span></Link>
        </div>
      </section>
        </>
      )}
    </main>
  )
}

export default MakdongIntro
