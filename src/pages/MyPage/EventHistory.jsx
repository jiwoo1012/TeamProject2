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
import StatusBadge from '../../components/mypage/StatusBadge'

import styles from './EventHistory.module.scss'


const ITEMS_PER_PAGE = 4


/* =========================
   BANNER
========================= */

const bannerImages =
  import.meta.glob(
    ['../../assets/webpImages/images/banner/eventBanner*.webp', '../../assets/images/banner/eventBanner-6.png'],
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
      (path.endsWith(
        `/${fileName}`
      ) || path.endsWith((`/${fileName}`).replace(/\.(png|jpe?g)$/i, '.webp')))
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
   COMPONENT
========================= */

const EventHistory = () => {
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
    isLoading,
    setIsLoading,
  ] = useState(true)


  const [
    currentPage,
    setCurrentPage,
  ] = useState(1)


  /* =========================
     AUTH
  ========================= */

  useEffect(
    () =>
      subscribeToAuthState(
        setCurrentUser
      ),
    []
  )


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
            documents.length ===
              0
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
            '이벤트 참여 내역 조회 실패:',
            error
          )


          if (
            isMounted
          ) {
            setParticipations(
              []
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
     ACTIVE EVENTS
  ========================= */

  const activeEvents =
    useMemo(
      () =>
        events.filter(
          (
            event
          ) =>
            event.isActive
        ),
      [
        events,
      ]
    )


  /* =========================
     HISTORY
  ========================= */

  const history =
    useMemo(
      () =>
        participations
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
                  participation.eventTitle ??
                  event?.title ??
                  '이벤트',

                bannerSrc:
                  event?.bannerSrc,

                path:
                  event?.path ??
                  PATHS.events,

                isActive:
                  Boolean(
                    event?.isActive
                  ),

                status:
                  participation.rewardType ===
                  'product'
                    ? '당첨'
                    : '참여 완료',
              }
            }
          )

          .sort(
            (
              a,
              b
            ) => {
              const aDate =
                a.participatedAt
                  ?.seconds ??
                0


              const bDate =
                b.participatedAt
                  ?.seconds ??
                0


              return (
                bDate -
                aDate
              )
            }
          ),
      [
        participations,
        events,
      ]
    )


  /* =========================
     SUMMARY
  ========================= */

  const winningHistory =
    useMemo(
      () =>
        history.filter(
          (
            item
          ) =>
            item.rewardType ===
            'product'
        ),
      [
        history,
      ]
    )


  const activeParticipationCount =
    useMemo(
      () =>
        history.filter(
          (
            item
          ) =>
            item.isActive
        ).length,
      [
        history,
      ]
    )


  const summaryItems = [
    {
      label:
        '참여 이벤트',

      count:
        history.length,
    },

    {
      label:
        '응모 중',

      count:
        activeParticipationCount,
    },

    {
      label:
        '당첨 내역',

      count:
        winningHistory.length,
    },
  ]


  /* =========================
     PAGINATION
  ========================= */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        history.length /
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
    history.slice(
      startIndex,
      startIndex +
        ITEMS_PER_PAGE
    )


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
          styles.historyCard
        }
      >

        {/* =========================
            HEADER
        ========================= */}

        <MyPageHeader
          title="이벤트 참여 내역"
        />


        {/* =========================
            SUMMARY
        ========================= */}

        <section
          className={
            styles.summaryPanel
          }
          aria-label="이벤트 참여 요약"
        >
          {summaryItems.map(
            (
              item
            ) => (
              <div
                key={
                  item.label
                }
                className={
                  styles.summaryItem
                }
              >
                <span
                  className={
                    styles.summaryLabel
                  }
                >
                  {
                    item.label
                  }
                </span>


                <strong
                  className={
                    styles.summaryCount
                  }
                >
                  {
                    item.count
                  }
                </strong>
              </div>
            )
          )}
        </section>


        {/* =========================
            ACTIVE EVENTS
        ========================= */}

        <section
          className={
            styles.activeSection
          }
        >
          <div
            className={
              styles.sectionHeading
            }
          >
            <h3>
              응모 중인 이벤트
            </h3>


            <Link
              to={
                PATHS.events
              }
              className={
                styles.moreLink
              }
            >
              전체 보기

              <span
                aria-hidden="true"
              >
                ›
              </span>
            </Link>
          </div>


          {activeEvents.length >
          0 ? (
            <div
              className={
                styles.activeList
              }
            >
              {activeEvents
                .slice(
                  0,
                  2
                )
                .map(
                  (
                    event
                  ) => (
                    <article
                      key={
                        event.id
                      }
                      className={
                        styles.activeCard
                      }
                    >
                      <Link
                        to={
                          event.path
                        }
                        className={
                          styles.activeImage
                        }
                      >
                        {event.bannerSrc ? (
                          <img
                            src={
                              event.bannerSrc
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
                          styles.activeInfo
                        }
                      >
                        <span
                          className={
                            styles.eventTag
                          }
                        >
                          EVENT
                        </span>


                        <Link
                          to={
                            event.path
                          }
                          className={
                            styles.eventTitle
                          }
                        >
                          {
                            event.title
                          }
                        </Link>


                        <time>
                          {event
                            .eventPeriod
                            ?.endDate
                            ? `${event.eventPeriod.endDate.replaceAll(
                                '-',
                                '.'
                              )}까지`
                            : ''}
                        </time>


                        <Link
                          to={
                            event.path
                          }
                          className={
                            styles.applyButton
                          }
                        >
                          참여하기
                        </Link>
                      </div>
                    </article>
                  )
                )}
            </div>
          ) : (
            <div
              className={
                styles.smallEmpty
              }
            >
              현재 진행 중인 이벤트가 없습니다.
            </div>
          )}
        </section>


        {/* =========================
            PARTICIPATION HISTORY
        ========================= */}

        <section
          className={
            styles.participationSection
          }
        >
          <div
            className={
              styles.sectionHeading
            }
          >
            <h3>
              참여 내역
            </h3>


            {!isLoading &&
              history.length >
                0 && (
                <span
                  className={
                    styles.historyCount
                  }
                >
                  총{' '}

                  <strong>
                    {
                      history.length
                    }
                  </strong>

                  건
                </span>
              )}
          </div>


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
                이벤트 참여 내역을 불러오는 중입니다.
              </strong>
            </div>
          ) : history.length >
            0 ? (
            <>
              <div
                className={
                  styles.historyList
                }
              >
                {visibleHistory.map(
                  (
                    item
                  ) => (
                    <article
                      key={
                        item.id
                      }
                      className={
                        styles.historyItem
                      }
                    >
                      <Link
                        to={
                          item.path
                        }
                        className={
                          styles.historyImage
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
                          styles.historyInfo
                        }
                      >
                        <Link
                          to={
                            item.path
                          }
                          className={
                            styles.historyTitle
                          }
                        >
                          {
                            item.title
                          }
                        </Link>


                        <time>
                          참여일{' '}

                          {formatDate(
                            item.participatedAt
                          )}
                        </time>


                        {item.rewardName && (
                          <p>
                            {
                              item.rewardName
                            }
                          </p>
                        )}
                      </div>


                      <StatusBadge
                        tone={
                          item.rewardType ===
                          'product'
                            ? 'complete'
                            : 'default'
                        }
                      >
                        {
                          item.status
                        }
                      </StatusBadge>
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
                  aria-label="이벤트 참여 내역 페이지"
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
                        index +
                        1


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
                !
              </span>


              <strong>
                참여 내역이 없습니다.
              </strong>


              <Link
                to={
                  PATHS.events
                }
                className={
                  styles.emptyButton
                }
              >
                이벤트 참여하기
              </Link>
            </div>
          )}
        </section>

      </div>
    </section>
  )
}


export default EventHistory