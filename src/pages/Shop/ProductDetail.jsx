import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ProductCard from '../../components/ui/ProductCard/ProductCard'
import { foods, products } from '../../data/products'
import pairings from '../../data/pairings.json'
import styles from './ProductDetail.module.scss'

const productImages = import.meta.glob('../../assets/images/products/product*.png', { eager: true, import: 'default' })
const detailImages = import.meta.glob('../../assets/images/products/productDetail/**/*.{png,jpg,jpeg,webp}', { eager: true, import: 'default' })

const resolveProductImage = (imageUrl) => Object.entries(productImages).find(([path]) => path.endsWith(`/${imageUrl}`))?.[1]
const getFolderName = (imageUrl = '') => imageUrl.replace(/\.[^.]+$/, '')
const getDetailImages = (imageUrl) => {
  const folder = getFolderName(imageUrl)
  return Object.entries(detailImages)
    .filter(([path]) => path.includes(`/productDetail/${folder}/`))
    .sort(([pathA], [pathB]) => pathA.localeCompare(pathB, 'ko', { numeric: true }))
    .map(([, source]) => source)
}
const withImage = (product) => product && ({ ...product, imageSrc: resolveProductImage(product.imageUrl) })

const MiniPairingCard = ({ product }) => (
  <article className={styles.miniCard}>
    <Link to={`/shop/${product.productId}`}><img src={product.imageSrc} alt={product.productName} /></Link>
    <div><span>{product.productName}</span><strong>{product.price.toLocaleString('ko-KR')}원</strong></div>
    <Link className={styles.miniCart} to={`/shop/${product.productId}`}>장바구니 담기</Link>
  </article>
)

