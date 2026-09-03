import { useEffect, useMemo, useRef, useState } from 'react'
import adminTopOrnament from '../../assets/images/admin/adminTopOrnament.svg'
import styles from './ProductManage.module.scss'

// ========================================
// 초기 상품 데이터
// ========================================
const initialProducts = [
  {
    id: 'ALC-260901',
    name: '문경바람 40도 (오크 숙성)',
    category: '증류주',
    price: 68000,
    stock: 4,
    status: 'selling',
    displayStatus: 'display',
    createdAt: '2026-08-28 14:20',
    description: '사과를 발효하여 정성스레 증류한 뒤 오크통에서 숙성시킨 고급 전통주입니다.',
    tags: ['향: 사과향', '도수: 40도', '페어링: 갈비찜'],
    views: 1420,
    likes: 380,
    reviews: 42,
    rating: 4.8,
  },
  {
    id: 'ALC-260902',
    name: '이강주 25도 375ml',
    category: '약주·청주',
    price: 32000,
    stock: 18,
    status: 'selling',
    displayStatus: 'display',
    createdAt: '2026-08-25 11:15',
    description: '배와 생강이 들어가 알싸하면서도 부드러운 목넘김을 자랑하는 조선 3대 명주.',
    tags: ['향: 배·생강', '도수: 25도', '페어링: 생선회'],
    views: 980,
    likes: 210,
    reviews: 28,
    rating: 4.7,
  },
  {
    id: 'ALC-260903',
    name: '안동소주 일품 350ml',
    category: '증류주',
    price: 45000,
    stock: 2,
    status: 'selling',
    displayStatus: 'display',
    createdAt: '2026-08-21 16:40',
    description: '100% 쌀과 전통 누룩으로 빚은 깊은 풍미의 전통 증류식 소주입니다.',
    tags: ['향: 곡물향', '도수: 40도', '페어링: 삼겹살'],
    views: 2100,
    likes: 540,
    reviews: 64,
    rating: 4.9,
  },
  {
    id: 'ALC-260904',
    name: '한산소곡주 700ml',
    category: '약주·청주',
    price: 39000,
    stock: 0,
    status: 'soldout',
    displayStatus: 'display',
    createdAt: '2026-08-18 10:10',
    description: '한번 앉으면 일어설 수 없다는 감미로운 맛의 대한민국 대표 전통 약주.',
    tags: ['향: 국화향', '도수: 18도', '페어링: 전·부침개'],
    views: 1850,
    likes: 410,
    reviews: 53,
    rating: 4.6,
  },
  {
    id: 'ALC-260905',
    name: '해창 막걸리 12도 900ml',
    category: '탁주',
    price: 18000,
    stock: 32,
    status: 'selling',
    displayStatus: 'display',
    createdAt: '2026-08-15 09:30',
    description: '물과 찹쌀의 조화가 이뤄낸 걸쭉하고 진한 프리미엄 수제 생막걸리.',
    tags: ['향: 쌀 단향', '도수: 12도', '페어링: 보쌈'],
    views: 3200,
    likes: 890,
    reviews: 112,
    rating: 4.9,
  },
  {
    id: 'ALC-260906',
    name: '추사 40 애플 브랜디 500ml',
    category: '과실주',
    price: 72000,
    stock: 11,
    status: 'selling',
    displayStatus: 'display',
    createdAt: '2026-08-10 13:50',
    description: '예산 사과만을 농축 발효하여 오크 숙성시킨 한국형 애플 브랜디.',
    tags: ['향: 바닐라·사과', '도수: 40도', '페어링: 치즈'],
    views: 1150,
    likes: 310,
    reviews: 35,
    rating: 4.8,
  },
  {
    id: 'ALC-260907',
    name: '복순도가 손막걸리 935ml',
    category: '탁주',
    price: 14000,
    stock: 0,
    status: 'hidden',
    displayStatus: 'hidden',
    createdAt: '2026-08-04 15:20',
    description: '천연 탄산이 가득해 샴페인처럼 터지는 스파클링 막걸리입니다.',
    tags: ['향: 상큼한 산미', '도수: 6.5도', '페어링: 핑거푸드'],
    views: 890,
    likes: 190,
    reviews: 19,
    rating: 4.5,
  },
]

const statusLabels = {
  selling: '판매 중',
  soldout: '품절',
  hidden: '숨김',
}

const displayLabels = {
  display: '진열 중',
  hidden: '진열 안함',
}

const categories = ['전체 카테고리', '탁주', '약주·청주', '증류주', '과실주', '선물 세트']

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6v5h-5M4 18v-5h5" />
    <path d="M6.1 9a7 7 0 0 1 11.8-2.2L20 11M4 13l2.1 4.2A7 7 0 0 0 17.9 15" />
  </svg>
)

