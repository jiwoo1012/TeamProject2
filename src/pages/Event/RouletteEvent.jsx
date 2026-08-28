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
    fallbackImage: fallbackGift, wheelAngle: 120,
  },
  second: {
    rank: 2, weight: 4, type: 'product', name: '새벽 솔잎 막걸리',
    productId: 'liq_002', description: '막동이가 고른 은은한 솔향의 막걸리',
    fallbackImage: fallbackLiquor, wheelAngle: 60,
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
  const [user, setUser] = useState(null)
  const [products, setProducts] = useState([])
  const [hasParticipated, setHasParticipated] = useState(false)
  const [isSpinning, setIsSpinning] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [result, setResult] = useState(null)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    let active = true

    const unsubscribe = subscribeToAuthState(async (currentUser) => {
      if (!active) return
      setUser(currentUser)

      if (!currentUser) {
        setHasParticipated(false)
        return
      }

      try {
        const participation = await getDocument(
          'eventParticipations',
          `${EVENT_ID}_${currentUser.uid}`
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

  const spin = async () => {
    if (isSpinning || isSaving || hasParticipated) return
    if (!user) {
      setErrorMessage('로그인 후 룰렛 이벤트에 참여할 수 있습니다.')
      return
    }

    const prize = drawPrize()
    const prizeWithImage = prizesWithImages.find((item) => item.rank === prize.rank)
    setErrorMessage('')
    setIsSaving(true)

    try {
      await saveParticipation(prize)
      setHasParticipated(true)
      setIsSpinning(true)
      setIsSaving(false)

      const finalRotation = (360 * 8) + (360 - prize.wheelAngle)
      const animation = wheelRef.current.animate(
        [
          { transform: 'rotate(0deg)', offset: 0 },
          { transform: `rotate(${finalRotation * 0.04}deg)`, offset: 0.14 },
          { transform: `rotate(${finalRotation * 0.78}deg)`, offset: 0.62 },
          { transform: `rotate(${finalRotation}deg)`, offset: 1 },
        ],
        {
          duration: 5200,
          easing: 'cubic-bezier(.18,.72,.18,1)',
          fill: 'forwards',
        }
      )

      await animation.finished
      setIsSpinning(false)
      setResult(prizeWithImage)
    } catch (error) {
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
      <section className={styles.hero} aria-label="막동이 룰렛 이벤트">
        <div className={styles.gameArea}>
          <img className={styles.makdong} src={makdong} alt="룰렛을 소개하는 막동이" />

          <div className={styles.rouletteStage}>
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
              {isSaving ? '준비 중' : hasParticipated ? '참여 완료' : '클릭!'}
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

          <Link className={styles.historyLink} to={`${PATHS.mypage}/events`}>
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
