import { useEffect, useMemo, useState } from 'react'
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
            <button className={activeTab === 'review' ? styles.activeTab : ''} type="button" role="tab" aria-selected={activeTab === 'review'} onClick={() => setActiveTab('review')}>리뷰(0)</button>
          </div>

          {activeTab === 'detail' ? (
            <section className={styles.detailContent} aria-label="상품 상세 정보">
              {productDetailImages.map((image, index) => <img src={image} alt={`${product.productName} 상세 설명 ${index + 1}`} loading="lazy" key={`${image}-detail`} />)}
            </section>
          ) : <section className={styles.reviewEmpty}>아직 등록된 리뷰가 없습니다.</section>}

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
          <div className={styles.rating} aria-label="평점 정보 없음"><span>☆☆☆☆☆</span><small>리뷰 0개</small></div>
          <button className={`${styles.wishButton} ${isWished ? styles.wished : ''}`} type="button" onClick={() => setIsWished((value) => !value)}>{isWished ? '♥ 찜한 상품' : '♡ 찜하기'}</button>
          <button className={styles.cartButton} type="button" onClick={() => handleNotice('장바구니 기능 연결 전입니다.')}>장바구니에 담기</button>
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
