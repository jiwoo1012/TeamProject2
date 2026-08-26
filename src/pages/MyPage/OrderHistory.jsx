import { useEffect, useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { Link } from 'react-router-dom'
import { getOrderStatusLabel, ORDER_STATUS } from '../../constants/orderStatus'
import { subscribeToAuthState, getCurrentUserData } from '../../firebase/auth'
import { db } from '../../firebase/firebase'
import makdongPose from '../../assets/characters/M007_Poses03.png'
import styles from './OrderHistory.module.scss'

const ORDERS_PER_PAGE = 3

const filterItems = [
  { label: '전체', value: 'all' },
  { label: '배송 중', value: 'shipping' },
  { label: '배송 완료', value: 'completed' },
  { label: '취소 / 교환 / 반품', value: 'claim' },
]

const summaryStats = [
  { type: 'order', label: '주문 내역', value: 0, unit: '건', caption: '이번 달 기준' },
  { type: 'wish', label: '찜 목록', value: 0, unit: '개', caption: '이번 달 기준' },
  { type: 'ai', label: 'AI 추천 기록', value: 0, unit: '회', caption: '최근 이용 기준' },
  { type: 'event', label: '이벤트 참여', value: 0, unit: '회', caption: '당첨 및 참여' },
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

  if (type === 'wish') {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M24 39S7 29 7 17.5C7 12.3 10.8 9 15.3 9c3.8 0 6.4 2.2 8.7 5 2.3-2.8 4.9-5 8.7-5C37.2 9 41 12.3 41 17.5 41 29 24 39 24 39Z" />
      </svg>
    )
  }

  if (type === 'ai') {
    return (
      <svg viewBox="0 0 48 48" aria-hidden="true">
        <path d="M24 7c1.7 8.2 6.1 12.6 14.3 14.3C30.1 23 25.7 27.4 24 35.6 22.3 27.4 17.9 23 9.7 21.3 17.9 19.6 22.3 15.2 24 7Z" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 48 48" aria-hidden="true">
      <path d="M9 13h30v22H9z" />
      <path d="M15 13v22M33 13v22" strokeDasharray="2 4" />
    </svg>
  )
}

const OrderHistory = () => {
  const [orders, setOrders] = useState([])
  const [firebaseUser, setFirebaseUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
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
  }, [])

  const filteredOrders = orders.filter((order) => {
    if (activeFilter === 'all') return true
    return order.filterGroup === activeFilter
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

  const getProductTitle = (items) => {
    if (items.length <= 1) return items[0]?.name || ''
    return `${items[0].name} 외 ${items.length - 1}개`
  }

  const displaySummaryStats = summaryStats.map((stat) =>
    stat.type === 'order' ? { ...stat, value: orders.length } : stat,
  )

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

  return (
    <section className={styles.page} aria-labelledby="order-history-title">
      <h2 id="order-history-title" className={styles.srOnly}>주문 내역</h2>

      <section className={styles.summaryBanner} aria-label="마이페이지 이용 요약">
        <div className={styles.memberSummary}>
          <div className={styles.avatar} aria-hidden="true">
            <svg viewBox="0 0 64 64">
              <circle cx="32" cy="23" r="11" />
              <path d="M13 55c1-12 9-19 19-19s18 7 19 19" />
            </svg>
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
            <div className={styles.progressTrack} aria-label="보유 포인트">
              <span className={styles.progressValue} style={{ width: '0%' }} />
            </div>
            <span className={styles.progressText}>{points.toLocaleString('ko-KR')}P</span>
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
                <strong>{stat.value}</strong>
                <span>{stat.unit}</span>
              </p>
              <p className={styles.statCaption}>{stat.caption}</p>
            </div>
          ))}
        </div>

        <div className={styles.mascotPlaceholder} aria-hidden="true">
          <img className={styles.mascotImage} src={makdongPose} alt="" />
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

        <label className={styles.sortBox}>
          <span className={styles.srOnly}>주문 정렬</span>
          <select value={sortOrder} onChange={handleSortChange}>
            <option value="latest">최신순</option>
            <option value="oldest">오래된순</option>
          </select>
          <span className={styles.sortArrow} aria-hidden="true" />
        </label>
      </div>

      {isLoading ? (
        <p role="status">주문 내역을 불러오는 중입니다.</p>
      ) : loadError ? (
        <p role="alert">{loadError}</p>
      ) : visibleOrders.length > 0 ? (
        <div className={styles.orderList}>
          {visibleOrders.map((order) => (
            <article key={order.id} className={styles.orderItem}>
              <div className={styles.orderMeta}>
                <span>주문번호 {order.id}</span>
                <span className={styles.metaDivider} aria-hidden="true">|</span>
                <span>{order.createdAt.replaceAll('-', '.')} 주문</span>
                <span className={`${styles.statusBadge} ${styles[order.statusTone]}`}>
                  {order.statusLabel}
                </span>
              </div>

              <div className={styles.orderBody}>
                <div className={styles.productImage}>
                  {order.items[0].imageUrl ? (
                    <img src={order.items[0].imageUrl} alt={order.items[0].name} />
                  ) : (
                    <span>IMG</span>
                  )}
                </div>

                <div className={styles.productInfo}>
                  <strong className={styles.productName}>{getProductTitle(order.items)}</strong>
                  <p className={styles.productPrice}>{order.totalPrice.toLocaleString('ko-KR')}원</p>
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
          <h3>주문 내역이 없습니다.</h3>
          <p>자작의 다양한 상품을 만나보세요.</p>
          <Link className={styles.emptyButton} to="/shop">상품 보러가기</Link>
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
