import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { PATHS } from '../../routes/paths'
import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore'

import { auth, db } from '../../firebase/firebase'
import { getCart } from '../../utils/cartStorage'

// 상품 데이터
import {
  products,
  liquors,
} from '../../data/products'

import jajakLogo from '../../assets/logos/jajakLogo.png'
import cartIcon from '../../assets/webpImages/icons/cartIcon.webp'
import wishlistIcon from '../../assets/webpImages/icons/wishIcon.webp'
import loginIcon from '../../assets/webpImages/icons/loginIcon.webp'
import searchIcon from '../../assets/webpImages/icons/searchIcon.webp'
import brandSnbImage from '../../assets/webpImages/images/main/ai-recommendation/mood-celebration.webp'
import tavernWorld
  from '../../assets/webpImages/images/ai/tavern/background/game.webp'

import SearchModal from './SearchModal'

import styles from './DesktopHeader.module.scss'


/* ========================================
   상품 이미지 불러오기

   ProductList와 동일한 방식으로
   product1.png, product2.png ... 연결
======================================== */

const productImages = import.meta.glob(
  '../../assets/webpImages/images/products/product*.webp',
  {
    eager: true,
    import: 'default',
  }
)


const resolveImage = (imageUrl) => {
  return Object.entries(productImages).find(([path]) =>
    (path.endsWith(`/${imageUrl}`) || path.endsWith((`/${imageUrl}`).replace(/\.(png|jpe?g)$/i, '.webp')))
  )?.[1]
}


/* ========================================
   인기 상품

   메가메뉴에서 사용하는 상품
======================================== */

const popularProducts = products.slice(0, 4)


/* ========================================
   검색창 추천 상품

   - 전통주만 사용
   - 판매 중인 상품
   - 입문자 추천 상품 우선
   - 2개만 노출

   SearchModal에서 사용 중인
   name / description / image 형태로
   데이터를 변환해서 전달
======================================== */

const recommendedProducts = liquors
  .filter(
    (product) =>
      product.status === 'selling' &&
      product.beginnerRecommendation === true
  )
  .slice(0, 2)
  .map((product) => ({
    ...product,

    name: product.productName,
    description: product.productDescription,
    image: resolveImage(product.imageUrl),
  }))


/* ========================================
   상품 카테고리별 세부 종류

   호버한 카테고리에 맞는 세부 종류를
   메가메뉴 두 번째 컬럼에 보여주기 위한 데이터.
   세부 종류가 없는 카테고리는 items를 비워둔다.
======================================== */

const shopSubcategories = {
  liquor: {
    title: '전통주 종류',
    items: [
      {
        label: '탁주',
        to: '/shop?type=takju',
        activeKey: 'takju',
      },
      {
        label: '약주 · 청주',
        to: '/shop?type=yakju',
        activeKey: 'yakju',
      },
      {
        label: '과실주',
        to: '/shop?type=fruit',
        activeKey: 'fruit',
      },
      {
        label: '증류주',
        to: '/shop?type=distilled',
        activeKey: 'distilled',
      },
      {
        label: '리큐르 · 기타상품',
        to: '/shop?type=liqueur',
        activeKey: 'liqueur',
      },
    ],
  },

  food: {
    title: '안주 종류',
    items: [
      {
        label: '간편식',
        to: '/shop?category=food&detail=간편식',
        activeKey: '간편식',
      },
      {
        label: '디저트',
        to: '/shop?category=food&detail=디저트',
        activeKey: '디저트',
      },
      {
        label: '상온안주',
        to: '/shop?category=food&detail=상온안주',
        activeKey: '상온안주',
      },
    ],
  },

  glass: {
    title: '잔 종류',
    items: [],
  },

  gift: {
    title: '선물 세트',
    items: [],
  },
}