const ProductDetail = () => {
  const { productId } = useParams()
  const [activeTab, setActiveTab] = useState('detail')
  const [openAccordion, setOpenAccordion] = useState(null)
  const [pairPage, setPairPage] = useState(0)
  const [isWished, setIsWished] = useState(false)
  const [notice, setNotice] = useState('')
  const [reviews, setReviews] = useState([])
  const [reviewNickname, setReviewNickname] = useState('')
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewContent, setReviewContent] = useState('')
  const [editingReviewId, setEditingReviewId] = useState(null)
  const authorIdRef = useRef(globalThis.crypto?.randomUUID?.() ?? `guest-${Date.now()}`)

  useEffect(() => {
    const page = document.querySelector(`.${styles.page}`)
    const header = document.querySelector('body > #root header') ?? document.querySelector('header')
    if (!page || !header) return undefined
    const previousPosition = header.style.position
    const previousTop = header.style.top
    const previousWidth = header.style.width
    const updateHeaderHeight = () => page.style.setProperty('--detail-header-height', `${header.getBoundingClientRect().height}px`)
    header.style.position = 'sticky'
    header.style.top = '0'
    header.style.width = '100%'
    updateHeaderHeight()
    const resizeObserver = new ResizeObserver(updateHeaderHeight)
    resizeObserver.observe(header)
    return () => {
      resizeObserver.disconnect()
      page.style.removeProperty('--detail-header-height')
      header.style.position = previousPosition
      header.style.top = previousTop
      header.style.width = previousWidth
    }
  }, [])

  const product = useMemo(() => {
    const exactProduct = products.find((item) => item.productId === productId)
    if (exactProduct) return withImage(exactProduct)
    return withImage(products.find((item) => getFolderName(item.imageUrl) === `product${productId}`))
  }, [productId])

  const productDetailImages = useMemo(() => getDetailImages(product?.imageUrl), [product])
  const relatedProducts = useMemo(() => {
    if (!product) return []
    const directPairing = pairings.find(({ liquorId }) => liquorId === product.productId)
    let ids = directPairing ? [...directPairing.pairedFoodIds, ...directPairing.recommendedGlassIds] : []
    if (!directPairing) {
      ids = pairings
        .filter(({ pairedFoodIds, recommendedGlassIds }) => [...pairedFoodIds, ...recommendedGlassIds].includes(product.productId))
        .map(({ liquorId }) => liquorId)
    }
    return [...new Set(ids)].map((id) => withImage(products.find((item) => item.productId === id))).filter(Boolean)
  }, [product])

  const recommendedFoods = useMemo(() => {
    if (!product) return []
    const directPairing = pairings.find(({ liquorId }) => liquorId === product.productId)
    if (directPairing) return directPairing.pairedFoodIds.map((id) => withImage(foods.find((item) => item.productId === id))).filter(Boolean)
    return relatedProducts.filter((item) => item.productType === '안주' && item.productId !== product.productId)
  }, [product, relatedProducts])

  if (!product) return <main className={styles.notFound}><h1>상품을 찾을 수 없습니다.</h1><Link to="/shop">상품 목록으로 돌아가기</Link></main>

  const discountRate = Number.parseInt(product.discountRate, 10) || 0
  const salePrice = Math.round(product.price * (1 - discountRate / 100))
  const pairPageCount = Math.max(1, Math.ceil(relatedProducts.length / 2))
  const visiblePairings = relatedProducts.slice(pairPage * 2, pairPage * 2 + 2)
  const accordions = [
    { id: 'delivery', title: '무료 배송 & 반품', content: '배송 및 반품 정책은 주문 단계에서 최종 확인할 수 있습니다.' },
    product.allergyCautionInfo && { id: 'allergy', title: '알레르기 주의사항', content: product.allergyCautionInfo },
    product.recommendedDrinkingTemperature && { id: 'temperature', title: '추천 음용 온도', content: product.recommendedDrinkingTemperature },
  ].filter(Boolean)

  const handleNotice = (message) => {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 1800)
  }

  const handleReviewSubmit = (event) => {
    event.preventDefault()
    const nickname = reviewNickname.trim()
    const content = reviewContent.trim()
    if (!nickname || !content || reviewRating === 0) return
    if (editingReviewId) {
      setReviews((current) => current.map((review) => review.id === editingReviewId ? { ...review, nickname, rating: reviewRating, content } : review))
    } else {
      setReviews((current) => [{ id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`, authorId: authorIdRef.current, nickname, rating: reviewRating, content, createdAt: new Date().toLocaleDateString('ko-KR') }, ...current])
    }
    setEditingReviewId(null)
    setReviewNickname('')
    setReviewRating(0)
    setReviewContent('')
  }

  const handleReviewEdit = (review) => {
    setEditingReviewId(review.id)
    setReviewNickname(review.nickname)
    setReviewRating(review.rating)
    setReviewContent(review.content)
  }

  const handleReviewDelete = (reviewId) => {
    setReviews((current) => current.filter(({ id }) => id !== reviewId))
    if (editingReviewId === reviewId) {
      setEditingReviewId(null)
      setReviewNickname('')
      setReviewRating(0)
      setReviewContent('')
    }
  }

  const averageRating = reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0

  return (
    <main className={styles.page}>
      <div className={styles.layout}>
        <div className={styles.mainColumn}>
          <section className={styles.gallery} aria-label="상품 이미지">
            <div className={styles.mainImage}><img src={product.imageSrc} alt={product.productName} /></div>
            <div className={styles.thumbnails}>
              {productDetailImages.slice(0, 3).map((image, index) => <img src={image} alt={`${product.productName} 상세 이미지 ${index + 1}`} key={image} />)}
            </div>
          </section>

          <div className={styles.tabs} role="tablist">
            <button className={activeTab === 'detail' ? styles.activeTab : ''} type="button" role="tab" aria-selected={activeTab === 'detail'} onClick={() => setActiveTab('detail')}>상품 상세 정보</button>
            <button className={activeTab === 'review' ? styles.activeTab : ''} type="button" role="tab" aria-selected={activeTab === 'review'} onClick={() => setActiveTab('review')}>리뷰({reviews.length})</button>
          </div>

          {activeTab === 'detail' ? (
            <section className={styles.detailContent} aria-label="상품 상세 정보">
              {productDetailImages.map((image, index) => <img src={image} alt={`${product.productName} 상세 설명 ${index + 1}`} loading="lazy" key={`${image}-detail`} />)}
            </section>
          ) : (
            <section className={styles.reviewSection}>
              <form className={styles.reviewForm} onSubmit={handleReviewSubmit}>
                <h2>{editingReviewId ? '리뷰 수정' : '리뷰 작성'}</h2>
                <label className={styles.nicknameField}><span>닉네임</span><input value={reviewNickname} maxLength={20} required onChange={(event) => setReviewNickname(event.target.value)} /></label>
                <fieldset className={styles.starField}>
                  <legend>별점</legend>
                  <div>{[1, 2, 3, 4, 5].map((star) => <button className={star <= reviewRating ? styles.selectedStar : ''} type="button" aria-label={`${star}점`} aria-pressed={star === reviewRating} onClick={() => setReviewRating(star)} key={star}>★</button>)}</div>
                </fieldset>
                <label className={styles.contentField}><span>리뷰 내용</span><textarea value={reviewContent} rows="5" maxLength={500} required onChange={(event) => setReviewContent(event.target.value)} /></label>
                <div className={styles.formActions}>
                  {editingReviewId && <button type="button" onClick={() => { setEditingReviewId(null); setReviewNickname(''); setReviewRating(0); setReviewContent('') }}>취소</button>}
                  <button type="submit" disabled={!reviewNickname.trim() || !reviewContent.trim() || reviewRating === 0}>{editingReviewId ? '수정 완료' : '리뷰 등록'}</button>
                </div>
              </form>
              <div className={styles.reviewList}>
                {reviews.length === 0 ? <p className={styles.reviewEmpty}>아직 등록된 리뷰가 없습니다.</p> : reviews.map((review) => (
                  <article className={styles.reviewItem} key={review.id}>
                    <header><strong>{review.nickname}</strong><span>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span><time>{review.createdAt}</time></header>
                    <p>{review.content}</p>
                    {review.authorId === authorIdRef.current && <div><button type="button" onClick={() => handleReviewEdit(review)}>수정</button><button type="button" onClick={() => handleReviewDelete(review.id)}>삭제</button></div>}
                  </article>
                ))}
              </div>
            </section>
          )}

          {recommendedFoods.length > 0 && (
            <section className={styles.recommendedFoods}>
              <h2>추천 안주</h2>
              <div className={styles.foodGrid}>{recommendedFoods.map((food) => <ProductCard product={food} key={food.productId} />)}</div>
            </section>
          )}
        </div>

        <aside className={styles.purchasePanel}>
          <p className={styles.brand}>{product.brandManufacturer}</p>
          <h1>{product.productName}</h1>
          <div className={styles.price}>{discountRate > 0 && <span>{discountRate}%</span>}<strong>{salePrice.toLocaleString('ko-KR')}원</strong></div>
          <p className={styles.description}>{product.productDescription}</p>
          <div className={styles.rating} aria-label={reviews.length ? `평균 별점 ${averageRating.toFixed(1)}점` : '평점 정보 없음'}><span>{reviews.length ? `${averageRating.toFixed(1)} ★` : '☆☆☆☆☆'}</span><small>리뷰 {reviews.length}개</small></div>
          <div className={styles.purchaseActions}>
            <button className={`${styles.wishButton} ${isWished ? styles.wished : ''}`} type="button" onClick={() => setIsWished((value) => !value)}>{isWished ? '♥ 찜한 상품' : '♡ 찜하기'}</button>
            <button className={styles.cartButton} type="button" onClick={() => handleNotice('장바구니 기능 연결 전입니다.')}>장바구니에 담기</button>
          </div>
          {notice && <p className={styles.notice} role="status">{notice}</p>}

          <div className={styles.accordions}>
            {accordions.map((item) => (
              <div className={styles.accordion} key={item.id}>
                <button type="button" aria-expanded={openAccordion === item.id} onClick={() => setOpenAccordion((open) => open === item.id ? null : item.id)}><span>{item.title}</span><span>{openAccordion === item.id ? '−' : '+'}</span></button>
                <div className={`${styles.accordionContent} ${openAccordion === item.id ? styles.open : ''}`}><p>{item.content}</p></div>
              </div>
            ))}
          </div>

          {relatedProducts.length > 0 && (
            <section className={styles.pairings}>
              <h2>추천 조합</h2>
              <div className={styles.miniGrid} key={pairPage}>{visiblePairings.map((item) => <MiniPairingCard product={item} key={item.productId} />)}</div>
              <div className={styles.dots} aria-label="추천 조합 페이지">
                {Array.from({ length: pairPageCount }, (_, index) => <button className={pairPage === index ? styles.activeDot : ''} type="button" aria-label={`${index + 1}페이지`} onClick={() => setPairPage(index)} key={index} />)}
              </div>
            </section>
          )}
        </aside>
      </div>
    </main>
  )
}

export default ProductDetail
