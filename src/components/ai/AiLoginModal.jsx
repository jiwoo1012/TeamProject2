import { useEffect } from 'react'

import makdongImage from  '../../assets/characters/Mhead.png'

import styles from './AiLoginModal.module.scss'


const AiLoginModal = ({
  isOpen,
  onClose,
  onGuest,
  onLogin,
}) => {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener(
      'keydown',
      handleKeyDown
    )

    return () => {
      document.removeEventListener(
        'keydown',
        handleKeyDown
      )
    }
  }, [isOpen, onClose])


  if (!isOpen) {
    return null
  }


  const handleOverlayClick = () => {
    onClose()
  }


  const handleModalClick = (event) => {
    event.stopPropagation()
  }


  return (
    <div
      className={styles.overlay}
      onClick={handleOverlayClick}
    >
      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-login-modal-title"
        onClick={handleModalClick}
      >

        {/* 막동이 */}
        <div className={styles.characterWrap}>
          <img
            src={makdongImage}
            alt="막동이"
            className={styles.character}
          />
        </div>


        {/* 제목 */}
        <h2
          id="ai-login-modal-title"
          className={styles.title}
        >
          로그인이 필요해요
        </h2>


        {/* 설명 */}
        <p className={styles.description}>
          막동이와 다양한 서비스를
          즐기고 싶다면
          <br />
          로그인으로 진행해주세요.
        </p>


        {/* 버튼 */}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.guestButton}
            onClick={onGuest}
          >
            비회원으로 추천 받기
          </button>

          <button
            type="button"
            className={styles.loginButton}
            onClick={onLogin}
          >
            로그인
          </button>
        </div>


        {/* 안내 */}
        <p className={styles.notice}>
          <span
            className={styles.noticeIcon}
            aria-hidden="true"
          >
            !
          </span>

          비회원 추천 기록은
          저장되지 않아요
        </p>

      </section>
    </div>
  )
}

export default AiLoginModal