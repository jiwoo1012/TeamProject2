import React, { useRef, useState } from 'react'
import { Link } from 'react-router-dom'

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
]


const AdminHeader = () => {
  const [isShortcutOpen, setIsShortcutOpen] = useState(false)
  const closeTimerRef = useRef(null)


  const handleOpenShortcut = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
    }

    setIsShortcutOpen(true)
  }


  const handleCloseShortcut = () => {
    closeTimerRef.current = setTimeout(() => {
      setIsShortcutOpen(false)
    }, 120)
  }


  const handleToggleShortcut = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
    }

    setIsShortcutOpen((prev) => !prev)
  }


  const handleLinkClick = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
    }

    setIsShortcutOpen(false)
  }


  return (
    <header className={styles.adminHeader}>
      <div className={styles.inner}>

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


        <div className={styles.rightArea}>

          <span className={styles.adminText}>
            관리자 페이지
          </span>


          <div
            className={styles.shortcutWrap}
            onMouseEnter={handleOpenShortcut}
            onMouseLeave={handleCloseShortcut}
          >
            <button
              type="button"
              className={`${styles.shortcutButton} ${
                isShortcutOpen ? styles.active : ''
              }`}
              onClick={handleToggleShortcut}
              onFocus={handleOpenShortcut}
              aria-haspopup="menu"
              aria-expanded={isShortcutOpen}
            >
              사이트 바로가기

              <span
                className={`${styles.chevron} ${
                  isShortcutOpen ? styles.chevronOpen : ''
                }`}
                aria-hidden="true"
              />
            </button>


            {isShortcutOpen && (
              <div className={styles.dropdownLayer}>
                <nav
                  className={styles.shortcutMenu}
                  aria-label="사이트 바로가기"
                >
                  {SITE_LINKS.map((item) => (
                    <Link
                      key={item.label}
                      to={item.to}
                      state={item.state}
                      className={styles.menuItem}
                      onClick={handleLinkClick}
                    >
                      <span>{item.label}</span>

                      <span
                        className={styles.menuArrow}
                        aria-hidden="true"
                      >
                        →
                      </span>
                    </Link>
                  ))}
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