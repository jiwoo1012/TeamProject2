import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  useNavigate,
} from 'react-router-dom'

import {
  collection,
  onSnapshot,
} from 'firebase/firestore'

import Chart from 'chart.js/auto'

import {
  getCollection,
} from '../../firebase/firestore'

import {
  db,
} from '../../firebase/firebase'

import {
  ORDER_STATUS,
} from '../../constants/orderStatus'

import eventsData from '../../data/events.json'

import AdminPageHeader
  from '../../components/admin/AdminPageHeader'

import AdminSummaryCard
  from '../../components/admin/AdminSummaryCard'

import styles from './Dashboard.module.scss'


// ========================================
// 날짜 유틸
// ========================================

const getTimestampDate = (value) => {
  const date =
    value?.toDate?.()
    || (
      value
        ? new Date(value)
        : null
    )

  if (
    !date
    || Number.isNaN(date.getTime())
  ) {
    return null
  }

  return date
}


const formatDateKey = (date) => (
  new Intl.DateTimeFormat('ko-CA')
    .format(date)
    .replaceAll('-', '.')
)


const formatShortDate = (date) => (
  new Intl.DateTimeFormat(
    'ko-KR',
    {
      month: '2-digit',
      day: '2-digit',
    }
  )
    .format(date)
    .replace('. ', '/')
    .replace('.', '')
)


const formatNoticeDate = (date) => {
  if (!date) return '-'

  return new Intl.DateTimeFormat('ko-CA')
    .format(date)
    .replaceAll('-', '.')
}


// ========================================
// 주문 데이터
// ========================================

const normalizeOrder = (document) => {
  const createdDate =
    getTimestampDate(document.createdAt)

  const shipping =
    document.shipping || {}

  const items =
    Array.isArray(document.items)
      ? document.items.map((item) => ({
          name:
            item.productName
            || item.name
            || '상품',

          quantity:
            Number(item.quantity || 1),

          price:
            Number(item.price || 0),
        }))
      : []

  return {
    id:
      document.id,

    customer:
      document.customerName
      || shipping.recipient
      || '회원',

    date:
      createdDate
        ? formatDateKey(createdDate)
        : '-',

    createdAtMs:
      createdDate?.getTime() || 0,

    amount:
      Number(
        document.totalAmount || 0
      ),

    status:
      document.status,

    items,
  }
}


const getStatusLabel = (status) => {
  if (
    status === ORDER_STATUS.PAID
  ) {
    return '결제 완료'
  }

  if (
    status === ORDER_STATUS.PREPARING
  ) {
    return '배송 준비'
  }

  if (
    status === ORDER_STATUS.SHIPPED
  ) {
    return '배송 중'
  }

  if (
    status === ORDER_STATUS.DELIVERED
  ) {
    return '배송 완료'
  }

  if (
    status === ORDER_STATUS.CANCELLED
  ) {
    return '취소 / 환불'
  }

  return '처리 대기'
}


// ========================================
// 회원 데이터
// ========================================

const normalizeMember = (document) => {
  const createdAtDate =
    getTimestampDate(
      document.createdAt
    )

  return {
    id:
      document.id,

    createdAtDate,

    joinedAt:
      createdAtDate
        ? formatDateKey(
            createdAtDate
          )
        : '-',

    status:
      document.status === 'suspended'
        ? 'suspended'
        : 'active',

    role:
      document.role === 'admin'
        ? 'admin'
        : 'user',
  }
}


// ========================================
// AI 추천 로그 데이터
// ========================================

const normalizeAiLog = (
  document
) => {
  const createdAtDate =
    getTimestampDate(
      document.createdAt
    )

  return {
    id:
      document.id,

    uid:
      document.uid
      || null,

    userType:
      document.userType ===
      'guest'
        ? 'guest'
        : 'member',

    status:
      document.status
      || 'success',

    createdAtDate,

    createdAtKey:
      createdAtDate
        ? formatDateKey(
            createdAtDate
          )
        : '-',
  }
}


// ========================================
// 공지사항 데이터
// ========================================

const normalizeNotice = (document) => {
  const createdAtDate =
    getTimestampDate(
      document.createdAt
    )

  return {
    id:
      document.id,

    title:
      document.title
      || '제목 없음',

    status:
      document.status === 'published'
        ? 'published'
        : 'draft',

    isPinned:
      Boolean(
        document.isPinned
      ),

    createdAtDate,

    createdAtMs:
      createdAtDate?.getTime()
      || 0,
  }
}


// ========================================
// 이벤트 데이터
// ========================================

const parseEventDate = (value) => (
  value
    ? new Date(
        `${value}T00:00:00`
      )
    : null
)


const normalizeDashboardEvent = (
  source,
  fallbackId,
) => {
  const event =
    source.event ?? source

  const startDate =
    event.eventPeriod?.startDate
    ?? event.startDate
    ?? ''

  const endDate =
    event.eventPeriod?.endDate
    ?? event.endDate
    ?? ''

  const today =
    new Date()

  today.setHours(
    0,
    0,
    0,
    0,
  )

  const start =
    parseEventDate(startDate)

  const end =
    parseEventDate(endDate)

  let status =
    event.status

  if (!status) {
    status =
      event.isActive === false
      || (
        end
        && end < today
      )
        ? 'ended'
        : (
          start
          && start > today
        )
          ? 'upcoming'
          : 'progress'
  }

  return {
    id:
      event.eventId
      ?? source.id
      ?? fallbackId,

    title:
      event.title
      ?? '제목 없는 이벤트',

    status,

    startDate,

    endDate,
  }
}


const fallbackEvents =
  eventsData.map(
    (item, index) =>
      normalizeDashboardEvent(
        item,
        `event-${index + 1}`,
      )
  )


// ========================================
// 아이콘
// ========================================

const SummaryIcon = ({ type }) => {
  if (type === 'orders') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="9" cy="20" r="1" />
        <circle cx="18" cy="20" r="1" />

        <path
          d="M3 4h2l2.5 11h10l2-7H7"
        />
      </svg>
    )
  }


  if (type === 'sales') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d="M5 19V10" />
        <path d="M12 19V5" />
        <path d="M19 19v-7" />
      </svg>
    )
  }


  if (type === 'members') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle
          cx="9"
          cy="8"
          r="3"
        />

        <circle
          cx="17"
          cy="9"
          r="2.5"
        />

        <path
          d="M3 19c.6-4 2.6-6 6-6s5.4 2 6 6"
        />

        <path
          d="M14 14c3.8-.4 6.1 1.3 7 5"
        />
      </svg>
    )
  }


  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path
        d="M12 2l1.4 4.4L18 8l-4.6 1.6L12 14l-1.4-4.4L6 8l4.6-1.6L12 2Z"
      />

      <path
        d="M18.5 14l.8 2.5L22 17.5l-2.7 1-.8 2.5-.8-2.5-2.7-1 2.7-1 .8-2.5Z"
      />
    </svg>
  )
}


