import React from 'react'
import { Link, useNavigate } from 'react-router-dom'

import styles from './AdminHeader.module.scss'


const AdminHeader = () => {
  const navigate = useNavigate()

  const handleGoStore = () => {
    navigate('/')
  }

  return (
    <header className={styles.adminHeader}>
      <div className={styles.inner}>

        <Link
          to="/admin"
          className={styles.logoArea}
        >
          <span className={styles.logo}>JAJAK</span>
          <span className={styles.adminLabel}>ADMIN</span>
        </Link>


        <div className={styles.rightArea}>

          <span className={styles.adminText}>
            관리자 페이지
          </span>

          <button
            type="button"
            className={styles.storeButton}
            onClick={handleGoStore}
          >
            스토어로 이동
            <span>›</span>
          </button>

        </div>

      </div>
    </header>
  )
}


export default AdminHeader