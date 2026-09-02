import { useEffect, useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { Link } from 'react-router-dom'
import { getOrderStatusLabel, ORDER_STATUS } from '../../constants/orderStatus'
import { subscribeToAuthState, getCurrentUserData } from '../../firebase/auth'
import { db } from '../../firebase/firebase'
import orderHistoryMakdong from '../../assets/images/mypage/orderHistory-makdong-wave.png'
import profileAvatarMakdongDefault from '../../assets/images/mypage/profileAvatar-makdong-default.png'
import profileAvatarMakdongCheers from '../../assets/images/mypage/profileAvatar-makdong-cheers.png'
import profileAvatarMakdongJeon from '../../assets/images/mypage/profileAvatar-makdong-jeon.png'
import profileAvatarMakdongPouch from '../../assets/images/mypage/profileAvatar-makdong-pouch.png'
import profileAvatarMakdongTipsy from '../../assets/images/mypage/profileAvatar-makdong-tipsy.png'
import profileAvatarMakdongSleepy from '../../assets/images/mypage/profileAvatar-makdong-sleepy.png'
import profileAvatarMakdongServing from '../../assets/images/mypage/profileAvatar-makdong-serving.png'
import profileAvatarMakdongRainy from '../../assets/images/mypage/profileAvatar-makdong-rainy.png'
import styles from './OrderHistory.module.scss'

const ORDERS_PER_PAGE = 3
const POINT_PROGRESS_MAX = 10000

const avatarPresets = [
  ['profile-makdong-default', profileAvatarMakdongDefault],
  ['profile-makdong-cheers', profileAvatarMakdongCheers],
  ['profile-makdong-jeon', profileAvatarMakdongJeon],
  ['profile-makdong-pouch', profileAvatarMakdongPouch],
  ['profile-makdong-tipsy', profileAvatarMakdongTipsy],
  ['profile-makdong-sleepy', profileAvatarMakdongSleepy],
  ['profile-makdong-serving', profileAvatarMakdongServing],
  ['profile-makdong-rainy', profileAvatarMakdongRainy],
]

const getAvatarStorageKey = (uid) => 'jajak_profile_avatar_' + uid

const filterItems = [
  { label: '전체', value: 'all' },
  { label: '배송 중', value: 'shipping' },
  { label: '배송 완료', value: 'completed' },
  { label: '주문 취소', value: 'claim' },
]

const summaryStats = [
  { type: 'order', label: '전체 주문', value: 'all', caption: '누적 주문 건수' },
  { type: 'shipping', label: '배송 진행', value: 'shipping', caption: '결제·준비·배송 중' },
  { type: 'completed', label: '배송 완료', value: 'completed', caption: '배송이 완료된 주문' },
  { type: 'cancelled', label: '주문 취소', value: 'claim', caption: '취소 처리된 주문' },
]


const SummaryIcon = ({ type }) => {
  if (type === 'order') {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M14 17h20v22H14z" />
        <path d="M19 17V9h10v8" />
      </svg>
    )
  }

  if (type === 'shipping') {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M7 14h23v20H7zM30 21h6l5 6v7H30z" />
        <path d="M13 38a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM35 38a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
      </svg>
    )
  }

  if (type === 'completed') {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <circle cx="24" cy="24" r="17" />
        <path d="m15 24 6 6 12-13" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <circle cx="24" cy="24" r="17" />
      <path d="m18 18 12 12M30 18 18 30" />
    </svg>
  )
}