const DesktopHeader = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const isBrandIntroActive =
    location.pathname === '/brand'

  const isMakdongActive =
    location.pathname.startsWith(
      '/brand/makdong'
    )

  const isAiRecommendActive =
    location.pathname === '/ai'

  const isAiTavernActive =
    location.pathname.startsWith(
      '/ai/tavern'
    )

  const isAiPreferenceActive =
    location.pathname.startsWith(
      '/mypage/preference'
    )

  const isAiHistoryActive =
    location.pathname.startsWith(
      '/mypage/ai-history'
    )

  const isFaqActive =
    location.pathname === '/faq'

  const isInquiryActive =
    location.pathname.startsWith(
      '/inquiry'
    )

  const isNoticesActive =
    location.pathname.startsWith(
      '/notices'
    )

  const shopSearchParams =
    new URLSearchParams(location.search)

  const shopCategoryParam =
    shopSearchParams.get('category')

  const shopTypeParam =
    shopSearchParams.get('type')

  const shopDetailParam =
    shopSearchParams.get('detail')

  const activeShopCategory =
    location.pathname.startsWith('/shop')
      ? (
          shopCategoryParam ||
          (shopTypeParam
            ? 'liquor'
            : null)
        )
      : null

  const activeShopDetail =
    shopTypeParam ||
    shopDetailParam ||
    null

  const [openMenu, setOpenMenu] = useState(null)
  const [hoveredShopCategory, setHoveredShopCategory] = useState('liquor')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isAllMenuOpen, setIsAllMenuOpen] = useState(false)
  const [openAllMenuSection, setOpenAllMenuSection] = useState('shop')
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [wishlistCount, setWishlistCount] = useState(0)
  const [cartCount, setCartCount] = useState(() => {
    try {
      return getCart().length
    } catch {
      return 0
    }
  })


  useEffect(() => {
    if (
      activeShopCategory &&
      shopSubcategories[activeShopCategory]
    ) {
      setHoveredShopCategory(
        activeShopCategory
      )
    }
  }, [
    activeShopCategory,
    location.search,
  ])


  /* ========================================
     로그인 상태 확인
  ======================================== */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        setUser(currentUser)

        if (!currentUser || currentUser.isAnonymous) {
          setIsAdmin(false)
          return
        }

        try {
          const userRef = doc(
            db,
            'users',
            currentUser.uid
          )

          const userSnap = await getDoc(
            userRef
          )

          setIsAdmin(
            userSnap.exists() &&
            userSnap.data()?.role === 'admin'
          )
        } catch (error) {
          console.error(
            '관리자 권한 확인 실패:',
            error
          )

          setIsAdmin(false)
        }
      }
    )

    return () => unsubscribe()
  }, [])


  /* ========================================
     찜 개수 실시간 반영
  ======================================== */

  useEffect(() => {
    if (!user || user.isAnonymous) {
      setWishlistCount(0)
      return undefined
    }

    const wishlistRef = collection(
      db,
      'users',
      user.uid,
      'wishlist'
    )

    const unsubscribe = onSnapshot(
      wishlistRef,
      (snapshot) => {
        setWishlistCount(snapshot.size)
      },
      (error) => {
        console.error(
          '찜 개수 조회 실패:',
          error
        )

        setWishlistCount(0)
      }
    )

    return unsubscribe
  }, [user])


  /* ========================================
     장바구니 개수 동기화

     같은 탭에서 장바구니를 담거나 삭제한 경우에도
     바로 숫자가 바뀌도록 클릭 직후 저장값을 다시 읽는다.
  ======================================== */

  useEffect(() => {
    let refreshTimer = null

    const refreshCartCount = () => {
      try {
        setCartCount(getCart().length)
      } catch (error) {
        console.error(
          '장바구니 개수 조회 실패:',
          error
        )

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


  /* ========================================
     전체메뉴 ESC / 바깥 클릭 / 스크롤 잠금
  ======================================== */

  useEffect(() => {
    if (!isAllMenuOpen) {
      return undefined
    }

    const previousBodyOverflow =
      document.body.style.overflow

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsAllMenuOpen(false)
      }
    }

    const handlePointerDown = (event) => {
      const target = event.target

      if (
        target.closest?.(`.${styles.allMenuDrawer}`) ||
        target.closest?.(`.${styles.allMenuButton}`)
      ) {
        return
      }

      setIsAllMenuOpen(false)
    }

    document.body.style.overflow = 'hidden'

    document.addEventListener(
      'keydown',
      handleKeyDown
    )

    document.addEventListener(
      'pointerdown',
      handlePointerDown
    )

    return () => {
      document.body.style.overflow =
        previousBodyOverflow

      document.removeEventListener(
        'keydown',
        handleKeyDown
      )

      document.removeEventListener(
        'pointerdown',
        handlePointerDown
      )
    }
  }, [isAllMenuOpen])


  /* ========================================
     로그아웃
  ======================================== */

  const handleLogout = async () => {
    try {
      await signOut(auth)

      closeSearch()
      closeMegaMenu()
      setIsAllMenuOpen(false)

      navigate(PATHS.home, { state: { skipJourney: true, resetMainAfterLogout: true } })
    } catch (error) {
      console.error(
        '로그아웃 실패:',
        error
      )
    }
  }


  /* ========================================
     MEGA MENU
  ======================================== */

  const openMegaMenu = (menu) => {
    setIsSearchOpen(false)
    setIsAllMenuOpen(false)
    setOpenMenu(menu)
  }


  const closeMegaMenu = () => {
    setOpenMenu(null)
  }


  /* ========================================
     SEARCH
  ======================================== */

  const toggleSearch = () => {
    closeMegaMenu()
    setIsAllMenuOpen(false)

    setIsSearchOpen(
      (prev) => !prev
    )
  }


  const toggleAllMenu = () => {
    closeMegaMenu()
    closeSearch()

    setIsAllMenuOpen(
      (prev) => !prev
    )
  }


  const closeAllMenu = () => {
    setIsAllMenuOpen(false)
  }


  const toggleAllMenuSection = (section) => {
    setOpenAllMenuSection(
      (current) =>
        current === section
          ? null
          : section
    )
  }


  const closeSearch = () => {
    setIsSearchOpen(false)
  }


  /* ========================================
     상품명 가져오기
  ======================================== */

  const getProductName = (product) => {
    return (
      product.productName ??
      product.name ??
      product.title ??
      '상품명'
    )
  }


  /* ========================================
     가격 표시
  ======================================== */

  const formatPrice = (price) => {
    const numericPrice =
      Number(price)

    if (
      Number.isNaN(
        numericPrice
      )
    ) {
      return price
    }

    return `${numericPrice.toLocaleString(
      'ko-KR'
    )}원`
  }


  return (
    <div
      className={styles.desktopHeader}
      onMouseLeave={closeMegaMenu}
    >

      {/* ========================================
          HEADER
      ======================================== */}

      <div
        className={
          styles.headerInner
        }
      >
        <button
          type="button"
          className={`${styles.allMenuButton} ${
            isAllMenuOpen
              ? styles.allMenuButtonActive
              : ''
          }`}
          aria-label={
            isAllMenuOpen
              ? '전체 메뉴 닫기'
              : '전체 메뉴 열기'
          }
          aria-expanded={isAllMenuOpen}
          aria-controls="desktop-all-menu"
          onClick={toggleAllMenu}
        >
          <span
            className={styles.hamburgerIcon}
            aria-hidden="true"
          >
            <span />
            <span />
            <span />
          </span>
        </button>

        <div
          className={
            styles.headerContainer
          }
        >

          {/* ========================================
              GNB
          ======================================== */}

          <div
            className={
              styles.leftNavigation
            }
          >
            <nav
              className={
                styles.gnb
              }
              aria-label="주요 메뉴"
            >

              {/* BRAND */}

            <div
              className={
                styles.gnbItem
              }
              onMouseEnter={() =>
                openMegaMenu(
                  'brand'
                )
              }
            >
              <Link
                to="/brand"
                className={
                  styles.gnbLink
                }
              >
                브랜드 소개
              </Link>
            </div>


            {/* SHOP */}

            <div
              className={
                styles.gnbItem
              }
              onMouseEnter={() => {
                setHoveredShopCategory('liquor')
                openMegaMenu(
                  'shop'
                )
              }}
            >
              <Link
                to="/shop"
                className={
                  styles.gnbLink
                }
              >
                스토어
              </Link>
            </div>


            {/* AI 추천 */}

            <div
              className={
                styles.gnbItem
              }
              onMouseEnter={() =>
                openMegaMenu(
                  'ai'
                )
              }
            >
              <Link
                to="/ai"
                className={
                  styles.gnbLink
                }
              >
                AI 추천
              </Link>
            </div>


            {/* 이벤트 */}

            <div
              className={
                styles.gnbItem
              }
              onMouseEnter={
                closeMegaMenu
              }
            >
              <Link
                to="/events"
                className={
                  styles.gnbLink
                }
              >
                이벤트
              </Link>
            </div>


            {/* 고객센터 */}

            <div
              className={
                styles.gnbItem
              }
              onMouseEnter={() =>
                openMegaMenu(
                  'customerService'
                )
              }
            >
              <Link
                to="/faq"
                className={
                  styles.gnbLink
                }
              >
                고객센터
              </Link>
            </div>

            </nav>
          </div>


          {/* ========================================
              중앙 로고
          ======================================== */}

          <Link
            to="/"
            state={{
              skipJourney: true,
            }}
            className={
              styles.logo
            }
            onMouseEnter={
              closeMegaMenu
            }
            onClick={() => {
              closeSearch()
              closeAllMenu()
            }}
          >
            <img
              src={jajakLogo}
              alt="JAJAK"
            />
          </Link>


          {/* ========================================
              오른쪽 아이콘
          ======================================== */}

          <div
            className={
              styles.headerActions
            }
            onMouseEnter={
              closeMegaMenu
            }
          >

            {/* 검색 */}

            <button
              type="button"
              className={`${styles.iconButton} ${
                isSearchOpen
                  ? styles.searchActive
                  : ''
              }`}
              aria-label={
                isSearchOpen
                  ? '검색 닫기'
                  : '검색'
              }
              aria-expanded={
                isSearchOpen
              }
              onClick={
                toggleSearch
              }
            >
              <span
                className={styles.iconGlyph}
                style={{ '--icon-src': `url(${searchIcon})` }}
                aria-hidden="true"
              />
            </button>


            {/* 로그인 / 마이페이지 / 관리자 메뉴 */}

            <div
              className={
                styles.accountMenu
              }
            >
              <Link
                to={
                  user
                    ? '/mypage'
                    : '/login'
                }
                className={
                  styles.iconButton
                }
                aria-label={
                  user
                    ? '마이페이지'
                    : '로그인'
                }
                onClick={
                  closeSearch
                }
              >
                <span
                  className={styles.iconGlyph}
                  style={{ '--icon-src': `url(${loginIcon})` }}
                  aria-hidden="true"
                />
              </Link>

              {user && (
                <div
                  className={
                    styles.accountDropdown
                  }
                >
                  <Link
                    to="/mypage"
                    className={
                      styles.accountMenuItem
                    }
                    onClick={
                      closeSearch
                    }
                  >
                    마이페이지
                  </Link>

                  {isAdmin && (
                    <Link
                      to="/admin"
                      className={
                        styles.accountMenuItem
                      }
                      onClick={
                        closeSearch
                      }
                    >
                      관리자페이지
                    </Link>
                  )}

                  <button
                    type="button"
                    className={
                      styles.accountMenuItem
                    }
                    onClick={
                      handleLogout
                    }
                  >
                    로그아웃
                  </button>
                </div>
              )}
            </div>


            {/* 찜 */}

            <Link
              to="/mypage/wishlist"
              className={`${styles.iconButton} ${styles.countIconButton}`}
              aria-label={`찜 목록 ${wishlistCount}개`}
              onClick={() => {
                closeSearch()
                closeAllMenu()
              }}
            >
              <span
                className={styles.iconGlyph}
                style={{ '--icon-src': `url(${wishlistIcon})` }}
                aria-hidden="true"
              />

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
                closeSearch()
                closeAllMenu()
              }}
            >
              <span
                className={styles.iconGlyph}
                style={{ '--icon-src': `url(${cartIcon})` }}
                aria-hidden="true"
              />

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

          </div>

        </div>
      </div>


      {/* ========================================
          SEARCH MODAL
      ======================================== */}

      <SearchModal
        isOpen={
          isSearchOpen
        }
        onClose={
          closeSearch
        }
        recommendedProducts={
          recommendedProducts
        }
      />


      {/* ========================================
          전체메뉴 - 왼쪽 슬라이드 드로어
      ======================================== */}

      <div
        className={`${styles.allMenuBackdrop} ${
          isAllMenuOpen
            ? styles.allMenuBackdropOpen
            : ''
        }`}
        aria-hidden="true"
        onClick={closeAllMenu}
      />

      <aside
        id="desktop-all-menu"
        className={`${styles.allMenuDrawer} ${
          isAllMenuOpen
            ? styles.allMenuDrawerOpen
            : ''
        }`}
        aria-hidden={!isAllMenuOpen}
        aria-label="전체 메뉴"
      >
        <div
          className={
            styles.allMenuIntro
          }
        >

          <h2>
            자작 둘러보기
          </h2>

          <p>
            자작의 모든 메뉴를
            <br />
            한눈에 둘러보세요.
          </p>
        </div>


        <nav
          className={
            styles.allMenuAccordion
          }
          aria-label="사이트 전체 메뉴"
        >
          {/* BRAND */}
          <section
            className={
              styles.allMenuSection
            }
          >
            <button
              type="button"
              className={
                styles.allMenuTrigger
              }
              aria-expanded={
                openAllMenuSection === 'brand'
              }
              onClick={() =>
                toggleAllMenuSection('brand')
              }
            >
              <span>
                <strong>브랜드</strong>
              </span>

              <i
                className={`${styles.accordionIcon} ${
                  openAllMenuSection === 'brand'
                    ? styles.accordionIconOpen
                    : ''
                }`}
                aria-hidden="true"
              />
            </button>

            <div
              className={`${styles.allMenuPanel} ${
                openAllMenuSection === 'brand'
                  ? styles.allMenuPanelOpen
                  : ''
              }`}
            >
              <div
                className={
                  styles.allMenuPanelInner
                }
              >
                <Link
                  to="/brand"
                  className={
                    styles.drawerLink
                  }
                  onClick={closeAllMenu}
                >
                  브랜드 소개
                </Link>

                <Link
                  to="/brand/makdong"
                  className={
                    styles.drawerLink
                  }
                  onClick={closeAllMenu}
                >
                  막동이 소개
                </Link>
              </div>
            </div>
          </section>


          {/* SHOP */}
          <section
            className={
              styles.allMenuSection
            }
          >
            <button
              type="button"
              className={
                styles.allMenuTrigger
              }
              aria-expanded={
                openAllMenuSection === 'shop'
              }
              onClick={() =>
                toggleAllMenuSection('shop')
              }
            >
              <span>
                <strong>스토어</strong>
              </span>

              <i
                className={`${styles.accordionIcon} ${
                  openAllMenuSection === 'shop'
                    ? styles.accordionIconOpen
                    : ''
                }`}
                aria-hidden="true"
              />
            </button>

            <div
              className={`${styles.allMenuPanel} ${
                openAllMenuSection === 'shop'
                  ? styles.allMenuPanelOpen
                  : ''
              }`}
            >
              <div
                className={
                  styles.allMenuPanelInner
                }
              >
                <Link
                  to="/shop"
                  className={
                    styles.drawerLink
                  }
                  onClick={closeAllMenu}
                >
                  전체 상품
                </Link>

                <div
                  className={
                    styles.drawerSubGroup
                  }
                >
                  <Link
                    to="/shop?category=liquor"
                    className={
                      styles.drawerSubTitle
                    }
                    onClick={closeAllMenu}
                  >
                    전통주
                  </Link>

                  <div
                    className={
                      styles.drawerSubLinks
                    }
                  >
                    {shopSubcategories.liquor.items.map(
                      ({ label, to }) => (
                        <Link
                          to={to}
                          onClick={closeAllMenu}
                          key={label}
                        >
                          {label}
                        </Link>
                      )
                    )}
                  </div>
                </div>

                <div
                  className={
                    styles.drawerSubGroup
                  }
                >
                  <Link
                    to="/shop?category=food"
                    className={
                      styles.drawerSubTitle
                    }
                    onClick={closeAllMenu}
                  >
                    안주
                  </Link>

                  <div
                    className={
                      styles.drawerSubLinks
                    }
                  >
                    {shopSubcategories.food.items.map(
                      ({ label, to }) => (
                        <Link
                          to={to}
                          onClick={closeAllMenu}
                          key={label}
                        >
                          {label}
                        </Link>
                      )
                    )}
                  </div>
                </div>

                <Link
                  to="/shop?category=glass"
                  className={
                    styles.drawerLink
                  }
                  onClick={closeAllMenu}
                >
                  잔
                </Link>

                <Link
                  to="/shop?category=gift"
                  className={
                    styles.drawerLink
                  }
                  onClick={closeAllMenu}
                >
                  선물 세트
                </Link>
              </div>
            </div>
          </section>


          {/* AI */}
          <section
            className={
              styles.allMenuSection
            }
          >
            <button
              type="button"
              className={
                styles.allMenuTrigger
              }
              aria-expanded={
                openAllMenuSection === 'ai'
              }
              onClick={() =>
                toggleAllMenuSection('ai')
              }
            >
              <span>
                <strong>AI 추천</strong>
              </span>

              <i
                className={`${styles.accordionIcon} ${
                  openAllMenuSection === 'ai'
                    ? styles.accordionIconOpen
                    : ''
                }`}
                aria-hidden="true"
              />
            </button>

            <div
              className={`${styles.allMenuPanel} ${
                openAllMenuSection === 'ai'
                  ? styles.allMenuPanelOpen
                  : ''
              }`}
            >
              <div
                className={
                  styles.allMenuPanelInner
                }
              >
                <Link
                  to="/ai"
                  className={
                    styles.drawerLink
                  }
                  onClick={closeAllMenu}
                >
                  주안상 추천 받기
                </Link>

                <Link
                  to="/ai/tavern"
                  className={
                    styles.drawerLink
                  }
                  onClick={closeAllMenu}
                >
                  막동이 주막
                </Link>

                <Link
                  to="/mypage/preference"
                  className={
                    styles.drawerLink
                  }
                  onClick={closeAllMenu}
                >
                  내 취향 분석
                </Link>

                <Link
                  to="/mypage/ai-history"
                  className={
                    styles.drawerLink
                  }
                  onClick={closeAllMenu}
                >
                  이전 추천 결과
                </Link>
              </div>
            </div>
          </section>


          {/* EVENT */}
          <section
            className={
              styles.allMenuSection
            }
          >
            <button
              type="button"
              className={
                styles.allMenuTrigger
              }
              aria-expanded={
                openAllMenuSection === 'event'
              }
              onClick={() =>
                toggleAllMenuSection('event')
              }
            >
              <span>
                <strong>이벤트</strong>
              </span>

              <i
                className={`${styles.accordionIcon} ${
                  openAllMenuSection === 'event'
                    ? styles.accordionIconOpen
                    : ''
                }`}
                aria-hidden="true"
              />
            </button>

            <div
              className={`${styles.allMenuPanel} ${
                openAllMenuSection === 'event'
                  ? styles.allMenuPanelOpen
                  : ''
              }`}
            >
              <div
                className={
                  styles.allMenuPanelInner
                }
              >
                <Link
                  to="/events"
                  className={
                    styles.drawerLink
                  }
                  onClick={closeAllMenu}
                >
                  이벤트 전체보기
                </Link>
              </div>
            </div>
          </section>


          {/* 고객센터 */}
          <section
            className={
              styles.allMenuSection
            }
          >
            <button
              type="button"
              className={
                styles.allMenuTrigger
              }
              aria-expanded={
                openAllMenuSection === 'customerService'
              }
              onClick={() =>
                toggleAllMenuSection('customerService')
              }
            >
              <span>
                <strong>고객센터</strong>
              </span>

              <i
                className={`${styles.accordionIcon} ${
                  openAllMenuSection === 'customerService'
                    ? styles.accordionIconOpen
                    : ''
                }`}
                aria-hidden="true"
              />
            </button>

            <div
              className={`${styles.allMenuPanel} ${
                openAllMenuSection === 'customerService'
                  ? styles.allMenuPanelOpen
                  : ''
              }`}
            >
              <div
                className={
                  styles.allMenuPanelInner
                }
              >
                <Link
                  to="/faq"
                  className={
                    styles.drawerLink
                  }
                  onClick={closeAllMenu}
                >
                  자주 묻는 질문
                </Link>

                <Link
                  to="/inquiry"
                  className={
                    styles.drawerLink
                  }
                  onClick={closeAllMenu}
                >
                  1:1 문의하기
                </Link>

                <Link
                  to="/notices"
                  className={
                    styles.drawerLink
                  }
                  onClick={closeAllMenu}
                >
                  공지사항
                </Link>
              </div>
            </div>
          </section>


          {/* MY JAJAK */}
          <section
            className={
              styles.allMenuSection
            }
          >
            <button
              type="button"
              className={
                styles.allMenuTrigger
              }
              aria-expanded={
                openAllMenuSection === 'my'
              }
              onClick={() =>
                toggleAllMenuSection('my')
              }
            >
              <span>
                <strong>마이 자작</strong>
              </span>

              <i
                className={`${styles.accordionIcon} ${
                  openAllMenuSection === 'my'
                    ? styles.accordionIconOpen
                    : ''
                }`}
                aria-hidden="true"
              />
            </button>

            <div
              className={`${styles.allMenuPanel} ${
                openAllMenuSection === 'my'
                  ? styles.allMenuPanelOpen
                  : ''
              }`}
            >
              <div
                className={
                  styles.allMenuPanelInner
                }
              >
                <Link
                  to="/mypage"
                  className={
                    styles.drawerLink
                  }
                  onClick={closeAllMenu}
                >
                  마이페이지
                </Link>

                <Link
                  to="/mypage/orders"
                  className={
                    styles.drawerLink
                  }
                  onClick={closeAllMenu}
                >
                  주문 내역
                </Link>

                <Link
                  to="/mypage/wishlist"
                  className={
                    styles.drawerLink
                  }
                  onClick={closeAllMenu}
                >
                  찜 목록

                  {wishlistCount > 0 && (
                    <span
                      className={
                        styles.drawerCount
                      }
                    >
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                <Link
                  to="/cart"
                  className={
                    styles.drawerLink
                  }
                  onClick={closeAllMenu}
                >
                  장바구니

                  {cartCount > 0 && (
                    <span
                      className={
                        styles.drawerCount
                      }
                    >
                      {cartCount}
                    </span>
                  )}
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin"
                    className={
                      styles.drawerLink
                    }
                    onClick={closeAllMenu}
                  >
                    관리자페이지
                  </Link>
                )}
              </div>
            </div>
          </section>
        </nav>
      </aside>


      {/* ========================================
          브랜드 MEGA MENU
      ======================================== */}

      <div
        className={`${styles.megaMenu} ${styles.brandMegaMenu} ${
          openMenu === 'brand'
            ? styles.megaMenuOpen
            : ''
        }`}
      >
        <div
          className={`${styles.megaContainer} ${styles.brandMegaContainer}`}
        >
          <div className={styles.megaSectionTitle}>
            <h2>
              브랜드 소개
            </h2>
          </div>

          <nav
            className={styles.brandSnb}
            aria-label="브랜드 메뉴"
          >
            <Link
              to="/brand"
              className={`${styles.snbNavLink} ${
                isBrandIntroActive
                  ? styles.snbNavLinkActive
                  : ''
              }`}
              onClick={closeMegaMenu}
              aria-current={
                isBrandIntroActive
                  ? 'page'
                  : undefined
              }
            >
              <span>
                브랜드 소개
              </span>
            </Link>

            <Link
              to="/brand/makdong"
              className={`${styles.snbNavLink} ${
                isMakdongActive
                  ? styles.snbNavLinkActive
                  : ''
              }`}
              onClick={closeMegaMenu}
              aria-current={
                isMakdongActive
                  ? 'page'
                  : undefined
              }
            >
              <span>
                막동이 소개
              </span>
            </Link>
          </nav>

          <Link
            to="/brand"
            className={styles.brandVisual}
            onClick={closeMegaMenu}
          >
            <div className={styles.brandImage}>
              <img
                src={brandSnbImage}
                alt="자작 브랜드 소개"
               loading="lazy" decoding="async" />
            </div>

            <div className={styles.brandText}>
              <h3>
                술 한 잔에 담긴
                <br />
                자작의 이야기를 만나보세요.
              </h3>

              <p>
                전통주의 가치를 오늘의 감각으로 풀어낸<br/> 자작의 브랜드 이야기를 소개합니다.
              </p>
            </div>
          </Link>
        </div>
      </div>


      {/* ========================================
          AI 추천 MEGA MENU
      ======================================== */}

      <div
        className={`${styles.megaMenu} ${styles.aiMegaMenu} ${
          openMenu === 'ai'
            ? styles.megaMenuOpen
            : ''
        }`}
      >
        <div
          className={`${styles.megaContainer} ${styles.aiMegaContainer}`}
        >
          <div className={styles.megaSectionTitle}>
            <h2>
              AI 추천
            </h2>
          </div>

          <nav
            className={styles.aiSnb}
            aria-label="AI 추천 메뉴"
          >
            <Link
              to="/ai"
              className={`${styles.snbNavLink} ${
                isAiRecommendActive
                  ? styles.snbNavLinkActive
                  : ''
              }`}
              onClick={closeMegaMenu}
            >
              <span>
                주안상 추천 받기
              </span>
            </Link>

            <Link
              to="/ai/tavern"
              className={`${styles.snbNavLink} ${
                isAiTavernActive
                  ? styles.snbNavLinkActive
                  : ''
              }`}
              onClick={closeMegaMenu}
            >
              <span>
                막동이 주막
              </span>
            </Link>

            <Link
              to="/mypage/preference"
              className={`${styles.snbNavLink} ${
                isAiPreferenceActive
                  ? styles.snbNavLinkActive
                  : ''
              }`}
              onClick={closeMegaMenu}
            >
              <span>
                내 취향 분석
              </span>
            </Link>

            <Link
              to="/mypage/ai-history"
              className={`${styles.snbNavLink} ${
                isAiHistoryActive
                  ? styles.snbNavLinkActive
                  : ''
              }`}
              onClick={closeMegaMenu}
            >
              <span>
                이전 추천 결과
              </span>
            </Link>
          </nav>

          <div className={styles.aiFeature}>
  <div className={styles.aiFeatureText}>
    <h3>
      내 취향에 맞는
      <br />
      한 상을 찾아보세요.
    </h3>

    <Link
      to="/ai"
      className={styles.aiRecommendLink}
      onClick={closeMegaMenu}
    >
      추천 시작하기
    </Link>
  </div>

  <Link
    to="/ai/tavern"
    className={styles.tavernFeature}
    onClick={closeMegaMenu}
  >
    <div
      className={
        styles.tavernFeatureImage
      }
    >
      <img
        src={tavernWorld}
        alt="막동이 주막"
       loading="lazy" decoding="async" />
    </div>

    <div
      className={
        styles.tavernFeatureInfo
      }
    >
      <strong>
        막동이 주막
      </strong>

      <span>
        바로가기 →
      </span>
    </div>
  </Link>
</div>
        </div>
      </div>


      {/* ========================================
          상품 MEGA MENU
      ======================================== */}

      <div
        className={`${styles.megaMenu} ${styles.shopMegaMenu} ${
          openMenu === 'shop'
            ? styles.megaMenuOpen
            : ''
        }`}
      >
        <div
          className={`${styles.megaContainer} ${styles.shopContainer}`}
        >
          <div className={styles.megaSectionTitle}>
            <h2>
              스토어
            </h2>

            <Link
              to="/shop"
              className={styles.sectionAllLink}
              onClick={closeMegaMenu}
            >
              전체 상품
            </Link>
          </div>

          <nav
            className={styles.shopCategoryColumn}
            aria-label="상품 카테고리"
          >
            <Link
              to="/shop?category=liquor"
              className={`${styles.shopCategoryLink} ${
                activeShopCategory === 'liquor'
                  ? styles.shopCategoryLinkActive
                  : ''
              }`}
              onMouseEnter={() =>
                setHoveredShopCategory('liquor')
              }
              onClick={closeMegaMenu}
              aria-current={
                activeShopCategory === 'liquor'
                  ? 'page'
                  : undefined
              }
            >
              <span>전통주</span>
            </Link>

            <Link
              to="/shop?category=food"
              className={`${styles.shopCategoryLink} ${
                activeShopCategory === 'food'
                  ? styles.shopCategoryLinkActive
                  : ''
              }`}
              onMouseEnter={() =>
                setHoveredShopCategory('food')
              }
              onClick={closeMegaMenu}
              aria-current={
                activeShopCategory === 'food'
                  ? 'page'
                  : undefined
              }
            >
              <span>안주</span>
            </Link>

            <Link
              to="/shop?category=glass"
              className={`${styles.shopCategoryLink} ${
                activeShopCategory === 'glass'
                  ? styles.shopCategoryLinkActive
                  : ''
              }`}
              onMouseEnter={() =>
                setHoveredShopCategory('glass')
              }
              onClick={closeMegaMenu}
              aria-current={
                activeShopCategory === 'glass'
                  ? 'page'
                  : undefined
              }
            >
              <span>잔</span>
            </Link>

            <Link
              to="/shop?category=gift"
              className={`${styles.shopCategoryLink} ${
                activeShopCategory === 'gift'
                  ? styles.shopCategoryLinkActive
                  : ''
              }`}
              onMouseEnter={() =>
                setHoveredShopCategory('gift')
              }
              onClick={closeMegaMenu}
              aria-current={
                activeShopCategory === 'gift'
                  ? 'page'
                  : undefined
              }
            >
              <span>선물 세트</span>
            </Link>
          </nav>

          <div className={styles.shopDetailColumn}>
            <h3>
              {shopSubcategories[hoveredShopCategory].title}
            </h3>

            {shopSubcategories[hoveredShopCategory].items.length > 0 ? (
              <div className={styles.shopDetailLinks}>
                {shopSubcategories[hoveredShopCategory].items.map(
                  ({
                    label,
                    to,
                    activeKey,
                  }) => {
                    const isDetailActive =
                      activeShopCategory === hoveredShopCategory &&
                      activeShopDetail === activeKey

                    return (
                      <Link
                        to={to}
                        key={label}
                        className={`${styles.shopDetailLink} ${
                          isDetailActive
                            ? styles.shopDetailLinkActive
                            : ''
                        }`}
                        onClick={closeMegaMenu}
                        aria-current={
                          isDetailActive
                            ? 'page'
                            : undefined
                        }
                      >
                        {label}
                      </Link>
                    )
                  }
                )}
              </div>
            ) : (
              <Link
                to={`/shop?category=${hoveredShopCategory}`}
                className={styles.shopDetailAll}
                onClick={closeMegaMenu}
              >
                전체 보기
              </Link>
            )}
          </div>

          <div className={styles.popularProducts}>
            <div className={styles.popularTitle}>
              <h3>
                인기 상품
              </h3>

              <Link
                to="/shop?category=liquor"
                onClick={closeMegaMenu}
              >
                전체보기
              </Link>
            </div>

            <div className={styles.productList}>
              {popularProducts.map(
                (product) => {
                  const imageSrc =
                    resolveImage(
                      product.imageUrl
                    )

                  const productName =
                    getProductName(
                      product
                    )

                  return (
                    <Link
                      key={
                        product.productId
                      }
                      to={`/shop/${product.productId}`}
                      className={
                        styles.productCard
                      }
                      onClick={
                        closeMegaMenu
                      }
                    >
                      <div
                        className={
                          styles.productImage
                        }
                      >
                        {imageSrc && (
                          <img
                            src={imageSrc}
                            alt={productName}
                           loading="lazy" decoding="async" />
                        )}
                      </div>

                      <span
                        className={
                          styles.productName
                        }
                      >
                        {productName}
                      </span>

                      <strong>
                        {formatPrice(
                          product.price
                        )}
                      </strong>
                    </Link>
                  )
                }
              )}
            </div>
          </div>
        </div>
      </div>


      {/* ========================================
          고객센터 MEGA MENU
      ======================================== */}

      <div
        className={`${styles.megaMenu} ${styles.customerServiceMegaMenu} ${
          openMenu === 'customerService'
            ? styles.megaMenuOpen
            : ''
        }`}
      >
        <div
          className={`${styles.megaContainer} ${styles.customerServiceMegaContainer}`}
        >
          <div className={styles.megaSectionTitle}>
            <h2>
              고객센터
            </h2>
          </div>

          <nav
            className={styles.customerServiceSnb}
            aria-label="고객센터 메뉴"
          >
            <Link
              to="/faq"
              className={`${styles.snbNavLink} ${
                isFaqActive
                  ? styles.snbNavLinkActive
                  : ''
              }`}
              onClick={closeMegaMenu}
            >
              <span>
                자주 묻는 질문
              </span>
            </Link>

            <Link
              to="/inquiry"
              className={`${styles.snbNavLink} ${
                isInquiryActive
                  ? styles.snbNavLinkActive
                  : ''
              }`}
              onClick={closeMegaMenu}
            >
              <span>
                1:1 문의하기
              </span>
            </Link>

            <Link
              to="/notices"
              className={`${styles.snbNavLink} ${
                isNoticesActive
                  ? styles.snbNavLinkActive
                  : ''
              }`}
              onClick={closeMegaMenu}
            >
              <span>
                공지사항
              </span>
            </Link>
          </nav>
        </div>
      </div>

    </div>
  )
}


export default DesktopHeader
