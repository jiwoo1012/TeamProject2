import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'
import MobileBottomNav from './MobileBottomNav'

const SiteLayout = () => (
  <div>
    <Header />
    <main><Outlet /></main>
    <Footer />
    <MobileBottomNav />
  </div>
)

export default SiteLayout
