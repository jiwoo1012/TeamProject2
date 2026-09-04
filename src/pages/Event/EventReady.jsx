import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { subscribeToAuthState } from '../../firebase/auth'
import eventsData from '../../data/events.json'
import { PATHS } from '../../routes/paths'
import backgroundImage from '../../assets/images/eventPage/background2.jpg'
import cardsImage from '../../assets/images/eventPage/cards.png'
import oImage from '../../assets/images/eventPage/o.png'
import xImage from '../../assets/images/eventPage/x.png'
import cardMakdong from '../../assets/characters/M007_Poses02.png'
import quizMakdong from '../../assets/characters/M007_Poses04.png'
import styles from './EventReady.module.scss'

const EVENT_READY_CONFIG = {
  'card-game': {
    eventIndex: 1,
    eventId: 'event-2',
    character: cardMakdong,
    characterAlt: '카드 게임 참여 방법을 알려주는 막동이',
    buttonText: '카드 맞추기',
    destination: `${PATHS.events}/card-game`,
    steps: [
      '처음 주어진 5초 동안 그림들의 위치를 확인합니다.',
      '게임이 시작되면, 같은 그림을 가진 카드 두 장을 뒤집어 포인트를 획득합니다.',
      '제한시간이 끝나거나 틀린 카드를 뒤집을 때까지 같은 쌍의 카드를 계속 찾아냅니다.',
      '나리의 기억력으로 포인트를 최대한 쟁취해보세요!',
    ],
  },
  'ox-quiz': {
    eventIndex: 2,
    eventId: 'event-3',
    character: quizMakdong,
    characterAlt: 'OX 퀴즈 참여 방법을 알려주는 막동이',
    buttonText: '퀴즈 풀기',
    destination: `${PATHS.events}/ox-quiz`,
    steps: [
      '10개의 문제가 순서대로 제시됩니다.',
      'O 혹은 X를 클릭해 문제의 정답을 맞춰보세요!',
      '맞힌 문제의 수에 따라서 한 문제당 500P, 총 5,000Point를 받을 수 있습니다!',
      '받은 포인트를 가지고 막동이와 즐겁게 쇼핑해요~',
    ],
  },
}

const formatDate = (date) => {
  const [year, month, day] = date.split('-')
  return `${year}.${month.padStart(2, '0')}.${day.padStart(2, '0')}`
}

const EventReady = () => {
  const { eventType } = useParams()
  const config = EVENT_READY_CONFIG[eventType]
  const loginNoticeTimerRef = useRef(null)
  const [currentUser, setCurrentUser] = useState(undefined)
  const [loginNotice, setLoginNotice] = useState('')

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(setCurrentUser)

    return () => {
      unsubscribe()
      window.clearTimeout(loginNoticeTimerRef.current)
    }
  }, [])

  const handleStart = (eventObject) => {
    if (currentUser && !currentUser.isAnonymous) return

    eventObject.preventDefault()
    window.clearTimeout(loginNoticeTimerRef.current)
    setLoginNotice('로그인 후 이벤트에 참여할 수 있어요.')
    loginNoticeTimerRef.current = window.setTimeout(() => setLoginNotice(''), 2600)
  }

  if (!config) return <Navigate to={PATHS.events} replace />

  const event = eventsData[config.eventIndex].event
  const isCardGame = eventType === 'card-game'

  return (
    <main
      className={styles.page}
      style={{ '--ready-background': `url(${backgroundImage})` }}
    >
      <section className={styles.hero} aria-labelledby="event-ready-title">
        <div className={`${styles.sideVisual} ${styles.leftVisual}`} aria-hidden="true">
          {isCardGame ? (
            <img className={styles.cards} src={cardsImage} alt="" />
          ) : (
            <div className={styles.oxImages}>
              <img src={oImage} alt="" />
              <img src={xImage} alt="" />
            </div>
          )}
        </div>

        <article className={styles.infoCard}>
          <p className={styles.chanceRibbon}>
            {event.participationLimit.maxCount}회 참여 가능!
          </p>

          <h1 id="event-ready-title">{event.title}</h1>
          <p className={styles.description}>{event.detailDescription}</p>

          <dl className={styles.eventMeta}>
            <div>
              <dt><span aria-hidden="true">▣</span> 이벤트 기간</dt>
              <dd>
                {formatDate(event.eventPeriod.startDate)} ~ {formatDate(event.eventPeriod.endDate)}
              </dd>
            </div>
            <div>
              <dt><span aria-hidden="true">♙</span> 남은 횟수</dt>
              <dd>1 / {event.participationLimit.maxCount}</dd>
            </div>
          </dl>

          <Link className={styles.startButton} to={config.destination} onClick={handleStart}>
            {config.buttonText}<span aria-hidden="true">›</span>
          </Link>

          <ul className={styles.precautions}>
            {event.precautions.slice(1, 3).map((precaution) => (
              <li key={precaution}>{precaution}</li>
            ))}
          </ul>
        </article>

        <div className={`${styles.sideVisual} ${styles.rightVisual}`}>
          <img src={config.character} alt={config.characterAlt} />
        </div>
      </section>

      <section className={styles.instructions} aria-labelledby="instruction-title">
        <h2 id="instruction-title"><span aria-hidden="true">→</span> 참여 방법 <span aria-hidden="true">←</span></h2>
        <ol>
          {config.steps.map((step, index) => (
            <li key={step}>
              <span aria-hidden="true">{index + 1}</span>
              <p>{step}</p>
            </li>
          ))}
        </ol>
      </section>

      {loginNotice && (
        <div className={styles.loginNotice} role="alert">
          <span aria-hidden="true">!</span>
          <strong>{loginNotice}</strong>
          <Link to={PATHS.login}>로그인하러 가기 <span aria-hidden="true">›</span></Link>
        </div>
      )}
    </main>
  )
}

export default EventReady
