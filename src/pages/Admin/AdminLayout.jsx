// Page placeholder.
import { Link, Outlet } from 'react-router-dom'
import styles from './AdminLayout.module.scss'

const AdminLayout = () => <div className={styles.page}><nav className={styles.nav}><Link to="/admin">대시보드</Link><Link to="/admin/users">회원</Link><Link to="/admin/products">상품</Link><Link to="/admin/ai-logs">AI 로그</Link><Link to="/admin/events">이벤트</Link></nav><Outlet /></div>

export default AdminLayout
