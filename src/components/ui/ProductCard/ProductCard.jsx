import { Link } from 'react-router-dom'
import styles from './ProductCard.module.scss'

const ProductCard = ({ product, onAddToCart, onToggleWish, isWished = false }) => {
  const discountRate = Number.parseInt(product.discountRate, 10) || 0
  const salePrice = Math.round(product.price * (1 - discountRate / 100))

  return (
    <article className={styles.card}>
      <Link className={styles.imageLink} to={`/shop/${product.productId}`} aria-label={`${product.productName} 상세 보기`}>
        <img className={styles.image} src={product.imageSrc} alt={product.productName} loading="lazy" />
        <div className={styles.actions}>
          <button className={`${styles.iconButton} ${isWished ? styles.isWished : ''}`} type="button" aria-label={isWished ? '찜 취소' : '찜하기'} aria-pressed={isWished} onClick={(event) => { event.preventDefault(); onToggleWish?.(product) }}>
            {isWished ? '♥' : '♡'}
          </button>
          <button className={styles.cartButton} type="button" onClick={(event) => { event.preventDefault(); onAddToCart?.(product) }}>장바구니 담기</button>
        </div>
      </Link>
      <div className={styles.info}>
        <h3 className={styles.name}>{product.productName}</h3>
        <div className={styles.priceRow}>
          {discountRate > 0 && <span className={styles.discount}>{discountRate}%</span>}
          {discountRate > 0 && <del className={styles.originalPrice}>{product.price.toLocaleString('ko-KR')}원</del>}
          <strong>{salePrice.toLocaleString('ko-KR')}원</strong>
        </div>
      </div>
    </article>
  )
}

export default ProductCard
