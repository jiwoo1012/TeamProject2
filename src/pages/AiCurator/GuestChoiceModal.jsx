import { useEffect } from 'react'
import styles from './GuestChoiceModal.module.scss'

const GuestChoiceModal = ({
  isOpen,
  onLogin,
  onGuest,
  onClose,
}) => {
  // ESC 키로 닫기
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className={styles.overlay}
      role="presentation"
    >
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-choice-title"
      >
        {/* 닫기 */}
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="팝업 닫기"
        >
          ×
        </button>

        {/* 아이콘 */}
        <div className={styles.iconBox}>
          <span className={styles.checkIcon}>
            ✓
          </span>
        </div>

        {/* 제목 */}
        <h2
          id="guest-choice-title"
          className={styles.title}
        >
          자작의 회원이신가요?
        </h2>

        {/* 안내 */}
        <p className={styles.description}>
          로그인하면 저장된 취향과 정보를 바탕으로
          <br />
          더 쉽고, 더 나에게 맞는 추천을 받을 수 있어요!
        </p>

        <div className={styles.divider} />

        {/* 버튼 영역 */}
        <div className={styles.buttonGroup}>
          <button
            type="button"
            className={styles.loginButton}
            onClick={onLogin}
          >
            로그인하고 맞춤 추천 받기
          </button>

          <button
            type="button"
            className={styles.guestButton}
            onClick={onGuest}
          >
            비회원으로 추천 받기
          </button>
        </div>

        {/* 안내 문구 */}
        <p className={styles.notice}>
          <span className={styles.noticeIcon}>
            i
          </span>

          비회원은 추천 기록이 저장되지 않아요.
        </p>
      </div>
    </div>
  )
}

export default GuestChoiceModal