import { Link } from 'react-router-dom'

import cartGuideMakdong from '../../assets/webpImages/images/shop/cart-guide-makdong.webp'
import wishlistGuideMakdong from '../../assets/webpImages/images/shop/wishlist-guide-makdong.webp'

import styles from './ProductActionBar.module.scss'


const MAX_ITEM_COUNT = 5


const BAR_CONFIG = {
  cart: {
    character: cartGuideMakdong,
    label: '장바구니 바로가기',
    to: '/cart',
    removedMessage: '장바구니에서 삭제했어요.',
  },

  wish: {
    character: wishlistGuideMakdong,
    label: '찜 목록 바로가기',
    to: '/mypage/wishlist',
    removedMessage: '찜 목록에서 삭제했어요.',
  },
}


const ProductActionBar = ({
  type = 'cart',
  mode = 'added',
  items = [],
  onRemove,
  onUndo,
}) => {
  const config =
    BAR_CONFIG[type]
    ?? BAR_CONFIG.cart

  const visibleItems =
    items.slice(-MAX_ITEM_COUNT)

  const showAddSlot =
    visibleItems.length
    < MAX_ITEM_COUNT

  const isRemoved =
    mode === 'removed'


  return (
    <aside
      className={`
        ${styles.actionBar}
        ${styles[type]}
        ${
          isRemoved
            ? styles.removed
            : ''
        }
      `}
      role="status"
      aria-live="polite"
      aria-label={
        isRemoved
          ? config.removedMessage
          : (
              type === 'cart'
                ? '장바구니 담기 안내'
                : '찜 목록 안내'
            )
      }
      data-product-action-bar={type}
    >
      <div
        className={styles.characterWrap}
        aria-hidden="true"
      >
        <img
          src={config.character}
          alt=""
         loading="lazy" decoding="async" />
      </div>


      <div className={styles.items}>
        {visibleItems.map((item) => (
          <div
            className={`
              ${styles.itemSlot}
              ${styles.filled}
            `}
            key={item.productId}
            data-product-action-item={
              item.productId
            }
          >
            <img
              src={item.imageSrc}
              alt={item.productName}
             loading="lazy" decoding="async" />

            <button
              className={
                styles.removeButton
              }
              type="button"
              aria-label={`${item.productName} ${
                type === 'cart'
                  ? '장바구니에서 삭제'
                  : '찜 목록에서 삭제'
              }`}
              onClick={() =>
                onRemove?.(
                  item.productId
                )
              }
            >
              ×
            </button>
          </div>
        ))}


        {showAddSlot && (
          <div
            className={styles.addSlot}
            aria-hidden="true"
          >
            +
          </div>
        )}
      </div>


      {isRemoved ? (
        <div
          className={
            styles.removedAction
          }
        >
          <strong
            className={
              styles.removedMessage
            }
          >
            {config.removedMessage}
          </strong>

          <span
            className={
              styles.actionDivider
            }
            aria-hidden="true"
          />

          <button
            className={
              styles.undoButton
            }
            type="button"
            onClick={onUndo}
          >
            되돌리기
          </button>
        </div>
      ) : (
        <Link
          className={styles.shortcut}
          to={config.to}
        >
          <strong>
            {config.label}
          </strong>

          <span
            className={styles.arrow}
            aria-hidden="true"
          >
            →
          </span>
        </Link>
      )}
    </aside>
  )
}


export default ProductActionBar
