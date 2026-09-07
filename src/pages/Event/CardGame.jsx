import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCurrentUserData, subscribeToAuthState } from '../../firebase/auth'
import { saveEventParticipation } from '../../services/eventParticipation'
import { PATHS } from '../../routes/paths'
import backgroundImage from '../../assets/images/eventPage/background4.png'
import cardBack from '../../assets/images/eventPage/cardBack.png'
import card1 from '../../assets/images/eventPage/card1.png'
import card2 from '../../assets/images/eventPage/card2.png'
import card3 from '../../assets/images/eventPage/card3.png'
import card4 from '../../assets/images/eventPage/card4.png'
import card5 from '../../assets/images/eventPage/card5.png'
import card6 from '../../assets/images/eventPage/card6.png'
import styles from './CardGame.module.scss'

const EVENT_ID = 'event-2'
const EVENT_TITLE = '짝꿍 카드를 찾아라!'
const PREVIEW_SECONDS = 10
const GAME_SECONDS = 30

const CARD_PAIRS = [
  { pairId: 1, image: card1, points: 500, alt: '막동이 카드' },
  { pairId: 2, image: card2, points: 700, alt: '전 카드' },
  { pairId: 3, image: card3, points: 1000, alt: '특별 카드' },
  { pairId: 4, image: card4, points: 100, alt: '막걸리 카드' },
  { pairId: 5, image: card5, points: 100, alt: '소주 카드' },
  { pairId: 6, image: card6, points: 100, alt: '과실주 카드' },
]

const shuffleCards = () => {
  const cards = CARD_PAIRS.flatMap((card) => [0, 1].map((copy) => ({
    ...card,
    instanceId: `${card.pairId}-${copy}`,
  })))

  for (let index = cards.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1))
    ;[cards[index], cards[randomIndex]] = [cards[randomIndex], cards[index]]
  }

  return cards
}

const formatDate = () => new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date())