const ProductManage = () => {
  const [products, setProducts] = useState(initialProducts)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('전체 카테고리')
  const [statusFilter, setStatusFilter] = useState('all')
  const [activeCardKey, setActiveCardKey] = useState('total')
  const [selectedIds, setSelectedIds] = useState([])
  const [selectedProductId, setSelectedProductId] = useState(null)
  const [editStep, setEditStep] = useState(1)
  const [toastMessage, setToastMessage] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 외부 클릭 감지를 위한 Refs
  const tableRef = useRef(null)
  const panelRef = useRef(null)

  // 선택 상품 상태
  const selectedProduct = products.find((p) => p.id === selectedProductId) || null
  const [draftName, setDraftName] = useState('')
  const [draftCategory, setDraftCategory] = useState('증류주')
  const [draftPrice, setDraftPrice] = useState('')
  const [draftStock, setDraftStock] = useState('')
  const [draftStatus, setDraftStatus] = useState('selling')
  const [draftDisplayStatus, setDraftDisplayStatus] = useState('display')
  const [draftDescription, setDraftDescription] = useState('')

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

  // 새로고침 핸들러 (회전 모션 포함)
  const handleRefresh = () => {
    setIsRefreshing(true)
    setProducts(initialProducts)
    setTimeout(() => {
      setIsRefreshing(false)
      setToastMessage('상품 목록을 새로고침했습니다.')
      setTimeout(() => setToastMessage(''), 2500)
    }, 600)
  }

  // 지표 카운트 계산
  const totalCount = products.length
  const sellingCount = products.filter((p) => p.status === 'selling').length
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 5).length
  const hiddenCount = products.filter((p) => p.status === 'hidden' || p.status === 'soldout').length

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
      else if (statusFilter === 'soldout') matchesStatus = p.status === 'soldout'
      else if (statusFilter === 'hidden') matchesStatus = p.status === 'hidden'
      else if (statusFilter === 'lowStock') matchesStatus = p.stock > 0 && p.stock <= 5
      else if (statusFilter === 'hiddenOrSoldout') matchesStatus = p.status === 'hidden' || p.status === 'soldout'

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
  }

  const handleSaveEdit = () => {
    if (!selectedProduct) return
    setProducts((prev) =>
      prev.map((p) =>
        p.id === selectedProduct.id
          ? {
              ...p,
              name: draftName,
              category: draftCategory,
              price: Number(draftPrice),
              stock: Number(draftStock),
              status: draftStatus,
              displayStatus: draftDisplayStatus,
              description: draftDescription,
            }
          : p
      )
    )
    setSelectedProductId(null)
    setToastMessage(`${draftName} 상품 정보가 수정되었습니다.`)
    setTimeout(() => setToastMessage(''), 3000)
  }

  const handleDeleteProduct = () => {
    if (!selectedProduct) return
    if (window.confirm(`'${selectedProduct.name}' 상품을 정말 삭제하시겠습니까?`)) {
      setProducts((prev) => prev.filter((p) => p.id !== selectedProduct.id))
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
                        <span className={styles.thumbPlaceholder} aria-hidden="true" />
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
                    <td>{p.createdAt.split(' ')[0]}</td>
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
              <div className={styles.cardThumb} />
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
                    <label>테이 정보 *</label>
                    <div className={styles.chipGroup}>
                      {selectedProduct.tags?.map((tag) => (
                        <span key={tag} className={styles.chip}>
                          {tag}
                        </span>
                      ))}
                      <button type="button" className={styles.chipAddBtn}>
                        +
                      </button>
                    </div>
                  </div>

                  <div className={styles.formFieldBlock}>
                    <label>상품 앨범 *</label>
                    <div className={styles.albumRow}>
                      <div className={styles.mainImgBox}>
                        <span>대표 이미지</span>
                      </div>
                      <div className={styles.subImgBox}>
                        <span>서브 1</span>
                        <button type="button">×</button>
                      </div>
                      <div className={styles.subImgBox}>
                        <span>서브 2</span>
                        <button type="button">×</button>
                      </div>
                      <button type="button" className={styles.uploadPlusBox}>
                        <span>+</span>
                        <small>이미지 추가</small>
                      </button>
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
                        <strong>{selectedProduct.reviews}개</strong>
                      </p>
                    </div>
                    <div className={styles.metricBox}>
                      <span>평균 평점</span>
                      <p>
                        <i className={styles.dotGrey} />
                        <strong>{selectedProduct.rating}점</strong>
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
                <div>
                  <span>탁주</span>
                  <i><b style={{ width: '45%' }} /></i>
                  <strong>2개</strong>
                </div>
                <div>
                  <span>약주·청주</span>
                  <i><b style={{ width: '45%' }} /></i>
                  <strong>2개</strong>
                </div>
                <div>
                  <span>증류주</span>
                  <i><b style={{ width: '45%' }} /></i>
                  <strong>2개</strong>
                </div>
                <div>
                  <span>과실주</span>
                  <i><b style={{ width: '25%' }} /></i>
                  <strong>1개</strong>
                </div>
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