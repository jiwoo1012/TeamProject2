import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  useNavigate,
} from 'react-router-dom'

import {
  collection,
  onSnapshot,
} from 'firebase/firestore'

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

import adminTopOrnament
  from '../../assets/images/admin/adminTopOrnament.svg'

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
// AI 임시 데이터
// 실제 연결은 다음 작업
// ========================================

const aiTrend = [
  {
    date: '09/01',
    member: 67,
    guest: 35,
  },
  {
    date: '09/02',
    member: 70,
    guest: 36,
  },
  {
    date: '09/03',
    member: 68,
    guest: 35,
  },
  {
    date: '09/04',
    member: 70,
    guest: 37,
  },
  {
    date: '09/05',
    member: 69,
    guest: 36,
  },
  {
    date: '09/06',
    member: 67,
    guest: 35,
  },
  {
    date: '09/07',
    member: 70,
    guest: 37,
  },
]


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
  // 주문 + 회원 + 공지 조회
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
  // 매출 그래프
  // ========================================

  const salesChartData =
    useMemo(
      () => {
        const max =
          Math.max(
            1,
            ...weeklySales.map(
              (item) =>
                item.sales
            )
          )

        const startX = 25
        const endX = 655

        const bottomY = 165
        const topY = 28

        const step =
          (
            endX
            - startX
          )
          / 6


        const points =
          weeklySales.map(
            (
              item,
              index
            ) => {
              const x =
                startX
                + (
                  step
                  * index
                )

              const ratio =
                item.sales
                / max

              const y =
                bottomY
                - (
                  ratio
                  * (
                    bottomY
                    - topY
                  )
                )

              return {
                x,
                y,
              }
            }
          )


        const pointString =
          points
            .map(
              ({ x, y }) =>
                `${x},${y}`
            )
            .join(' ')


        const fillPath =
          points.length
            ? `
              M ${points[0].x} ${points[0].y}
              ${points
                .slice(1)
                .map(
                  ({ x, y }) =>
                    `L ${x} ${y}`
                )
                .join(' ')}
              L ${endX} ${bottomY}
              L ${startX} ${bottomY}
              Z
            `
            : ''


        return {
          points,

          pointString,

          fillPath,

          axisValues: [
            max,
            max * 0.75,
            max * 0.5,
            max * 0.25,
            0,
          ],
        }
      },
      [
        weeklySales,
      ]
    )


  const formatAxisValue =
    (value) => {
      if (!value) {
        return '0'
      }

      if (
        value >= 10000
      ) {
        return `${
          Math.ceil(
            value / 10000
          )
        }만`
      }

      return Math.ceil(
        value
      ).toLocaleString(
        'ko-KR'
      )
    }


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


  const maxMemberTrend =
    Math.max(
      1,
      ...memberTrend.map(
        (item) =>
          item.count
      )
    )


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
        '—',

      unit:
        '회',

      caption:
        '추천 데이터 연결 예정',

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

      <header
        className={
          styles.pageToolbar
        }
      >
        <h1 id="dashboard-title">
          대시보드
        </h1>
      </header>


      {/* ========================================
          전통 문양
      ======================================== */}

      <div
        className={
          styles.ornamentLine
        }
        aria-hidden="true"
      >
        <img
          src={
            adminTopOrnament
          }
          alt=""
        />
      </div>


      {/* ========================================
          상단 카드
      ======================================== */}

      <section
        className={
          styles.summaryArea
        }
        aria-label="오늘의 핵심 지표"
      >
        <div
          className={
            styles.summaryGrid
          }
        >
          {summaryCards.map(
            (card) => (
              <button
                key={
                  card.key
                }
                type="button"
                className={`
                  ${styles.summaryCard}
                  ${styles[card.key]}
                `}
                onClick={() =>
                  navigate(
                    card.to
                  )
                }
              >
                <span
                  className={
                    styles.summaryIcon
                  }
                  aria-hidden="true"
                >
                  <SummaryIcon
                    type={
                      card.key
                    }
                  />
                </span>


                <span
                  className={
                    styles.summaryContent
                  }
                >
                  <span
                    className={
                      styles.summaryTitle
                    }
                  >
                    {
                      card.label
                    }
                  </span>


                  <span
                    className={
                      styles.summaryMetric
                    }
                  >
                    <strong>
                      {
                        card.value
                      }
                    </strong>

                    <em>
                      {
                        card.unit
                      }
                    </em>
                  </span>


                  <small>
                    {
                      card.caption
                    }
                  </small>
                </span>


                <span
                  className={
                    styles.cardArrow
                  }
                  aria-hidden="true"
                >
                  →
                </span>
              </button>
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
              <div
                className={
                  styles.yAxis
                }
              >
                {
                  salesChartData
                    .axisValues
                    .map(
                      (
                        value,
                        index
                      ) => (
                        <span
                          key={
                            index
                          }
                        >
                          {
                            formatAxisValue(
                              value
                            )
                          }
                        </span>
                      )
                    )
                }
              </div>


              <div
                className={
                  styles.salesChartBody
                }
              >
                <div
                  className={
                    styles.chartGridLines
                  }
                  aria-hidden="true"
                >
                  <i />
                  <i />
                  <i />
                  <i />
                  <i />
                </div>


                <svg
                  viewBox="0 0 700 180"
                  preserveAspectRatio="none"
                  aria-hidden="true"
                >
                  <defs>
                    <linearGradient
                      id="dashboardSalesGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#5a9189"
                        stopOpacity="0.25"
                      />

                      <stop
                        offset="100%"
                        stopColor="#5a9189"
                        stopOpacity="0"
                      />
                    </linearGradient>
                  </defs>


                  <path
                    d={
                      salesChartData
                        .fillPath
                    }
                    fill="url(#dashboardSalesGradient)"
                  />


                  <polyline
                    points={
                      salesChartData
                        .pointString
                    }
                    fill="none"
                    stroke="#548b84"
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                  />


                  {
                    salesChartData
                      .points
                      .map(
                        (
                          point,
                          index
                        ) => (
                          <circle
                            key={
                              index
                            }
                            cx={
                              point.x
                            }
                            cy={
                              point.y
                            }
                            r="4"
                            fill="#548b84"
                          />
                        )
                      )
                  }
                </svg>


                <div
                  className={
                    styles.salesDates
                  }
                >
                  {
                    weeklySales.map(
                      (item) => (
                        <span
                          key={
                            item.key
                          }
                        >
                          {
                            item.label
                          }
                        </span>
                      )
                    )
                  }
                </div>
              </div>
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


              <ul
                className={
                  styles.statusList
                }
              >
                {
                  orderStatuses.map(
                    (status) => (
                      <li
                        key={
                          status.label
                        }
                      >
                        <span
                          className={
                            styles.statusName
                          }
                        >
                          {
                            status.label
                          }
                        </span>


                        <span
                          className={
                            styles.statusTrack
                          }
                        >
                          <i
                            className={
                              status.danger
                                ? styles.dangerStatus
                                : ''
                            }
                            style={{
                              width:
                                `${status.percent}%`,
                            }}
                          />
                        </span>


                        <strong>
                          {
                            status.count
                          }
                        </strong>
                      </li>
                    )
                  )
                }
              </ul>
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
                  styles.barChart
                }
              >
                <div
                  className={
                    styles.barGridLines
                  }
                  aria-hidden="true"
                >
                  <i />
                  <i />
                  <i />
                  <i />
                </div>


                <div
                  className={
                    styles.memberBars
                  }
                >
                  {
                    memberTrend.map(
                      (item) => {
                        const height =
                          item.count > 0
                            ? Math.max(
                                (
                                  item.count
                                  / maxMemberTrend
                                )
                                * 100,
                                8
                              )
                            : 0

                        return (
                          <div
                            className={
                              styles.memberBarItem
                            }
                            key={
                              item.key
                            }
                          >
                            <span
                              className={
                                styles.singleBarWrap
                              }
                            >
                              <i
                                style={{
                                  height:
                                    `${height}%`,
                                }}
                              />
                            </span>


                            <small>
                              {
                                item.label
                              }
                            </small>
                          </div>
                        )
                      }
                    )
                  }
                </div>
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
                  styles.barChart
                }
              >
                <div
                  className={
                    styles.barGridLines
                  }
                  aria-hidden="true"
                >
                  <i />
                  <i />
                  <i />
                  <i />
                </div>


                <div
                  className={
                    styles.aiBars
                  }
                >
                  {
                    aiTrend.map(
                      (item) => (
                        <div
                          className={
                            styles.aiBarItem
                          }
                          key={
                            item.date
                          }
                        >
                          <span
                            className={
                              styles.doubleBarWrap
                            }
                          >
                            <i
                              className={
                                styles.memberAiBar
                              }
                              style={{
                                height:
                                  `${item.member}%`,
                              }}
                            />

                            <i
                              className={
                                styles.guestAiBar
                              }
                              style={{
                                height:
                                  `${item.guest}%`,
                              }}
                            />
                          </span>


                          <small>
                            {
                              item.date
                            }
                          </small>
                        </div>
                      )
                    )
                  }
                </div>
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
                    —
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
                      —
                    </strong>
                  </p>


                  <p>
                    <span>
                      비회원
                    </span>

                    <strong>
                      —
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