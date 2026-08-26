import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../../components/ui/ProductCard/ProductCard'
import Pagination from '../../components/ui/Pagination/Pagination'
import { products } from '../../data/products'
import { subscribeToAuthState } from '../../firebase/auth'
import { getCollection, deleteDocument } from '../../firebase/firestore'
import { getCart, saveCart } from '../../utils/cartStorage'
import makdongImage from '../../assets/characters/M007_Poses03.png'
import styles from './WishList.module.scss'

const productImages = import.meta.glob('../../assets/images/products/product*.png', { eager: true, import: 'default' })
const resolveImage = (imageUrl) => Object.entries(productImages).find(([path]) => path.endsWith(`/${imageUrl}`))?.[1]

const MAX_WISHLIST_COUNT = 100
const PAGE_SIZE_OPTIONS = [10, 20]

const WishList = () => {
  const [uid, setUid] = useState(null)
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [wishlistDocs, setWishlistDocs] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [notice, setNotice] = useState('')
  const [sortBy, setSortBy] = useState('latest')
  const [pageSize, setPageSize] = useState(10)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user) => {
      setUid(user && !user.isAnonymous ? user.uid : null)
      setIsAuthReady(true)
    })
    return unsubscribe
  }, [])

  // 저장 위치: users/{uid}/wishlist/{productId} (AGENTS.md 확정)
  useEffect(() => {
    if (!isAuthReady) return undefined
    if (!uid) {
      setWishlistDocs([])
      setIsLoading(false)
      return undefined
    }

    let isCancelled = false
    setIsLoading(true)

    getCollection(`users/${uid}/wishlist`)
      .then((docs) => {
        if (isCancelled) return
        setWishlistDocs(docs)
      })
      .catch((error) => {
        console.error('찜 목록 조회 실패:', error)
        if (!isCancelled) {
          setWishlistDocs([])
          handleNotice('찜 목록을 불러오지 못했습니다.')
        }
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false)
      })

    return () => {
      isCancelled = true
    }
  }, [uid, isAuthReady])

  // Wishlist에는 productId만 저장되어 있으므로, 실제 상품 정보는
  // 현재 상품 데이터에서 조회해 조합한다 (AGENTS.md 확정).
  // 상품을 찾을 수 없는 경우 유효 상품으로 표시하지 않는다.
  const wishlistProducts = useMemo(() => {
    const combined = wishlistDocs
      .map((wishDoc) => {
        const productId = wishDoc.productId ?? wishDoc.id
        const product = products.find((item) => item.productId === productId)
        if (!product) return null
        return {
          ...product,
          imageSrc: resolveImage(product.imageUrl),
          wishedAt: wishDoc.createdAt?.seconds ?? 0,
        }
      })
      .filter(Boolean)

    const sorted = [...combined].sort((a, b) => (
      sortBy === 'latest' ? b.wishedAt - a.wishedAt : a.wishedAt - b.wishedAt
    ))

    return sorted
  }, [wishlistDocs, sortBy])

  const totalCount = wishlistProducts.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const visibleProducts = wishlistProducts.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  useEffect(() => {
    setCurrentPage(1)
  }, [pageSize, sortBy, totalCount])

  const handleNotice = (message) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 1800)
  }

  const handleRemoveWish = async (product) => {
    if (!uid) return
    try {
      await deleteDocument(`users/${uid}/wishlist`, product.productId)
      setWishlistDocs((current) => current.filter((wishDoc) => (wishDoc.productId ?? wishDoc.id) !== product.productId))
      handleNotice('찜 목록에서 삭제했습니다.')
    } catch (error) {
      console.error('찜 삭제 실패:', error)
      handleNotice('삭제 중 오류가 발생했습니다.')
    }
  }

  // 찜 상품 장바구니 이동 (AGENTS.md 확정: jajak_cart는 productId, quantity만 저장)
  const handleAddToCart = (product) => {
    const cart = getCart()
    const existing = cart.find((item) => item.productId === product.productId)
    const nextCart = existing
      ? cart.map((item) => (
        item.productId === product.productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
      : [...cart, { productId: product.productId, quantity: 1 }]

    saveCart(nextCart)
    handleNotice('장바구니에 담았습니다.')
  }

  if (isLoading) {
    return (
      <section className={styles.page}>
        <p className={styles.status}>찜 목록을 불러오는 중입니다...</p>
      </section>
    )
  }

  return (
    <section className={styles.page}>
      <div className={styles.banner}>
        <img src={makdongImage} alt="" className={styles.bannerCharacter} />
        <p className={styles.bannerText}>
          찜한 상품은 최대 {MAX_WISHLIST_COUNT}개까지 저장할 수 있어요.
        </p>
        {totalCount > 0 && (
          <div className={styles.bannerCount}>
            <span>찜한 상품</span>
            <strong>{totalCount}개</strong>
          </div>
        )}
      </div>

      {notice && <p className={styles.notice} role="status">{notice}</p>}

      {totalCount === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon} aria-hidden="true" />
          <h2>찜한 상품이 없습니다.</h2>
          <p>
            마음에 드는 상품을 찜해두고
            <br />
            나중에 편하게 확인해보세요.
          </p>
          <Link to="/shop" className={styles.emptyButton}>상품 둘러보기</Link>
        </div>
      ) : (
        <>
          <div className={styles.listHeader}>
            <h2>찜한 상품 {totalCount}개</h2>

            <div className={styles.listControls}>
              <div className={styles.pageSizeGroup} role="group" aria-label="한 페이지에 보여줄 상품 수">
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <button
                    type="button"
                    className={pageSize === size ? styles.activePageSize : ''}
                    onClick={() => setPageSize(size)}
                    key={size}
                  >
                    {size === PAGE_SIZE_OPTIONS[PAGE_SIZE_OPTIONS.length - 1] ? `전체보기 ${size}` : `한번에 ${size}`}
                  </button>
                ))}
              </div>

              <label className={styles.sortSelect}>
                <span className="sr-only">정렬</span>
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                  <option value="latest">최신순</option>
                  <option value="oldest">오래된순</option>
                </select>
              </label>
            </div>
          </div>

          <div className={styles.productGrid}>
            {visibleProducts.map((product) => (
              <ProductCard
                product={product}
                isWished
                onToggleWish={handleRemoveWish}
                onAddToCart={handleAddToCart}
                key={product.productId}
              />
            ))}
          </div>

          <Pagination currentPage={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
        </>
      )}
    </section>
  )
}

export default WishList
