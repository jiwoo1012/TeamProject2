import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  getCollection,
  updateDocument,
} from '../../firebase/firestore'
import {
  ORDER_STATUS,
  getOrderStatusLabel,
} from '../../constants/orderStatus'

import adminTopOrnament from '../../assets/images/admin/adminTopOrnament.svg'

import styles from './OrdersManage.module.scss'


const quickFilters = [
  '전체',
  '결제 완료',
  '배송 준비',
  '배송 중',
  '배송 완료',
  '취소 / 환불',
]


const deliverySteps = [
  '주문 접수',
  '결제 완료',
  '배송 준비',
  '배송 중',
  '배송 완료',
]


const formatPrice = (price) =>
  `${Number(price).toLocaleString('ko-KR')}원`


const formatOrderId = (orderId = '') => (
  orderId.length > 3
    ? `${orderId.slice(0, 3)}…`
    : orderId
)


const todayOrderDate = new Intl.DateTimeFormat(
  'ko-CA'
).format(new Date()).replaceAll('-', '.')


const getTimestampDate = (value) => {
  const date = value?.toDate?.() || new Date(value || 0)

  return Number.isNaN(date.getTime())
    ? null
    : date
}


const getPaymentMethodLabel = (method) => ({
  card: '신용카드',
  bank: '무통장 입금',
  kakao: '카카오페이',
}[method] || method || '-')


const getDeliveryLabel = (status) => ({
  [ORDER_STATUS.PAID]: '결제 완료',
  [ORDER_STATUS.PREPARING]: '배송 준비',
  [ORDER_STATUS.SHIPPED]: '배송 중',
  [ORDER_STATUS.DELIVERED]: '배송 완료',
  [ORDER_STATUS.CANCELLED]: '주문 취소',
}[status] || getOrderStatusLabel(status))


const normalizeOrder = (document, member) => {
  const createdDate = getTimestampDate(document.createdAt)
  const updatedDate = getTimestampDate(document.updatedAt)
  const shipping = document.shipping || {}
  const items = Array.isArray(document.items)
    ? document.items.map((item) => ({
        name: item.productName || item.name || '상품',
        option: item.option || '기본',
        price: Number(item.price || 0),
        quantity: Number(item.quantity || 1),
        imageUrl: item.imageUrl || '',
      }))
    : []
  const firstItem = items[0]?.name || '주문 상품'
  const product = items.length > 1
    ? `${firstItem} 외 ${items.length - 1}건`
    : firstItem
  const isCancelled = document.status === ORDER_STATUS.CANCELLED

  return {
    id: document.id,
    userId: document.userId || '',
    customer: document.customerName || shipping.recipient || '회원',
    phone: shipping.phone || '-',
    email: member?.email || '-',
    product,
    date: createdDate
      ? new Intl.DateTimeFormat('ko-CA').format(createdDate).replaceAll('-', '.')
      : '-',
    time: createdDate
      ? new Intl.DateTimeFormat('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(createdDate)
      : '-',
    createdAtMs: createdDate?.getTime() || 0,
    updatedTime: updatedDate
      ? new Intl.DateTimeFormat('ko-KR', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }).format(updatedDate)
      : '-',
    amount: Number(document.totalAmount || 0),
    payment: isCancelled ? '취소 완료' : '결제 완료',
    delivery: getDeliveryLabel(document.status),
    status: document.status,
    address: [shipping.address, shipping.detailAddress]
      .filter(Boolean)
      .join(' ') || '-',
    request: shipping.memo || '',
    courier: document.carrier || '',
    trackingNumber: document.trackingNumber || '',
    shipDate: document.expectedDate || '',
    paymentMethod: getPaymentMethodLabel(document.paymentMethod),
    productAmount: Number(document.productAmount || 0),
    shippingFee: Number(document.shippingFee || 0),
    discountAmount: Number(document.discountAmount || 0),
    usedPoints: Number(document.usedPoints || 0),
    items,
  }
}


// ========================================
// 아이콘
// ========================================

const RefreshIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 6v5h-5M4 18v-5h5" />
    <path d="M6.1 9a7 7 0 0 1 11.8-2.2L20 11M4 13l2.1 4.2A7 7 0 0 0 17.9 15" />
  </svg>
)


const SearchIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <circle cx="11" cy="11" r="7" />
    <path d="m16 16 4 4" />
  </svg>
)


const TruckIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 6h11v10H3z" />
    <path d="M14 9h4l3 3v4h-7z" />
    <circle cx="7" cy="18" r="2" />
    <circle cx="18" cy="18" r="2" />
  </svg>
)


const SummaryIcon = ({ type }) => {
  if (type === 'today') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16M8 14h3M8 17h6" />
      </svg>
    )
  }

  if (type === 'ready') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 7.5 12 3l9 4.5v9L12 21l-9-4.5v-9Z" />
        <path d="m3 7.5 9 4.5 9-4.5M12 12v9M8 5l9 4.5" />
      </svg>
    )
  }

  if (type === 'request') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3 21 19H3L12 3Z" />
        <path d="M12 9v4M12 16.5v.5" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5" />
    </svg>
  )
}


