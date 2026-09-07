import { useEffect, useMemo, useState } from 'react'
import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore'
import { Link } from 'react-router-dom'

import {
  getOrderStatusLabel,
  ORDER_STATUS,
} from '../../constants/orderStatus'

import {
  subscribeToAuthState,
} from '../../firebase/auth'

import { db } from '../../firebase/firebase'

import styles from './OrderHistory.module.scss'


const ORDERS_PER_PAGE = 3


const summaryStats = [
  {
    type: 'all',
    label: '전체',
    value: 'all',
  },
  {
    type: 'shipping',
    label: '배송 중',
    value: 'shipping',
  },
  {
    type: 'completed',
    label: '배송 완료',
    value: 'completed',
  },
  {
    type: 'cancelled',
    label: '주문 취소',
    value: 'claim',
  },
]


const SummaryIcon = ({ type }) => {
  if (type === 'all') {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M6 6h12v14H6z" />
        <path d="M9 6V4h6v2" />
      </svg>
    )
  }


  if (type === 'shipping') {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M3 7h11v10H3z" />
        <path d="M14 10h4l3 3v4h-7z" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
      </svg>
    )
  }


  if (type === 'completed') {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="8" />
        <path d="m8.5 12 2.2 2.2 4.8-5" />
      </svg>
    )
  }


  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="8" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </svg>
  )
}


const ArrowIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path d="m9 5 7 7-7 7" />
  </svg>
)


const ProductArrowIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path d="M7 17 17 7" />
    <path d="M9 7h8v8" />
  </svg>
)


const OrderDetailIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path d="M6 4h12v16H6z" />
    <path d="M9 8h6M9 12h6M9 16h4" />
  </svg>
)


const formatPrice = (value) =>
  Number(value || 0).toLocaleString('ko-KR')


