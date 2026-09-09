import {
  useNavigate,
} from 'react-router-dom'

import styles from './MyPageHeader.module.scss'


const MyPageHeader = ({
  title,
  description,
  children,
}) => {
  const navigate =
    useNavigate()


  const handleBack = () => {
    navigate(-1)
  }


  return (
    <header
      className={
        styles.header
      }
    >

      {/* =========================
          MOBILE BACK
      ========================= */}

      <button
        type="button"
        className={
          styles.mobileBackButton
        }
        onClick={
          handleBack
        }
        aria-label="뒤로 가기"
      >
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </button>


      {/* =========================
          TITLE
      ========================= */}

      <div
        className={
          styles.textArea
        }
      >
        <h1
          className={
            styles.title
          }
        >
          {title}
        </h1>


        {description && (
          <p
            className={
              styles.description
            }
          >
            {description}
          </p>
        )}
      </div>


      {/* =========================
          DESKTOP ACTION
      ========================= */}

      {children && (
        <div
          className={
            styles.action
          }
        >
          {children}
        </div>
      )}

    </header>
  )
}


export default MyPageHeader