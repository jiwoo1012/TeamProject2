import { useLocation, useNavigate } from 'react-router-dom'
import { PATHS } from '../../routes/paths'
import cartTopOrnament from '../../assets/images/mypage/cartTopOrnament.svg'
import cartStepOrnament from '../../assets/images/mypage/cartStepOrnament.svg'
import styles from './OrderComplete.module.scss'

const formatPrice = (value) => `${value.toLocaleString('ko-KR')}원`

const formatDateTime = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

const OrderComplete = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const order = location.state?.order || null
  const itemCount = order?.items?.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0,
  ) || 0

  return (
  <section className={styles.page} aria-labelledby="complete-title">
    <img className={styles.topOrnament} src={cartTopOrnament} alt="" />

    <nav className={styles.purchaseSteps} aria-label="주문 진행 단계">
      <span>장바구니</span><img className={styles.stepFlower} src={cartStepOrnament} alt="" />
      <span>주문서 작성 / 결제</span><img className={styles.stepFlower} src={cartStepOrnament} alt="" />
      <strong>완료</strong>
    </nav>

    <article className={styles.completeCard}>
      <div className={styles.checkIcon} aria-hidden="true">
        <svg viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="29" />
          <path d="M18 32.5 27 42l20-23" />
        </svg>
      </div>

      <div className={styles.heroArea}>
        <div className={styles.completeCopy}>
          <h1 id="complete-title">
            {order ? '주문이 완료되었습니다!' : '주문 정보를 확인할 수 없습니다.'}
          </h1>
          <p className={styles.orderNumber}>주문번호 <strong>{order?.orderId || '-'}</strong></p>
          <p>
            {order
              ? <>주문하신 내역은 마이페이지 &gt; 주문 내역에서<br />확인하실 수 있습니다.</>
              : '장바구니에서 주문을 다시 진행해주세요.'}
          </p>
        </div>
      </div>

      <section className={styles.orderInfo} aria-labelledby="complete-order-info-title">
        <h2 id="complete-order-info-title">주문 정보</h2>
        <dl>
          <div><dt>주문일시</dt><dd>{formatDateTime(order?.createdAt)}</dd></div>
          <div><dt>주문 상품</dt><dd>{itemCount}개</dd></div>
          <div><dt>결제 금액</dt><dd>{formatPrice(Number(order?.totalAmount || 0))}</dd></div>
        </dl>
      </section>

      <div className={styles.actions}>
        <button type="button" className={styles.homeButton} onClick={() => navigate(PATHS.home)}>홈으로 이동</button>
        <button type="button" className={styles.historyButton} onClick={() => navigate('/mypage/orders')}>주문 내역 확인</button>
      </div>
    </article>

    <img
      className={`${styles.topOrnament} ${styles.bottomOrnament}`}
      src={cartTopOrnament}
      alt=""
    />
  </section>
  )
}

export default OrderComplete
