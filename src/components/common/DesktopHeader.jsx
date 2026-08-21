import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'

import { auth } from '../../firebase/firebase'

import jajakLogo from '../../assets/logos/jajakLogo.png'
import cartIcon from '../../assets/icons/cartIcon.png'
import wishlistIcon from '../../assets/icons/wishIcon.png'
import loginIcon from '../../assets/icons/loginIcon.png'
import searchIcon from '../../assets/icons/searchIcon.png'

import styles from './DesktopHeader.module.scss'


const DesktopHeader = () => {
  const navigate = useNavigate()

  const [openMenu, setOpenMenu] = useState(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchKeyword, setSearchKeyword] = useState('')
  const [user, setUser] = useState(null)


  /* ========================================
     로그인 상태 확인
  ======================================== */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser)
    })

    return () => unsubscribe()
  }, [])


  /* ========================================
     MEGA MENU
  ======================================== */

  const openMegaMenu = (menu) => {
    setIsSearchOpen(false)
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
    setIsSearchOpen((prev) => !prev)
  }

  const closeSearch = () => {
    setIsSearchOpen(false)
    setSearchKeyword('')
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()

    const keyword = searchKeyword.trim()

    if (!keyword) {
      return
    }

    navigate(`/shop?search=${encodeURIComponent(keyword)}`)

    setIsSearchOpen(false)
    setSearchKeyword('')
  }


  return (
    <div
      className={styles.desktopHeader}
      onMouseLeave={closeMegaMenu}
    >

      {/* ========================================
          HEADER
      ======================================== */}

      <div className={styles.headerInner}>
        <div className={styles.headerContainer}>

          {/* GNB */}
          <nav className={styles.gnb}>

            {/* BRAND */}
            <div
              className={styles.gnbItem}
              onMouseEnter={() => openMegaMenu('brand')}
            >
              <Link
                to="/brand"
                className={styles.gnbLink}
              >
                BRAND
              </Link>
            </div>

            {/* SHOP */}
            <div
              className={styles.gnbItem}
              onMouseEnter={() => openMegaMenu('shop')}
            >
              <Link
                to="/shop"
                className={styles.gnbLink}
              >
                SHOP
              </Link>
            </div>

            {/* AI 추천 */}
            <div
              className={styles.gnbItem}
              onMouseEnter={closeMegaMenu}
            >
              <Link
                to="/ai"
                className={styles.gnbLink}
              >
                AI 추천
              </Link>
            </div>

            {/* 이벤트 */}
            <div
              className={styles.gnbItem}
              onMouseEnter={closeMegaMenu}
            >
              <Link
                to="/events"
                className={styles.gnbLink}
              >
                이벤트
              </Link>
            </div>

          </nav>


          {/* ========================================
              중앙 로고
          ======================================== */}

          <Link
            to="/"
            className={styles.logo}
            onMouseEnter={closeMegaMenu}
            onClick={closeSearch}
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
            className={styles.headerActions}
            onMouseEnter={closeMegaMenu}
          >

            {/* 검색 */}
            <button
              type="button"
              className={`${styles.iconButton} ${
                isSearchOpen ? styles.searchActive : ''
              }`}
              aria-label={isSearchOpen ? '검색 닫기' : '검색'}
              aria-expanded={isSearchOpen}
              onClick={toggleSearch}
            >
              <img
                src={searchIcon}
                alt=""
              />
            </button>


            {/* 로그인 / 마이페이지 */}
            <Link
              to={user ? '/mypage' : '/login'}
              className={styles.iconButton}
              aria-label={user ? '마이페이지' : '로그인'}
              onClick={closeSearch}
            >
              <img
                src={loginIcon}
                alt=""
              />
            </Link>


            {/* 찜 */}
            <Link
              to="/mypage/wishlist"
              className={styles.iconButton}
              aria-label="찜 목록"
              onClick={closeSearch}
            >
              <img
                src={wishlistIcon}
                alt=""
              />
            </Link>


            {/* 장바구니 */}
            <Link
              to="/cart"
              className={styles.iconButton}
              aria-label="장바구니"
              onClick={closeSearch}
            >
              <img
                src={cartIcon}
                alt=""
              />
            </Link>

          </div>

        </div>
      </div>


      {/* ========================================
          SEARCH PANEL
      ======================================== */}

      <div
        className={`${styles.searchPanel} ${
          isSearchOpen ? styles.searchPanelOpen : ''
        }`}
        onMouseEnter={closeMegaMenu}
      >
        <form
          className={styles.searchForm}
          onSubmit={handleSearchSubmit}
        >
          <img
            src={searchIcon}
            alt=""
            className={styles.searchFormIcon}
          />

          <input
            type="search"
            value={searchKeyword}
            placeholder="찾고 싶은 상품을 검색해보세요."
            aria-label="상품 검색"
            onChange={(e) => setSearchKeyword(e.target.value)}
          />

          {searchKeyword && (
            <button
              type="button"
              className={styles.clearButton}
              aria-label="검색어 지우기"
              onClick={() => setSearchKeyword('')}
            >
              ×
            </button>
          )}

          <button
            type="submit"
            className={styles.searchSubmit}
          >
            검색
          </button>
        </form>
      </div>


      {/* ========================================
          브랜드 MEGA MENU
      ======================================== */}

      <div
        className={`${styles.megaMenu} ${
          openMenu === 'brand'
            ? styles.megaMenuOpen
            : ''
        }`}
      >
        <div className={styles.megaContainer}>

          {/* 브랜드 SNB */}
          <div className={styles.brandSnb}>

            <Link
              to="/brand"
              className={styles.snbLink}
              onClick={closeMegaMenu}
            >
              브랜드 소개
            </Link>

            <Link
              to="/brand/makdong"
              className={`${styles.snbLink} ${styles.makdongLink}`}
              onClick={closeMegaMenu}
            >
              전통주 이야기
            </Link>

            <Link
              to="/ai"
              className={`${styles.snbLink} ${styles.hiddenBrandLink}`}
              onClick={closeMegaMenu}
            >
              자작의 혼술상 추천
            </Link>

          </div>


          {/* 브랜드 오른쪽 영역 */}
          <div className={styles.brandVisual}>

            <div className={styles.brandImage}>
              {/* 추후 브랜드 이미지 */}
            </div>

            <div className={styles.brandText}>
              <h2>자작이 걸어온 길</h2>

              <p>
                전통주의 가치를 담아온
                <br />
                자작의 브랜드 스토리를 만나보세요.
              </p>
            </div>

          </div>

        </div>
      </div>


      {/* ========================================
          상품 MEGA MENU
      ======================================== */}

      <div
        className={`${styles.megaMenu} ${
          openMenu === 'shop'
            ? styles.megaMenuOpen
            : ''
        }`}
      >
        <div
          className={`${styles.megaContainer} ${styles.shopContainer}`}
        >

          {/* 카테고리 */}
          <div className={styles.shopColumn}>

            <span className={styles.columnTitle}>
              카테고리
            </span>

            <Link
              to="/shop"
              className={styles.snbLink}
              onClick={closeMegaMenu}
            >
              전통주
            </Link>

            <Link
              to="/shop?category=food"
              className={styles.snbLink}
              onClick={closeMegaMenu}
            >
              안주
            </Link>

            <Link
              to="/shop?category=glass"
              className={styles.snbLink}
              onClick={closeMegaMenu}
            >
              잔
            </Link>

            <Link
              to="/shop?category=gift"
              className={styles.snbLink}
              onClick={closeMegaMenu}
            >
              선물 세트
            </Link>

          </div>


          {/* 전통주 종류 */}
          <div className={styles.shopColumn}>

            <span className={styles.columnTitle}>
              전통주 종류
            </span>

            <Link
              to="/shop?type=takju"
              className={styles.snbLink}
              onClick={closeMegaMenu}
            >
              탁주
            </Link>

            <Link
              to="/shop?type=yakju"
              className={styles.snbLink}
              onClick={closeMegaMenu}
            >
              약주 · 청주
            </Link>

            <Link
              to="/shop?type=fruit"
              className={styles.snbLink}
              onClick={closeMegaMenu}
            >
              과실주
            </Link>

            <Link
              to="/shop?type=distilled"
              className={styles.snbLink}
              onClick={closeMegaMenu}
            >
              증류주
            </Link>

            <Link
              to="/shop?type=liqueur"
              className={styles.snbLink}
              onClick={closeMegaMenu}
            >
              리큐르 · 기타상품
            </Link>

          </div>


          {/* 인기 상품 */}
          <div className={styles.popularProducts}>

            <div className={styles.popularTitle}>
              <h2>인기 상품</h2>

              <Link
                to="/shop"
                onClick={closeMegaMenu}
              >
                전체보기
                <span>→</span>
              </Link>
            </div>

            <div className={styles.productList}>

              {[1, 2, 3, 4].map((product) => (
                <Link
                  key={product}
                  to={`/shop/${product}`}
                  className={styles.productCard}
                  onClick={closeMegaMenu}
                >
                  <div className={styles.productImage}>
                    {/* 상품 이미지 */}
                  </div>

                  <span className={styles.productName}>
                    상품명
                  </span>

                  <strong>
                    398,230원
                  </strong>
                </Link>
              ))}

            </div>

          </div>

        </div>
      </div>

    </div>
  )
}

export default DesktopHeader
