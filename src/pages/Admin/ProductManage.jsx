import { useEffect, useMemo, useRef, useState } from 'react'
import { collection, onSnapshot, query, where } from 'firebase/firestore'
import adminTopOrnament from '../../assets/images/admin/adminTopOrnament.svg'
import { products as productData } from '../../data/products'
import { db } from '../../firebase/firebase'
import { deleteDocument, updateDocument } from '../../firebase/firestore'
import { fetchProducts } from '../../services/productCatalog'
import styles from './ProductManage.module.scss'

// ========================================
// 초기 상품 데이터
// ========================================
const productImages = import.meta.glob('../../assets/images/products/*.{png,jpg,jpeg,webp}', { eager: true, import: 'default' })
const productDetailImages = import.meta.glob('../../assets/images/products/productDetail/**/*.{png,jpg,jpeg,webp}', { eager: true, import: 'default' })
const PRODUCT_OVERRIDES_KEY = 'jajak_admin_product_overrides'
const DELETED_PRODUCTS_KEY = 'jajak_admin_deleted_products'

const resolveProductImage = (imageUrl) => {
  if (/^(data:|https?:\/\/)/.test(imageUrl ?? '')) return imageUrl
  const fileName = imageUrl?.split('/').pop()
  return Object.entries(productImages).find(([path]) => path.endsWith(`/${fileName}`))?.[1]
}

const getLocalDetailImages = (imageUrl = '') => {
  if (/^(data:|https?:\/\/)/.test(imageUrl)) return []
  const folder = imageUrl.replace(/\.[^.]+$/, '')
  return Object.entries(productDetailImages)
    .filter(([path]) => path.includes(`/productDetail/${folder}/`))
    .sort(([first], [second]) => first.localeCompare(second, 'ko', { numeric: true }))
    .map(([, source]) => source)
    .slice(0, 3)
}

const normalizeProduct = (product) => {
  const stock = Math.max(0, Number(product.stock ?? 0))
  const status = product.status === 'hidden'
    ? 'hidden'
    : (stock === 0 || product.status === 'soldout' ? 'soldout' : 'selling')

  return {
    ...product,
    id: product.productId,
    name: product.productName,
    category: product.productType === '전통주'
      ? product.liquorType
      : (product.productType === '주류용품' ? (product.glassType === '선물세트' ? '선물 세트' : '잔') : product.productType),
    price: Number(product.price ?? 0),
    stock,
    status,
    displayStatus: product.status === 'hidden' ? 'hidden' : 'display',
    createdAt: product.createdAt ?? '-',
    description: product.productDescription ?? '',
    tags: product.flavorKeywords ?? [],
    views: Number(product.views ?? 0),
    likes: Number(product.likes ?? 0),
    reviews: Number(product.reviewCount ?? product.reviews ?? 0),
    rating: Number(product.rating ?? 0),
    imageSrc: resolveProductImage(product.imageUrl),
    detailImageUrls: Array.isArray(product.detailImageUrls) ? product.detailImageUrls : [],
  }
}

const readStoredJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}

const loadProducts = () => {
  const overrides = readStoredJson(PRODUCT_OVERRIDES_KEY, {})
  const deletedIds = new Set(readStoredJson(DELETED_PRODUCTS_KEY, []))
  return productData
    .map(normalizeProduct)
    .filter((product) => !deletedIds.has(product.id))
    .map((product) => ({ ...product, ...overrides[product.id] }))
}

const statusLabels = {
  selling: '판매 중',
  soldout: '품절',
  hidden: '숨김',
}

const displayLabels = {
  display: '진열 중',
  hidden: '진열 안함',
}

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6v5h-5M4 18v-5h5" />
    <path d="M6.1 9a7 7 0 0 1 11.8-2.2L20 11M4 13l2.1 4.2A7 7 0 0 0 17.9 15" />
  </svg>
)

