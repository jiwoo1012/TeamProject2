import { useEffect, useMemo, useState } from 'react'
import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore'
import { Link } from 'react-router-dom'

import { subscribeToAuthState } from '../../firebase/auth'
import { db } from '../../firebase/firebase'
import { fetchProducts } from '../../services/productCatalog'

import styles from './FrequentPurchase.module.scss'


const productImages = import.meta.glob(
  '../../assets/images/products/product*.png',
  {
    eager: true,
    import: 'default',
  }
)


const resolveImage = (imageUrl) => {
  if (!imageUrl) return ''

  return Object.entries(
    productImages
  ).find(([path]) =>
    path.endsWith(`/${imageUrl}`)
  )?.[1]
}


const SORT_OPTIONS = [
  {
    label: '구매 횟수 순',
    value: 'count',
  },
  {
    label: '최근 구매 순',
    value: 'recent',
  },
]


const formatPrice = (value) =>
  Number(value || 0).toLocaleString('ko-KR')


const formatDate = (value) => {
  if (!value) return '-'

  const date =
    value?.toDate?.() ||
    new Date(value)

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '-'
  }

  return new Intl.DateTimeFormat(
    'ko-KR',
    {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }
  )
    .format(date)
    .replaceAll(' ', '')
}


const PinIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m14 4 6 6" />
    <path d="m13 5 6 6" />
    <path d="m16 8-5 5" />
    <path d="m10 12-5 1 6 6 1-5" />
    <path d="m8 16-4 4" />
  </svg>
)


const CartIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 5h2l2 10h9l2-7H7" />
    <circle cx="10" cy="19" r="1" />
    <circle cx="17" cy="19" r="1" />
  </svg>
)


