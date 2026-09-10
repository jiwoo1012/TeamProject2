import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import jajakLogo from '../../assets/logos/jajakLogo.png'
import cartIcon from '../../assets/webpImages/icons/cartIcon.webp'
import searchIcon from '../../assets/webpImages/icons/searchIcon.webp'

import MobileSearchModal from './MobileSearchModal'
import { subscribeToAuthState } from '../../firebase/auth'
import { getDocument } from '../../firebase/firestore'

import styles from './MobileHeader.module.scss'


const MobileHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [openAccordion, setOpenAccordion] = useState(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)

  // ========================================
  // 관리자 여부 확인
  // ========================================
  useEffect(() => {
    let isMounted = true

    const unsubscribe = subscribeToAuthState(async (user) => {
      if (!user) {
        if (isMounted) setIsAdmin(false)
        return
      }

      try {
        const userDocument = await getDocument('users', user.uid)
        if (isMounted) setIsAdmin(userDocument?.role === 'admin')
      } catch (error) {
        console.error('관리자 권한 확인 실패:', error)
        if (isMounted) setIsAdmin(false)
      }
    })

    return () => {
      isMounted = false
      if (typeof unsubscribe === 'function') unsubscribe()
    }
  }, [])

  const toggleMenu = () => {
    setIsSearchOpen(false)
    setIsMenuOpen((prev) => !prev)
    setOpenAccordion(null)
  }

  const closeMenu = () => {
    setIsMenuOpen(false)
    setOpenAccordion(null)
  }

  const toggleAccordion = (menu) => {
    setOpenAccordion((prev) => (prev === menu ? null : menu))
  }

  const openSearch = () => {
    setIsMenuOpen(false)
    setOpenAccordion(null)
    setIsSearchOpen(true)
  }

  const closeSearch = () => {
    setIsSearchOpen(false)
  }

  const openMenuFromSearch = () => {
    setIsSearchOpen(false)
    setOpenAccordion(null)
    setIsMenuOpen(true)
  }

  return (
    <div className={styles.mobileHeader}>
      {/* ==============================
          모바일 상단 헤더
      ============================== */}
      <div className={styles.mobileTop}>
        <Link
          to="/"
          state={{ skipJourney: true }}
          className={styles.logo}
          onClick={() => {
            closeMenu()
            closeSearch()
          }}
        >
          <img src={jajakLogo} alt="JAJAK" />
        </Link>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.iconButton}
            aria-label="검색"
            aria-expanded={isSearchOpen}
            onClick={openSearch}
          >
            <img src={searchIcon} alt="" />
          </button>

          <Link
            to="/cart"
            className={styles.iconButton}
            aria-label="장바구니"
            onClick={() => {
              closeMenu()
              closeSearch()
            }}
          >
            <img src={cartIcon} alt="" />
          </Link>

          <button
            type="button"
            className={`${styles.menuButton} ${isMenuOpen ? styles.menuButtonOpen : ''}`}
            aria-label={isMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
            aria-expanded={isMenuOpen}
            onClick={toggleMenu}
          >
            <span />
            <span />
          </button>
        </div>
      </div>

      {/* ==============================
          배경 딤 처리 (메뉴 열렸을 때)
      ============================== */}
      <div
        className={`${styles.menuOverlay} ${isMenuOpen ? styles.menuOverlayOpen : ''}`}
        onClick={closeMenu}
        aria-hidden="true"
      />

      {/* ==============================
          모바일 전체 메뉴
      ============================== */}
      <div className={`${styles.menuPanel} ${isMenuOpen ? styles.menuPanelOpen : ''}`}>
        {/* 인트로 타이틀 */}
        <div className={styles.menuIntro}>
          <h2 className={styles.menuHeading}>자작 둘러보기</h2>
          <p className={styles.menuSubheading}>
            자작의 모든 메뉴를
            <br />
            한눈에 둘러보세요.
          </p>
        </div>

        <nav className={styles.gnb}>
          {/* 브랜드 */}
          <div className={styles.menuGroup}>
            <button
              type="button"
              className={styles.menuTitle}
              onClick={() => toggleAccordion('brand')}
            >
              <span>브랜드</span>
              <span className={styles.arrow}>{openAccordion === 'brand' ? '−' : '+'}</span>
            </button>

            <div
              className={`${styles.subMenu} ${openAccordion === 'brand' ? styles.subMenuOpen : ''}`}
            >
              <div className={styles.subMenuInner}>
                <Link to="/brand" onClick={closeMenu} className={styles.subMenuLink}>
                  브랜드 소개
                </Link>
                <Link to="/brand/makdong" onClick={closeMenu} className={styles.subMenuLink}>
                  막동이 소개
                </Link>
              </div>
            </div>
          </div>

          {/* 스토어 */}
          <div className={styles.menuGroup}>
            <button
              type="button"
              className={styles.menuTitle}
              onClick={() => toggleAccordion('shop')}
            >
              <span>스토어</span>
              <span className={styles.arrow}>{openAccordion === 'shop' ? '−' : '+'}</span>
            </button>

            <div
              className={`${styles.subMenu} ${openAccordion === 'shop' ? styles.subMenuOpen : ''}`}
            >
              <div className={styles.subMenuInner}>
                <Link to="/shop" onClick={closeMenu} className={styles.subMenuLink}>
                  전체 상품
                </Link>

                <div className={styles.subCategoryGroup}>
                  <span className={styles.subCategoryTitle}>전통주</span>
                  <div className={styles.subCategoryList}>
                    <Link to="/shop?type=탁주" onClick={closeMenu}>탁주</Link>
                    <Link to="/shop?type=약주" onClick={closeMenu}>약주</Link>
                    <Link to="/shop?type=청주" onClick={closeMenu}>청주</Link>
                    <Link to="/shop?type=과실주" onClick={closeMenu}>과실주</Link>
                    <Link to="/shop?type=증류주" onClick={closeMenu}>증류주</Link>
                    <Link to="/shop?type=리큐르" onClick={closeMenu}>리큐르</Link>
                    <Link to="/shop?type=기타상품" onClick={closeMenu}>기타상품</Link>
                  </div>
                </div>

                <div className={styles.subCategoryGroup}>
                  <span className={styles.subCategoryTitle}>안주</span>
                  <div className={styles.subCategoryList}>
                    <Link to="/shop?category=food&type=간편식" onClick={closeMenu}>간편식</Link>
                    <Link to="/shop?category=food&type=디저트" onClick={closeMenu}>디저트</Link>
                    <Link to="/shop?category=food&type=상온안주" onClick={closeMenu}>상온안주</Link>
                  </div>
                </div>

                <Link to="/shop?category=glass" onClick={closeMenu} className={styles.subMenuLink}>
                  잔
                </Link>

                <Link to="/shop?category=gift" onClick={closeMenu} className={styles.subMenuLink}>
                  선물 세트
                </Link>
              </div>
            </div>
          </div>

          {/* AI 추천 */}
          <div className={styles.menuGroup}>
            <button
              type="button"
              className={styles.menuTitle}
              onClick={() => toggleAccordion('ai')}
            >
              <span>AI 추천</span>
              <span className={styles.arrow}>{openAccordion === 'ai' ? '−' : '+'}</span>
            </button>

            <div
              className={`${styles.subMenu} ${openAccordion === 'ai' ? styles.subMenuOpen : ''}`}
            >
              <div className={styles.subMenuInner}>
                <Link to="/ai" onClick={closeMenu} className={styles.subMenuLink}>
                  추천 받기
                </Link>
                <Link to="/ai/tavern" onClick={closeMenu} className={styles.subMenuLink}>
                  막동이 주막
                </Link>
              </div>
            </div>
          </div>

          {/* 이벤트 */}
          <div className={styles.menuGroup}>
            <Link to="/events" className={styles.directLink} onClick={closeMenu}>
              <span>이벤트</span>
              <span className={styles.arrow}>+</span>
            </Link>
          </div>

          {/* 마이 자작 */}
          <div className={styles.menuGroup}>
            <button
              type="button"
              className={styles.menuTitle}
              onClick={() => toggleAccordion('my')}
            >
              <span>마이 자작</span>
              <span className={styles.arrow}>{openAccordion === 'my' ? '−' : '+'}</span>
            </button>

            <div
              className={`${styles.subMenu} ${openAccordion === 'my' ? styles.subMenuOpen : ''}`}
            >
              <div className={styles.subMenuInner}>
                <Link to="/mypage" onClick={closeMenu} className={styles.subMenuLink}>
                  마이페이지
                </Link>
                <Link to="/mypage/preference" onClick={closeMenu} className={styles.subMenuLink}>
                  내 취향 분석
                </Link>
                <Link to="/mypage/ai-history" onClick={closeMenu} className={styles.subMenuLink}>
                  이전 추천 결과 보기
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {isAdmin && (
          <div className={styles.adminArea}>
            <Link to="/admin" className={styles.adminLink} onClick={closeMenu}>
              <span>관리자</span>
              <span className={styles.adminArrow} aria-hidden="true">→</span>
            </Link>
          </div>
        )}

        {!isAdmin && (
          <div className={styles.userArea}>
            <Link to="/login" onClick={closeMenu}>로그인</Link>
            <span>|</span>
            <Link to="/signup" onClick={closeMenu}>회원가입</Link>
          </div>
        )}
      </div>

      <MobileSearchModal
        isOpen={isSearchOpen}
        onClose={closeSearch}
        onOpenMenu={openMenuFromSearch}
      />
    </div>
  )
}

export default MobileHeader