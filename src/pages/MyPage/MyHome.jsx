import { useEffect, useState } from 'react'
import {
  collection,
  getDocs,
  onSnapshot,
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

import StatusBadge from '../../components/mypage/StatusBadge'
import { PATHS } from '../../routes/paths'
import { cancelSavedRecommendation } from '../../services/recommendationApi'

import styles from './MyHome.module.scss'


/* =========================
   상품 이미지
   - 기존 주문 데이터에 .png가 남아 있어도
     현재 .webp 파일을 확장자와 무관하게 찾아줍니다.
========================= */

const productImages = import.meta.glob(
  '../../assets/images/products/**/*.{webp,png,jpg,jpeg,avif}',
  {
    eager: true,
    import: 'default',
  }
)

const normalizeImageFileName = (value = '') => {
  const normalizedPath = String(value)
    .split('?')[0]
    .split('#')[0]
    .replace(/\\/g, '/')

  const fileName =
    normalizedPath
      .split('/')
      .pop() || ''

  try {
    return decodeURIComponent(fileName).toLowerCase()
  } catch {
    return fileName.toLowerCase()
  }
}

const removeImageExtension = (fileName = '') =>
  fileName.replace(/\.[^.]+$/, '')

const productImageEntries =
  Object.entries(productImages).map(
    ([path, src]) => {
      const fileName =
        normalizeImageFileName(path)

      return {
        src,
        fileName,
        stem:
          removeImageExtension(
            fileName
          ),
      }
    }
  )

const resolveProductImage = (imageUrl) => {
  if (!imageUrl) return ''

  const rawUrl =
    String(imageUrl).trim()

  if (
    /^(https?:\/\/|data:|blob:)/i.test(
      rawUrl
    )
  ) {
    return rawUrl
  }

  const targetFileName =
    normalizeImageFileName(
      rawUrl
    )

  if (!targetFileName) {
    return ''
  }

  const exactMatch =
    productImageEntries.find(
      (image) =>
        image.fileName ===
        targetFileName
    )

  if (exactMatch) {
    return exactMatch.src
  }

  const targetStem =
    removeImageExtension(
      targetFileName
    )

  const stemMatch =
    productImageEntries.find(
      (image) =>
        image.stem === targetStem
    )

  return stemMatch?.src || ''
}


const formatNumber = (value) =>
  new Intl.NumberFormat('ko-KR').format(value)

const tasteAxes = [
  { key: 'sweetness', title: '단맛', options: ['dry', 'mild', 'sweet'], labels: ['깔끔한 맛', '은은한 단맛', '달콤한 맛'], empty: '아직 탐색 중' },
  { key: 'acidity', legacy: 'sourness', title: '산미', options: ['low', 'medium', 'high'], labels: ['산미가 적은 맛', '은은하게 상큼한 맛', '새콤한 맛'], empty: '상관없어요' },
  { key: 'bodyWeight', legacy: 'body', title: '무게감', options: ['light', 'medium', 'full'], labels: ['가볍고 깔끔한 술', '적당한 무게감의 술', '진하고 묵직한 술'], empty: '아직 탐색 중' },
  { key: 'scentIntensity', legacy: 'aroma', title: '향', options: ['mild', 'medium', 'strong'], labels: ['은은한 향', '적당히 느껴지는 향', '뚜렷한 향'], empty: '상관없어요' },
  { key: 'alcoholRange', legacy: 'abv', title: '도수', options: ['light', 'moderate', 'strong', 'veryStrong'], labels: ['10도 이하', '11~16도', '17~25도', '26도 이상'], empty: '상관없어요' },
]

const getTasteRows = (preference) => tasteAxes.map((axis) => {
  const rawValue = preference?.[axis.key] ?? preference?.[axis.legacy]
  const value = Array.isArray(rawValue) ? rawValue[0] : rawValue
  let index = axis.options.indexOf(value)

  if (axis.key === 'alcoholRange') {
    if (value && typeof value === 'object') {
      if (value.min >= 26) index = 3
      else if (value.min >= 17) index = 2
      else if (value.min >= 11) index = 1
      else if (typeof value.max === 'number' && value.max <= 10) index = 0
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      index = value <= 10 ? 0 : value <= 16 ? 1 : value <= 25 ? 2 : 3
    }
  } else if (typeof value === 'number' && value >= 1 && value <= 5) {
    index = value <= 2 ? 0 : value >= 4 ? 2 : 1
  }

  return { ...axis, index, label: axis.labels[index] ?? axis.empty }
})


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
  const [savedRecommendations, setSavedRecommendations] = useState([])
  const [isAiLoading, setIsAiLoading] = useState(true)
  const [aiLoadError, setAiLoadError] = useState('')
  const [isCancellingSave, setIsCancellingSave] = useState(false)
  const [cancelSaveMessage, setCancelSaveMessage] = useState('')
  const handleCancelSave = async (id) => {
    if (isCancellingSave) return
    setIsCancellingSave(true)
    setCancelSaveMessage('')
    try {
      await cancelSavedRecommendation(id)
      setCancelSaveMessage('저장을 취소했어요. 전체 AI 추천 기록은 유지됩니다.')
    } catch {
      setCancelSaveMessage('저장 취소에 실패했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsCancellingSave(false)
    }
  }

  useEffect(() => {
    let unsubscribeRecommendations = () => {}
    const unsubscribeAuth = subscribeToAuthState((user) => {
      unsubscribeRecommendations()
      setSavedRecommendations([])
      setAiLoadError('')
      if (!user || user.isAnonymous) {
        setIsAiLoading(false)
        return
      }
      setIsAiLoading(true)
      unsubscribeRecommendations = onSnapshot(
        query(collection(db, 'users', user.uid, 'recommendations'), where('isSaved', '==', true)),
        (snapshot) => {
          const records = snapshot.docs.map((record) => {
            const data = record.data()
            const createdAt = data.createdAt?.toDate?.() ?? new Date(data.createdAt ?? 0)
            return { ...data, id: record.id, createdAtMs: Number.isNaN(createdAt.getTime()) ? 0 : createdAt.getTime() }
          })
          setSavedRecommendations(records.sort((a, b) => b.createdAtMs - a.createdAtMs).slice(0, 3))
          setIsAiLoading(false)
        },
        () => {
          setAiLoadError('저장한 AI 추천을 불러오지 못했어요. 추천 기록에서 다시 확인해주세요.')
          setIsAiLoading(false)
        }
      )
    })
    return () => {
      unsubscribeAuth()
      unsubscribeRecommendations()
    }
  }, [])

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


  const preference = userData?.userPreference
  const hasPreference = preference && tasteAxes.some((axis) =>
    Object.hasOwn(preference, axis.key) || (axis.legacy && Object.hasOwn(preference, axis.legacy))
  )
  const tasteRows = getTasteRows(preference)
  const tasteDescription = [
    tasteRows.slice(0, 2).find((row) => row.index >= 0),
    tasteRows[2].index >= 0 ? tasteRows[2] : null,
  ].filter(Boolean).map((row) => row.label).join('과 ')


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


  /* =========================
     상단 요약
  ========================= */

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
        [
          ORDER_STATUS.PREPARING,
          ORDER_STATUS.SHIPPED,
        ].includes(order.rawStatus)
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
            <img
              src={profileAvatar.src}
              alt={`${memberName} 프로필`}
             loading="lazy" decoding="async" />
          </div>


          <div
            className={
              styles.profileCopy
            }
          >
            {tasteDescription && (
              <p className={styles.tasteGreeting}>
                <strong>{tasteDescription}</strong>을 좋아하시는
              </p>
            )}
            <div
              className={
                styles.greetingRow
              }
            >
              <strong>
                {memberName}
              </strong>

              <span>
                나으리님! 어서 오세요.
              </span>
            </div>


            <p>
              오늘도 나으리의 입맛에 맞는 주안상을 찾아드릴게요.
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
            나의 취향 분석 - PC
        ========================= */}

        <section
          className={`${styles.section} ${styles.desktopTasteSection}`}
          aria-labelledby="home-taste-title"
        >
          <div className={styles.sectionHeading}>
            <div>
              <h3 id="home-taste-title">나의 취향 분석</h3>
            </div>
          </div>

          {hasPreference ? (
            <div className={styles.tasteTable}>
              <table>
                <caption className={styles.srOnly}>
                  저장된 설문 답변에 따른 취향 분석
                </caption>

                <thead>
                  <tr>
                    <th scope="col">취향</th>
                    <th scope="col">선호 정도</th>
                    <th scope="col">나의 답변</th>
                  </tr>
                </thead>

                <tbody>
                  {tasteRows.map((row) => (
                    <tr key={row.key}>
                      <th scope="row">
                        {row.title}
                      </th>

                      <td>
                        <div
                          className={styles.tasteScale}
                          aria-hidden="true"
                        >
                          {row.options.map(
                            (option, index) => (
                              <span
                                key={option}
                                className={
                                  index <= row.index
                                    ? styles.tasteSelected
                                    : undefined
                                }
                              />
                            )
                          )}
                        </div>
                      </td>

                      <td>
                        {row.label}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className={styles.emptyState}>
              아직 등록된 취향이 없어요. 나으리의 입맛을 알려주세요.
            </p>
          )}

          <div className={styles.tasteActions}>
            <Link
              to={PATHS.preference}
              className={styles.moreLink}
            >
              {hasPreference
                ? '취향 다시 설정하기'
                : '내 취향 알아보기'}
            </Link>

            <Link
              to={PATHS.ai}
              className={styles.recommendButton}
            >
              오늘의 주안상 추천받기
            </Link>
          </div>
        </section>


        {/* =========================
            나의 취향 분석 - MOBILE
        ========================= */}

        <section
          className={styles.mobileTasteSection}
          aria-labelledby="mobile-home-taste-title"
        >
          <div className={styles.mobileTasteHeading}>
            <div>
              <h3 id="mobile-home-taste-title">
                나의 취향
              </h3>

              <p>
                막동이가 기억하고 있는 나리의 취향이에요.
              </p>
            </div>
          </div>

          {hasPreference ? (
            <div className={styles.mobileTasteCard}>
              <div className={styles.mobileTasteIntro}>
                <span>
                  막동이가 기억한 취향
                </span>

                <strong>
                  {tasteDescription
                    ? `${tasteDescription}을 좋아하시네요!`
                    : '나리의 취향을 차곡차곡 기억하고 있어요.'}
                </strong>
              </div>

              <div className={styles.mobileTasteList}>
                {tasteRows.map((row) => (
                  <div
                    key={row.key}
                    className={styles.mobileTasteRow}
                  >
                    <span className={styles.mobileTasteLabel}>
                      {row.title}
                    </span>

                    <div
                      className={styles.mobileTasteScale}
                      aria-hidden="true"
                    >
                      {row.options.map(
                        (option, index) => (
                          <span
                            key={option}
                            className={
                              index <= row.index
                                ? styles.mobileTasteSelected
                                : undefined
                            }
                          />
                        )
                      )}
                    </div>

                    <span className={styles.mobileTasteAnswer}>
                      {row.label}
                    </span>
                  </div>
                ))}
              </div>

              <Link
                to={PATHS.preference}
                className={styles.mobileTasteLink}
              >
                내 취향 자세히 보기

                <span aria-hidden="true">
                  ›
                </span>
              </Link>
            </div>
          ) : (
            <div className={styles.mobileTasteEmpty}>
              <strong>
                아직 등록된 취향이 없어요.
              </strong>

              <p>
                몇 가지 질문에 답하고 나리의 취향을 알려주세요.
              </p>

              <Link
                to={PATHS.preference}
                className={styles.mobileTasteLink}
              >
                내 취향 알아보기

                <span aria-hidden="true">
                  ›
                </span>
              </Link>
            </div>
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
                      {resolveProductImage(order.imageUrl) ? (
                        <img
                          src={
                            resolveProductImage(
                              order.imageUrl
                            )
                          }
                          alt=""
                         loading="lazy" decoding="async" />
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
                      <StatusBadge
                        tone={
                          order.status
                        }
                      >
                        {
                          order.statusLabel
                        }
                      </StatusBadge>


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

            </div>
            <Link to="ai-history" className={styles.moreLink}>추천 기록 전체 보기 ›</Link>
          </div>


          <div
            className={
              styles.aiBox
            }
          >
            {isAiLoading ? (
              <p className={styles.emptyState} role="status">저장한 추천을 불러오는 중이에요.</p>
            ) : aiLoadError ? (
              <p className={styles.emptyState} role="alert">{aiLoadError}</p>
            ) : savedRecommendations.length > 0 ? savedRecommendations.map((record) => (
              <article key={record.id} className={styles.aiItem}>
                <div className={styles.aiCopy}>
                  <strong>{record.createdAtMs ? `${formatDate(new Date(record.createdAtMs))}의 ` : ''}나만의 주안상</strong>
                  <span>저장한 추천 · 주안상 {Array.isArray(record.recommendations) ? record.recommendations.length : 0}개</span>
                </div>
                <div className={styles.aiActions}>
                  <Link to={`ai-history/${record.id}`} className={styles.recommendButton}>상세 보기</Link>
                  <button type="button" className={styles.cancelSaveButton} disabled={isCancellingSave}
                    onClick={() => handleCancelSave(record.id)}>저장 취소</button>
                </div>
              </article>
            )) : <div
              className={
                styles.aiEmpty
              }
            >
              <div>
                <strong>
                  저장된 AI 추천 기록이 없습니다.
                </strong>

                <span>
                  취향 설문을 완료하고
                  나만의 전통주를
                  추천받아보세요.
                </span>
              </div>


              <Link
                to={PATHS.ai}
                className={
                  styles.recommendButton
                }
              >
                추천받기
              </Link>
            </div>}
          </div>
          {cancelSaveMessage && <p role="status">{cancelSaveMessage}</p>}

        </section>

      </div>
    </section>
  )
}


export default MyHome
