import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore'

import { Link } from 'react-router-dom'

import {
  getCurrentUserData,
  subscribeToAuthState,
} from '../../firebase/auth'

import {
  updateDocument,
} from '../../firebase/firestore'

import { db } from '../../firebase/firebase'

import {
  fetchProducts,
} from '../../services/productCatalog'

import {
  getCart,
  saveCart,
} from '../../utils/cartStorage'

import MyPageHeader from '../../components/mypage/MyPageHeader'
import ProductActionBar from '../../components/shop/ProductActionBar'

import styles from './FrequentPurchase.module.scss'


const ITEMS_PER_PAGE = 6
const CART_BAR_DURATION = 3200


const productImages = import.meta.glob(
  '../../assets/webpImages/images/products/product*.webp',
  {
    eager: true,
    import: 'default',
  }
)


const resolveImage = (imageUrl) => {
  if (!imageUrl) return ''

  if (
    /^(data:|https?:\/\/)/.test(
      imageUrl
    )
  ) {
    return imageUrl
  }

  return Object.entries(
    productImages
  ).find(([path]) =>
    (path.endsWith(`/${imageUrl}`) || path.endsWith((`/${imageUrl}`).replace(/\.(png|jpe?g)$/i, '.webp')))
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
  Number(value || 0).toLocaleString(
    'ko-KR'
  )


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


/* =========================
   PIN ICON
========================= */

const PinIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
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


/* =========================
   CART ICON
========================= */

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
    <circle
      cx="10"
      cy="19"
      r="1"
    />
    <circle
      cx="17"
      cy="19"
      r="1"
    />
  </svg>
)


const FrequentPurchase = () => {
  const cartBarTimerRef =
    useRef(null)


  const [
    currentUser,
    setCurrentUser,
  ] = useState(undefined)


  const [
    orders,
    setOrders,
  ] = useState([])


  const [
    catalogProducts,
    setCatalogProducts,
  ] = useState([])


  const [
    isCatalogLoading,
    setIsCatalogLoading,
  ] = useState(true)


  const [
    sortBy,
    setSortBy,
  ] = useState('count')


  const [
    isLoading,
    setIsLoading,
  ] = useState(true)


  const [
    loadError,
    setLoadError,
  ] = useState('')


  const [
    pinnedIds,
    setPinnedIds,
  ] = useState([])


  const [
    pinNotice,
    setPinNotice,
  ] = useState('')


  const [
    isPinUpdating,
    setIsPinUpdating,
  ] = useState(false)


  const [
    currentPage,
    setCurrentPage,
  ] = useState(1)


  /* =========================
     CART ACTION BAR
  ========================= */

  const [
    isCartBarVisible,
    setIsCartBarVisible,
  ] = useState(false)


  const [
    cartBarItems,
    setCartBarItems,
  ] = useState([])


  /* =========================
     상품 카탈로그
  ========================= */

  useEffect(() => {
    let isCancelled = false


    fetchProducts()
      .then((items) => {
        if (isCancelled) {
          return
        }

        setCatalogProducts(
          items
        )
      })

      .catch((error) => {
        console.error(
          '상품 카탈로그 조회 실패:',
          error
        )
      })

      .finally(() => {
        if (!isCancelled) {
          setIsCatalogLoading(
            false
          )
        }
      })


    return () => {
      isCancelled = true
    }
  }, [])


  /* =========================
     로그인 상태
  ========================= */

  useEffect(() => {
    const unsubscribe =
      subscribeToAuthState(
        setCurrentUser
      )

    return unsubscribe
  }, [])


  /* =========================
     TIMER CLEANUP
  ========================= */

  useEffect(() => {
    return () => {
      if (
        cartBarTimerRef.current
      ) {
        window.clearTimeout(
          cartBarTimerRef.current
        )
      }
    }
  }, [])


  /* =========================
     고정핀 불러오기
  ========================= */

  useEffect(() => {
    let isMounted = true


    if (
      currentUser === undefined
    ) {
      return undefined
    }


    if (!currentUser) {
      setPinnedIds([])

      return undefined
    }


    const loadPins =
      async () => {
        try {
          const userData =
            await getCurrentUserData(
              currentUser.uid
            )


          if (!isMounted) {
            return
          }


          const savedPins =
            Array.isArray(
              userData
                ?.frequentPurchasePins
            )
              ? userData
                  .frequentPurchasePins
              : []


          setPinnedIds(
            savedPins
          )
        } catch (error) {
          console.error(
            '자주 구매 고정핀 조회 실패:',
            error
          )


          if (isMounted) {
            setPinnedIds([])
          }
        }
      }


    loadPins()


    return () => {
      isMounted = false
    }
  }, [currentUser])


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
                    productData
                      ?.name ||
                    '상품',

                  price:
                    Number(
                      item.price ??
                        productData
                          ?.price ??
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


              /*
               * 동일 주문 안에서는
               * 같은 상품을 1회 구매로 계산
               */
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


      /*
       * 2회 이상 구매한 상품만
       * 자주 구매 상품으로 표시
       */
      const baseProducts =
        Array.from(
          productMap.values()
        )
          .filter(
            (product) =>
              product.purchaseCount >=
              2
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


      /*
       * 순위는 구매 횟수 순 기준
       */
      const rankedProducts =
        [
          ...baseProducts,
        ].sort(
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


      const rankMap =
        new Map(
          rankedProducts.map(
            (
              product,
              index
            ) => [
              product.productId,
              index + 1,
            ]
          )
        )


      const productsWithPin =
        baseProducts.map(
          (product) => ({
            ...product,

            rank:
              rankMap.get(
                product.productId
              ),

            isPinned:
              pinnedIds.includes(
                product.productId
              ),
          })
        )


      /*
       * 고정 상품은 무조건 위
       */
      return productsWithPin.sort(
        (a, b) => {
          if (
            a.isPinned !==
            b.isPinned
          ) {
            return a.isPinned
              ? -1
              : 1
          }


          if (
            sortBy === 'recent'
          ) {
            return (
              b.recentPurchaseAt -
              a.recentPurchaseAt
            )
          }


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
      pinnedIds,
    ])


  /* =========================
     페이지네이션
  ========================= */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        frequentProducts.length /
          ITEMS_PER_PAGE
      )
    )


  const startIndex =
    (currentPage - 1) *
    ITEMS_PER_PAGE


  const visibleProducts =
    frequentProducts.slice(
      startIndex,
      startIndex +
        ITEMS_PER_PAGE
    )


  useEffect(() => {
    setCurrentPage(1)
  }, [sortBy])


  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages
      )
    }
  }, [
    currentPage,
    totalPages,
  ])


  /* =========================
     PIN NOTICE
  ========================= */

  const showPinNotice = (
    message
  ) => {
    setPinNotice(message)


    window.setTimeout(
      () => {
        setPinNotice('')
      },
      1800
    )
  }


  /* =========================
     PIN TOGGLE
  ========================= */

  const handleTogglePin =
    async (product) => {
      if (
        !currentUser ||
        isPinUpdating
      ) {
        return
      }


      const wasPinned =
        pinnedIds.includes(
          product.productId
        )


      const previousPins =
        [...pinnedIds]


      const nextPins =
        wasPinned
          ? pinnedIds.filter(
              (id) =>
                id !==
                product.productId
            )

          : [
              ...pinnedIds,
              product.productId,
            ]


      setPinnedIds(
        nextPins
      )

      setCurrentPage(1)
      setIsPinUpdating(true)


      try {
        await updateDocument(
          'users',
          currentUser.uid,
          {
            frequentPurchasePins:
              nextPins,
          }
        )


        showPinNotice(
          wasPinned
            ? '고정을 해제했습니다.'
            : '상품을 고정했습니다.'
        )
      } catch (error) {
        console.error(
          '자주 구매 고정핀 저장 실패:',
          error
        )


        setPinnedIds(
          previousPins
        )


        showPinNotice(
          '고정 상태를 저장하지 못했습니다.'
        )
      } finally {
        setIsPinUpdating(false)
      }
    }


  /* =========================
     ACTION BAR ITEM
  ========================= */

  const toActionBarItem = (
    product
  ) => ({
    productId:
      product.productId,

    productName:
      product.productName ||
      product.name ||
      '상품',

    imageSrc:
      product.imageSrc ||
      resolveImage(
        product.imageUrl
      ) ||
      product.imageUrl ||
      '',
  })


  /*
   * 현재 장바구니 데이터를
   * ProductActionBar 형식으로 변환
   */
  const buildCartBarItems = (
    cartItems
  ) =>
    cartItems
      .map((cartItem) => {
        const catalogProduct =
          catalogProducts.find(
            (product) =>
              product.productId ===
              cartItem.productId
          )


        /*
         * 카탈로그에 없으면
         * 현재 자주 구매 데이터에서도 찾기
         */
        const frequentProduct =
          frequentProducts.find(
            (product) =>
              product.productId ===
              cartItem.productId
          )


        const product =
          catalogProduct ||
          frequentProduct


        if (!product) {
          return null
        }


        return toActionBarItem(
          product
        )
      })

      .filter(Boolean)

      .slice(-5)


  /* =========================
     CART BAR SHOW
  ========================= */

  const showCartBar = () => {
    setIsCartBarVisible(
      true
    )


    if (
      cartBarTimerRef.current
    ) {
      window.clearTimeout(
        cartBarTimerRef.current
      )
    }


    cartBarTimerRef.current =
      window.setTimeout(
        () => {
          setIsCartBarVisible(
            false
          )
        },
        CART_BAR_DURATION
      )
  }


  /* =========================
     다시 구매
  ========================= */

  const handleBuyAgain = (
    product
  ) => {
    const cart =
      getCart()


    const existingItem =
      cart.find(
        (item) =>
          item.productId ===
          product.productId
      )


    /*
     * 이미 들어 있으면 수량 +1
     * 없으면 새로 1개 추가
     */
    const nextCart =
      existingItem
        ? cart.map(
            (item) =>
              item.productId ===
              product.productId
                ? {
                    ...item,

                    quantity:
                      Number(
                        item.quantity ||
                          0
                      ) + 1,
                  }
                : item
          )

        : [
            ...cart,

            {
              productId:
                product.productId,

              quantity: 1,
            },
          ]


    saveCart(
      nextCart
    )


    /*
     * 기존 장바구니 상품 +
     * 방금 담은 상품
     */
    const clickedItem =
      toActionBarItem(
        product
      )


    const existingBarItems =
      buildCartBarItems(
        nextCart
      )


    const withoutClicked =
      existingBarItems.filter(
        (item) =>
          item.productId !==
          product.productId
      )


    /*
     * 방금 누른 상품을
     * 가장 마지막에 배치해서
     * 퀵바에 반드시 보이게
     */
    setCartBarItems(
      [
        ...withoutClicked,
        clickedItem,
      ].slice(-5)
    )


    showCartBar()
  }


  /* =========================
     QUICK BAR REMOVE
  ========================= */

  const handleRemoveCartBarItem =
    (productId) => {
      const nextCart =
        getCart().filter(
          (item) =>
            item.productId !==
            productId
        )


      saveCart(
        nextCart
      )


      const nextBarItems =
        buildCartBarItems(
          nextCart
        )


      setCartBarItems(
        nextBarItems
      )


      if (
        nextBarItems.length === 0
      ) {
        setIsCartBarVisible(
          false
        )


        if (
          cartBarTimerRef.current
        ) {
          window.clearTimeout(
            cartBarTimerRef.current
          )
        }
      }
    }


  /* =========================
     RENDER
  ========================= */

  return (
    <section
      className={styles.page}
    >
      <div
        className={
          styles.frequentCard
        }
      >

        {/* =========================
            HEADER
        ========================= */}

        <MyPageHeader
          title="자주 구매"
        />


        {/* =========================
            PIN GUIDE
        ========================= */}

        <div
          className={
            styles.pinGuide
          }
        >
          <span
            className={
              styles.pinGuideIcon
            }
            aria-hidden="true"
          >
            <PinIcon />
          </span>


          <p>
            핀을 누르면 자주 찾는
            상품을 목록 상단에
            고정할 수 있어요.
          </p>
        </div>


        {/* =========================
            TOOLBAR
        ========================= */}

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
            총{' '}

            <strong>
              {
                frequentProducts.length
              }
            </strong>

            개
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
                <div
                  key={
                    option.value
                  }
                  className={
                    styles.sortItem
                  }
                >
                  <button
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
                  </button>


                  {index <
                    SORT_OPTIONS.length -
                      1 && (
                    <span
                      className={
                        styles.sortDivider
                      }
                      aria-hidden="true"
                    />
                  )}
                </div>
              )
            )}
          </div>
        </div>


        {/* =========================
            PIN NOTICE
        ========================= */}

        {pinNotice && (
          <p
            className={
              styles.notice
            }
            role="status"
          >
            {pinNotice}
          </p>
        )}


        {/* =========================
            CONTENT
        ========================= */}

        {isLoading ||
        isCatalogLoading ? (
          <div
            className={
              styles.stateBox
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
              자주 구매한 상품을
              불러오는 중입니다.
            </strong>
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
          <>

            {/* =========================
                PRODUCT GRID
            ========================= */}

            <div
              className={
                styles.productGrid
              }
            >
              {visibleProducts.map(
                (product) => (
                  <article
                    key={
                      product.productId
                    }
                    className={`${styles.productCard} ${
                      product.isPinned
                        ? styles.pinnedCard
                        : ''
                    }`}
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


                      {/* 순위 */}

                      <span
                        className={
                          styles.rankBadge
                        }
                      >
                        {
                          product.rank
                        }
                      </span>


                      {/* 고정핀 */}

                      <button
                        type="button"
                        className={`${styles.pinButton} ${
                          product.isPinned
                            ? styles.pinned
                            : ''
                        }`}
                        aria-label={
                          product.isPinned
                            ? `${product.productName} 고정 해제`
                            : `${product.productName} 상단 고정`
                        }
                        aria-pressed={
                          product.isPinned
                        }
                        title={
                          product.isPinned
                            ? '고정 해제'
                            : '상단에 고정'
                        }
                        onClick={() =>
                          handleTogglePin(
                            product
                          )
                        }
                      >
                        <PinIcon />
                      </button>
                    </div>


                    <div
                      className={
                        styles.productInfo
                      }
                    >
                      <div
                        className={
                          styles.productLabelRow
                        }
                      >
                        <span
                          className={
                            styles.category
                          }
                        >
                          자주 구매
                        </span>


                        {product.isPinned && (
                          <span
                            className={
                              styles.pinnedLabel
                            }
                          >
                            고정됨
                          </span>
                        )}
                      </div>


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


                      {/* =========================
                          다시 구매
                      ========================= */}

                      <button
                        type="button"
                        className={
                          styles.buyAgainButton
                        }
                        onClick={() =>
                          handleBuyAgain(
                            product
                          )
                        }
                      >
                        <CartIcon />

                        다시 구매
                      </button>
                    </div>

                  </article>
                )
              )}
            </div>


            {/* =========================
                PAGINATION
            ========================= */}

            {totalPages > 1 && (
              <nav
                className={
                  styles.pagination
                }
                aria-label="자주 구매 상품 페이지"
              >
                <button
                  type="button"
                  disabled={
                    currentPage === 1
                  }
                  onClick={() =>
                    setCurrentPage(
                      Math.max(
                        1,
                        currentPage -
                          1
                      )
                    )
                  }
                  aria-label="이전 페이지"
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
                      Math.min(
                        totalPages,
                        currentPage +
                          1
                      )
                    )
                  }
                  aria-label="다음 페이지"
                >
                  ›
                </button>
              </nav>
            )}

          </>
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
              ↻
            </span>


            <strong>
              아직 자주 구매한 상품이
              없습니다.
            </strong>


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

      </div>


      {/* =========================
          기존 장바구니 퀵바
      ========================= */}

      {isCartBarVisible &&
        cartBarItems.length > 0 && (
        <ProductActionBar
          type="cart"
          items={
            cartBarItems
          }
          onRemove={
            handleRemoveCartBarItem
          }
        />
      )}

    </section>
  )
}


export default FrequentPurchase