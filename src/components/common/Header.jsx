import DesktopHeader from './DesktopHeader'
import MobileHeader from './MobileHeader'

import styles from './Header.module.scss'

const Header = () => {
  return (
    <header className={styles.header}>
      <DesktopHeader />
      <MobileHeader />
    </header>
  )
}

export default Header