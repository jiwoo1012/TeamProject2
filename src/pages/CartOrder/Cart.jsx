import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PATHS } from '../../routes/paths'
import { getCart, saveCart } from '../../utils/cartStorage'
import styles from './Cart.module.scss'

const initialCartItems = [
  {
    id: 'liq_001',
    name: '자작 막걸리 여유 12도',
    option: '500ml | 12도',
    price: 26000,
    discount: 8000,
    quantity: 1,
    imageUrl: '',
  },
  {
    id: 'liq_002',
    name: '자작 막걸리 여유 12도',
    option: '500ml | 12도',
    price: 18000,
    discount: 0,
    quantity: 1,
    imageUrl: '',
  },
  {
    id: 'liq_003',
    name: '자작 막걸리 여유 12도',
    option: '500ml | 12도',
    price: 18000,
    discount: 0,
    quantity: 1,
    imageUrl: '',
  },
]

const mockRecommendations = [
  { id: 'rec-01', name: '자작 막걸리 여유 12도', price: 18000, imageUrl: '' },
  { id: 'rec-02', name: '자작 막걸리 여유 12도', price: 18000, imageUrl: '' },
  { id: 'rec-03', name: '자작 막걸리 여유 12도', price: 18000, imageUrl: '' },
]

const formatPrice = (value) => `${value.toLocaleString('ko-KR')}원`

const getInitialCartItems = () => {
  const savedCart = getCart()
  const hasSavedCart = localStorage.getItem('jajak_cart') !== null

  if (!hasSavedCart) {
    return initialCartItems
  }

  return savedCart
    .map((savedItem) => {
      const normalizedProductId = String(savedItem.productId || '').replace('liq-', 'liq_')
      const initialItem = initialCartItems.find((item) => item.id === normalizedProductId)
      const quantity = Number(savedItem.quantity)

      if (!initialItem || !Number.isFinite(quantity) || quantity < 1) {
        return null
      }

      return { ...initialItem, quantity: Math.floor(quantity) }
    })
    .filter(Boolean)
}

const StepFlower = () => (
  <svg className={styles.stepFlower} viewBox="0 0 26 26" fill="none" aria-hidden="true">
    <circle cx="13" cy="5" r="3.5" />
    <circle cx="21" cy="13" r="3.5" />
    <circle cx="13" cy="21" r="3.5" />
    <circle cx="5" cy="13" r="3.5" />
    <circle cx="13" cy="13" r="2.5" />
  </svg>
)

const PurchaseSteps = () => (
  <nav className={styles.purchaseSteps} aria-label="주문 진행 단계">
    <strong className={styles.currentStep}>장바구니</strong>
    <StepFlower />
    <span>주문서 작성 / 결제</span>
    <StepFlower />
    <span>완료</span>
  </nav>
)

const ProductImage = ({ imageUrl, name }) => (
  <div className={styles.productImage}>
    {imageUrl ? <img src={imageUrl} alt={name} /> : <span>IMG</span>}
  </div>
)

const CartCheckbox = ({ checked, onChange, label, tone = 'body' }) => (
  <label className={`${styles.cartCheckbox} ${tone === 'head' ? styles.headCheckbox : ''}`}>
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={label}
    />
    <span className={styles.checkboxBox} aria-hidden="true" />
  </label>
)

