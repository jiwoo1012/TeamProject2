import { useState } from 'react'
import {
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom'

import SiteLayout from './components/common/SiteLayout'
import AdultModal from './components/common/AdultModal'
import ScrollToTop from './components/common/ScrollToTop'

// Main
import MainPage from './pages/Main/MainPage'
import SplashIntro from './pages/Main/SplashIntro'

// Brand
import BrandIntro from './pages/Brand/BrandIntro'
import MakdongIntro from './pages/Brand/MakdongIntro'

// Shop
import ProductList from './pages/Shop/ProductList'
import ProductDetail from './pages/Shop/ProductDetail'

// Auth
import Login from './pages/Auth/Login'
import Signup from './pages/Auth/Signup'
import PreferenceSurvey from './pages/Auth/PreferenceSurvey'
import PreferenceQuestions from './pages/Auth/PreferenceQuestions'
import PreferenceSafetyIntro from './pages/Auth/PreferenceSafetyIntro'
import PreferenceSafety from './pages/Auth/PreferenceSafety'
import PreferenceComplete from './pages/Auth/PreferenceComplete'

// AI
import AiIntro from './pages/AiCurator/AiIntro'
import AiSurvey from './pages/AiCurator/AiSurvey'
import AiResult from './pages/AiCurator/AiResult'
import AiPreference from './pages/AiCurator/AiPreference'

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
import MyPageErrorContent from './pages/MyPage/MyPageErrorContent'

// Event
import EventList from './pages/Event/EventList'
import RouletteEvent from './pages/Event/RouletteEvent'
import OxQuizEvent from './pages/Event/OxQuizEvent'
import CardGame from './pages/Event/CardGame'

// Support
import FAQ from './pages/Support/FAQ'
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
import NoticeManage from './pages/Admin/NoticeManage'
import ReviewManage from './pages/Admin/ReviewManage'
import AdminErrorContent from './pages/Admin/AdminErrorContent'

// NotFound
import NotFound from './pages/NotFound/NotFound'


const ADULT_VERIFIED_KEY =
  'jajak_adult_verified'


const App = () => {
  const location =
    useLocation()

  const [
    isAdultVerified,
    setIsAdultVerified,
  ] = useState(() => {
    return (
      sessionStorage.getItem(
        ADULT_VERIFIED_KEY
      ) === 'true'
    )
  })


  // ========================================
  // 성인 확인 완료
  // ========================================

  const handleAdultVerify = () => {
    sessionStorage.setItem(
      ADULT_VERIFIED_KEY,
      'true'
    )

    setIsAdultVerified(true)
  }


  // ========================================
  // 스플래시 / 관리자 페이지에서는
  // 성인 확인 팝업을 띄우지 않음
  // ========================================

  const shouldShowAdultModal =
    !isAdultVerified &&
    location.pathname !==
      '/intro' &&
    !location.pathname.startsWith(
      '/admin'
    )


  return (
    <>
      {/* 페이지 이동 시 항상 스크롤 맨 위로 */}

      <ScrollToTop />


      <Routes>

        {/* ========================================
            독립 페이지
            Header / Footer 없이 사용
        ======================================== */}

        {/* Splash */}

        <Route
          path="/intro"
          element={
            <SplashIntro />
          }
        />


        {/* ========================================
            회원가입 후 취향 등록
            Header / Footer 없이 사용
        ======================================== */}

        <Route
          path="/preference"
          element={
            <PreferenceSurvey />
          }
        />

        <Route
          path="/preference/questions"
          element={
            <PreferenceQuestions />
          }
        />


        {/* ========================================
            Header O / Footer X
            로그인 / 회원가입 / 취향 안전 확인
            / AI 추천
        ======================================== */}

        <Route
          element={
            <SiteLayout
              hideFooter
            />
          }
        >

          {/* ========================================
              Auth
          ======================================== */}

          {/* 로그인 */}

          <Route
            path="/login"
            element={
              <Login />
            }
          />


          {/* 회원가입 */}

          <Route
            path="/signup"
            element={
              <Signup />
            }
          />


          {/* ========================================
              취향 등록 후 안전 확인 흐름
          ======================================== */}

          {/* 취향 질문 완료 → 안전 확인 안내 */}

          <Route
            path="/preference/safety-intro"
            element={
              <PreferenceSafetyIntro />
            }
          />


          {/* 알레르기 / 피해야 할 재료 선택 */}

          <Route
            path="/preference/safety"
            element={
              <PreferenceSafety />
            }
          />


          {/* 최종 취향 등록 완료 */}

          <Route
            path="/preference/complete"
            element={
              <PreferenceComplete />
            }
          />


          {/* ========================================
              AI 추천
              Header O / Footer X
          ======================================== */}

          {/* AI 추천 인트로 */}

          <Route
            path="/ai"
            element={
              <AiIntro />
            }
          />


          {/* AI 추천 설문 */}

          <Route
            path="/ai/survey"
            element={
              <AiSurvey />
            }
          />


          {/* AI 추천 결과 */}

          <Route
            path="/ai/result"
            element={
              <AiResult />
            }
          />


          {/* 내 취향 분석 */}

          <Route
            path="/ai/preference"
            element={
              <AiPreference />
            }
          />

        </Route>


        {/* ========================================
            일반 사용자 페이지
            Header / Footer / MobileBottomNav 적용
        ======================================== */}

        <Route
          element={
            <SiteLayout />
          }
        >

          {/* Main */}

          <Route
            path="/"
            element={
              <MainPage />
            }
          />


          {/* ========================================
              Brand
          ======================================== */}

          <Route
            path="/brand"
            element={
              <BrandIntro />
            }
          />

          <Route
            path="/brand/makdong"
            element={
              <MakdongIntro />
            }
          />


          {/* 기존 Header 링크 대응 */}

          <Route
            path="/brand/story"
            element={
              <Navigate
                to="/brand/makdong"
                replace
              />
            }
          />


          {/* ========================================
              Shop
          ======================================== */}

          <Route
            path="/shop"
            element={
              <ProductList />
            }
          />

          <Route
            path="/shop/:productId"
            element={
              <ProductDetail />
            }
          />


          {/* ========================================
              Cart / Order
          ======================================== */}

          <Route
            path="/cart"
            element={
              <Cart />
            }
          />

          <Route
            path="/checkout"
            element={
              <Checkout />
            }
          />

          <Route
            path="/order-complete"
            element={
              <OrderComplete />
            }
          />


          {/* ========================================
              Event
          ======================================== */}

          {/* 이벤트 목록 */}

          <Route
            path="/events"
            element={
              <EventList />
            }
          />


          {/* 룰렛 이벤트 */}

          <Route
            path="/events/roulette"
            element={
              <RouletteEvent />
            }
          />


          {/* OX 퀴즈 이벤트 */}

          <Route
            path="/events/ox-quiz"
            element={
              <OxQuizEvent />
            }
          />


          {/* 카드 게임 이벤트 */}

          <Route
            path="/events/card-game"
            element={
              <CardGame />
            }
          />


          {/* ========================================
              Support
          ======================================== */}

          {/* 자주 묻는 질문 */}

          <Route
            path="/faq"
            element={
              <FAQ />
            }
          />


          {/* 1:1 질문하기 */}

          <Route
            path="/inquiry"
            element={
              <InquiryQnA />
            }
          />


          {/* 공지사항 목록 */}

          <Route
            path="/notices"
            element={
              <NoticeList />
            }
          />


          {/* 공지사항 상세 */}

          <Route
            path="/notices/:noticeId"
            element={
              <NoticeDetail />
            }
          />


          {/* ========================================
              MyPage
          ======================================== */}

          <Route
            path="/mypage"
            element={
              <MyPageLayout />
            }
          >

            <Route
              index
              element={
                <MyHome />
              }
            />

            <Route
              path="profile"
              element={
                <ProfileEdit />
              }
            />

            <Route
              path="orders"
              element={
                <OrderHistory />
              }
            />

            <Route
              path="orders/:orderId"
              element={
                <OrderDetail />
              }
            />

            <Route
              path="wishlist"
              element={
                <WishList />
              }
            />

            <Route
              path="ai-history"
              element={
                <AiHistory />
              }
            />

            <Route
              path="events"
              element={
                <EventHistory />
              }
            />

            <Route
              path="error"
              element={
                <MyPageErrorContent />
              }
            />

          </Route>


          {/* ========================================
              404
          ======================================== */}

          <Route
            path="*"
            element={
              <NotFound />
            }
          />

        </Route>


        {/* ========================================
            관리자 페이지
            일반 Header / Footer 사용하지 않음
        ======================================== */}

        <Route
          path="/admin"
          element={
            <AdminLayout />
          }
        >

          {/* 관리자 대시보드 */}

          <Route
            index
            element={
              <Dashboard />
            }
          />


          {/* 회원 관리 */}

          <Route
            path="users"
            element={
              <UserManage />
            }
          />


          {/* 상품 관리 */}

          <Route
            path="products"
            element={
              <ProductManage />
            }
          />


          {/* 이벤트 관리 */}

          <Route
            path="events"
            element={
              <EventManage />
            }
          />


          {/* AI 추천 기록 */}

          <Route
            path="ai-logs"
            element={
              <AiLogManage />
            }
          />


          {/* 공지사항 관리 */}

          <Route
            path="notices"
            element={
              <NoticeManage />
            }
          />


          {/* 리뷰 관리 */}

          <Route
            path="reviews"
            element={
              <ReviewManage />
            }
          />


          {/* 관리자 에러 */}

          <Route
            path="error"
            element={
              <AdminErrorContent />
            }
          />

        </Route>

      </Routes>


      {/* ========================================
          전역 성인 확인 팝업
          Splash / Admin 제외
      ======================================== */}

      <AdultModal
        isOpen={ shouldShowAdultModal}
        onVerify={
          handleAdultVerify
        }
      />
    </>
  )
}


export default App