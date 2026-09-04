import {
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from 'react-router-dom'

import gsap from 'gsap'
import { signOut } from 'firebase/auth'

import AdminHeader from '../../components/admin/AdminHeader'
import { subscribeToAuthState } from '../../firebase/auth'
import { auth } from '../../firebase/firebase'

import styles from './AdminLayout.module.scss'


const menuItems = [
  {
    label: '대시보드',
    to: '/admin',
    end: true,
    icon: 'dashboard',
  },
  {
    label: '회원 관리',
    to: '/admin/users',
    icon: 'users',
  },
  {
    label: '상품 관리',
    to: '/admin/products',
    icon: 'product',
  },
  {
    label: '이벤트 관리',
    to: '/admin/events',
    icon: 'event',
  },
  {
    label: 'AI 추천 기록',
    to: '/admin/ai-logs',
    icon: 'ai',
  },
  {
    label: '공지사항 관리',
    to: '/admin/notices',
    icon: 'notice',
  },
  {
    label: '리뷰 관리',
    to: '/admin/reviews',
    icon: 'review',
  },
]

const mobileSiteLinks = [
  { label: '홈', to: '/', state: { skipJourney: true } },
  { label: '상품', to: '/shop' },
  { label: 'AI 추천', to: '/ai' },
  { label: '이벤트', to: '/events' },
  { label: '마이페이지', to: '/mypage' },
  { label: '공지사항', to: '/notice' },
]


const MenuIcon = ({ type }) => {
  const paths = {
    dashboard: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
        <path d="M16 5.5a3 3 0 0 1 0 5.8M16.5 14a5 5 0 0 1 4 5" />
      </>
    ),
    product: (
      <>
        <path d="m4 7.5 8-4 8 4-8 4-8-4Z" />
        <path d="M4 7.5v9l8 4 8-4v-9M12 11.5v9" />
      </>
    ),
    event: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M7 3v4M17 3v4M3 10h18" />
        <path d="m12 13 .8 1.7 1.9.3-1.4 1.3.4 1.9-1.7-.9-1.7.9.4-1.9-1.4-1.3 1.9-.3.8-1.7Z" />
      </>
    ),
    ai: (
      <>
        <path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2L12 3Z" />
        <path d="m18.5 13 .7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7.7-2.3ZM5 14l.6 1.9 1.9.6-1.9.6L5 19l-.6-1.9-1.9-.6 1.9-.6L5 14Z" />
      </>
    ),
    notice: (
      <>
        <path d="M4 13V8.5A2.5 2.5 0 0 1 6.5 6H10l7-3v16l-7-3H6.5A2.5 2.5 0 0 1 4 13Z" />
        <path d="m8 16 1 5h4l-1-4M20 8v6" />
      </>
    ),
    review: (
      <>
        <path d="M21 12a8 8 0 0 1-8 8H6l-3 2v-7a8 8 0 1 1 18-3Z" />
        <path d="m12 7 1.2 2.4 2.6.4-1.9 1.8.5 2.6-2.4-1.3-2.4 1.3.5-2.6-1.9-1.8 2.6-.4L12 7Z" />
      </>
    ),
  }

  return (
    <span className={styles.menuIcon} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        {paths[type]}
      </svg>
    </span>
  )
}


