import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { subscribeToAuthState } from '../../firebase/auth'
import { getDocument } from '../../firebase/firestore'
import eventsData from '../../data/events.json'
import { PATHS } from '../../routes/paths'
import styles from './EventHistory.module.scss'

const bannerImages = import.meta.glob('../../assets/images/banner/eventBanner*.png', { eager: true, import: 'default' })

const resolveBanner = (bannerUrl) => {
  const fileName = bannerUrl?.split('/').pop()
  return Object.entries(bannerImages).find(([path]) => path.endsWith(`/${fileName}`))?.[1]
}

const formatDate = (value) => {
  if (!value) return '-'
  const date = typeof value?.toDate === 'function' ? value.toDate() : new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })
    .format(date)
    .replaceAll(' ', '')
}

const getEventPath = (event) => {
  if (event.title.includes('룰렛')) return '/events/roulette'
  if (event.title.includes('카드')) return `${PATHS.eventReady}/card-game`
  if (event.title.includes('OX')) return `${PATHS.eventReady}/ox-quiz`
  return PATHS.events
}

const events = eventsData.map(({ event }, index) => ({
  ...event,
  id: `event-${index + 1}`,
  bannerSrc: resolveBanner(event.image?.bannerUrl),
  path: getEventPath(event),
}))

const EventHistory = () => {
  const [currentUser, setCurrentUser] = useState(undefined)
  const [participations, setParticipations] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => subscribeToAuthState(setCurrentUser), [])

  useEffect(() => {
    let isMounted = true
    if (currentUser === undefined) return undefined

    if (!currentUser) {
      setParticipations([])
      setIsLoading(false)
      return undefined
    }

    setIsLoading(true)
    Promise.all(events.map((event) => getDocument('eventParticipations', `${event.id}_${currentUser.uid}`)))
      .then((documents) => {
        if (isMounted) setParticipations(documents.filter(Boolean))
      })
      .catch((error) => {
        console.error('이벤트 참여 내역 조회 실패:', error)
        if (isMounted) setParticipations([])
      })
      .finally(() => {
        if (isMounted) setIsLoading(false)
      })

    return () => { isMounted = false }
  }, [currentUser])

  const activeEvents = events.filter((event) => event.isActive)

  const history = participations.map((participation) => {
    const event = events.find(({ id }) => id === participation.eventId)
    return {
      ...participation,
      title: participation.eventTitle ?? event?.title ?? '이벤트',
      bannerSrc: event?.bannerSrc,
      status: participation.rewardType === 'product' ? '당첨 완료' : '참여 완료',
    }
  })

  return (
    <section className={styles.page} aria-labelledby="event-history-title">
      <h1 id="event-history-title" className={styles.srOnly}>이벤트 참여 내역</h1>
      <div className={styles.columns}>
        <section className={styles.activeSection} aria-labelledby="active-events-title">
          <h2 id="active-events-title">진행 중인 이벤트</h2>
          <div className={styles.activeList}>
            {activeEvents.map((event) => (
              <article className={styles.activeCard} key={event.id}>
                <div className={styles.activeImage}>{event.bannerSrc && <img src={event.bannerSrc} alt="" />}</div>
                <div className={styles.activeInfo}>
                  <h3>{event.title}</h3>
                  <p>{event.description}</p>
                  <time>{event.eventPeriod.startDate.replaceAll('-', '.')} ~ {event.eventPeriod.endDate.replaceAll('-', '.')}</time>
                  <Link to={event.path}>응모하기</Link>
                </div>
              </article>
            ))}
          </div>
          <Link className={styles.moreEvents} to={PATHS.events}>더 많은 이벤트 보기</Link>
        </section>

        <section className={styles.historySection} aria-labelledby="participation-title">
          <h2 id="participation-title">이벤트 참여 내역</h2>
          {isLoading ? (
            <div className={styles.stateBox} role="status">참여 내역을 불러오는 중입니다.</div>
          ) : history.length > 0 ? (
            <>
              <div className={styles.historyList}>
                {history.map((item) => (
                  <article className={styles.historyCard} key={item.id}>
                    <div className={styles.historyImage}>{item.bannerSrc && <img src={item.bannerSrc} alt="" />}</div>
                    <div className={styles.historyInfo}>
                      <h3>{item.title}</h3>
                      <time>응모일 {formatDate(item.participatedAt)}</time>
                      {item.rewardName && <p>{item.rewardName}</p>}
                    </div>
                    <span className={styles.statusBadge}>{item.status}</span>
                  </article>
                ))}
              </div>
              <Link className={styles.historyLink} to={PATHS.events}>진행 중인 이벤트 보기</Link>
            </>
          ) : (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon} aria-hidden="true">!</span>
              <strong>참여 내역이 없습니다.</strong>
              <p>이벤트에 참여하고 다양한 혜택을 받아보세요.</p>
              <Link to={PATHS.events}>이벤트 참여하기</Link>
            </div>
          )}
        </section>
      </div>
    </section>
  )
}

export default EventHistory
