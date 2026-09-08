import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import sitting from '../../assets/characters/M007_Poses04.png'
import front from '../../assets/characters/M007_Poses05.png'
import makdongLookUp from '../../assets/images/brand/makdong-look-up-hands-behind.png'
import makdongPawTrail from '../../assets/images/brand/makdong-paw-trail.png'
import makdongTransition from '../../assets/images/brand/makdong01.png'
import makdongSittingWave from '../../assets/images/brand/makdong-sitting-wave.png'
import makdongRun from '../../assets/images/brand/makdong-run.png'
import makdongJump from '../../assets/images/brand/makdong-jump.png'
import makdongSide from '../../assets/images/brand/mk_side.png'
import makdongBack from '../../assets/images/brand/mk_back.png'
import makdongPouch from '../../assets/images/mypage/profileAvatar-makdong-pouch.png'
import useStickyBrandHeader from './useStickyBrandHeader'
import styles from './MakdongIntro.module.scss'
import MobileTopButton from '../../components/ui/MobileTopButton/MobileTopButton'

gsap.registerPlugin(ScrollTrigger)

const MAKDONG_GUIDE_IMAGES = {
  turnaround: [
    { label: 'FRONT', image: front, alt: '막동이 정면 모습' },
    { label: 'SIDE', image: makdongSide, alt: '막동이 측면 모습' },
    { label: 'BACK', image: makdongBack, alt: '막동이 후면 모습' },
  ],
}

const profileItems = [
  { label: '이름의 뜻', text: '막걸리 + 동동주. 탁주처럼 털털하고 친근한 동반자' },
  { label: '나이', text: '어림잡아 백 살. 사람으로 치면 10대 후반~20대 초반의 인상' },
  { label: '정체', text: '산골 너구리에서 인간의 말을 깨우친 요괴' },
  { label: '하는 일', text: '주막의 조력자, 마음 길잡이이자 주안상 안내꾼' },
]

const propItems = [
  { title: '도자기 잔', position: '머리 위', text: '발바닥 자국 무늬가 새겨진 작은 잔입죠.', image: front, alt: '머리에 도자기 잔을 얹은 막동이', line: 'M23 14 H48 L54 46' },
  { title: '도자기 술병', position: '양 앞발', text: '두 앞발로 꼭 안고 손님을 맞이하지요.', image: sitting, alt: '양 앞발로 도자기 술병을 안은 막동이', line: 'M18 67 H48 L54 46' },
  { title: '마법 복주머니', position: '허리춤', text: '안주가 끊임없이 나오는 주머니입죠. 지금은 꺼내 보여드리지요!', image: makdongPouch, alt: '허리춤의 마법 복주머니를 꺼내 보여주는 막동이', line: 'M23 76 H48 L54 46' },
]

const characterTraits = [
  { title: '마음은 누구보다 먼저', text: '말하지 못한 속내에도 귀를 기울이는 무한한 공감 능력.' },
  { title: '맛본 술이 백 독', text: '몰래 훔쳐 맛본 세월 덕에, 술과 안주를 보는 눈만큼은 탁월하지요.' },
  { title: '꼬리는 거짓말을 못 해', text: '좋은 술과 안주 이야기만 나오면 귀와 꼬리가 불쑥! 사람 행세는 또 실패입죠.' },
  { title: '칭찬에는 속수무책', text: '“막동이가 최고야!” 한마디면 제 몫의 안주까지 몽땅 내어주는 무른 구석.' },
]

