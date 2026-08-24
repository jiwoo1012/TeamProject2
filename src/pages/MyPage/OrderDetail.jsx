import { useNavigate, useParams } from 'react-router-dom'
import styles from './OrderDetail.module.scss'

const orderSteps = [
  { key: 'received', label: '주문 접수', state: 'complete', date: '2025.05.01 15:30' },
  { key: 'paid', label: '결제 완료', state: 'complete', date: '2025.05.01 15:30' },
  { key: 'preparing', label: '배송 준비 중', state: 'current' },
  { key: 'shipping', label: '배송 중', state: 'pending' },
  { key: 'completed', label: '배송 완료', state: 'pending' },
]

const mockOrder = {
  id: '20250501-0001',
  orderedAt: '2025.05.01 14:35',
  customerName: '홍길동',
  products: [
    {
      id: 1,
      name: '자작 막걸리 여유 12도',
      price: 18000,
      quantity: 1,
      type: 'bottle',
    },
    {
      id: 2,
      name: '명란 오일 파스타 밀키트',
      price: 9800,
      quantity: 1,
      type: 'food',
    },
    {
      id: 3,
      name: '자작 도자기 술잔',
      price: 6000,
      quantity: 1,
      type: 'glass',
    },
  ],
  address: {
    receiver: '홍길동',
    phone: '010-1234-5678',
    address: '서울특별시 중구 세종대로 110, 롯데캐슬 101동 1004호',
    memo: '부재 시 문 앞에 놓아주세요.',
  },
  payment: {
    method: '신용카드',
    productAmount: 33800,
    shippingFee: 0,
    discount: 0,
    total: 33800,
  },
  shipping: {
    status: '상품 준비 중',
    carrier: 'CJ대한통운',
    trackingNumber: '-',
    expectedDate: '2025.05.03(토) ~ 05.04(일)',
  },
}

const formatPrice = (price) => `${price.toLocaleString('ko-KR')}원`

const ProductPlaceholder = ({ type }) => (
  <div className={`${styles.productPlaceholder} ${styles[type]}`} aria-hidden="true">
    <span />
  </div>
)

const OrderDetail = () => {
  const navigate = useNavigate()
  const { orderId } = useParams()
  const displayOrderId = orderId || mockOrder.id

  return (
    <section className={styles.page} aria-labelledby="order-detail-title">
      <h2 id="order-detail-title" className={styles.title}>주문 상세</h2>

      <section className={styles.orderSummary} aria-label="주문 요약">
        <div className={styles.orderTopRow}>
          <dl className={styles.orderMetaList}>
            <div className={styles.orderMetaItem}>
              <dt>주문 번호</dt>
              <dd>{displayOrderId}</dd>
            </div>
            <div className={styles.orderMetaItem}>
              <dt>주문 일</dt>
              <dd>{mockOrder.orderedAt}</dd>
            </div>
            <div className={styles.orderMetaItem}>
              <dt>주문자</dt>
              <dd>{mockOrder.customerName}</dd>
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
          {mockOrder.products.map((product) => (
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
            <div><dt>받는 분</dt><dd>{mockOrder.address.receiver}</dd></div>
            <div><dt>연락처</dt><dd>{mockOrder.address.phone}</dd></div>
            <div className={styles.addressRow}><dt>주소</dt><dd>{mockOrder.address.address}</dd></div>
            <div className={styles.memoRow}><dt>배송 메모</dt><dd>{mockOrder.address.memo}</dd></div>
          </dl>
        </section>

        <section className={`${styles.infoCard} ${styles.paymentCard}`} aria-labelledby="payment-title">
          <h3 id="payment-title">결제 정보</h3>

          <dl className={styles.infoList}>
            <div><dt>결제 수단</dt><dd>{mockOrder.payment.method}</dd></div>
            <div><dt>상품 금액</dt><dd>{formatPrice(mockOrder.payment.productAmount)}</dd></div>
            <div><dt>배송비</dt><dd>{formatPrice(mockOrder.payment.shippingFee)}</dd></div>
            <div><dt>할인 금액</dt><dd>{formatPrice(mockOrder.payment.discount)}</dd></div>
            <div className={styles.totalRow}>
              <dt>결제 금액</dt>
              <dd>{formatPrice(mockOrder.payment.total)}</dd>
            </div>
          </dl>
        </section>

        <section className={`${styles.infoCard} ${styles.shippingCard}`} aria-labelledby="shipping-title">
          <h3 id="shipping-title">배송 정보</h3>

          <dl className={styles.infoList}>
            <div>
              <dt>배송 상태</dt>
              <dd><span className={styles.shippingBadge}>{mockOrder.shipping.status}</span></dd>
            </div>
            <div><dt>택배사</dt><dd>{mockOrder.shipping.carrier}</dd></div>
            <div><dt>송장 번호</dt><dd>{mockOrder.shipping.trackingNumber}</dd></div>
            <div><dt>예상 배송일</dt><dd>{mockOrder.shipping.expectedDate}</dd></div>
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