const ProductManage = () => {
  const [products, setProducts] = useState(loadProducts)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('전체 카테고리')
  const [statusFilter, setStatusFilter] = useState('all')
  const [activeCardKey, setActiveCardKey] = useState('total')
  const [selectedIds, setSelectedIds] = useState([])
  const [selectedProductId, setSelectedProductId] = useState(null)
  const [editStep, setEditStep] = useState(1)
  const [toastMessage, setToastMessage] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  const categories = useMemo(
    () => ['전체 카테고리', ...new Set(products.map((product) => product.category).filter(Boolean))],
    [products],
  )

  // 외부 클릭 감지를 위한 Refs
  const tableRef = useRef(null)
  const panelRef = useRef(null)
  const imageInputRef = useRef(null)
  const detailImageInputRefs = useRef([])

  // 선택 상품 상태
  const selectedProduct = products.find((p) => p.id === selectedProductId) || null
  const [draftName, setDraftName] = useState('')
  const [draftCategory, setDraftCategory] = useState('증류주')
  const [draftPrice, setDraftPrice] = useState('')
  const [draftStock, setDraftStock] = useState('')
  const [draftStatus, setDraftStatus] = useState('selling')
  const [draftDisplayStatus, setDraftDisplayStatus] = useState('display')
  const [draftDescription, setDraftDescription] = useState('')
  const [draftTags, setDraftTags] = useState([])
  const [draftTag, setDraftTag] = useState('')
  const [draftImageUrl, setDraftImageUrl] = useState('')
  const [draftDetailImageUrls, setDraftDetailImageUrls] = useState([null, null, null])
  const [liveMetrics, setLiveMetrics] = useState({ reviews: 0, rating: 0 })

  // 외부 빈 공간 클릭 시 통계 패널로 복귀
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!selectedProductId) return

      if (
        (panelRef.current && panelRef.current.contains(e.target)) ||
        (tableRef.current && tableRef.current.contains(e.target))
      ) {
        return
      }

      setSelectedProductId(null)
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [selectedProductId])

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'products'),
      (snapshot) => {
        setProducts(snapshot.docs.map((item) => {
          const data = item.data()
          return normalizeProduct({ ...data, productId: data.productId ?? item.id })
        }))
      },
      (error) => {
        console.error('Firestore 상품 실시간 조회 실패:', error)
        fetchProducts({ includeHidden: true }).then((items) => {
          setProducts(items.map(normalizeProduct))
        })
      },
    )

    return unsubscribe
  }, [])

  // 새로고침 핸들러 (회전 모션 포함)
  const handleRefresh = async () => {
    setIsRefreshing(true)
    const items = await fetchProducts({ includeHidden: true })
    setProducts(items.map(normalizeProduct))
    setTimeout(() => {
      setIsRefreshing(false)
      setToastMessage('상품 목록을 새로고침했습니다.')
      setTimeout(() => setToastMessage(''), 2500)
    }, 600)
  }

  // 지표 카운트 계산
  const isSoldOut = (product) => product.status === 'soldout' || product.stock <= 0
  const totalCount = products.length
  const sellingCount = products.filter((p) => p.status === 'selling' && !isSoldOut(p)).length
  const lowStockCount = products.filter((p) => p.status !== 'hidden' && p.stock > 0 && p.stock <= 5).length
  const hiddenCount = products.filter((p) => p.status === 'hidden' || isSoldOut(p)).length
  const categoryCounts = useMemo(() => {
    const counts = new Map()
    products.forEach((product) => {
      if (!product.category) return
      counts.set(product.category, (counts.get(product.category) ?? 0) + 1)
    })
    return [...counts.entries()].sort(([first], [second]) => first.localeCompare(second, 'ko'))
  }, [products])
  const largestCategoryCount = Math.max(...categoryCounts.map(([, count]) => count), 1)

  const summaryCards = [
    { key: 'total', label: '전체 상품 수', value: totalCount, unit: '개', caption: '정상 등록 상품' },
    { key: 'selling', label: '판매 중 상품', value: sellingCount, unit: '개', caption: `전체의 ${Math.round((sellingCount / totalCount) * 100 || 0)}%` },
    { key: 'lowStock', label: '품절 임박 (5개 이하)', value: lowStockCount, unit: '개', caption: '즉시 발주 필요' },
    { key: 'hidden', label: '품절 및 숨김', value: hiddenCount, unit: '개', caption: '노출 중단 관리' },
  ]

  // 상단 카드 클릭 필터 연동
  const handleCardClick = (key) => {
    setActiveCardKey(key)
    setSearchQuery('')
    setCategoryFilter('전체 카테고리')

    if (key === 'total') setStatusFilter('all')
    else if (key === 'selling') setStatusFilter('selling')
    else if (key === 'lowStock') setStatusFilter('lowStock')
    else if (key === 'hidden') setStatusFilter('hiddenOrSoldout')
  }

  // 필터링 적용된 상품 목록
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesQuery =
        !searchQuery.trim() ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory = categoryFilter === '전체 카테고리' || p.category === categoryFilter

      let matchesStatus = true
      if (statusFilter === 'selling') matchesStatus = p.status === 'selling'
      else if (statusFilter === 'soldout') matchesStatus = isSoldOut(p)
      else if (statusFilter === 'hidden') matchesStatus = p.status === 'hidden'
      else if (statusFilter === 'lowStock') matchesStatus = p.stock > 0 && p.stock <= 5
      else if (statusFilter === 'hiddenOrSoldout') matchesStatus = p.status === 'hidden' || isSoldOut(p)

      return matchesQuery && matchesCategory && matchesStatus
    })
  }, [products, searchQuery, categoryFilter, statusFilter])

  const handleSelectAll = (e) => {
    setSelectedIds(e.target.checked ? filteredProducts.map((p) => p.id) : [])
  }

  const handleSelectRow = (id, e) => {
    e.stopPropagation()
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const openEditPanel = (product) => {
    setSelectedProductId(product.id)
    setEditStep(1)
    setDraftName(product.name)
    setDraftCategory(product.category)
    setDraftPrice(product.price)
    setDraftStock(product.stock)
    setDraftStatus(product.status)
    setDraftDisplayStatus(product.displayStatus || 'display')
    setDraftDescription(product.description || '')
    setDraftTags(product.tags || [])
    setDraftTag('')
    setDraftImageUrl(product.imageUrl || '')
    setDraftDetailImageUrls(Array.from({ length: 3 }, (_, index) => product.detailImageUrls?.[index] ?? null))
  }

  useEffect(() => {
    if (!selectedProductId) {
      setLiveMetrics({ reviews: 0, rating: 0 })
      return undefined
    }
    return onSnapshot(
      query(collection(db, 'reviews'), where('productId', '==', selectedProductId)),
      (snapshot) => {
        const ratings = snapshot.docs.map((item) => Number(item.data().rating)).filter(Number.isFinite)
        setLiveMetrics({ reviews: snapshot.size, rating: ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0 })
      },
      () => setLiveMetrics({ reviews: 0, rating: 0 }),
    )
  }, [selectedProductId])

  const handleAddTag = () => {
    const nextTag = draftTag.trim()
    if (!nextTag || draftTags.includes(nextTag)) return
    setDraftTags((current) => [...current, nextTag])
    setDraftTag('')
  }

  const handleImageChange = (event, detailIndex = null) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setToastMessage('이미지 파일만 선택할 수 있습니다.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const image = new Image()
      image.onload = () => {
        const maxSize = 720
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(image.width * scale)
        canvas.height = Math.round(image.height * scale)
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
        const nextUrl = canvas.toDataURL('image/jpeg', 0.78)
        if (detailIndex === null) setDraftImageUrl(nextUrl)
        else setDraftDetailImageUrls((current) => current.map((url, index) => index === detailIndex ? nextUrl : url))
      }
      image.src = reader.result
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const handleSaveEdit = async () => {
    if (!selectedProduct) return
    const normalizedStock = Math.max(0, Number(draftStock))
    const normalizedStatus = draftDisplayStatus === 'hidden'
      ? 'hidden'
      : (normalizedStock === 0 ? 'soldout' : draftStatus)
    const editedProduct = {
      ...selectedProduct,
      name: draftName,
      category: draftCategory,
      price: Number(draftPrice),
      stock: normalizedStock,
      status: normalizedStatus,
      displayStatus: draftDisplayStatus,
      description: draftDescription,
      tags: draftTags,
      imageUrl: draftImageUrl,
      imageSrc: resolveProductImage(draftImageUrl),
      detailImageUrls: draftDetailImageUrls,
    }
    const isLiquor = ['탁주', '약주', '청주', '증류주', '과실주', '리큐르'].includes(draftCategory)
    const isAccessory = ['잔', '선물 세트'].includes(draftCategory)

    try {
      await updateDocument('products', selectedProduct.id, {
        productName: draftName,
        productType: isLiquor ? '전통주' : (isAccessory ? '주류용품' : draftCategory),
        liquorType: isLiquor ? draftCategory : (selectedProduct.liquorType ?? null),
        glassType: draftCategory === '선물 세트'
          ? '선물세트'
          : (draftCategory === '잔' ? (selectedProduct.glassType === '선물세트' ? '술잔' : selectedProduct.glassType) : (selectedProduct.glassType ?? null)),
        price: Number(draftPrice),
        stock: normalizedStock,
        status: normalizedStatus,
        productDescription: draftDescription,
        flavorKeywords: draftTags,
        imageUrl: draftImageUrl,
        detailImageUrls: draftDetailImageUrls,
      })
      setProducts((prev) => prev.map((p) => p.id === selectedProduct.id ? editedProduct : p))
    } catch (error) {
      console.error('상품 수정 실패:', error)
      setToastMessage('상품 정보를 수정하지 못했습니다. 관리자 권한을 확인해주세요.')
      return
    }
    setSelectedProductId(null)
    setToastMessage(`${draftName} 상품 정보가 수정되었습니다.`)
    setTimeout(() => setToastMessage(''), 3000)
  }

  const handleDeleteProduct = async () => {
    if (!selectedProduct) return
    if (window.confirm(`'${selectedProduct.name}' 상품을 정말 삭제하시겠습니까?`)) {
      try {
        await deleteDocument('products', selectedProduct.id)
        setProducts((prev) => prev.filter((p) => p.id !== selectedProduct.id))
      } catch (error) {
        console.error('상품 삭제 실패:', error)
        setToastMessage('상품을 삭제하지 못했습니다. 관리자 권한을 확인해주세요.')
        return
      }
      setSelectedProductId(null)
      setToastMessage('상품이 삭제되었습니다.')
      setTimeout(() => setToastMessage(''), 3000)
    }
  }

  const resetFilters = () => {
    setSearchQuery('')
    setCategoryFilter('전체 카테고리')
    setStatusFilter('all')
    setActiveCardKey('total')
  }

  return (
    <section className={styles.page} aria-labelledby="product-manage-title">
      {/* 툴바 */}
      <header className={styles.pageToolbar}>
        <h1 id="product-manage-title">상품 관리</h1>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={isRefreshing ? styles.refreshing : ''}
        >
          <RefreshIcon />
          {isRefreshing ? '불러오는 중' : '새로 고침'}
        </button>
      </header>

      {/* 전통 문양 구분선 */}
      <div className={styles.ornamentLine} aria-hidden="true">
        <img src={adminTopOrnament} alt="" />
      </div>

      {/* 상단 클릭형 요약 카드 */}
      <section className={styles.summaryArea} aria-label="상품 현황 필터 요약">
        <div className={styles.summaryGrid}>
          {summaryCards.map((card) => (
            <button
              key={card.key}
              type="button"
              className={`${styles.summaryCard} ${activeCardKey === card.key ? styles.activeCard : ''}`}
              onClick={() => handleCardClick(card.key)}
            >
              <span className={`${styles.summaryIcon} ${styles[card.key]}`} aria-hidden="true">
                <i>{card.value}</i>
              </span>
              <div className={styles.summaryContent}>
                <h3>{card.label}</h3>
                <p>
                  <strong>{card.value}</strong>
                  <span>{card.unit}</span>
                </p>
                <small>{card.caption}</small>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 메인 2단 그리드 */}
      <div className={styles.managementGrid}>
        {/* 좌측: 상품 테이블 */}
        <section className={styles.mainSection}>
          {/* 필터 바 */}
          <div className={styles.filterBar}>
            <label className={styles.searchField}>
              <span className={styles.srOnly}>상품 검색</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m16 16 4 4" />
              </svg>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="상품명, 상품 ID(코드) 검색"
              />
            </label>

            <label className={styles.selectField}>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.selectField}>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setActiveCardKey(null)
                }}
              >
                <option value="all">전체 상태</option>
                <option value="selling">판매 중</option>
                <option value="soldout">품절</option>
                <option value="hidden">숨김</option>
              </select>
            </label>

            <button type="button" className={styles.resetButton} onClick={resetFilters}>
              초기화
            </button>
          </div>

          {/* 테이블 헤더 */}
          <div className={styles.sectionHeading}>
            <div className={styles.titleWrap}>
              <h2>상품 목록</h2>
              <span>{filteredProducts.length}개</span>
            </div>
            <div className={styles.actions}>
              {selectedIds.length > 0 && (
                <button type="button" className={styles.bulkButton}>
                  선택 {selectedIds.length}개 판매 중지
                </button>
              )}
              <button type="button" className={styles.registerButton}>
                + 새 상품 등록
              </button>
            </div>
          </div>

          {/* 테이블 영역 */}
          <div className={styles.tableWrap} ref={tableRef}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={filteredProducts.length > 0 && selectedIds.length === filteredProducts.length}
                    />
                  </th>
                  <th>상품 코드</th>
                  <th>상품 정보</th>
                  <th>카테고리</th>
                  <th>판매가</th>
                  <th>재고</th>
                  <th>상태</th>
                  <th>등록일</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr
                    key={p.id}
                    className={`${styles.clickableRow} ${selectedProductId === p.id ? styles.selectedRow : ''}`}
                    onClick={() => openEditPanel(p)}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(p.id)}
                        onChange={(e) => handleSelectRow(p.id, e)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td>
                      <strong>{p.id}</strong>
                    </td>
                    <td>
                      <div className={styles.productCell}>
                        <span className={styles.thumbPlaceholder} aria-hidden="true">
                          {p.imageSrc && <img src={p.imageSrc} alt="" />}
                        </span>
                        <span className={styles.pName}>{p.name}</span>
                      </div>
                    </td>
                    <td>{p.category}</td>
                    <td>{p.price.toLocaleString('ko-KR')}원</td>
                    <td>
                      <span className={p.stock <= 5 ? styles.lowStockText : ''}>
                        {p.stock}개 {p.stock <= 5 && p.stock > 0 && <small>(임박)</small>}
                      </span>
                    </td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[p.status]}`}>
                        {statusLabels[p.status]}
                      </span>
                    </td>
                    <td>{String(p.createdAt).split(' ')[0]}</td>
                    <td>
                      <button
                        type="button"
                        className={styles.editBtn}
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditPanel(p)
                        }}
                      >
                        수정
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 우측 패널 (상품 수정 vs 통계) */}
        {selectedProduct ? (
          <aside className={styles.editPanel} ref={panelRef} aria-labelledby="edit-panel-title">
            <header className={styles.panelTopHeader}>
              <h2 id="edit-panel-title">상품 수정</h2>
              <button type="button" onClick={() => setSelectedProductId(null)} aria-label="닫기">
                ×
              </button>
            </header>

            {/* 선택 상품 상단 미니 카드 */}
            <div className={styles.selectedProductCard}>
              <div className={styles.cardThumb}>
                {selectedProduct.imageSrc && <img src={selectedProduct.imageSrc} alt="" />}
              </div>
              <div className={styles.cardInfo}>
                <h3 title={draftName}>{draftName}</h3>
                <dl>
                  <div>
                    <dt>상품 ID</dt>
                    <dd>{selectedProduct.id}</dd>
                  </div>
                  <div>
                    <dt>카테고리</dt>
                    <dd>{draftCategory}</dd>
                  </div>
                  <div>
                    <dt>가격</dt>
                    <dd>{Number(draftPrice).toLocaleString('ko-KR')}원</dd>
                  </div>
                </dl>
                <div className={styles.tagGroup}>
                  <span className={`${styles.miniBadge} ${styles[draftStatus]}`}>{statusLabels[draftStatus]}</span>
                  <span className={styles.miniBadge}>{displayLabels[draftDisplayStatus]}</span>
                </div>
              </div>
            </div>

            {/* 스텝 1 */}
            {editStep === 1 && (
              <div className={styles.formContainer}>
                <section className={styles.formSection}>
                  <h4 className={styles.sectionBarTitle}>기본 정보</h4>
                  <div className={styles.formRow}>
                    <label>상품명 *</label>
                    <input type="text" value={draftName} onChange={(e) => setDraftName(e.target.value)} />
                  </div>
                  <div className={styles.formRow}>
                    <label>상품 ID</label>
                    <span className={styles.staticText}>{selectedProduct.id}</span>
                  </div>
                  <div className={styles.formRow}>
                    <label>카테고리 *</label>
                    <select value={draftCategory} onChange={(e) => setDraftCategory(e.target.value)}>
                      {categories
                        .filter((c) => c !== '전체 카테고리')
                        .map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className={styles.formRow}>
                    <label>등록일</label>
                    <span className={styles.staticText}>{selectedProduct.createdAt}</span>
                  </div>
                </section>

                <section className={styles.formSection}>
                  <h4 className={styles.sectionBarTitle}>판매 정보</h4>
                  <div className={styles.formRow}>
                    <label>가격 (원) *</label>
                    <input type="number" value={draftPrice} onChange={(e) => setDraftPrice(e.target.value)} />
                  </div>
                  <div className={styles.formRow}>
                    <label>재고 (개) *</label>
                    <input type="number" value={draftStock} onChange={(e) => setDraftStock(e.target.value)} />
                  </div>
                  <div className={styles.formRow}>
                    <label>판매 상태 *</label>
                    <select value={draftStatus} onChange={(e) => setDraftStatus(e.target.value)}>
                      <option value="selling">판매 중</option>
                      <option value="soldout">품절</option>
                      <option value="hidden">숨김</option>
                    </select>
                  </div>
                  <div className={styles.formRow}>
                    <label>진열 상태 *</label>
                    <select value={draftDisplayStatus} onChange={(e) => setDraftDisplayStatus(e.target.value)}>
                      <option value="display">진열 중</option>
                      <option value="hidden">진열 안함</option>
                    </select>
                  </div>
                </section>

                <div className={styles.nextActionWrap}>
                  <button type="button" className={styles.nextBtn} onClick={() => setEditStep(2)}>
                    다음 &gt;
                  </button>
                </div>
              </div>
            )}

            {/* 스텝 2 */}
            {editStep === 2 && (
              <div className={styles.formContainer}>
                <section className={styles.formSection}>
                  <h4 className={styles.sectionBarTitle}>상품 정보</h4>
                  <div className={styles.formFieldBlock}>
                    <label>상품 설명 *</label>
                    <textarea
                      rows="3"
                      value={draftDescription}
                      onChange={(e) => setDraftDescription(e.target.value)}
                    />
                  </div>

                  <div className={styles.formFieldBlock}>
                    <label>맛 키워드 *</label>
                    <div className={styles.chipGroup}>
                      {draftTags.map((tag) => (
                        <span key={tag} className={styles.chip}>
                          {tag}
                          <button type="button" onClick={() => setDraftTags((current) => current.filter((item) => item !== tag))} aria-label={`${tag} 삭제`}>×</button>
                        </span>
                      ))}
                    </div>
                    <div className={styles.tagEditor}>
                      <input value={draftTag} onChange={(e) => setDraftTag(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag() } }} placeholder="맛 키워드 입력" />
                      <button type="button" onClick={handleAddTag}>추가</button>
                    </div>
                  </div>

                  <div className={styles.formFieldBlock}>
                    <label>상품 앨범 *</label>
                    <div className={styles.albumRow}>
                      <div className={styles.mainImgBox}>
                        {draftImageUrl ? <img src={resolveProductImage(draftImageUrl)} alt="변경할 대표 상품" /> : <span>대표 이미지</span>}
                      </div>
                      {Array.from({ length: 3 }, (_, index) => {
                        const localImages = getLocalDetailImages(selectedProduct.imageUrl)
                        const preview = draftDetailImageUrls[index] || localImages[index]
                        return (
                          <div className={styles.subImgBox} key={index}>
                            {preview ? <img src={preview} alt={`서브 이미지 ${index + 1}`} /> : <span>서브 {index + 1}</span>}
                            {draftDetailImageUrls[index] && <button type="button" onClick={() => setDraftDetailImageUrls((current) => current.map((url, itemIndex) => itemIndex === index ? null : url))} aria-label={`서브 이미지 ${index + 1} 변경 취소`}>×</button>}
                          </div>
                        )
                      })}
                      <button type="button" className={styles.uploadPlusBox} onClick={() => imageInputRef.current?.click()}>
                        <span>+</span>
                        <small>대표 변경</small>
                      </button>
                      <input ref={imageInputRef} className={styles.srOnly} type="file" accept="image/*" onChange={handleImageChange} />
                      {Array.from({ length: 3 }, (_, index) => (
                        <button type="button" className={styles.uploadPlusBox} key={`detail-upload-${index}`} onClick={() => detailImageInputRefs.current[index]?.click()}>
                          <span>+</span><small>서브 {index + 1}</small>
                          <input ref={(node) => { detailImageInputRefs.current[index] = node }} className={styles.srOnly} type="file" accept="image/*" onChange={(event) => handleImageChange(event, index)} />
                        </button>
                      ))}
                    </div>
                  </div>
                </section>

                <section className={styles.formSection}>
                  <h4 className={styles.sectionBarTitle}>운영 정보</h4>
                  <div className={styles.metricsGrid}>
                    <div className={styles.metricBox}>
                      <span>조회 수</span>
                      <p>
                        <i className={styles.dotGrey} />
                        <strong>{selectedProduct.views.toLocaleString()}회</strong>
                      </p>
                    </div>
                    <div className={styles.metricBox}>
                      <span>찜하기 수</span>
                      <p>
                        <i className={styles.dotGrey} />
                        <strong>{selectedProduct.likes.toLocaleString()}건</strong>
                      </p>
                    </div>
                    <div className={styles.metricBox}>
                      <span>리뷰 수</span>
                      <p>
                        <i className={styles.dotGrey} />
                        <strong>{liveMetrics.reviews}개</strong>
                      </p>
                    </div>
                    <div className={styles.metricBox}>
                      <span>평균 평점</span>
                      <p>
                        <i className={styles.dotGrey} />
                        <strong>{liveMetrics.rating.toFixed(1)}점</strong>
                      </p>
                    </div>
                  </div>
                </section>

                <div className={styles.stepFooter}>
                  <button type="button" className={styles.prevBtn} onClick={() => setEditStep(1)}>
                    &lt; 이전
                  </button>
                  <div className={styles.finalActions}>
                    <button type="button" className={styles.deleteBtn} onClick={handleDeleteProduct}>
                      상품 삭제
                    </button>
                    <button type="button" className={styles.saveBtn} onClick={handleSaveEdit}>
                      저장
                    </button>
                  </div>
                </div>
              </div>
            )}
          </aside>
        ) : (
          /* 평상시 통계 패널 */
          <aside className={styles.analyticsColumn} ref={panelRef}>
            <section className={styles.analyticsCard}>
              <header className={styles.analyticsHeader}>
                <h2>상품 상태 분포</h2>
                <span>STATUS</span>
              </header>
              <div className={styles.statusOverview}>
                <div
                  className={styles.statusDonut}
                  style={{ '--active-rate': `${Math.round((sellingCount / totalCount) * 100 || 0)}%` }}
                >
                  <span>전체</span>
                  <strong>{totalCount}개</strong>
                </div>
                <ul>
                  <li>
                    <span className={styles.dotSelling} />
                    <span>판매 중</span>
                    <strong>{sellingCount}개</strong>
                  </li>
                  <li>
                    <span className={styles.dotLow} />
                    <span>품절 임박</span>
                    <strong>{lowStockCount}개</strong>
                  </li>
                  <li>
                    <span className={styles.dotHidden} />
                    <span>품절·숨김</span>
                    <strong>{hiddenCount}개</strong>
                  </li>
                </ul>
              </div>
            </section>

            <section className={styles.analyticsCard}>
              <header className={styles.analyticsHeader}>
                <h2>카테고리별 상품 수</h2>
                <span>CATEGORY</span>
              </header>
              <div className={styles.activityBars}>
                {categoryCounts.map(([category, count]) => (
                  <div key={category}>
                    <span>{category}</span>
                    <i><b style={{ width: `${(count / largestCategoryCount) * 100}%` }} /></i>
                    <strong>{count}개</strong>
                  </div>
                ))}
              </div>
              <p className={styles.analyticsCaption}>현재 등록 데이터 집계 기준</p>
            </section>
          </aside>
        )}
      </div>

      {/* 토스트 알림 */}
      {toastMessage && (
        <div className={styles.toast} role="status">
          <span>{toastMessage}</span>
          <button type="button" onClick={() => setToastMessage('')}>×</button>
        </div>
      )}
    </section>
  )
}

export default ProductManage
