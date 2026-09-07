import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import eventsData from '../../data/events.json'
import { PATHS } from '../../routes/paths'
import MobileTopButton from '../../components/ui/MobileTopButton/MobileTopButton'

import makdongImage from '../../assets/characters/M007_Poses03.png'
import rouletteCharacter from '../../assets/characters/M007_Poses07.png'
import cardGameCharacter from '../../assets/characters/M007_Poses02.png'
import oxQuizCharacter from '../../assets/characters/M007_Poses04.png'

import styles from './EventList.module.scss'


const bannerImages = import.meta.glob(
  '../../assets/images/banner/eventBanner*.png',
  {
    eager: true,
    import: 'default',
  }
)

const PAGE_SIZE = 3


const resolveBanner = (bannerUrl) => {
  const fileName = bannerUrl?.split('/').pop()

  return Object.entries(bannerImages).find(([path]) =>
    path.endsWith(`/${fileName}`)
  )?.[1]
}


const formatDate = (date) => {
  const [year, month, day] = date.split('-')

  return `${year}.${month.padStart(2, '0')}.${day.padStart(2, '0')}`
}


const EventList = () => {
  const [currentPage, setCurrentPage] = useState(1)
  const eventGridRef = useRef(null)


  const events = eventsData.map(
    ({ event }, index) => ({
      ...event,

      id: `event-${index + 1}`,

      bannerSrc: resolveBanner(
        event.image.bannerUrl
      ),
    })
  )


  const totalPages = Math.max(
    1,
    Math.ceil(events.length / PAGE_SIZE)
  )


  const visibleEvents = events.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  const featuredEvent = visibleEvents.find((event) => event.isActive)


  const handlePage = (page) => {
    setCurrentPage(page)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }


  return (
    <main className={styles.page}>
      <div className={styles.container}>

        {/* ========================================
            이벤트 상단 배너
        ======================================== */}

        <section className={styles.hero}>

          <div className={styles.heroText}>
            <p>EVENT</p>

            <h1>
              막동이와 함께하는<br />자작의 즐거운 순간
            </h1>

            <span>
              오늘의 한잔처럼, 소소하지만 기분 좋은 이벤트를 만나보세요.
            </span>
          </div>


          <div className={styles.makdongCrop}>
            <img
              className={styles.makdong}
              src={makdongImage}
              alt="술잔을 머리에 얹고 인사하는 막동이"
            />
          </div>

        </section>


        {/* ========================================
            이벤트 목록
        ======================================== */}

        <div className={styles.sectionHeading}>
          <div>
            <h2>한 잔의 여유, 한 번의 즐거움</h2>
          </div>
          <span>진행 중 {events.filter((event) => event.isActive).length} · 전체 {events.length}</span>
        </div>

        <section
          className={`${styles.eventGrid} ${featuredEvent ? styles.featuredGrid : ''}`}
          ref={eventGridRef}
          aria-label="이벤트 목록"
        >
          {visibleEvents.map((event) => {

            /*
              이벤트 종류 확인

              현재 이벤트 제목을 기준으로
              각각 다른 페이지로 연결한다.
            */
            const isRoulette =
              event.title.includes('룰렛')

            const isOxQuiz =
              event.title.includes('OX') ||
              event.title.includes('O X')

            const isCardGame =
              event.title.includes('카드') ||
              event.title.includes('짝맞추기') ||
              event.title.includes('짝 맞추기')


            /*
              게임 타입 뱃지 + 캐릭터

              진행 중인 게임형 이벤트에만 노출해서
              "지금 바로 즐기는 게임"이라는 걸
              목록에서부터 보여준다.
            */
            let gameType = null

            if (isRoulette) {
              gameType = {
                label: 'ROULETTE',
                character: rouletteCharacter,
              }
            } else if (isOxQuiz) {
              gameType = {
                label: 'OX QUIZ',
                character: oxQuizCharacter,
              }
            } else if (isCardGame) {
              gameType = {
                label: 'CARD GAME',
                character: cardGameCharacter,
              }
            }


            /*
              이벤트 이동 경로

              룰렛
              → /events/roulette

              OX 퀴즈
              → /events/ox-quiz

              카드 게임
              → /events/card-game

              종료 이벤트
              → 마이페이지 이벤트 내역
            */
            let destination = PATHS.events


            if (!event.isActive) {
              destination = `${PATHS.mypage}/events`
            } else if (isRoulette) {
              destination = `${PATHS.events}/roulette`
            } else if (isOxQuiz) {
              destination = `${PATHS.eventReady}/ox-quiz`
            } else if (isCardGame) {
              destination = `${PATHS.eventReady}/card-game`
            }


            /*
              카드 버튼 문구
            */
            let buttonText = '이벤트 참여하기'


            if (!event.isActive) {
              buttonText = '당첨 확인'
            } else if (isRoulette) {
              buttonText = '룰렛 돌리러 가기'
            } else if (isOxQuiz) {
              buttonText = '퀴즈 풀러 가기'
            } else if (isCardGame) {
              buttonText = '카드 맞추러 가기'
            }


            return (
              <article
                className={`
                  ${styles.eventCard}
                  ${event.id === featuredEvent?.id ? styles.featuredCard : ''}
                  ${
                    event.isActive
                      ? ''
                      : styles.endedCard
                  }
                `}
                key={event.id}
              >

                {/* 이벤트 이미지 */}
                <div className={styles.imageArea}>

                  {gameType && event.isActive ? (

                    /*
                      게임형 이벤트는 실제 배너 사진 대신
                      브랜드 그라디언트 카드를 그려서
                      캐릭터 일러스트가 묻히지 않게 한다.
                    */
                    <div className={styles.gameBanner}>
                      <span className={styles.gameBadge}>
                        {gameType.label}
                      </span>

                      <img
                        className={styles.cardCharacter}
                        src={gameType.character}
                        alt=""
                        aria-hidden="true"
                      />
                    </div>

                  ) : (

                    <img
                      src={event.bannerSrc}
                      alt={`${event.title} 배너`}
                    />

                  )}

                  <span className={styles.status}>
                    {event.isActive
                      ? '진행 중'
                      : '종료'}
                  </span>

                </div>


                {/* 이벤트 내용 */}
                <div className={styles.cardContent}>

                  <h2>
                    {event.title}
                  </h2>


                  <p>
                    {event.description}
                  </p>


                  <time>
                    {formatDate(
                      event.eventPeriod.startDate
                    )}
                    {' ~ '}
                    {formatDate(
                      event.eventPeriod.endDate
                    )}
                  </time>


                  <Link to={destination}>
                    {buttonText}

                    <span aria-hidden="true">
                      ›
                    </span>
                  </Link>

                </div>

              </article>
            )
          })}
        </section>


        {/* ========================================
            페이지네이션
        ======================================== */}

        <nav
          className={styles.pagination}
          aria-label="이벤트 목록 페이지"
        >

          <button
            type="button"
            aria-label="이전 페이지"
            disabled={currentPage === 1}
            onClick={() =>
              handlePage(currentPage - 1)
            }
          >
            ‹
          </button>


          {Array.from(
            {
              length: totalPages,
            },
            (_, index) => index + 1
          ).map((page) => (
            <button
              className={
                currentPage === page
                  ? styles.currentPage
                  : ''
              }
              type="button"
              aria-current={
                currentPage === page
                  ? 'page'
                  : undefined
              }
              onClick={() =>
                handlePage(page)
              }
              key={page}
            >
              {page}
            </button>
          ))}


          <button
            type="button"
            aria-label="다음 페이지"
            disabled={
              currentPage === totalPages
            }
            onClick={() =>
              handlePage(currentPage + 1)
            }
          >
            ›
          </button>

        </nav>

      </div>
      <MobileTopButton contentRef={eventGridRef} />
    </main>
  )
}


export default EventList
