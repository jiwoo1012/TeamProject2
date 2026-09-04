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

import { subscribeToAuthState } from '../../firebase/auth'
import { db } from '../../firebase/firebase'

import styles from './ClaimHistory.module.scss'


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


const formatPrice = (value) =>
  Number(value || 0).toLocaleString(
    'ko-KR'
  )


const getClaimType = (order) => {
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


const getClaimLabel = (type) => {
  const labels = {
    cancel: '취소',
    return: '반품',
    exchange: '교환',
  }

  return labels[type] || '-'
}


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

  const [claims, setClaims] =
    useState([])

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
     취소 / 반품 / 교환 조회
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
                                itemCount -
                                1
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
                      firstItem?.imageUrl ||
                      '',

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
              '교환 내역을 불러오지 못했습니다.'
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
     필터
  ========================= */

  const filteredClaims =
    useMemo(() => {
      if (
        activeFilter === 'all'
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


  const emptyLabel =
    activeFilter === 'all'
      ? '교환 내역이 없어요'
      : `${
          getClaimLabel(
            activeFilter
          )
        } 내역이 없어요`


  return (
    <section
      className={styles.page}
      aria-labelledby="claim-history-title"
    >

      <div
        className={
          styles.claimCard
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
            id="claim-history-title"
          >
            취소 반품 교환 내역
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
                  setActiveFilter(
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


        {/* =====================
            CONTENT
        ===================== */}

        {isLoading ? (

          <div
            className={
              styles.stateBox
            }
            role="status"
          >
            내역을 불러오는
            중입니다.
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

          <div
            className={
              styles.claimList
            }
          >

            {filteredClaims.map(
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
                    <div>
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
                        styles.detailLink
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

                      <span>
                        {formatPrice(
                          claim.totalPrice
                        )}
                        원
                      </span>

                      {claim.reason && (
                        <p>
                          사유 ·{' '}
                          {
                            claim.reason
                          }
                        </p>
                      )}
                    </div>


                    <span
                      className={
                        styles.statusBadge
                      }
                    >
                      {
                        claim.statusLabel
                      }
                    </span>

                  </div>

                </article>
              )
            )}

          </div>

        ) : (

          /* =====================
              EMPTY
          ===================== */

          <div
            className={
              styles.emptyState
            }
          >

            <div
              className={
                styles.emptyIcon
              }
            >
              <EmptyIcon />
            </div>


            <p>
              {emptyLabel}
            </p>

          </div>

        )}

      </div>

    </section>
  )
}


export default ClaimHistory