import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import Pagination from '../../components/ui/Pagination/Pagination'

import { products } from '../../data/products'

import { subscribeToAuthState } from '../../firebase/auth'
import {
  getCollection,
  deleteDocument,
} from '../../firebase/firestore'

import {
  getCart,
  saveCart,
} from '../../utils/cartStorage'

import styles from './WishList.module.scss'


const productImages = import.meta.glob(
  '../../assets/images/products/product*.png',
  {
    eager: true,
    import: 'default',
  }
)


const resolveImage = (imageUrl) =>
  Object.entries(productImages).find(
    ([path]) =>
      path.endsWith(`/${imageUrl}`)
  )?.[1]


const PAGE_SIZE = 8


const filters = [
  {
    label: '전체',
    value: 'all',
  },
  {
    label: '전통주',
    value: 'alcohol',
  },
  {
    label: '안주',
    value: 'food',
  },
  {
    label: '술잔',
    value: 'glass',
  },
  {
    label: '선물세트',
    value: 'gift',
  },
]


const getProductCategory = (
  product
) => {
  const productId =
    String(
      product.productId || ''
    ).toLowerCase()

  const category =
    String(
      product.category ||
        product.type ||
        product.productType ||
        ''
    ).toLowerCase()


  if (
    productId.startsWith('snk_') ||
    category.includes('food') ||
    category.includes('안주')
  ) {
    return 'food'
  }


  if (
    productId.startsWith('gls_') ||
    category.includes('glass') ||
    category.includes('술잔')
  ) {
    return 'glass'
  }


  if (
    productId.startsWith('gift_') ||
    category.includes('gift') ||
    category.includes('선물')
  ) {
    return 'gift'
  }


  return 'alcohol'
}


const getCategoryLabel = (
  product
) => {
  const category =
    getProductCategory(product)

  const labels = {
    alcohol: '술',
    food: '안주',
    glass: '잔',
    gift: '선물',
  }

  return labels[category]
}


const getProductPrice = (
  product
) => {
  const price =
    product.salePrice ??
    product.price ??
    product.productPrice ??
    0

  return Number(
    price
  ).toLocaleString('ko-KR')
}


const HeartIcon = ({
  filled = true,
}) => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    fill={
      filled
        ? 'currentColor'
        : 'none'
    }
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20.8 4.7a5.4 5.4 0 0 0-7.7 0L12 5.8l-1.1-1.1a5.4 5.4 0 0 0-7.7 7.7L12 21l8.8-8.6a5.4 5.4 0 0 0 0-7.7Z" />
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