const OrderHistory = () => {
  const [orders, setOrders] = useState([])
  const [firebaseUser, setFirebaseUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [activeFilter, setActiveFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [periodMonths, setPeriodMonths] = useState('all')
  const [sortOrder, setSortOrder] = useState('latest')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    let isActive = true

    const unsubscribe = subscribeToAuthState(async (user) => {
      if (isActive) setFirebaseUser(user)

      if (!user) {
        if (isActive) {
          setUserData(null)
          setOrders([])
          setLoadError('로그인 후 주문 내역을 확인할 수 있습니다.')
          setIsLoading(false)
        }
        return
      }

      setIsLoading(true)
      setLoadError('')

      try {
        const memberData = await getCurrentUserData(user.uid)
        if (isActive) setUserData(memberData)
      } catch (error) {
        console.error('회원정보 조회 실패:', error)
        if (isActive) setUserData(null)
      }

      try {
        const ordersQuery = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid),
        )
        const snapshot = await getDocs(ordersQuery)
        const nextOrders = snapshot.docs.map((orderDocument) => {
          const data = orderDocument.data()
          const createdDate = data.createdAt?.toDate?.() || new Date(data.createdAt || 0)
          const createdAtMs = Number.isNaN(createdDate.getTime()) ? 0 : createdDate.getTime()
          const filterGroup = data.status === ORDER_STATUS.DELIVERED
            ? 'completed'
            : data.status === ORDER_STATUS.CANCELLED
              ? 'claim'
              : 'shipping'
          const statusTone = data.status === ORDER_STATUS.SHIPPED
            ? 'shipping'
            : data.status === ORDER_STATUS.DELIVERED
              ? 'completed'
              : data.status === ORDER_STATUS.CANCELLED
                ? 'cancelled'
                : 'preparing'

          return {
            id: orderDocument.id,
            createdAt: createdAtMs
              ? new Date(createdAtMs).toISOString().slice(0, 10)
              : '-',
            createdAtMs,
            status: data.status,
            statusTone,
            statusLabel: getOrderStatusLabel(data.status),
            filterGroup,
            items: Array.isArray(data.items)
              ? data.items.map((item) => ({
                  ...item,
                  name: item.productName || item.name || '상품',
                }))
              : [],
            totalPrice: Number(data.totalAmount || 0),
          }
        })

        if (isActive) setOrders(nextOrders)
      } catch (error) {
        console.error('주문 내역 조회 실패:', error)
        if (isActive) {
          setOrders([])
          setLoadError('주문 내역을 불러오지 못했습니다.')
        }
      } finally {
        if (isActive) setIsLoading(false)
      }
    })

    return () => {
      isActive = false
      unsubscribe()
    }
  }, [loadAttempt])

  const filteredOrders = orders.filter((order) => {
    const matchesStatus = activeFilter === 'all' || order.filterGroup === activeFilter
    const normalizedSearchTerm = searchTerm.trim().toLocaleLowerCase('ko-KR')
    const matchesSearch = !normalizedSearchTerm || [
      order.id,
      ...order.items.map((item) => item.name),
    ].some((value) => String(value).toLocaleLowerCase('ko-KR').includes(normalizedSearchTerm))

    if (!matchesStatus || !matchesSearch) return false
    if (periodMonths === 'all') return true

    const periodStart = new Date()
    periodStart.setHours(0, 0, 0, 0)
    periodStart.setMonth(periodStart.getMonth() - Number(periodMonths))
    return order.createdAtMs >= periodStart.getTime()
  })

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const aDate = a.createdAtMs
    const bDate = b.createdAtMs
    return sortOrder === 'latest' ? bDate - aDate : aDate - bDate
  })

  const totalPages = Math.ceil(sortedOrders.length / ORDERS_PER_PAGE)
  const startIndex = (currentPage - 1) * ORDERS_PER_PAGE
  const visibleOrders = sortedOrders.slice(startIndex, startIndex + ORDERS_PER_PAGE)

  const handleFilterChange = (value) => {
    setActiveFilter(value)
    setCurrentPage(1)
  }

  const handleSortChange = (event) => {
    setSortOrder(event.target.value)
    setCurrentPage(1)
  }

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value)
    setCurrentPage(1)
  }

  const handlePeriodChange = (event) => {
    setPeriodMonths(event.target.value)
    setCurrentPage(1)
  }

  const handleResetFilters = () => {
    setActiveFilter('all')
    setSearchTerm('')
    setPeriodMonths('all')
    setSortOrder('latest')
    setCurrentPage(1)
  }

  const getProductTitle = (items) => {
    if (items.length <= 1) return items[0]?.name || ''
    return `${items[0].name} 외 ${items.length - 1}개`
  }

  const getOrderNumber = (orderId) => (
    orderId.length > 18 ? `${orderId.slice(0, 15)}…` : orderId
  )

  const displaySummaryStats = summaryStats.map((stat) => ({
    ...stat,
    count: stat.value === 'all'
      ? orders.length
      : orders.filter((order) => order.filterGroup === stat.value).length,
  }))

  const memberName =
    userData?.nickname ||
    firebaseUser?.displayName ||
    firebaseUser?.email?.split('@')[0] ||
    '회원'
  const memberLabel = firebaseUser
    ? userData?.role === 'admin'
      ? '관리자'
      : '일반 회원'
    : '-'
  const points = firebaseUser ? Number(userData?.points ?? 0) : 0
  const savedAvatarId = firebaseUser ? localStorage.getItem(getAvatarStorageKey(firebaseUser.uid)) : ''
  const avatarSrc = avatarPresets.find(([id]) => id === savedAvatarId)?.[1] || profileAvatarMakdongDefault
  const pointProgress = Math.min(Math.max(points, 0), POINT_PROGRESS_MAX)

  return (
    <section className={styles.page} aria-labelledby="order-history-title">
      <h2 id="order-history-title" className={styles.srOnly}>주문 내역</h2>

      <section className={styles.summaryBanner} aria-label="마이페이지 이용 요약">
        <div className={styles.memberSummary}>
          <div className={styles.avatar} aria-hidden="true">
            <img src={avatarSrc} alt="" />
          </div>

          <div className={styles.memberCopy}>
            <p className={styles.greeting}>안녕하세요,</p>
            <strong className={styles.memberName}>{memberName} <span>님</span></strong>

            <div className={styles.memberMeta}>
              <span className={styles.memberBadge}>{memberLabel}</span>
              <span>보유 포인트</span>
              <strong>{points.toLocaleString('ko-KR')}P</strong>
            </div>
          </div>

          <div className={styles.progressArea}>
            <progress className={styles.progressTrack} value={pointProgress} max={POINT_PROGRESS_MAX} aria-label={'보유 포인트 ' + points + 'P'} />
            <span className={styles.progressText}>
              {points.toLocaleString('ko-KR')}P
              <small>/ 10,000P</small>
            </span>
          </div>

          <p className={styles.summaryMessage}>
            오늘도 자작과 함께<br />
            나만의 시간을 즐겨보세요.
          </p>
        </div>

        <div className={styles.stats}>
          {displaySummaryStats.map((stat) => (
            <div key={stat.label} className={styles.statItem}>
              <div className={styles.statIcon}>
                <SummaryIcon type={stat.type} />
              </div>
              <p className={styles.statLabel}>{stat.label}</p>
              <p className={styles.statValue}>
                <strong>{stat.count}</strong>
                <span>건</span>
              </p>
              <p className={styles.statCaption}>{stat.caption}</p>
            </div>
          ))}
        </div>

        <div className={styles.mascotPlaceholder} aria-hidden="true">
          <img className={styles.mascotImage} src={orderHistoryMakdong} alt="" />
        </div>
      </section>

      <div className={styles.controls}>
        <div className={styles.filters} role="tablist" aria-label="주문 상태 필터">
          {filterItems.map((filter) => (
            <button
              key={filter.value}
              type="button"
              role="tab"
              aria-selected={activeFilter === filter.value}
              className={`${styles.filterButton} ${activeFilter === filter.value ? styles.activeFilter : ''}`}
              onClick={() => handleFilterChange(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className={styles.orderTools}>
          <label className={styles.searchBox}>
            <span className={styles.srOnly}>주문번호 또는 상품명 검색</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m16 16 5 5" />
            </svg>
            <input
              type="search"
              value={searchTerm}
              placeholder="주문번호·상품명 검색"
              onChange={handleSearchChange}
            />
          </label>

          <label className={`${styles.selectBox} ${styles.periodBox}`}>
            <span className={styles.srOnly}>주문 조회 기간</span>
            <select value={periodMonths} onChange={handlePeriodChange}>
              <option value="all">전체 기간</option>
              <option value="3">최근 3개월</option>
              <option value="6">최근 6개월</option>
              <option value="12">최근 1년</option>
            </select>
            <span className={styles.sortArrow} aria-hidden="true" />
          </label>

          <label className={`${styles.selectBox} ${styles.sortBox}`}>
            <span className={styles.srOnly}>주문 정렬</span>
            <select value={sortOrder} onChange={handleSortChange}>
              <option value="latest">최신순</option>
              <option value="oldest">오래된순</option>
            </select>
            <span className={styles.sortArrow} aria-hidden="true" />
          </label>
        </div>
      </div>

      {isLoading ? (
        <div className={styles.feedbackState} role="status">
          <span className={styles.loadingSpinner} aria-hidden="true" />
          <strong>주문 내역을 불러오고 있습니다.</strong>
          <p>잠시만 기다려 주세요.</p>
        </div>
      ) : loadError ? (
        <div className={styles.feedbackState} role="alert">
          <strong>{loadError}</strong>
          {firebaseUser && (
            <button type="button" onClick={() => setLoadAttempt((attempt) => attempt + 1)}>
              다시 불러오기
            </button>
          )}
        </div>
      ) : visibleOrders.length > 0 ? (
        <div className={styles.orderList}>
          {visibleOrders.map((order) => (
            <article key={order.id} className={styles.orderItem}>
              <div className={styles.orderMeta}>
                <div className={styles.metaPrimary}>
                  <span>{order.createdAt.replaceAll('-', '.')} 주문</span>
                  <span className={styles.metaDivider} aria-hidden="true">|</span>
                  <span className={styles.orderNumber} title={`주문번호 ${order.id}`}>
                    주문번호 {getOrderNumber(order.id)}
                  </span>
                </div>
                <span className={`${styles.statusBadge} ${styles[order.statusTone]}`}>
                  {order.statusLabel}
                </span>
              </div>

              <div className={styles.orderBody}>
                <div className={styles.productImage}>
                  {order.items[0]?.imageUrl ? (
                    <img src={order.items[0].imageUrl} alt={order.items[0].name} />
                  ) : (
                    <span>IMG</span>
                  )}
                </div>

                <div className={styles.productInfo}>
                  <strong className={styles.productName} title={getProductTitle(order.items)}>
                    {getProductTitle(order.items) || '상품 정보를 확인할 수 없습니다.'}
                  </strong>
                  <p className={styles.productPrice}>
                    <span>결제 금액</span>
                    {order.totalPrice.toLocaleString('ko-KR')}원
                  </p>
                </div>

                <Link className={styles.detailButton} to={order.id}>
                  주문 상세
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <section className={styles.emptyState} aria-label="빈 주문 내역">
          <div className={styles.emptyIcon} aria-hidden="true">
            <svg viewBox="0 0 64 64">
              <path d="M16 22h32v29H16z" />
              <path d="M23 22v-7h18v7" />
              <path d="M24 34h16M24 41h11" />
            </svg>
          </div>
          <h3>{orders.length > 0 ? '조건에 맞는 주문이 없습니다.' : '주문 내역이 없습니다.'}</h3>
          <p>
            {orders.length > 0
              ? '검색어나 조회 조건을 변경해 보세요.'
              : '자작의 다양한 상품을 만나보세요.'}
          </p>
          {orders.length > 0 ? (
            <button className={styles.emptyButton} type="button" onClick={handleResetFilters}>
              조회 조건 초기화
            </button>
          ) : (
            <Link className={styles.emptyButton} to="/shop">상품 보러가기</Link>
          )}
        </section>
      )}

      {totalPages > 1 && (
        <nav className={styles.pagination} aria-label="주문 내역 페이지">
          <button
            type="button"
            className={styles.pageArrow}
            aria-label="이전 페이지"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
          >
            ‹
          </button>

          {Array.from({ length: totalPages }, (_, index) => {
            const pageNumber = index + 1
            const isActive = currentPage === pageNumber

            return (
              <button
                key={pageNumber}
                type="button"
                className={`${styles.pageButton} ${isActive ? styles.activePage : ''}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setCurrentPage(pageNumber)}
              >
                {pageNumber}
              </button>
            )
          })}

          <button
            type="button"
            className={styles.pageArrow}
            aria-label="다음 페이지"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
          >
            ›
          </button>
        </nav>
      )}
    </section>
  )
}

export default OrderHistory
