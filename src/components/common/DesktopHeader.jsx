import { useState } from 'react'
import { Link } from 'react-router-dom'

import jajakLogo from '../../assets/logos/jajakLogo.png'
import cartIcon from '../../assets/icons/cartIcon.png'
import wishlistIcon from '../../assets/icons/wishIcon.png'
import loginIcon from '../../assets/icons/loginIcon.png'
import searchIcon from '../../assets/icons/searchIcon.png'

import styles from './DesktopHeader.module.scss'

const DesktopHeader = () => {
  const [openMenu, setOpenMenu] = useState(null)

  const openMegaMenu = (menu) => {
    setOpenMenu(menu)
  }

  const closeMegaMenu = () => {
    setOpenMenu(null)
  }

  return (
    <div
      className={styles.desktopHeader}
      onMouseLeave={closeMegaMenu}
    >
      {/* ==============================
          HEADER
      ============================== */}
      <div className={styles.headerInner}>
        <div className={styles.headerContainer}>

          {/* 로고 */}
          <Link
            to="/"
            className={styles.logo}
            onMouseEnter={closeMegaMenu}
          >
            <img
              src={jajakLogo}
              alt="JAJAK"
            />
          </Link>

          {/* GNB */}
          <nav className={styles.gnb}>

            {/* 브랜드 */}
            <div
              className={styles.gnbItem}
              onMouseEnter={() => openMegaMenu('brand')}
            >
              <Link
                to="/brand"
                className={styles.gnbLink}
              >
                브랜드
              </Link>
            </div>

            {/* 상품 */}
            <div
              className={styles.gnbItem}
              onMouseEnter={() => openMegaMenu('shop')}
            >
              <Link
                to="/shop"
                className={styles.gnbLink}
              >
                상품
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

          {/* 오른쪽 영역 */}
          <div
            className={styles.headerActions}
            onMouseEnter={closeMegaMenu}
          >

            {/* 검색창 */}
            <button
              type="button"
              className={styles.searchBox}
              aria-label="검색"
            >
              <span>Search</span>

              <img
                src={searchIcon}
                alt=""
                className={styles.searchIcon}
              />
            </button>

            {/* 마이페이지 */}
            <Link
              to="/mypage"
              className={styles.iconButton}
              aria-label="마이페이지"
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
            >
              <img
                src={cartIcon}
                alt=""
              />
            </Link>

          </div>

        </div>
      </div>

      {/* ==============================
          브랜드 MEGA MENU
      ============================== */}
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
              to="/brand/story"
              className={styles.snbLink}
              onClick={closeMegaMenu}
            >
              전통주 이야기
            </Link>

            <Link
              to="/ai"
              className={styles.snbLink}
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

      {/* ==============================
          상품 MEGA MENU
      ============================== */}
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