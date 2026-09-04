import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { subscribeToAuthState } from '../../firebase/auth'
import { getDocument } from '../../firebase/firestore'

import eventsData from '../../data/events.json'
import { PATHS } from '../../routes/paths'

import styles from './EventWinningHistory.module.scss'


const bannerImages = import.meta.glob(
  '../../assets/images/banner/eventBanner*.png',
  {
    eager: true,
    import: 'default',
  }
)


const resolveBanner = (bannerUrl) => {
  const fileName =
    bannerUrl?.split('/').pop()

  return Object.entries(
    bannerImages
  ).find(([path]) =>
    path.endsWith(`/${fileName}`)
  )?.[1]
}


const formatDate = (value) => {
  if (!value) return '-'

  const date =
    typeof value?.toDate === 'function'
      ? value.toDate()
      : new Date(value)

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '-'
  }

  return new Intl.DateTimeFormat(
    'ko-KR',
    {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }
  )
    .format(date)
    .replaceAll(' ', '')
}


const getEventPath = (event) => {
  if (
    event.title.includes('룰렛')
  ) {
    return '/events/roulette'
  }

  if (
    event.title.includes('카드')
  ) {
    return `${PATHS.eventReady}/card-game`
  }

  if (
    event.title.includes('OX')
  ) {
    return `${PATHS.eventReady}/ox-quiz`
  }

  return PATHS.events
}


const events = eventsData.map(
  ({ event }, index) => ({
    ...event,

    id: `event-${index + 1}`,

    bannerSrc:
      resolveBanner(
        event.image?.bannerUrl
      ),

    path:
      getEventPath(event),
  })
)


const filterItems = [
  {
    label: '전체',
    value: 'all',
  },
  {
    label: '경품 실물 지급 완료',
    value: 'completed',
  },
  {
    label: '경품 실물 발송 예정',
    value: 'pending',
  },
]


const getDeliveryGroup = (
  participation
) => {
  const status = String(
    participation.deliveryStatus ||
      participation.rewardStatus ||
      participation.shippingStatus ||
      ''
  ).toLowerCase()


  if (
    [
      'completed',
      'complete',
      'delivered',
      'received',
      'done',
    ].includes(status)
  ) {
    return 'completed'
  }


  return 'pending'
}


const getActionLabel = (
  participation
) => {
  const status = String(
    participation.deliveryStatus ||
      participation.rewardStatus ||
      participation.shippingStatus ||
      ''
  ).toLowerCase()


  if (
    [
      'completed',
      'complete',
      'delivered',
      'received',
      'done',
    ].includes(status)
  ) {
    return '경품 지급 완료'
  }


  if (
    [
      'shipping',
      'shipped',
      'delivery',
    ].includes(status)
  ) {
    return '경품 배송 중'
  }


  if (
    status === 'address_required'
  ) {
    return '배송지 입력'
  }


  return '당첨 내역 확인'
}


