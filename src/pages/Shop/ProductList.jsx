import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import ProductCard from '../../components/ui/ProductCard/ProductCard'
import Pagination from '../../components/ui/Pagination/Pagination'
import { foods, gifts, glasses, liquors, products } from '../../data/products'
import bannerOne from '../../assets/images/banner/eventBanner.png'
import bannerTwo from '../../assets/images/banner/eventBanner-1.png'
import bannerThree from '../../assets/images/banner/eventBanner-2.png'
import styles from './ProductList.module.scss'

const productImages = import.meta.glob('../../assets/images/products/product*.png', { eager: true, import: 'default' })
const stylingImages = Object.values(import.meta.glob('../../assets/images/products/stylingProduct/**/*.{png,jpg,jpeg,webp}', { eager: true, import: 'default' }))
const banners = [bannerOne, bannerTwo, bannerThree]
const PAGE_SIZE = 12
const headerTypeMap = {
  takju: '탁주',
  yakju: '약주',
  fruit: '과실주',
  distilled: '증류주',
  liqueur: '리큐르',
}

const mainCategories = [
  { id: 'all', label: '전체', data: products },
  { id: 'liquor', label: '전통주', data: liquors },
  { id: 'food', label: '안주', data: foods },
  { id: 'glass', label: '잔', data: glasses },
  { id: 'gift', label: '선물 세트', data: gifts },
]

const resolveImage = (imageUrl) => Object.entries(productImages).find(([path]) => path.endsWith(`/${imageUrl}`))?.[1]
const seededStylingImages = [...stylingImages].sort(() => Math.random() - 0.5).slice(0, 18)

