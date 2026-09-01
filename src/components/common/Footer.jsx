import { useState } from 'react'
import { Link } from 'react-router-dom'

import jajakLogo from '../../assets/logos/jajakLogo.png'
import styles from './Footer.module.scss'

const Footer = () => {
  const [email, setEmail] = useState('')
  const [isSubscribeModalOpen, setIsSubscribeModalOpen] = useState(false)

  // 모바일 Footer 아코디언
  const [openFooterMenu, setOpenFooterMenu] = useState(null)

  const handleSubscribe = (e) => {
    e.preventDefault()

    if (!email.trim()) {
      return
    }

    setIsSubscribeModalOpen(true)
    setEmail('')
  }

  const closeSubscribeModal = () => {
    setIsSubscribeModalOpen(false)
  }

  const toggleFooterMenu = (menu) => {
    setOpenFooterMenu((prev) => (
      prev === menu ? null : menu
    ))
  }

  return (
    <>
      <footer className={styles.footer}>
        <div className={styles.footerContainer}>

          {/* =====================================
              FOOTER MAIN
          ===================================== */}
          <div className={styles.footerMain}>

            {/* =====================================
                브랜드 정보
            ===================================== */}
            <div className={styles.brandArea}>
              <Link
                to="/"
                state={{ skipJourney: true }}
                className={styles.logo}
              >
                <img
                  src={jajakLogo}
                  alt="JAJAK"
                />
              </Link>

              <div className={styles.companyInfo}>
                <p>
                  <span>상호명</span>
                  자작 JAJAK
                </p>

                <p>
                  <span>대표</span>
                  고주망태팀
                </p>

                <p>
                  <span>사업자등록번호</span>
                  123-456-789
                </p>
              </div>
            </div>


            {/* =====================================
                PC 상품 메뉴
            ===================================== */}
            <div className={styles.desktopFooterMenu}>
              <h3>상품</h3>

              <nav>
                <Link to="/shop">
                  전통주
                </Link>

                <Link to="/shop?category=food">
                  안주 · 잔 · 선물
                </Link>

                <Link to="/ai">
                  AI 추천
                </Link>

                <Link to="/events">
                  이벤트
                </Link>
              </nav>
            </div>


            {/* =====================================
                PC 고객 지원
            ===================================== */}
            <div className={styles.desktopFooterMenu}>
              <h3>고객 지원</h3>

              <nav>
                <Link to="/faq">
                  자주 묻는 질문
                </Link>

                <Link to="/inquiry">
                  1:1 문의하기
                </Link>

                <Link to="/notices">
                  공지사항
                </Link>
              </nav>
            </div>


            {/* =====================================
                모바일 메뉴
            ===================================== */}
            <div className={styles.mobileFooterMenus}>

              {/* SHOP */}
              <div className={styles.mobileMenuGroup}>
                <button
                  type="button"
                  className={styles.mobileMenuTitle}
                  onClick={() => toggleFooterMenu('shop')}
                  aria-expanded={openFooterMenu === 'shop'}
                >
                  <span>SHOP</span>

                  <span
                    className={`${styles.mobileArrow} ${
                      openFooterMenu === 'shop'
                        ? styles.mobileArrowOpen
                        : ''
                    }`}
                  >
                    ∨
                  </span>
                </button>

                <div
                  className={`${styles.mobileSubMenu} ${
                    openFooterMenu === 'shop'
                      ? styles.mobileSubMenuOpen
                      : ''
                  }`}
                >
                  <div className={styles.mobileSubMenuInner}>
                    <Link to="/shop">
                      전통주
                    </Link>

                    <Link to="/shop?category=food">
                      안주 · 잔 · 선물
                    </Link>

                    <Link to="/ai">
                      AI 추천
                    </Link>

                    <Link to="/events">
                      이벤트
                    </Link>
                  </div>
                </div>
              </div>


              {/* 고객 지원 */}
              <div className={styles.mobileMenuGroup}>
                <button
                  type="button"
                  className={styles.mobileMenuTitle}
                  onClick={() => toggleFooterMenu('support')}
                  aria-expanded={openFooterMenu === 'support'}
                >
                  <span>고객 지원</span>

                  <span
                    className={`${styles.mobileArrow} ${
                      openFooterMenu === 'support'
                        ? styles.mobileArrowOpen
                        : ''
                    }`}
                  >
                    ∨
                  </span>
                </button>

                <div
                  className={`${styles.mobileSubMenu} ${
                    openFooterMenu === 'support'
                      ? styles.mobileSubMenuOpen
                      : ''
                  }`}
                >
                  <div className={styles.mobileSubMenuInner}>
                    <Link to="/faq">
                      자주 묻는 질문
                    </Link>

                    <Link to="/inquiry">
                      1:1 문의하기
                    </Link>

                    <Link to="/notices">
                      공지사항
                    </Link>
                  </div>
                </div>
              </div>
            </div>


            {/* =====================================
                구독
            ===================================== */}
            <div className={styles.subscribeArea}>
              <h3>구독하기</h3>

              <p>
                자작의 최신 소식을 가장 먼저 받아보세요.
              </p>

              <form
                className={styles.subscribeForm}
                onSubmit={handleSubscribe}
              >
                <label
                  htmlFor="subscribe-email"
                  className={styles.hiddenLabel}
                >
                  이메일
                </label>

                <input
                  id="subscribe-email"
                  type="email"
                  placeholder="이메일을 입력하세요."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

                <button type="submit">
                  알림 받기
                </button>
              </form>
            </div>
          </div>


          {/* =====================================
              FOOTER BOTTOM
          ===================================== */}
          <div className={styles.footerBottom}>

            <div className={styles.notice}>
              <p>
                본 사이트는 실제 서비스가 아닌 포트폴리오 목적의
                학습용 프로젝트입니다.
              </p>

              <p>
                실제 상품 판매나 결제가 이루어지지 않으며,
                모든 정보는 예시입니다.
              </p>
            </div>

            <div className={styles.bottomRight}>

              <div className={styles.policyLinks}>
                <span>이용약관</span>
                <span>개인정보처리방침</span>
              </div>

              <p className={styles.copyright}>
                © 2026 JAJAK Student Portfolio Project
              </p>

            </div>
          </div>
        </div>
      </footer>


      {/* =====================================
          구독 완료 MODAL
      ===================================== */}
      {isSubscribeModalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={closeSubscribeModal}
        >
          <div
            className={styles.subscribeModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="subscribe-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.checkIcon}>
              ✓
            </div>

            <p
              id="subscribe-modal-title"
              className={styles.modalMessage}
            >
              알림 구독이 완료되었습니다.
            </p>

            <button
              type="button"
              className={styles.modalCloseButton}
              onClick={closeSubscribeModal}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default Footer