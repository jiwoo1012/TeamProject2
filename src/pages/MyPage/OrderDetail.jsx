import { useEffect, useState } from 'react'
import { doc, getDoc } from 'firebase/firestore'
import { useNavigate, useParams } from 'react-router-dom'
import { getOrderStatusLabel, ORDER_STATUS } from '../../constants/orderStatus'
import { subscribeToAuthState } from '../../firebase/auth'
import { db } from '../../firebase/firebase'
import styles from './OrderDetail.module.scss'

const orderStepItems = [
  { key: ORDER_STATUS.PAID, label: '결제 완료' },
  { key: ORDER_STATUS.PREPARING, label: '배송 준비 중' },
  { key: ORDER_STATUS.SHIPPED, label: '배송 중' },
  { key: ORDER_STATUS.DELIVERED, label: '배송 완료' },
]

const formatPrice = (price) => `${price.toLocaleString('ko-KR')}원`

const formatDateTime = (value) => {
  const date = value?.toDate?.() || new Date(value || 0)
  if (Number.isNaN(date.getTime()) || date.getTime() === 0) return '-'

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

const getPaymentLabel = (method) => ({
  bank: '무통장 입금',
  card: '신용카드',
  virtual: '가상계좌',
  payco: '페이코',
  naver: '네이버페이',
  kakao: '카카오페이',
  toss: '토스페이',
})[method] || method || '-'

const getProductType = (productId = '') => {
  if (productId.startsWith('snk_')) return 'food'
  if (productId.startsWith('gls_')) return 'glass'
  return 'bottle'
}

const ProductPlaceholder = ({ type }) => (
  <div className={`${styles.productPlaceholder} ${styles[type]}`} aria-hidden="true">
    <span />
  </div>
)

const OrderDetail = () => {
  const navigate = useNavigate()
  const { orderId } = useParams()
  const [order, setOrder] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    let isActive = true

    const unsubscribe = subscribeToAuthState(async (user) => {
      if (!user) {
        if (isActive) {
          setLoadError('로그인 후 주문 상세를 확인할 수 있습니다.')
          setIsLoading(false)
        }
        return
      }

      if (!orderId) {
        if (isActive) {
          setLoadError('주문 번호가 없습니다.')
          setIsLoading(false)
        }
        return
      }

      setIsLoading(true)
      setLoadError('')

      try {
        const snapshot = await getDoc(doc(db, 'orders', orderId))

        if (!snapshot.exists() || snapshot.data().userId !== user.uid) {
          throw new Error('order/not-found')
        }

        const data = snapshot.data()
        const shipping = data.shipping || {}
        const products = Array.isArray(data.items)
          ? data.items.map((item) => ({
              id: item.productId,
              name: item.productName || '상품',
              price: Number(item.price || 0),
              quantity: Number(item.quantity || 0),
              type: getProductType(item.productId),
            }))
          : []

        if (isActive) {
          setOrder({
            id: snapshot.id,
            orderedAt: formatDateTime(data.createdAt),
            customerName: data.customerName || user.displayName || '회원',
            status: data.status,
            products,
            address: {
              receiver: shipping.recipient || '-',
              phone: shipping.phone || '-',
              address: [shipping.address, shipping.detailAddress].filter(Boolean).join(' ') || '-',
              memo: shipping.memo || '-',
            },
            payment: {
              method: getPaymentLabel(data.paymentMethod),
              productAmount: Number(data.productAmount || 0),
              shippingFee: Number(data.shippingFee || 0),
              discount: Number(data.discountAmount || 0) + Number(data.usedPoints || 0),
              total: Number(data.totalAmount || 0),
            },
            shipping: {
              status: getOrderStatusLabel(data.status),
              carrier: data.carrier || '-',
              trackingNumber: data.trackingNumber || '-',
              expectedDate: data.expectedDate || '-',
            },
          })
        }
      } catch (error) {
        console.error('주문 상세 조회 실패:', error)
        if (isActive) {
          setOrder(null)
          setLoadError('주문 정보를 찾을 수 없거나 접근할 수 없습니다.')
        }
      } finally {
        if (isActive) setIsLoading(false)
      }
    })

    return () => {
      isActive = false
      unsubscribe()
    }
  }, [orderId])

  if (isLoading || loadError || !order) {
    return (
      <section className={styles.page} aria-labelledby="order-detail-title">
        <h2 id="order-detail-title" className={styles.title}>주문 상세</h2>
        <p role={loadError ? 'alert' : 'status'}>
          {loadError || '주문 정보를 불러오는 중입니다.'}
        </p>
        <button type="button" className={styles.backButton} onClick={() => navigate('/mypage/orders')}>
          목록으로
        </button>
      </section>
    )
  }

  const currentStepIndex = orderStepItems.findIndex((step) => step.key === order.status)
  const orderSteps = orderStepItems.map((step, index) => ({
    ...step,
    state: order.status === ORDER_STATUS.CANCELLED
      ? 'pending'
      : index < currentStepIndex
        ? 'complete'
        : index === currentStepIndex
          ? 'current'
          : 'pending',
    date: index <= currentStepIndex ? order.orderedAt : '',
  }))

  return (
    <section className={styles.page} aria-labelledby="order-detail-title">
      <h2 id="order-detail-title" className={styles.title}>주문 상세</h2>

      <section className={styles.orderSummary} aria-label="주문 요약">
        <div className={styles.orderTopRow}>
          <dl className={styles.orderMetaList}>
            <div className={styles.orderMetaItem}>
              <dt>주문 번호</dt>
              <dd>{order.id}</dd>
            </div>
            <div className={styles.orderMetaItem}>
              <dt>주문 일</dt>
              <dd>{order.orderedAt}</dd>
            </div>
            <div className={styles.orderMetaItem}>
              <dt>주문자</dt>
              <dd>{order.customerName}</dd>
            </div>
          </dl>

          <button type="button" className={styles.cancelButton}>주문 취소</button>
        </div>

        <div className={styles.stepper} aria-label="주문 진행 상태">
          {orderSteps.map((step) => (
            <div key={step.key} className={`${styles.step} ${styles[step.state]}`}>
              <span className={styles.stepDot} aria-hidden="true">✓</span>
              <strong className={styles.stepLabel}>{step.label}</strong>
              {step.date && <span className={styles.stepDate}>{step.date}</span>}
            </div>
          ))}
        </div>

        <div className={styles.mascotPlaceholder} aria-hidden="true">🦉</div>
      </section>

      <section className={styles.productSection} aria-labelledby="product-info-title">
        <h3 id="product-info-title" className={styles.sectionTitle}>주문 상품 정보</h3>

        <div className={styles.productColumns} aria-hidden="true">
          <span>상품 정보</span>
          <span>수량</span>
          <span>상품 금액</span>
        </div>

        <div className={styles.productList}>
          {order.products.map((product) => (
            <article key={product.id} className={styles.productRow}>
              <div className={styles.productInfo}>
                <ProductPlaceholder type={product.type} />
                <div className={styles.productCopy}>
                  <strong>{product.name}</strong>
                  <span>{formatPrice(product.price)}</span>
                </div>
              </div>
              <span className={styles.quantity}>{product.quantity}</span>
              <span className={styles.linePrice}>{formatPrice(product.price * product.quantity)}</span>
            </article>
          ))}
        </div>
      </section>

      <div className={styles.infoGrid}>
        <section className={`${styles.infoCard} ${styles.addressCard}`} aria-labelledby="address-title">
          <div className={styles.cardHeading}>
            <h3 id="address-title">배송지 정보</h3>
            <button type="button" className={styles.addressButton}>배송지 변경</button>
          </div>

          <dl className={styles.infoList}>
            <div><dt>받는 분</dt><dd>{order.address.receiver}</dd></div>
            <div><dt>연락처</dt><dd>{order.address.phone}</dd></div>
            <div className={styles.addressRow}><dt>주소</dt><dd>{order.address.address}</dd></div>
            <div className={styles.memoRow}><dt>배송 메모</dt><dd>{order.address.memo}</dd></div>
          </dl>
        </section>

        <section className={`${styles.infoCard} ${styles.paymentCard}`} aria-labelledby="payment-title">
          <h3 id="payment-title">결제 정보</h3>

          <dl className={styles.infoList}>
            <div><dt>결제 수단</dt><dd>{order.payment.method}</dd></div>
            <div><dt>상품 금액</dt><dd>{formatPrice(order.payment.productAmount)}</dd></div>
            <div><dt>배송비</dt><dd>{formatPrice(order.payment.shippingFee)}</dd></div>
            <div><dt>할인 금액</dt><dd>{formatPrice(order.payment.discount)}</dd></div>
            <div className={styles.totalRow}>
              <dt>결제 금액</dt>
              <dd>{formatPrice(order.payment.total)}</dd>
            </div>
          </dl>
        </section>

        <section className={`${styles.infoCard} ${styles.shippingCard}`} aria-labelledby="shipping-title">
          <h3 id="shipping-title">배송 정보</h3>

          <dl className={styles.infoList}>
            <div>
              <dt>배송 상태</dt>
              <dd><span className={styles.shippingBadge}>{order.shipping.status}</span></dd>
            </div>
            <div><dt>택배사</dt><dd>{order.shipping.carrier}</dd></div>
            <div><dt>송장 번호</dt><dd>{order.shipping.trackingNumber}</dd></div>
            <div><dt>예상 배송일</dt><dd>{order.shipping.expectedDate}</dd></div>
          </dl>
        </section>
      </div>

      <button type="button" className={styles.backButton} onClick={() => navigate('/mypage/orders')}>
        목록으로
      </button>
    </section>
  )
}

export default OrderDetail
