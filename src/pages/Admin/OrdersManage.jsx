import {
  useMemo,
  useState,
} from 'react'

import adminTopOrnament from '../../assets/images/admin/adminTopOrnament.svg'

import styles from './OrdersManage.module.scss'


// ========================================
// 임시 주문 데이터
// Firestore 연결 전 화면 확인용
// ========================================

const initialOrders = [
  {
    id: '20260907001',
    customer: '홍길동',
    phone: '010-1234-5678',
    email: 'hong@gmail.com',
    product: '복순도가 손막걸리 외 2건',
    date: '2026.09.07',
    time: '10:32',
    amount: 45600,
    payment: '결제 완료',
    delivery: '배송 준비',
    address: '서울시 강남구 테헤란로 123, 402호',
    request: '부재 시 문 앞에 놓아주세요.',
    courier: '',
    trackingNumber: '',
    shipDate: '2026-09-08',
    packageStatus: '일반 포장',
    memo: '',
    items: [
      {
        name: '복순도가 손막걸리',
        option: '935ml',
        price: 12000,
        quantity: 1,
      },
      {
        name: '유기 방짜 술잔',
        option: '기본',
        price: 18000,
        quantity: 1,
      },
      {
        name: '곶감 호두말이',
        option: '1세트',
        price: 11600,
        quantity: 1,
      },
    ],
  },
  {
    id: '20260907002',
    customer: '김지현',
    phone: '010-3344-8821',
    email: 'jihyun@gmail.com',
    product: '느린마을 막걸리 외 1건',
    date: '2026.09.07',
    time: '09:48',
    amount: 32400,
    payment: '결제 완료',
    delivery: '배송 중',
    address: '서울시 마포구 월드컵북로 42',
    request: '배송 전 연락 부탁드립니다.',
    courier: 'CJ대한통운',
    trackingNumber: '580123456789',
    shipDate: '2026-09-07',
    packageStatus: '일반 포장',
    memo: '',
    items: [
      {
        name: '느린마을 막걸리',
        option: '750ml',
        price: 12000,
        quantity: 1,
      },
      {
        name: '백자 술잔',
        option: '2개 세트',
        price: 20400,
        quantity: 1,
      },
    ],
  },
  {
    id: '20260906003',
    customer: '이서연',
    phone: '010-9832-1104',
    email: 'seoyeon@gmail.com',
    product: '문배술 외 1건',
    date: '2026.09.06',
    time: '17:21',
    amount: 69000,
    payment: '환불 요청',
    delivery: '배송 준비',
    address: '경기도 성남시 분당구 판교로 15',
    request: '선물용입니다. 포장 확인 부탁드립니다.',
    courier: '',
    trackingNumber: '',
    shipDate: '2026-09-08',
    packageStatus: '선물 포장',
    memo: '',
    items: [
      {
        name: '문배술 40',
        option: '375ml',
        price: 45000,
        quantity: 1,
      },
      {
        name: '전통주 선물 포장',
        option: '프리미엄',
        price: 24000,
        quantity: 1,
      },
    ],
  },
  {
    id: '20260906004',
    customer: '박민준',
    phone: '010-2841-9983',
    email: 'minjun@gmail.com',
    product: '서울의 밤 외 2건',
    date: '2026.09.06',
    time: '15:05',
    amount: 53800,
    payment: '결제 완료',
    delivery: '배송 완료',
    address: '인천시 연수구 송도과학로 88',
    request: '경비실에 맡겨주세요.',
    courier: '한진택배',
    trackingNumber: '420123789456',
    shipDate: '2026-09-06',
    packageStatus: '일반 포장',
    memo: '',
    items: [
      {
        name: '서울의 밤',
        option: '375ml',
        price: 23000,
        quantity: 1,
      },
      {
        name: '약과',
        option: '8개입',
        price: 12800,
        quantity: 1,
      },
      {
        name: '유리 술잔',
        option: '2개 세트',
        price: 18000,
        quantity: 1,
      },
    ],
  },
  {
    id: '20260905005',
    customer: '최유진',
    phone: '010-6621-3378',
    email: 'yujin@gmail.com',
    product: '화요 25 외 1건',
    date: '2026.09.05',
    time: '13:44',
    amount: 62500,
    payment: '결제 완료',
    delivery: '배송 중',
    address: '대전시 서구 둔산로 112',
    request: '',
    courier: '롯데택배',
    trackingNumber: '239821774401',
    shipDate: '2026-09-05',
    packageStatus: '안전 포장',
    memo: '',
    items: [
      {
        name: '화요 25',
        option: '375ml',
        price: 32500,
        quantity: 1,
      },
      {
        name: '육포 안주 세트',
        option: '기본',
        price: 30000,
        quantity: 1,
      },
    ],
  },
  {
    id: '20260905006',
    customer: '정하늘',
    phone: '010-4490-2171',
    email: 'haneul@gmail.com',
    product: '복순도가 손막걸리',
    date: '2026.09.05',
    time: '11:22',
    amount: 12000,
    payment: '결제 완료',
    delivery: '결제 완료',
    address: '부산시 해운대구 센텀중앙로 67',
    request: '',
    courier: '',
    trackingNumber: '',
    shipDate: '2026-09-08',
    packageStatus: '일반 포장',
    memo: '',
    items: [
      {
        name: '복순도가 손막걸리',
        option: '935ml',
        price: 12000,
        quantity: 1,
      },
    ],
  },
  {
    id: '20260904007',
    customer: '윤서준',
    phone: '010-2233-7790',
    email: 'seojun@gmail.com',
    product: '감홍로 외 1건',
    date: '2026.09.04',
    time: '18:31',
    amount: 78000,
    payment: '결제 완료',
    delivery: '배송 완료',
    address: '광주시 북구 첨단과기로 81',
    request: '',
    courier: 'CJ대한통운',
    trackingNumber: '580924521789',
    shipDate: '2026-09-04',
    packageStatus: '안전 포장',
    memo: '',
    items: [
      {
        name: '감홍로',
        option: '400ml',
        price: 58000,
        quantity: 1,
      },
      {
        name: '전통 유리잔',
        option: '2개입',
        price: 20000,
        quantity: 1,
      },
    ],
  },
]


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


