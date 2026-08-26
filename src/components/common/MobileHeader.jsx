import { useState } from 'react'
import { Link } from 'react-router-dom'

import jajakLogo from '../../assets/logos/jajakLogo.png'
import cartIcon from '../../assets/icons/cartIcon.png'
import searchIcon from '../../assets/icons/searchIcon.png'

import styles from './MobileHeader.module.scss'

const MobileHeader = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [openAccordion, setOpenAccordion] = useState(null)

  // 전체 메뉴 열기 / 닫기
  const toggleMenu = () => {
    setIsMenuOpen((prev) => !prev)
    setOpenAccordion(null)
  }

  // 전체 메뉴 닫기
  const closeMenu = () => {
    setIsMenuOpen(false)
    setOpenAccordion(null)
  }

  // 아코디언 열기 / 닫기
  const toggleAccordion = (menu) => {
    setOpenAccordion((prev) => (
      prev === menu ? null : menu
    ))
  }

  return (
    <div className={styles.mobileHeader}>

      {/* ==============================
          모바일 상단 헤더
      ============================== */}
      <div className={styles.mobileTop}>

        {/* 로고 */}
        <Link
          to="/"
          className={styles.logo}
          onClick={closeMenu}
        >
          <img
            src={jajakLogo}
            alt="JAJAK"
          />
        </Link>

        {/* 오른쪽 아이콘 */}
        <div className={styles.actions}>

          {/* 검색 */}
          <button
            type="button"
            className={styles.iconButton}
            aria-label="검색"
          >
            <img
              src={searchIcon}
              alt=""
            />
          </button>

          {/* 장바구니 */}
          <Link
            to="/cart"
            className={styles.iconButton}
            aria-label="장바구니"
            onClick={closeMenu}
          >
            <img
              src={cartIcon}
              alt=""
            />
          </Link>

          {/* 햄버거 / 닫기 */}
          <button
            type="button"
            className={`${styles.menuButton} ${
              isMenuOpen ? styles.menuButtonOpen : ''
            }`}
            aria-label={
              isMenuOpen
                ? '메뉴 닫기'
                : '메뉴 열기'
            }
            aria-expanded={isMenuOpen}
            onClick={toggleMenu}
          >
            <span />
            <span />
          </button>

        </div>
      </div>

      {/* ==============================
          모바일 전체 메뉴
      ============================== */}
      <div
        className={`${styles.menuPanel} ${
          isMenuOpen ? styles.menuPanelOpen : ''
        }`}
      >
        <nav className={styles.gnb}>

          {/* =========================
              브랜드
          ========================= */}
          <div className={styles.menuGroup}>

            <button
              type="button"
              className={styles.menuTitle}
              onClick={() => toggleAccordion('brand')}
            >
              <span>브랜드 소개</span>

              <span
                className={`${styles.arrow} ${
                  openAccordion === 'brand'
                    ? styles.arrowOpen
                    : ''
                }`}
              >
                ˅
              </span>
            </button>

            <div
              className={`${styles.subMenu} ${
                openAccordion === 'brand'
                  ? styles.subMenuOpen
                  : ''
              }`}
            >
              <div className={styles.subMenuInner}>

                <Link
                  to="/brand"
                  onClick={closeMenu}
                >
                  브랜드 소개
                </Link>

                <Link
                  to="/brand/makdong"
                  onClick={closeMenu}
                >
                  막둥이 소개
                </Link>

              </div>
            </div>

          </div>

          {/* =========================
              상품
          ========================= */}
          <div className={styles.menuGroup}>

            <button
              type="button"
              className={styles.menuTitle}
              onClick={() => toggleAccordion('shop')}
            >
              <span>스토어</span>

              <span
                className={`${styles.arrow} ${
                  openAccordion === 'shop'
                    ? styles.arrowOpen
                    : ''
                }`}
              >
                ˅
              </span>
            </button>

            <div
              className={`${styles.subMenu} ${
                openAccordion === 'shop'
                  ? styles.subMenuOpen
                  : ''
              }`}
            >
              <div className={styles.subMenuInner}>

                <Link
                  to="/shop"
                  onClick={closeMenu}
                >
                  전통주
                </Link>

                <Link
                  to="/shop?category=food"
                  onClick={closeMenu}
                >
                  안주
                </Link>

                <Link
                  to="/shop?category=glass"
                  onClick={closeMenu}
                >
                  잔
                </Link>

                <Link
                  to="/shop?category=gift"
                  onClick={closeMenu}
                >
                  선물 세트
                </Link>

              </div>
            </div>

          </div>

          {/* =========================
              AI 추천
          ========================= */}
          <div className={styles.menuGroup}>

            <button
              type="button"
              className={styles.menuTitle}
              onClick={() => toggleAccordion('ai')}
            >
              <span>AI 추천</span>

              <span
                className={`${styles.arrow} ${
                  openAccordion === 'ai'
                    ? styles.arrowOpen
                    : ''
                }`}
              >
                ˅
              </span>
            </button>

            <div
              className={`${styles.subMenu} ${
                openAccordion === 'ai'
                  ? styles.subMenuOpen
                  : ''
              }`}
            >
              <div className={styles.subMenuInner}>

                <Link
                  to="/ai"
                  onClick={closeMenu}
                >
                  추천 받기
                </Link>

                <Link
                  to="/mypage/ai-history"
                  onClick={closeMenu}
                >
                  이전 추천 결과 보기
                </Link>

              </div>
            </div>

          </div>

          {/* =========================
              이벤트
          ========================= */}
          <div className={styles.menuGroup}>

            <Link
              to="/events"
              className={styles.directLink}
              onClick={closeMenu}
            >
              이벤트
            </Link>

          </div>

        </nav>

        {/* ==============================
            로그인 영역

            로그인 기능 연결 전 임시 상태
        ============================== */}
        <div className={styles.userArea}>

          <Link
            to="/login"
            onClick={closeMenu}
          >
            로그인
          </Link>

          <span>|</span>

          <Link
            to="/signup"
            onClick={closeMenu}
          >
            회원가입
          </Link>

        </div>

      </div>
    </div>
  )
}

export default MobileHeader
