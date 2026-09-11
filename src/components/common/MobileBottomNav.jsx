import { NavLink } from 'react-router-dom'

import homeIcon from '../../assets/webpImages/icons/homeIcon.webp'
import categoryIcon from '../../assets/webpImages/icons/categoryIcon.webp'
import wishlistIcon from '../../assets/webpImages/icons/wishIcon.webp'
import loginIcon from '../../assets/webpImages/icons/loginIcon.webp'

import styles from './MobileBottomNav.module.scss'

const MobileBottomNav = () => {
  return (
    <nav className={styles.bottomNav}>
      <div className={styles.bottomNavInner}>

        {/* 홈 */}
        <NavLink
          to="/"
          className={({ isActive }) =>
            `${styles.navItem} ${
              isActive ? styles.active : ''
            }`
          }
        >
          <img
            src={homeIcon}
            alt=""
          />

          <span>홈</span>
        </NavLink>

        {/* 카테고리 */}
        <NavLink
          to="/shop"
          className={({ isActive }) =>
            `${styles.navItem} ${
              isActive ? styles.active : ''
            }`
          }
        >
          <img
            src={categoryIcon}
            alt=""
          />

          <span>카테고리</span>
        </NavLink>

        {/* 찜 */}
        <NavLink
          to="/mypage/wishlist"
          className={({ isActive }) =>
            `${styles.navItem} ${
              isActive ? styles.active : ''
            }`
          }
        >
          <img
            src={wishlistIcon}
            alt=""
          />

          <span>찜</span>
        </NavLink>

        {/* 마이 */}
        <NavLink
          to="/mypage"
          className={({ isActive }) =>
            `${styles.navItem} ${
              isActive ? styles.active : ''
            }`
          }
        >
          <img
            src={loginIcon}
            alt=""
          />

          <span>마이</span>
        </NavLink>

      </div>
    </nav>
  )
}

export default MobileBottomNav