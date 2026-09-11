import { useState } from 'react'
import { Link } from 'react-router-dom'

import styles from './ProductCard.module.scss'


const ProductCard = ({
  product,
  hoverImageSrc,
  onAddToCart,
  onToggleWish,
  isWished = false,
  isInCart = false,
}) => {
  const [loadedHoverImage, setLoadedHoverImage] =
    useState(null)


  const discountRate =
    Number.parseInt(product.discountRate, 10) || 0


  const salePrice =
    Math.round(
      product.price
      * (1 - discountRate / 100)
    )


  const isSoldOut =
    product.status === 'soldout'
    || Number(product.stock) <= 0


  const getFlySourceImage = (event) =>
    event.currentTarget
      .closest('article')
      ?.querySelector(
        'img:not([aria-hidden="true"])'
      )
    ?? null


  const productImage = (
    <>
      <img
        className={styles.image}
        src={product.imageSrc}
        alt={product.productName}
        loading="lazy"
        decoding="async"
      />


      {hoverImageSrc
        && hoverImageSrc !== product.imageSrc
        && (
          <img
            key={hoverImageSrc}
            className={`
              ${styles.image}
              ${styles.hoverImage}
              ${
                loadedHoverImage === hoverImageSrc
                  ? styles.hoverImageReady
                  : ''
              }
            `}
            src={hoverImageSrc}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            onLoad={() =>
              setLoadedHoverImage(
                hoverImageSrc
              )
            }
            onError={() =>
              setLoadedHoverImage(null)
            }
          />
        )}


      {isSoldOut && (
        <span
          className={styles.soldOutOverlay}
          aria-label="품절 상품"
        >
          품절
        </span>
      )}
    </>
  )


  return (
    <article
      className={`
        ${styles.card}
        ${
          isSoldOut
            ? styles.soldOutCard
            : ''
        }
      `}
      data-product-guide-card="candidate"
    >

      {/* ========================================
          상품 이미지
      ======================================== */}

      <div className={styles.imageWrap}>

        <Link
          className={styles.imageLink}
          to={`/shop/${product.productId}`}
          aria-label={`${product.productName} 상세 보기`}
        >
          {productImage}
        </Link>


        {!isSoldOut && (
          <div className={styles.actions}>

            {/* 찜 */}
            <button
              className={`
                ${styles.iconButton}
                ${
                  isWished
                    ? styles.isWished
                    : ''
                }
              `}
              type="button"
              aria-label={
                isWished
                  ? '찜 취소'
                  : '찜하기'
              }
              aria-pressed={isWished}
              data-product-guide-target="wish"
              onClick={(event) => {
                event.preventDefault()

                onToggleWish?.(
                  product,
                  getFlySourceImage(event)
                )
              }}
            >
              {isWished ? '♥' : '♡'}
            </button>


            {/* 장바구니 */}
            <button
              className={`
                ${styles.cartButton}
                ${
                  isInCart
                    ? styles.cartButtonActive
                    : ''
                }
              `}
              type="button"
              aria-label={
                isInCart
                  ? '장바구니에서 삭제'
                  : '장바구니 담기'
              }
              aria-pressed={isInCart}
              data-product-guide-target="cart"
              onClick={(event) => {
                event.preventDefault()

                onAddToCart?.(
                  product,
                  getFlySourceImage(event)
                )
              }}
            >

              {/* PC / 태블릿 */}
              <span className={styles.cartText}>
                {
                  isInCart
                    ? '✓ 장바구니 담김'
                    : '장바구니 담기'
                }
              </span>


              {/* 모바일 */}
              <span
                className={styles.cartIcon}
                aria-hidden="true"
              >
                {isInCart ? (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M5 12.5L9.3 16.8L19 7.2"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <path
                      d="M3.5 5H5.5L7.2 14.2C7.35 15.05 8.1 15.65 8.95 15.65H17.4C18.2 15.65 18.9 15.15 19.15 14.4L21 8H6.1"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    <circle
                      cx="9.5"
                      cy="19"
                      r="1.2"
                      fill="currentColor"
                    />

                    <circle
                      cx="17.5"
                      cy="19"
                      r="1.2"
                      fill="currentColor"
                    />
                  </svg>
                )}
              </span>

            </button>

          </div>
        )}

      </div>


      {/* ========================================
          상품 정보
      ======================================== */}

      <div className={styles.info}>

        <h3 className={styles.name}>
          {product.productName}
        </h3>


        <div className={styles.priceRow}>

          {discountRate > 0 && (
            <span className={styles.discount}>
              {discountRate}%
            </span>
          )}


          {discountRate > 0 && (
            <del className={styles.originalPrice}>
              {product.price.toLocaleString('ko-KR')}원
            </del>
          )}


          <strong>
            {salePrice.toLocaleString('ko-KR')}원
          </strong>

        </div>

      </div>

    </article>
  )
}


export default ProductCard