const ProductList = () => {
  const stageRef = useRef(null)
  const productsRef = useRef(null)
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const [bannerIndex, setBannerIndex] = useState(0)
  const [revealProgress, setRevealProgress] = useState(0)
  const [categoryId, setCategoryId] = useState('all')
  const [detailFilter, setDetailFilter] = useState('전체')
  const [priceFilter, setPriceFilter] = useState('all')
  const [sortBy, setSortBy] = useState('latest')
  const [currentPage, setCurrentPage] = useState(1)
  const [wishes, setWishes] = useState(() => new Set())

  useEffect(() => {
    const page = stageRef.current?.closest(`.${styles.page}`)
    const header = document.querySelector('body > #root header') ?? document.querySelector('header')
    if (!page || !header) return undefined

    const previousPosition = header.style.position
    const previousTop = header.style.top
    const previousWidth = header.style.width
    const updateHeaderHeight = () => {
      page.style.setProperty('--shop-header-height', `${header.getBoundingClientRect().height}px`)
    }

    header.style.position = 'sticky'
    header.style.top = '0'
    header.style.width = '100%'
    updateHeaderHeight()

    const resizeObserver = new ResizeObserver(updateHeaderHeight)
    resizeObserver.observe(header)
    window.addEventListener('resize', updateHeaderHeight)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateHeaderHeight)
      page.style.removeProperty('--shop-header-height')
      header.style.position = previousPosition
      header.style.top = previousTop
      header.style.width = previousWidth
    }
  }, [])

  useEffect(() => {
    const handleShopLink = (event) => {
      const link = event.target.closest('a')
      if (!link) return
      const targetUrl = new URL(link.href, window.location.origin)
      if (targetUrl.pathname === '/shop' && !targetUrl.search) window.scrollTo({ top: 0, behavior: 'auto' })
    }

    document.addEventListener('click', handleShopLink)
    return () => document.removeEventListener('click', handleShopLink)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setBannerIndex((index) => (index + 1) % banners.length), 4000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const category = searchParams.get('category')
    const type = searchParams.get('type')
    if (category && mainCategories.some(({ id }) => id === category)) {
      setCategoryId(category)
      setDetailFilter('전체')
    } else if (type && headerTypeMap[type]) {
      setCategoryId('liquor')
      setDetailFilter(headerTypeMap[type])
    } else {
      setCategoryId('liquor')
      setDetailFilter('전체')
    }
    setCurrentPage(1)
    const shouldShowProducts = Boolean(category || type || searchParams.get('search'))
    const frameId = window.requestAnimationFrame(() => {
      if (shouldShowProducts) productsRef.current?.scrollIntoView({ behavior: 'auto', block: 'start' })
      else window.scrollTo({ top: 0, behavior: 'auto' })
    })
    return () => window.cancelAnimationFrame(frameId)
  }, [location.key, searchParams])

  useEffect(() => {
    let frameId
    const updateProgress = () => {
      const stage = stageRef.current
      if (!stage) return
      const scrollRange = stage.offsetHeight - window.innerHeight
      setRevealProgress(Math.min(1, Math.max(0, -stage.getBoundingClientRect().top / Math.max(scrollRange, 1))))
    }
    const handleScroll = () => {
      window.cancelAnimationFrame(frameId)
      frameId = window.requestAnimationFrame(updateProgress)
    }
    updateProgress()
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleScroll)
    return () => {
      window.cancelAnimationFrame(frameId)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleScroll)
    }
  }, [])

  const activeCategory = mainCategories.find(({ id }) => id === categoryId) ?? mainCategories[0]
  const detailOptions = useMemo(() => {
    const keys = { liquor: 'liquorType', food: 'snackType', glass: 'glassType', gift: 'glassType' }
    const values = categoryId === 'all'
      ? ['전통주', '안주', '잔', '선물세트']
      : [...new Set(activeCategory.data.map((item) => item[keys[categoryId]]).filter(Boolean))]
    if (categoryId === 'liquor') values.push('낮의 결', '밤의 결')
    return ['전체', ...values]
  }, [activeCategory, categoryId])

  const filteredProducts = useMemo(() => {
    let result = [...activeCategory.data]
    if (detailFilter !== '전체') {
      result = result.filter((item) => {
        if (detailFilter === '잔') return glasses.some(({ productId }) => productId === item.productId)
        if (detailFilter === '선물세트') return gifts.some(({ productId }) => productId === item.productId)
        return [item.productType, item.liquorType, item.snackType, item.glassType, item.timeOfDay].includes(detailFilter)
      })
    }
    if (priceFilter === 'under20000') result = result.filter((item) => item.price < 20000)
    if (priceFilter === '20000to40000') result = result.filter((item) => item.price >= 20000 && item.price < 40000)
    if (priceFilter === 'over40000') result = result.filter((item) => item.price >= 40000)
    if (sortBy === 'low') result.sort((a, b) => a.price - b.price)
    if (sortBy === 'high') result.sort((a, b) => b.price - a.price)
    if (sortBy === 'discount') result.sort((a, b) => (Number.parseInt(b.discountRate, 10) || 0) - (Number.parseInt(a.discountRate, 10) || 0))
    return result.map((item) => ({ ...item, imageSrc: resolveImage(item.imageUrl) }))
  }, [activeCategory, detailFilter, priceFilter, sortBy])

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE))
  const visibleProducts = filteredProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const handleCategory = (id) => {
    setCategoryId(id)
    setDetailFilter('전체')
    setCurrentPage(1)
  }
  const handlePage = (page) => {
    setCurrentPage(page)
    productsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  const handleWish = ({ productId }) => setWishes((current) => {
    const next = new Set(current)
    if (next.has(productId)) next.delete(productId)
    else next.add(productId)
    return next
  })

  return (
    <div className={styles.page}>
      <section className={styles.revealStage} ref={stageRef} aria-label="상품 소개">
        <div className={styles.stickyFrame}>
          <div className={styles.bannerSlider}>
            {banners.map((banner, index) => <img className={`${styles.banner} ${index === bannerIndex ? styles.activeBanner : ''}`} src={banner} alt={`JAJAK 기획전 배너 ${index + 1}`} key={banner} />)}
          </div>
          <div className={styles.tastePanel} style={{ '--reveal-progress': revealProgress }}>
            <div className={styles.tasteContent}>
              <h1>막동이와 취향 찾기</h1>
              <p>막동이가 당신이 좋아하는 맛, 원하는 시간대 등을 분석하여 어울리는 조합을 찾아드립니다.<br />나에게 딱 맞는 술상을 차려보세요.</p>
              <Link to="/ai">취향 찾으러 가기</Link>
            </div>
          </div>
        </div>
      </section>

      <div className={styles.shopBody}>
      <div className={styles.catalog}>
        <nav className={styles.mainCategories} aria-label="상품 대분류">
          {mainCategories.map((category, index) => (
            <div className={styles.categoryGroup} key={category.id}>
              <button className={`${categoryId === category.id ? styles.activeCategory : ''} ${category.id === 'all' ? styles.allCategory : ''}`} type="button" onClick={() => handleCategory(category.id)}>
                {category.id !== 'all' && <img src={resolveImage(category.data[0]?.imageUrl)} alt="" aria-hidden="true" />}
                <span className={styles.categoryLabel}>{category.label}</span>
              </button>
              {index < mainCategories.length - 1 && <span aria-hidden="true">⌘</span>}
            </div>
          ))}
        </nav>

        <section className={styles.productSection} ref={productsRef}>
          <header className={styles.sectionHeader} key={`heading-${categoryId}-${detailFilter}`}>
            <h2>{activeCategory.label}</h2>
            <p>{filteredProducts.length}개의 상품이 있습니다.</p>
          </header>
          <div className={styles.filterBar} key={`filters-${categoryId}`}>
            <div className={styles.detailFilters}>
              {detailOptions.map((option) => <button className={detailFilter === option ? styles.activeFilter : ''} type="button" onClick={() => { setDetailFilter(option); setCurrentPage(1) }} key={option}>{option}</button>)}
            </div>
            <div className={styles.selects}>
              <label><span>가격</span><select value={priceFilter} onChange={(event) => { setPriceFilter(event.target.value); setCurrentPage(1) }}><option value="all">전체가격</option><option value="under20000">2만원 미만</option><option value="20000to40000">2~4만원</option><option value="over40000">4만원 이상</option></select></label>
              <label><span>정렬</span><select value={sortBy} onChange={(event) => { setSortBy(event.target.value); setCurrentPage(1) }}><option value="latest">최신순</option><option value="low">낮은 가격순</option><option value="high">높은 가격순</option><option value="discount">할인율순</option></select></label>
            </div>
          </div>
          {visibleProducts.length > 0 ? (
            <div className={styles.productGrid} key={`products-${categoryId}-${detailFilter}-${priceFilter}-${sortBy}`}>{visibleProducts.map((product) => <ProductCard product={product} isWished={wishes.has(product.productId)} onToggleWish={handleWish} key={product.productId} />)}</div>
          ) : <p className={styles.empty} key={`empty-${categoryId}-${detailFilter}-${priceFilter}`}>조건에 맞는 상품이 없습니다.</p>}
          <Pagination currentPage={currentPage} totalPages={totalPages} onChange={handlePage} />
        </section>
      </div>

      <section className={styles.stylingMarquee} aria-label="상품 스타일링 이미지">
        <div className={styles.marqueeTrack}>{[...seededStylingImages, ...seededStylingImages].map((image, index) => <img src={image} alt="전통주와 안주 스타일링" loading="lazy" key={`${image}-${index}`} />)}</div>
      </section>
      </div>
    </div>
  )
}

export default ProductList
