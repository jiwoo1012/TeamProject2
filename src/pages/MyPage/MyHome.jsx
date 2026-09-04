import { useEffect, useState } from 'react'
import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore'
import { Link, useOutletContext } from 'react-router-dom'

import {
  getOrderStatusLabel,
  ORDER_STATUS,
} from '../../constants/orderStatus'

import {
  subscribeToAuthState,
  getCurrentUserData,
} from '../../firebase/auth'

import { getCollection } from '../../firebase/firestore'
import { db } from '../../firebase/firebase'

import styles from './MyHome.module.scss'


const formatNumber = (value) =>
  new Intl.NumberFormat('ko-KR').format(value)


const formatDate = (date) => {
  if (!date) return '-'

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
    .format(date)
    .replace(/\. /g, '.')
    .replace(/\.$/, '')
}


/* =========================
   상단 혜택 아이콘
========================= */

const BenefitIcon = ({ type }) => {
  const icons = {
    order: (
      <>
        <path d="M6 5h12v15H6z" />
        <path d="M9 5V3h6v2M9 10h6M9 14h4" />
      </>
    ),

    shipping: (
      <>
        <path d="M3 7h11v10H3z" />
        <path d="M14 10h4l3 3v4h-7z" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
      </>
    ),

    wishlist: (
      <path d="M12 20.5s-7-4.4-7-10A4 4 0 0 1 12 7.8a4 4 0 0 1 7 2.7c0 5.6-7 10-7 10Z" />
    ),

    coupon: (
      <>
        <path d="M4 7h16v10H4z" />
        <path d="M9 7v10" />
        <path d="M15 7v10" />
      </>
    ),

    inquiry: (
      <>
        <path d="M5 5h14v11H9l-4 3z" />
        <path d="M9 9h6" />
        <path d="M9 12h4" />
      </>
    ),

    point: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M10 8h3a3 3 0 0 1 0 6h-3z" />
        <path d="M10 14v3" />
      </>
    ),
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[type]}
    </svg>
  )
}


