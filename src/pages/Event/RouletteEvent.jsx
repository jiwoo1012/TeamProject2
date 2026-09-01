import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { doc, runTransaction, serverTimestamp } from 'firebase/firestore'
import { subscribeToAuthState } from '../../firebase/auth'
import { db } from '../../firebase/firebase'
import { getCollection, getDocument } from '../../firebase/firestore'
import { PATHS } from '../../routes/paths'
import eventsData from '../../data/events.json'
import backgroundImage from '../../assets/images/eventPage/background2.jpg'
import rouletteBack from '../../assets/images/eventPage/roulette3.png'
import rouletteWheel from '../../assets/images/eventPage/roulette2.png'
import rouletteFront from '../../assets/images/eventPage/roulette1.png'
import makdong from '../../assets/characters/M007_Poses07.png'
import running2 from '../../assets/images/eventPage/running2.png'
import running3 from '../../assets/images/eventPage/running3.png'
import fallbackGift from '../../assets/images/products/product24.png'
import fallbackLiquor from '../../assets/images/products/product2.png'
import fallbackFood from '../../assets/images/products/product19.png'
import styles from './RouletteEvent.module.scss'

const productImages = import.meta.glob(
  '../../assets/images/products/product*.png',
  { eager: true, import: 'default' }
)

const EVENT_ID = 'event-1'
const EVENT_TITLE = '막동이 룰렛 이벤트'

// 기획서에서 확정된 가중치 객체. 전체 합계는 100이다.
const PRIZE_WEIGHTS = {
  first: {
    rank: 1, weight: 1, type: 'product', name: '자작 혼술 다정 세트',
    productId: 'gft_002', description: '전통주와 안주로 구성된 다정한 혼술 세트',
    fallbackImage: fallbackGift, wheelAngle: 60,
  },
  second: {
    rank: 2, weight: 4, type: 'product', name: '새벽 솔잎 막걸리',
    productId: 'liq_002', description: '막동이가 고른 은은한 솔향의 막걸리',
    fallbackImage: fallbackLiquor, wheelAngle: 120,
  },
  third: {
    rank: 3, weight: 10, type: 'product', name: '참숯 향 메추리알 장조림',
    productId: 'snk_003', description: '한 잔의 분위기를 채워 줄 짭조름한 안주',
    fallbackImage: fallbackFood, wheelAngle: 180,
  },
  fourth: {
    rank: 4, weight: 20, type: 'point', name: '5,000 포인트',
    points: 5000, description: '상품 구매 시 사용할 수 있어요', wheelAngle: 240,
  },
  fifth: {
    rank: 5, weight: 30, type: 'point', name: '1,000 포인트',
    points: 1000, description: '상품 구매 시 사용할 수 있어요', wheelAngle: 300,
  },
  sixth: {
    rank: 6, weight: 35, type: 'point', name: '100 포인트',
    points: 100, description: '상품 구매 시 사용할 수 있어요', wheelAngle: 0,
  },
}

const PRIZES = Object.values(PRIZE_WEIGHTS)

const resolveProductImage = (imageUrl) =>
  Object.entries(productImages).find(([path]) =>
    path.endsWith(`/${imageUrl}`)
  )?.[1]

const drawPrize = () => {
  const ticket = Math.random() * 100
  let accumulatedWeight = 0

  return PRIZES.find((prize) => {
    accumulatedWeight += prize.weight
    return ticket < accumulatedWeight
  }) ?? PRIZES.at(-1)
}

const formatPeriod = ({ startDate, endDate }) =>
  `${startDate.replaceAll('-', '.')} ~ ${endDate.replaceAll('-', '.')}`

const formatToday = () =>
  new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(new Date())

