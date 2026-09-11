import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore'

import {
  Link,
} from 'react-router-dom'

import {
  getOrderStatusLabel,
  ORDER_STATUS,
} from '../../constants/orderStatus'

import {
  subscribeToAuthState,
} from '../../firebase/auth'

import {
  db,
} from '../../firebase/firebase'

import MyPageHeader from '../../components/mypage/MyPageHeader'
import StatusBadge from '../../components/mypage/StatusBadge'

import styles from './ClaimHistory.module.scss'


const ITEMS_PER_PAGE = 4


/* =========================
   PRODUCT IMAGE
========================= */

const productImages = import.meta.glob(
  '../../assets/webpImages/images/products/product*.webp',
  {
    eager: true,
    import: 'default',
  }
)


const normalizeImageFileName = (
  value = ''
) => {
  const normalizedPath =
    String(value)
      .split('?')[0]
      .split('#')[0]
      .replace(/\\/g, '/')

  const fileName =
    normalizedPath
      .split('/')
      .pop() || ''

  try {
    return decodeURIComponent(
      fileName
    ).toLowerCase()
  } catch {
    return fileName.toLowerCase()
  }
}


const toWebpFileName = (
  fileName = ''
) => {
  if (!fileName) return ''

  return /\.[^.]+$/.test(fileName)
    ? fileName.replace(
        /\.[^.]+$/,
        '.webp'
      )
    : `${fileName}.webp`
}


const productImageMap =
  Object.entries(
    productImages
  ).reduce(
    (map, [path, src]) => {
      const fileName =
        normalizeImageFileName(
          path
        )

      map.set(
        fileName,
        src
      )

      return map
    },
    new Map()
  )


const resolveImage = (
  imageUrl
) => {
  if (!imageUrl) return ''

  const rawUrl =
    String(imageUrl).trim()

  if (
    /^(data:|blob:|https?:\/\/)/i.test(
      rawUrl
    )
  ) {
    return rawUrl
  }

  const fileName =
    normalizeImageFileName(
      rawUrl
    )

  if (!fileName) {
    return ''
  }

  return (
    productImageMap.get(
      toWebpFileName(
        fileName
      )
    ) ||
    ''
  )
}


const filterItems = [
  {
    label: '전체',
    value: 'all',
  },
  {
    label: '취소',
    value: 'cancel',
  },
  {
    label: '반품',
    value: 'return',
  },
  {
    label: '교환',
    value: 'exchange',
  },
]


/* =========================
   FORMAT
========================= */

