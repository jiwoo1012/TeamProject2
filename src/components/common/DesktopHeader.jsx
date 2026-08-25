import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { onAuthStateChanged } from 'firebase/auth'

import { auth } from '../../firebase/firebase'

// 상품 데이터
import { products } from '../../data/products'

import jajakLogo from '../../assets/logos/jajakLogo.png'
import cartIcon from '../../assets/icons/cartIcon.png'
import wishlistIcon from '../../assets/icons/wishIcon.png'
import loginIcon from '../../assets/icons/loginIcon.png'
import searchIcon from '../../assets/icons/searchIcon.png'

import SearchModal from './SearchModal'

import styles from './DesktopHeader.module.scss'


/* ========================================
   상품 이미지 불러오기

   ProductList와 동일한 방식으로
   product1.png, product2.png ... 연결
======================================== */

const productImages = import.meta.glob(
  '../../assets/images/products/product*.png',
  {
    eager: true,
    import: 'default',
  }
)


const resolveImage = (imageUrl) => {
  return Object.entries(productImages).find(([path]) =>
    path.endsWith(`/${imageUrl}`)
  )?.[1]
}


/* ========================================
   인기 상품

   현재는 전체 상품 중 앞 4개를 사용
   추후 isPopular 등의 필드가 생기면
   filter 방식으로 변경 가능
======================================== */

const popularProducts = products.slice(0, 4)


const DesktopHeader = () => {
  const [openMenu, setOpenMenu] = useState(null)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [user, setUser] = useState(null)


  /* ========================================
     로그인 상태 확인
  ======================================== */

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (currentUser) => {
        setUser(currentUser)
      }
    )

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
  }


  /* ========================================
     상품명 가져오기

     현재 상품 데이터 필드명이 달라도
     화면이 깨지지 않도록 처리
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
    const numericPrice = Number(price)

    if (Number.isNaN(numericPrice)) {
      return price
    }

    return `${numericPrice.toLocaleString('ko-KR')}원`
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

          {/* ========================================
              GNB
          ======================================== */}

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
                브랜드 소개
              </Link>
            </div>


            {/* SHOP */}
            <div
              className={styles.gnbItem}
              onMouseEnter={() => openMegaMenu('shop')}
            >
              <Link
                to="/shop?category=liquor"
                className={styles.gnbLink}
              >
                스토어
              </Link>
            </div>


            {/* AI 추천 */}
            <div
              className={styles.gnbItem}
              onMouseEnter={() => openMegaMenu('ai')}
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
                isSearchOpen
                  ? styles.searchActive
                  : ''
              }`}
              aria-label={
                isSearchOpen
                  ? '검색 닫기'
                  : '검색'
              }
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
              aria-label={
                user
                  ? '마이페이지'
                  : '로그인'
              }
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
          SEARCH MODAL
      ======================================== */}

      <SearchModal
        isOpen={isSearchOpen}
        onClose={closeSearch}
      />


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
              className={styles.snbLink}
              onClick={closeMegaMenu}
            >
              막둥이 소개
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
          AI 추천 MEGA MENU
      ======================================== */}

      <div
        className={`${styles.megaMenu} ${
          openMenu === 'ai'
            ? styles.megaMenuOpen
            : ''
        }`}
      >
        <div className={styles.megaContainer}>

          <div className={styles.aiSnb}>

            <Link
              to="/ai"
              className={styles.snbLink}
              onClick={closeMegaMenu}
            >
              추천 받기
            </Link>

            <Link
              to="/mypage/ai-history"
              className={styles.snbLink}
              onClick={closeMegaMenu}
            >
              이전 추천 결과 보기
            </Link>

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

          {/* ========================================
              카테고리
          ======================================== */}

          <div className={styles.shopColumn}>

            <span className={styles.columnTitle}>
              카테고리
            </span>

            <Link
              to="/shop?category=liquor"
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


          {/* ========================================
              전통주 종류
          ======================================== */}

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


          {/* ========================================
              인기 상품
          ======================================== */}

          <div className={styles.popularProducts}>

            <div className={styles.popularTitle}>

              <h2>인기 상품</h2>

              <Link
                to="/shop?category=liquor"
                onClick={closeMegaMenu}
              >
                전체보기
                <span>→</span>
              </Link>

            </div>


            <div className={styles.productList}>

              {popularProducts.map((product) => {
                const imageSrc = resolveImage(product.imageUrl)
                const productName = getProductName(product)

                return (
                  <Link
                    key={product.productId}
                    to={`/shop/${product.productId}`}
                    className={styles.productCard}
                    onClick={closeMegaMenu}
                  >

                    {/* 상품 이미지 */}
                    <div className={styles.productImage}>
                      {imageSrc && (
                        <img
                          src={imageSrc}
                          alt={productName}
                          style={{
                            width: '100%',
                            height: '100%',
                            display: 'block',
                            objectFit: 'cover',
                          }}
                        />
                      )}
                    </div>


                    {/* 상품명 */}
                    <span className={styles.productName}>
                      {productName}
                    </span>


                    {/* 가격 */}
                    <strong>
                      {formatPrice(product.price)}
                    </strong>

                  </Link>
                )
              })}

            </div>

          </div>

        </div>
      </div>

    </div>
  )
}

export default DesktopHeader
