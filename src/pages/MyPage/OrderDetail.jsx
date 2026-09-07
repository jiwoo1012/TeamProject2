import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { useNavigate, useParams } from 'react-router-dom'

import {
  getOrderStatusLabel,
  ORDER_STATUS,
} from '../../constants/orderStatus'

import { subscribeToAuthState } from '../../firebase/auth'
import { db } from '../../firebase/firebase'
import { updateDocument } from '../../firebase/firestore'

import styles from './OrderDetail.module.scss'


const orderStepItems = [
  {
    key: 'received',
    label: '주문 접수',
  },
  {
    key: ORDER_STATUS.PAID,
    label: '결제 완료',
  },
  {
    key: ORDER_STATUS.PREPARING,
    label: '배송 준비 중',
  },
  {
    key: ORDER_STATUS.SHIPPED,
    label: '배송 중',
  },
  {
    key: ORDER_STATUS.DELIVERED,
    label: '배송 완료',
  },
]


const formatPrice = (price) =>
  `${Number(price || 0).toLocaleString('ko-KR')}원`


const formatOrderNumber = (orderId) => {
  if (!orderId) return '-'

  return orderId.length > 20
    ? `${orderId.slice(0, 17)}…`
    : orderId
}


const formatDateTime = (value) => {
  const date =
    value?.toDate?.() ||
    new Date(value || 0)

  if (
    Number.isNaN(date.getTime()) ||
    date.getTime() === 0
  ) {
    return '-'
  }

  return new Intl.DateTimeFormat(
    'ko-KR',
    {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }
  ).format(date)
}


const getPaymentLabel = (method) =>
  ({
    bank: '무통장 입금',
    card: '신용카드',
    virtual: '가상계좌',
    payco: '페이코',
    naver: '네이버페이',
    kakao: '카카오페이',
    toss: '토스페이',
  })[method] ||
  method ||
  '-'


const getProductType = (
  productId = ''
) => {
  if (
    productId.startsWith('snk_')
  ) {
    return 'food'
  }

  if (
    productId.startsWith('gls_')
  ) {
    return 'glass'
  }

  return 'bottle'
}


const ProductPlaceholder = ({
  type,
}) => (
  <div
    className={`${styles.productPlaceholder} ${styles[type]}`}
    aria-hidden="true"
  >
    <span />
  </div>
)


