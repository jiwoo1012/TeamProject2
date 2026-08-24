import { useNavigate } from 'react-router-dom'
import styles from './AdminErrorContent.module.scss'

const AdminErrorContent = () => {
  const navigate = useNavigate()

  return (
    <section className={styles.page} aria-labelledby="admin-error-title">
      <div className={styles.errorCard}>
        <div className={styles.errorIcon} aria-hidden="true">
          <svg viewBox="0 0 64 64">
            <path d="M18 7h21l10 10v33a7 7 0 0 1-7 7H18a7 7 0 0 1-7-7V14a7 7 0 0 1 7-7Z" />
            <path d="M39 7v11h10" />
            <path d="M22 39l6-6 5 5 7-8" />
            <path d="M22 47h20" />
          </svg>
        </div>

        <h2 id="admin-error-title">관리자 정보를 불러오지 못했습니다.</h2>
        <p>잠시 후 다시 시도해주세요.</p>

        <button type="button" onClick={() => navigate('/admin')}>
          관리자 홈으로 돌아가기
        </button>
      </div>
    </section>
  )
}

export default AdminErrorContent
