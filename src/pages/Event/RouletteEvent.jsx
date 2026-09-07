import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getCurrentUserData, subscribeToAuthState } from '../../firebase/auth'
import { getCollection } from '../../firebase/firestore'
import { getEventParticipationAvailability, saveEventParticipation } from '../../services/eventParticipation'
import { PATHS } from '../../routes/paths'
import eventsData from '../../data/events.json'
import rouletteBack from '../../assets/images/eventPage/roulette3.png'
import rouletteFront from '../../assets/images/eventPage/roulette1.png'
import makdong from '../../assets/characters/M007_Poses07.png'
import running2 from '../../assets/images/eventPage/running2.png'
import running3 from '../../assets/images/eventPage/running3.png'
import giftIcon from '../../assets/icons/gift.png'
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
const TOTAL_PRIZE_WEIGHT = PRIZES.reduce((total, prize) => total + prize.weight, 0)

/*
  칸 너비를 당첨 확률에 맞게 다시 배분한다.
  전부 60도씩 똑같이 나누면 1등도 6등이랑 크기가 같아서
  "당첨되기 어렵다"는 느낌이 안 살기 때문에,
  확률이 낮을수록(1등) 칸이 좁아지고 확률이 높을수록(6등) 넓어지게 한다.
  weight를 그대로 쓰면 1등이 3.6도로 너무 얇아져 텍스트가 안 들어가서
  제곱근으로 완만하게 눌러서 배분한다.
  기존 wheelAngle(0/60/120/...)은 각 상품이 원 위에서 어느 순서로
  앉는지 정하는 힌트로만 쓰고, 실제 각도는 여기서 다시 계산해 덮어쓴다.
*/
const wheelOrder = [...PRIZES].sort((a, b) => a.wheelAngle - b.wheelAngle)
const totalVisualWeight = wheelOrder.reduce((sum, prize) => sum + Math.sqrt(prize.weight), 0)

let wheelCursor = 0
wheelOrder.forEach((prize) => {
  const span = (Math.sqrt(prize.weight) / totalVisualWeight) * 360
  prize.wheelAngle = wheelCursor + (span / 2)
  prize.wheelSpan = span
  wheelCursor += span
})

const WHEEL_CENTER = { x: 948 * 0.4604, y: 454 }
const WHEEL_RADIUS = 380
const wheelPoint = (angle, radius) => {
  const radians = angle * Math.PI / 180
  return { x: WHEEL_CENTER.x + radius * Math.sin(radians), y: WHEEL_CENTER.y - radius * Math.cos(radians) }
}