const OrderDetail = () => {
  const navigate = useNavigate()
  const { orderId } = useParams()

  const [order, setOrder] =
    useState(null)

  const [isLoading, setIsLoading] =
    useState(true)

  const [loadError, setLoadError] =
    useState('')

  const [isUpdating, setIsUpdating] =
    useState(false)

  const [actionError, setActionError] =
    useState('')

  const [loadAttempt, setLoadAttempt] =
    useState(0)

  const [addressNotice, setAddressNotice] =
    useState('')


  useEffect(() => {
    let isActive = true


    const unsubscribe =
      subscribeToAuthState(
        async (user) => {
          if (!user) {
            if (isActive) {
              setLoadError(
                '로그인 후 주문 상세를 확인할 수 있습니다.'
              )

              setIsLoading(false)
            }

            return
          }


          if (!orderId) {
            if (isActive) {
              setLoadError(
                '주문 번호가 없습니다.'
              )

              setIsLoading(false)
            }

            return
          }


          setIsLoading(true)
          setLoadError('')


          try {
            const snapshot =
              await getDoc(
                doc(
                  db,
                  'orders',
                  orderId
                )
              )


            if (
              !snapshot.exists() ||
              snapshot.data().userId !==
                user.uid
            ) {
              throw new Error(
                'order/not-found'
              )
            }


            const data =
              snapshot.data()

            const shipping =
              data.shipping || {}


            const products =
              Array.isArray(data.items)
                ? data.items.map(
                    (item) => ({
                      id:
                        item.productId,

                      name:
                        item.productName ||
                        item.name ||
                        '상품',

                      price: Number(
                        item.price || 0
                      ),

                      quantity:
                        Number(
                          item.quantity ||
                            1
                        ),

                      imageUrl:
                        item.imageUrl ||
                        '',

                      type:
                        getProductType(
                          item.productId
                        ),
                    })
                  )
                : []


            if (isActive) {
              setOrder({
                id:
                  snapshot.id,

                orderedAt:
                  formatDateTime(
                    data.createdAt
                  ),

                customerName:
                  data.customerName ||
                  user.displayName ||
                  '회원',

                status:
                  data.status,

                products,

                address: {
                  receiver:
                    shipping.recipient ||
                    '-',

                  phone:
                    shipping.phone ||
                    '-',

                  address:
                    [
                      shipping.address,
                      shipping.detailAddress,
                    ]
                      .filter(Boolean)
                      .join(' ') ||
                    '-',

                  memo:
                    shipping.memo ||
                    '-',
                },

                payment: {
                  method:
                    getPaymentLabel(
                      data.paymentMethod
                    ),

                  productAmount:
                    Number(
                      data.productAmount ||
                        0
                    ),

                  shippingFee:
                    Number(
                      data.shippingFee ||
                        0
                    ),

                  discount:
                    Number(
                      data.discountAmount ||
                        0
                    ) +
                    Number(
                      data.usedPoints ||
                        0
                    ),

                  total:
                    Number(
                      data.totalAmount ||
                        0
                    ),
                },

                shipping: {
                  status:
                    getOrderStatusLabel(
                      data.status
                    ),

                  carrier:
                    data.carrier ||
                    '-',

                  trackingNumber:
                    data.trackingNumber ||
                    '-',

                  expectedDate:
                    data.expectedDate ||
                    '-',
                },
              })
            }
          } catch (error) {
            console.error(
              '주문 상세 조회 실패:',
              error
            )

            if (isActive) {
              setOrder(null)

              setLoadError(
                '주문 정보를 찾을 수 없거나 접근할 수 없습니다.'
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
  }, [
    orderId,
    loadAttempt,
  ])


  const canCancel =
    order?.status ===
      ORDER_STATUS.PAID ||
    order?.status ===
      ORDER_STATUS.PREPARING


  const handleCancelOrder =
    async () => {
      if (
        !order ||
        !canCancel ||
        isUpdating
      ) {
        return
      }


      if (
        !window.confirm(
          '주문을 취소하시겠습니까?'
        )
      ) {
        return
      }


      setIsUpdating(true)
      setActionError('')


      try {
        await updateDocument(
          'orders',
          order.id,
          {
            status:
              ORDER_STATUS.CANCELLED,
          }
        )


        setOrder(
          (current) => ({
            ...current,

            status:
              ORDER_STATUS.CANCELLED,

            shipping: {
              ...current.shipping,

              status:
                getOrderStatusLabel(
                  ORDER_STATUS.CANCELLED
                ),
            },
          })
        )
      } catch (error) {
        console.error(
          '주문 취소 실패:',
          error
        )

        setActionError(
          '주문을 취소하지 못했습니다. 잠시 후 다시 시도해주세요.'
        )
      } finally {
        setIsUpdating(false)
      }
    }


  if (
    isLoading ||
    loadError ||
    !order
  ) {
    return (
      <section
        className={styles.page}
        aria-labelledby="order-detail-title"
      >
        <div
          className={
            styles.detailCard
          }
        >
          <h2
            id="order-detail-title"
            className={
              styles.title
            }
          >
            주문 내역 상세
          </h2>


          <div
            className={
              styles.titleDivider
            }
          />


          <div
            className={
              styles.feedbackState
            }
            role={
              loadError
                ? 'alert'
                : 'status'
            }
          >
            {!loadError && (
              <span
                className={
                  styles.loadingSpinner
                }
                aria-hidden="true"
              />
            )}


            <strong>
              {loadError ||
                '주문 정보를 불러오고 있습니다.'}
            </strong>


            <p>
              {loadError
                ? '잠시 후 다시 시도해 주세요.'
                : '잠시만 기다려 주세요.'}
            </p>


            <div
              className={
                styles.feedbackActions
              }
            >
              {loadError && (
                <button
                  type="button"
                  className={
                    styles.retryButton
                  }
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


              <button
                type="button"
                className={
                  styles.backOutlineButton
                }
                onClick={() =>
                  navigate(
                    '/mypage/orders'
                  )
                }
              >
                주문 목록으로
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }


  const isCancelled =
    order.status ===
    ORDER_STATUS.CANCELLED


  const stepIndexByStatus = {
    [ORDER_STATUS.PAID]: 1,

    [ORDER_STATUS.PREPARING]:
      2,

    [ORDER_STATUS.SHIPPED]: 3,

    [ORDER_STATUS.DELIVERED]:
      4,
  }


  const currentStepIndex =
    stepIndexByStatus[
      order.status
    ] ?? 0


  const orderSteps =
    orderStepItems.map(
      (step, index) => ({
        ...step,

        state:
          isCancelled
            ? 'pending'
            : index <
                currentStepIndex
              ? 'complete'
              : index ===
                  currentStepIndex
                ? 'current'
                : 'pending',

        date:
          !isCancelled &&
          index <= 1 &&
          index <=
            currentStepIndex
            ? order.orderedAt
            : '',
      })
    )


  return (
    <section
      className={styles.page}
      aria-labelledby="order-detail-title"
    >

      <div
        className={
          styles.detailCard
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
            id="order-detail-title"
            className={
              styles.title
            }
          >
            주문 내역 상세
          </h2>
        </header>


        <div
          className={
            styles.titleDivider
          }
        />


        {/* =====================
            STEP
        ===================== */}

        {isCancelled ? (
          <div
            className={
              styles.cancelledNotice
            }
            role="status"
          >
            <span
              className={
                styles.cancelIcon
              }
              aria-hidden="true"
            >
              !
            </span>

            <div>
              <strong>
                주문이 취소되었습니다.
              </strong>

              <p>
                결제 취소 및 환불 처리
                상태는 결제 수단에서
                확인할 수 있습니다.
              </p>
            </div>
          </div>
        ) : (
          <div
            className={
              styles.stepperBox
            }
          >
            <div
              className={
                styles.stepper
              }
              aria-label="주문 진행 상태"
            >
              {orderSteps.map(
                (step, index) => (
                  <div
                    key={
                      step.key
                    }
                    className={`${styles.step} ${
                      styles[
                        step.state
                      ]
                    }`}
                    aria-current={
                      step.state ===
                      'current'
                        ? 'step'
                        : undefined
                    }
                  >
                    {index <
                      orderSteps.length -
                        1 && (
                      <span
                        className={
                          styles.stepLine
                        }
                        aria-hidden="true"
                      />
                    )}


                    <span
                      className={
                        styles.stepDot
                      }
                      aria-hidden="true"
                    >
                      {step.state ===
                        'complete'
                        ? '✓'
                        : ''}
                    </span>


                    <strong
                      className={
                        styles.stepLabel
                      }
                    >
                      {step.label}
                    </strong>


                    <span
                      className={
                        styles.stepDate
                      }
                    >
                      {step.date}
                    </span>
                  </div>
                )
              )}
            </div>
          </div>
        )}


        {/* =====================
            ORDER META
        ===================== */}

        <dl
          className={
            styles.orderMeta
          }
        >
          <div>
            <dt>주문 번호</dt>

            <dd
              title={order.id}
            >
              {formatOrderNumber(
                order.id
              )}
            </dd>
          </div>


          <div>
            <dt>주문일</dt>
            <dd>
              {order.orderedAt}
            </dd>
          </div>


          <div>
            <dt>주문자</dt>
            <dd>
              {order.customerName}
            </dd>
          </div>


          <div>
            <dt>배송 주소</dt>

            <dd>
              {order.address.address}
            </dd>
          </div>
        </dl>


        {/* =====================
            PRODUCT
        ===================== */}

        <section
          className={
            styles.infoSection
          }
          aria-labelledby="product-info-title"
        >
          <div
            className={
              styles.sectionHeading
            }
          >
            <h3
              id="product-info-title"
            >
              주문 상품 정보
            </h3>
          </div>


          <div
            className={
              styles.productTable
            }
          >
            <div
              className={
                styles.productColumns
              }
              aria-hidden="true"
            >
              <span>
                상품 정보
              </span>

              <span>수량</span>

              <span>
                상품 금액
              </span>
            </div>


            <div
              className={
                styles.productList
              }
            >
              {order.products.map(
                (
                  product,
                  index
                ) => (
                  <article
                    key={`${product.id}-${index}`}
                    className={
                      styles.productRow
                    }
                  >
                    <div
                      className={
                        styles.productInfo
                      }
                    >
                      {product.imageUrl ? (
                        <img
                          className={
                            styles.productImage
                          }
                          src={
                            product.imageUrl
                          }
                          alt={
                            product.name
                          }
                        />
                      ) : (
                        <ProductPlaceholder
                          type={
                            product.type
                          }
                        />
                      )}


                      <div
                        className={
                          styles.productCopy
                        }
                      >
                        <strong>
                          {
                            product.name
                          }
                        </strong>

                        <span>
                          {formatPrice(
                            product.price
                          )}
                        </span>
                      </div>
                    </div>


                    <span
                      className={
                        styles.quantity
                      }
                    >
                      {
                        product.quantity
                      }
                    </span>


                    <span
                      className={
                        styles.linePrice
                      }
                    >
                      {formatPrice(
                        product.price *
                          product.quantity
                      )}
                    </span>
                  </article>
                )
              )}
            </div>
          </div>
        </section>


        {/* =====================
            ADDRESS
        ===================== */}

        <section
          className={
            styles.infoSection
          }
          aria-labelledby="address-title"
        >
          <div
            className={
              styles.sectionHeading
            }
          >
            <h3
              id="address-title"
            >
              배송지 정보
            </h3>

            <button
              type="button"
              className={styles.addressButton}
              onClick={() =>
                setAddressNotice(
                  '주문 완료 후 배송지 변경은 고객센터를 통해 확인해 주세요. 배송지 관리에서는 다음 주문의 주소를 변경할 수 있습니다.'
                )
              }
            >
              배송지 변경
            </button>
          </div>


          <div
            className={
              styles.addressContent
            }
          >
            <dl
              className={
                styles.infoList
              }
            >
              <div>
                <dt>받는 분</dt>

                <dd>
                  {
                    order.address
                      .receiver
                  }
                </dd>
              </div>


              <div>
                <dt>연락처</dt>

                <dd>
                  {
                    order.address
                      .phone
                  }
                </dd>
              </div>


              <div>
                <dt>주소</dt>

                <dd>
                  {
                    order.address
                      .address
                  }
                </dd>
              </div>


              <div>
                <dt>
                  배송 메모
                </dt>

                <dd>
                  {
                    order.address
                      .memo
                  }
                </dd>
              </div>
            </dl>

            {addressNotice && (
              <p
                className={styles.addressNotice}
                role="status"
              >
                {addressNotice}
              </p>
            )}

          </div>
        </section>


        {/* =====================
            PAYMENT
        ===================== */}

        <section
          className={
            styles.infoSection
          }
          aria-labelledby="payment-title"
        >
          <div
            className={
              styles.sectionHeading
            }
          >
            <h3
              id="payment-title"
            >
              결제 정보
            </h3>
          </div>


          <dl
            className={`${styles.infoList} ${styles.paymentList}`}
          >
            <div>
              <dt>
                결제 수단
              </dt>

              <dd>
                {
                  order.payment
                    .method
                }
              </dd>
            </div>


            <div>
              <dt>
                상품 금액
              </dt>

              <dd>
                {formatPrice(
                  order.payment
                    .productAmount
                )}
              </dd>
            </div>


            <div>
              <dt>배송비</dt>

              <dd>
                {formatPrice(
                  order.payment
                    .shippingFee
                )}
              </dd>
            </div>


            <div>
              <dt>
                할인 금액
              </dt>

              <dd>
                {formatPrice(
                  order.payment
                    .discount
                )}
              </dd>
            </div>


            <div
              className={
                styles.totalRow
              }
            >
              <dt>
                결제 금액
              </dt>

              <dd>
                {formatPrice(
                  order.payment
                    .total
                )}
              </dd>
            </div>
          </dl>
        </section>


        {actionError && (
          <p
            className={
              styles.actionError
            }
            role="alert"
          >
            {actionError}
          </p>
        )}


        {/* =====================
            BOTTOM BUTTON
        ===================== */}

        <div
          className={
            styles.bottomActions
          }
        >
          {canCancel && (
            <button
              type="button"
              className={
                styles.cancelButton
              }
              disabled={
                isUpdating
              }
              onClick={
                handleCancelOrder
              }
            >
              {isUpdating
                ? '취소 처리 중...'
                : '주문 취소'}
            </button>
          )}


          <button
            type="button"
            className={
              styles.backButton
            }
            onClick={() =>
              navigate(
                '/mypage/orders'
              )
            }
          >
            목록으로
          </button>
        </div>

      </div>

    </section>
  )
}


export default OrderDetail
