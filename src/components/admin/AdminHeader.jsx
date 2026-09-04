import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'

import { auth } from '../../firebase/firebase'
import styles from './AdminHeader.module.scss'


const SITE_LINKS = [
  {
    label: '홈',
    to: '/',
    state: { skipJourney: true },
  },
  {
    label: '상품',
    to: '/shop',
  },
  {
    label: 'AI 추천',
    to: '/ai',
  },
  {
    label: '이벤트',
    to: '/events',
  },
  {
    label: '마이페이지',
    to: '/mypage',
  },
  {
    label: '공지사항',
    to: '/notices',
  },
]


const AdminHeader = () => {
  const navigate = useNavigate()

  const [isShortcutOpen, setIsShortcutOpen] = useState(false)

  const shortcutRef = useRef(null)


  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        shortcutRef.current
        && !shortcutRef.current.contains(event.target)
      ) {
        setIsShortcutOpen(false)
      }
    }


    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsShortcutOpen(false)
      }
    }


    document.addEventListener('mousedown', handleOutsideClick)
    document.addEventListener('keydown', handleEscape)


    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])


  const handleLogout = async () => {
    try {
      await signOut(auth)

      navigate('/login')
    } catch (error) {
      console.error('로그아웃 실패:', error)
    }
  }


  const handleToggleShortcut = () => {
    setIsShortcutOpen((prev) => !prev)
  }


  const handleLinkClick = () => {
    setIsShortcutOpen(false)
  }


  return (
    <header className={styles.adminHeader}>
      <div className={styles.inner}>

        {/* 로고 */}
        <Link
          to="/admin"
          className={styles.logoArea}
        >
          <span className={styles.logo}>
            JAJAK
          </span>

          <span className={styles.adminLabel}>
            ADMIN
          </span>
        </Link>


        {/* 우측 메뉴 */}
        <div className={styles.rightArea}>

          {/* 로그아웃 */}
          <button
            type="button"
            className={styles.headerAction}
            onClick={handleLogout}
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M10 17l5-5-5-5" />
              <path d="M15 12H3" />
              <path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" />
            </svg>

            <span>
              로그아웃
            </span>
          </button>


          {/* 사이트 바로 가기 */}
          <div
            ref={shortcutRef}
            className={styles.shortcutWrap}
          >
            <button
              type="button"
              className={`
                ${styles.headerAction}
                ${styles.shortcutButton}
                ${isShortcutOpen ? styles.active : ''}
              `}
              onClick={handleToggleShortcut}
              aria-haspopup="menu"
              aria-expanded={isShortcutOpen}
            >
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M3 11.5L12 4l9 7.5" />
                <path d="M5.5 10v10h13V10" />
                <path d="M9.5 20v-6h5v6" />
              </svg>

              <span>
                사이트 바로 가기
              </span>

              <i
                className={`
                  ${styles.chevron}
                  ${isShortcutOpen ? styles.chevronOpen : ''}
                `}
                aria-hidden="true"
              />
            </button>


            {isShortcutOpen && (
              <div className={styles.dropdownLayer}>
                <nav
                  className={styles.shortcutMenu}
                  aria-label="사이트 바로 가기"
                >
                  <div className={styles.menuHeader}>
                    <span>
                      JAJAK
                    </span>

                    <strong>
                      사이트 바로 가기
                    </strong>
                  </div>


                  <div className={styles.menuList}>
                    {SITE_LINKS.map((item) => (
                      <Link
                        key={item.label}
                        to={item.to}
                        state={item.state}
                        className={styles.menuItem}
                        onClick={handleLinkClick}
                      >
                        <span>
                          {item.label}
                        </span>

                        <span
                          className={styles.menuArrow}
                          aria-hidden="true"
                        >
                          →
                        </span>
                      </Link>
                    ))}
                  </div>
                </nav>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  )
}


export default AdminHeader