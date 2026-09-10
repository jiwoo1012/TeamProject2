import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  NavLink,
  Outlet,
  useLocation,
} from 'react-router-dom'

import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore'

import {
  getCurrentUserData,
  subscribeToAuthState,
} from '../../firebase/auth'

import {
  db,
} from '../../firebase/firebase'

import {
  getCollection,
} from '../../firebase/firestore'

import eventsData from '../../data/events.json'

import {
  PATHS,
} from '../../routes/paths'

import {
  getStoredProfileAvatar,
  profileAvatars,
} from './profileAvatars'

import styles from './MyPageLayout.module.scss'


/* =========================
   QUICK ICON
========================= */

const QuickIcon = ({
  type,
}) => {
  const icons = {
    order: (
      <>
        <path d="M6 3h12v18H6z" />
        <path d="M9 7h6M9 11h6M9 15h4" />
      </>
    ),

    point: (
      <>
        <circle
          cx="12"
          cy="12"
          r="9"
        />

        <path d="M10 8h3a3 3 0 0 1 0 6h-3z" />
        <path d="M10 14v3" />
      </>
    ),

    wishlist: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    ),

    repeat: (
      <>
        <path d="M7.5 8.5h9a2 2 0 0 1 2 2v8h-13v-8a2 2 0 0 1 2-2Z" />
        <path d="M8.5 8.5V6.8A1.8 1.8 0 0 1 10.3 5h3.4a1.8 1.8 0 0 1 1.8 1.8v1.7" />
        <path d="M8.5 12.5h5M8.5 16h3" />
        <path d="m18 4 .45 1.25 1.25.45-1.25.45L18 7.4l-.45-1.25-1.25-.45 1.25-.45L18 4Z" />
      </>
    ),
  }


  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icons[type]}
    </svg>
  )
}


/* =========================
   QUICK MENU
========================= */

const quickMenus = [
  {
    label: '주문 내역',
    to: 'orders',
    icon: 'order',
  },

  {
    label: '포인트',
    to: 'points',
    icon: 'point',
  },

  {
    label: '찜',
    to: 'wishlist',
    icon: 'wishlist',
  },

  {
    label: '자주 구매',
    to: 'frequent',
    icon: 'repeat',
  },
]


/* =========================
   MENU GROUP
========================= */

const menuGroups = [
  {
    title: '내 정보 관리',

    items: [
      {
        label: '배송지 관리',
        to: 'addresses',
      },

      {
        label: '회원 정보 관리',
        to: 'profile',
      },
    ],
  },

  {
    title: '쇼핑',

    items: [
      {
        label:
          '취소 · 반품 · 교환 내역',
        to: 'claims',
      },

      {
        label: '문의 내역',
        to: 'inquiries',
      },
    ],
  },

  {
    title: 'AI 큐레이터',

    items: [
      {
        label: 'AI 추천 기록',
        to: 'ai-history',
      },

      {
        label: '내 취향 분석',
        to: 'preference',
      },
    ],
  },

  {
    title: '이벤트',

    items: [
      {
        label:
          '이벤트 참여 내역',
        to: 'events',
      },

      {
        label:
          '이벤트 당첨 내역',
        to: 'event-winnings',
      },
    ],
  },
]


/* =========================
   EVENT BANNER
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
   EVENT PATH
========================= */

