import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import ProductCard from '../../components/ui/ProductCard/ProductCard'
import Pagination from '../../components/ui/Pagination/Pagination'
import { foods, gifts, glasses, liquors, products } from '../../data/products'
import { getCart, saveCart } from '../../utils/cartStorage'
import { PATHS } from '../../routes/paths'
import bannerOne from '../../assets/images/banner/eventBanner.png'
import bannerTwo from '../../assets/images/banner/eventBanner-1.png'
import bannerThree from '../../assets/images/banner/eventBanner-2.png'
import productListOrnament from '../../assets/images/eventPage/pattern2.png'
import categoryPattern from '../../assets/images/eventPage/pattern.png'
import styles from './ProductList.module.scss'

const productImages = import.meta.glob('../../assets/images/products/product*.png', { eager: true, import: 'default' })
const alcoholExplainImages = import.meta.glob('../../assets/images/products/explain/*.{png,jpg,jpeg,webp}', { eager: true, import: 'default' })
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
const resolveAlcoholExplainImage = (imageUrl) => Object.entries(alcoholExplainImages).find(([path]) => path.endsWith(`/${imageUrl.split('/').pop()}`))?.[1]
const seededStylingImages = [...stylingImages].sort(() => Math.random() - 0.5).slice(0, 18)

const ProductList = () => {
  const stageRef = useRef(null)
  const productsRef = useRef(null)
  const cartToastTimerRef = useRef(null)
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
  const [selectedAlcohol, setSelectedAlcohol] = useState(null)
  const [cartToast, setCartToast] = useState(null)

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
    if (!selectedAlcohol) return undefined
    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setSelectedAlcohol(null)
    }
    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedAlcohol])

  useEffect(() => () => window.clearTimeout(cartToastTimerRef.current), [])

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
    if (window.matchMedia('(max-width: 767px)').matches) {
      setRevealProgress(1)
      return undefined
    }
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
  const handleAddToCart = (product) => {
    const cart = getCart()
    const existingItem = cart.find((item) => item.productId === product.productId)
    const nextCart = existingItem
      ? cart.map((item) => item.productId === product.productId ? { ...item, quantity: item.quantity + 1 } : item)
      : [...cart, { productId: product.productId, quantity: 1 }]
    saveCart(nextCart)
    setCartToast(product.productName)
    window.clearTimeout(cartToastTimerRef.current)
    cartToastTimerRef.current = window.setTimeout(() => setCartToast(null), 3200)
  }

  const alcoholExplain = [
    {
      name:'탁주',
      explain:'시중에 파는 하얗고 걸쭉한 막걸리를 아시지요? 탁주는 쌀이나 밀로 만들어 맑게 거르지 않고, 우리 술의 진한 맛과 영양이 고스란히 담기도록 뽀얗게 빚어낸 친근한 술이랍니다.',
      flavor:'목넘김이 부드럽고 든든하며, 쌀 특유의 구수한 단맛과 감칠맛을 느낄 수 있습니다.',
      recommend:'비 오는 날이나 출출할 때, 부침개 같은 기름진 음식과 함께 편안하게 즐기고 싶으실 때 가장 좋습니다.',
      image:'/explain/Takju.png',
    },
    {
      name:'약주',
      explain:' 예로부터 [몸에 이로운 좋은 술]이라는 뜻으로 부르던 맑은 술입니다. 앞서 말씀드린 탁주에서 맑은 윗부분만 조심스럽게 떠내어 깨끗하게 걸러낸 것이지요.',
      flavor:'색이 물처럼 아주 맑고 투명하며, 머리가 아프지 않고 깔끔하게 떨어지는 뒷맛이 일품이랍니다.',
      recommend:'맑고 깨끗한 맛을 좋아하시거나, 소중한 분들과 정갈한 식사를 하실 때 잘 어울립니다.',
      image:'/explain/Yakju.png',
    },
    {
      name:'과실주',
      explain:'술이 조금 낯설거나 쓴맛을 싫어하시는 나리께 가장 먼저 권해드리는 술이랍니다. 우리 땅에서 자란 싱그러운 과일들을 듬뿍 넣어, 과일 자체의 향긋함과 달콤함을 가득 담아낸 술이지요.',
      flavor:'와인처럼 향이 매우 풍부하고, 입안에서 달콤새콤한 과일 맛이 퍼져 누구나 부담 없이 마실 수 있습니다.',
      recommend:'분위기 있는 저녁 식사나, 가벼운 디저트와 함께 달콤한 기분을 내고 싶으실 때 제격입니다.',
      image:'/explain/fruitwine.png',
    },
    {
      name:'증류주',
      explain:'흔히 알고 계시는 [소주]의 전통 버전이라고 생각하시면 됩니다! 쌀이나 과일 등으로 만든 술을 불에 한 번 끓이고, 그 증기를 차갑게 식혀 맑은 눈물처럼 받아낸 도수 높은 술이옵니다.',
      flavor:'혀가 아플 정도로 쓴 인공적인 알코올 맛이 아니라, 원재료의 깊고 그윽한 풍미가 입안에 진하게 남는 것이 특징입니다.',
      recommend:'고기 요리처럼 기름진 음식을 드실 때, 입안을 개운하게 싹 씻어내고 싶으실 때 찾아주세요.',
      image:'/explain/spirit.png',
    },
    {
      name:'리큐르',
      explain:'전통주를 바탕으로 세상에 없던 다양한 허브, 향신료, 꽃 등을 더해 양조장 주인장의 개성을 듬뿍 담아 만든 독특한 술입니다.',
      flavor:'맛과 향이 매우 다채롭고 재미있어서, 마실 때마다 감탄이 절로 나오는 반전 매력이 있답니다.',
      recommend:'맨날 마시던 평범한 술 말고, 아주 색다른 경험을 해보고 싶으실 때 도전해 보세요!',
      image:'/explain/liqueur.png',
    }
  ]
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
        <img className={styles.topOrnament} src={productListOrnament} alt="" aria-hidden="true" />
        <nav className={styles.mainCategories} aria-label="상품 대분류">
          {mainCategories.map((category, index) => (
            <div className={styles.categoryGroup} key={category.id}>
              <button className={`${categoryId === category.id ? styles.activeCategory : ''} ${category.id === 'all' ? styles.allCategory : ''}`} type="button" onClick={() => handleCategory(category.id)}>
                {category.id !== 'all' && <img src={resolveImage(category.data[0]?.imageUrl)} alt="" aria-hidden="true" />}
                <span className={styles.categoryLabel}>{category.label}</span>
              </button>
              {index < mainCategories.length - 1 && <img className={styles.categoryPattern} src={categoryPattern} alt="" aria-hidden="true" />}
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
              {detailOptions.map((option) => {
                const alcoholInfo = alcoholExplain.find(({ name }) => name === option)
                return (
                  <div className={styles.detailFilterItem} key={option}>
                    {alcoholInfo && <button className={styles.alcoholInfoButton} type="button" aria-label={`${option} 설명 보기`} onClick={() => setSelectedAlcohol(alcoholInfo)}>ⓘ</button>}
                    <button className={detailFilter === option ? styles.activeFilter : ''} type="button" onClick={() => { setDetailFilter(option); setCurrentPage(1) }}>{option}</button>
                  </div>
                )
              })}
            </div>
            <div className={styles.selects}>
              <label><span>가격</span><select value={priceFilter} onChange={(event) => { setPriceFilter(event.target.value); setCurrentPage(1) }}><option value="all">전체가격</option><option value="under20000">2만원 미만</option><option value="20000to40000">2~4만원</option><option value="over40000">4만원 이상</option></select></label>
              <label><span>정렬</span><select value={sortBy} onChange={(event) => { setSortBy(event.target.value); setCurrentPage(1) }}><option value="latest">최신순</option><option value="low">낮은 가격순</option><option value="high">높은 가격순</option><option value="discount">할인율순</option></select></label>
            </div>
          </div>
          {visibleProducts.length > 0 ? (
            <div className={styles.productGrid} key={`products-${categoryId}-${detailFilter}-${priceFilter}-${sortBy}`}>{visibleProducts.map((product) => <ProductCard product={product} isWished={wishes.has(product.productId)} onToggleWish={handleWish} onAddToCart={handleAddToCart} key={product.productId} />)}</div>
          ) : <p className={styles.empty} key={`empty-${categoryId}-${detailFilter}-${priceFilter}`}>조건에 맞는 상품이 없습니다.</p>}
          <Pagination currentPage={currentPage} totalPages={totalPages} onChange={handlePage} />
        </section>
      </div>

      <section className={styles.stylingMarquee} aria-label="상품 스타일링 이미지">
        <div className={styles.marqueeTrack}>{[...seededStylingImages, ...seededStylingImages].map((image, index) => <img src={image} alt="전통주와 안주 스타일링" loading="lazy" key={`${image}-${index}`} />)}</div>
      </section>
      </div>
      {selectedAlcohol && (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedAlcohol(null) }}>
          <section className={styles.alcoholModal} role="dialog" aria-modal="true" aria-labelledby="alcohol-modal-title">
            <button className={styles.modalClose} type="button" aria-label="팝업 닫기" onClick={() => setSelectedAlcohol(null)}>×</button>
            <div className={styles.modalImage}><img src={resolveAlcoholExplainImage(selectedAlcohol.image)} alt={`${selectedAlcohol.name} 이미지`} /></div>
            <div className={styles.modalContent}>
              <h2 id="alcohol-modal-title">{selectedAlcohol.name}</h2>
              <p className={styles.modalExplain}>“{selectedAlcohol.explain}”</p>
              <div className={styles.modalDetails}>
                <div><h3>특징</h3><p>{selectedAlcohol.flavor}</p></div>
                <div><h3>추천 상황</h3><p>{selectedAlcohol.recommend}</p></div>
              </div>
            </div>
          </section>
        </div>
      )}
      {cartToast && (
        <div className={styles.cartToast} role="status" aria-live="polite">
          <span className={styles.toastCheck} aria-hidden="true">✓</span>
          <p><strong>장바구니에 담았어요</strong><small>{cartToast}</small></p>
          <Link to={PATHS.cart}>장바구니 보기 <span aria-hidden="true">›</span></Link>
        </div>
      )}
    </div>
  )
}

export default ProductList
