import React from 'react'

import styles from './AdminFooter.module.scss'


const AdminFooter = () => {
  return (
    <footer className={styles.adminFooter}>
      <div className={styles.inner}>

        <p className={styles.copyright}>
          © 2026 JAJAK. Admin Management System.
        </p>

        <p className={styles.description}>
          관리자 전용 페이지
        </p>

      </div>
    </footer>
  )
}


export default AdminFooter