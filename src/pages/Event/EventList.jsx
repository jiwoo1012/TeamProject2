import { useState } from 'react'
import { Link } from 'react-router-dom'
import eventsData from '../../data/events.json'
import { PATHS } from '../../routes/paths'
import backgroundImage from '../../assets/images/eventPage/background2.jpg'
import alcoholImage from '../../assets/images/eventPage/alcohol.png'
import makdongImage from '../../assets/characters/M007_Poses03.png'
import styles from './EventList.module.scss'

const bannerImages = import.meta.glob('../../assets/images/banner/eventBanner*.png', { eager: true, import: 'default' })
const PAGE_SIZE = 3

const resolveBanner = (bannerUrl) => {
  const fileName = bannerUrl?.split('/').pop()
  return Object.entries(bannerImages).find(([path]) => path.endsWith(`/${fileName}`))?.[1]
}

const formatDate = (date) => {
  const [year, month, day] = date.split('-')
  return `${year}.${month.padStart(2, '0')}.${day.padStart(2, '0')}`
}

const EventList = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const events = eventsData.map(({ event }, index) => ({ ...event, id: `event-${index + 1}`, bannerSrc: resolveBanner(event.image.bannerUrl) }))
  const totalPages = Math.max(1, Math.ceil(events.length / PAGE_SIZE))
  const visibleEvents = events.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const handlePage = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <main className={styles.page} style={{ '--event-texture': `url(${backgroundImage})` }}>
      <div className={styles.container}>
        <section className={styles.hero}>
          <img className={styles.alcohol} src={alcoholImage} alt="전통주 술병과 잔" />
          <div className={styles.heroText}>
            <p>EVENT</p>
            <h1>막동이와 함께하는 자작의 즐거운 순간</h1>
            <span>오늘의 한잔처럼, 소소하지만 기분 좋은 이벤트를 만나보세요.</span>
          </div>
          <div className={styles.makdongCrop}>
            <img className={styles.makdong} src={makdongImage} alt="술잔을 머리에 얹고 인사하는 막동이" />
          </div>
        </section>

        <section className={styles.eventGrid} aria-label="이벤트 목록">
          {visibleEvents.map((event) => {
            const isRoulette = event.title.includes('룰렛')
            const destination = event.isActive ? (isRoulette ? `${PATHS.events}/roulette` : PATHS.events) : `${PATHS.mypage}/events`
            return (
              <article className={`${styles.eventCard} ${event.isActive ? styles.activeCard : styles.endedCard}`} key={event.id}>
                <div className={styles.imageArea}>
                  <img src={event.bannerSrc} alt={`${event.title} 배너`} />
                  <span className={styles.status}>{event.isActive ? '진행중' : '종료'}</span>
                </div>
                <div className={styles.cardContent}>
                  <h2>{event.title}</h2>
                  <p>{event.description}</p>
                  <time>{formatDate(event.eventPeriod.startDate)} ~ {formatDate(event.eventPeriod.endDate)}</time>
                  <Link to={destination}>{event.isActive ? (isRoulette ? '룰렛 돌리러 가기' : '이벤트 참여하기') : '당첨 확인'}<span aria-hidden="true">›</span></Link>
                </div>
              </article>
            )
          })}
        </section>

        <nav className={styles.pagination} aria-label="이벤트 목록 페이지">
          <button type="button" aria-label="이전 페이지" disabled={currentPage === 1} onClick={() => handlePage(currentPage - 1)}>‹</button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => <button className={currentPage === page ? styles.currentPage : ''} type="button" aria-current={currentPage === page ? 'page' : undefined} onClick={() => handlePage(page)} key={page}>{page}</button>)}
          <button type="button" aria-label="다음 페이지" disabled={currentPage === totalPages} onClick={() => handlePage(currentPage + 1)}>›</button>
        </nav>
      </div>
    </main>
  )
}

export default EventList