const WishList = () => {
  const [uid, setUid] =
    useState(null)

  const [
    isAuthReady,
    setIsAuthReady,
  ] = useState(false)

  const [
    wishlistDocs,
    setWishlistDocs,
  ] = useState([])

  const [
    isLoading,
    setIsLoading,
  ] = useState(true)

  const [notice, setNotice] =
    useState('')

  const [
    activeFilter,
    setActiveFilter,
  ] = useState('all')

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1)


  useEffect(() => {
    const unsubscribe =
      subscribeToAuthState(
        (user) => {
          setUid(
            user &&
              !user.isAnonymous
              ? user.uid
              : null
          )

          setIsAuthReady(true)
        }
      )


    return unsubscribe
  }, [])


  useEffect(() => {
    if (!isAuthReady) {
      return undefined
    }


    if (!uid) {
      setWishlistDocs([])
      setIsLoading(false)

      return undefined
    }


    let isCancelled = false

    setIsLoading(true)


    getCollection(
      `users/${uid}/wishlist`
    )
      .then((docs) => {
        if (isCancelled) {
          return
        }

        setWishlistDocs(docs)
      })

      .catch((error) => {
        console.error(
          '찜 목록 조회 실패:',
          error
        )

        if (!isCancelled) {
          setWishlistDocs([])

          handleNotice(
            '찜 목록을 불러오지 못했습니다.'
          )
        }
      })

      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false)
        }
      })


    return () => {
      isCancelled = true
    }
  }, [
    uid,
    isAuthReady,
  ])


  const wishlistProducts =
    useMemo(() => {
      return wishlistDocs
        .map((wishDoc) => {
          const productId =
            wishDoc.productId ??
            wishDoc.id


          const product =
            products.find(
              (item) =>
                item.productId ===
                productId
            )


          if (!product) {
            return null
          }


          return {
            ...product,

            imageSrc:
              resolveImage(
                product.imageUrl
              ),

            wishedAt:
              wishDoc.createdAt
                ?.seconds ?? 0,

            wishCategory:
              getProductCategory(
                product
              ),
          }
        })

        .filter(Boolean)

        .sort(
          (a, b) =>
            b.wishedAt -
            a.wishedAt
        )
    }, [wishlistDocs])


  const filteredProducts =
    useMemo(() => {
      if (
        activeFilter === 'all'
      ) {
        return wishlistProducts
      }


      return wishlistProducts.filter(
        (product) =>
          product.wishCategory ===
          activeFilter
      )
    }, [
      wishlistProducts,
      activeFilter,
    ])


  const totalCount =
    filteredProducts.length


  const totalPages =
    Math.max(
      1,
      Math.ceil(
        totalCount /
          PAGE_SIZE
      )
    )


  const visibleProducts =
    filteredProducts.slice(
      (currentPage - 1) *
        PAGE_SIZE,

      currentPage *
        PAGE_SIZE
    )


  useEffect(() => {
    setCurrentPage(1)
  }, [activeFilter])


  const handleNotice = (
    message
  ) => {
    setNotice(message)

    window.setTimeout(
      () =>
        setNotice(''),
      1800
    )
  }


  const handleRemoveWish =
    async (product) => {
      if (!uid) {
        return
      }


      try {
        await deleteDocument(
          `users/${uid}/wishlist`,
          product.productId
        )


        setWishlistDocs(
          (current) =>
            current.filter(
              (wishDoc) =>
                (
                  wishDoc.productId ??
                  wishDoc.id
                ) !==
                product.productId
            )
        )


        handleNotice(
          '찜 목록에서 삭제했습니다.'
        )
      } catch (error) {
        console.error(
          '찜 삭제 실패:',
          error
        )

        handleNotice(
          '삭제 중 오류가 발생했습니다.'
        )
      }
    }


  const handleAddToCart =
    (product) => {
      const cart =
        getCart()


      const existing =
        cart.find(
          (item) =>
            item.productId ===
            product.productId
        )


      const nextCart =
        existing
          ? cart.map(
              (item) =>
                item.productId ===
                product.productId
                  ? {
                      ...item,

                      quantity:
                        item.quantity +
                        1,
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


      saveCart(nextCart)


      handleNotice(
        '장바구니에 담았습니다.'
      )
    }


  if (isLoading) {
    return (
      <section
        className={styles.page}
      >
        <div
          className={
            styles.wishlistCard
          }
        >
          <p
            className={
              styles.status
            }
          >
            찜 목록을 불러오는
            중입니다...
          </p>
        </div>
      </section>
    )
  }


  return (
    <section
      className={styles.page}
      aria-labelledby="wishlist-title"
    >

      <div
        className={
          styles.wishlistCard
        }
      >

        {/* =====================
            TITLE
        ===================== */}

        <header
          className={
            styles.pageHeader
          }
        >
          <h2
            id="wishlist-title"
          >
            찜
          </h2>
        </header>


        <div
          className={
            styles.titleDivider
          }
        />


        {/* =====================
            FILTER
        ===================== */}

        <div
          className={
            styles.filterList
          }
          role="tablist"
          aria-label="찜 상품 카테고리"
        >
          {filters.map(
            (filter) => (
              <button
                key={
                  filter.value
                }
                type="button"
                role="tab"
                aria-selected={
                  activeFilter ===
                  filter.value
                }
                className={`${styles.filterButton} ${
                  activeFilter ===
                  filter.value
                    ? styles.activeFilter
                    : ''
                }`}
                onClick={() => {
                  setActiveFilter(
                    filter.value
                  )
                }}
              >
                {
                  filter.label
                }
              </button>
            )
          )}
        </div>


        {/* =====================
            COUNT
        ===================== */}

        <div
          className={
            styles.listHeader
          }
        >
          <p>
            총{' '}
            <strong>
              {totalCount}
            </strong>
            개
          </p>
        </div>


        {notice && (
          <p
            className={
              styles.notice
            }
            role="status"
          >
            {notice}
          </p>
        )}


        {/* =====================
            EMPTY
        ===================== */}

        {totalCount === 0 ? (

          <div
            className={
              styles.empty
            }
          >
            <span
              className={
                styles.emptyHeart
              }
              aria-hidden="true"
            >
              ♡
            </span>

            <h3>
              찜한 상품이
              없습니다.
            </h3>

            <p>
              마음에 드는 상품을
              찜해두고 나중에
              확인해보세요.
            </p>

            <Link
              to="/shop"
              className={
                styles.emptyButton
              }
            >
              상품 둘러보기
            </Link>
          </div>

        ) : (

          <>
            {/* =====================
                PRODUCT GRID
            ===================== */}

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
                        to={`/product/${product.productId}`}
                        className={
                          styles.productImageLink
                        }
                      >
                        {product.imageSrc ? (
                          <img
                            src={
                              product.imageSrc
                            }
                            alt={
                              product.productName ||
                              product.name
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


                      <button
                        type="button"
                        className={
                          styles.heartButton
                        }
                        aria-label="찜 삭제"
                        onClick={() =>
                          handleRemoveWish(
                            product
                          )
                        }
                      >
                        <HeartIcon />
                      </button>

                    </div>


                    <div
                      className={
                        styles.productContent
                      }
                    >
                      <span
                        className={
                          styles.categoryLabel
                        }
                      >
                        {getCategoryLabel(
                          product
                        )}
                      </span>


                      <Link
                        to={`/product/${product.productId}`}
                        className={
                          styles.productName
                        }
                      >
                        {product.productName ||
                          product.name ||
                          '상품명'}
                      </Link>


                      <div
                        className={
                          styles.productBottom
                        }
                      >
                        <strong
                          className={
                            styles.productPrice
                          }
                        >
                          {getProductPrice(
                            product
                          )}
                          원
                        </strong>


                        <button
                          type="button"
                          className={
                            styles.cartButton
                          }
                          aria-label="장바구니 담기"
                          onClick={() =>
                            handleAddToCart(
                              product
                            )
                          }
                        >
                          <CartIcon />
                        </button>
                      </div>
                    </div>

                  </article>

                )
              )}
            </div>


            {totalPages > 1 && (
              <div
                className={
                  styles.paginationArea
                }
              >
                <Pagination
                  currentPage={
                    currentPage
                  }
                  totalPages={
                    totalPages
                  }
                  onChange={
                    setCurrentPage
                  }
                />
              </div>
            )}
          </>

        )}


        {/* =====================
            INFO
        ===================== */}

        <div
          className={
            styles.wishlistNotice
          }
        >
          <p>
            - 품절 또는 판매 종료된
            상품은 찜 목록에서
            제외될 수 있습니다.
          </p>

          <p>
            - 상품의 가격 및 할인
            정보는 변경될 수
            있습니다.
          </p>

          <p>
            - 찜한 상품은 회원님의
            계정에 저장됩니다.
          </p>
        </div>

      </div>

    </section>
  )
}


export default WishList