const dialogueChoices = [
  { id: 'tired', label: '조금 고단했어요', action: '(축 처진 어깨를 토닥이며)', reply: '나으리, 서두르지 않으셔도 됩죠. 소인이 옆에 앉아 이야기를 들어드리리다. 한 상은 천천히 함께 고르시지요.' },
  { id: 'happy', label: '좋은 일이 있었어요', action: '(신이 나 꼬리를 살랑거리며)', reply: '허허, 경사로군요! 무슨 좋은 일이 있으셨는지 소인에게도 들려주시지요. 이런, 기뻐서 꼬리가 또 나왔네그려!' },
  { id: 'curious', label: '막동이가 궁금해요', action: '(술병을 톡톡 두드리며)', reply: '소인 말입니까? 맛본 술이 백 독이라 안목 하나는 자신 있습죠. 칭찬을 해주시면… 복주머니 속 안주도 조금 더 내어드리리다!' },
]

const MakdongIntro = () => {
  const pageRef = useRef(null)
  const [hasStarted, setHasStarted] = useState(false)
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches)
  const [activeViewIndex, setActiveViewIndex] = useState(0)
  const turnaroundRef = useRef(null)
  const [selectedDialogueId, setSelectedDialogueId] = useState(() => isMobile ? 'tired' : null)
  const selectedDialogue = dialogueChoices.find(({ id }) => id === selectedDialogueId)
  const guideRef = useRef(null)
  const blankSectionRef = useRef(null)
  const storyRef = useRef(null)
  const outroRef = useRef(null)

  useStickyBrandHeader()

  useLayoutEffect(() => {
    const media = window.matchMedia('(max-width: 767px)')
    const handleChange = () => { setIsMobile(media.matches); setActiveViewIndex(0) }
    media.addEventListener('change', handleChange)
    return () => media.removeEventListener('change', handleChange)
  }, [])

  const handleViewScroll = () => {
    const board = turnaroundRef.current
    if (!isMobile || !board) return
    const views = [...board.children]
    const left = board.getBoundingClientRect().left
    const distances = views.map(view => Math.abs(view.getBoundingClientRect().left - left))
    setActiveViewIndex(distances.indexOf(Math.min(...distances)))
  }

  const handleViewChange = (index) => {
    const board = turnaroundRef.current
    const view = board?.children[index]
    if (!isMobile || !view) return
    board.scrollTo({ left: board.scrollLeft + view.getBoundingClientRect().left - board.getBoundingClientRect().left, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }

  useLayoutEffect(() => {
    if (hasStarted) return undefined

    const lockedStyles = [document.documentElement, document.body].map((element) => {
      const previous = ['overflow', 'overflow-x', 'overflow-y', 'touch-action', 'overscroll-behavior']
        .map((property) => [property, element.style.getPropertyValue(property), element.style.getPropertyPriority(property)])

      element.style.setProperty('overflow', 'hidden')
      element.style.setProperty('touch-action', 'none')
      element.style.setProperty('overscroll-behavior', 'none')
      return { element, previous }
    })
    const preventTouchScroll = (event) => {
      if (event.cancelable) event.preventDefault()
    }
    document.addEventListener('touchmove', preventTouchScroll, { passive: false })

    return () => {
      document.removeEventListener('touchmove', preventTouchScroll)
      lockedStyles.forEach(({ element, previous }) => {
        previous.forEach(([property, value, priority]) => {
          element.style.removeProperty(property)
          if (value) element.style.setProperty(property, value, priority)
        })
      })
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
            trigger: blankSectionRef.current,
            start: 'top 45%',
            once: true,
          },
        })
          .from(blankSectionRef.current.querySelector('h2'), {
            autoAlpha: 0, y: '+=28', duration: 0.9, ease: 'power2.out',
          })
          .from(blankSectionRef.current.querySelector('p'), {
            autoAlpha: 0, y: '+=28', duration: 1.6, ease: 'power2.out',
          }, '+=0.2')
          .from(blankSectionRef.current.querySelector(`.${styles.transitionSubcopy}`), {
            autoAlpha: 0, y: 16, duration: 0.9, ease: 'power2.out',
          }, '+=0.6')
          .from(blankSectionRef.current.querySelector(`.${styles.transitionMakdong}`), {
            x: -160, duration: 1.2, ease: 'power2.out',
          })

        gsap.timeline({
          scrollTrigger: {
            trigger: section,
            start: 'top 72%',
            once: true,
          },
        })
          .from('[data-guide-title]', { autoAlpha: 0, y: 36, duration: 0.7, ease: 'power2.out' })
          .from('[data-guide-view]', { autoAlpha: 0, y: 24, duration: 0.55, stagger: 0.12, ease: 'power2.out' }, '-=0.3')

        // 기존 페이드·슬라이드업을 각 콘텐츠가 속한 섹션 진입에 맞춘다.
        const revealSelectors = [
          `.${styles.guideBoardHeader}, .${styles.tailSecret}`,
          `.${styles.propArchive} > h3, .${styles.propCard}`,
          `.${styles.characterStoryVisual}, .${styles.characterStoryHeader}, .${styles.characterPurpose}, .${styles.curationIntro}, .${styles.traitCards} > li`,
          `.${styles.dialogueDemo} > *`,
          `.${styles.outroVisual}, .${styles.outroCopy}`,
        ]
        revealSelectors.forEach((selector) => {
          const bySection = new Map()
          pageRef.current.querySelectorAll(selector).forEach((element) => {
            const trigger = element.closest('section')
            if (!bySection.has(trigger)) bySection.set(trigger, [])
            bySection.get(trigger).push(element)
          })
          bySection.forEach((elements, trigger) => {
            gsap.from(elements, {
              autoAlpha: 0, y: 24, duration: 0.55, stagger: 0.12, ease: 'power2.out',
              scrollTrigger: { trigger, start: 'top 72%', once: true },
            })
          })
        })
      })
    }, pageRef)

    return () => {
      media.revert()
      context.revert()
    }
  }, [hasStarted])

  useLayoutEffect(() => {
    if (!hasStarted) return undefined

    const isMobile = window.matchMedia('(max-width: 767px)').matches
    const viewport = window.visualViewport
    let resizeTimer
    let transitionTimer
    let resizeFrame
    let isTransitionActive = true

    const stopAlignment = () => {
      isTransitionActive = false
      window.clearTimeout(resizeTimer)
      window.clearTimeout(transitionTimer)
      window.cancelAnimationFrame(resizeFrame)
      window.removeEventListener('resize', handleViewportResize)
      viewport?.removeEventListener('resize', handleViewportResize)
      window.removeEventListener('touchstart', stopAlignment)
      window.removeEventListener('pointerdown', stopAlignment)
      window.removeEventListener('wheel', stopAlignment)
      window.removeEventListener('keydown', stopAlignment)
    }
    function handleViewportResize() {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        resizeFrame = window.requestAnimationFrame(() => {
          if (!isTransitionActive) return
          ScrollTrigger.refresh()
          blankSectionRef.current?.scrollIntoView({ behavior: 'instant', block: 'start' })
        })
      }, 120)
    }

    // 시작 전환 중 주소창/회전으로 바뀐 높이만 보정한다. 사용자 스크롤은 가로채지 않는다.
    if (isMobile) {
      window.addEventListener('resize', handleViewportResize)
      viewport?.addEventListener('resize', handleViewportResize)
      window.addEventListener('touchstart', stopAlignment, { passive: true })
      window.addEventListener('pointerdown', stopAlignment, { passive: true })
      window.addEventListener('wheel', stopAlignment, { passive: true })
      window.addEventListener('keydown', stopAlignment)
      transitionTimer = window.setTimeout(stopAlignment, 2500)
    }

    const frameId = window.requestAnimationFrame(() => {
      ScrollTrigger.refresh()
      blankSectionRef.current?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      })
    })

    return () => {
      window.cancelAnimationFrame(frameId)
      stopAlignment()
    }
  }, [hasStarted])

  return (
    <main ref={pageRef} className={styles.page}>
      <MobileTopButton contentRef={guideRef} />
      <section className={styles.blankIntro} aria-label="막동이 소개 첫 화면">
        <p className={styles.introClickGuide} aria-hidden="true">
          게 누구요? 소인이 그리 <strong>궁금</strong>하시다면…<br />
          살짝 눌러나 보시지요!
          <span className={styles.introClickAccent} />
          <svg
            className={styles.introClickArrow}
            viewBox="0 0 72 56"
            aria-hidden="true" 
          >
            <path d="M5 43c9-17 30-19 35-6 5 14-13 19-17 7-6-18 18-31 42-27" />
            <path d="m56 10 10 7-8 10" />
          </svg>
        </p>
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
        <p className={styles.transitionTagline}>
          어서 오시지요, 나으리. 소인 막동이, 인사 올립죠!
          <span className={styles.transitionSubcopy}>
            짐이 좀 많아 보이시지요? 나으리를 위해 이것저것 챙겨왔습니다요.
          </span>
        </p>
        <span className={styles.transitionPawTrail} aria-hidden="true">
          <img src={makdongPawTrail} alt="" />
        </span>

        <div className={styles.flowRibbons} aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <div className={styles.ceramicStillLife} aria-hidden="true">
          <i className={styles.ceramicBottle} />
          <i className={styles.ceramicCup} />
        </div>
        <picture>
          <source media="(max-width: 767px)" srcSet={makdongRun} />
          <source media="(min-width: 1200px)" srcSet={makdongRun} />
          <img
            className={styles.transitionMakdong}
            src={makdongTransition}
            alt="나으리를 반기는 막동이"
          />
        </picture>
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
              소인은 주막의 작은 조력자,<br />
              나으리의 마음 길잡이입죠.
            </p>
            <p className={styles.characterSummary}>
              막걸리와 동동주처럼 털털하게,<br />
              오래 곁을 지키는 벗이 되고 싶습죠.
            </p>
            <dl className={styles.profileCards}>
              {profileItems.map(({ label, text }) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{text}</dd>
                </div>
              ))}
            </dl>
          </div>

          <aside className={styles.guideBoard} aria-label="막동이 캐릭터 가이드">
            <header className={styles.guideBoardHeader}>
              <h2 id="makdong-guide-title">MAKDONG CHARACTER GUIDE</h2>
              <span>JAJAK ARCHIVE · 01</span>
            </header>

            <div className={styles.turnaroundBoard} ref={turnaroundRef} onScroll={isMobile ? handleViewScroll : undefined} tabIndex={isMobile ? 0 : undefined} aria-label={isMobile ? '막동이 앞·옆·뒤 모습, 좌우로 넘겨보세요' : undefined}>
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

            {isMobile && <div className={styles.viewNavigation} aria-label="캐릭터 모습 선택">
              <span>좌우로 넘겨보세요</span>
              <div>{MAKDONG_GUIDE_IMAGES.turnaround.map(({ label }, index) => <button key={label} type="button" aria-label={`${label} 보기`} aria-pressed={activeViewIndex === index} onClick={() => handleViewChange(index)}><span /></button>)}</div>
              <output aria-live="polite">{activeViewIndex + 1} / 3</output>
            </div>}

            <div className={styles.tailSecret}>
              <span aria-hidden="true">↗</span>
              <div><h3>쉿, 등 뒤에 요괴의 흔적!</h3>
                <p>완벽하게 사람 행세를 하려 해도, BACK 뷰의 너구리 꼬리가 정체를 드러내지요.</p>
                <strong>“이, 이것은… 옷자락입죠!”</strong>
              </div>
            </div>


          </aside>

          <section className={styles.propArchive} aria-labelledby="makdong-props-title">
            <h3 id="makdong-props-title">늘 지니는 세 가지 <span>소인의 살림살이, 구경하시지요.</span></h3>
            <div className={styles.propCards}>
              {propItems.map(({ title, position, text, image, alt, line }) => (
                <figure className={styles.propCard} key={title}>
                  <img src={image} alt={alt} />
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d={line} /></svg>
                  <figcaption><span>{position}</span><strong>{title}</strong><p>{text}</p></figcaption>
                </figure>
              ))}
            </div>
          </section>
        </div>
      </section>

      <section ref={storyRef} className={styles.characterStory} aria-labelledby="character-story-title">
            <header className={styles.characterStoryHeader}>
              <h2 id="character-story-title">
                술을 훔치던 너구리,
                <br />
                마음을 살피는 벗이 되다.
              </h2>
              <p>
                산골의 너구리였던 막동이는 주막의 술과 안주를 몰래 훔쳐 먹다
                인간의 말과 주안상의 이치를 깨우쳐 요괴가 되었습니다.
                훔쳐 맛본 술만 백 독. 맛을 알아가는 동안, 밤마다 홀로 잔을 기울이는
                사람들의 외로움도 가까이서 지켜보았지요.
              </p>
            </header>
        <div className={styles.characterStoryInner}>
          <figure className={styles.characterStoryVisual}>
            <img src={makdongSittingWave} alt="앉아서 손을 흔들며 인사하는 막동이" />
          </figure>

          <div className={styles.characterStoryCopy}>


            <div className={styles.characterPurpose}>
              <h3>
                이제는 훔치는 대신,
                <br />
                한 상을 건네고 싶습죠.
              </h3>
              <p>
                고단한 하루 끝에 홀로 앉은 나으리께, 오늘 가장 필요한 한 상을 건네는 것.
                그것이 막동이의 유일한 목표입니다. 술과 안주를 고르기 전,
                먼저 오늘의 마음을 묻는 까닭도 여기에 있지요.
              </p>
              <strong>“나으리의 이야기부터 들려주시지요. 소인이 곁에 있습죠.”</strong>
            </div>

            <div className={styles.curationIntro}>
              {isMobile && <img className={styles.storyCompanion} src={sitting} alt="술병을 안고 이야기를 듣는 막동이" />}
              <h3>이런 재주, 저런 허당끼</h3>
            </div>

            <ul className={styles.traitCards}>
              {characterTraits.map(({ title, text }) => (
                <li key={title}>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </li>
              ))}
            </ul>

            <section className={styles.dialogueDemo} aria-labelledby="makdong-dialogue-title">
              <h3 id="makdong-dialogue-title">나으리, 말 한마디 나누시지요.</h3>
              <p className={styles.speechBubble}>오늘 하루도 고생 많으셨지요? 오늘 기분이 어떠신지 셋 중 하나만 콕 짚어주시지요!</p>
              <div className={styles.dialogueChoices} role="group" aria-label="막동이에게 답하기">
                {dialogueChoices.map(({ id, label }) => (
                  <button key={id} type="button" aria-pressed={selectedDialogueId === id} aria-controls="makdong-dialogue-reply" onClick={() => setSelectedDialogueId(id)}>{label}</button>
                ))}
              </div>
              <div id="makdong-dialogue-reply" className={styles.dialogueReply} role="status" aria-live="polite" aria-atomic="true">
                {selectedDialogue && <><span>{selectedDialogue.action}</span><p>{selectedDialogue.reply}</p></>}
              </div>
            </section>
          </div>
        </div>
      </section>

      <section ref={outroRef} className={styles.outro} aria-labelledby="outro-title">
        <div className={styles.outroVisual}>
          <i aria-hidden="true" />
          <img src={makdongJump} alt="신나게 점프하는 막동이" />
        </div>
        <div className={styles.outroCopy}>
          <h2 id="outro-title">자, 나으리!<br />소인과 한 상 차려보시겠습니까?</h2>
          <p>
            나으리의 자리는 늘 비워두겠습죠.<br />
            생각나실 때면, 살며시 불러주시지요.
          </p>
          <Link to="/ai">한 상 청하기 <span aria-hidden="true">→</span></Link>
        </div>
      </section>
        </>
      )}
    </main>
  )
}

export default MakdongIntro
