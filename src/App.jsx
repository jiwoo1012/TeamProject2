import { Routes, Route } from 'react-router-dom'

import SiteLayout from './components/common/SiteLayout'

// Main
import MainPage from './pages/Main/MainPage'
import SplashIntro from './pages/Main/SplashIntro'

// Brand
import BrandStory from './pages/Brand/BrandStory'

// Shop
import ProductList from './pages/Shop/ProductList'
import ProductDetail from './pages/Shop/ProductDetail'

// Auth
import Login from './pages/Auth/Login'
import Signup from './pages/Auth/Signup'
import PreferenceSurvey from './pages/Auth/PreferenceSurvey'

// AI
import AiIntro from './pages/AiCurator/AiIntro'
import AiSurvey from './pages/AiCurator/AiSurvey'
import AiResult from './pages/AiCurator/AiResult'

// Cart / Order
import Cart from './pages/CartOrder/Cart'
import Checkout from './pages/CartOrder/Checkout'
import OrderComplete from './pages/CartOrder/OrderComplete'

// MyPage
import MyPageLayout from './pages/MyPage/MyPageLayout'
import MyHome from './pages/MyPage/MyHome'
import ProfileEdit from './pages/MyPage/ProfileEdit'
import OrderHistory from './pages/MyPage/OrderHistory'
import OrderDetail from './pages/MyPage/OrderDetail'
import WishList from './pages/MyPage/WishList'
import AiHistory from './pages/MyPage/AiHistory'
import EventHistory from './pages/MyPage/EventHistory'

// Event
import EventList from './pages/Event/EventList'
import RouletteEvent from './pages/Event/RouletteEvent'

// Support
import NoticeList from './pages/Support/NoticeList'
import NoticeDetail from './pages/Support/NoticeDetail'
import InquiryQnA from './pages/Support/InquiryQnA'

// Admin
import AdminLayout from './pages/Admin/AdminLayout'
import Dashboard from './pages/Admin/Dashboard'
import UserManage from './pages/Admin/UserManage'
import ProductManage from './pages/Admin/ProductManage'
import AiLogManage from './pages/Admin/AiLogManage'
import EventManage from './pages/Admin/EventManage'

// NotFound
import NotFound from './pages/NotFound/NotFound'

const App = () => {
  return (
    <Routes>

      {/* 일반 사용자 페이지 */}
      <Route element={<SiteLayout />}>

        <Route path="/" element={<MainPage />} />
        <Route path="/intro" element={<SplashIntro />} />

        <Route path="/brand" element={<BrandStory />} />

        <Route path="/shop" element={<ProductList />} />
        <Route path="/shop/:productId" element={<ProductDetail />} />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/preference" element={<PreferenceSurvey />} />

        <Route path="/ai" element={<AiIntro />} />
        <Route path="/ai/survey" element={<AiSurvey />} />
        <Route path="/ai/result" element={<AiResult />} />

        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route
          path="/order-complete"
          element={<OrderComplete />}
        />

        <Route path="/events" element={<EventList />} />
        <Route
          path="/events/roulette"
          element={<RouletteEvent />}
        />

        <Route path="/notices" element={<NoticeList />} />
        <Route
          path="/notices/:noticeId"
          element={<NoticeDetail />}
        />
        <Route path="/inquiry" element={<InquiryQnA />} />

        {/* 마이페이지 */}
        <Route path="/mypage" element={<MyPageLayout />}>
          <Route index element={<MyHome />} />
          <Route path="profile" element={<ProfileEdit />} />
          <Route path="orders" element={<OrderHistory />} />
          <Route path="orders/:orderId" element={<OrderDetail />} />
          <Route path="wishlist" element={<WishList />} />
          <Route path="ai-history" element={<AiHistory />} />
          <Route path="events" element={<EventHistory />} />
        </Route>

      </Route>

      {/* 관리자 페이지 */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="users" element={<UserManage />} />
        <Route path="products" element={<ProductManage />} />
        <Route path="ai-logs" element={<AiLogManage />} />
        <Route path="events" element={<EventManage />} />
      </Route>

      <Route path="*" element={<NotFound />} />

    </Routes>
  )
}

export default App