const AdminLayout = () => {
  const navRef = useRef(null)
  const moveBoxRef = useRef(null)

  const location = useLocation()
  const navigate = useNavigate()

  const [currentUser, setCurrentUser] = useState(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)


  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user) => {
      setCurrentUser(user)
    })

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe()
      }
    }
  }, [])


  const moveActiveBox = (
    element,
    immediate = false
  ) => {
    if (
      !element
      || !navRef.current
      || !moveBoxRef.current
    ) {
      return
    }

    const navBox =
      navRef.current.getBoundingClientRect()

    const menuBox =
      element.getBoundingClientRect()

    const targetY =
      menuBox.top - navBox.top


    gsap.killTweensOf(moveBoxRef.current)


    if (immediate) {
      gsap.set(moveBoxRef.current, {
        y: targetY,
        width: menuBox.width,
        height: menuBox.height,
      })

      return
    }


    gsap.to(moveBoxRef.current, {
      y: targetY,
      width: menuBox.width,
      height: menuBox.height,
      duration: 0.35,
      ease: 'power2.out',
    })
  }


  useEffect(() => {
    const activeMenu =
      navRef.current?.querySelector(
        `.${styles.active}`
      )

    if (!activeMenu) return

    moveActiveBox(activeMenu, true)
  }, [])


  useEffect(() => {
    const activeMenu =
      navRef.current?.querySelector(
        `.${styles.active}`
      )

    if (!activeMenu) return

    moveActiveBox(activeMenu)
  }, [location.pathname])


  useEffect(() => {
    setIsSidebarOpen(false)
  }, [location.pathname])


  useEffect(() => {
    if (!isSidebarOpen) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsSidebarOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSidebarOpen])

  const handleMobileLogout = async () => {
    try {
      await signOut(auth)
      setIsSidebarOpen(false)
      navigate('/login')
    } catch (error) {
      console.error('로그아웃 실패:', error)
    }
  }


  return (
    <div className={styles.adminApp}>

      {/* 관리자 공통 헤더 */}
      <AdminHeader />


      <div className={styles.adminBody}>

        <button
          type="button"
          className={styles.mobileMenuButton}
          onClick={() => setIsSidebarOpen(true)}
          aria-controls="admin-sidebar"
          aria-expanded={isSidebarOpen}
          aria-label="관리자 메뉴 열기"
        >
          <span />
          <span />
          <span />
        </button>

        {isSidebarOpen && (
          <button
            type="button"
            className={styles.mobileBackdrop}
            onClick={() => setIsSidebarOpen(false)}
            aria-label="관리자 메뉴 닫기"
          />
        )}

        {/* ========================================
            관리자 사이드바
        ======================================== */}

        <aside
          id="admin-sidebar"
          className={`${styles.sidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}
        >

          <button
            type="button"
            className={styles.mobileCloseButton}
            onClick={() => setIsSidebarOpen(false)}
            aria-label="관리자 메뉴 닫기"
          >
            <span />
            <span />
          </button>

          <nav
            ref={navRef}
            className={styles.navigation}
            aria-label="관리자 메뉴"
          >
            <span
              ref={moveBoxRef}
              className={styles.moveBox}
              aria-hidden="true"
            />


            {menuItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  [
                    styles.menuItem,
                    isActive
                      ? styles.active
                      : '',
                  ]
                    .filter(Boolean)
                    .join(' ')
                }
                onClick={() => setIsSidebarOpen(false)}
              >
                <MenuIcon type={item.icon} />

                <span className={styles.menuLabel}>
                  {item.label}
                </span>
              </NavLink>
            ))}
          </nav>

          <section className={styles.mobileUtilityArea} aria-label="관리자 바로가기">
            <div className={styles.mobileUtilityTitle}>사이트 바로가기</div>
            <div className={styles.mobileSiteLinks}>
              {mobileSiteLinks.map((item) => (
                <Link
                  key={item.label}
                  to={item.to}
                  state={item.state}
                  onClick={() => setIsSidebarOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <button type="button" className={styles.mobileLogoutButton} onClick={handleMobileLogout}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 17 5-5-5-5M15 12H3M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" /></svg>
              로그아웃
            </button>
          </section>


          {/* 관리자 계정 */}
          <div className={styles.accountArea}>
            <div className={styles.accountBadge}>

              <span
                className={styles.accountAvatar}
                aria-hidden="true"
              />

              <span className={styles.accountEmail}>
                {currentUser?.email || '관리자'}
              </span>

            </div>
          </div>

        </aside>


        {/* ========================================
            각 관리자 페이지가 들어가는 영역
        ======================================== */}

        <main className={styles.content}>

          <div className={styles.contentViewport}>
            <Outlet />
          </div>

        </main>

      </div>

    </div>
  )
}


export default AdminLayout
