import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { collection, getDocs, query, where } from 'firebase/firestore'

import { getCurrentUserData, subscribeToAuthState } from '../../firebase/auth'
import { db } from '../../firebase/firebase'
import { getCollection } from '../../firebase/firestore'

import styles from './MyPageLayout.module.scss'
import { getStoredProfileAvatar, profileAvatars } from './profileAvatars'


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
  const [userData, setUserData] = useState(null)
  const [profileAvatar, setProfileAvatar] = useState(profileAvatars[0])
  const [quickValues, setQuickValues] = useState({
    order: 0,
    point: '0 P',
    wishlist: 0,
    repeat: 0,
  })

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (user) => {
      setCurrentUser(user)

      if (!user) {
        setUserData(null)
        setProfileAvatar(profileAvatars[0])
        setQuickValues({ order: 0, point: '0 P', wishlist: 0, repeat: 0 })
        return
      }

      setProfileAvatar(getStoredProfileAvatar(user.uid))

      try {
        const ordersQuery = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid),
        )
        const [nextUserData, wishlist, orderSnapshot] = await Promise.all([
          getCurrentUserData(user.uid),
          getCollection(`users/${user.uid}/wishlist`),
          getDocs(ordersQuery),
        ])
        const productOrderCounts = {}

        orderSnapshot.docs.forEach((orderDocument) => {
          const items = orderDocument.data().items || []
          const orderedProductIds = new Set()

          items.forEach((item) => {
            if (!item.productId) return
            orderedProductIds.add(item.productId)
          })

          orderedProductIds.forEach((productId) => {
            productOrderCounts[productId] = (productOrderCounts[productId] || 0) + 1
          })
        })

        setUserData(nextUserData)
        setQuickValues({
          order: orderSnapshot.size,
          point: `${Number(nextUserData?.points || 0).toLocaleString('ko-KR')} P`,
          wishlist: wishlist.length,
          repeat: Object.values(productOrderCounts).filter((count) => count >= 2).length,
        })
      } catch (error) {
        console.error('마이페이지 사이드바 정보 조회 실패:', error)
      }
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    if (!currentUser) return undefined

    const syncProfile = async () => {
      setProfileAvatar(getStoredProfileAvatar(currentUser.uid))

      try {
        const nextUserData = await getCurrentUserData(currentUser.uid)
        setUserData(nextUserData)
        setQuickValues((current) => ({
          ...current,
          point: `${Number(nextUserData?.points || 0).toLocaleString('ko-KR')} P`,
        }))
      } catch (error) {
        console.error('마이페이지 프로필 동기화 실패:', error)
      }
    }

    window.addEventListener('jajak-profile-avatar-change', syncProfile)
    window.addEventListener('jajak-profile-change', syncProfile)

    return () => {
      window.removeEventListener('jajak-profile-avatar-change', syncProfile)
      window.removeEventListener('jajak-profile-change', syncProfile)
    }
  }, [currentUser])


  const userName =
    userData?.nickname ||
    currentUser?.displayName ||
    currentUser?.email?.split('@')[0] ||
    '회원'

  const userEmail =
    currentUser?.email ||
    'jajak@jajak.com'

  const currentPoints = Number(userData?.points || 0)
  const pointGoal = 2000
  const pointsToNextLevel = Math.max(0, pointGoal - currentPoints)
  const pointProgress = Math.min(100, (currentPoints / pointGoal) * 100)


  return (
    <section className={styles.page}>
      <div className={styles.layout}>

        {/* 왼쪽 사이드바 */}
        <aside className={styles.sidebar}>

          {/* 프로필 */}
          <div className={styles.profileArea}>
            <div className={styles.profileTop}>
              <div className={styles.profileImage}>
                <img src={profileAvatar.src} alt={`${userName} 프로필`} />
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

                {userData?.role === 'admin' ? '관리자' : '일반 회원'}
              </span>

              <span className={styles.nextLevel}>
                다음 등급까지
                <strong> {pointsToNextLevel.toLocaleString('ko-KR')}P</strong>
              </span>
            </div>


            <div className={styles.progressArea}>
              <div className={styles.progressTrack}>
                <span
                  className={styles.progressBar}
                  style={{ width: `${pointProgress}%` }}
                />
              </div>

              <span className={styles.progressText}>
                {currentPoints.toLocaleString('ko-KR')} / {pointGoal.toLocaleString('ko-KR')}P
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
                    {quickValues[item.icon]}
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
          <Outlet context={{ profileAvatar, userData, quickValues }} />
        </main>

      </div>
    </section>
  )
}


export default MyPageLayout
