import { NavLink, Outlet } from 'react-router-dom'
import { PATHS } from '../../routes/paths'
import styles from './MyPageLayout.module.scss'

const menuItems = [
  {
    label: '홈',
    to: PATHS.mypage,
    end: true,
  },
  {
    label: '회원정보',
    to: 'profile',
  },
  {
    label: '주문 내역',
    to: 'orders',
  },
  {
    label: '찜 목록 · AI 추천',
    to: 'wishlist',
  },
  {
    label: 'AI 추천 기록',
    to: 'ai-history',
  },
  {
    label: '이벤트 참여 내역',
    to: 'events',
  },
]

const MyPageLayout = () => {
  return (
    <section className={styles.page}>
      <header className={styles.pageHeader}>
        <h1 className={styles.title}>마이페이지</h1>
        <p className={styles.description}>
          나의 자작 시간을 확인해보세요.
        </p>
      </header>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <nav
            className={styles.navigation}
            aria-label="마이페이지 메뉴"
          >
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
          >
            <svg
              className={styles.logoutIcon}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M10 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h5" />
              <path d="M14 8l4 4-4 4" />
              <path d="M18 12H8" />
            </svg>

            <span>로그아웃</span>
          </button>
        </aside>

        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
    </section>
  )
}

export default MyPageLayout