import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import gsap from 'gsap'

import mypageTopOrnament from '../../assets/images/mypage/mypageTopOrnament.svg'
import { logout, subscribeToAuthState } from '../../firebase/auth'
import { PATHS } from '../../routes/paths'

import styles from './AdminLayout.module.scss'

const menuItems = [
  {
    label: '대시보드',
    to: '/admin',
    end: true,
  },
  {
    label: '회원 관리',
    to: '/admin/users',
  },
  {
    label: '상품 관리',
    to: '/admin/products',
  },
  {
    label: '이벤트 관리',
    to: '/admin/events',
  },
  {
    label: 'AI 추천 기록',
    to: '/admin/ai-logs',
  },
]

const AdminLayout = () => {
  const navRef = useRef(null)
  const moveBoxRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => subscribeToAuthState(setCurrentUser), [])

  const moveActiveBox = (element, immediate = false) => {
    if (!element || !navRef.current || !moveBoxRef.current) return

    const navBox = navRef.current.getBoundingClientRect()
    const menuBox = element.getBoundingClientRect()

    const targetY = menuBox.top - navBox.top

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
    const activeMenu = navRef.current?.querySelector(
      `.${styles.active}`,
    )

    if (!activeMenu) return

    moveActiveBox(activeMenu, true)
  }, [])

  useEffect(() => {
    const activeMenu = navRef.current?.querySelector(
      `.${styles.active}`,
    )

    if (!activeMenu) return

    moveActiveBox(activeMenu)
  }, [location.pathname])

  const handleAccountAction = async () => {
    if (!currentUser) {
      navigate(PATHS.login)
      return
    }

    try {
      await logout()
      navigate(PATHS.home)
    } catch (error) {
      console.error('로그아웃 실패:', error)
    }
  }

  return (
    <section className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>관리자 페이지</h1>

        <p className={styles.description}>
          자작 운영 현황을 관리합니다.
        </p>
      </header>

      <div className={styles.ornamentArea} aria-hidden="true">
        <img className={styles.topOrnament} src={mypageTopOrnament} alt="" />
      </div>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
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

            {menuItems.map(({ label, to, end }) => (
              <NavLink
                key={label}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `${styles.menuItem} ${
                    isActive ? styles.active : ''
                  }`
                }
              >
                <span
                  className={styles.menuDot}
                  aria-hidden="true"
                />

                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <button
            className={styles.logoutButton}
            type="button"
            onClick={handleAccountAction}
            aria-label={currentUser ? '로그아웃' : '로그인'}
          >
            <svg
              className={`${styles.logoutIcon} ${!currentUser ? styles.loginIcon : ''}`}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5" />
              <path d="M14 8l4 4-4 4" />
              <path d="M18 12H8" />
            </svg>

            <span>{currentUser ? '로그아웃' : '로그인'}</span>
          </button>
        </aside>

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </section>
  )
}

export default AdminLayout
