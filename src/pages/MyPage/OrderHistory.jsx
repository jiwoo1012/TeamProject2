import { useState } from 'react'
import { Link } from 'react-router-dom'
import styles from './OrderHistory.module.scss'

const ORDERS_PER_PAGE = 3

const filterItems = [
  { label: '전체', value: 'all' },
  { label: '배송 중', value: 'shipping' },
  { label: '배송 완료', value: 'completed' },
  { label: '취소 / 교환 / 반품', value: 'claim' },
]

const summaryStats = [
  { type: 'order', label: '주문 내역', value: 12, unit: '건', caption: '이번 달 기준' },
  { type: 'wish', label: '찜 목록', value: 8, unit: '개', caption: '이번 달 기준' },
  { type: 'ai', label: 'AI 추천 기록', value: 3, unit: '회', caption: '최근 이용 기준' },
  { type: 'event', label: '이벤트 참여', value: 3, unit: '회', caption: '당첨 및 참여' },
]

const mockOrders = [
  {
    id: '20250501-0001',
    createdAt: '2025-05-01',
    status: 'preparing',
    statusLabel: '상품 준비 중',
    filterGroup: 'shipping',
    items: [
      { name: '자작 막걸리 여유 12도', price: 18000, imageUrl: '' },
      { name: '달빛 약주', price: 22000, imageUrl: '' },
      { name: '한지 술잔 세트', price: 16000, imageUrl: '' },
    ],
    totalPrice: 18000,
  },
  {
    id: '20250428-0002',
    createdAt: '2025-04-28',
    status: 'completed',
    statusLabel: '배송 완료',
    filterGroup: 'completed',
    items: [{ name: '자작 막걸리 여유 12도', price: 18000, imageUrl: '' }],
    totalPrice: 18000,
  },
  {
    id: '20250420-0003',
    createdAt: '2025-04-20',
    status: 'completed',
    statusLabel: '배송 완료',
    filterGroup: 'completed',
    items: [{ name: '자작 막걸리 여유 12도', price: 18000, imageUrl: '' }],
    totalPrice: 18000,
  },
  {
    id: '20250418-0004',
    createdAt: '2025-04-18',
    status: 'shipping',
    statusLabel: '배송 중',
    filterGroup: 'shipping',
    items: [{ name: '밤의 결 증류주', price: 29000, imageUrl: '' }],
    totalPrice: 29000,
  },
  {
    id: '20250411-0005',
    createdAt: '2025-04-11',
    status: 'cancelled',
    statusLabel: '주문 취소',
    filterGroup: 'claim',
    items: [{ name: '낮의 결 청주', price: 24000, imageUrl: '' }],
    totalPrice: 24000,
  },
  {
    id: '20250402-0006',
    createdAt: '2025-04-02',
    status: 'shipping',
    statusLabel: '배송 중',
    filterGroup: 'shipping',
    items: [{ name: '자작 전통주 선물 세트', price: 42000, imageUrl: '' }],
    totalPrice: 42000,
  },
  {
    id: '20250326-0007',
    createdAt: '2025-03-26',
    status: 'returned',
    statusLabel: '반품 완료',
    filterGroup: 'claim',
    items: [{ name: '한지 술잔 세트', price: 16000, imageUrl: '' }],
    totalPrice: 16000,
  },
  {
    id: '20250315-0008',
    createdAt: '2025-03-15',
    status: 'completed',
    statusLabel: '배송 완료',
    filterGroup: 'completed',
    items: [{ name: '달빛 약주', price: 22000, imageUrl: '' }],
    totalPrice: 22000,
  },
  {
    id: '20250308-0009',
    createdAt: '2025-03-08',
    status: 'shipping',
    statusLabel: '배송 중',
    filterGroup: 'shipping',
    items: [{ name: '자작 막걸리 여유 12도', price: 18000, imageUrl: '' }],
    totalPrice: 18000,
  },
  {
    id: '20250227-0010',
    createdAt: '2025-02-27',
    status: 'completed',
    statusLabel: '배송 완료',
    filterGroup: 'completed',
    items: [{ name: '한지 술잔 세트', price: 16000, imageUrl: '' }],
    totalPrice: 16000,
  },
  {
    id: '20250218-0011',
    createdAt: '2025-02-18',
    status: 'exchanged',
    statusLabel: '교환 완료',
    filterGroup: 'claim',
    items: [{ name: '낮의 결 청주', price: 24000, imageUrl: '' }],
    totalPrice: 24000,
  },
  {
    id: '20250209-0012',
    createdAt: '2025-02-09',
    status: 'completed',
    statusLabel: '배송 완료',
    filterGroup: 'completed',
    items: [{ name: '밤의 결 증류주', price: 29000, imageUrl: '' }],
    totalPrice: 29000,
  },
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
  const [activeFilter, setActiveFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('latest')
  const [currentPage, setCurrentPage] = useState(1)

  const filteredOrders = mockOrders.filter((order) => {
    if (activeFilter === 'all') return true
    return order.filterGroup === activeFilter
  })

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const aDate = new Date(a.createdAt).getTime()
    const bDate = new Date(b.createdAt).getTime()
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
            <strong className={styles.memberName}>홍길동 <span>님</span></strong>

            <div className={styles.memberMeta}>
              <span className={styles.memberBadge}>일반 회원</span>
              <span>다음 등급까지</span>
              <strong>1,200P</strong>
            </div>
          </div>

          <div className={styles.progressArea}>
            <div className={styles.progressTrack} aria-label="등급 진행도">
              <span className={styles.progressValue} />
            </div>
            <span className={styles.progressText}>1,200P / 3,000P</span>
          </div>

          <p className={styles.summaryMessage}>
            오늘도 자작과 함께<br />
            나만의 시간을 즐겨보세요.
          </p>
        </div>

        <div className={styles.stats}>
          {summaryStats.map((stat) => (
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
          <span>🦝</span>
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

      {visibleOrders.length > 0 ? (
        <div className={styles.orderList}>
          {visibleOrders.map((order) => (
            <article key={order.id} className={styles.orderItem}>
              <div className={styles.orderMeta}>
                <span>주문번호 {order.id}</span>
                <span className={styles.metaDivider} aria-hidden="true">|</span>
                <span>{order.createdAt.replaceAll('-', '.')} 주문</span>
                <span className={`${styles.statusBadge} ${styles[order.status]}`}>
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
