import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, onSnapshot } from 'firebase/firestore'
import eventsData from '../../data/events.json'
import { db } from '../../firebase/firebase'
import { PATHS } from '../../routes/paths'
import MobileTopButton from '../../components/ui/MobileTopButton/MobileTopButton'
import TavernShortcut from '../../components/ui/TavernShortcut/TavernShortcut'
import EventCelebration from '../../components/ui/EventCelebration/EventCelebration'
import eventBanner from '../../assets/images/banner/eventBanner-6.png'
import rouletteCharacter from '../../assets/webpImages/characters/M007_Poses09.webp'
import cardGameCharacter from '../../assets/webpImages/characters/M007_Poses10.webp'
import oxQuizCharacter from '../../assets/webpImages/characters/M007_Poses08.webp'
import useEventListReveal from './useEventListReveal'
import styles from './EventList.module.scss'

const bannerImages = import.meta.glob(['../../assets/webpImages/images/banner/eventBanner*.webp', '../../assets/images/banner/eventBanner-6.png'], {
  eager: true, import: 'default',
})

// 화면용 카피만 관리합니다. 원본 데이터와 게임 이동 경로는 유지합니다.
const gamePresentation = {
  roulette: {
    character: rouletteCharacter,
    benefit: '100% 당첨', title: '막동이 행운 룰렛',
    description: '매일 1회, 경품부터 포인트까지 100% 당첨! 1등부터 3등까지는 특별 선물, 4~6등은 포인트를 받아보세요.', 
    cta: '지금 룰렛 돌리기',
  },
  card: {
    character: cardGameCharacter,
    benefit: '짝을 맞추면 포인트', cta: '카드 맞추기',
  },
  quiz: {
    character: oxQuizCharacter,
    benefit: '정답 맞히고 포인트', cta: '퀴즈 풀기',
  },
}

const getGameType = (title = '') => {
  if (title.includes('룰렛')) return 'roulette'
  if (/O\s?X/.test(title)) return 'quiz'
  if (/카드|짝\s?맞추기/.test(title)) return 'card'
  return null
}

const resolveBanner = (bannerUrl) => {
  if (/^(data:|https?:\/\/)/.test(bannerUrl ?? '')) return bannerUrl
  const fileName = bannerUrl?.split('/').pop()
  return Object.entries(bannerImages).find(([path]) => (path.endsWith('/' + fileName) || path.endsWith(('/' + fileName).replace(/\.(png|jpe?g)$/i, '.webp'))))?.[1]
}

const normalizeEvent = (source, fallbackId) => {
  const event = source.event ?? source
  return {
    ...event,
    id: event.eventId ?? source.id ?? fallbackId,
    image: event.image ?? {},
    eventPeriod: event.eventPeriod ?? { startDate: '', endDate: '' },
    participationLimit: event.participationLimit ?? { type: 'per_user_total', maxCount: 1 },
    precautions: event.precautions ?? [],
    isActive: event.isActive !== false && event.status !== 'ended',
    bannerSrc: resolveBanner(event.image?.bannerUrl),
  }
}

const formatDate = (date = '') => {
  const match = typeof date === 'string' && date.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  return match ? [match[1], match[2].padStart(2, '0'), match[3].padStart(2, '0')].join('.') : '일정 확인 중'
}

const getDestination = (event, gameType) => {
  if (!event.isActive) return PATHS.mypage + '/events'
  if (gameType === 'roulette') return PATHS.events + '/roulette'
  if (gameType === 'quiz') return PATHS.eventReady + '/ox-quiz'
  if (gameType === 'card') return PATHS.eventReady + '/card-game'
  return PATHS.eventReady + '/' + encodeURIComponent(event.id)
}