const OrdersManage = () => {
  const [orders, setOrders] =
    useState([])

  const [searchQuery, setSearchQuery] =
    useState('')

  const [orderStatus, setOrderStatus] =
    useState('all')

  const [paymentStatus, setPaymentStatus] =
    useState('all')

  const [sortOrder, setSortOrder] =
    useState('latest')

  const [quickFilter, setQuickFilter] =
    useState('전체')

  const [selectedOrderId, setSelectedOrderId] =
    useState(null)

  const [isRefreshing, setIsRefreshing] =
    useState(false)

  const [isLoading, setIsLoading] =
    useState(true)

  const [loadError, setLoadError] =
    useState('')

  const [isSaving, setIsSaving] =
    useState(false)

  const [shippingForm, setShippingForm] =
    useState({
      courier: '',
      trackingNumber: '',
      shipDate: '',
    })

  const [checklist, setChecklist] =
    useState({
      product: true,
      stock: true,
      packaging: false,
      adult: false,
      address: false,
    })


  const selectedOrder =
    orders.find(
      (order) =>
        order.id === selectedOrderId
    ) || null


  const loadOrders = useCallback(async () => {
    setIsLoading(true)
    setLoadError('')

    try {
      const [orderDocuments, members] = await Promise.all([
        getCollection('orders'),
        getCollection('users'),
      ])
      const memberMap = new Map(
        members.map((member) => [member.id, member])
      )

      setOrders(
        orderDocuments.map((order) => (
          normalizeOrder(order, memberMap.get(order.userId))
        ))
      )
    } catch (error) {
      console.error('관리자 주문 목록 조회 실패:', error)
      setOrders([])
      setLoadError('주문 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [])


  useEffect(() => {
    loadOrders()
  }, [loadOrders])


  // ========================================
  // 지표
  // ========================================

  const totalCount = orders.length
  const todayCount = orders.filter(
    (order) => order.date === todayOrderDate
  ).length
  const readyCount = orders.filter(
    (order) => (
      !order.payment.includes('환불')
      && !order.payment.includes('취소')
      && (
        order.delivery === '배송 준비'
        || order.delivery === '결제 완료'
      )
    )
  ).length
  const shippingCount = orders.filter(
    (order) => order.delivery === '배송 중'
  ).length
  const completedCount = orders.filter(
    (order) => order.delivery === '배송 완료'
  ).length
  const requestCount = orders.filter(
    (order) => (
      order.payment.includes('환불')
      || order.payment.includes('취소')
    )
  ).length
  const statusTotal = Math.max(totalCount, 1)
  const readyEnd = (readyCount / statusTotal) * 100
  const shippingEnd = readyEnd + (shippingCount / statusTotal) * 100
  const completedEnd = shippingEnd + (completedCount / statusTotal) * 100
  const recentDates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() - (6 - index))

    return {
      key: new Intl.DateTimeFormat('ko-CA')
        .format(date)
        .replaceAll('-', '.'),
      day: new Intl.DateTimeFormat('ko-KR', {
        month: '2-digit',
        day: '2-digit',
      }).format(date).replace('. ', '/').replace('.', ''),
    }
  })
  const weeklyData = recentDates.map((date) => ({
    ...date,
    order: orders.filter((order) => order.date === date.key).length,
    cancel: orders.filter((order) => (
      order.date === date.key
      && order.status === ORDER_STATUS.CANCELLED
    )).length,
  }))
  const maxWeeklyCount = Math.max(
    1,
    ...weeklyData.flatMap((item) => [item.order, item.cancel])
  )
  const yesterdayCount = weeklyData.at(-2)?.order || 0
  const orderChangeRate = yesterdayCount
    ? ((todayCount - yesterdayCount) / yesterdayCount) * 100
    : todayCount > 0
      ? 100
      : 0


  const summaryCards = [
    {
      key: 'total',
      label: '전체 주문 수',
      value: totalCount,
      unit: '건',
      caption: '현재',
      subCaption: '조회 주문',
    },
    {
      key: 'today',
      label: '오늘 주문',
      value: todayCount,
      unit: '건',
      caption: todayOrderDate.slice(5),
      subCaption: '접수 기준',
    },
    {
      key: 'ready',
      label: '배송 준비',
      value: readyCount,
      unit: '건',
      caption: '출고',
      subCaption: '대기 주문',
    },
    {
      key: 'request',
      label: '취소 / 환불 요청',
      value: requestCount,
      unit: '건',
      caption: '확인',
      subCaption: '필요 주문',
    },
  ]


  // ========================================
  // 주문 필터
  // ========================================

  const filteredOrders = useMemo(() => {
    const keyword =
      searchQuery
        .trim()
        .toLowerCase()

    let result =
      orders.filter((order) => {
        const matchesSearch =
          !keyword ||
          order.id
            .toLowerCase()
            .includes(keyword) ||
          order.customer
            .toLowerCase()
            .includes(keyword) ||
          order.product
            .toLowerCase()
            .includes(keyword)

        const matchesOrderStatus =
          orderStatus === 'all' ||
          order.delivery === orderStatus

        const matchesPaymentStatus =
          paymentStatus === 'all' ||
          order.payment === paymentStatus

        let matchesQuick = true

        if (
          quickFilter ===
          '결제 완료'
        ) {
          matchesQuick =
            order.payment ===
            '결제 완료'
        }

        if (
          quickFilter ===
          '오늘 주문'
        ) {
          matchesQuick =
            order.date ===
            todayOrderDate
        }

        if (
          quickFilter ===
          '배송 준비'
        ) {
          matchesQuick =
            !order.payment.includes('환불')
            && !order.payment.includes('취소')
            && (
              order.delivery === '배송 준비'
              || order.delivery === '결제 완료'
            )
        }

        if (
          quickFilter ===
          '배송 중'
        ) {
          matchesQuick =
            order.delivery ===
            '배송 중'
        }

        if (
          quickFilter ===
          '배송 완료'
        ) {
          matchesQuick =
            order.delivery ===
            '배송 완료'
        }

        if (
          quickFilter ===
          '취소 / 환불'
        ) {
          matchesQuick =
            order.payment.includes('환불')
            || order.payment.includes('취소')
        }

        return (
          matchesSearch &&
          matchesOrderStatus &&
          matchesPaymentStatus &&
          matchesQuick
        )
      })


    result = [...result].sort(
      (a, b) => {
        const aDate =
          `${a.date} ${a.time}`

        const bDate =
          `${b.date} ${b.time}`

        if (
          sortOrder === 'oldest'
        ) {
          return aDate.localeCompare(
            bDate
          )
        }

        if (
          sortOrder === 'high'
        ) {
          return b.amount - a.amount
        }

        if (
          sortOrder === 'low'
        ) {
          return a.amount - b.amount
        }

        return bDate.localeCompare(
          aDate
        )
      }
    )

    return result
  }, [
    orders,
    searchQuery,
    orderStatus,
    paymentStatus,
    sortOrder,
    quickFilter,
  ])


  // ========================================
  // 새로 고침
  // ========================================

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadOrders()
  }


  // ========================================
  // 필터 초기화
  // ========================================

  const resetFilters = () => {
    setSearchQuery('')
    setOrderStatus('all')
    setPaymentStatus('all')
    setSortOrder('latest')
    setQuickFilter('전체')
  }


  const handleSummaryFilter = (key) => {
    const filterByKey = {
      total: '전체',
      today: '오늘 주문',
      ready: '배송 준비',
      request: '취소 / 환불',
    }

    setSearchQuery('')
    setOrderStatus('all')
    setPaymentStatus('all')
    setQuickFilter(filterByKey[key])
  }


  const activeSummaryKey =
    quickFilter === '오늘 주문'
      ? 'today'
      : quickFilter === '배송 준비'
        ? 'ready'
        : quickFilter === '취소 / 환불'
          ? 'request'
          : quickFilter === '전체'
            ? 'total'
            : null


  // ========================================
  // 상세 열기
  // ========================================

  const openOrderDetail = (order) => {
    setSelectedOrderId(order.id)

    setShippingForm({
      courier:
        order.courier || '',
      trackingNumber:
        order.trackingNumber || '',
      shipDate:
        order.shipDate || '',
    })

    setChecklist({
      product: true,
      stock: true,
      packaging:
        order.delivery !==
        '결제 완료',
      adult:
        order.delivery !==
        '결제 완료',
      address:
        order.delivery !==
        '결제 완료',
    })
  }


  const closeOrderDetail = () => {
    setSelectedOrderId(null)
  }


  const handleShippingChange = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target

    setShippingForm((current) => ({
      ...current,
      [name]: value,
    }))
  }


  const toggleChecklist = (
    key
  ) => {
    setChecklist((current) => ({
      ...current,
      [key]: !current[key],
    }))
  }


  // ========================================
  // 배송 시작
  // ========================================

  const saveShipping = async ({ startShipping = false } = {}) => {
    if (!selectedOrder) return

    if (startShipping && (
      !shippingForm.courier ||
      !shippingForm.trackingNumber
    )) {
      window.alert(
        '택배사와 송장번호를 입력해주세요.'
      )
      return
    }

    setIsSaving(true)

    try {
      const updateData = {
        carrier: shippingForm.courier,
        trackingNumber: shippingForm.trackingNumber,
        expectedDate: shippingForm.shipDate,
      }

      if (startShipping) {
        updateData.status = ORDER_STATUS.SHIPPED
      }

      await updateDocument('orders', selectedOrder.id, updateData)
      await loadOrders()

      if (startShipping) {
        setSelectedOrderId(null)
      }
    } catch (error) {
      console.error('주문 배송 정보 저장 실패:', error)
      window.alert('배송 정보를 저장하지 못했습니다. 다시 시도해주세요.')
    } finally {
      setIsSaving(false)
    }
  }


  const handleStartShipping = () => {
    saveShipping({ startShipping: true })
  }


  const handleCompleteDelivery = async () => {
    if (
      !selectedOrder ||
      selectedOrder.status !== ORDER_STATUS.SHIPPED ||
      isSaving
    ) {
      return
    }

    if (!window.confirm('이 주문을 배송 완료 처리할까요?')) {
      return
    }

    setIsSaving(true)

    try {
      await updateDocument('orders', selectedOrder.id, {
        status: ORDER_STATUS.DELIVERED,
      })
      await loadOrders()
      setSelectedOrderId(null)
    } catch (error) {
      console.error('배송 완료 처리 실패:', error)
      window.alert('배송 완료 처리에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSaving(false)
    }
  }


  const handleCancelOrder = async () => {
    if (!selectedOrder || isSaving) return

    const shouldCancel = window.confirm('이 주문을 취소 처리할까요?')

    if (!shouldCancel) return

    setIsSaving(true)

    try {
      await updateDocument('orders', selectedOrder.id, {
        status: ORDER_STATUS.CANCELLED,
      })
      await loadOrders()
      setSelectedOrderId(null)
    } catch (error) {
      console.error('관리자 주문 취소 실패:', error)
      window.alert('주문 취소 처리에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSaving(false)
    }
  }


  const currentStepIndex =
    selectedOrder
      ? selectedOrder.delivery ===
        '배송 완료'
        ? 4
        : selectedOrder.delivery ===
          '배송 중'
          ? 3
          : selectedOrder.delivery ===
            '배송 준비'
            ? 2
            : selectedOrder.payment ===
              '결제 완료'
              ? 1
              : 0
      : 0


  return (
    <section
      className={styles.page}
      aria-labelledby="order-manage-title"
    >

      {/* ========================================
          상단 툴바
      ======================================== */}

      <header
        className={styles.pageToolbar}
      >
        <h1 id="order-manage-title">
          주문 관리
        </h1>

        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading}
          className={
            isRefreshing
              ? styles.refreshing
              : ''
          }
        >
          <RefreshIcon />

          {isRefreshing
            ? '불러오는 중'
            : '새로 고침'}
        </button>
      </header>


      {/* ========================================
          전통 문양 구분선
      ======================================== */}

      <div
        className={styles.ornamentLine}
        aria-hidden="true"
      >
        <img
          src={adminTopOrnament}
          alt=""
        />
      </div>


      {/* ========================================
          상단 요약 카드
      ======================================== */}

      <section
        className={styles.summaryArea}
        aria-label="주문 현황 요약"
      >
        <div
          className={styles.summaryGrid}
        >
          {summaryCards.map(
            (card) => (
              <button
                key={card.key}
                type="button"
                className={`${styles.summaryCard} ${styles[`summaryCard${card.key}`]} ${activeSummaryKey === card.key ? styles.summaryCardActive : ''}`}
                aria-pressed={activeSummaryKey === card.key}
                onClick={() => handleSummaryFilter(card.key)}
              >
                <span
                  className={styles.summaryIcon}
                  aria-hidden="true"
                >
                  <SummaryIcon type={card.key} />
                </span>

                <div
                  className={
                    styles.summaryContent
                  }
                >
                  <h3>
                    {card.label}
                  </h3>

                  <p>
                    <strong>
                      {card.value.toLocaleString(
                        'ko-KR'
                      )}
                    </strong>

                    <span>
                      {card.unit}
                    </span>
                  </p>

                  <small>
                    <b>
                      {card.caption}
                    </b>

                    {card.subCaption}
                  </small>
                </div>
              </button>
            )
          )}
        </div>
      </section>


      {/* ========================================
          주문 관리 본문
      ======================================== */}

      <div
        className={
          styles.managementGrid
        }
      >

        {/* ========================================
            좌측 주문 목록
        ======================================== */}

        <section
          className={styles.mainSection}
        >

          {/* 필터 */}

          <div
            className={styles.filterBar}
          >
            <label
              className={
                styles.searchField
              }
            >
              <span
                className={styles.srOnly}
              >
                주문 검색
              </span>

              <SearchIcon />

              <input
                type="search"
                value={searchQuery}
                onChange={(event) =>
                  setSearchQuery(
                    event.target.value
                  )
                }
                placeholder="주문 번호, 주문자명, 상품명 검색"
              />
            </label>


            <label
              className={
                styles.selectField
              }
            >
              <select
                value={orderStatus}
                onChange={(event) =>
                  setOrderStatus(
                    event.target.value
                  )
                }
              >
                <option value="all">
                  주문 상태
                </option>

                <option value="결제 완료">
                  결제 완료
                </option>

                <option value="배송 준비">
                  배송 준비
                </option>

                <option value="배송 중">
                  배송 중
                </option>

                <option value="배송 완료">
                  배송 완료
                </option>

                <option value="주문 취소">
                  주문 취소
                </option>
              </select>
            </label>


            <label
              className={
                styles.selectField
              }
            >
              <select
                value={
                  paymentStatus
                }
                onChange={(event) =>
                  setPaymentStatus(
                    event.target.value
                  )
                }
              >
                <option value="all">
                  결제 상태
                </option>

                <option value="결제 완료">
                  결제 완료
                </option>

                <option value="취소 완료">
                  취소 완료
                </option>
              </select>
            </label>


            <label
              className={`${styles.selectField} ${styles.sortField}`}
            >
              <select
                value={sortOrder}
                onChange={(event) =>
                  setSortOrder(
                    event.target.value
                  )
                }
              >
                <option value="latest">
                  최신순
                </option>

                <option value="oldest">
                  오래된순
                </option>

                <option value="high">
                  금액 높은순
                </option>

                <option value="low">
                  금액 낮은순
                </option>
              </select>
            </label>


            <button
              type="button"
              className={
                styles.resetButton
              }
              onClick={resetFilters}
            >
              초기화
            </button>
          </div>


          {/* 빠른 필터 */}

          <div
            className={
              styles.quickFilterArea
            }
          >
            <span>빠른 필터</span>

            <div>
              {quickFilters.map(
                (filter) => (
                  <button
                    type="button"
                    key={filter}
                    className={
                      quickFilter ===
                      filter
                        ? styles.activeQuick
                        : ''
                    }
                    onClick={() =>
                      setQuickFilter(
                        filter
                      )
                    }
                  >
                    {filter}
                  </button>
                )
              )}
            </div>
          </div>


          {/* 목록 제목 */}

          <div
            className={
              styles.sectionHeading
            }
          >
            <div
              className={
                styles.titleWrap
              }
            >
              <h2>주문 목록</h2>

              <span>
                {
                  filteredOrders.length
                }
                건
              </span>
            </div>
          </div>


          {/* 주문 테이블 */}

          <div
            className={styles.tableWrap}
          >
            <table
              className={
                styles.dataTable
              }
            >
              <thead>
                <tr>
                  <th>주문 번호</th>
                  <th>주문자</th>
                  <th>주문 상품</th>
                  <th>주문일</th>
                  <th>결제 금액</th>
                  <th>결제 상태</th>
                  <th>배송 상태</th>
                  <th>관리</th>
                </tr>
              </thead>

              <tbody>
                {!isLoading && filteredOrders.length > 0 ? (
                  filteredOrders.map(
                    (order) => (
                      <tr
                        key={order.id}
                        className={
                          selectedOrderId ===
                          order.id
                            ? styles.selectedRow
                            : ''
                        }
                      >
                        <td>
                          <strong
                            className={styles.orderId}
                            title={order.id}
                            aria-label={`전체 주문번호 ${order.id}`}
                          >
                            {formatOrderId(order.id)}
                          </strong>
                        </td>

                        <td>
                          {
                            order.customer
                          }
                        </td>

                        <td
                          className={
                            styles.productCell
                          }
                        >
                          {order.product}
                        </td>

                        <td>
                          {order.date}
                        </td>

                        <td>
                          {formatPrice(
                            order.amount
                          )}
                        </td>

                        <td>
                          <span
                            className={`${styles.statusBadge} ${
                              order.payment.includes('취소')
                              || order.payment.includes('환불')
                                ? styles.refund
                                : styles.paid
                            }`}
                          >
                            {
                              order.payment
                            }
                          </span>
                        </td>

                        <td>
                          <span
                            className={`${styles.statusBadge} ${
                              order.delivery ===
                              '배송 준비'
                                ? styles.ready
                                : order.delivery ===
                                  '배송 중'
                                  ? styles.shipping
                                  : order.delivery ===
                                    '배송 완료'
                                    ? styles.completed
                                    : styles.waiting
                            }`}
                          >
                            {
                              order.delivery
                            }
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className={
                              styles.detailButton
                            }
                            onClick={() =>
                              openOrderDetail(
                                order
                              )
                            }
                          >
                            상세 보기
                          </button>
                        </td>
                      </tr>
                    )
                  )
                ) : (
                  <tr>
                    <td
                      colSpan="8"
                      className={
                        styles.emptyState
                      }
                    >
                        {isLoading
                          ? '주문 데이터를 불러오는 중입니다.'
                          : loadError || '조건에 맞는 주문이 없습니다.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </section>


        {/* ========================================
            우측 통계
        ======================================== */}

        <aside
          className={
            styles.analyticsColumn
          }
        >

          <section
            className={
              styles.analyticsCard
            }
          >
            <header
              className={
                styles.analyticsHeader
              }
            >
              <h2>
                주문 상태 분포
              </h2>

              <span>STATUS</span>
            </header>


            <div
              className={
                styles.statusOverview
              }
            >
              <div
                className={
                  styles.statusDonut
                }
                style={{
                  '--ready-end': `${readyEnd}%`,
                  '--shipping-end': `${shippingEnd}%`,
                  '--completed-end': `${completedEnd}%`,
                }}
              >
                <div>
                  <span>전체</span>

                  <strong>
                    {totalCount.toLocaleString('ko-KR')}건
                  </strong>
                </div>
              </div>


              <ul>
                <li>
                  <span
                    className={
                      styles.dotReady
                    }
                  />

                  <span>
                    배송 준비
                  </span>

                  <strong>
                    {readyCount}건
                  </strong>
                </li>

                <li>
                  <span
                    className={
                      styles.dotShipping
                    }
                  />

                  <span>
                    배송 중
                  </span>

                  <strong>
                    {shippingCount}건
                  </strong>
                </li>

                <li>
                  <span
                    className={
                      styles.dotCompleted
                    }
                  />

                  <span>
                    배송 완료
                  </span>

                  <strong>
                    {completedCount}건
                  </strong>
                </li>

                <li>
                  <span
                    className={
                      styles.dotRefund
                    }
                  />

                  <span>
                    취소·환불
                  </span>

                  <strong>
                    {requestCount}건
                  </strong>
                </li>
              </ul>
            </div>
          </section>


          <section
            className={
              styles.analyticsCard
            }
          >
            <header
              className={
                styles.analyticsHeader
              }
            >
              <h2>
                최근 7일 주문 현황
              </h2>

              <span>7 DAYS</span>
            </header>


            <div
              className={
                styles.chartLegend
              }
            >
              <span>
                <i
                  className={
                    styles.orderLegend
                  }
                />
                주문 수
              </span>

              <span>
                <i
                  className={
                    styles.cancelLegend
                  }
                />
                취소 / 환불
              </span>
            </div>


            <div
              className={
                styles.barChart
              }
            >
              {weeklyData.map(
                (item) => (
                  <div
                    className={
                      styles.barItem
                    }
                    key={item.day}
                  >
                    <div
                      className={
                        styles.barPair
                      }
                    >
                      <i
                        className={
                          styles.orderBar
                        }
                        style={{
                          '--bar-height':
                            `${(item.order / maxWeeklyCount) * 100}%`,
                        }}
                      />

                      <i
                        className={
                          styles.cancelBar
                        }
                        style={{
                          '--bar-height':
                            `${(item.cancel / maxWeeklyCount) * 100}%`,
                        }}
                      />
                    </div>

                    <span>
                      {item.day}
                    </span>
                  </div>
                )
              )}
            </div>


            <div
              className={
                styles.weekCompare
              }
            >
              <div
                className={
                  styles.compareIcon
                }
              >
                ↑
              </div>

              <div>
                <span>
                  전일 대비 주문 수
                </span>

                <strong>
                  {orderChangeRate >= 0 ? '+' : ''}
                  {orderChangeRate.toFixed(1)}%
                </strong>
              </div>

              <dl>
                <div>
                  <dt>어제</dt>
                  <dd>{yesterdayCount}건</dd>
                </div>

                <div>
                  <dt>오늘</dt>
                  <dd>{todayCount}건</dd>
                </div>
              </dl>
            </div>
          </section>

        </aside>

      </div>


      {/* ========================================
          주문 상세
      ======================================== */}

      {selectedOrder && (
        <>
          <button
            type="button"
            className={
              styles.detailBackdrop
            }
            onClick={closeOrderDetail}
            aria-label="주문 상세 닫기"
          />


          <aside
            className={
              styles.detailPanel
            }
          >

            {/* 상세 헤더 */}

            <header
              className={
                styles.detailHeader
              }
            >
              <h2>주문 상세</h2>

              <button
                type="button"
                onClick={closeOrderDetail}
                aria-label="닫기"
              >
                ×
              </button>
            </header>


            <div
              className={
                styles.detailScroll
              }
            >

              {/* 핵심 주문 정보 */}

              <section
                className={
                  styles.orderSummary
                }
              >
                <div>
                  <span>주문번호</span>

                  <strong>
                    #
                    {
                      selectedOrder.id
                    }
                  </strong>
                </div>

                <div>
                  <span>주문일</span>

                  <strong>
                    {
                      selectedOrder.date
                    }
                    <small>
                      {
                        selectedOrder.time
                      }
                    </small>
                  </strong>
                </div>

                <div>
                  <span>결제 상태</span>

                  <strong>
                    <i
                      className={`${styles.detailStatus} ${
                        selectedOrder.payment.includes('취소')
                        || selectedOrder.payment.includes('환불')
                          ? styles.refund
                          : styles.paid
                      }`}
                    >
                      {
                        selectedOrder.payment
                      }
                    </i>
                  </strong>
                </div>

                <div>
                  <span>배송 상태</span>

                  <strong>
                    <i
                      className={`${styles.detailStatus} ${
                        selectedOrder.delivery ===
                        '배송 준비'
                          ? styles.ready
                          : selectedOrder.delivery ===
                            '배송 중'
                            ? styles.shipping
                            : selectedOrder.delivery ===
                              '배송 완료'
                              ? styles.completed
                              : styles.waiting
                      }`}
                    >
                      {
                        selectedOrder.delivery
                      }
                    </i>
                  </strong>
                </div>

                <div>
                  <span>
                    총 결제 금액
                  </span>

                  <strong
                    className={
                      styles.totalPrice
                    }
                  >
                    {formatPrice(
                      selectedOrder.amount
                    )}
                  </strong>
                </div>
              </section>


              {/* 주문 처리 상태 */}

              <section
                className={
                  styles.detailSection
                }
              >
                <h3>
                  주문 처리 상태
                </h3>

                <div
                  className={
                    styles.progress
                  }
                >
                  {deliverySteps.map(
                    (
                      step,
                      index
                    ) => (
                      <div
                        key={step}
                        className={
                          styles.progressItem
                        }
                      >
                        <span
                          className={`${styles.stepCircle} ${
                            index <
                            currentStepIndex
                              ? styles.stepDone
                              : ''
                          } ${
                            index ===
                            currentStepIndex
                              ? styles.stepCurrent
                              : ''
                          }`}
                        >
                          {index <
                          currentStepIndex
                            ? '✓'
                            : index +
                              1}
                        </span>

                        <strong>
                          {step}
                        </strong>

                        <small>
                          {index <=
                          currentStepIndex
                            ? selectedOrder.time
                            : '-'}
                        </small>
                      </div>
                    )
                  )}
                </div>
              </section>


              {/* 상품 / 주문자 */}

              <div
                className={
                  styles.detailTwoColumn
                }
              >
                <section
                  className={
                    styles.detailSection
                  }
                >
                  <h3>
                    주문 상품 정보
                    <span>
                      {
                        selectedOrder
                          .items
                          .length
                      }
                      개
                    </span>
                  </h3>

                  <div
                    className={
                      styles.productList
                    }
                  >
                    {selectedOrder.items.map(
                      (
                        item,
                        index
                      ) => (
                        <div
                          className={
                            styles.orderProduct
                          }
                          key={
                            item.name
                          }
                        >
                          <span
                            className={
                              styles.productThumb
                            }
                          >
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt=""
                              />
                            ) : (
                              index === 0 ? '🍶' : '🎁'
                            )}
                          </span>

                          <div>
                            <strong>
                              {
                                item.name
                              }
                            </strong>

                            <small>
                              옵션:{' '}
                              {
                                item.option
                              }
                            </small>
                          </div>

                          <p>
                            <strong>
                              {formatPrice(
                                item.price
                              )}
                            </strong>

                            <small>
                              {
                                item.quantity
                              }
                              개
                            </small>
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </section>


                <section
                  className={
                    styles.detailSection
                  }
                >
                  <h3>
                    주문자 정보
                  </h3>

                  <dl
                    className={
                      styles.infoList
                    }
                  >
                    <div>
                      <dt>이름</dt>
                      <dd>
                        {
                          selectedOrder.customer
                        }
                      </dd>
                    </div>

                    <div>
                      <dt>연락처</dt>
                      <dd>
                        {
                          selectedOrder.phone
                        }
                      </dd>
                    </div>

                    <div>
                      <dt>이메일</dt>
                      <dd>
                        {
                          selectedOrder.email
                        }
                      </dd>
                    </div>

                    <div>
                      <dt>회원 구분</dt>
                      <dd>
                        일반 회원
                      </dd>
                    </div>

                    <div>
                      <dt>회원 번호</dt>
                      <dd>
                        {selectedOrder.userId || '-'}
                      </dd>
                    </div>
                  </dl>
                </section>
              </div>


              {/* 결제 / 배송지 */}

              <div
                className={
                  styles.detailTwoColumn
                }
              >
                <section
                  className={
                    styles.detailSection
                  }
                >
                  <h3>
                    결제 정보
                  </h3>

                  <dl
                    className={
                      styles.infoList
                    }
                  >
                    <div>
                      <dt>결제 수단</dt>
                      <dd>
                        {selectedOrder.paymentMethod}
                      </dd>
                    </div>

                    <div>
                      <dt>포인트 사용</dt>
                      <dd>
                        {formatPrice(selectedOrder.usedPoints)}
                      </dd>
                    </div>

                    <div>
                      <dt>상품 금액</dt>
                      <dd>
                        {formatPrice(
                          Math.max(
                            0,
                            selectedOrder.productAmount
                          )
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt>배송비</dt>
                      <dd>
                        {formatPrice(selectedOrder.shippingFee)}
                      </dd>
                    </div>

                    <div>
                      <dt>할인 금액</dt>
                      <dd>
                        {formatPrice(selectedOrder.discountAmount)}
                      </dd>
                    </div>

                    <div
                      className={
                        styles.totalRow
                      }
                    >
                      <dt>
                        총 결제 금액
                      </dt>

                      <dd>
                        {formatPrice(
                          selectedOrder.amount
                        )}
                      </dd>
                    </div>
                  </dl>
                </section>


                <section
                  className={
                    styles.detailSection
                  }
                >
                  <div
                    className={
                      styles.sectionTitleRow
                    }
                  >
                    <h3>
                      배송지 정보
                    </h3>

                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard
                          ?.writeText(
                            selectedOrder.address
                          )
                      }}
                    >
                      주소 복사
                    </button>
                  </div>

                  <dl
                    className={
                      styles.infoList
                    }
                  >
                    <div>
                      <dt>수령인</dt>
                      <dd>
                        {
                          selectedOrder.customer
                        }
                      </dd>
                    </div>

                    <div>
                      <dt>연락처</dt>
                      <dd>
                        {
                          selectedOrder.phone
                        }
                      </dd>
                    </div>

                    <div>
                      <dt>주소</dt>
                      <dd>
                        {
                          selectedOrder.address
                        }
                      </dd>
                    </div>

                    <div>
                      <dt>
                        배송 요청사항
                      </dt>

                      <dd>
                        {selectedOrder.request ||
                          '요청사항 없음'}
                      </dd>
                    </div>
                  </dl>
                </section>
              </div>


              {/* 처리 이력 */}

              <section
                className={
                  styles.detailSection
                }
              >
                <h3>
                  주문 처리 이력
                </h3>

                <div
                  className={
                    styles.historyList
                  }
                >
                  <div>
                    <i />

                    <span>
                      {
                        selectedOrder.date
                      }
                      <small>
                        {
                          selectedOrder.time
                        }
                      </small>
                    </span>

                    <strong>
                      주문 접수
                    </strong>

                    <p>
                      주문이 정상적으로
                      접수되었습니다.
                    </p>
                  </div>

                  <div>
                    <i />

                    <span>
                      {
                        selectedOrder.date
                      }
                      <small>
                        {
                          selectedOrder.time
                        }
                      </small>
                    </span>

                    <strong>
                      결제 완료
                    </strong>

                    <p>
                      결제가 정상적으로
                      완료되었습니다.
                    </p>
                  </div>

                  {currentStepIndex >=
                    2 && (
                    <div>
                      <i />

                      <span>
                        {
                          selectedOrder.date
                        }
                        <small>
                          {selectedOrder.updatedTime}
                        </small>
                      </span>

                      <strong>
                        배송 준비
                      </strong>

                      <p>
                        상품 출고 준비가
                        시작되었습니다.
                      </p>
                    </div>
                  )}
                </div>
              </section>


              {/* 배송 준비 */}

              <section
                className={
                  styles.shippingManage
                }
              >
                <header
                  className={
                    styles.shippingHeader
                  }
                >
                  <span>1</span>

                  <div>
                    <h3>
                      배송 준비 관리
                    </h3>

                    <p>
                      운송장 정보와 출고
                      정보를 입력해주세요.
                    </p>
                  </div>
                </header>


                <div
                  className={
                    styles.shippingContent
                  }
                >

                  <section
                    className={
                      styles.checkList
                    }
                  >
                    <h4>
                      출고 준비 체크리스트
                    </h4>

                    {[
                      {
                        key: 'product',
                        title:
                          '상품 검수',
                        text:
                          '주문 수량 및 상품 확인',
                      },
                      {
                        key: 'stock',
                        title:
                          '재고 확인',
                        text:
                          '실제 출고 가능 재고 확인',
                      },
                      {
                        key: 'packaging',
                        title:
                          '포장 완료',
                        text:
                          '파손 위험 상품 포장 확인',
                      },
                      {
                        key: 'adult',
                        title:
                          '성인 인증',
                        text:
                          '전통주 배송 대상 확인',
                      },
                      {
                        key: 'address',
                        title:
                          '주소 확인',
                        text:
                          '배송지 및 요청사항 확인',
                      },
                    ].map(
                      (item) => (
                        <label
                          key={
                            item.key
                          }
                        >
                          <input
                            type="checkbox"
                            checked={
                              checklist[
                                item
                                  .key
                              ]
                            }
                            onChange={() =>
                              toggleChecklist(
                                item.key
                              )
                            }
                          />

                          <span>
                            <strong>
                              {
                                item.title
                              }
                            </strong>

                            {
                              item.text
                            }
                          </span>
                        </label>
                      )
                    )}
                  </section>


                  <div
                    className={
                      styles.shippingForm
                    }
                  >
                    <div
                      className={
                        styles.formRow
                      }
                    >
                      <label>
                        <span>
                          택배사 선택
                        </span>

                        <select
                          name="courier"
                          value={
                            shippingForm.courier
                          }
                          onChange={
                            handleShippingChange
                          }
                        >
                          <option value="">
                            택배사를 선택하세요
                          </option>

                          <option value="CJ대한통운">
                            CJ대한통운
                          </option>

                          <option value="한진택배">
                            한진택배
                          </option>

                          <option value="롯데택배">
                            롯데택배
                          </option>

                          <option value="우체국택배">
                            우체국택배
                          </option>
                        </select>
                      </label>


                      <label>
                        <span>
                          송장번호
                        </span>

                        <input
                          type="text"
                          name="trackingNumber"
                          value={
                            shippingForm.trackingNumber
                          }
                          onChange={
                            handleShippingChange
                          }
                          placeholder="송장번호 입력"
                        />
                      </label>
                    </div>


                    <div
                      className={
                        styles.formRow
                      }
                    >
                      <label>
                        <span>
                          출고 예정일
                        </span>

                        <input
                          type="date"
                          name="shipDate"
                          value={
                            shippingForm.shipDate
                          }
                          onChange={
                            handleShippingChange
                          }
                        />
                      </label>


                      <label>
                        <span>
                          현재 주문 상태
                        </span>

                        <input
                          type="text"
                          value={selectedOrder.delivery}
                          readOnly
                        />
                      </label>
                    </div>
                  </div>

                </div>
              </section>

            </div>


            {/* 상세 하단 버튼 */}

            <footer
              className={
                styles.detailFooter
              }
            >
              <button
                type="button"
                className={
                  styles.cancelOrder
                }
                disabled={isSaving || selectedOrder.status === ORDER_STATUS.CANCELLED}
                onClick={handleCancelOrder}
              >
                주문 취소
              </button>

              <div>
                <button
                  type="button"
                  className={
                    styles.tempSave
                  }
                  disabled={isSaving}
                  onClick={() => saveShipping()}
                >
                  {isSaving ? '저장 중' : '배송 정보 저장'}
                </button>

                <button
                  type="button"
                  className={
                    styles.startShipping
                  }
                  onClick={
                    selectedOrder.status === ORDER_STATUS.SHIPPED
                      ? handleCompleteDelivery
                      : handleStartShipping
                  }
                  disabled={
                    isSaving ||
                    selectedOrder.status === ORDER_STATUS.CANCELLED ||
                    selectedOrder.status === ORDER_STATUS.DELIVERED
                  }
                >
                  <TruckIcon />
                  {isSaving
                    ? '처리 중'
                    : selectedOrder.status === ORDER_STATUS.SHIPPED
                      ? '배송 완료'
                      : selectedOrder.status === ORDER_STATUS.DELIVERED
                        ? '배송 완료'
                        : '배송 시작'}
                </button>
              </div>
            </footer>

          </aside>
        </>
      )}

    </section>
  )
}


export default OrdersManage