const formatDate = (
  value
) => {
  if (!value) {
    return '-'
  }


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


const formatPrice = (
  value
) =>
  Number(
    value || 0
  ).toLocaleString('ko-KR')


/* =========================
   CLAIM TYPE
========================= */

const getClaimType = (
  order
) => {
  const claimType =
    order.claimType ||
    order.claim?.type ||
    ''


  if (
    claimType === 'return' ||
    claimType === 'refund'
  ) {
    return 'return'
  }


  if (
    claimType === 'exchange'
  ) {
    return 'exchange'
  }


  if (
    order.status ===
    ORDER_STATUS.CANCELLED
  ) {
    return 'cancel'
  }


  return null
}


const getClaimLabel = (
  type
) => {
  const labels = {
    cancel: '취소',
    return: '반품',
    exchange: '교환',
  }


  return (
    labels[type] ||
    '-'
  )
}


/* =========================
   STATUS TONE
========================= */

const getStatusTone = (
  claim
) => {
  const label =
    String(
      claim.statusLabel ||
      ''
    )


  if (
    claim.claimType ===
      'cancel' ||
    label.includes('취소')
  ) {
    return 'cancelled'
  }


  if (
    label.includes('완료')
  ) {
    return 'complete'
  }


  if (
    label.includes('접수') ||
    label.includes('신청') ||
    label.includes('처리') ||
    label.includes('대기')
  ) {
    return 'pending'
  }


  return 'default'
}


/* =========================
   EMPTY ICON
========================= */

const EmptyIcon = () => (
  <svg
    viewBox="0 0 64 64"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect
      x="18"
      y="12"
      width="28"
      height="38"
      rx="4"
    />

    <path d="M24 22h16" />
    <path d="M24 29h16" />
    <path d="M24 36h10" />

    <path d="M14 44h17" />
    <path d="m20 38-6 6 6 6" />
  </svg>
)


const ClaimHistory = () => {
  const [
    currentUser,
    setCurrentUser,
  ] = useState(undefined)


  const [
    claims,
    setClaims,
  ] = useState([])


  const [
    activeFilter,
    setActiveFilter,
  ] = useState('all')


  const [
    isLoading,
    setIsLoading,
  ] = useState(true)


  const [
    loadError,
    setLoadError,
  ] = useState('')


  const [
    currentPage,
    setCurrentPage,
  ] = useState(1)


  /* =========================
     LOGIN
  ========================= */

  useEffect(() => {
    const unsubscribe =
      subscribeToAuthState(
        setCurrentUser
      )


    return unsubscribe
  }, [])


  /* =========================
     LOAD CLAIMS
  ========================= */

  useEffect(() => {
    let isMounted = true


    if (
      currentUser === undefined
    ) {
      return undefined
    }


    if (!currentUser) {
      setClaims([])
      setIsLoading(false)

      return undefined
    }


    const loadClaims =
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


          const nextClaims =
            snapshot.docs
              .map(
                (
                  orderDocument
                ) => {
                  const data =
                    orderDocument.data()


                  const claimType =
                    getClaimType(
                      data
                    )


                  if (!claimType) {
                    return null
                  }


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


                  const firstItem =
                    Array.isArray(
                      data.items
                    )
                      ? data.items[0]
                      : null


                  const itemCount =
                    Array.isArray(
                      data.items
                    )
                      ? data.items.length
                      : 0


                  const productTitle =
                    firstItem
                      ? `${
                          firstItem.productName ||
                          firstItem.name ||
                          '상품'
                        }${
                          itemCount > 1
                            ? ` 외 ${
                                itemCount - 1
                              }개`
                            : ''
                        }`
                      : '상품'


                  return {
                    id:
                      orderDocument.id,

                    claimType,

                    claimLabel:
                      getClaimLabel(
                        claimType
                      ),

                    status:
                      data.status,

                    statusLabel:
                      data.claimStatusLabel ||
                      data.claim?.statusLabel ||
                      getOrderStatusLabel(
                        data.status
                      ),

                    productTitle,

                    productImage:
                      resolveImage(
                        firstItem?.imageUrl ||
                        ''
                      ),

                    totalPrice:
                      Number(
                        data.totalAmount ||
                        0
                      ),

                    createdAt:
                      data.cancelledAt ||
                      data.claimedAt ||
                      data.updatedAt ||
                      data.createdAt,

                    createdAtMs,

                    reason:
                      data.claimReason ||
                      data.cancelReason ||
                      data.claim?.reason ||
                      '',
                  }
                }
              )

              .filter(Boolean)

              .sort(
                (a, b) =>
                  b.createdAtMs -
                  a.createdAtMs
              )


          if (isMounted) {
            setClaims(
              nextClaims
            )
          }
        } catch (error) {
          console.error(
            '취소/반품/교환 내역 조회 실패:',
            error
          )


          if (isMounted) {
            setClaims([])

            setLoadError(
              '취소 · 반품 · 교환 내역을 불러오지 못했습니다.'
            )
          }
        } finally {
          if (isMounted) {
            setIsLoading(false)
          }
        }
      }


    loadClaims()


    return () => {
      isMounted = false
    }
  }, [currentUser])


  /* =========================
     FILTER
  ========================= */

  const filteredClaims =
    useMemo(() => {
      if (
        activeFilter ===
        'all'
      ) {
        return claims
      }


      return claims.filter(
        (claim) =>
          claim.claimType ===
          activeFilter
      )
    }, [
      claims,
      activeFilter,
    ])


  /* =========================
     PAGINATION
  ========================= */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredClaims.length /
        ITEMS_PER_PAGE
      )
    )


  const startIndex =
    (currentPage - 1) *
    ITEMS_PER_PAGE


  const visibleClaims =
    filteredClaims.slice(
      startIndex,
      startIndex +
        ITEMS_PER_PAGE
    )


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


  const handleFilterChange = (
    value
  ) => {
    setActiveFilter(
      value
    )

    setCurrentPage(1)
  }


  /* =========================
     EMPTY
  ========================= */

  const emptyLabel =
    activeFilter === 'all'
      ? '취소 · 반품 · 교환 내역이 없습니다.'
      : `${
          getClaimLabel(
            activeFilter
          )
        } 내역이 없습니다.`


  /* =========================
     AUTH LOADING (인증 상태 확인 중)
  ========================= */

  if (currentUser === undefined) {
    return (
      <section
        className={
          styles.page
        }
      >
        <div
          className={
            styles.claimCard
          }
        >
          <MyPageHeader
            title="취소 · 반품 · 교환 내역"
          />


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
              내역을 불러오는 중입니다.
            </strong>
          </div>
        </div>
      </section>
    )
  }


  /* =========================
     LOGIN REQUIRED (비회원)
  ========================= */

  if (!currentUser) {
    return (
      <section
        className={
          styles.page
        }
      >
        <div
          className={
            styles.claimCard
          }
        >
          <MyPageHeader
            title="취소 · 반품 · 교환 내역"
          />


          <div
            className={
              styles.loginRequired
            }
          >
            <p>
              로그인 후 취소 · 반품 · 교환 내역을 확인할 수 있어요.
            </p>
          </div>
        </div>
      </section>
    )
  }


  return (
    <section
      className={
        styles.page
      }
    >
      <div
        className={
          styles.claimCard
        }
      >

        {/* HEADER */}

        <MyPageHeader
          title="취소 · 반품 · 교환 내역"
        />


        {/* FILTER */}

        <div
          className={
            styles.filterBar
          }
          role="tablist"
          aria-label="취소 반품 교환 내역 필터"
        >
          {filterItems.map(
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
                onClick={() =>
                  handleFilterChange(
                    filter.value
                  )
                }
              >
                {
                  filter.label
                }
              </button>
            )
          )}
        </div>


        {/* COUNT */}

        {!isLoading &&
          !loadError &&
          filteredClaims.length >
            0 && (
          <div
            className={
              styles.listHeader
            }
          >
            총{' '}

            <strong>
              {
                filteredClaims.length
              }
            </strong>

            건
          </div>
        )}


        {/* CONTENT */}

        {isLoading ? (
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
              내역을 불러오는 중입니다.
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
        ) : filteredClaims.length >
          0 ? (
          <>
            <div
              className={
                styles.claimList
              }
            >
              {visibleClaims.map(
                (claim) => (
                  <article
                    key={
                      claim.id
                    }
                    className={
                      styles.claimItem
                    }
                  >
                    <div
                      className={
                        styles.itemTop
                      }
                    >
                      <div
                        className={
                          styles.itemMeta
                        }
                      >
                        <span
                          className={`${styles.claimBadge} ${
                            styles[
                              claim.claimType
                            ]
                          }`}
                        >
                          {
                            claim.claimLabel
                          }
                        </span>

                        <time>
                          {formatDate(
                            claim.createdAt
                          )}
                        </time>
                      </div>


                      <Link
                        to={`/mypage/orders/${claim.id}`}
                        className={
                          styles.detailButton
                        }
                      >
                        주문 상세

                        <span
                          aria-hidden="true"
                        >
                          ›
                        </span>
                      </Link>
                    </div>


                    <div
                      className={
                        styles.itemBody
                      }
                    >
                      <div
                        className={
                          styles.productImage
                        }
                      >
                        {claim.productImage ? (
                          <img
                            src={
                              claim.productImage
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
                          styles.productInfo
                        }
                      >
                        <strong>
                          {
                            claim.productTitle
                          }
                        </strong>

                        <span
                          className={
                            styles.price
                          }
                        >
                          {formatPrice(
                            claim.totalPrice
                          )}
                          원
                        </span>


                        {claim.reason && (
                          <p>
                            <span>
                              사유
                            </span>

                            {
                              claim.reason
                            }
                          </p>
                        )}
                      </div>


                      <StatusBadge
                        tone={
                          getStatusTone(
                            claim
                          )
                        }
                      >
                        {
                          claim.statusLabel
                        }
                      </StatusBadge>
                    </div>
                  </article>
                )
              )}
            </div>


            {/* PAGINATION */}

            {totalPages > 1 && (
              <nav
                className={
                  styles.pagination
                }
                aria-label="취소 반품 교환 내역 페이지"
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
                        currentPage - 1
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
                  (
                    _,
                    index
                  ) => {
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
                        currentPage + 1
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
              <EmptyIcon />
            </span>

            <strong>
              {emptyLabel}
            </strong>
          </div>
        )}

      </div>
    </section>
  )
}


export default ClaimHistory