const RouletteEvent = () => {
  const event = eventsData[0].event
  const wheelRef = useRef(null)
  const stageRef = useRef(null)
  const currentRotationRef = useRef(0)
  const loginNoticeTimerRef = useRef(null)
  const [user, setUser] = useState(null)
  const [products, setProducts] = useState([])
  const [hasParticipated, setHasParticipated] = useState(false)
  const [isSpinning, setIsSpinning] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [result, setResult] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [loginNotice, setLoginNotice] = useState('')

  useEffect(() => {
    let active = true

    const unsubscribe = subscribeToAuthState(async (currentUser) => {
      if (!active) return
      const member = currentUser && !currentUser.isAnonymous ? currentUser : null
      setUser(member)

      if (!member) {
        setHasParticipated(false)
        return
      }

      try {
        const participation = await getDocument(
          'eventParticipations',
          `${EVENT_ID}_${member.uid}`
        )
        if (active) setHasParticipated(Boolean(participation))
      } catch {
        if (active) setErrorMessage('참여 정보를 불러오지 못했습니다.')
      }
    })

    getCollection('products')
      .then((items) => {
        if (active) setProducts(items)
      })
      .catch(() => {
        if (active) setProducts([])
      })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    document.body.classList.toggle('jajak-roulette-spinning', isSpinning)

    return () => document.body.classList.remove('jajak-roulette-spinning')
  }, [isSpinning])

  useEffect(() => {
    document.body.classList.add('jajak-roulette-page')

    return () => {
      document.body.classList.remove('jajak-roulette-page')
      window.clearTimeout(loginNoticeTimerRef.current)
    }
  }, [])

  const showLoginNotice = (message) => {
    window.clearTimeout(loginNoticeTimerRef.current)
    setLoginNotice(message)
    loginNoticeTimerRef.current = window.setTimeout(
      () => setLoginNotice(''),
      2600
    )
  }

  const prizesWithImages = useMemo(
    () => PRIZES.map((prize) => {
      if (prize.type !== 'product') return prize
      const product = products.find((item) => item.productId === prize.productId)

      return {
        ...prize,
        imageSrc: resolveProductImage(product?.imageUrl) ?? prize.fallbackImage,
      }
    }),
    [products]
  )

  const saveParticipation = async (prize) => {
    if (!user) throw new Error('LOGIN_REQUIRED')

    const participationRef = doc(
      db, 'eventParticipations', `${EVENT_ID}_${user.uid}`
    )
    const userRef = doc(db, 'users', user.uid)

    await runTransaction(db, async (transaction) => {
      const participationSnapshot = await transaction.get(participationRef)
      if (participationSnapshot.exists()) throw new Error('ALREADY_PARTICIPATED')

      if (prize.type === 'point') {
        const userSnapshot = await transaction.get(userRef)
        const currentPoints = Number(userSnapshot.data()?.points ?? 0)
        transaction.update(userRef, { points: currentPoints + prize.points })
      }

      transaction.set(participationRef, {
        eventId: EVENT_ID,
        userId: user.uid,
        eventTitle: EVENT_TITLE,
        rewardType: prize.type,
        rewardRank: prize.rank,
        rewardName: prize.name,
        rewardProductId: prize.productId ?? null,
        rewardPoints: prize.points ?? null,
        participatedAt: serverTimestamp(),
      })
    })
  }

  const animateWheel = (prize) => new Promise((resolve) => {
    const wheel = wheelRef.current
    const landingOffset = (Math.random() * 44) - 22
    const landingAngle = (prize.wheelAngle + landingOffset + 360) % 360
    const currentRotation = currentRotationRef.current
    const finalAdjustment = (360 - ((currentRotation + landingAngle) % 360)) % 360
    const fullSpins = 5 + Math.floor(Math.random() * 4)
    const finalRotation = currentRotation + (fullSpins * 360) + finalAdjustment
    currentRotationRef.current = finalRotation

    const finish = () => {
      wheel.removeEventListener('transitionend', handleTransitionEnd)
      resolve()
    }
    const handleTransitionEnd = (eventObject) => {
      if (eventObject.propertyName === 'transform') finish()
    }

    wheel.addEventListener('transitionend', handleTransitionEnd)
    wheel.style.transition = 'transform 4600ms cubic-bezier(.45, 0, .15, 1)'
    requestAnimationFrame(() => {
      wheel.style.transform = `rotate(${finalRotation}deg)`
    })
    setTimeout(finish, 4800)
  })

  const spin = async () => {
    if (isSpinning || isSaving || hasParticipated) return
    if (!user) {
      showLoginNotice('로그인 후 룰렛 이벤트에 참여할 수 있어요.')
      return
    }

    const prize = drawPrize()
    const prizeWithImage = prizesWithImages.find((item) => item.rank === prize.rank)
    const stageBounds = stageRef.current.getBoundingClientRect()
    const horizontalShift = (window.innerWidth / 2) - (stageBounds.left + (stageBounds.width / 2))
    const verticalShift = (window.innerHeight / 2) - (stageBounds.top + (stageBounds.height / 2))
    stageRef.current.style.setProperty('--roulette-shift-x', `${horizontalShift}px`)
    stageRef.current.style.setProperty('--roulette-shift-y', `${verticalShift}px`)
    setErrorMessage('')
    setIsSaving(true)
    setIsSpinning(true)
    const animation = animateWheel(prize)

    try {
      await Promise.all([saveParticipation(prize), animation])
      setHasParticipated(true)
      setIsSaving(false)
      setIsSpinning(false)
      setResult(prizeWithImage)
    } catch (error) {
      await animation.catch(() => {})
      setIsSaving(false)
      setIsSpinning(false)

      if (error.message === 'ALREADY_PARTICIPATED') {
        setHasParticipated(true)
        setErrorMessage('이미 룰렛 이벤트에 참여했습니다. 내역을 확인해 주세요.')
      } else {
        setErrorMessage('이벤트 참여 처리 중 오류가 발생했습니다. 다시 시도해 주세요.')
      }
    }
  }

  return (
    <main
      className={`${styles.page} ${isSpinning ? styles.isSpinning : ''}`}
      style={{ '--roulette-background': `url(${backgroundImage})` }}
    >
      <div className={styles.runningTrail} aria-hidden="true" />
      <div className={styles.runningTrack} aria-hidden="true">
        <img className={styles.runningFrame} src={running2} alt="" />
        <img className={styles.runningFrame} src={running3} alt="" />
      </div>

      <section className={styles.hero} aria-label="막동이 룰렛 이벤트">
        <div className={styles.gameArea}>
          <img className={styles.makdong} src={makdong} alt="룰렛을 소개하는 막동이" />

          <div ref={stageRef} className={styles.rouletteStage}>
            <img className={styles.rouletteBack} src={rouletteBack} alt="" />
            <img ref={wheelRef} className={styles.rouletteWheel} src={rouletteWheel} alt="1등부터 6등까지의 경품 룰렛" />
            <img className={styles.rouletteFront} src={rouletteFront} alt="" />
            <button
              className={styles.spinButton}
              type="button"
              onClick={spin}
              disabled={isSpinning || isSaving || hasParticipated}
              aria-label="룰렛 돌리기"
            >
              {isSpinning || isSaving ? '추첨중...' : hasParticipated ? '참여 완료' : '클릭!'}
            </button>
          </div>
        </div>

        <aside className={styles.eventCard}>
          <p className={styles.chanceRibbon}>회원당 1회 참여 가능!</p>
          <h1>{EVENT_TITLE}</h1>
          <p className={styles.description}>{event.detailDescription}</p>

          <dl className={styles.eventMeta}>
            <div>
              <dt>이벤트 기간</dt>
              <dd>{formatPeriod(event.eventPeriod)}</dd>
            </div>
            <div>
              <dt>참여 가능 횟수</dt>
              <dd>{hasParticipated ? '0 / 1' : '1 / 1'}</dd>
            </div>
          </dl>

          <ul className={styles.precautions}>
            <li>로그인 회원에 한해 이벤트당 1회 참여할 수 있습니다.</li>
            <li>혜택은 즉시 지급되며 마이페이지에서 확인할 수 있습니다.</li>
            <li>부정한 방법으로 참여한 경우 경품이 회수될 수 있습니다.</li>
          </ul>

          {errorMessage && <p className={styles.errorMessage} role="alert">{errorMessage}</p>}

          <Link
            className={styles.historyLink}
            to={`${PATHS.mypage}/events`}
            onClick={(eventObject) => {
              if (user) return
              eventObject.preventDefault()
              showLoginNotice('로그인 후 이벤트 참여 내역을 확인할 수 있어요.')
            }}
          >
            참여 내역 확인하기
          </Link>
        </aside>
      </section>

      <section className={styles.prizeSection} aria-labelledby="prize-title">
        <h2 id="prize-title"><span>→</span> 경품 안내 <span>←</span></h2>
        <div className={styles.prizeGrid}>
          {prizesWithImages.map((prize) => (
            <article className={styles.prizeCard} key={prize.rank}>
              <span className={`${styles.rank} ${prize.rank === 1 ? styles.firstRank : ''}`}>{prize.rank}등</span>
              <h3>{prize.name}</h3>
              {prize.type === 'product' ? (
                <div className={styles.prizeImage}>
                  <img src={prize.imageSrc} alt={prize.name} />
                </div>
              ) : (
                <div className={styles.pointIcon} aria-label="포인트">P</div>
              )}
              <p>{prize.description}</p>
            </article>
          ))}
        </div>
      </section>

      {loginNotice && (
        <div className={styles.loginNotice} role="alert">
          <span aria-hidden="true">!</span>
          <strong>{loginNotice}</strong>
          <Link to={PATHS.login}>로그인하러 가기 <span aria-hidden="true">›</span></Link>
        </div>
      )}

      {result && (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={() => setResult(null)}>
          <section className={styles.resultModal} role="dialog" aria-modal="true" aria-labelledby="result-title" onMouseDown={(eventObject) => eventObject.stopPropagation()}>
            <button className={styles.closeButton} type="button" onClick={() => setResult(null)} aria-label="당첨 결과 닫기">×</button>
            <div className={styles.giftIcon} aria-hidden="true" />
            <h2 id="result-title">당첨을 축하드립니다!</h2>
            <div className={styles.resultPrize}>
              {result.type === 'product' ? (
                <img src={result.imageSrc} alt={result.name} />
              ) : (
                <span className={styles.resultPoint}>P</span>
              )}
              <div>
                <strong>{result.name}</strong>
                <p>{result.description}</p>
              </div>
            </div>
            <dl className={styles.resultMeta}>
              <div><dt>응모 이벤트</dt><dd>{EVENT_TITLE}</dd></div>
              <div><dt>응모 날짜</dt><dd>{formatToday()}</dd></div>
              <div><dt>당첨일</dt><dd>{formatToday()}</dd></div>
            </dl>
            <Link to={`${PATHS.mypage}/events`}>내역 확인하기</Link>
          </section>
        </div>
      )}
    </main>
  )
}

export default RouletteEvent
