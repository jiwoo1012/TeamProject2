import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import MobileBottomNav from './MobileBottomNav'

const SiteLayout = ({ hideFooter = false }) => {
  return (
    <div>
      <Header />

      <main>
        <Outlet />
      </main>

      {!hideFooter && <Footer />}

      <MobileBottomNav />
    </div>
  )
}

export default SiteLayout