const getEventPath = (
  event
) => {
  if (
    event?.title?.includes(
      '룰렛'
    )
  ) {
    return '/events/roulette'
  }


  if (
    event?.title?.includes(
      '카드'
    )
  ) {
    return `${PATHS.eventReady}/card-game`
  }


  if (
    event?.title?.includes(
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
        event.id ||
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

const MyPageLayout = () => {
  const location =
    useLocation()


  const [
    currentUser,
    setCurrentUser,
  ] = useState(null)


  const [
    userData,
    setUserData,
  ] = useState(null)


  const [
    profileAvatar,
    setProfileAvatar,
  ] = useState(
    profileAvatars[0]
  )


  const [
    quickValues,
    setQuickValues,
  ] = useState({
    order: 0,
    point: '0 P',
    wishlist: 0,
    repeat: 0,
  })


  const [
    events,
    setEvents,
  ] = useState(
    fallbackEvents
  )


  /* =========================
     MOBILE PAGE CHECK
  ========================= */

  const isMyPageHome =
    location.pathname ===
      '/mypage' ||
    location.pathname ===
      '/mypage/'


  /* =========================
     EVENT LOAD
  ========================= */

  useEffect(() => {
    let isMounted =
      true


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


          const nextEvents =
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


          setEvents(
            nextEvents
          )
        }
      )

      .catch(
        (
          error
        ) => {
          console.error(
            '마이페이지 이벤트 목록 조회 실패:',
            error
          )
        }
      )


    return () => {
      isMounted =
        false
    }
  }, [])


  const activeEvents =
    useMemo(
      () =>
        events.filter(
          (
            event
          ) =>
            event.isActive ===
              true ||
            event.status ===
              'active' ||
            event.status ===
              '진행중'
        ),
      [
        events,
      ]
    )


  /* =========================
     USER DATA
  ========================= */

  useEffect(() => {
    const unsubscribe =
      subscribeToAuthState(
        async (
          user
        ) => {
          setCurrentUser(
            user
          )


          if (!user) {
            setUserData(
              null
            )

            setProfileAvatar(
              profileAvatars[0]
            )

            setQuickValues({
              order: 0,
              point: '0 P',
              wishlist: 0,
              repeat: 0,
            })

            return
          }


          setProfileAvatar(
            getStoredProfileAvatar(
              user.uid
            )
          )


          try {
            const ordersQuery =
              query(
                collection(
                  db,
                  'orders'
                ),

                where(
                  'userId',
                  '==',
                  user.uid
                )
              )


            const [
              nextUserData,
              wishlist,
              orderSnapshot,
            ] =
              await Promise.all([
                getCurrentUserData(
                  user.uid
                ),

                getCollection(
                  `users/${user.uid}/wishlist`
                ),

                getDocs(
                  ordersQuery
                ),
              ])


            const productOrderCounts =
              {}


            orderSnapshot.docs.forEach(
              (
                orderDocument
              ) => {
                const items =
                  orderDocument
                    .data()
                    .items ||
                  []


                const orderedProductIds =
                  new Set()


                items.forEach(
                  (
                    item
                  ) => {
                    if (
                      !item.productId
                    ) {
                      return
                    }


                    orderedProductIds.add(
                      item.productId
                    )
                  }
                )


                orderedProductIds.forEach(
                  (
                    productId
                  ) => {
                    productOrderCounts[
                      productId
                    ] =
                      (
                        productOrderCounts[
                          productId
                        ] ||
                        0
                      ) +
                      1
                  }
                )
              }
            )


            setUserData(
              nextUserData
            )


            setQuickValues({
              order:
                orderSnapshot.size,

              point:
                `${Number(
                  nextUserData?.points ||
                    0
                ).toLocaleString(
                  'ko-KR'
                )} P`,

              wishlist:
                wishlist.length,

              repeat:
                Object.values(
                  productOrderCounts
                ).filter(
                  (
                    count
                  ) =>
                    count >=
                    2
                ).length,
            })
          } catch (
            error
          ) {
            console.error(
              '마이페이지 사이드바 정보 조회 실패:',
              error
            )
          }
        }
      )


    return unsubscribe
  }, [])


  /* =========================
     PROFILE SYNC
  ========================= */

  useEffect(() => {
    if (
      !currentUser
    ) {
      return undefined
    }


    const syncProfile =
      async () => {
        setProfileAvatar(
          getStoredProfileAvatar(
            currentUser.uid
          )
        )


        try {
          const nextUserData =
            await getCurrentUserData(
              currentUser.uid
            )


          setUserData(
            nextUserData
          )


          setQuickValues(
            (
              current
            ) => ({
              ...current,

              point:
                `${Number(
                  nextUserData?.points ||
                    0
                ).toLocaleString(
                  'ko-KR'
                )} P`,
            })
          )
        } catch (
          error
        ) {
          console.error(
            '마이페이지 프로필 동기화 실패:',
            error
          )
        }
      }


    window.addEventListener(
      'jajak-profile-avatar-change',
      syncProfile
    )

    window.addEventListener(
      'jajak-profile-change',
      syncProfile
    )


    return () => {
      window.removeEventListener(
        'jajak-profile-avatar-change',
        syncProfile
      )

      window.removeEventListener(
        'jajak-profile-change',
        syncProfile
      )
    }
  }, [
    currentUser,
  ])


  /* =========================
     USER INFO
  ========================= */

  const userName =
    userData?.nickname ||
    currentUser?.displayName ||
    currentUser?.email?.split(
      '@'
    )[0] ||
    '회원'


  const userEmail =
    currentUser?.email ||
    'jajak@jajak.com'


  const userGrade =
    userData?.role ===
    'admin'
      ? '관리자님'
      : '나으리님'


  const currentPoints =
    Number(
      userData?.points ||
        0
    )


  const pointGoal =
    10000


  const pointProgress =
    Math.min(
      100,
      (
        currentPoints /
        pointGoal
      ) *
        100
    )


  return (
    <section
      className={
        styles.page
      }
    >
      <div
        className={`${styles.layout} ${
          isMyPageHome
            ? styles.mobileHomeLayout
            : styles.mobileSubLayout
        }`}
      >

        {/* =========================
            SIDEBAR
        ========================= */}

        <aside
          className={
            styles.sidebar
          }
        >

          {/* =====================
              PROFILE
          ===================== */}

          <div
            className={
              styles.profileArea
            }
          >
            <div
              className={
                styles.profileTop
              }
            >
              <div
                className={
                  styles.profileImage
                }
              >
                <img
                  src={
                    profileAvatar.src
                  }
                  alt={`${userName} 프로필`}
                />
              </div>


              <div
                className={
                  styles.profileInfo
                }
              >
                <div
                  className={
                    styles.nameRow
                  }
                >
                  <strong
                    className={
                      styles.userName
                    }
                  >
                    {
                      userName
                    }
                  </strong>


                  <span
                    className={
                      styles.levelText
                    }
                  >
                    {
                      userGrade
                    }
                  </span>
                </div>


                <strong
                  className={
                    styles.mobileWelcome
                  }
                >
                  {`${userName} ${userGrade}, 환영합니다!`}
                </strong>


                <p
                  className={
                    styles.email
                  }
                >
                  {
                    userEmail
                  }
                </p>
              </div>
            </div>


            <div
              className={
                styles.membershipInfo
              }
            >
              <span
                className={
                  styles.membershipBadge
                }
              >
                <span
                  className={
                    styles.badgeDot
                  }
                  aria-hidden="true"
                />

                {userData?.role ===
                'admin'
                  ? '관리자'
                  : '일반 회원'}
              </span>
            </div>


            <div
              className={
                styles.progressArea
              }
            >
              <div
                className={
                  styles.progressTrack
                }
              >
                <span
                  className={
                    styles.progressBar
                  }
                  style={{
                    width:
                      `${pointProgress}%`,
                  }}
                />
              </div>


              <span
                className={
                  styles.progressText
                }
              >
                {currentPoints.toLocaleString(
                  'ko-KR'
                )}

                {' / '}

                {pointGoal.toLocaleString(
                  'ko-KR'
                )}

                P
              </span>
            </div>
          </div>


          {/* =====================
              QUICK MENU
          ===================== */}

          <div
            className={
              styles.quickSection
            }
          >
            <h2
              className={
                styles.sectionTitle
              }
            >
              자주 찾는 메뉴
            </h2>


            <div
              className={
                styles.quickMenuList
              }
            >
              {quickMenus.map(
                (
                  item
                ) => (
                  <NavLink
                    key={
                      item.label
                    }
                    to={
                      item.to
                    }
                    className={({
                      isActive,
                    }) =>
                      `${styles.quickMenuItem} ${
                        isActive
                          ? styles.active
                          : ''
                      }`
                    }
                  >
                    <span
                      className={
                        styles.quickMenuLeft
                      }
                    >
                      <span
                        className={
                          styles.quickIcon
                        }
                      >
                        <QuickIcon
                          type={
                            item.icon
                          }
                        />
                      </span>


                      <span
                        className={
                          styles.quickLabel
                        }
                      >
                        {
                          item.label
                        }
                      </span>
                    </span>


                    <span
                      className={
                        styles.quickValue
                      }
                    >
                      {
                        quickValues[
                          item.icon
                        ]
                      }
                    </span>
                  </NavLink>
                )
              )}
            </div>
          </div>


          {/* =====================
              MOBILE ACTIVE EVENTS
          ===================== */}

          <section
            className={
              styles.mobileEventSection
            }
          >
            <div
              className={
                styles.mobileEventHeader
              }
            >
              <h2>
                진행 중인 이벤트
              </h2>


              <NavLink
                to={
                  PATHS.events
                }
                className={
                  styles.mobileEventMore
                }
              >
                전체 보기

                <span
                  aria-hidden="true"
                >
                  ›
                </span>
              </NavLink>
            </div>


            {activeEvents.length >
            0 ? (
              <div
                className={
                  styles.eventScroller
                }
              >
                {activeEvents.map(
                  (
                    event
                  ) => (
                    <NavLink
                      key={
                        event.id
                      }
                      to={
                        event.path ||
                        PATHS.events
                      }
                      className={
                        styles.eventCard
                      }
                    >
                      <div
                        className={
                          styles.eventCardImage
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
                          >
                            ✦
                          </span>
                        )}
                      </div>


                      <div
                        className={
                          styles.eventCardInfo
                        }
                      >
                        <span
                          className={
                            styles.eventCardLabel
                          }
                        >
                          진행 중
                        </span>


                        <strong>
                          {event.title ||
                            '자작 이벤트'}
                        </strong>
                      </div>


                      <span
                        className={
                          styles.eventCardArrow
                        }
                        aria-hidden="true"
                      >
                        ›
                      </span>
                    </NavLink>
                  )
                )}
              </div>
            ) : (
              <div
                className={
                  styles.noEvent
                }
              >
                현재 진행 중인 이벤트가 없습니다.
              </div>
            )}
          </section>


          {/* =====================
              NORMAL MENU
          ===================== */}

          <nav
            className={
              styles.navigation
            }
            aria-label="마이페이지 메뉴"
          >
            {menuGroups.map(
              (
                group
              ) => (
                <div
                  className={
                    styles.menuGroup
                  }
                  key={
                    group.title
                  }
                >
                  <h2
                    className={
                      styles.groupTitle
                    }
                  >
                    {
                      group.title
                    }
                  </h2>


                  <div
                    className={
                      styles.groupMenu
                    }
                  >
                    {group.items.map(
                      (
                        item
                      ) => (
                        <NavLink
                          key={
                            item.label
                          }
                          to={
                            item.to
                          }
                          className={({
                            isActive,
                          }) =>
                            `${styles.menuItem} ${
                              isActive
                                ? styles.active
                                : ''
                            }`
                          }
                        >
                          <span>
                            {
                              item.label
                            }
                          </span>
                        </NavLink>
                      )
                    )}
                  </div>
                </div>
              )
            )}
          </nav>

        </aside>


        {/* =========================
            CONTENT
        ========================= */}

        <main
          className={
            styles.content
          }
        >
          <Outlet
            context={{
              currentUser,
              profileAvatar,
              userData,
              quickValues,
              userName,
              userEmail,
              currentPoints,
            }}
          />
        </main>

      </div>
    </section>
  )
}


export default MyPageLayout