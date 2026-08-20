// Page placeholder.
import { Outlet } from 'react-router-dom'
import styles from './MyPageLayout.module.scss'

const MyPageLayout = () => <section className={styles.page}><Outlet /></section>

export default MyPageLayout