const Cart = () => {
  const navigate = useNavigate()
  const [items, setItems] = useState(getInitialCartItems)
  const [selectedIds, setSelectedIds] = useState(() => items.map((item) => item.id))

  useEffect(() => {
    const cartItems = items.map((item) => ({
      productId: item.id,
      quantity: item.quantity,
    }))

    saveCart(cartItems)
  }, [items])

  const [pointInput, setPointInput] = useState('0')

  const isEmpty = items.length === 0
  const isAllSelected = items.length > 0 && selectedIds.length === items.length

  const totals = useMemo(() => {
    const selectedItems = items.filter((item) => selectedIds.includes(item.id))
    const itemTotal = selectedItems.reduce(
      (sum, item) => sum + (item.price - item.discount) * item.quantity,
      0,
    )
    const shippingFee = itemTotal > 0 ? 0 : 0
    const usedPoints = Math.min(Number(pointInput) || 0, 3000, itemTotal)

    return {
      itemTotal,
      shippingFee,
      usedPoints,
      total: Math.max(itemTotal + shippingFee - usedPoints, 0),
    }
  }, [items, selectedIds, pointInput])

  const handleSelectAll = () => {
    setSelectedIds(isAllSelected ? [] : items.map((item) => item.id))
  }

  const handleSelectItem = (id) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id],
    )
  }

  const handleQuantity = (id, amount) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity + amount) } : item,
      ),
    )
  }

  const handleDeleteSelected = () => {
    setItems((current) => current.filter((item) => !selectedIds.includes(item.id)))
    setSelectedIds([])
  }

  const handleClearAll = () => {
    setItems([])
    setSelectedIds([])
    setPointInput('0')
  }

  const handleUseAllPoints = () => {
    setPointInput(String(Math.min(3000, totals.itemTotal)))
  }

  const handleOrder = () => {
    const selectedItems = items.filter((item) => selectedIds.includes(item.id))

    navigate(PATHS.checkout, {
      state: {
        items: selectedItems,
        usedPoints: totals.usedPoints,
      },
    })
  }

  return (
    <section className={styles.page} aria-labelledby="cart-title">
      <div className={styles.topOrnament} aria-hidden="true" />

      <header className={styles.pageHeader}>
        <h1 id="cart-title">장바구니</h1>
        <PurchaseSteps />
      </header>

      <div className={styles.mainGrid}>
        <div className={styles.cartArea}>
          {isEmpty ? (
            <div className={styles.emptyCard}>
              <div className={styles.emptyCircle} aria-hidden="true" />
              <strong>장바구니가 비어 있습니다.</strong>
              <button type="button" className={styles.browseButton}>상품 둘러보기</button>
            </div>
          ) : (
            <div className={styles.cartTable}>
              <div className={styles.cartTableHead}>
                <div className={styles.checkLabel}>
                  <CartCheckbox
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    label="전체 선택"
                    tone="head"
                  />
                  <span>전체 선택</span>
                </div>
                <span>수량</span>
                <span>할인</span>
                <span>합계</span>
                <span>선택</span>
              </div>

              <div className={styles.cartRows}>
                {items.map((item) => {
                  const lineTotal = (item.price - item.discount) * item.quantity
                  return (
                    <article className={styles.cartRow} key={item.id}>
                      <div className={styles.itemInfo}>
                        <ProductImage imageUrl={item.imageUrl} name={item.name} />
                        <div className={styles.itemCopy}>
                          <strong>{item.name}</strong>
                          <span>{item.option}</span>
                        </div>
                      </div>

                      <div className={styles.quantityControl} aria-label={`${item.name} 수량`}>
                        <button type="button" onClick={() => handleQuantity(item.id, -1)} aria-label="수량 줄이기">−</button>
                        <span>{item.quantity}</span>
                        <button type="button" onClick={() => handleQuantity(item.id, 1)} aria-label="수량 늘리기">+</button>
                      </div>

                      <span className={styles.discountValue}>
                        {item.discount > 0 ? `-${formatPrice(item.discount)}` : '0원'}
                      </span>
                      <strong className={styles.lineTotal}>{formatPrice(lineTotal)}</strong>

                      <div className={styles.rowCheck}>
                        <CartCheckbox
                          checked={selectedIds.includes(item.id)}
                          onChange={() => handleSelectItem(item.id)}
                          label={`${item.name} 선택`}
                        />
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>
          )}

          {!isEmpty && (
            <div className={styles.cartActions}>
              <div className={styles.cartActionGroup}>
                <button type="button" className={styles.textButton} onClick={handleDeleteSelected}>
                  선택 제품 삭제
                </button>
                <button type="button" className={styles.clearAllButton} onClick={handleClearAll}>
                  모두 비우기
                </button>
              </div>
              <button type="button" className={styles.outlineButton}>쇼핑 계속하기</button>
            </div>
          )}

          <section className={styles.recommendationCard} aria-labelledby="pairing-title">
            <div className={styles.recommendationHeader}>
              <h2 id="pairing-title">막동이의 페어링 추천</h2>
              <p>함께하면 더 맛있는 페어링을 추천드려요.</p>
            </div>

            {isEmpty ? (
              <div className={styles.emptyRecommendations}>
                {Array.from({ length: 5 }, (_, index) => (
                  <div className={styles.emptyRecommendationThumb} key={index}>IMG</div>
                ))}
              </div>
            ) : (
              <div className={styles.recommendationList}>
                {mockRecommendations.map((product) => (
                  <article className={styles.recommendationItem} key={product.id}>
                    <ProductImage imageUrl={product.imageUrl} name={product.name} />
                    <div className={styles.recommendationCopy}>
                      <strong>{product.name}</strong>
                      <span>{formatPrice(product.price)}</span>
                    </div>
                    <button type="button">+ 담기</button>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className={`${styles.summaryCard} ${isEmpty ? styles.emptySummary : ''}`} aria-label="주문 금액">
          <h2>주문 금액</h2>
          <dl className={styles.summaryList}>
            <div><dt>총 상품 금액</dt><dd>{isEmpty ? '' : formatPrice(totals.itemTotal)}</dd></div>
            <div><dt>상품 할인</dt><dd>{isEmpty ? '' : formatPrice(0)}</dd></div>
            <div><dt>배송비</dt><dd>{isEmpty ? '' : formatPrice(totals.shippingFee)}</dd></div>
          </dl>

          {!isEmpty && (
            <>
              <div className={styles.pointSection}>
                <div className={styles.pointHeading}>
                  <h3>포인트 사용</h3>
                  <span>보유 3,000P</span>
                </div>
                <div className={styles.pointInputRow}>
                  <label>
                    <span className={styles.srOnly}>사용 포인트</span>
                    <input
                      type="number"
                      min="0"
                      max="3000"
                      value={pointInput}
                      onChange={(event) => setPointInput(event.target.value)}
                    />
                    <span>P</span>
                  </label>
                  <button type="button" onClick={handleUseAllPoints}>전액사용</button>
                </div>
                <p>사용 포인트 <strong>-{totals.usedPoints.toLocaleString('ko-KR')}P</strong></p>
              </div>

              <div className={styles.totalPrice}>
                <span>총 결제 금액</span>
                <strong>{formatPrice(totals.total)}</strong>
              </div>
            </>
          )}

          <button
            type="button"
            className={styles.orderButton}
            disabled={isEmpty || selectedIds.length === 0}
            onClick={handleOrder}
          >
            {isEmpty ? '결제하기' : '주문하기'}
          </button>
        </aside>
      </div>
    </section>
  )
}

export default Cart
