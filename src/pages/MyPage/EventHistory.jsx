import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { subscribeToAuthState } from '../../firebase/auth'
import { getDocument } from '../../firebase/firestore'

import eventsData from '../../data/events.json'
import { PATHS } from '../../routes/paths'

import styles from './EventHistory.module.scss'


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
    path.endsWith(
      `/${fileName}`
    )
  )?.[1]
}


const formatDate = (value) => {
  if (!value) return '-'

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


const getEventPath = (event) => {
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


const events = eventsData.map(
  ({ event }, index) => ({
    ...event,

    id:
      `event-${index + 1}`,

    bannerSrc:
      resolveBanner(
        event.image?.bannerUrl
      ),

    path:
      getEventPath(event),
  })
)


const EventHistory = () => {
  const [
    currentUser,
    setCurrentUser,
  ] = useState(undefined)

  const [
    participations,
    setParticipations,
  ] = useState([])

  const [
    isLoading,
    setIsLoading,
  ] = useState(true)


  useEffect(
    () =>
      subscribeToAuthState(
        setCurrentUser
      ),
    []
  )


  useEffect(() => {
    let isMounted = true


    if (
      currentUser ===
      undefined
    ) {
      return undefined
    }


    if (!currentUser) {
      setParticipations([])
      setIsLoading(false)

      return undefined
    }


    setIsLoading(true)


    Promise.all(
      events.map(
        (event) =>
          getDocument(
            'eventParticipations',

            `${event.id}_${currentUser.uid}`
          )
      )
    )
      .then(
        (documents) => {
          if (!isMounted) {
            return
          }

          setParticipations(
            documents.filter(
              Boolean
            )
          )
        }
      )

      .catch((error) => {
        console.error(
          '이벤트 참여 내역 조회 실패:',
          error
        )

        if (isMounted) {
          setParticipations([])
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
     진행 중 이벤트
  ========================= */

  const activeEvents =
    useMemo(
      () =>
        events.filter(
          (event) =>
            event.isActive
        ),
      []
    )


  /* =========================
     참여 내역 조합
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
                  ({ id }) =>
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
            (a, b) => {
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
      [participations]
    )


  const winningHistory =
    history.filter(
      (item) =>
        item.rewardType ===
        'product'
    )


  const activeParticipationCount =
    history.filter(
      (item) =>
        item.isActive
    ).length


  const summaryItems = [
    {
      label:
        '참여한 이벤트',

      count:
        history.length,
    },

    {
      label:
        '응모 중 이벤트',

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


  return (
    <section
      className={styles.page}
      aria-labelledby="event-history-title"
    >

      <div
        className={
          styles.historyCard
        }
      >

        {/* =====================
            TITLE
        ===================== */}

        <header
          className={
            styles.pageHeader
          }
        >
          <h2
            id="event-history-title"
          >
            이벤트 참여 내역
          </h2>
        </header>


        <div
          className={
            styles.titleDivider
          }
        />


        {/* =====================
            SUMMARY
        ===================== */}

        <section
          className={
            styles.summaryPanel
          }
          aria-label="이벤트 참여 요약"
        >
          {summaryItems.map(
            (item) => (
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
                    styles.summaryDot
                  }
                  aria-hidden="true"
                />

                <span
                  className={
                    styles.summaryLabel
                  }
                >
                  {item.label}
                </span>

                <strong
                  className={
                    styles.summaryCount
                  }
                >
                  {item.count}
                </strong>
              </div>
            )
          )}
        </section>


        {/* =====================
            ACTIVE EVENTS
        ===================== */}

        <section
          className={
            styles.activeSection
          }
          aria-labelledby="active-events-title"
        >

          <div
            className={
              styles.sectionHeading
            }
          >
            <h3
              id="active-events-title"
            >
              응모 중인 이벤트
            </h3>

            <Link
              to={PATHS.events}
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
                .slice(0, 2)
                .map(
                  (event) => (
                    <article
                      className={
                        styles.activeCard
                      }
                      key={
                        event.id
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
                          {event.eventPeriod
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
              현재 진행 중인
              이벤트가 없습니다.
            </div>
          )}

        </section>


        {/* =====================
            HISTORY
        ===================== */}

        <section
          className={
            styles.participationSection
          }
          aria-labelledby="participation-title"
        >

          <div
            className={
              styles.sectionHeading
            }
          >
            <h3
              id="participation-title"
            >
              참여 내역
            </h3>
          </div>


          {isLoading ? (
            <div
              className={
                styles.stateBox
              }
              role="status"
            >
              이벤트 참여 내역을
              불러오는 중입니다.
            </div>
          ) : history.length >
            0 ? (

            <div
              className={
                styles.historyList
              }
            >
              {history
                .slice(0, 3)
                .map(
                  (item) => (
                    <article
                      className={
                        styles.historyItem
                      }
                      key={
                        item.id
                      }
                    >

                      <div
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
                      </div>


                      <div
                        className={
                          styles.historyInfo
                        }
                      >
                        <strong>
                          {
                            item.title
                          }
                        </strong>


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


                      <span
                        className={`${styles.statusBadge} ${
                          item.rewardType ===
                          'product'
                            ? styles.winner
                            : ''
                        }`}
                      >
                        {
                          item.status
                        }
                      </span>

                    </article>
                  )
                )}
            </div>

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
                참여 내역이
                없습니다.
              </strong>

              <p>
                이벤트에 참여하고
                다양한 혜택을
                받아보세요.
              </p>

              <Link
                to={
                  PATHS.events
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