const FrequentPurchase = () => {
  const [
    currentUser,
    setCurrentUser,
  ] = useState(undefined)

  const [orders, setOrders] =
    useState([])

  const [
    catalogProducts,
    setCatalogProducts,
  ] = useState([])

  const [
    isCatalogLoading,
    setIsCatalogLoading,
  ] = useState(true)

  const [sortBy, setSortBy] =
    useState('count')

  const [
    isLoading,
    setIsLoading,
  ] = useState(true)

  const [
    loadError,
    setLoadError,
  ] = useState('')


  /* =========================
     로그인 상태
  ========================= */

  useEffect(() => {
    let isCancelled = false

    fetchProducts()
      .then((items) => {
        if (!isCancelled) {
          setCatalogProducts(items)
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsCatalogLoading(false)
        }
      })

    return () => {
      isCancelled = true
    }
  }, [])


  useEffect(() => {
    const unsubscribe =
      subscribeToAuthState(
        setCurrentUser
      )

    return unsubscribe
  }, [])


  /* =========================
     주문 내역 불러오기
  ========================= */

  useEffect(() => {
    let isMounted = true


    if (
      currentUser === undefined
    ) {
      return undefined
    }


    if (!currentUser) {
      setOrders([])
      setIsLoading(false)

      return undefined
    }


    const loadOrders =
      async () => {
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
                currentUser.uid
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


                return {
                  id:
                    orderDocument.id,

                  createdAt:
                    data.createdAt,

                  createdAtMs,

                  items:
                    Array.isArray(
                      data.items
                    )
                      ? data.items
                      : [],
                }
              }
            )


          if (isMounted) {
            setOrders(
              nextOrders
            )
          }
        } catch (error) {
          console.error(
            '자주 구매 상품 조회 실패:',
            error
          )


          if (isMounted) {
            setOrders([])

            setLoadError(
              '자주 구매한 상품을 불러오지 못했습니다.'
            )
          }
        } finally {
          if (isMounted) {
            setIsLoading(false)
          }
        }
      }


    loadOrders()


    return () => {
      isMounted = false
    }
  }, [currentUser])


  /* =========================
     상품별 구매 횟수 계산
  ========================= */

  const frequentProducts =
    useMemo(() => {
      const productMap =
        new Map()


      orders.forEach(
        (order) => {
          /*
           * 같은 주문 안에서 동일 상품이
           * 여러 번 들어 있어도
           * '구매 횟수'는 한 번으로 계산
           */
          const countedProducts =
            new Set()


          order.items.forEach(
            (item) => {
              const productId =
                item.productId


              if (!productId) {
                return
              }


              const productData =
                catalogProducts.find(
                  (product) =>
                    product.productId ===
                    productId
                )


              const current =
                productMap.get(
                  productId
                ) || {
                  productId,

                  productName:
                    item.productName ||
                    productData
                      ?.productName ||
                    productData?.name ||
                    '상품',

                  price:
                    Number(
                      item.price ??
                        productData?.price ??
                        productData
                          ?.salePrice ??
                        0
                    ),

                  imageUrl:
                    item.imageUrl ||
                    productData
                      ?.imageUrl ||
                    '',

                  purchaseCount:
                    0,

                  totalQuantity:
                    0,

                  recentPurchaseAt:
                    0,

                  recentPurchaseRaw:
                    null,
                }


              if (
                !countedProducts.has(
                  productId
                )
              ) {
                current.purchaseCount +=
                  1

                countedProducts.add(
                  productId
                )
              }


              current.totalQuantity +=
                Number(
                  item.quantity ||
                    1
                )


              if (
                order.createdAtMs >
                current.recentPurchaseAt
              ) {
                current.recentPurchaseAt =
                  order.createdAtMs

                current.recentPurchaseRaw =
                  order.createdAt
              }


              productMap.set(
                productId,
                current
              )
            }
          )
        }
      )


      const result =
        Array.from(
          productMap.values()
        )
          .filter(
            (product) =>
              product.purchaseCount >= 2
          )
          .map(
          (product) => ({
            ...product,

            imageSrc:
              resolveImage(
                product.imageUrl
              ) ||
              product.imageUrl,
          })
        )


      if (
        sortBy === 'recent'
      ) {
        return result.sort(
          (a, b) =>
            b.recentPurchaseAt -
            a.recentPurchaseAt
        )
      }


      return result.sort(
        (a, b) => {
          if (
            b.purchaseCount !==
            a.purchaseCount
          ) {
            return (
              b.purchaseCount -
              a.purchaseCount
            )
          }

          return (
            b.recentPurchaseAt -
            a.recentPurchaseAt
          )
        }
      )
    }, [
      orders,
      sortBy,
      catalogProducts,
    ])


  return (
    <section
      className={styles.page}
      aria-labelledby="frequent-purchase-title"
    >

      <div
        className={
          styles.frequentCard
        }
      >

        {/* =====================
            HEADER
        ===================== */}

        <header
          className={
            styles.pageHeader
          }
        >
          <h2
            id="frequent-purchase-title"
          >
            자주 산 상품
          </h2>
        </header>


        <div
          className={
            styles.titleDivider
          }
        />


        {/* =====================
            TOOL BAR
        ===================== */}

        <div
          className={
            styles.listHeader
          }
        >
          <div
            className={
              styles.countArea
            }
          >
            <span>
              총
            </span>

            <strong>
              {
                frequentProducts.length
              }
            </strong>

            <span>
              개
            </span>


            {frequentProducts.length >
              0 && (
              <span
                className={
                  styles.recommendBadge
                }
              >
                구매횟수가 높은 상품을
                모았어요
              </span>
            )}
          </div>


          <div
            className={
              styles.sortArea
            }
          >
            {SORT_OPTIONS.map(
              (
                option,
                index
              ) => (
                <button
                  key={
                    option.value
                  }
                  type="button"
                  className={`${styles.sortButton} ${
                    sortBy ===
                    option.value
                      ? styles.activeSort
                      : ''
                  }`}
                  onClick={() =>
                    setSortBy(
                      option.value
                    )
                  }
                >
                  {
                    option.label
                  }

                  {index ===
                    0 && (
                    <span
                      className={
                        styles.sortDivider
                      }
                      aria-hidden="true"
                    >
                      |
                    </span>
                  )}
                </button>
              )
            )}
          </div>
        </div>


        {/* =====================
            CONTENT
        ===================== */}

        {isLoading || isCatalogLoading ? (

          <div
            className={
              styles.stateBox
            }
            role="status"
          >
            자주 구매한 상품을
            불러오는 중입니다.
          </div>

        ) : loadError ? (

          <div
            className={
              styles.stateBox
            }
            role="alert"
          >
            {loadError}
          </div>

        ) : frequentProducts.length >
          0 ? (

          <div
            className={
              styles.productGrid
            }
          >
            {frequentProducts.map(
              (
                product,
                index
              ) => (
                <article
                  key={
                    product.productId
                  }
                  className={
                    styles.productCard
                  }
                >

                  <div
                    className={
                      styles.imageArea
                    }
                  >
                    <Link
                      to={`/shop/${product.productId}`}
                      className={
                        styles.imageLink
                      }
                    >
                      {product.imageSrc ? (
                        <img
                          src={
                            product.imageSrc
                          }
                          alt={
                            product.productName
                          }
                        />
                      ) : (
                        <div
                          className={
                            styles.imagePlaceholder
                          }
                          aria-hidden="true"
                        />
                      )}
                    </Link>


                    <span
                      className={
                        styles.rankBadge
                      }
                    >
                      {index + 1}
                    </span>


                    <span
                      className={
                        styles.pinIcon
                      }
                      aria-hidden="true"
                    >
                      <PinIcon />
                    </span>
                  </div>


                  <div
                    className={
                      styles.productInfo
                    }
                  >
                    <span
                      className={
                        styles.category
                      }
                    >
                      자주 구매
                    </span>


                    <Link
                      to={`/shop/${product.productId}`}
                      className={
                        styles.productName
                      }
                    >
                      {
                        product.productName
                      }
                    </Link>


                    <strong
                      className={
                        styles.price
                      }
                    >
                      {formatPrice(
                        product.price
                      )}
                      원
                    </strong>


                    <div
                      className={
                        styles.purchaseMeta
                      }
                    >
                      <span>
                        {
                          product.purchaseCount
                        }
                        회 구매
                      </span>


                      <span>
                        최근{' '}
                        {formatDate(
                          product.recentPurchaseRaw
                        )}
                      </span>
                    </div>


                    <Link
                      to={`/shop/${product.productId}`}
                      className={
                        styles.buyAgainButton
                      }
                    >
                      <CartIcon />

                      다시 구매
                    </Link>
                  </div>

                </article>
              )
            )}
          </div>

        ) : (

          <div
            className={
              styles.emptyState
            }
          >
            <span
              className={
                styles.emptyIcon
              }
              aria-hidden="true"
            >
              ↔
            </span>

            <strong>
              아직 자주 구매한
              상품이 없습니다.
            </strong>

            <p>
              상품을 구매하면 자주
              찾는 상품을 이곳에서
              확인할 수 있어요.
            </p>

            <Link
              to="/shop"
              className={
                styles.shopButton
              }
            >
              상품 둘러보기
            </Link>
          </div>

        )}


        {/* =====================
            INFO
        ===================== */}

        {frequentProducts.length >
          0 && (
          <div
            className={
              styles.infoText
            }
          >
            <p>
              · 구매 완료된 주문을
              기준으로 자주 구매한
              상품을 보여드려요.
            </p>

            <p>
              · 구매 횟수가 같은
              상품은 최근 구매한
              상품이 먼저 표시돼요.
            </p>
          </div>
        )}

      </div>

    </section>
  )
}


export default FrequentPurchase
