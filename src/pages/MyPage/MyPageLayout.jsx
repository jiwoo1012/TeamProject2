import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

import { subscribeToAuthState } from '../../firebase/auth'

import styles from './MyPageLayout.module.scss'


const QuickIcon = ({ type }) => {
  const icons = {
    order: (
      <>
        <path d="M6 3h12v18H6z" />
        <path d="M9 7h6M9 11h6M9 15h4" />
      </>
    ),

    point: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M10 8h3a3 3 0 0 1 0 6h-3z" />
        <path d="M10 14v3" />
      </>
    ),

    wishlist: (
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    ),

    repeat: (
      <>
        <path d="M4 7h11a4 4 0 0 1 4 4" />
        <path d="m16 4 3 3-3 3" />
        <path d="M20 17H9a4 4 0 0 1-4-4" />
        <path d="m8 20-3-3 3-3" />
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


const quickMenus = [
  {
    label: '주문 내역',
    to: 'orders',
    icon: 'order',
    value: '10',
  },
  {
    label: '포인트',
    to: 'points',
    icon: 'point',
    value: '10,325 P',
  },
  {
    label: '찜',
    to: 'wishlist',
    icon: 'wishlist',
    value: '10',
  },
  {
    label: '자주 구매',
    to: 'frequent',
    icon: 'repeat',
    value: '10',
  },
]


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
        label: '취소 · 반품 · 교환 내역',
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
        label: '이벤트 참여 내역',
        to: 'events',
      },
      {
        label: '이벤트 당첨 내역',
        to: 'event-winnings',
      },
    ],
  },
]


const MyPageLayout = () => {
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(setCurrentUser)

    return unsubscribe
  }, [])


  const userName =
    currentUser?.displayName ||
    currentUser?.email?.split('@')[0] ||
    '홍길동'

  const userEmail =
    currentUser?.email ||
    'jajak@jajak.com'


  return (
    <section className={styles.page}>
      <div className={styles.layout}>

        {/* 왼쪽 사이드바 */}
        <aside className={styles.sidebar}>

          {/* 프로필 */}
          <div className={styles.profileArea}>
            <div className={styles.profileTop}>
              <div className={styles.profileImage}>
                <span>
                  {userName.charAt(0)}
                </span>
              </div>

              <div className={styles.profileInfo}>
                <div className={styles.nameRow}>
                  <strong className={styles.userName}>
                    {userName}
                  </strong>

                  <span className={styles.levelText}>
                    나리님
                  </span>
                </div>

                <p className={styles.email}>
                  {userEmail}
                </p>
              </div>
            </div>


            <div className={styles.membershipInfo}>
              <span className={styles.membershipBadge}>
                <span
                  className={styles.badgeDot}
                  aria-hidden="true"
                />

                일반 회원
              </span>

              <span className={styles.nextLevel}>
                다음 등급까지
                <strong> 1,289P</strong>
              </span>
            </div>


            <div className={styles.progressArea}>
              <div className={styles.progressTrack}>
                <span
                  className={styles.progressBar}
                  style={{ width: '60%' }}
                />
              </div>

              <span className={styles.progressText}>
                1,289 / 2,000P
              </span>
            </div>
          </div>


          {/* 자주 찾는 메뉴 */}
          <div className={styles.quickSection}>
            <h2 className={styles.sectionTitle}>
              자주 찾는 메뉴
            </h2>

            <div className={styles.quickMenuList}>
              {quickMenus.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.to}
                  className={({ isActive }) =>
                    `${styles.quickMenuItem} ${
                      isActive ? styles.active : ''
                    }`
                  }
                >
                  <span className={styles.quickMenuLeft}>
                    <span className={styles.quickIcon}>
                      <QuickIcon type={item.icon} />
                    </span>

                    <span>
                      {item.label}
                    </span>
                  </span>

                  <span className={styles.quickValue}>
                    {item.value}
                  </span>
                </NavLink>
              ))}
            </div>
          </div>


          {/* 카테고리 메뉴 */}
          <nav
            className={styles.navigation}
            aria-label="마이페이지 메뉴"
          >
            {menuGroups.map((group) => (
              <div
                className={styles.menuGroup}
                key={group.title}
              >
                <h2 className={styles.groupTitle}>
                  {group.title}
                </h2>

                <div className={styles.groupMenu}>
                  {group.items.map((item) => (
                    <NavLink
                      key={item.label}
                      to={item.to}
                      className={({ isActive }) =>
                        `${styles.menuItem} ${
                          isActive ? styles.active : ''
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>

        </aside>


        {/* 오른쪽 콘텐츠 */}
        <main className={styles.content}>
          <Outlet />
        </main>

      </div>
    </section>
  )
}


export default MyPageLayout