const EventList = () => {
  const [activeFilter, setActiveFilter] = useState('active')
  const [events, setEvents] = useState(() => eventsData.map(
    (item, index) => normalizeEvent(item, 'event-' + (index + 1))
  ))
  const eventGridRef = useRef(null)

  useEffect(() => onSnapshot(collection(db, 'events'), (snapshot) => {
    if (snapshot.empty) return
    setEvents(snapshot.docs.map((item) => normalizeEvent({ id: item.id, ...item.data() }, item.id)))
  }, (error) => {
    console.error('이벤트 목록 조회 실패:', error)
  }), [])

  const activeCount = events.filter((event) => event.isActive).length
  const filters = [
    { value: 'all', label: '전체', count: events.length },
    { value: 'active', label: '진행중', count: activeCount },
    { value: 'ended', label: '종료', count: events.length - activeCount },
  ]
  const visibleEvents = useMemo(() => {
    const filtered = events.filter((event) => activeFilter === 'all'
      || (activeFilter === 'active' ? event.isActive : !event.isActive))
    // Firestore의 반환 순서와 무관하게 진행 중인 룰렛을 먼저 보여줍니다.
    const rank = (event) => !event.isActive ? 2 : getGameType(event.title) === 'roulette' ? 0 : 1
    return filtered.sort((a, b) => rank(a) - rank(b))
  }, [events, activeFilter])
  const featuredEvent = visibleEvents.find((event) => event.isActive && getGameType(event.title) === 'roulette')

  useEventListReveal(eventGridRef, activeFilter + ':' + visibleEvents.length)

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <section
          className={styles.hero}
          aria-labelledby="event-hero-title"
          style={{ backgroundImage: `url(${eventBanner})` }}
        >
          <div className={styles.heroText}>
            <h1 id="event-hero-title" className={styles.srOnly}>잘 왔어요! 막동이랑 한 판 놀다 가요.</h1>
            <p className={styles.srOnly}>룰렛도, 카드도 준비했어요. 오늘은 뭐부터 해볼까요?</p>
          </div>
        </section>

        <section className={styles.eventSection} ref={eventGridRef} tabIndex={-1} aria-labelledby="event-list-title">
          <div className={styles.sectionHeading}>
            <div>
              <h2 id="event-list-title">한 잔의 여유, 한 번의 즐거움</h2>
            </div>
            <div className={styles.filters} role="group" aria-label="이벤트 상태 필터">
              {filters.map((filter) => (
                <button key={filter.value} type="button"
                  className={activeFilter === filter.value ? styles.selectedFilter : ''}
                  aria-pressed={activeFilter === filter.value}
                  aria-controls="event-results"
                  onClick={() => setActiveFilter(filter.value)}>
                  {filter.label} <span>{filter.count}</span>
                </button>
              ))}
            </div>
          </div>
          <p className={styles.srOnly} role="status">
            {filters.find((filter) => filter.value === activeFilter).label} 이벤트 {visibleEvents.length}개
          </p>
          <div id="event-results" className={[styles.eventGrid, featuredEvent ? styles.featuredGrid : ''].join(' ')}>
            {visibleEvents.map((event) => {
              const gameType = getGameType(event.title)
              const presentation = gamePresentation[gameType]
              const isFeatured = event.id === featuredEvent?.id
              const isDaily = event.participationLimit.type === 'per_day_once'
              const benefit = event.isActive && presentation
                ? [isDaily && '매일 참여', presentation.benefit].filter(Boolean).join(' · ')
                : ''

              return (
                <article key={event.id} className={[
                  styles.eventCard, gameType ? styles[gameType] : '',
                  isFeatured ? styles.featuredCard : '', !event.isActive ? styles.endedCard : '',
                ].filter(Boolean).join(' ')}>
                  <div className={styles.imageArea}>
                    {presentation ? (
                      <div className={styles.gameBanner}>
                        <span className={styles.gameMotif} aria-hidden="true" />
                        <img className={styles.cardCharacter} src={presentation.character} alt="" aria-hidden="true" />
                      </div>
                    ) : event.bannerSrc ? (
                      <img src={event.bannerSrc} alt={event.title + ' 배너'} loading="lazy" />
                    ) : <span className={styles.imageFallback}>JAJAK EVENT</span>}
                  </div>
                  <div className={styles.cardContent}>
                    <div className={styles.cardMeta}>
                      <span className={styles.status}>{event.isActive ? '진행 중' : '종료'}</span>
                      {benefit && <span className={styles.benefit}>{benefit}</span>}
                    </div>
                    <h3>{isFeatured ? presentation.title : event.title}</h3>
                    <p className={styles.description}>{isFeatured ? presentation.description : event.description}</p>
                    <p className={styles.period}>
                      <span>기간</span>
                      <span>{formatDate(event.eventPeriod.startDate)} — {formatDate(event.eventPeriod.endDate)}</span>
                    </p>
                    <Link className={styles.cardLink} to={getDestination(event, gameType)}>
                      {!event.isActive ? '이벤트 보기' : presentation?.cta ?? '이벤트 참여하기'}
                      <span aria-hidden="true">→</span>
                    </Link>
                  </div>
                </article>
              )
            })}
            {visibleEvents.length === 0 && (
              <div className={styles.emptyState}>
                <p>{activeFilter === 'ended' ? '아직 끝난 놀이는 없어요. 지금 열려 있는 놀이를 만나볼까요?' : '다음 놀이를 준비하고 있어요. 조금만 기다려 주세요!'}</p>
                <button type="button" onClick={() => setActiveFilter('all')}>전체 이벤트 보기 →</button>
              </div>
            )}
          </div>
        </section>
      </div>
      <MobileTopButton contentRef={eventGridRef} />
      <TavernShortcut attentionTargetRef={eventGridRef} />
      <EventCelebration />
    </main>
  )
}

export default EventList
