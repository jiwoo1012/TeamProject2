import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { signOut } from 'firebase/auth'
import { collection, onSnapshot } from 'firebase/firestore'
import { Link, useNavigate } from 'react-router-dom'

import jajakLogo from '../../assets/logos/jajakLogo.png'
import cartIcon from '../../assets/webpImages/icons/cartIcon.webp'
import searchIcon from '../../assets/webpImages/icons/searchIcon.webp'
import wishlistIcon from '../../assets/icons/wishIcon.png'

import MobileSearchModal from './MobileSearchModal'
import { subscribeToAuthState } from '../../firebase/auth'
import { auth, db } from '../../firebase/firebase'
import { getDocument } from '../../firebase/firestore'
import { getCart } from '../../utils/cartStorage'

import styles from './MobileHeader.module.scss'


const MobileHeader = () => {
  const navigate = useNavigate()

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [openAccordion, setOpenAccordion] = useState(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [wishlistCount, setWishlistCount] = useState(0)
  const [cartCount, setCartCount] = useState(() => {
    try {
      return getCart().length
    } catch {
      return 0
    }
  })

  // ========================================
  // 로그인 사용자 / 관리자 여부 확인
  // ========================================
  useEffect(() => {
    let isMounted = true

    const unsubscribe = subscribeToAuthState(async (user) => {
      if (!isMounted) return

      if (!user || user.isAnonymous) {
        setCurrentUser(null)
        setUserData(null)
        setIsAdmin(false)
        return
      }

      setCurrentUser(user)

      try {
        const userDocument = await getDocument('users', user.uid)

        if (!isMounted) return

        setUserData(userDocument || null)
        setIsAdmin(userDocument?.role === 'admin')
      } catch (error) {
        console.error('회원 정보 확인 실패:', error)

        if (isMounted) {
          setUserData(null)
          setIsAdmin(false)
        }
      }
    })

    return () => {
      isMounted = false
      if (typeof unsubscribe === 'function') unsubscribe()
    }
  }, [])

  // ========================================
  // 찜 개수 실시간 반영
  // users/{uid}/wishlist 문서 개수를 그대로 배지에 표시
  // ========================================
  useEffect(() => {
    if (!currentUser) {
      setWishlistCount(0)
      return undefined
    }

    const wishlistRef = collection(
      db,
      'users',
      currentUser.uid,
      'wishlist'
    )

    const unsubscribe = onSnapshot(
      wishlistRef,
      (snapshot) => {
        setWishlistCount(snapshot.size)
      },
      (error) => {
        console.error('찜 개수 조회 실패:', error)
        setWishlistCount(0)
      }
    )

    return unsubscribe
  }, [currentUser])


  // ========================================
  // 장바구니 개수 동기화
  // 같은 탭에서 상품을 담거나 삭제해도 바로 갱신
  // ========================================
  useEffect(() => {
    let refreshTimer = null

    const refreshCartCount = () => {
      try {
        setCartCount(getCart().length)
      } catch (error) {
        console.error('장바구니 개수 조회 실패:', error)
        setCartCount(0)
      }
    }

    const scheduleRefresh = () => {
      window.clearTimeout(refreshTimer)

      refreshTimer = window.setTimeout(
        refreshCartCount,
        80
      )
    }

    const handleStorage = () => {
      refreshCartCount()
    }

    refreshCartCount()

    document.addEventListener(
      'click',
      scheduleRefresh,
      true
    )

    window.addEventListener(
      'storage',
      handleStorage
    )

    window.addEventListener(
      'focus',
      refreshCartCount
    )

    return () => {
      window.clearTimeout(refreshTimer)

      document.removeEventListener(
        'click',
        scheduleRefresh,
        true
      )

      window.removeEventListener(
        'storage',
        handleStorage
      )

      window.removeEventListener(
        'focus',
        refreshCartCount
      )
    }
  }, [])


  // 메뉴가 열려 있는 동안 뒤쪽 페이지 스크롤 방지
  useEffect(() => {
    if (!isMenuOpen) return undefined

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isMenuOpen])

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

  const handleLogout = async () => {
    try {
      await signOut(auth)

      setCurrentUser(null)
      setUserData(null)
      setIsAdmin(false)

      closeMenu()
      closeSearch()
      navigate('/')
    } catch (error) {
      console.error('로그아웃 실패:', error)
    }
  }

  const memberName =
    userData?.nickname ||
    currentUser?.displayName ||
    currentUser?.email?.split('@')[0] ||
    '회원'

  return (
    <div className={styles.mobileHeader} data-mobile-menu-open={isMenuOpen}>
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
          {/* 검색 */}
          <button
            type="button"
            className={styles.iconButton}
            aria-label="검색"
            aria-expanded={isSearchOpen}
            onClick={openSearch}
          >
            <img src={searchIcon} alt="" />
          </button>

          {/* 찜 */}
          <Link
            to="/mypage/wishlist"
            className={`${styles.iconButton} ${styles.countIconButton}`}
            aria-label={`찜 목록 ${wishlistCount}개`}
            onClick={() => {
              closeMenu()
              closeSearch()
            }}
          >
            <img src={wishlistIcon} alt="" />

            {wishlistCount > 0 && (
              <span
                className={styles.countBadge}
                aria-hidden="true"
              >
                {wishlistCount > 99
                  ? '99+'
                  : wishlistCount}
              </span>
            )}
          </Link>

          {/* 장바구니 */}
          <Link
            to="/cart"
            className={`${styles.iconButton} ${styles.countIconButton}`}
            aria-label={`장바구니 ${cartCount}개`}
            onClick={() => {
              closeMenu()
              closeSearch()
            }}
          >
            <img src={cartIcon} alt="" />

            {cartCount > 0 && (
              <span
                className={styles.countBadge}
                aria-hidden="true"
              >
                {cartCount > 99
                  ? '99+'
                  : cartCount}
              </span>
            )}
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

      {isMenuOpen && typeof document !== 'undefined' &&
        createPortal(
          <>
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
          
              {/* 고객센터 */}
              <div className={styles.menuGroup}>
                <button
                  type="button"
                  className={styles.menuTitle}
                  onClick={() => toggleAccordion('customerService')}
                >
                  <span>고객센터</span>
                  <span className={styles.arrow}>{openAccordion === 'customerService' ? '−' : '+'}</span>
                </button>
          
                <div
                  className={`${styles.subMenu} ${openAccordion === 'customerService' ? styles.subMenuOpen : ''}`}
                >
                  <div className={styles.subMenuInner}>
                    <Link to="/faq" onClick={closeMenu} className={styles.subMenuLink}>
                      자주 묻는 질문
                    </Link>
                    <Link to="/inquiry" onClick={closeMenu} className={styles.subMenuLink}>
                      1:1 문의하기
                    </Link>
                    <Link to="/notices" onClick={closeMenu} className={styles.subMenuLink}>
                      공지사항
                    </Link>
                  </div>
                </div>
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
          
            {isAdmin && currentUser && (
              <div className={styles.adminArea}>
                <Link to="/admin" className={styles.adminLink} onClick={closeMenu}>
                  <span>관리자</span>
                  <span className={styles.adminArrow} aria-hidden="true">→</span>
                </Link>

                <button
                  type="button"
                  className={styles.logoutButton}
                  onClick={handleLogout}
                >
                  로그아웃
                </button>
              </div>
            )}

            {!isAdmin && currentUser && (
              <div className={styles.memberArea}>
                <p className={styles.memberGreeting}>
                  <strong>{memberName} 나으리</strong>
                  <span>반갑습니다!</span>
                </p>

                <button
                  type="button"
                  className={styles.logoutButton}
                  onClick={handleLogout}
                >
                  로그아웃
                </button>
              </div>
            )}

            {!isAdmin && !currentUser && (
              <div className={styles.userArea}>
                <Link to="/login" onClick={closeMenu}>로그인</Link>
                <span>|</span>
                <Link to="/signup" onClick={closeMenu}>회원가입</Link>
              </div>
            )}
          </div>
          
          </>,
          document.body
        )}

      <MobileSearchModal
        isOpen={isSearchOpen}
        onClose={closeSearch}
        onOpenMenu={openMenuFromSearch}
      />
    </div>
  )
}

export default MobileHeader