const wheelSegments = PRIZES.map((prize) => {
  const halfSpan = prize.wheelSpan / 2
  const start = wheelPoint(prize.wheelAngle - halfSpan, WHEEL_RADIUS)
  const end = wheelPoint(prize.wheelAngle + halfSpan, WHEEL_RADIUS)
  const label = wheelPoint(prize.wheelAngle, 282)
  return {
    ...prize,
    path: `M ${WHEEL_CENTER.x} ${WHEEL_CENTER.y} L ${start.x} ${start.y} A ${WHEEL_RADIUS} ${WHEEL_RADIUS} 0 0 1 ${end.x} ${end.y} Z`,
    label,
  }
})

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
  const [isAdmin, setIsAdmin] = useState(false)
  const [products, setProducts] = useState([])
  const [hasParticipated, setHasParticipated] = useState(false)
  const [isAvailabilityLoading, setIsAvailabilityLoading] = useState(true)
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
        setIsAdmin(false)
        setHasParticipated(false)
        setIsAvailabilityLoading(false)
        return
      }

      setIsAvailabilityLoading(true)
      try {
        const [availability, memberData] = await Promise.all([
          getEventParticipationAvailability(EVENT_ID, event.participationLimit),
          getCurrentUserData(member.uid),
        ])
        const admin = memberData?.role === 'admin'
        if (active) {
          setIsAdmin(admin)
          setHasParticipated(!availability.canParticipate && !admin)
        }
      } catch {
        if (active) setErrorMessage('참여 정보를 불러오지 못했습니다.')
      } finally {
        if (active) setIsAvailabilityLoading(false)
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
  }, [event.participationLimit])

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

    await saveEventParticipation({
      eventId: EVENT_ID, eventTitle: EVENT_TITLE, rewardType: prize.type,
      rewardRank: prize.rank, rewardName: prize.name,
      rewardProductId: prize.productId ?? null,
      rewardPoints: prize.points ?? 0, isWinner: true,
      outcome: 'completed', participationLimit: event.participationLimit,
    })
  }

  const animateWheel = (prize) => new Promise((resolve) => {
    const wheel = wheelRef.current
    // 칸 너비가 상품마다 달라서, 좁은 칸(1등 등)에서 화살표가
    // 옆 칸으로 넘어가지 않게 여유(6도)를 두고 그 안에서만 랜덤 착지한다.
    const maxLandingOffset = Math.max((prize.wheelSpan / 2) - 6, 2)
    const landingOffset = (Math.random() * 2 - 1) * maxLandingOffset
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
    if (isSpinning || isSaving || isAvailabilityLoading || hasParticipated) return
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
      setHasParticipated(!isAdmin)
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
    <main className={`${styles.page} ${isSpinning ? styles.isSpinning : ''}`}>
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
            <svg ref={wheelRef} className={styles.rouletteWheel} viewBox="0 0 948 908" role="img" aria-label="1등부터 6등까지의 경품 룰렛">
              <title>경품 룰렛: {PRIZES.map((prize) => `${prize.rank}등 ${prize.name}`).join(', ')}</title>
              {wheelSegments.map((prize) => (
                <g key={prize.rank} className={`${styles.wheelSegment} ${prize.rank === 1 ? styles.wheelGold : prize.rank % 2 === 0 ? styles.wheelCream : styles.wheelMint}`}>
                  <path d={prize.path} />
                  <g transform={`translate(${prize.label.x} ${prize.label.y})`}>
                    <text className={styles.wheelRank} textAnchor="middle" dominantBaseline="middle">{prize.rank}등</text>
                  </g>
                </g>
              ))}
              <circle className={styles.wheelRim} cx={WHEEL_CENTER.x} cy={WHEEL_CENTER.y} r={WHEEL_RADIUS} />
            </svg>
            <img className={styles.rouletteFront} src={rouletteFront} alt="" />
            <button
              className={styles.spinButton}
              type="button"
              onClick={spin}
              disabled={isSpinning || isSaving || isAvailabilityLoading || hasParticipated}
              aria-label="룰렛 돌리기"
            >
              {isSpinning || isSaving ? '추첨중...' : hasParticipated ? '참여 완료' : '클릭!'}
            </button>
          </div>
        </div>

        <aside className={styles.eventCard}>
          <p className={styles.chanceRibbon}>{isAdmin ? '관리자 무제한 참여 가능!' : '하루 1회 참여 가능!'}</p>
          <h1>{EVENT_TITLE}</h1>
          <p className={styles.description}>{event.detailDescription}</p>

          <dl className={styles.eventMeta}>
            <div>
              <dt>이벤트 기간</dt>
              <dd>{formatPeriod(event.eventPeriod)}</dd>
            </div>
            <div>
              <dt>참여 가능 횟수</dt>
              <dd>{isAdmin ? '제한 없음' : hasParticipated ? '0 / 1' : '1 / 1'}</dd>
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
          {prizesWithImages.filter((prize) => prize.type === 'product').map((prize) => (
            <article className={`${styles.prizeCard} ${prize.rank === 1 ? styles.grandPrize : ''}`} key={prize.rank}>
              <span className={`${styles.rank} ${prize.rank === 1 ? styles.firstRank : prize.rank === 2 ? styles.secondRank : styles.thirdRank}`}>{prize.rank}등</span>
              <h3>{prize.name}</h3>
                <div className={styles.prizeImage}>
                  <img src={prize.imageSrc} alt={prize.name} />
                </div>
              <p>{prize.description}</p>
            </article>
          ))}
        </div>
        <div className={styles.pointRewards}>
          <h3>포인트 경품</h3>
          <div className={styles.pointGrid}>
            {PRIZES.filter((prize) => prize.type === 'point').map((prize) => (
              <article className={styles.pointReward} key={prize.rank}>
                <span className={styles.pointRank}>{prize.rank}등</span>
                <div className={styles.pointAmount}>
                  <span className={styles.pointIcon} aria-hidden="true">P</span>
                  <h4>{prize.name}</h4>
                </div>
                <p>당첨 확률 {Number((prize.weight / TOTAL_PRIZE_WEIGHT * 100).toFixed(2))}%</p>
              </article>
            ))}
          </div>
          <p className={styles.pointNote}>{PRIZES.find((prize) => prize.type === 'point')?.description}</p>
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
            <img className={styles.giftIcon} src={giftIcon} alt="" />
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