const weeklyData = [
  { day: '09/01', order: 68, cancel: 22 },
  { day: '09/02', order: 74, cancel: 30 },
  { day: '09/03', order: 58, cancel: 18 },
  { day: '09/04', order: 79, cancel: 25 },
  { day: '09/05', order: 65, cancel: 20 },
  { day: '09/06', order: 83, cancel: 28 },
  { day: '09/07', order: 72, cancel: 17 },
]


const formatPrice = (price) =>
  `${Number(price).toLocaleString('ko-KR')}원`


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


const OrdersManage = () => {
  const [orders, setOrders] =
    useState(initialOrders)

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

  const [shippingForm, setShippingForm] =
    useState({
      courier: '',
      trackingNumber: '',
      shipDate: '',
      packageStatus: '일반 포장',
      memo: '',
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


  // ========================================
  // 지표
  // ========================================

  const totalCount = 1234
  const todayCount = 34
  const readyCount = 12
  const requestCount = 4


  const summaryCards = [
    {
      key: 'total',
      label: '전체 주문 수',
      value: totalCount,
      unit: '건',
      caption: '+ 13.78%',
      subCaption: '지난 주 대비',
    },
    {
      key: 'today',
      label: '오늘 주문',
      value: todayCount,
      unit: '건',
      caption: '+ 27.38%',
      subCaption: '어제 대비',
    },
    {
      key: 'ready',
      label: '배송 준비',
      value: readyCount,
      unit: '건',
      caption: '+ 6건',
      subCaption: '전일 대비',
    },
    {
      key: 'request',
      label: '취소 / 환불 요청',
      value: requestCount,
      unit: '건',
      caption: '+ 3건',
      subCaption: '전일 대비',
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
          '배송 준비'
        ) {
          matchesQuick =
            order.delivery ===
            '배송 준비'
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
            order.payment.includes(
              '환불'
            )
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

    setTimeout(() => {
      setOrders([...initialOrders])
      setIsRefreshing(false)
    }, 550)
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
      packageStatus:
        order.packageStatus ||
        '일반 포장',
      memo:
        order.memo || '',
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

  const handleStartShipping = () => {
    if (!selectedOrder) return

    if (
      !shippingForm.courier ||
      !shippingForm.trackingNumber
    ) {
      window.alert(
        '택배사와 송장번호를 입력해주세요.'
      )
      return
    }

    setOrders((current) =>
      current.map((order) =>
        order.id === selectedOrder.id
          ? {
              ...order,
              delivery: '배송 중',
              courier:
                shippingForm.courier,
              trackingNumber:
                shippingForm.trackingNumber,
              shipDate:
                shippingForm.shipDate,
              packageStatus:
                shippingForm.packageStatus,
              memo:
                shippingForm.memo,
            }
          : order
      )
    )

    setSelectedOrderId(null)
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
          disabled={isRefreshing}
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
              <article
                key={card.key}
                className={
                  styles.summaryCard
                }
              >
                <span
                  className={`${styles.summaryIcon} ${styles[card.key]}`}
                  aria-hidden="true"
                >
                  {card.key ===
                    'total' &&
                    '▦'}

                  {card.key ===
                    'today' &&
                    '◷'}

                  {card.key ===
                    'ready' &&
                    '□'}

                  {card.key ===
                    'request' &&
                    '!'}
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
                      ▲ {card.caption}
                    </b>

                    {card.subCaption}
                  </small>
                </div>
              </article>
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

                <option value="환불 요청">
                  환불 요청
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
                {filteredOrders.length >
                0 ? (
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
                          <strong>
                            {order.id}
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
                              order.payment ===
                              '환불 요청'
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
                      조건에 맞는 주문이
                      없습니다.
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
              >
                <div>
                  <span>전체</span>

                  <strong>
                    1,234건
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
                    222건
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
                    321건
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
                    555건
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
                    86건
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
                          height:
                            `${item.order}%`,
                        }}
                      />

                      <i
                        className={
                          styles.cancelBar
                        }
                        style={{
                          height:
                            `${item.cancel}%`,
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
                  + 27.3%
                </strong>
              </div>

              <dl>
                <div>
                  <dt>어제</dt>
                  <dd>44건</dd>
                </div>

                <div>
                  <dt>오늘</dt>
                  <dd>56건</dd>
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
                        selectedOrder.payment ===
                        '환불 요청'
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
                            {index ===
                            0
                              ? '🍶'
                              : index ===
                                1
                                ? '🥃'
                                : '🎁'}
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
                        #102938
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
                        신용카드
                      </dd>
                    </div>

                    <div>
                      <dt>카드 정보</dt>
                      <dd>
                        삼성카드
                        ****-5678
                      </dd>
                    </div>

                    <div>
                      <dt>상품 금액</dt>
                      <dd>
                        {formatPrice(
                          Math.max(
                            0,
                            selectedOrder.amount -
                              4000
                          )
                        )}
                      </dd>
                    </div>

                    <div>
                      <dt>배송비</dt>
                      <dd>
                        4,000원
                      </dd>
                    </div>

                    <div>
                      <dt>할인 금액</dt>
                      <dd>0원</dd>
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
                          15:10
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
                          포장 상태
                        </span>

                        <select
                          name="packageStatus"
                          value={
                            shippingForm.packageStatus
                          }
                          onChange={
                            handleShippingChange
                          }
                        >
                          <option value="일반 포장">
                            일반 포장
                          </option>

                          <option value="안전 포장">
                            안전 포장
                          </option>

                          <option value="선물 포장">
                            선물 포장
                          </option>
                        </select>
                      </label>
                    </div>


                    <div
                      className={
                        styles.formRow
                      }
                    >
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
                    </div>


                    <label
                      className={
                        styles.memoField
                      }
                    >
                      <span>
                        배송 메모 /
                        출고 메모
                      </span>

                      <textarea
                        name="memo"
                        value={
                          shippingForm.memo
                        }
                        onChange={
                          handleShippingChange
                        }
                        maxLength={200}
                        placeholder="배송 관련 메모를 입력해주세요."
                      />

                      <small>
                        {
                          shippingForm
                            .memo
                            .length
                        }
                        /200
                      </small>
                    </label>
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
              >
                주문 취소
              </button>

              <div>
                <button
                  type="button"
                  className={
                    styles.tempSave
                  }
                >
                  임시 저장
                </button>

                <button
                  type="button"
                  className={
                    styles.startShipping
                  }
                  onClick={
                    handleStartShipping
                  }
                >
                  <TruckIcon />
                  배송 시작
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