import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  Link,
} from 'react-router-dom'

import {
  subscribeToAuthState,
} from '../../firebase/auth'

import {
  getCollection,
} from '../../firebase/firestore'

import {
  getUserEventParticipations,
} from '../../services/eventParticipation'

import eventsData from '../../data/events.json'

import {
  PATHS,
} from '../../routes/paths'

import MyPageHeader from '../../components/mypage/MyPageHeader'

import styles from './EventWinningHistory.module.scss'


const ITEMS_PER_PAGE = 4


/* =========================
   BANNER
========================= */

const bannerImages =
  import.meta.glob(
    '../../assets/images/banner/eventBanner*.png',
    {
      eager: true,
      import: 'default',
    }
  )


const resolveBanner = (
  bannerUrl
) => {
  const fileName =
    bannerUrl
      ?.split('/')
      .pop()


  return Object.entries(
    bannerImages
  ).find(
    ([path]) =>
      path.endsWith(
        `/${fileName}`
      )
  )?.[1]
}


/* =========================
   DATE
========================= */

const formatDate = (
  value
) => {
  if (!value) {
    return '-'
  }


  const date =
    typeof value?.toDate ===
    'function'
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


/* =========================
   EVENT PATH
========================= */

const getEventPath = (
  event
) => {
  if (
    event.title.includes(
      '룰렛'
    )
  ) {
    return '/events/roulette'
  }


  if (
    event.title.includes(
      '카드'
    )
  ) {
    return `${PATHS.eventReady}/card-game`
  }


  if (
    event.title.includes(
      'OX'
    )
  ) {
    return `${PATHS.eventReady}/ox-quiz`
  }


  return PATHS.events
}


/* =========================
   FALLBACK EVENTS
========================= */

const fallbackEvents =
  eventsData.map(
    (
      { event },
      index
    ) => ({
      ...event,

      id:
        `event-${index + 1}`,

      bannerSrc:
        resolveBanner(
          event.image
            ?.bannerUrl
        ),

      path:
        getEventPath(
          event
        ),
    })
  )


/* =========================
   FILTER
========================= */

const filterItems = [
  {
    label: '전체',
    value: 'all',
  },
  {
    label: '경품 지급 내역',
    value: 'product',
  },
  {
    label: '포인트 지급 내역',
    value: 'point',
  },
]


/* =========================
   REWARD LABEL
========================= */

const getRewardLabel = (
  participation
) => {
  const points =
    Number(
      participation.rewardPoints ||
      0
    )


  if (
    participation.eventId ===
    'event-2'
  ) {
    const matchedCount =
      participation.rewardName
        ?.match(/\d+/)
        ?.[0] ??
      '0'


    return `${matchedCount}쌍 성공 · ${points.toLocaleString(
      'ko-KR'
    )} POINT`
  }


  if (
    participation.eventId ===
    'event-3'
  ) {
    const correctCount =
      participation.rewardName
        ?.match(/\d+/)
        ?.[0] ??
      '0'


    return `${correctCount}문제 정답 · ${points.toLocaleString(
      'ko-KR'
    )} POINT`
  }


  if (
    participation.eventId ===
      'event-1' &&
    participation.rewardType ===
      'point'
  ) {
    const rank =
      Number(
        participation.rewardRank ||
        0
      )


    return `${rank}등 · ${points.toLocaleString(
      'ko-KR'
    )} POINT`
  }


  return (
    participation.rewardName ||
    '이벤트 경품'
  )
}


/* =========================
   DELIVERY LABEL
========================= */

const getDeliveryLabel = (
  participation
) => {
  if (
    participation.rewardType !==
    'product'
  ) {
    return null
  }


  const status =
    String(
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
    return '지급 완료'
  }


  if (
    [
      'shipping',
      'shipped',
      'delivery',
    ].includes(status)
  ) {
    return '배송 중'
  }


  if (
    status ===
    'address_required'
  ) {
    return '배송지 입력 필요'
  }


  return '지급 준비'
}


/* =========================
   COMPONENT
========================= */

const EventWinningHistory = () => {
  const [
    events,
    setEvents,
  ] = useState(
    fallbackEvents
  )


  const [
    currentUser,
    setCurrentUser,
  ] = useState(
    undefined
  )


  const [
    participations,
    setParticipations,
  ] = useState([])


  const [
    activeFilter,
    setActiveFilter,
  ] = useState(
    'all'
  )


  const [
    isLoading,
    setIsLoading,
  ] = useState(true)


  const [
    loadError,
    setLoadError,
  ] = useState('')


  const [
    currentPage,
    setCurrentPage,
  ] = useState(1)


  /* =========================
     AUTH
  ========================= */

  useEffect(() => {
    const unsubscribe =
      subscribeToAuthState(
        setCurrentUser
      )


    return unsubscribe
  }, [])


  /* =========================
     EVENTS
  ========================= */

  useEffect(() => {
    let isMounted = true


    getCollection(
      'events'
    )
      .then(
        (
          documents
        ) => {
          if (
            !isMounted ||
            documents.length === 0
          ) {
            return
          }


          setEvents(
            documents.map(
              (
                document
              ) => ({
                ...document,

                bannerSrc:
                  resolveBanner(
                    document.image
                      ?.bannerUrl
                  ),

                path:
                  getEventPath(
                    document
                  ),
              })
            )
          )
        }
      )

      .catch(
        (
          error
        ) => {
          console.error(
            '이벤트 목록 조회 실패:',
            error
          )
        }
      )


    return () => {
      isMounted = false
    }
  }, [])


  /* =========================
     PARTICIPATIONS
  ========================= */

  useEffect(() => {
    let isMounted = true


    if (
      currentUser ===
      undefined
    ) {
      return undefined
    }


    if (!currentUser) {
      setParticipations(
        []
      )

      setIsLoading(
        false
      )

      return undefined
    }


    setIsLoading(
      true
    )

    setLoadError('')


    getUserEventParticipations(
      currentUser.uid
    )
      .then(
        (
          documents
        ) => {
          if (
            !isMounted
          ) {
            return
          }


          setParticipations(
            documents
          )
        }
      )

      .catch(
        (
          error
        ) => {
          console.error(
            '이벤트 당첨 내역 조회 실패:',
            error
          )


          if (
            isMounted
          ) {
            setParticipations(
              []
            )

            setLoadError(
              '이벤트 당첨 내역을 불러오지 못했습니다.'
            )
          }
        }
      )

      .finally(
        () => {
          if (
            isMounted
          ) {
            setIsLoading(
              false
            )
          }
        }
      )


    return () => {
      isMounted = false
    }
  }, [
    currentUser,
    events,
  ])


  /* =========================
     WINNING HISTORY
  ========================= */

  const winningHistory =
    useMemo(() => {
      return participations
        .filter(
          (
            participation
          ) =>
            participation.rewardType ===
              'product' ||
            participation.rewardType ===
              'point' ||
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
                (
                  {
                    id,
                  }
                ) =>
                  id ===
                  participation.eventId
              )


            return {
              ...participation,

              title:
                participation.eventTitle ||
                event?.title ||
                '이벤트',

              bannerSrc:
                event?.bannerSrc,

              path:
                event?.path ||
                PATHS.events,

              rewardGroup:
                participation.rewardType ===
                'product'
                  ? 'product'
                  : 'point',

              rewardLabel:
                getRewardLabel(
                  participation
                ),

              deliveryLabel:
                getDeliveryLabel(
                  participation
                ),

              wonAt:
                participation.wonAt ||
                participation.participatedAt ||
                participation.createdAt,
            }
          }
        )

        .sort(
          (
            a,
            b
          ) => {
            const aTime =
              a.wonAt?.seconds ||
              0


            const bTime =
              b.wonAt?.seconds ||
              0


            return (
              bTime -
              aTime
            )
          }
        )
    }, [
      participations,
      events,
    ])


  /* =========================
     FILTER
  ========================= */

  const filteredHistory =
    useMemo(() => {
      if (
        activeFilter ===
        'all'
      ) {
        return winningHistory
      }


      return winningHistory.filter(
        (
          item
        ) =>
          item.rewardGroup ===
          activeFilter
      )
    }, [
      winningHistory,
      activeFilter,
    ])


  /* =========================
     PAGINATION
  ========================= */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredHistory.length /
        ITEMS_PER_PAGE
      )
    )


  const startIndex =
    (
      currentPage -
      1
    ) *
    ITEMS_PER_PAGE


  const visibleHistory =
    filteredHistory.slice(
      startIndex,
      startIndex +
        ITEMS_PER_PAGE
    )


  useEffect(() => {
    setCurrentPage(1)
  }, [
    activeFilter,
  ])


  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages
      )
    }
  }, [
    currentPage,
    totalPages,
  ])


  const handleFilterChange = (
    value
  ) => {
    setActiveFilter(
      value
    )

    setCurrentPage(
      1
    )
  }


  /* =========================
     RENDER
  ========================= */

  return (
    <section
      className={
        styles.page
      }
    >
      <div
        className={
          styles.winningCard
        }
      >

        {/* =========================
            HEADER
        ========================= */}

        <MyPageHeader
          title="이벤트 당첨 내역"
        />


        {/* =========================
            FILTER
        ========================= */}

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
              (
                filter
              ) => (
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
                    handleFilterChange(
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


          {!isLoading &&
            !loadError &&
            filteredHistory.length >
              0 && (
              <span
                className={
                  styles.resultCount
                }
              >
                총{' '}

                <strong>
                  {
                    filteredHistory.length
                  }
                </strong>

                건
              </span>
            )}
        </div>


        {/* =========================
            CONTENT
        ========================= */}

        {isLoading ? (
          <div
            className={
              styles.stateBox
            }
            role="status"
          >
            <span
              className={
                styles.loadingSpinner
              }
              aria-hidden="true"
            />


            <strong>
              당첨 내역을 불러오는 중입니다.
            </strong>
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
          <>

            {/* =========================
                LIST
            ========================= */}

            <div
              className={
                styles.winningList
              }
            >
              {visibleHistory.map(
                (
                  item
                ) => (
                  <article
                    key={
                      item.id ||
                      `${item.eventId}-${item.rewardLabel}`
                    }
                    className={
                      styles.winningItem
                    }
                  >

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


                    <div
                      className={
                        styles.eventInfo
                      }
                    >
                      <div
                        className={
                          styles.titleRow
                        }
                      >
                        <span
                          className={`${styles.rewardTypeBadge} ${
                            item.rewardGroup ===
                            'product'
                              ? styles.productType
                              : styles.pointType
                          }`}
                        >
                          {item.rewardGroup ===
                          'product'
                            ? '경품'
                            : '포인트'}
                        </span>


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
                      </div>


                      <strong
                        className={
                          styles.rewardName
                        }
                      >
                        {
                          item.rewardLabel
                        }
                      </strong>


                      <time>
                        당첨일{' '}

                        {formatDate(
                          item.wonAt
                        )}
                      </time>
                    </div>


                    {item.rewardGroup ===
                    'product' ? (
                      <span
                        className={`${styles.deliveryBadge} ${
                          item.deliveryLabel ===
                          '지급 완료'
                            ? styles.completed
                            : styles.pending
                        }`}
                      >
                        {
                          item.deliveryLabel
                        }
                      </span>
                    ) : (
                      <span
                        className={`${styles.deliveryBadge} ${styles.completed}`}
                      >
                        지급 완료
                      </span>
                    )}

                  </article>
                )
              )}
            </div>


            {/* =========================
                PAGINATION
            ========================= */}

            {totalPages > 1 && (
              <nav
                className={
                  styles.pagination
                }
                aria-label="이벤트 당첨 내역 페이지"
              >
                <button
                  type="button"
                  disabled={
                    currentPage ===
                    1
                  }
                  onClick={() =>
                    setCurrentPage(
                      Math.max(
                        1,
                        currentPage -
                          1
                      )
                    )
                  }
                  aria-label="이전 페이지"
                >
                  ‹
                </button>


                {Array.from(
                  {
                    length:
                      totalPages,
                  },
                  (
                    _,
                    index
                  ) => {
                    const pageNumber =
                      index + 1


                    return (
                      <button
                        key={
                          pageNumber
                        }
                        type="button"
                        className={
                          currentPage ===
                          pageNumber
                            ? styles.activePage
                            : ''
                        }
                        onClick={() =>
                          setCurrentPage(
                            pageNumber
                          )
                        }
                      >
                        {
                          pageNumber
                        }
                      </button>
                    )
                  }
                )}


                <button
                  type="button"
                  disabled={
                    currentPage ===
                    totalPages
                  }
                  onClick={() =>
                    setCurrentPage(
                      Math.min(
                        totalPages,
                        currentPage +
                          1
                      )
                    )
                  }
                  aria-label="다음 페이지"
                >
                  ›
                </button>
              </nav>
            )}
          </>
        ) : (
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
              당첨 내역이 없습니다.
            </strong>


            <Link
              to={
                PATHS.events
              }
              className={
                styles.emptyButton
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