const MyHome = () => {
  const { profileAvatar } = useOutletContext()
  const [firebaseUser, setFirebaseUser] =
    useState(null)

  const [userData, setUserData] =
    useState(null)

  const [orders, setOrders] =
    useState([])

  const [wishlistCount, setWishlistCount] =
    useState(0)

  const [
    orderLoadError,
    setOrderLoadError,
  ] = useState('')


  useEffect(() => {
    const unsubscribe =
      subscribeToAuthState(
        async (user) => {
          setFirebaseUser(user)

          if (!user) {
            setUserData(null)
            setOrders([])
            setWishlistCount(0)

            setOrderLoadError(
              '로그인 후 주문 내역을 확인할 수 있습니다.'
            )

            return
          }


          /* =========================
             회원 정보 / 찜
          ========================= */

          try {
            const [
              data,
              wishlist,
            ] = await Promise.all([
              getCurrentUserData(
                user.uid
              ),

              getCollection(
                `users/${user.uid}/wishlist`
              ),
            ])

            setUserData(data)

            setWishlistCount(
              wishlist.length
            )
          } catch (error) {
            console.error(
              '마이페이지 회원정보 조회 실패:',
              error
            )

            setUserData(null)
          }


          /* =========================
             주문
          ========================= */

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
                (orderDocument) => {
                  const order =
                    orderDocument.data()


                  const createdDate =
                    order.createdAt
                      ?.toDate?.() ||
                    new Date(
                      order.createdAt ||
                        0
                    )


                  const createdAtMs =
                    Number.isNaN(
                      createdDate.getTime()
                    )
                      ? 0
                      : createdDate.getTime()


                  const firstItem =
                    order.items?.[0]


                  const itemCount =
                    Array.isArray(
                      order.items
                    )
                      ? order.items.reduce(
                          (
                            sum,
                            item
                          ) =>
                            sum +
                            Number(
                              item.quantity ||
                                0
                            ),
                          0
                        )
                      : 0


                  const statusTone =
                    order.status ===
                    ORDER_STATUS.SHIPPED
                      ? 'shipping'
                      : order.status ===
                          ORDER_STATUS.DELIVERED
                        ? 'completed'
                        : order.status ===
                            ORDER_STATUS.CANCELLED
                          ? 'cancelled'
                          : 'preparing'


                  return {
                    id:
                      orderDocument.id,

                    title:
                      firstItem
                        ? `${
                            firstItem.productName
                          }${
                            order.items
                              .length >
                            1
                              ? ` 외 ${
                                  order
                                    .items
                                    .length -
                                  1
                                }개`
                              : ''
                          }`
                        : '주문 상품',

                    orderedAt:
                      createdAtMs
                        ? formatDate(
                            new Date(
                              createdAtMs
                            )
                          )
                        : '-',

                    createdAtMs,

                    itemCount,

                    status:
                      statusTone,

                    statusLabel:
                      getOrderStatusLabel(
                        order.status
                      ),

                    imageUrl:
                      firstItem?.imageUrl ||
                      '',

                    rawStatus:
                      order.status,
                  }
                }
              )


            setOrders(
              nextOrders
            )

            setOrderLoadError('')
          } catch (error) {
            console.error(
              '마이페이지 주문 조회 실패:',
              error
            )

            setOrders([])

            setOrderLoadError(
              '주문 정보를 불러오지 못했습니다.'
            )
          }
        }
      )


    return unsubscribe
  }, [])


  /* =========================
     사용자 데이터
  ========================= */

  const memberName =
    userData?.nickname ||
    firebaseUser?.displayName ||
    firebaseUser?.email?.split(
      '@'
    )[0] ||
    '회원'


  const membership =
    firebaseUser
      ? userData?.role ===
        'admin'
        ? '관리자'
        : '나리님'
      : '나리님'


  const points =
    firebaseUser
      ? Number(
          userData?.points ?? 0
        )
      : 0


  /* =========================
     최근 주문
  ========================= */

  const recentOrders = [
    ...orders,
  ]
    .sort(
      (a, b) =>
        b.createdAtMs -
        a.createdAtMs
    )
    .slice(0, 3)


  const benefits = [
    {
      key: 'order',

      label: '전체 주문',

      value:
        orders.length,

      unit: '건',

      to: 'orders',
    },

    {
      key: 'shipping',

      label: '배송 진행',

      value: orders.filter((order) =>
        [ORDER_STATUS.PREPARING, ORDER_STATUS.SHIPPED].includes(order.rawStatus)
      ).length,

      unit: '건',

      to: 'orders',
    },

    {
      key: 'wishlist',

      label: '찜',

      value:
        wishlistCount,

      unit: '개',

      to: 'wishlist',
    },

    {
      key: 'point',

      label: '포인트',

      value:
        formatNumber(points),

      unit: 'P',
    },
  ]


  return (
    <section
      className={styles.page}
      aria-labelledby="my-home-title"
    >

      <h2
        id="my-home-title"
        className={styles.srOnly}
      >
        마이페이지 홈
      </h2>


      <div
        className={
          styles.dashboardCard
        }
      >

        {/* =========================
            상단 사용자 정보
        ========================= */}

        <header
          className={
            styles.profileHeader
          }
        >
          <div
            className={
              styles.avatar
            }
          >
            <img src={profileAvatar.src} alt={`${memberName} 프로필`} />
          </div>


          <div
            className={
              styles.profileCopy
            }
          >
            <div
              className={
                styles.greetingRow
              }
            >
              <strong>
                {memberName}
              </strong>

              <span>
                {membership},
                환영합니다!
              </span>
            </div>


            <p>
              오늘도 자작과 함께,
              나만의 시간을
              즐겨보세요!
            </p>
          </div>
        </header>


        <div
          className={
            styles.headerDivider
          }
        />


        {/* =========================
            혜택
        ========================= */}

        <section
          className={
            styles.benefitPanel
          }
          aria-label="회원 혜택"
        >
          {benefits.map(
            (benefit) => {
              const content = (
                <>
                  <span
                    className={
                      styles.benefitIcon
                    }
                  >
                    <BenefitIcon
                      type={
                        benefit.key
                      }
                    />
                  </span>


                  <span
                    className={
                      styles.benefitLabel
                    }
                  >
                    {benefit.label}
                  </span>


                  <strong>
                    {benefit.value}
                    <em>
                      {
                        benefit.unit
                      }
                    </em>
                  </strong>
                </>
              )


              if (!benefit.to) {
                return (
                  <div
                    key={
                      benefit.key
                    }
                    className={
                      styles.benefitItem
                    }
                  >
                    {content}
                  </div>
                )
              }


              return (
                <Link
                  key={
                    benefit.key
                  }
                  to={
                    benefit.to
                  }
                  className={
                    styles.benefitItem
                  }
                >
                  {content}
                </Link>
              )
            }
          )}
        </section>


        {/* =========================
            최근 주문
        ========================= */}

        <section
          className={
            styles.section
          }
          aria-labelledby="recent-orders-title"
        >

          <div
            className={
              styles.sectionHeading
            }
          >
            <div>
              <h3
                id="recent-orders-title"
              >
                최근 주문
              </h3>

              <p>
                최근 구매한 상품과
                배송 상태를 확인할 수
                있어요
              </p>
            </div>


            <Link
              to="orders"
              className={
                styles.moreLink
              }
            >
              주문 내역 전체 보기
              <span
                aria-hidden="true"
              >
                ›
              </span>
            </Link>
          </div>


          <div
            className={
              styles.orderBox
            }
          >
            {orderLoadError && (
              <div
                className={
                  styles.emptyState
                }
                role="alert"
              >
                {orderLoadError}
              </div>
            )}


            {!orderLoadError &&
              recentOrders.length ===
                0 && (
                <div
                  className={
                    styles.emptyState
                  }
                >
                  최근 주문 내역이
                  없습니다.
                </div>
              )}


            {!orderLoadError &&
              recentOrders.map(
                (order) => (
                  <article
                    key={
                      order.id
                    }
                    className={
                      styles.orderItem
                    }
                  >

                    <div
                      className={
                        styles.productThumb
                      }
                    >
                      {order.imageUrl ? (
                        <img
                          src={
                            order.imageUrl
                          }
                          alt=""
                        />
                      ) : (
                        <span>
                          IMG
                        </span>
                      )}
                    </div>


                    <div
                      className={
                        styles.orderCopy
                      }
                    >
                      <strong>
                        {
                          order.title
                        }
                      </strong>

                      <span>
                        {
                          order.orderedAt
                        }{' '}
                        주문 ·{' '}
                        {
                          order.itemCount
                        }
                        개
                      </span>
                    </div>


                    <div
                      className={
                        styles.orderActions
                      }
                    >

                      <span
                        className={`${styles.statusBadge} ${
                          styles[
                            order
                              .status
                          ] || ''
                        }`}
                      >
                        {
                          order.statusLabel
                        }
                      </span>


                      <Link
                        to={`orders/${order.id}`}
                        className={
                          styles.detailButton
                        }
                      >
                        상세 보기
                      </Link>

                    </div>

                  </article>
                )
              )}
          </div>

        </section>


        {/* =========================
            AI 추천
        ========================= */}

        <section
          className={
            styles.section
          }
          aria-labelledby="ai-title"
        >

          <div
            className={
              styles.sectionHeading
            }
          >
            <div>
              <h3 id="ai-title">
                AI 추천
              </h3>

              <p>
                당신의 취향에 맞는
                전통주를 다시
                추천받아보세요
              </p>
            </div>


          </div>


          <div
            className={
              styles.aiBox
            }
          >
            <div className={styles.aiEmpty}>
              <div>
                <strong>저장된 AI 추천 기록이 없습니다.</strong>
                <span>취향 설문을 완료하고 나만의 전통주를 추천받아보세요.</span>
              </div>
              <Link to="/ai" className={styles.recommendButton}>추천받기</Link>
            </div>
          </div>

        </section>

      </div>
    </section>
  )
}


export default MyHome