const EventWinningHistory = () => {
  const [
    currentUser,
    setCurrentUser,
  ] = useState(undefined)

  const [
    participations,
    setParticipations,
  ] = useState([])

  const [
    activeFilter,
    setActiveFilter,
  ] = useState('all')

  const [
    isLoading,
    setIsLoading,
  ] = useState(true)

  const [
    loadError,
    setLoadError,
  ] = useState('')


  /* =========================
     로그인
  ========================= */

  useEffect(() => {
    const unsubscribe =
      subscribeToAuthState(
        setCurrentUser
      )

    return unsubscribe
  }, [])


  /* =========================
     이벤트 참여 기록 조회
  ========================= */

  useEffect(() => {
    let isMounted = true


    if (
      currentUser === undefined
    ) {
      return undefined
    }


    if (!currentUser) {
      setParticipations([])
      setIsLoading(false)

      return undefined
    }


    setIsLoading(true)
    setLoadError('')


    Promise.all(
      events.map(
        (event) =>
          getDocument(
            'eventParticipations',

            `${event.id}_${currentUser.uid}`
          )
      )
    )
      .then((documents) => {
        if (!isMounted) {
          return
        }

        setParticipations(
          documents.filter(Boolean)
        )
      })

      .catch((error) => {
        console.error(
          '이벤트 당첨 내역 조회 실패:',
          error
        )

        if (isMounted) {
          setParticipations([])

          setLoadError(
            '이벤트 당첨 내역을 불러오지 못했습니다.'
          )
        }
      })

      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })


    return () => {
      isMounted = false
    }
  }, [currentUser])


  /* =========================
     당첨 내역 가공
  ========================= */

  const winningHistory =
    useMemo(() => {
      return participations
        .filter(
          (participation) =>
            participation.rewardType ===
              'product' ||
            participation.isWinner ===
              true ||
            participation.winner ===
              true ||
            Boolean(
              participation.rewardName
            )
        )

        .map(
          (
            participation
          ) => {
            const event =
              events.find(
                ({ id }) =>
                  id ===
                  participation.eventId
              )


            const deliveryGroup =
              getDeliveryGroup(
                participation
              )


            return {
              ...participation,

              title:
                participation.eventTitle ||
                event?.title ||
                '이벤트',

              rewardName:
                participation.rewardName ||
                '이벤트 경품',

              bannerSrc:
                event?.bannerSrc,

              path:
                event?.path ||
                PATHS.events,

              deliveryGroup,

              actionLabel:
                getActionLabel(
                  participation
                ),

              wonAt:
                participation.wonAt ||
                participation.participatedAt ||
                participation.createdAt,
            }
          }
        )

        .sort((a, b) => {
          const aTime =
            a.wonAt?.seconds ||
            0

          const bTime =
            b.wonAt?.seconds ||
            0

          return bTime - aTime
        })
    }, [participations])


  /* =========================
     필터
  ========================= */

  const filteredHistory =
    useMemo(() => {
      if (
        activeFilter === 'all'
      ) {
        return winningHistory
      }


      return winningHistory.filter(
        (item) =>
          item.deliveryGroup ===
          activeFilter
      )
    }, [
      winningHistory,
      activeFilter,
    ])


  return (
    <section
      className={styles.page}
      aria-labelledby="event-winning-title"
    >

      <div
        className={
          styles.winningCard
        }
      >

        {/* =====================
            HEADER
        ===================== */}

        <header
          className={
            styles.pageHeader
          }
        >
          <h2
            id="event-winning-title"
          >
            이벤트 당첨 내역
          </h2>
        </header>


        <div
          className={
            styles.titleDivider
          }
        />


        {/* =====================
            FILTER
        ===================== */}

        <div
          className={
            styles.controlArea
          }
        >
          <div
            className={
              styles.filters
            }
            role="tablist"
            aria-label="이벤트 당첨 내역 필터"
          >
            {filterItems.map(
              (filter) => (
                <button
                  key={
                    filter.value
                  }
                  type="button"
                  role="tab"
                  aria-selected={
                    activeFilter ===
                    filter.value
                  }
                  className={`${styles.filterButton} ${
                    activeFilter ===
                    filter.value
                      ? styles.activeFilter
                      : ''
                  }`}
                  onClick={() =>
                    setActiveFilter(
                      filter.value
                    )
                  }
                >
                  {
                    filter.label
                  }
                </button>
              )
            )}
          </div>


          <p
            className={
              styles.guide
            }
          >
            <span
              aria-hidden="true"
            >
              □
            </span>

            이벤트 정보는 공지를
            통해 확인
          </p>
        </div>


        {/* =====================
            CONTENT
        ===================== */}

        {isLoading ? (

          <div
            className={
              styles.stateBox
            }
            role="status"
          >
            당첨 내역을
            불러오는 중입니다.
          </div>

        ) : loadError ? (

          <div
            className={
              styles.stateBox
            }
            role="alert"
          >
            {loadError}
          </div>

        ) : filteredHistory.length >
          0 ? (

          <div
            className={
              styles.winningList
            }
          >
            {filteredHistory.map(
              (item) => (

                <article
                  key={
                    item.id ||
                    `${item.eventId}-${item.rewardName}`
                  }
                  className={
                    styles.winningItem
                  }
                >

                  {/* 이미지 */}

                  <Link
                    to={
                      item.path
                    }
                    className={
                      styles.eventImage
                    }
                  >
                    {item.bannerSrc ? (
                      <img
                        src={
                          item.bannerSrc
                        }
                        alt=""
                      />
                    ) : (
                      <span
                        aria-hidden="true"
                      />
                    )}
                  </Link>


                  {/* 내용 */}

                  <div
                    className={
                      styles.eventInfo
                    }
                  >
                    <Link
                      to={
                        item.path
                      }
                      className={
                        styles.eventTitle
                      }
                    >
                      {
                        item.title
                      }
                    </Link>


                    <p>
                      당첨 경품 ·{' '}
                      <strong>
                        {
                          item.rewardName
                        }
                      </strong>
                    </p>


                    <time>
                      당첨일{' '}
                      {formatDate(
                        item.wonAt
                      )}
                    </time>
                  </div>


                  {/* 상태 */}

                  <span
                    className={`${styles.deliveryBadge} ${
                      item.deliveryGroup ===
                      'completed'
                        ? styles.completed
                        : styles.pending
                    }`}
                  >
                    {
                      item.actionLabel
                    }
                  </span>

                </article>

              )
            )}
          </div>

        ) : (

          /* =====================
              EMPTY
          ===================== */

          <div
            className={
              styles.emptyState
            }
          >
            <span
              className={
                styles.emptyIcon
              }
              aria-hidden="true"
            >
              ♡
            </span>

            <strong>
              당첨 내역이
              없습니다.
            </strong>

            <p>
              이벤트에 참여하고
              다양한 경품을
              만나보세요.
            </p>

            <Link
              to={
                PATHS.events
              }
            >
              이벤트 보러가기
            </Link>
          </div>

        )}

      </div>

    </section>
  )
}


export default EventWinningHistory