const OrderHistory = () => {
  const [orders, setOrders] =
    useState([])

  const [firebaseUser, setFirebaseUser] =
    useState(null)

  const [isLoading, setIsLoading] =
    useState(true)

  const [loadError, setLoadError] =
    useState('')

  const [loadAttempt, setLoadAttempt] =
    useState(0)

  const [activeFilter, setActiveFilter] =
    useState('all')

  const [periodMonths, setPeriodMonths] =
    useState('all')

  const [searchKeyword, setSearchKeyword] =
    useState('')

  const [currentPage, setCurrentPage] =
    useState(1)


  useEffect(() => {
    let isActive = true


    const unsubscribe =
      subscribeToAuthState(
        async (user) => {
          if (isActive) {
            setFirebaseUser(user)
          }


          if (!user) {
            if (isActive) {
              setOrders([])

              setLoadError(
                '로그인 후 주문 내역을 확인할 수 있습니다.'
              )

              setIsLoading(false)
            }

            return
          }


          setIsLoading(true)
          setLoadError('')


          try {
            const ordersQuery =
              query(
                collection(
                  db,
                  'orders'
                ),

                where(
                  'userId',
                  '==',
                  user.uid
                )
              )


            const snapshot =
              await getDocs(
                ordersQuery
              )


            const nextOrders =
              snapshot.docs.map(
                (
                  orderDocument
                ) => {
                  const data =
                    orderDocument.data()


                  const createdDate =
                    data.createdAt
                      ?.toDate?.() ||
                    new Date(
                      data.createdAt ||
                        0
                    )


                  const createdAtMs =
                    Number.isNaN(
                      createdDate.getTime()
                    )
                      ? 0
                      : createdDate.getTime()


                  const filterGroup =
                    data.status ===
                    ORDER_STATUS.DELIVERED
                      ? 'completed'
                      : data.status ===
                          ORDER_STATUS.CANCELLED
                        ? 'claim'
                        : 'shipping'


                  const statusTone =
                    data.status ===
                    ORDER_STATUS.SHIPPED
                      ? 'shipping'
                      : data.status ===
                          ORDER_STATUS.DELIVERED
                        ? 'completed'
                        : data.status ===
                            ORDER_STATUS.CANCELLED
                          ? 'cancelled'
                          : 'preparing'


                  return {
                    id:
                      orderDocument.id,

                    createdAt:
                      createdAtMs
                        ? new Date(
                            createdAtMs
                          )
                            .toISOString()
                            .slice(
                              0,
                              10
                            )
                        : '-',

                    createdAtMs,

                    status:
                      data.status,

                    statusTone,

                    statusLabel:
                      getOrderStatusLabel(
                        data.status
                      ),

                    filterGroup,

                    items:
                      Array.isArray(
                        data.items
                      )
                        ? data.items.map(
                            (
                              item
                            ) => ({
                              ...item,

                              name:
                                item.productName ||
                                item.name ||
                                '상품',
                            })
                          )
                        : [],

                    totalPrice:
                      Number(
                        data.totalAmount ||
                          0
                      ),
                  }
                }
              )


            if (isActive) {
              setOrders(
                nextOrders
              )
            }
          } catch (error) {
            console.error(
              '주문 내역 조회 실패:',
              error
            )

            if (isActive) {
              setOrders([])

              setLoadError(
                '주문 내역을 불러오지 못했습니다.'
              )
            }
          } finally {
            if (isActive) {
              setIsLoading(false)
            }
          }
        }
      )


    return () => {
      isActive = false

      unsubscribe()
    }
  }, [loadAttempt])


  const filteredOrders =
    useMemo(() => {
      return orders.filter(
        (order) => {
          const normalizedKeyword =
            searchKeyword.trim().toLowerCase()

          const matchesKeyword =
            !normalizedKeyword ||
            order.id.toLowerCase().includes(normalizedKeyword) ||
            order.items.some((item) =>
              String(item.name || '').toLowerCase().includes(normalizedKeyword)
            )

          if (!matchesKeyword) {
            return false
          }

          const matchesStatus =
            activeFilter ===
              'all' ||
            order.filterGroup ===
              activeFilter


          if (!matchesStatus) {
            return false
          }


          if (
            periodMonths ===
            'all'
          ) {
            return true
          }


          const periodStart =
            new Date()

          periodStart.setHours(
            0,
            0,
            0,
            0
          )

          periodStart.setMonth(
            periodStart.getMonth() -
              Number(
                periodMonths
              )
          )


          return (
            order.createdAtMs >=
            periodStart.getTime()
          )
        }
      )
    }, [
      orders,
      activeFilter,
      periodMonths,
      searchKeyword,
    ])


  const sortedOrders =
    useMemo(
      () =>
        [
          ...filteredOrders,
        ].sort(
          (a, b) =>
            b.createdAtMs -
            a.createdAtMs
        ),
      [filteredOrders]
    )


  const totalPages =
    Math.ceil(
      sortedOrders.length /
        ORDERS_PER_PAGE
    )


  const startIndex =
    (currentPage - 1) *
    ORDERS_PER_PAGE


  const visibleOrders =
    sortedOrders.slice(
      startIndex,
      startIndex +
        ORDERS_PER_PAGE
    )


  const handleFilterChange =
    (value) => {
      setActiveFilter(value)
      setCurrentPage(1)
    }


  const handlePeriodChange =
    (event) => {
      setPeriodMonths(
        event.target.value
      )

      setCurrentPage(1)
    }


  const displaySummaryStats =
    summaryStats.map(
      (stat) => ({
        ...stat,

        count:
          stat.value === 'all'
            ? orders.length
            : orders.filter(
                (order) =>
                  order.filterGroup ===
                  stat.value
              ).length,
      })
    )


  const getItemPrice = (
    item
  ) => {
    const price = Number(
      item.price ||
        item.salePrice ||
        item.productPrice ||
        0
    )

    const quantity = Number(
      item.quantity || 1
    )

    return price * quantity
  }


  return (
    <section
      className={styles.page}
      aria-labelledby="order-history-title"
    >

      <div
        className={
          styles.orderHistoryCard
        }
      >

        {/* =========================
            TITLE
        ========================= */}

        <header
          className={
            styles.pageHeader
          }
        >
          <h2
            id="order-history-title"
          >
            주문 내역
          </h2>
        </header>


        <div
          className={
            styles.titleDivider
          }
        />


        {/* =========================
            SUMMARY
        ========================= */}

        <div
          className={
            styles.summaryPanel
          }
          aria-label="주문 상태 요약"
        >

          {displaySummaryStats.map(
            (stat) => (
              <button
                key={stat.value}
                type="button"
                className={`${styles.summaryItem} ${
                  activeFilter ===
                  stat.value
                    ? styles.activeSummary
                    : ''
                }`}
                onClick={() =>
                  handleFilterChange(
                    stat.value
                  )
                }
              >

                <span
                  className={
                    styles.summaryIcon
                  }
                >
                  <SummaryIcon
                    type={stat.type}
                  />
                </span>


                <span
                  className={
                    styles.summaryLabel
                  }
                >
                  {stat.label}
                </span>


                <strong
                  className={
                    styles.summaryCount
                  }
                >
                  {stat.count}
                  <span>건</span>
                </strong>

              </button>
            )
          )}

        </div>


        {/* =========================
            TOOL BAR
        ========================= */}

        <div
          className={
            styles.controlBar
          }
        >

          <label className={styles.searchField}>
            <span className={styles.srOnly}>주문번호 또는 상품명 검색</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m16 16 4 4" />
            </svg>
            <input
              type="search"
              value={searchKeyword}
              placeholder="주문번호 · 상품명 검색"
              onChange={(event) => {
                setSearchKeyword(event.target.value)
                setCurrentPage(1)
              }}
            />
          </label>


          <label
            className={
              styles.periodSelect
            }
          >
            <span
              className={
                styles.srOnly
              }
            >
              주문 조회 기간
            </span>

            <select
              value={
                periodMonths
              }
              onChange={
                handlePeriodChange
              }
            >
              <option value="all">
                전체
              </option>

              <option value="3">
                3개월
              </option>

              <option value="6">
                6개월
              </option>

              <option value="12">
                1년
              </option>
            </select>

            <span
              className={
                styles.selectArrow
              }
              aria-hidden="true"
            />

          </label>

        </div>


        {/* =========================
            CONTENT
        ========================= */}

        {isLoading ? (

          <div
            className={
              styles.feedbackState
            }
            role="status"
          >
            <span
              className={
                styles.loadingSpinner
              }
              aria-hidden="true"
            />

            <strong>
              주문 내역을
              불러오고 있습니다.
            </strong>
          </div>

        ) : loadError ? (

          <div
            className={
              styles.feedbackState
            }
            role="alert"
          >
            <strong>
              {loadError}
            </strong>

            {firebaseUser && (
              <button
                type="button"
                onClick={() =>
                  setLoadAttempt(
                    (
                      attempt
                    ) =>
                      attempt +
                      1
                  )
                }
              >
                다시 불러오기
              </button>
            )}
          </div>

        ) : visibleOrders.length >
          0 ? (

          <div
            className={
              styles.orderList
            }
          >

            {visibleOrders.map(
              (order) => (

                <article
                  key={order.id}
                  className={
                    styles.orderCard
                  }
                >

                  {/* 주문 헤더 */}

                  <div
                    className={
                      styles.orderHeader
                    }
                  >

                    <div>
                      <strong
                        className={
                          styles.orderDate
                        }
                      >
                        {order.createdAt.replaceAll(
                          '-',
                          '.'
                        )}
                      </strong>

                      <div
                        className={
                          styles.orderSubInfo
                        }
                      >
                        <span>
                          주문번호{' '}
                          {order.id.slice(
                            0,
                            12
                          )}
                        </span>

                        <span
                          className={`${styles.orderStatus} ${
                            styles[
                              order
                                .statusTone
                            ] ||
                            ''
                          }`}
                        >
                          {
                            order.statusLabel
                          }
                        </span>
                      </div>
                    </div>


                    <Link
                      to={order.id}
                      className={
                        styles.orderMore
                      }
                      aria-label="주문 상세 보기"
                    >
                      <span>주문 상세</span>
                      <ArrowIcon />
                    </Link>

                  </div>


                  {/* 상품 목록 */}

                  <div
                    className={
                      styles.productList
                    }
                  >

                    {order.items.map(
                      (
                        item,
                        index
                      ) => (

                        <div
                          key={`${order.id}-${index}`}
                          className={
                            styles.productRow
                          }
                        >

                          <div
                            className={
                              styles.productImage
                            }
                          >
                            {item.imageUrl ? (
                              <img
                                src={
                                  item.imageUrl
                                }
                                alt={
                                  item.name
                                }
                              />
                            ) : (
                              <span>
                                IMG
                              </span>
                            )}
                          </div>


                          <div
                            className={
                              styles.productInfo
                            }
                          >

                            <strong
                              className={
                                styles.productName
                              }
                            >
                              {
                                item.name
                              }
                            </strong>


                            <p
                              className={
                                styles.productMeta
                              }
                            >
                              {formatPrice(
                                getItemPrice(
                                  item
                                )
                              )}
                              원

                              {Number(
                                item.quantity ||
                                  1
                              ) >
                                1 && (
                                <>
                                  {' '}
                                  ·{' '}
                                  {
                                    item.quantity
                                  }
                                  개
                                </>
                              )}
                            </p>

                          </div>


                          <div
                            className={
                              styles.productActions
                            }
                          >

                            {item.productId && (
                              <Link
                                to={`/shop/${item.productId}`}
                                className={
                                  styles.iconButton
                                }
                                aria-label={`${item.name} 상품 보기`}
                              >
                                <ProductArrowIcon />
                              </Link>
                            )}


                            <Link
                              to={
                                order.id
                              }
                              className={
                                styles.iconButton
                              }
                              aria-label="주문 상세 보기"
                            >
                              <OrderDetailIcon />
                            </Link>

                          </div>

                        </div>
                      )
                    )}

                  </div>


                  <div
                    className={
                      styles.orderFooter
                    }
                  >
                    <span>
                      총 결제 금액
                    </span>

                    <strong>
                      {formatPrice(
                        order.totalPrice
                      )}
                      원
                    </strong>
                  </div>

                </article>

              )
            )}

          </div>

        ) : (

          <section
            className={
              styles.emptyState
            }
            aria-label="빈 주문 내역"
          >

            <div
              className={
                styles.emptyIcon
              }
              aria-hidden="true"
            >
              <svg
                viewBox="0 0 64 64"
              >
                <path d="M16 22h32v29H16z" />
                <path d="M23 22v-7h18v7" />
                <path d="M24 34h16M24 41h11" />
              </svg>
            </div>


            <h3>
              {orders.length > 0
                ? '조건에 맞는 주문이 없습니다.'
                : '주문 내역이 없습니다.'}
            </h3>


            <p>
              {orders.length > 0
                ? '다른 조회 조건을 선택해 보세요.'
                : '자작의 다양한 상품을 만나보세요.'}
            </p>


            {orders.length === 0 && (
              <Link
                className={
                  styles.shopButton
                }
                to="/shop"
              >
                상품 보러가기
              </Link>
            )}

          </section>

        )}


        {/* =========================
            PAGINATION
        ========================= */}

        {totalPages > 1 && (
          <nav
            className={
              styles.pagination
            }
            aria-label="주문 내역 페이지"
          >

            <button
              type="button"
              disabled={
                currentPage === 1
              }
              onClick={() =>
                setCurrentPage(
                  (page) =>
                    Math.max(
                      1,
                      page - 1
                    )
                )
              }
            >
              ‹
            </button>


            {Array.from(
              {
                length:
                  totalPages,
              },
              (_, index) => {
                const pageNumber =
                  index + 1

                return (
                  <button
                    key={
                      pageNumber
                    }
                    type="button"
                    className={
                      currentPage ===
                      pageNumber
                        ? styles.activePage
                        : ''
                    }
                    onClick={() =>
                      setCurrentPage(
                        pageNumber
                      )
                    }
                  >
                    {
                      pageNumber
                    }
                  </button>
                )
              }
            )}


            <button
              type="button"
              disabled={
                currentPage ===
                totalPages
              }
              onClick={() =>
                setCurrentPage(
                  (page) =>
                    Math.min(
                      totalPages,
                      page + 1
                    )
                )
              }
            >
              ›
            </button>

          </nav>
        )}

      </div>

    </section>
  )
}


export default OrderHistory