const TrendIcon = ({ type }) => {
  if (type === 'members') {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle
          cx="9"
          cy="8"
          r="3"
        />

        <path
          d="M4 19c.5-3.8 2.2-5.7 5-5.7s4.5 1.9 5 5.7"
        />

        <path d="M17 8v6" />
        <path d="M14 11h6" />
      </svg>
    )
  }


  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path
        d="M12 3l1.3 4 4.2 1.4-4.2 1.4-1.3 4-1.3-4-4.2-1.4 4.2-1.4L12 3Z"
      />

      <path
        d="M18 14l.8 2.2L21 17l-2.2.8L18 20l-.8-2.2L15 17l2.2-.8L18 14Z"
      />
    </svg>
  )
}


// ========================================
// DASHBOARD
// ========================================

const Dashboard = () => {
  const navigate =
    useNavigate()


  // ========================================
  // 상태
  // ========================================

  const [
    orders,
    setOrders,
  ] = useState([])

  const [
    members,
    setMembers,
  ] = useState([])

  const [
    notices,
    setNotices,
  ] = useState([])

  const [
    aiLogs,
    setAiLogs,
  ] = useState([])

  const [
    events,
    setEvents,
  ] = useState(
    fallbackEvents
  )

  const [
    isLoading,
    setIsLoading,
  ] = useState(true)

  const [
    loadError,
    setLoadError,
  ] = useState('')


  // ========================================
  // 주문 + 회원 + 공지 + AI 추천 로그 조회
  // ========================================

  const loadDashboardData =
    useCallback(async () => {
      setIsLoading(true)
      setLoadError('')

      try {
        const [
          orderDocuments,
          memberDocuments,
          noticeDocuments,
          aiLogDocuments,
        ] = await Promise.all([
          getCollection(
            'orders'
          ),

          getCollection(
            'users'
          ),

          getCollection(
            'notices'
          ),

          getCollection(
            'aiRecommendationLogs'
          ),
        ])


        setOrders(
          orderDocuments
            .map(
              normalizeOrder
            )
            .sort(
              (a, b) =>
                b.createdAtMs
                - a.createdAtMs
            )
        )


        setMembers(
          memberDocuments.map(
            normalizeMember
          )
        )


        setNotices(
          noticeDocuments
            .map(
              normalizeNotice
            )
            .sort(
              (a, b) =>
                b.createdAtMs
                - a.createdAtMs
            )
        )


        setAiLogs(
          aiLogDocuments
            .map(
              normalizeAiLog
            )
            .sort(
              (a, b) =>
                (
                  b.createdAtDate
                    ?.getTime()
                  || 0
                )
                -
                (
                  a.createdAtDate
                    ?.getTime()
                  || 0
                )
            )
        )
      } catch (error) {
        console.error(
          '대시보드 데이터 조회 실패:',
          error
        )

        setLoadError(
          '대시보드 데이터를 불러오지 못했습니다.'
        )
      } finally {
        setIsLoading(false)
      }
    }, [])


  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])


  // ========================================
  // 이벤트 실시간 조회
  // ========================================

  useEffect(() => {
    const unsubscribe =
      onSnapshot(
        collection(
          db,
          'events',
        ),

        (snapshot) => {
          if (snapshot.empty) {
            setEvents(
              fallbackEvents
            )

            return
          }

          setEvents(
            snapshot.docs.map(
              (item) =>
                normalizeDashboardEvent(
                  {
                    id:
                      item.id,

                    ...item.data(),
                  },

                  item.id,
                )
            )
          )
        },

        (error) => {
          console.error(
            '대시보드 이벤트 조회 실패:',
            error
          )

          setEvents(
            fallbackEvents
          )
        },
      )

    return unsubscribe
  }, [])


  // ========================================
  // 날짜
  // ========================================

  const todayKey =
    formatDateKey(
      new Date()
    )


  const recentDates =
    useMemo(
      () => (
        Array.from(
          {
            length: 7,
          },

          (_, index) => {
            const date =
              new Date()

            date.setHours(
              0,
              0,
              0,
              0
            )

            date.setDate(
              date.getDate()
              - (
                6 - index
              )
            )

            return {
              key:
                formatDateKey(
                  date
                ),

              label:
                formatShortDate(
                  date
                ),
            }
          }
        )
      ),
      []
    )


  const previousDates =
    useMemo(
      () => (
        Array.from(
          {
            length: 7,
          },

          (_, index) => {
            const date =
              new Date()

            date.setHours(
              0,
              0,
              0,
              0
            )

            date.setDate(
              date.getDate()
              - (
                13 - index
              )
            )

            return formatDateKey(
              date
            )
          }
        )
      ),
      []
    )


  // ========================================
  // 오늘 주문
  // ========================================

  const todayOrders =
    useMemo(
      () => (
        orders.filter(
          (order) =>
            order.date
            === todayKey
        )
      ),
      [
        orders,
        todayKey,
      ]
    )


  const todayOrderCount =
    todayOrders.length


  // ========================================
  // 오늘 매출
  // ========================================

  const todaySales =
    useMemo(
      () => (
        todayOrders.reduce(
          (
            total,
            order
          ) => {
            if (
              order.status
              === ORDER_STATUS.CANCELLED
            ) {
              return total
            }

            return (
              total
              + order.amount
            )
          },
          0
        )
      ),
      [
        todayOrders,
      ]
    )


  // ========================================
  // 최근 7일 매출
  // ========================================

  const weeklySales =
    useMemo(
      () => (
        recentDates.map(
          (date) => ({
            ...date,

            sales:
              orders.reduce(
                (
                  total,
                  order
                ) => {
                  if (
                    order.date
                    !== date.key
                    ||
                    order.status
                    === ORDER_STATUS.CANCELLED
                  ) {
                    return total
                  }

                  return (
                    total
                    + order.amount
                  )
                },
                0
              ),
          })
        )
      ),
      [
        orders,
        recentDates,
      ]
    )


  const weeklySalesTotal =
    weeklySales.reduce(
      (
        total,
        item
      ) => (
        total
        + item.sales
      ),
      0
    )


  // ========================================
  // 최근 7일 매출 그래프 - Chart.js
  // ========================================

  const salesChartCanvasRef =
    useRef(null)

  const salesChartInstanceRef =
    useRef(null)


  useEffect(() => {
    const canvas =
      salesChartCanvasRef.current

    if (!canvas) {
      return undefined
    }


    salesChartInstanceRef
      .current
      ?.destroy()


    const context =
      canvas.getContext('2d')

    const gradient =
      context.createLinearGradient(
        0,
        0,
        0,
        230
      )

    gradient.addColorStop(
      0,
      'rgba(84, 139, 132, 0.24)'
    )

    gradient.addColorStop(
      1,
      'rgba(84, 139, 132, 0.02)'
    )


    const chart =
      new Chart(
        context,
        {
          type: 'line',

          data: {
            labels:
              weeklySales.map(
                (item) =>
                  item.label
              ),

            datasets: [
              {
                label: '매출',

                data:
                  weeklySales.map(
                    (item) =>
                      item.sales
                  ),

                borderColor:
                  '#548b84',

                backgroundColor:
                  gradient,

                borderWidth: 2,

                fill: true,

                tension: 0,

                pointRadius: 4,

                pointHoverRadius: 6,

                pointHitRadius: 14,

                pointBackgroundColor:
                  '#548b84',

                pointBorderColor:
                  '#548b84',

                pointBorderWidth: 1,

                pointHoverBackgroundColor:
                  '#ffffff',

                pointHoverBorderColor:
                  '#548b84',

                pointHoverBorderWidth: 2,
              },
            ],
          },

          options: {
            responsive: true,

            maintainAspectRatio: false,

            animation: {
              duration: 350,
            },

            interaction: {
              mode: 'nearest',
              intersect: true,
            },

            plugins: {
              legend: {
                display: false,
              },

              tooltip: {
                enabled: true,

                backgroundColor:
                  '#252136',

                titleColor:
                  '#ffffff',

                bodyColor:
                  '#ffffff',

                borderWidth: 0,

                cornerRadius: 10,

                padding: 12,

                caretPadding: 8,

                displayColors: true,

                boxWidth: 11,

                boxHeight: 11,

                titleFont: {
                  size: 12,
                  weight: '700',
                },

                bodyFont: {
                  size: 12,
                  weight: '500',
                },

                callbacks: {
                  title: (items) => {
                    const label =
                      items[0]
                        ?.label
                      || ''

                    return label
                      .split('/')
                      .map(
                        (value) =>
                          Number(value)
                      )
                      .join('/')
                  },

                  label: (context) =>
                    `매출: ${Number(
                      context.raw || 0
                    ).toLocaleString(
                      'ko-KR'
                    )}원`,
                },
              },
            },

            scales: {
              x: {
                grid: {
                  display: false,
                },

                border: {
                  display: false,
                },

                ticks: {
                  color:
                    '#a5aaa7',

                  padding: 8,

                  font: {
                    size: 9,
                  },

                  maxRotation: 0,

                  minRotation: 0,
                },
              },

              y: {
                beginAtZero: true,

                border: {
                  display: false,
                },

                grid: {
                  color:
                    '#e7e9e7',

                  drawTicks: false,
                },

                ticks: {
                  color:
                    '#a5aaa7',

                  padding: 9,

                  font: {
                    size: 9,
                  },

                  callback: (value) => {
                    const numericValue =
                      Number(value)

                    if (
                      numericValue
                      >= 10000
                    ) {
                      const man =
                        numericValue
                        / 10000

                      return Number.isInteger(
                        man
                      )
                        ? `${man}만`
                        : `${man.toFixed(1)}만`
                    }

                    return numericValue
                      .toLocaleString(
                        'ko-KR'
                      )
                  },
                },
              },
            },
          },
        }
      )


    salesChartInstanceRef
      .current =
      chart


    return () => {
      chart.destroy()

      if (
        salesChartInstanceRef
          .current
        === chart
      ) {
        salesChartInstanceRef
          .current =
          null
      }
    }
  }, [
    weeklySales,
  ])


  // ========================================
  // 주문 상태
  // ========================================

  const statusCounts =
    useMemo(
      () => ({
        paid:
          orders.filter(
            (order) =>
              order.status
              === ORDER_STATUS.PAID
          ).length,

        preparing:
          orders.filter(
            (order) =>
              order.status
              === ORDER_STATUS.PREPARING
          ).length,

        shipped:
          orders.filter(
            (order) =>
              order.status
              === ORDER_STATUS.SHIPPED
          ).length,

        delivered:
          orders.filter(
            (order) =>
              order.status
              === ORDER_STATUS.DELIVERED
          ).length,

        cancelled:
          orders.filter(
            (order) =>
              order.status
              === ORDER_STATUS.CANCELLED
          ).length,
      }),
      [
        orders,
      ]
    )


  const maxStatusCount =
    Math.max(
      1,
      ...Object.values(
        statusCounts
      )
    )


  const orderStatuses = [
    {
      label:
        '결제 완료',

      count:
        statusCounts.paid,
    },
    {
      label:
        '배송 준비',

      count:
        statusCounts.preparing,
    },
    {
      label:
        '배송 중',

      count:
        statusCounts.shipped,
    },
    {
      label:
        '배송 완료',

      count:
        statusCounts.delivered,
    },
    {
      label:
        '취소 / 환불',

      count:
        statusCounts.cancelled,

      danger:
        true,
    },
  ].map(
    (status) => ({
      ...status,

      percent:
        (
          status.count
          / maxStatusCount
        )
        * 100,
    })
  )


  // ========================================
  // 주문 상태 도넛 그래프 - Chart.js
  // ========================================

  const orderStatusCanvasRef =
    useRef(null)

  const orderStatusChartRef =
    useRef(null)


  const orderStatusTotal =
    orderStatuses.reduce(
      (
        total,
        status
      ) =>
        total
        + status.count,
      0
    )


  useEffect(() => {
    const canvas =
      orderStatusCanvasRef.current

    if (!canvas) {
      return undefined
    }


    orderStatusChartRef
      .current
      ?.destroy()


    const context =
      canvas.getContext('2d')


    const chart =
      new Chart(
        context,
        {
          type: 'doughnut',

          data: {
            labels:
              orderStatuses.map(
                (status) =>
                  status.label
              ),

            datasets: [
              {
                data:
                  orderStatuses.map(
                    (status) =>
                      status.count
                  ),

                backgroundColor: [
                  '#548b84',
                  '#dba457',
                  '#719aad',
                  '#9bbfaf',
                  '#d99690',
                ],

                borderColor:
                  '#ffffff',

                borderWidth: 2,

                hoverBorderWidth: 2,

                hoverOffset: 4,

                spacing: 1,
              },
            ],
          },

          options: {
            responsive: true,

            maintainAspectRatio: false,

            cutout: '64%',

            animation: {
              duration: 350,
            },

            plugins: {
              legend: {
                display: false,
              },

              tooltip: {
                enabled: true,

                backgroundColor:
                  '#252136',

                titleColor:
                  '#ffffff',

                bodyColor:
                  '#ffffff',

                cornerRadius: 10,

                padding: 11,

                displayColors: true,

                boxWidth: 10,

                boxHeight: 10,

                callbacks: {
                  label: (context) =>
                    `${context.label}: ${Number(
                      context.raw || 0
                    ).toLocaleString(
                      'ko-KR'
                    )}건`,
                },
              },
            },
          },
        }
      )


    orderStatusChartRef
      .current =
      chart


    return () => {
      chart.destroy()

      if (
        orderStatusChartRef
          .current
        === chart
      ) {
        orderStatusChartRef
          .current =
          null
      }
    }
  }, [
    statusCounts.paid,
    statusCounts.preparing,
    statusCounts.shipped,
    statusCounts.delivered,
    statusCounts.cancelled,
  ])


  // ========================================
  // 배송 준비 필요
  // ========================================

  const readyOrderCount =
    orders.filter(
      (order) => (
        order.status
        === ORDER_STATUS.PAID
        ||
        order.status
        === ORDER_STATUS.PREPARING
      )
    ).length


  // ========================================
  // 처리 필요한 주문
  // ========================================

  const pendingOrders =
    useMemo(
      () => (
        orders
          .filter(
            (order) => (
              order.status
              === ORDER_STATUS.PAID
              ||
              order.status
              === ORDER_STATUS.PREPARING
            )
          )
          .slice(
            0,
            4
          )
      ),
      [
        orders,
      ]
    )


  // ========================================
  // 인기 상품 TOP 5
  // ========================================

  const popularProducts =
    useMemo(
      () => {
        const productMap =
          new Map()


        orders.forEach(
          (order) => {
            if (
              order.status
              === ORDER_STATUS.CANCELLED
            ) {
              return
            }

            order.items.forEach(
              (item) => {
                const current =
                  productMap.get(
                    item.name
                  )
                  || 0

                productMap.set(
                  item.name,

                  current
                  + item.quantity
                )
              }
            )
          }
        )


        const ranked =
          [
            ...productMap.entries(),
          ]
            .map(
              ([
                name,
                count,
              ]) => ({
                name,
                count,
              })
            )
            .sort(
              (a, b) =>
                b.count
                - a.count
            )
            .slice(
              0,
              5
            )


        const max =
          Math.max(
            1,
            ...ranked.map(
              (item) =>
                item.count
            )
          )


        return ranked.map(
          (item) => ({
            ...item,

            percent:
              (
                item.count
                / max
              )
              * 100,
          })
        )
      },
      [
        orders,
      ]
    )


  // ========================================
  // 오늘 신규 회원
  // ========================================

  const todayMemberCount =
    useMemo(
      () => (
        members.filter(
          (member) =>
            member.joinedAt
            === todayKey
        ).length
      ),
      [
        members,
        todayKey,
      ]
    )


  // ========================================
  // 최근 7일 신규 회원
  // ========================================

  const memberTrend =
    useMemo(
      () => (
        recentDates.map(
          (date) => ({
            ...date,

            count:
              members.filter(
                (member) =>
                  member.joinedAt
                  === date.key
              ).length,
          })
        )
      ),
      [
        members,
        recentDates,
      ]
    )


  const recentSignupCount =
    memberTrend.reduce(
      (
        total,
        item
      ) => (
        total
        + item.count
      ),
      0
    )


  // ========================================
  // 이전 7일 회원
  // ========================================

  const previousDateSet =
    useMemo(
      () => (
        new Set(
          previousDates
        )
      ),
      [
        previousDates,
      ]
    )


  const previousSignupCount =
    useMemo(
      () => (
        members.filter(
          (member) =>
            previousDateSet.has(
              member.joinedAt
            )
        ).length
      ),
      [
        members,
        previousDateSet,
      ]
    )


  // ========================================
  // 회원 전주 대비
  // ========================================

  const signupChangeRate =
    previousSignupCount > 0
      ? (
        (
          recentSignupCount
          - previousSignupCount
        )
        / previousSignupCount
      ) * 100
      : recentSignupCount > 0
        ? 100
        : 0


  const formattedSignupRate =
    `${
      signupChangeRate > 0
        ? '+'
        : ''
    }${signupChangeRate.toFixed(1)}%`


  // ========================================
  // 신규 회원 추이 - Chart.js Bar
  // ========================================

  const memberTrendCanvasRef =
    useRef(null)

  const memberTrendChartRef =
    useRef(null)


  useEffect(() => {
    const canvas =
      memberTrendCanvasRef.current

    if (!canvas) {
      return undefined
    }


    memberTrendChartRef
      .current
      ?.destroy()


    const context =
      canvas.getContext('2d')


    const chart =
      new Chart(
        context,
        {
          type: 'bar',

          data: {
            labels:
              memberTrend.map(
                (item) =>
                  item.label
              ),

            datasets: [
              {
                label: '신규 회원',

                data:
                  memberTrend.map(
                    (item) =>
                      item.count
                  ),

                backgroundColor:
                  '#548b84',

                hoverBackgroundColor:
                  '#477a74',

                borderRadius: 6,

                borderSkipped: false,

                barThickness: 20,

                maxBarThickness: 24,

                categoryPercentage: 0.72,

                barPercentage: 0.88,
              },
            ],
          },

          options: {
            responsive: true,

            maintainAspectRatio: false,

            animation: {
              duration: 350,
            },

            interaction: {
              mode: 'nearest',
              intersect: true,
            },

            plugins: {
              legend: {
                display: false,
              },

              tooltip: {
                enabled: true,

                backgroundColor:
                  '#252136',

                titleColor:
                  '#ffffff',

                bodyColor:
                  '#ffffff',

                cornerRadius: 10,

                padding: 12,

                caretPadding: 8,

                displayColors: true,

                boxWidth: 11,

                boxHeight: 11,

                titleFont: {
                  size: 12,
                  weight: '700',
                },

                bodyFont: {
                  size: 12,
                  weight: '500',
                },

                callbacks: {
                  title: (items) => {
                    const label =
                      items[0]
                        ?.label
                      || ''

                    return label
                      .split('/')
                      .map(
                        (value) =>
                          Number(value)
                      )
                      .join('/')
                  },

                  label: (context) =>
                    `신규 회원: ${Number(
                      context.raw || 0
                    ).toLocaleString(
                      'ko-KR'
                    )}명`,
                },
              },
            },

            scales: {
              x: {
                grid: {
                  display: false,
                },

                border: {
                  display: false,
                },

                ticks: {
                  color:
                    '#a5aaa7',

                  padding: 7,

                  font: {
                    size: 8,
                  },

                  maxRotation: 0,

                  minRotation: 0,
                },
              },

              y: {
                beginAtZero: true,

                suggestedMax:
                  Math.max(
                    3,
                    ...memberTrend.map(
                      (item) =>
                        item.count
                    )
                  ),

                border: {
                  display: false,
                },

                grid: {
                  color:
                    '#e7e9e7',

                  drawTicks: false,
                },

                ticks: {
                  display: false,

                  precision: 0,
                },
              },
            },
          },
        }
      )


    memberTrendChartRef
      .current =
      chart


    return () => {
      chart.destroy()

      if (
        memberTrendChartRef
          .current
        === chart
      ) {
        memberTrendChartRef
          .current =
          null
      }
    }
  }, [
    memberTrend,
  ])


  // ========================================
  // 최근 7일 AI 추천 이용 현황
  // ========================================

  const aiTrend =
    useMemo(
      () => (
        recentDates.map(
          (date) => {
            const dayLogs =
              aiLogs.filter(
                (log) =>
                  log.createdAtKey
                    === date.key
                  &&
                  log.status
                    !== 'pending'
              )

            return {
              date:
                date.label,

              member:
                dayLogs.filter(
                  (log) =>
                    log.userType
                      === 'member'
                ).length,

              guest:
                dayLogs.filter(
                  (log) =>
                    log.userType
                      === 'guest'
                ).length,
            }
          }
        )
      ),
      [
        aiLogs,
        recentDates,
      ]
    )


  const recentAiUsageCount =
    aiTrend.reduce(
      (
        total,
        item
      ) =>
        total
        + item.member
        + item.guest,
      0
    )


  const recentMemberAiCount =
    aiTrend.reduce(
      (
        total,
        item
      ) =>
        total
        + item.member,
      0
    )


  const recentGuestAiCount =
    aiTrend.reduce(
      (
        total,
        item
      ) =>
        total
        + item.guest,
      0
    )


  const todayAiUsageCount =
    useMemo(
      () => (
        aiLogs.filter(
          (log) =>
            log.createdAtKey
              === todayKey
            &&
            log.status
              !== 'pending'
        ).length
      ),
      [
        aiLogs,
        todayKey,
      ]
    )


  // ========================================
  // AI 추천 이용 현황 - Chart.js Multi Line
  // ========================================

  const aiTrendCanvasRef =
    useRef(null)

  const aiTrendChartRef =
    useRef(null)


  useEffect(() => {
    const canvas =
      aiTrendCanvasRef.current

    if (!canvas) {
      return undefined
    }


    aiTrendChartRef
      .current
      ?.destroy()


    const context =
      canvas.getContext('2d')


    const chart =
      new Chart(
        context,
        {
          type: 'line',

          data: {
            labels:
              aiTrend.map(
                (item) =>
                  item.date
              ),

            datasets: [
              {
                label: '회원',

                data:
                  aiTrend.map(
                    (item) =>
                      item.member
                  ),

                borderColor:
                  '#548b84',

                backgroundColor:
                  '#548b84',

                borderWidth: 2.5,

                tension: 0.28,

                fill: false,

                pointRadius: 3.5,

                pointHoverRadius: 6,

                pointHitRadius: 14,

                pointBackgroundColor:
                  '#548b84',

                pointBorderColor:
                  '#ffffff',

                pointBorderWidth: 1.5,

                pointHoverBackgroundColor:
                  '#ffffff',

                pointHoverBorderColor:
                  '#548b84',

                pointHoverBorderWidth: 2,
              },

              {
                label: '비회원',

                data:
                  aiTrend.map(
                    (item) =>
                      item.guest
                  ),

                borderColor:
                  '#d99a94',

                backgroundColor:
                  '#d99a94',

                borderWidth: 2.5,

                tension: 0.28,

                fill: false,

                pointRadius: 3.5,

                pointHoverRadius: 6,

                pointHitRadius: 14,

                pointBackgroundColor:
                  '#d99a94',

                pointBorderColor:
                  '#ffffff',

                pointBorderWidth: 1.5,

                pointHoverBackgroundColor:
                  '#ffffff',

                pointHoverBorderColor:
                  '#d99a94',

                pointHoverBorderWidth: 2,
              },
            ],
          },

          options: {
            responsive: true,

            maintainAspectRatio: false,

            animation: {
              duration: 350,
            },

            interaction: {
              mode: 'index',
              intersect: false,
            },

            plugins: {
              legend: {
                display: false,
              },

              tooltip: {
                enabled: true,

                backgroundColor:
                  '#252136',

                titleColor:
                  '#ffffff',

                bodyColor:
                  '#ffffff',

                cornerRadius: 10,

                padding: 12,

                caretPadding: 8,

                displayColors: true,

                boxWidth: 11,

                boxHeight: 11,

                titleFont: {
                  size: 12,
                  weight: '700',
                },

                bodyFont: {
                  size: 12,
                  weight: '500',
                },

                callbacks: {
                  title: (items) => {
                    const label =
                      items[0]
                        ?.label
                      || ''

                    return label
                      .split('/')
                      .map(
                        (value) =>
                          Number(value)
                      )
                      .join('/')
                  },

                  label: (context) =>
                    `${context.dataset.label}: ${Number(
                      context.raw || 0
                    ).toLocaleString(
                      'ko-KR'
                    )}건`,
                },
              },
            },

            scales: {
              x: {
                grid: {
                  display: false,
                },

                border: {
                  display: false,
                },

                ticks: {
                  color:
                    '#a5aaa7',

                  padding: 7,

                  font: {
                    size: 8,
                  },

                  maxRotation: 0,

                  minRotation: 0,
                },
              },

              y: {
                beginAtZero: true,

                border: {
                  display: false,
                },

                grid: {
                  color:
                    '#e7e9e7',

                  drawTicks: false,
                },

                ticks: {
                  display: false,
                },
              },
            },
          },
        }
      )


    aiTrendChartRef
      .current =
      chart


    return () => {
      chart.destroy()

      if (
        aiTrendChartRef
          .current
        === chart
      ) {
        aiTrendChartRef
          .current =
          null
      }
    }
  }, [
    aiTrend,
  ])


  // ========================================
  // 최근 공지사항
  // 게시 중 최신 3개
  // ========================================

  const recentNotices =
    useMemo(
      () => (
        notices
          .filter(
            (notice) =>
              notice.status
              === 'published'
          )
          .slice(
            0,
            3
          )
      ),
      [
        notices,
      ]
    )


  // ========================================
  // 이벤트
  // 오늘 마감
  // ========================================

  const todayEventKey =
    new Date()
      .toLocaleDateString(
        'sv-SE'
      )


  const todayClosingEventCount =
    events.filter(
      (event) =>
        event.endDate
        === todayEventKey
    ).length


  // ========================================
  // 상단 KPI
  // ========================================

  const summaryCards = [
    {
      key:
        'orders',

      label:
        '오늘 주문',

      value:
        isLoading
          ? '—'
          : todayOrderCount
            .toLocaleString(
              'ko-KR'
            ),

      unit:
        '건',

      caption:
        '오늘 접수된 주문',

      to:
        '/admin/orders',
    },


    {
      key:
        'sales',

      label:
        '오늘 매출',

      value:
        isLoading
          ? '—'
          : todaySales
            .toLocaleString(
              'ko-KR'
            ),

      unit:
        '원',

      caption:
        '오늘 결제 완료 금액',

      to:
        '/admin/orders',
    },


    {
      key:
        'members',

      label:
        '신규 회원',

      value:
        isLoading
          ? '—'
          : todayMemberCount
            .toLocaleString(
              'ko-KR'
            ),

      unit:
        '명',

      caption:
        '오늘 새로 가입한 회원',

      to:
        '/admin/users',
    },


    {
      key:
        'ai',

      label:
        'AI 추천 이용',

      value:
        isLoading
          ? '—'
          : todayAiUsageCount
            .toLocaleString(
              'ko-KR'
            ),

      unit:
        '회',

      caption:
        '오늘 AI 추천 이용',

      to:
        '/admin/ai-logs',
    },
  ]


  // ========================================
  // 키보드 이동
  // ========================================

  const handlePanelKeyDown =
    (
      event,
      to
    ) => {
      if (
        event.key === 'Enter'
        ||
        event.key === ' '
      ) {
        event.preventDefault()

        navigate(to)
      }
    }


  // ========================================
  // RENDER
  // ========================================

  return (
    <section
      className={
        styles.page
      }
      aria-labelledby="dashboard-title"
    >

      {/* ========================================
          제목
      ======================================== */}

      <AdminPageHeader
        title="대시보드"
        titleId="dashboard-title"
      />


      {/* ========================================
          상단 KPI
      ======================================== */}

      <section
        className={styles.summaryArea}
        aria-label="오늘의 핵심 지표"
      >
        <div className={styles.summaryGrid}>
          {summaryCards.map(
            (card) => (
              <AdminSummaryCard
                key={card.key}
                icon={
                  <span
                    className={
                      styles.summarySvg
                    }
                  >
                    <SummaryIcon
                      type={card.key}
                    />
                  </span>
                }
                label={card.label}
                value={card.value}
                unit={card.unit}
                caption={card.caption}
                tone={
                  card.key === 'orders'
                    ? 'primary'
                    : card.key === 'sales'
                      ? 'info'
                      : card.key === 'members'
                        ? 'danger'
                        : 'warning'
                }
                onClick={() =>
                  navigate(card.to)
                }
              />
            )
          )}
        </div>
      </section>


      {/* ========================================
          메인 레이아웃
      ======================================== */}

      <div
        className={
          styles.dashboardGrid
        }
      >

        {/* ========================================
            왼쪽
        ======================================== */}

        <div
          className={
            styles.mainColumn
          }
        >

          {/* ========================================
              최근 7일 매출
          ======================================== */}

          <section
            className={`
              ${styles.panel}
              ${styles.salesPanel}
              ${styles.clickablePanel}
            `}
            role="link"
            tabIndex="0"
            onClick={() =>
              navigate(
                '/admin/orders'
              )
            }
            onKeyDown={
              (event) =>
                handlePanelKeyDown(
                  event,
                  '/admin/orders'
                )
            }
          >
            <header
              className={
                styles.panelHeader
              }
            >
              <h2>
                최근 7일 매출 현황
              </h2>


              <div
                className={
                  styles.salesTotal
                }
              >
                <strong>
                  {
                    isLoading
                      ? '—'
                      : weeklySalesTotal
                        .toLocaleString(
                          'ko-KR'
                        )
                  }
                </strong>

                <span>
                  원
                </span>

                <small>
                  지난 7일 합계
                </small>
              </div>
            </header>


            <div
              className={
                styles.salesChart
              }
            >
              <canvas
                ref={
                  salesChartCanvasRef
                }
                aria-label="최근 7일 매출 꺾은선 그래프"
                role="img"
              />
            </div>
          </section>


          {/* ========================================
              주문 상태 + 인기 상품
          ======================================== */}

          <div
            className={
              styles.middleGrid
            }
          >

            {/* 주문 상태 */}

            <section
              className={`
                ${styles.panel}
                ${styles.clickablePanel}
              `}
              role="link"
              tabIndex="0"
              onClick={() =>
                navigate(
                  '/admin/orders'
                )
              }
              onKeyDown={
                (event) =>
                  handlePanelKeyDown(
                    event,
                    '/admin/orders'
                  )
              }
            >
              <header
                className={
                  styles.smallPanelHeader
                }
              >
                <h2>
                  주문 상태
                </h2>

                <span
                  className={
                    styles.panelArrow
                  }
                  aria-hidden="true"
                >
                  →
                </span>
              </header>


              <div
                className={
                  styles.orderStatusContent
                }
              >
                <div
                  className={
                    styles.orderStatusDonut
                  }
                >
                  <canvas
                    ref={
                      orderStatusCanvasRef
                    }
                    aria-label="주문 상태 분포 도넛 그래프"
                    role="img"
                  />

                  <div
                    className={
                      styles.orderStatusCenter
                    }
                    aria-hidden="true"
                  >
                    <span>
                      전체
                    </span>

                    <strong>
                      {
                        orderStatusTotal
                      }
                      <small>
                        건
                      </small>
                    </strong>
                  </div>
                </div>


                <ul
                  className={
                    styles.statusLegend
                  }
                >
                  {
                    orderStatuses.map(
                      (
                        status,
                        index
                      ) => (
                        <li
                          key={
                            status.label
                          }
                        >
                          <span
                            className={`
                              ${styles.statusDot}
                              ${styles[
                                `statusDot${index + 1}`
                              ]}
                            `}
                            aria-hidden="true"
                          />

                          <span
                            className={
                              styles.statusName
                            }
                          >
                            {
                              status.label
                            }
                          </span>

                          <strong>
                            {
                              status.count
                            }
                            건
                          </strong>
                        </li>
                      )
                    )
                  }
                </ul>
              </div>
            </section>


            {/* 인기 상품 */}

            <section
              className={`
                ${styles.panel}
                ${styles.clickablePanel}
              `}
              role="link"
              tabIndex="0"
              onClick={() =>
                navigate(
                  '/admin/products'
                )
              }
              onKeyDown={
                (event) =>
                  handlePanelKeyDown(
                    event,
                    '/admin/products'
                  )
              }
            >
              <header
                className={
                  styles.smallPanelHeader
                }
              >
                <h2>
                  인기 상품 TOP 5
                </h2>

                <span
                  className={
                    styles.panelArrow
                  }
                  aria-hidden="true"
                >
                  →
                </span>
              </header>


              <ol
                className={
                  styles.productRanking
                }
              >
                {
                  popularProducts.length
                  > 0
                    ? popularProducts.map(
                      (
                        product,
                        index
                      ) => (
                        <li
                          key={
                            product.name
                          }
                        >
                          <span
                            className={
                              styles.rankNumber
                            }
                          >
                            {
                              index + 1
                            }
                          </span>


                          <span
                            className={
                              styles.productName
                            }
                          >
                            {
                              product.name
                            }
                          </span>


                          <span
                            className={
                              styles.productTrack
                            }
                          >
                            <i
                              style={{
                                width:
                                  `${product.percent}%`,
                              }}
                            />
                          </span>


                          <strong>
                            {
                              product.count
                            }개
                          </strong>
                        </li>
                      )
                    )
                    : (
                      <li>
                        <span>
                          -
                        </span>

                        <span
                          className={
                            styles.productName
                          }
                        >
                          주문 데이터 없음
                        </span>
                      </li>
                    )
                }
              </ol>
            </section>

          </div>


          {/* ========================================
              처리 필요한 주문
          ======================================== */}

          <section
            className={`
              ${styles.panel}
              ${styles.pendingOrdersPanel}
            `}
          >
            <header
              className={
                styles.smallPanelHeader
              }
            >
              <h2>
                처리 필요한 주문 내역
              </h2>


              <button
                type="button"
                onClick={() =>
                  navigate(
                    '/admin/orders'
                  )
                }
              >
                전체 주문 보기 →
              </button>
            </header>


            <div
              className={
                styles.tableWrap
              }
            >
              <table
                className={
                  styles.ordersTable
                }
              >
                <thead>
                  <tr>
                    <th>
                      주문 번호
                    </th>

                    <th>
                      주문자
                    </th>

                    <th>
                      주문 금액
                    </th>

                    <th>
                      주문 일시
                    </th>

                    <th>
                      상태
                    </th>

                    <th>
                      관리
                    </th>
                  </tr>
                </thead>


                <tbody>
                  {
                    pendingOrders.length
                    > 0
                      ? pendingOrders.map(
                        (order) => (
                          <tr
                            key={
                              order.id
                            }
                            onClick={() =>
                              navigate(
                                '/admin/orders'
                              )
                            }
                          >
                            <td>
                              {
                                order.id
                              }
                            </td>


                            <td>
                              {
                                order.customer
                              }
                            </td>


                            <td>
                              {
                                order.amount
                                  .toLocaleString(
                                    'ko-KR'
                                  )
                              }
                              원
                            </td>


                            <td>
                              {
                                order.date
                              }
                            </td>


                            <td>
                              <span
                                className={
                                  order.status
                                  === ORDER_STATUS.PREPARING
                                    ? styles.shippingBadge
                                    : styles.paymentBadge
                                }
                              >
                                {
                                  getStatusLabel(
                                    order.status
                                  )
                                }
                              </span>
                            </td>


                            <td>
                              <button
                                type="button"
                                onClick={
                                  (event) => {
                                    event
                                      .stopPropagation()

                                    navigate(
                                      '/admin/orders'
                                    )
                                  }
                                }
                              >
                                상세
                              </button>
                            </td>
                          </tr>
                        )
                      )
                      : (
                        <tr>
                          <td
                            colSpan="6"
                          >
                            {
                              isLoading
                                ? '주문 데이터를 불러오는 중입니다.'
                                : loadError
                                  || '처리할 주문이 없습니다.'
                            }
                          </td>
                        </tr>
                      )
                  }
                </tbody>
              </table>
            </div>
          </section>


          {/* ========================================
              신규 회원 + AI
          ======================================== */}

          <div
            className={
              styles.trendGrid
            }
          >

            {/* 신규 회원 */}

            <section
              className={`
                ${styles.panel}
                ${styles.trendPanel}
                ${styles.clickablePanel}
              `}
              role="link"
              tabIndex="0"
              onClick={() =>
                navigate(
                  '/admin/users'
                )
              }
              onKeyDown={
                (event) =>
                  handlePanelKeyDown(
                    event,
                    '/admin/users'
                  )
              }
            >
              <header
                className={
                  styles.trendHeader
                }
              >
                <h2>
                  신규 회원 추이
                </h2>

                <span
                  className={
                    styles.panelArrow
                  }
                  aria-hidden="true"
                >
                  →
                </span>
              </header>


              <div
                className={
                  styles.trendChart
                }
              >
                <canvas
                  ref={
                    memberTrendCanvasRef
                  }
                  aria-label="최근 7일 신규 회원 추이 막대 그래프"
                  role="img"
                />
              </div>


              <div
                className={
                  styles.trendSummary
                }
              >
                <span
                  className={`
                    ${styles.trendSummaryIcon}
                    ${styles.memberTrendIcon}
                  `}
                  aria-hidden="true"
                >
                  <TrendIcon
                    type="members"
                  />
                </span>


                <div
                  className={
                    styles.trendPrimary
                  }
                >
                  <small>
                    전주 대비
                  </small>

                  <strong>
                    {
                      formattedSignupRate
                    }
                  </strong>
                </div>


                <span
                  className={
                    styles.summaryDivider
                  }
                />


                <div
                  className={
                    styles.trendSecondary
                  }
                >
                  <p>
                    <span>
                      지난 7일
                    </span>

                    <strong>
                      {
                        recentSignupCount
                      }명
                    </strong>
                  </p>


                  <p>
                    <span>
                      오늘
                    </span>

                    <strong>
                      {
                        todayMemberCount
                      }명
                    </strong>
                  </p>
                </div>
              </div>
            </section>


            {/* AI 추천 - 아직 미연결 */}

            <section
              className={`
                ${styles.panel}
                ${styles.trendPanel}
                ${styles.clickablePanel}
              `}
              role="link"
              tabIndex="0"
              onClick={() =>
                navigate(
                  '/admin/ai-logs'
                )
              }
              onKeyDown={
                (event) =>
                  handlePanelKeyDown(
                    event,
                    '/admin/ai-logs'
                  )
              }
            >
              <header
                className={
                  styles.trendHeader
                }
              >
                <h2>
                  AI 추천 이용 현황
                </h2>


                <div
                  className={
                    styles.trendHeaderRight
                  }
                >
                  <div
                    className={
                      styles.chartLegend
                    }
                  >
                    <span>
                      <i
                        className={
                          styles.memberLegend
                        }
                      />

                      회원
                    </span>

                    <span>
                      <i
                        className={
                          styles.guestLegend
                        }
                      />

                      비회원
                    </span>
                  </div>


                  <span
                    className={
                      styles.panelArrow
                    }
                    aria-hidden="true"
                  >
                    →
                  </span>
                </div>
              </header>


              <div
                className={
                  styles.trendChart
                }
              >
                <canvas
                  ref={
                    aiTrendCanvasRef
                  }
                  aria-label="최근 7일 회원 및 비회원 AI 추천 이용 추이 꺾은선 그래프"
                  role="img"
                />
              </div>


              <div
                className={
                  styles.trendSummary
                }
              >
                <span
                  className={`
                    ${styles.trendSummaryIcon}
                    ${styles.aiTrendIcon}
                  `}
                  aria-hidden="true"
                >
                  <TrendIcon
                    type="ai"
                  />
                </span>


                <div
                  className={
                    styles.trendPrimary
                  }
                >
                  <small>
                    총 이용 횟수
                  </small>

                  <strong>
                    {recentAiUsageCount.toLocaleString(
                      'ko-KR'
                    )}
                    회
                  </strong>
                </div>


                <span
                  className={
                    styles.summaryDivider
                  }
                />


                <div
                  className={
                    styles.trendSecondary
                  }
                >
                  <p>
                    <span>
                      회원
                    </span>

                    <strong>
                      {recentMemberAiCount.toLocaleString(
                        'ko-KR'
                      )}
                      회
                    </strong>
                  </p>


                  <p>
                    <span>
                      비회원
                    </span>

                    <strong>
                      {recentGuestAiCount.toLocaleString(
                        'ko-KR'
                      )}
                      회
                    </strong>
                  </p>
                </div>
              </div>
            </section>

          </div>
        </div>


        {/* ========================================
            오른쪽 고정 영역
        ======================================== */}

        <aside
          className={
            styles.rightColumn
          }
        >

          {/* ========================================
              관리자 확인 필요
          ======================================== */}

          <section
            className={
              styles.sidePanel
            }
          >
            <header
              className={
                styles.sideHeader
              }
            >
              <h2>
                관리자 확인 필요
              </h2>
            </header>


            <ul
              className={
                styles.alertList
              }
            >

              {/* 배송 */}

              <li>
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      '/admin/orders'
                    )
                  }
                >
                  <span>
                    <i />

                    배송 준비 필요
                  </span>

                  <strong>
                    {
                      readyOrderCount
                    }건
                  </strong>
                </button>
              </li>


              {/* 재고 - 추후 상품 연결 */}

              <li>
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      '/admin/products'
                    )
                  }
                >
                  <span>
                    <i />

                    재고 부족 상품
                  </span>

                  <strong>
                    —건
                  </strong>
                </button>
              </li>


              {/* 문의 - 추후 연결 */}

              <li>
                <button
                  type="button"
                >
                  <span>
                    <i />

                    답변 대기 문의
                  </span>

                  <strong>
                    —건
                  </strong>
                </button>
              </li>


              {/* 이벤트 - 연결 완료 */}

              <li>
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      '/admin/events'
                    )
                  }
                >
                  <span>
                    <i />

                    오늘 마감 이벤트
                  </span>

                  <strong>
                    {
                      todayClosingEventCount
                    }건
                  </strong>
                </button>
              </li>
            </ul>
          </section>


          {/* ========================================
              최근 공지사항
          ======================================== */}

          <section
            className={`
              ${styles.sidePanel}
              ${styles.clickablePanel}
            `}
            role="link"
            tabIndex="0"
            onClick={() =>
              navigate(
                '/admin/notices'
              )
            }
            onKeyDown={
              (event) =>
                handlePanelKeyDown(
                  event,
                  '/admin/notices'
                )
            }
          >
            <header
              className={
                styles.sideHeader
              }
            >
              <h2>
                최근 공지사항
              </h2>

              <span
                className={
                  styles.panelArrow
                }
                aria-hidden="true"
              >
                →
              </span>
            </header>


            <ul
              className={
                styles.noticeList
              }
            >
              {
                recentNotices.length
                > 0
                  ? recentNotices.map(
                    (notice) => (
                      <li
                        key={
                          notice.id
                        }
                      >
                        <span>
                          {
                            notice.title
                          }
                        </span>

                        <small>
                          {
                            formatNoticeDate(
                              notice.createdAtDate
                            )
                          }
                        </small>
                      </li>
                    )
                  )
                  : (
                    <li>
                      <span>
                        등록된 공지사항이 없습니다.
                      </span>
                    </li>
                  )
              }
            </ul>
          </section>


          {/* ========================================
              바로가기
          ======================================== */}

          <section
            className={
              styles.sidePanel
            }
          >
            <header
              className={
                styles.sideHeader
              }
            >
              <h2>
                바로가기
              </h2>
            </header>


            <div
              className={
                styles.quickGrid
              }
            >
              <button
                type="button"
                onClick={() =>
                  navigate(
                    '/admin/orders'
                  )
                }
              >
                주문 관리
              </button>


              <button
                type="button"
                onClick={() =>
                  navigate(
                    '/admin/products'
                  )
                }
              >
                상품 관리
              </button>


              <button
                type="button"
                onClick={() =>
                  navigate(
                    '/admin/events'
                  )
                }
              >
                이벤트 관리
              </button>


              <button
                type="button"
                onClick={() =>
                  navigate(
                    '/admin/notices'
                  )
                }
              >
                공지사항 관리
              </button>
            </div>
          </section>

        </aside>
      </div>
    </section>
  )
}


export default Dashboard