import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PATHS } from '../../routes/paths'
import cartTopOrnament from '../../assets/images/mypage/cartTopOrnament.svg'
import cartStepOrnament from '../../assets/images/mypage/cartStepOrnament.svg'
import orderCompleteSeal from '../../assets/images/mypage/orderCompleteSeal.png'
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

const CelebrationCanvas = () => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = canvas?.parentElement
    if (!canvas || !container) return undefined

    const context = canvas.getContext('2d')
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const particleColors = ['#4D7E7B', '#56BEB7', '#C49A58', '#E1D9CE']
    const particles = Array.from({ length: reduceMotion ? 18 : 42 }, (_, index) => ({
      x: 0.16 + ((index * 37) % 68) / 100,
      y: 0.05 + ((index * 19) % 28) / 100,
      size: 2 + (index % 4),
      drift: ((index % 7) - 3) * 0.009,
      speed: 0.026 + (index % 5) * 0.006,
      delay: (index % 9) * 80,
      color: particleColors[index % particleColors.length],
      rotation: (index * 53) % 360,
    }))
    let animationFrameId = 0
    let startedAt = 0

    const resize = () => {
      const bounds = container.getBoundingClientRect()
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(1, Math.floor(bounds.width * pixelRatio))
      canvas.height = Math.max(1, Math.floor(bounds.height * pixelRatio))
      canvas.style.width = `${bounds.width}px`
      canvas.style.height = `${bounds.height}px`
      context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
    }

    const draw = (timestamp) => {
      const bounds = container.getBoundingClientRect()
      const elapsed = reduceMotion ? 900 : Math.min(timestamp - startedAt, 4200)
      context.clearRect(0, 0, bounds.width, bounds.height)

      particles.forEach((particle) => {
        const progress = Math.max(0, Math.min(1, (elapsed - particle.delay) / 2800))
        if (progress <= 0) return

        const x = bounds.width * (particle.x + particle.drift * progress * 12)
        const y = bounds.height * (particle.y + particle.speed * progress * 12)
        const alpha = (1 - progress) * 0.58

        context.save()
        context.translate(x, y)
        context.rotate((particle.rotation + progress * 150) * (Math.PI / 180))
        context.fillStyle = particle.color
        context.globalAlpha = alpha
        context.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size * 1.7)
        context.restore()
      })

      if (!reduceMotion && elapsed < 4200) {
        animationFrameId = window.requestAnimationFrame(draw)
      }
    }

    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)
    resize()
    startedAt = window.performance.now()
    draw(startedAt)

    return () => {
      resizeObserver.disconnect()
      window.cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return <canvas className={styles.celebrationCanvas} ref={canvasRef} aria-hidden="true" />
}

const OrderComplete = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const order = location.state?.order || null
  const itemCount = order?.items?.reduce(
    (sum, item) => sum + Number(item.quantity || 0),
    0,
  ) || 0

  useEffect(() => {
    if (!order) navigate('/mypage/orders', { replace: true })
  }, [navigate, order])

  if (!order) return null

  return (
  <section className={styles.page} aria-labelledby="complete-title">
    <img className={styles.topOrnament} src={cartTopOrnament} alt="" />

    <nav className={styles.purchaseSteps} aria-label="주문 진행 단계">
      <span>장바구니</span><img className={styles.stepFlower} src={cartStepOrnament} alt="" />
      <span>주문서 작성 / 결제</span><img className={styles.stepFlower} src={cartStepOrnament} alt="" />
      <strong>완료</strong>
    </nav>

    <article className={styles.completeCard}>
      <CelebrationCanvas />
      <img className={styles.checkIcon} src={orderCompleteSeal} alt="" aria-hidden="true" />

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

  </section>
  )
}

export default OrderComplete