const CardGame = () => {
  const navigate = useNavigate()
  const cards = useMemo(shuffleCards, [])
  const matchTimerRef = useRef(null)
  const mismatchBorderTimerRef = useRef(null)
  const hasFinishedRef = useRef(false)
  const scoreRef = useRef(0)
  const matchedCountRef = useRef(0)
  const userRef = useRef(null)

  const [phase, setPhase] = useState('intro')
  const [previewSeconds, setPreviewSeconds] = useState(PREVIEW_SECONDS)
  const [remainingSeconds, setRemainingSeconds] = useState(GAME_SECONDS)
  const [revealedCards, setRevealedCards] = useState([])
  const [matchedPairs, setMatchedPairs] = useState(new Set())
  const [mismatchedCards, setMismatchedCards] = useState([])
  const [isResolving, setIsResolving] = useState(false)
  const [isQuitOpen, setIsQuitOpen] = useState(false)
  const [score, setScore] = useState(0)
  const [result, setResult] = useState(null)
  const [nickname, setNickname] = useState('')
  const [saveMessage, setSaveMessage] = useState('')
  const [flippedCardCount, setFlippedCardCount] = useState(0)

  useEffect(() => {
    document.body.classList.add('jajak-card-game')
    return () => {
      document.body.classList.remove('jajak-card-game')
      window.clearTimeout(matchTimerRef.current)
      window.clearTimeout(mismatchBorderTimerRef.current)
    }
  }, [])

  useEffect(() => {
    let active = true
    const unsubscribe = subscribeToAuthState(async (currentUser) => {
      const member = currentUser && !currentUser.isAnonymous ? currentUser : null
      userRef.current = member
      if (!member) return

      try {
        const memberData = await getCurrentUserData(member.uid)
        if (active) setNickname(memberData?.nickname ?? member.displayName ?? '')
      } catch {
        if (active) setNickname(member.displayName ?? '')
      }
    })

    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const saveParticipation = useCallback(async (finalScore, outcome, pairCount) => {
    const user = userRef.current
    if (!user) {
      setSaveMessage('로그인 상태에서만 포인트와 참여 내역이 저장됩니다.')
      return
    }

    try {
      await saveEventParticipation({
        eventId: EVENT_ID, eventTitle: EVENT_TITLE, rewardType: 'point',
        rewardRank: null, rewardName: `${pairCount}쌍 성공 포인트 (${outcome})`,
        rewardProductId: null, rewardPoints: finalScore, isWinner: finalScore > 0,
      })
      setSaveMessage(finalScore > 0 ? `${finalScore.toLocaleString('ko-KR')}P가 지급되었습니다.` : '참여 내역이 저장되었습니다.')
    } catch (error) {
      setSaveMessage(error.message === 'ALREADY_PARTICIPATED'
        ? '오늘의 참여 기회를 이미 사용했습니다.'
        : '결과를 저장하지 못했습니다. 잠시 후 다시 확인해주세요.')
    }
  }, [])

  const finishGame = useCallback((outcome, finalScore = scoreRef.current, pairCount = matchedCountRef.current) => {
    if (hasFinishedRef.current) return
    hasFinishedRef.current = true
    window.clearTimeout(matchTimerRef.current)
    window.clearTimeout(mismatchBorderTimerRef.current)
    setPhase('finished')
    setIsResolving(true)
    setResult({ outcome, score: finalScore, pairCount })
    void saveParticipation(finalScore, outcome, pairCount)
  }, [saveParticipation])

  useEffect(() => {
    if (phase !== 'intro') return undefined
    const timer = window.setTimeout(() => setPhase('dealing'), 2200)
    return () => window.clearTimeout(timer)
  }, [phase])

  useEffect(() => {
    if (phase !== 'preview' || isQuitOpen) return undefined
    const timer = window.setInterval(() => {
      setPreviewSeconds((current) => {
        if (current <= 1) {
          window.clearInterval(timer)
          setPhase('starting')
          return 0
        }
        return current - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [phase, isQuitOpen])

  useEffect(() => {
    if (phase !== 'starting' || isQuitOpen) return undefined
    if (flippedCardCount >= cards.length) {
      const finishTimer = window.setTimeout(() => setPhase('playing'), 260)
      return () => window.clearTimeout(finishTimer)
    }

    const flipTimer = window.setTimeout(() => {
      setFlippedCardCount((current) => current + 1)
    }, 90)
    return () => window.clearTimeout(flipTimer)
  }, [cards.length, flippedCardCount, phase, isQuitOpen])

  useEffect(() => {
    if (phase !== 'playing' || isQuitOpen) return undefined
    const timer = window.setInterval(() => {
      setRemainingSeconds((current) => {
        const next = Math.max(0, current - 0.1)
        if (next === 0) {
          window.clearInterval(timer)
          finishGame('timeout')
        }
        return next
      })
    }, 100)
    return () => window.clearInterval(timer)
  }, [phase, isQuitOpen, finishGame])

  const handleCardClick = (card) => {
    if (phase !== 'playing' || isQuitOpen || isResolving || matchedPairs.has(card.pairId) || revealedCards.includes(card.instanceId)) return

    const nextRevealed = [...revealedCards, card.instanceId]
    setRevealedCards(nextRevealed)
    if (nextRevealed.length < 2) return
    setIsResolving(true)

    const firstCard = cards.find((item) => item.instanceId === nextRevealed[0])
    if (firstCard.pairId !== card.pairId) {
      mismatchBorderTimerRef.current = window.setTimeout(() => setMismatchedCards(nextRevealed), 560)
      matchTimerRef.current = window.setTimeout(() => finishGame('mismatch'), 1150)
      return
    }

    matchTimerRef.current = window.setTimeout(() => {
      const nextScore = scoreRef.current + card.points
      const nextPairCount = matchedCountRef.current + 1
      scoreRef.current = nextScore
      matchedCountRef.current = nextPairCount
      setScore(nextScore)
      setMatchedPairs((current) => new Set(current).add(card.pairId))
      setRevealedCards([])

      if (nextPairCount === CARD_PAIRS.length) finishGame('success', nextScore, nextPairCount)
      else setIsResolving(false)
    }, 500)
  }

  const handleQuit = async () => {
    if (hasFinishedRef.current) return
    hasFinishedRef.current = true
    window.clearTimeout(matchTimerRef.current)
    window.clearTimeout(mismatchBorderTimerRef.current)
    setPhase('finished')
    await saveParticipation(scoreRef.current, 'quit', matchedCountRef.current)
    navigate(PATHS.events)
  }

  const progress = ((GAME_SECONDS - remainingSeconds) / GAME_SECONDS) * 100
  const isGameUiVisible = phase === 'playing' || phase === 'finished'

  return (
    <main className={`${styles.page} ${isQuitOpen ? styles.isPaused : ''}`} style={{ '--card-game-background': `url(${backgroundImage})` }}>
      {phase === 'intro' && <p className={styles.introMessage}>10초 안에 같은 그림의 위치를 외우세요!</p>}

      <div className={`${styles.gameShell} ${phase === 'intro' ? styles.isIntro : ''} ${phase === 'dealing' ? styles.isDealing : ''} ${phase === 'preview' ? styles.isPreview : ''} ${phase === 'starting' ? styles.isStarting : ''} ${isGameUiVisible ? styles.isPlaying : ''}`}>
        <div className={styles.topLine}>
          <button type="button" onClick={() => setIsQuitOpen(true)}>← 그만두기</button>
          <p className={styles.gameStatus} aria-live="polite">
            {phase === 'dealing' ? '' : phase === 'preview'
              ? <span className={styles.countdownNumber} key={previewSeconds}>{previewSeconds}</span>
              : phase === 'starting' ? 'START' : '짝꿍 카드를 찾아라!'}
          </p>
        </div>

        <div className={`${styles.timerArea} ${!isGameUiVisible ? styles.isTimerHidden : ''}`} aria-hidden={!isGameUiVisible}>
          <div className={styles.progressTrack}><span style={{ width: `${progress}%` }} /></div>
          <time>00:{String(Math.ceil(remainingSeconds)).padStart(2, '0')}</time>
        </div>

        <section
          className={styles.board}
          aria-label="짝 맞추기 카드 12장"
          onAnimationEnd={(event) => {
            if (phase === 'dealing' && event.target === event.currentTarget) setPhase('preview')
          }}
        >
          {cards.map((card, index) => {
            const isFaceUp = phase === 'preview'
              || (phase === 'starting' && index >= flippedCardCount)
              || matchedPairs.has(card.pairId)
              || revealedCards.includes(card.instanceId)
            return (
              <button
                className={`${styles.card} ${isFaceUp ? styles.isFaceUp : ''} ${matchedPairs.has(card.pairId) ? styles.isMatched : ''} ${mismatchedCards.includes(card.instanceId) ? styles.isMismatch : ''}`}
                type="button"
                aria-label={isFaceUp ? `${card.points.toLocaleString('ko-KR')}포인트 ${card.alt}` : '뒤집힌 카드'}
                disabled={phase !== 'playing' || isResolving || matchedPairs.has(card.pairId)}
                onClick={() => handleCardClick(card)}
                key={card.instanceId}
              >
                <span className={styles.cardInner}>
                  <span className={styles.cardFront}>
                    <img src={card.image} alt="" />
                  </span>
                  <span className={styles.cardBack}><img src={cardBack} alt="" /></span>
                </span>
              </button>
            )
          })}
        </section>

        <p className={`${styles.scoreRibbon} ${!isGameUiVisible ? styles.isScoreHidden : ''}`}>{score.toLocaleString('ko-KR')}POINT</p>
      </div>

      {isQuitOpen && (
        <div className={styles.modalBackdrop}>
          <section className={styles.quitModal} role="dialog" aria-modal="true" aria-labelledby="quit-title">
            <h2 id="quit-title">게임을 그만두시겠습니까?</h2>
            <p>그만 두게 될 시 오늘의 기회를 소진하게 됩니다. 괜찮으시겠습니까?</p>
            <div>
              <button type="button" onClick={() => setIsQuitOpen(false)}>계속하기</button>
              <button type="button" onClick={handleQuit}>그만두기</button>
            </div>
          </section>
        </div>
      )}

      {result && (
        <div className={styles.modalBackdrop}>
          <section className={styles.resultModal} role="dialog" aria-modal="true" aria-labelledby="result-title">
            <button className={styles.closeButton} type="button" aria-label="결과 닫기" onClick={() => navigate(PATHS.events)}>×</button>
            <h2 id="result-title">
              {nickname ? `${nickname}나리가` : '나리가'} 맞추신 카드는 {result.pairCount}쌍입니다!
            </h2>
            <div className={styles.resultPoint}><strong>{result.score.toLocaleString('ko-KR')}P 증정</strong></div>
            <dl>
              <div><dt>응모 이벤트</dt><dd>{EVENT_TITLE}</dd></div>
              <div><dt>응모 날짜</dt><dd>{formatDate()}</dd></div>
              <div><dt>당첨일</dt><dd>{formatDate()}</dd></div>
            </dl>
            {saveMessage && <p className={styles.saveMessage}>{saveMessage}</p>}
            <div className={styles.resultActions}>
              <Link to={PATHS.events}>목록으로 돌아가기</Link>
              <Link to={`${PATHS.mypage}/events`}>내역 확인하기</Link>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

export default CardGame
