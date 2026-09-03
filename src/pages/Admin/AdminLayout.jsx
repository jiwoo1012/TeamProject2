import {
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  NavLink,
  Outlet,
  useLocation,
} from 'react-router-dom'

import gsap from 'gsap'

import AdminHeader from '../../components/admin/AdminHeader'
import { subscribeToAuthState } from '../../firebase/auth'

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
  {
    label: '공지사항 관리',
    to: '/admin/notices',
  },
  {
    label: '리뷰 관리',
    to: '/admin/reviews',
  },
]


const AdminLayout = () => {
  const navRef = useRef(null)
  const moveBoxRef = useRef(null)

  const location = useLocation()

  const [currentUser, setCurrentUser] = useState(null)


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


  return (
    <div className={styles.adminApp}>

      {/* 관리자 공통 헤더 */}
      <AdminHeader />


      <div className={styles.adminBody}>

        {/* ========================================
            관리자 사이드바
        ======================================== */}

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
              >
                <span
                  className={styles.menuDot}
                  aria-hidden="true"
                />

                <span className={styles.menuLabel}>
                  {item.label}
                </span>
              </NavLink>
            ))}
          </nav>


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