import { useEffect, useMemo, useRef, useState } from 'react'

import { collection, collectionGroup, onSnapshot, query, where } from 'firebase/firestore'

import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
} from 'chart.js'
import { Scatter } from 'react-chartjs-2'


import AdminEmptyState from '../../components/admin/AdminEmptyState'
import AdminFilterBar from '../../components/admin/AdminFilterBar'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminPanel from '../../components/admin/AdminPanel'
import AdminStatusBadge from '../../components/admin/AdminStatusBadge'
import AdminSummaryCard from '../../components/admin/AdminSummaryCard'


import totalIcon from '../../assets/webpImages/icons/box.webp'

import sellingIcon from '../../assets/webpImages/icons/shopping.webp'

import lowStockIcon from '../../assets/webpImages/icons/alert.webp'

import hiddenIcon from '../../assets/webpImages/icons/X.webp'

import { products as productData } from '../../data/products'

import pairingData from '../../data/pairings.json'

import { db } from '../../firebase/firebase'

import { deleteDocument, setDocument, updateDocument } from '../../firebase/firestore'

import { fetchProducts } from '../../services/productCatalog'

import styles from './ProductManage.module.scss'

ChartJS.register(
  LinearScale,
  PointElement,
  Tooltip
)



// ========================================

// 초기 상품 데이터

// ========================================

const productImages = import.meta.glob('../../assets/webpImages/images/products/*.webp', { eager: true, import: 'default' })

const productDetailImages = import.meta.glob('../../assets/webpImages/images/products/productDetail/**/*.webp', { eager: true, import: 'default' })

const PRODUCT_OVERRIDES_KEY = 'jajak_admin_product_overrides'

const DELETED_PRODUCTS_KEY = 'jajak_admin_deleted_products'

const PRODUCTS_PER_PAGE = 8

const PRODUCT_CATEGORIES = ['탁주', '약주', '청주', '증류주', '과실주', '리큐르', '안주', '잔', '선물 세트']

const EMPTY_DETAIL_DRAFT = {

  brandManufacturer: '', discountRate: '0', volume: '', alcoholByVolume: '',

  snackType: '', glassType: '', sweetness: '0', acidity: '0', carbonation: '0', bodyWeight: '0',

  timeOfDay: '', recommendedSituation: '', recommendedTimeStart: '',

  recommendedTimeEnd: '', recommendedDrinkingTemperature: '', allergyCautionInfo: '',

}

const resolveProductImage = (imageUrl) => {

  if (/^(data:|https?:\/\/)/.test(imageUrl ?? '')) return imageUrl

  const fileName = imageUrl?.split('/').pop()

  return Object.entries(productImages).find(([path]) => (path.endsWith(`/${fileName}`) || path.endsWith((`/${fileName}`).replace(/\.(png|jpe?g)$/i, '.webp'))))?.[1]

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

const getReferenceImageUrl = (product) =>

  productData.find((item) => item.productId === product?.productId)?.imageUrl

    ?? product?.imageUrl

const normalizeProduct = (product) => {

  const reference = productData.find((item) => item.productId === product.productId) ?? {}

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

    description: product.productDescription ?? reference.productDescription ?? '',

    tags: [...new Set([...(reference.flavorKeywords ?? []), ...(product.flavorKeywords ?? [])])],

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

  const [currentPage, setCurrentPage] = useState(1)

  const [panelMode, setPanelMode] = useState('analytics')

  const [draftProductId, setDraftProductId] = useState('')

  const categories = useMemo(

    () => ['전체 카테고리', ...new Set([...PRODUCT_CATEGORIES, ...products.map((product) => product.category).filter(Boolean)])],

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

  const [draftDetails, setDraftDetails] = useState(EMPTY_DETAIL_DRAFT)

  const [draftPairingIds, setDraftPairingIds] = useState([])

  const [liveMetrics, setLiveMetrics] = useState({ reviews: 0, rating: 0, likes: 0 })

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

  const lowStockCount = products.filter((p) => p.status !== 'hidden' && p.stock > 0 && p.stock <= 30).length

  const regularSellingCount = Math.max(0, sellingCount - lowStockCount)

  const hiddenCount = products.filter((p) => p.status === 'hidden' || isSoldOut(p)).length

  // ========================================
  // 상품 상태 분포 차트
  // X축: 가격 / Y축: 재고
  // ========================================

  const productStatusChartData = useMemo(() => {
    const sellingProducts = []
    const lowStockProducts = []
    const hiddenProducts = []

    products.forEach((product) => {
      const point = {
        x: Number(product.price) || 0,
        y: Number(product.stock) || 0,
        productName: product.name,
      }

      const lowStock =
        product.status !== 'hidden'
        && product.stock > 0
        && product.stock <= 30

      const hiddenOrSoldOut =
        product.status === 'hidden'
        || product.status === 'soldout'
        || product.stock <= 0

      if (lowStock) {
        lowStockProducts.push(point)
        return
      }

      if (hiddenOrSoldOut) {
        hiddenProducts.push(point)
        return
      }

      if (product.status === 'selling') {
        sellingProducts.push(point)
      }
    })

    return {
      datasets: [
        {
          label: '판매 중',
          data: sellingProducts,
          backgroundColor: 'rgba(86, 138, 128, 0.72)',
          borderColor: '#568a80',
          borderWidth: 1,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
        {
          label: '품절 임박',
          data: lowStockProducts,
          backgroundColor: 'rgba(217, 160, 93, 0.75)',
          borderColor: '#d9a05d',
          borderWidth: 1,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
        {
          label: '품절·숨김',
          data: hiddenProducts,
          backgroundColor: 'rgba(214, 170, 165, 0.75)',
          borderColor: '#d6aaa5',
          borderWidth: 1,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    }
  }, [products])


  const productStatusChartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,

      animation: {
        duration: 900,
        easing: 'easeOutQuart',
      },

      plugins: {
        legend: {
          display: false,
        },

        tooltip: {
          displayColors: false,
          padding: 10,

          callbacks: {
            title: (items) =>
              items[0]?.raw?.productName ?? '',

            label: (context) => [
              context.dataset.label,
              `가격: ${Number(context.raw.x).toLocaleString('ko-KR')}원`,
              `재고: ${Number(context.raw.y).toLocaleString('ko-KR')}개`,
            ],
          },
        },
      },

      scales: {
        x: {
          type: 'linear',

          beginAtZero: true,

          title: {
            display: true,
            text: '가격',
            color: '#8c9490',

            font: {
              size: 10,
              weight: '600',
            },
          },

          grid: {
            color: 'rgba(223, 226, 224, 0.7)',
          },

          ticks: {
            color: '#8c9490',

            font: {
              size: 9,
            },

            callback: (value) =>
              `${(Number(value) / 10000).toFixed(
                Number(value) % 10000 === 0 ? 0 : 1
              )}만`,
          },
        },

        y: {
          beginAtZero: true,

          title: {
            display: true,
            text: '재고',
            color: '#8c9490',

            font: {
              size: 10,
              weight: '600',
            },
          },

          grid: {
            color: 'rgba(223, 226, 224, 0.7)',
          },

          ticks: {
            precision: 0,

            color: '#8c9490',

            font: {
              size: 9,
            },
          },
        },
      },
    }),
    []
  )

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

    { key: 'total', label: '전체 상품 수', value: totalCount, unit: '개', caption: '정상 등록 상품', icon: totalIcon },

    { key: 'selling', label: '판매 중 상품', value: sellingCount, unit: '개', caption: `전체의 ${Math.round((sellingCount / totalCount) * 100 || 0)}%`, icon: sellingIcon },

    { key: 'lowStock', label: '품절 임박 (5개 이하)', value: lowStockCount, unit: '개', caption: '즉시 발주 필요', icon: lowStockIcon },

    { key: 'hidden', label: '품절 및 숨김', value: hiddenCount, unit: '개', caption: '노출 중단 관리', icon: hiddenIcon },

  ]

  // 상단 카드 클릭 필터 연동

  const handleCardClick = (key) => {

    setActiveCardKey(key)

    setSearchQuery('')

    setCategoryFilter('전체 카테고리')

    setCurrentPage(1)

    setSelectedProductId(null)

    setPanelMode('analytics')

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

      else if (statusFilter === 'lowStock') matchesStatus = p.stock > 0 && p.stock <= 30

      else if (statusFilter === 'hiddenOrSoldout') matchesStatus = p.status === 'hidden' || isSoldOut(p)

      return matchesQuery && matchesCategory && matchesStatus

    })

  }, [products, searchQuery, categoryFilter, statusFilter])

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredProducts.length
      / PRODUCTS_PER_PAGE
    )
  )

  const pageStart = Math.max(
    1,
    Math.min(
      currentPage - 2,
      totalPages - 4
    )
  )

  const pageNumbers = Array.from(
    {
      length: Math.min(
        5,
        totalPages
      ),
    },
    (_, index) =>
      pageStart + index
  )

  const paginatedProducts =
    filteredProducts.slice(
      (
        currentPage - 1
      ) * PRODUCTS_PER_PAGE,
      currentPage
      * PRODUCTS_PER_PAGE
    )

  useEffect(() => setCurrentPage(1), [searchQuery, categoryFilter, statusFilter])

  useEffect(() => setCurrentPage((page) => Math.min(page, totalPages)), [totalPages])

  const handleSelectAll = (e) => {

    setSelectedIds(e.target.checked ? paginatedProducts.map((p) => p.id) : [])

  }

  const handleSelectRow = (id, e) => {

    e.stopPropagation()

    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))

  }

  const scrollPanelIntoViewOnMobile = () => {

    if (
      typeof window !== 'undefined'
      && window.matchMedia(
        '(max-width: 767px)'
      ).matches
    ) {
      window.requestAnimationFrame(() => {

        window.requestAnimationFrame(() => {

          panelRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })

        })

      })
    }

  }

  const openEditPanel = (product) => {

    setPanelMode('edit')

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

    const timeRange = product.recommendedTimeRange ?? {}

    setDraftDetails({

      brandManufacturer: product.brandManufacturer ?? '',

      discountRate: String(product.discountRate ?? '0').replace('%', ''),

      volume: product.volume ?? '',

      alcoholByVolume: product.alcoholByVolume ?? product.abv ?? '',

      snackType: product.snackType ?? '',

      glassType: product.glassType ?? '',

      sweetness: String(product.sweetness ?? 0), acidity: String(product.acidity ?? 0),

      carbonation: String(product.carbonation ?? 0), bodyWeight: String(product.bodyWeight ?? 0),

      timeOfDay: product.timeOfDay ?? '', recommendedSituation: product.recommendedSituation ?? '',

      recommendedTimeStart: timeRange.start ?? '', recommendedTimeEnd: timeRange.end ?? '',

      recommendedDrinkingTemperature: product.recommendedDrinkingTemperature ?? '',

      allergyCautionInfo: product.allergyCautionInfo ?? '',

    })

    const legacyPairing = pairingData.find((item) => item.liquorId === product.id)

    const reversePairingIds = pairingData

      .filter((item) => [...(item.pairedFoodIds ?? []), ...(item.recommendedGlassIds ?? [])].includes(product.id))

      .map((item) => item.liquorId)

    setDraftPairingIds(product.pairedProductIds ?? [

      ...(legacyPairing?.pairedFoodIds ?? []),

      ...(legacyPairing?.recommendedGlassIds ?? []),

      ...reversePairingIds,

    ])

    scrollPanelIntoViewOnMobile()

  }

  const openCreatePanel = () => {

    setPanelMode('create')

    setSelectedProductId(null)

    setEditStep(1)

    setDraftProductId('')

    setDraftName('')

    setDraftCategory('탁주')

    setDraftPrice('')

    setDraftStock('')

    setDraftStatus('selling')

    setDraftDisplayStatus('display')

    setDraftDescription('')

    setDraftTags([])

    setDraftTag('')

    setDraftImageUrl('')

    setDraftDetailImageUrls([null, null, null])

    setDraftDetails(EMPTY_DETAIL_DRAFT)

    setDraftPairingIds([])

    scrollPanelIntoViewOnMobile()

  }

  const updateDraftDetail = (key, value) => {

    setDraftDetails((current) => ({ ...current, [key]: value }))

  }

  useEffect(() => {

    if (!selectedProductId) {

      setLiveMetrics({ reviews: 0, rating: 0, likes: 0 })

      return undefined

    }

    return onSnapshot(

      query(collection(db, 'reviews'), where('productId', '==', selectedProductId)),

      (snapshot) => {

        const ratings = snapshot.docs.map((item) => Number(item.data().rating)).filter(Number.isFinite)

        setLiveMetrics((current) => ({ ...current, reviews: snapshot.size, rating: ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : 0 }))

      },

      () => setLiveMetrics((current) => ({ ...current, reviews: 0, rating: 0 })),

    )

  }, [selectedProductId])

  useEffect(() => {

    if (!selectedProductId) return undefined

    return onSnapshot(

      query(collectionGroup(db, 'wishlist'), where('productId', '==', selectedProductId)),

      (snapshot) => setLiveMetrics((current) => ({ ...current, likes: snapshot.size })),

      () => setLiveMetrics((current) => ({ ...current, likes: selectedProduct?.likes ?? 0 })),

    )

  }, [selectedProductId, selectedProduct?.likes])

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

      pairedProductIds: draftPairingIds,

    }

    const isLiquor = ['탁주', '약주', '청주', '증류주', '과실주', '리큐르'].includes(draftCategory)

    const isAccessory = ['잔', '선물 세트'].includes(draftCategory)

    try {

      await updateDocument('products', selectedProduct.id, {

        productName: draftName,

        productType: isLiquor ? '전통주' : (isAccessory ? '주류용품' : draftCategory),

        liquorType: isLiquor ? draftCategory : (selectedProduct.liquorType ?? null),

        glassType: isAccessory ? (draftDetails.glassType.trim() || (draftCategory === '선물 세트' ? '선물세트' : '술잔')) : null,

        price: Number(draftPrice),

        stock: normalizedStock,

        status: normalizedStatus,

        productDescription: draftDescription,

        flavorKeywords: draftTags,

        imageUrl: draftImageUrl,

        detailImageUrls: draftDetailImageUrls,

        brandManufacturer: draftDetails.brandManufacturer.trim(),

        discountRate: `${Math.max(0, Number(draftDetails.discountRate) || 0)}%`,

        volume: draftDetails.volume.trim() || null,

        snackType: draftCategory === '안주' ? draftDetails.snackType.trim() || null : null,

        alcoholByVolume: isLiquor ? draftDetails.alcoholByVolume.trim() || null : null,

        abv: isLiquor ? Number.parseFloat(draftDetails.alcoholByVolume) || 0 : null,

        sweetness: isLiquor ? Number(draftDetails.sweetness) : null,

        acidity: isLiquor ? Number(draftDetails.acidity) : null,

        carbonation: isLiquor ? Number(draftDetails.carbonation) : null,

        bodyWeight: isLiquor ? Number(draftDetails.bodyWeight) : null,

        timeOfDay: isLiquor ? draftDetails.timeOfDay.trim() || null : null,

        recommendedSituation: isLiquor ? draftDetails.recommendedSituation.trim() || null : null,

        recommendedTimeRange: isLiquor && (draftDetails.recommendedTimeStart || draftDetails.recommendedTimeEnd)

          ? { start: draftDetails.recommendedTimeStart, end: draftDetails.recommendedTimeEnd }

          : null,

        recommendedDrinkingTemperature: isLiquor ? draftDetails.recommendedDrinkingTemperature.trim() || null : null,

        allergyCautionInfo: draftDetails.allergyCautionInfo.trim() || null,

        pairedProductIds: draftPairingIds,

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

  const handleCreateProduct = async () => {

    const productId = draftProductId.trim()

    if (!productId || !draftName.trim() || !draftPrice || draftStock === '') {

      setToastMessage('상품 ID, 상품명, 가격, 재고를 모두 입력해주세요.')

      return

    }

    if (products.some((product) => product.id === productId)) {

      setToastMessage('이미 사용 중인 상품 ID입니다.')

      return

    }

    const isLiquor = ['탁주', '약주', '청주', '증류주', '과실주', '리큐르'].includes(draftCategory)

    const isAccessory = ['잔', '선물 세트'].includes(draftCategory)

    const stock = Math.max(0, Number(draftStock))

    if (!draftDetails.brandManufacturer.trim() || !draftImageUrl || draftDetailImageUrls.filter(Boolean).length < 3) {

      setToastMessage('제조사와 대표 이미지, 서브 이미지 3장을 모두 입력해주세요.')

      return

    }

    try {

      await setDocument('products', productId, {

        productId,

        productName: draftName.trim(),

        productType: isLiquor ? '전통주' : (isAccessory ? '주류용품' : draftCategory),

        liquorType: isLiquor ? draftCategory : null,

        snackType: draftCategory === '안주' ? draftDetails.snackType.trim() : null,

        glassType: isAccessory ? (draftDetails.glassType.trim() || (draftCategory === '선물 세트' ? '선물세트' : '술잔')) : null,

        brandManufacturer: draftDetails.brandManufacturer.trim(),

        price: Number(draftPrice),

        discountRate: `${Math.max(0, Number(draftDetails.discountRate) || 0)}%`,

        volume: draftDetails.volume.trim() || null,

        alcoholByVolume: isLiquor ? draftDetails.alcoholByVolume.trim() || null : null,

        abv: isLiquor ? Number.parseFloat(draftDetails.alcoholByVolume) || 0 : null,

        sweetness: isLiquor ? Number(draftDetails.sweetness) : null,

        acidity: isLiquor ? Number(draftDetails.acidity) : null,

        carbonation: isLiquor ? Number(draftDetails.carbonation) : null,

        bodyWeight: isLiquor ? Number(draftDetails.bodyWeight) : null,

        timeOfDay: isLiquor ? draftDetails.timeOfDay.trim() || null : null,

        recommendedSituation: isLiquor ? draftDetails.recommendedSituation.trim() || null : null,

        recommendedTimeRange: isLiquor && (draftDetails.recommendedTimeStart || draftDetails.recommendedTimeEnd)

          ? { start: draftDetails.recommendedTimeStart, end: draftDetails.recommendedTimeEnd }

          : null,

        recommendedDrinkingTemperature: isLiquor ? draftDetails.recommendedDrinkingTemperature.trim() || null : null,

        allergyCautionInfo: draftDetails.allergyCautionInfo.trim() || null,

        stock,

        status: draftDisplayStatus === 'hidden' ? 'hidden' : (stock === 0 ? 'soldout' : draftStatus),

        productDescription: draftDescription.trim(), flavorKeywords: draftTags,

        imageUrl: draftImageUrl, detailImageUrls: draftDetailImageUrls.filter(Boolean),

        pairedProductIds: draftPairingIds,

        views: 0, likes: 0, reviewCount: 0, rating: 0,

        createdAt: new Date().toISOString(),

      })

      setPanelMode('analytics')

      setToastMessage(`${draftName.trim()} 상품이 등록되었습니다.`)

      setTimeout(() => setToastMessage(''), 3000)

    } catch (error) {

      console.error('상품 등록 실패:', error)

      setToastMessage('상품을 등록하지 못했습니다. 관리자 권한을 확인해주세요.')

    }

  }

  const resetFilters = () => {

    setSearchQuery('')

    setCategoryFilter('전체 카테고리')

    setStatusFilter('all')

    setActiveCardKey('total')

    setCurrentPage(1)

  }

  const renderPairingPicker = () => (

    <section className={styles.formSection}>

      <h4 className={styles.sectionBarTitle}>추천 페어링 상품</h4>

      <p className={styles.fieldGuide}>상품 상세페이지의 추천 조합에 표시할 상품을 선택하세요.</p>

      <div className={styles.pairingPicker}>

        {products

          .filter((item) => item.id !== (selectedProductId ?? draftProductId))

          .map((item) => (

            <label key={item.id} className={draftPairingIds.includes(item.id) ? styles.selectedPairing : ''}>

              <input

                type="checkbox"

                checked={draftPairingIds.includes(item.id)}

                onChange={() => setDraftPairingIds((current) => current.includes(item.id)

                  ? current.filter((id) => id !== item.id)

                  : [...current, item.id])}

              />

              <span>{item.imageSrc && <img src={item.imageSrc} alt=""  loading="lazy" decoding="async" />}</span>

              <strong title={item.name}>{item.name}</strong>

            </label>

          ))}

      </div>

      <p className={styles.selectionCount}>{draftPairingIds.length}개 상품 선택됨</p>

    </section>

  )

  return (

    <section className={styles.page} aria-labelledby="product-manage-title">

      {/* ========================================
          제목
      ======================================== */}

      <AdminPageHeader
        title="상품 관리"
        titleId="product-manage-title"
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />


      {/* ========================================
          상품 현황
      ======================================== */}

      <section
        className={styles.summaryArea}
        aria-label="상품 현황 필터 요약"
      >
        <div className={styles.summaryGrid}>
          {summaryCards.map((card) => (
            <AdminSummaryCard
              key={card.key}
              icon={
                <img
                  src={card.icon}
                  alt=""
                 loading="lazy" decoding="async" />
              }
              label={card.label}
              value={String(card.value)}
              unit={card.unit}
              caption={card.caption}
              tone={
                card.key === 'hidden'
                  ? 'danger'
                  : card.key === 'lowStock'
                    ? 'warning'
                    : card.key === 'selling'
                      ? 'info'
                      : 'primary'
              }
              active={
                activeCardKey === card.key
              }
              onClick={() =>
                handleCardClick(card.key)
              }
            />
          ))}
        </div>
      </section>


      {/* 메인 2단 그리드 */}

      <div className={styles.managementGrid}>

        {/* 좌측: 상품 테이블 */}

        <section
          className={styles.mainSection}
          aria-labelledby="product-list-title"
        >

          {/* 검색 / 필터 */}

          <AdminFilterBar
            searchValue={searchQuery}
            onSearchChange={(value) => {
              setSearchQuery(value)
              setActiveCardKey(null)
              setCurrentPage(1)
            }}
            searchPlaceholder="상품명, 상품 ID(코드) 검색"
            searchLabel="상품 검색"
            onReset={resetFilters}
          >
            <label className={styles.selectField}>
              <span className={styles.srOnly}>
                상품 카테고리
              </span>

              <select
                value={categoryFilter}
                onChange={(event) => {
                  setCategoryFilter(
                    event.target.value
                  )
                  setActiveCardKey(null)
                  setCurrentPage(1)
                }}
              >
                {categories.map((category) => (
                  <option
                    key={category}
                    value={category}
                  >
                    {category}
                  </option>
                ))}
              </select>
            </label>

            <label className={styles.selectField}>
              <span className={styles.srOnly}>
                상품 상태
              </span>

              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(
                    event.target.value
                  )
                  setActiveCardKey(null)
                  setCurrentPage(1)
                }}
              >
                <option value="all">
                  전체 상태
                </option>
                <option value="selling">
                  판매 중
                </option>
                <option value="soldout">
                  품절
                </option>
                <option value="hidden">
                  숨김
                </option>
              </select>
            </label>
          </AdminFilterBar>


          {/* 상품 목록 제목 */}

          <div className={styles.sectionHeading}>

            <div className={styles.titleWrap}>
              <h2 id="product-list-title">
                상품 목록
              </h2>
            </div>

            <div className={styles.headingRight}>
              <span className={styles.productCount}>
                총{' '}
                <strong>
                  {filteredProducts.length.toLocaleString(
                    'ko-KR'
                  )}
                </strong>
                개
              </span>

              <div className={styles.actions}>
                {selectedIds.length > 0 && (
                  <button
                    type="button"
                    className={styles.bulkButton}
                  >
                    선택 {selectedIds.length}개 판매 중지
                  </button>
                )}

                <button
                  type="button"
                  className={styles.registerButton}
                  onClick={openCreatePanel}
                >
                  + 새 상품 등록
                </button>
              </div>
            </div>

          </div>

          {/* 테이블 영역 */}

          {filteredProducts.length === 0 ? (
            <AdminEmptyState
              title="검색 결과가 없습니다."
              description="검색어나 필터 조건을 다시 확인해주세요."
            />
          ) : (
            <>
              <div className={styles.tableWrap} ref={tableRef}>

                <table className={styles.dataTable}>

                  <thead>

                    <tr>

                      <th style={{ width: 40 }}>

                        <input

                          type="checkbox"

                          onChange={handleSelectAll}

                          checked={paginatedProducts.length > 0 && paginatedProducts.every((product) => selectedIds.includes(product.id))}

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

                    {paginatedProducts.map((p) => (

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

                              {p.imageSrc && <img src={p.imageSrc} alt=""  loading="lazy" decoding="async" />}

                            </span>

                            <span className={styles.pName}>{p.name}</span>

                          </div>

                        </td>

                        <td>{p.category}</td>

                        <td>{p.price.toLocaleString('ko-KR')}원</td>

                        <td>

                          <span className={p.stock <= 30 ? styles.lowStockText : ''}>

                            {p.stock}개 {p.stock <= 30 && p.stock > 0 && <small>(임박)</small>}

                          </span>

                        </td>

                        <td>

                          <AdminStatusBadge
                            tone={
                              p.status === 'selling'
                                ? 'success'
                                : p.status === 'soldout'
                                  ? 'warning'
                                  : 'danger'
                            }
                          >
                            {statusLabels[p.status]}
                          </AdminStatusBadge>

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

              <nav className={styles.pagination} aria-label="상품 목록 페이지">

                <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={currentPage === 1} aria-label="이전 페이지">‹</button>

                {pageNumbers.map((page) => (

                  <button
                    key={page}
                    type="button"
                    className={
                      currentPage === page
                        ? styles.activePage
                        : ''
                    }
                    onClick={() =>
                      setCurrentPage(page)
                    }
                    aria-current={
                      currentPage === page
                        ? 'page'
                        : undefined
                    }
                  >
                    {page}
                  </button>

                ))}

                <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={currentPage === totalPages} aria-label="다음 페이지">›</button>

              </nav>
            </>
          )}

        </section>

        {/* 우측 패널 (상품 수정 vs 통계) */}

        {panelMode === 'create' ? (

          <aside className={styles.editPanel} ref={panelRef} aria-labelledby="create-panel-title">

            <header className={styles.panelTopHeader}>

              <h2 id="create-panel-title">새 상품 등록</h2>

              <button type="button" onClick={() => setPanelMode('analytics')} aria-label="닫기">×</button>

            </header>

            <div className={styles.formContainer}>

              <div className={styles.stepIndicator} aria-label={`상품 등록 ${editStep}단계`}><span>{editStep}</span> / 4</div>

              {editStep === 1 && <>

              <section className={styles.formSection}>

                <h4 className={styles.sectionBarTitle}>기본 정보</h4>

                <div className={styles.formRow}><label htmlFor="create-product-id">상품 ID *</label><input id="create-product-id" value={draftProductId} onChange={(e) => setDraftProductId(e.target.value)} placeholder="product37" /></div>

                <div className={styles.formRow}><label htmlFor="create-product-name">상품명 *</label><input id="create-product-name" value={draftName} onChange={(e) => setDraftName(e.target.value)} /></div>

                <div className={styles.formRow}><label htmlFor="create-product-category">카테고리 *</label><select id="create-product-category" value={draftCategory} onChange={(e) => setDraftCategory(e.target.value)}>{PRODUCT_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></div>

              </section>

              <section className={styles.formSection}>

                <h4 className={styles.sectionBarTitle}>판매 정보</h4>

                <div className={styles.formRow}><label htmlFor="create-product-price">가격 (원) *</label><input id="create-product-price" type="number" min="0" value={draftPrice} onChange={(e) => setDraftPrice(e.target.value)} /></div>

                <div className={styles.formRow}><label htmlFor="create-product-stock">재고 (개) *</label><input id="create-product-stock" type="number" min="0" value={draftStock} onChange={(e) => setDraftStock(e.target.value)} /></div>

                <div className={styles.formRow}><label htmlFor="create-product-status">판매 상태 *</label><select id="create-product-status" value={draftStatus} onChange={(e) => setDraftStatus(e.target.value)}><option value="selling">판매 중</option><option value="soldout">품절</option><option value="hidden">숨김</option></select></div>

                <div className={styles.formRow}><label htmlFor="create-display-status">진열 상태 *</label><select id="create-display-status" value={draftDisplayStatus} onChange={(e) => setDraftDisplayStatus(e.target.value)}><option value="display">진열 중</option><option value="hidden">진열 안함</option></select></div>

              </section>

              <div className={styles.nextActionWrap}><button type="button" className={styles.deleteBtn} onClick={() => setPanelMode('analytics')}>취소</button><button type="button" className={styles.nextBtn} onClick={() => setEditStep(2)}>다음 &gt;</button></div>

              </>}

              {editStep === 2 && <>

              <section className={styles.formSection}>

                <h4 className={styles.sectionBarTitle}>상품 정보</h4>

                <div className={styles.formFieldBlock}><label htmlFor="create-product-description">상품 설명 *</label><textarea id="create-product-description" rows="3" value={draftDescription} onChange={(e) => setDraftDescription(e.target.value)} /></div>

                <div className={styles.formRow}><label htmlFor="create-brand">제조사 *</label><input id="create-brand" value={draftDetails.brandManufacturer} onChange={(e) => updateDraftDetail('brandManufacturer', e.target.value)} /></div>

                <div className={styles.formRow}><label htmlFor="create-discount">할인율 (%)</label><input id="create-discount" type="number" min="0" max="100" value={draftDetails.discountRate} onChange={(e) => updateDraftDetail('discountRate', e.target.value)} /></div>

                <div className={styles.formRow}><label htmlFor="create-volume">용량</label><input id="create-volume" value={draftDetails.volume} onChange={(e) => updateDraftDetail('volume', e.target.value)} placeholder="예: 500ml" /></div>

                {draftCategory === '안주' && <div className={styles.formRow}><label htmlFor="create-snack-type">안주 유형</label><input id="create-snack-type" value={draftDetails.snackType} onChange={(e) => updateDraftDetail('snackType', e.target.value)} placeholder="예: 마른안주" /></div>}

                {['잔', '선물 세트'].includes(draftCategory) && <div className={styles.formRow}><label htmlFor="create-glass-type">제품 유형</label><input id="create-glass-type" value={draftDetails.glassType} onChange={(e) => updateDraftDetail('glassType', e.target.value)} placeholder={draftCategory === '잔' ? '예: 청자 술잔' : '예: 혼술 선물세트'} /></div>}

                {['탁주', '약주', '청주', '증류주', '과실주', '리큐르'].includes(draftCategory) && (

                  <div className={styles.detailFields}>

                    <div className={styles.formRow}><label htmlFor="create-abv">도수</label><input id="create-abv" value={draftDetails.alcoholByVolume} onChange={(e) => updateDraftDetail('alcoholByVolume', e.target.value)} placeholder="예: 8.0%" /></div>

                    <div className={styles.tasteInputs}>

                      {[

                        ['sweetness', '당도'], ['acidity', '산도'], ['carbonation', '탄산'], ['bodyWeight', '묵직함'],

                      ].map(([key, label]) => <label key={key}>{label} (0~5)<input type="number" min="0" max="5" value={draftDetails[key]} onChange={(e) => updateDraftDetail(key, e.target.value)} /></label>)}

                    </div>

                    <div className={styles.formRow}><label htmlFor="create-time-of-day">추천 시간대</label><select id="create-time-of-day" value={draftDetails.timeOfDay} onChange={(e) => updateDraftDetail('timeOfDay', e.target.value)}><option value="">선택</option><option value="낮의 결">낮의 결</option><option value="밤의 결">밤의 결</option></select></div>

                    <div className={styles.timeInputs}><label>시작 시간<input type="time" value={draftDetails.recommendedTimeStart} onChange={(e) => updateDraftDetail('recommendedTimeStart', e.target.value)} /></label><label>종료 시간<input type="time" value={draftDetails.recommendedTimeEnd} onChange={(e) => updateDraftDetail('recommendedTimeEnd', e.target.value)} /></label></div>

                    <div className={styles.formFieldBlock}><label htmlFor="create-situation">추천 상황</label><textarea id="create-situation" rows="2" value={draftDetails.recommendedSituation} onChange={(e) => updateDraftDetail('recommendedSituation', e.target.value)} /></div>

                    <div className={styles.formRow}><label htmlFor="create-temperature">추천 음용 온도</label><input id="create-temperature" value={draftDetails.recommendedDrinkingTemperature} onChange={(e) => updateDraftDetail('recommendedDrinkingTemperature', e.target.value)} placeholder="예: 차갑게 (5~10℃)" /></div>

                  </div>

                )}

              </section>

              <div className={styles.stepFooter}><button type="button" className={styles.prevBtn} onClick={() => setEditStep(1)}>&lt; 이전</button><button type="button" className={styles.nextBtn} onClick={() => setEditStep(3)}>다음 &gt;</button></div>

              </>}

              {editStep === 3 && <>

                <section className={styles.formSection}>

                <div className={styles.formFieldBlock}><label htmlFor="create-allergy">알레르기 주의사항</label><textarea id="create-allergy" rows="2" value={draftDetails.allergyCautionInfo} onChange={(e) => updateDraftDetail('allergyCautionInfo', e.target.value)} /></div>

                <div className={styles.formFieldBlock}>

                  <label>맛 키워드</label>

                  <div className={styles.chipGroup}>{draftTags.map((tag) => <span key={tag} className={styles.chip}>{tag}<button type="button" onClick={() => setDraftTags((current) => current.filter((item) => item !== tag))} aria-label={`${tag} 삭제`}>×</button></span>)}</div>

                  <div className={styles.tagEditor}><input value={draftTag} onChange={(e) => setDraftTag(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag() } }} placeholder="맛 키워드 입력" /><button type="button" onClick={handleAddTag}>추가</button></div>

                </div>

                <div className={styles.formFieldBlock}>

                  <label>상품 앨범</label>

                  <div className={styles.albumRow}>

                    <button type="button" className={styles.imageEditTile} onClick={() => imageInputRef.current?.click()}>{draftImageUrl ? <img src={resolveProductImage(draftImageUrl)} alt="새 상품 대표"  loading="lazy" decoding="async" /> : <span className={styles.emptyImage}>대표 이미지</span>}<strong>대표 이미지 {draftImageUrl ? '변경' : '등록'}</strong></button>

                    <input ref={imageInputRef} className={styles.srOnly} type="file" accept="image/*" onChange={handleImageChange} />

                    {draftDetailImageUrls.map((url, index) => <button type="button" className={styles.imageEditTile} key={index} onClick={() => detailImageInputRefs.current[index]?.click()}>{url ? <img src={url} alt={`서브 이미지 ${index + 1}`}  loading="lazy" decoding="async" /> : <span className={styles.emptyImage}>서브 {index + 1}</span>}<strong>서브 {index + 1} {url ? '변경' : '등록'}</strong><input ref={(node) => { detailImageInputRefs.current[index] = node }} className={styles.srOnly} type="file" accept="image/*" onChange={(event) => handleImageChange(event, index)} /></button>)}

                  </div>

                </div>

              </section>

              <div className={styles.stepFooter}><button type="button" className={styles.prevBtn} onClick={() => setEditStep(2)}>&lt; 이전</button><button type="button" className={styles.nextBtn} onClick={() => setEditStep(4)}>다음 &gt;</button></div>

              </>}

              {editStep === 4 && <>

                {renderPairingPicker()}

                <div className={styles.stepFooter}><button type="button" className={styles.prevBtn} onClick={() => setEditStep(3)}>&lt; 이전</button><button type="button" className={styles.saveBtn} onClick={handleCreateProduct}>상품 등록</button></div>

              </>}

            </div>

          </aside>

        ) : selectedProduct ? (

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

                {selectedProduct.imageSrc && <img src={selectedProduct.imageSrc} alt=""  loading="lazy" decoding="async" />}

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

                  <div className={styles.formRow}><label>제조사 *</label><input value={draftDetails.brandManufacturer} onChange={(e) => updateDraftDetail('brandManufacturer', e.target.value)} /></div>

                  <div className={styles.formRow}><label>할인율 (%)</label><input type="number" min="0" max="100" value={draftDetails.discountRate} onChange={(e) => updateDraftDetail('discountRate', e.target.value)} /></div>

                  <div className={styles.formRow}><label>용량</label><input value={draftDetails.volume} onChange={(e) => updateDraftDetail('volume', e.target.value)} /></div>

                  {draftCategory === '안주' && <div className={styles.formRow}><label>안주 유형</label><input value={draftDetails.snackType} onChange={(e) => updateDraftDetail('snackType', e.target.value)} /></div>}

                  {['잔', '선물 세트'].includes(draftCategory) && <div className={styles.formRow}><label>제품 유형</label><input value={draftDetails.glassType} onChange={(e) => updateDraftDetail('glassType', e.target.value)} placeholder={draftCategory === '잔' ? '예: 청자 술잔' : '예: 혼술 선물세트'} /></div>}

                  {['탁주', '약주', '청주', '증류주', '과실주', '리큐르'].includes(draftCategory) && (

                    <div className={styles.detailFields}>

                      <strong className={styles.detailFieldsTitle}>주류 상세 정보</strong>

                      <div className={styles.formRow}><label>도수</label><input value={draftDetails.alcoholByVolume} onChange={(e) => updateDraftDetail('alcoholByVolume', e.target.value)} /></div>

                      <div className={styles.tasteInputs}>{[['sweetness', '당도'], ['acidity', '산도'], ['carbonation', '탄산'], ['bodyWeight', '묵직함']].map(([key, label]) => <label key={key}>{label} (0~5)<input type="number" min="0" max="5" value={draftDetails[key]} onChange={(e) => updateDraftDetail(key, e.target.value)} /></label>)}</div>

                      <div className={styles.formRow}><label>추천 시간대</label><select value={draftDetails.timeOfDay} onChange={(e) => updateDraftDetail('timeOfDay', e.target.value)}><option value="">선택</option><option value="낮의 결">낮의 결</option><option value="밤의 결">밤의 결</option></select></div>

                      <div className={styles.timeInputs}><label>시작 시간<input type="time" value={draftDetails.recommendedTimeStart} onChange={(e) => updateDraftDetail('recommendedTimeStart', e.target.value)} /></label><label>종료 시간<input type="time" value={draftDetails.recommendedTimeEnd} onChange={(e) => updateDraftDetail('recommendedTimeEnd', e.target.value)} /></label></div>

                      <div className={styles.formFieldBlock}><label>추천 상황</label><textarea rows="2" value={draftDetails.recommendedSituation} onChange={(e) => updateDraftDetail('recommendedSituation', e.target.value)} /></div>

                      <div className={styles.formRow}><label>추천 음용 온도</label><input value={draftDetails.recommendedDrinkingTemperature} onChange={(e) => updateDraftDetail('recommendedDrinkingTemperature', e.target.value)} /></div>

                    </div>

                  )}

                </section>

                <div className={styles.stepFooter}>

                  <button type="button" className={styles.prevBtn} onClick={() => setEditStep(1)}>&lt; 이전</button>

                  <button type="button" className={styles.nextBtn} onClick={() => setEditStep(3)}>다음 &gt;</button>

                </div>

              </div>

            )}

            {editStep === 3 && (

              <div className={styles.formContainer}>

                <section className={styles.formSection}>

                  <div className={styles.formFieldBlock}><label>알레르기 주의사항</label><textarea rows="2" value={draftDetails.allergyCautionInfo} onChange={(e) => updateDraftDetail('allergyCautionInfo', e.target.value)} /></div>

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

                      <button type="button" className={styles.imageEditTile} onClick={() => imageInputRef.current?.click()}>

                        {draftImageUrl ? <img src={resolveProductImage(draftImageUrl)} alt="현재 대표 상품"  loading="lazy" decoding="async" /> : <span className={styles.emptyImage}>대표 이미지</span>}

                        <strong>대표 이미지 변경</strong>

                      </button>

                      <input ref={imageInputRef} className={styles.srOnly} type="file" accept="image/*" onChange={handleImageChange} />

                      {Array.from({ length: 3 }, (_, index) => {

                        const localImages = getLocalDetailImages(getReferenceImageUrl(selectedProduct))

                        const preview = draftDetailImageUrls[index] || localImages[index]

                        return (

                          <button type="button" className={styles.imageEditTile} key={index} onClick={() => detailImageInputRefs.current[index]?.click()}>

                            {preview ? <img src={preview} alt={`현재 서브 이미지 ${index + 1}`}  loading="lazy" decoding="async" /> : <span className={styles.emptyImage}>서브 {index + 1}</span>}

                            <strong>서브 {index + 1} 변경</strong>

                            <input ref={(node) => { detailImageInputRefs.current[index] = node }} className={styles.srOnly} type="file" accept="image/*" onChange={(event) => handleImageChange(event, index)} />

                          </button>

                        )

                      })}

                    </div>

                  </div>

                </section>

                <section className={styles.formSection}>

                  <h4 className={styles.sectionBarTitle}>운영 정보</h4>

                  <div className={styles.metricsGrid}>

                    <div className={styles.metricBox}>

                      <span>조회수</span>

                      <p>

                        <i className={styles.dotGrey} />

                        <strong>{selectedProduct.views.toLocaleString()}회</strong>

                      </p>

                    </div>

                    <div className={styles.metricBox}>

                      <span>찜하기 수</span>

                      <p>

                        <i className={styles.dotGrey} />

                        <strong>{liveMetrics.likes.toLocaleString()}건</strong>

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

                  <button type="button" className={styles.prevBtn} onClick={() => setEditStep(2)}>

                    &lt; 이전

                  </button>

                  <button type="button" className={styles.nextBtn} onClick={() => setEditStep(4)}>다음 &gt;</button>

                </div>

              </div>

            )}

            {editStep === 4 && (

              <div className={styles.formContainer}>

                {renderPairingPicker()}

                <div className={styles.stepFooter}>

                  <button type="button" className={styles.prevBtn} onClick={() => setEditStep(3)}>&lt; 이전</button>

                  <div className={styles.finalActions}>

                    <button type="button" className={styles.deleteBtn} onClick={handleDeleteProduct}>상품 삭제</button>

                    <button type="button" className={styles.saveBtn} onClick={handleSaveEdit}>저장</button>

                  </div>

                </div>

              </div>

            )}

          </aside>

        ) : (

          /* 평상시 통계 패널 */

          <aside
            className={styles.analyticsColumn}
            ref={panelRef}
            aria-label="상품 분석"
          >
            <AdminPanel
              title="상품 가격·재고 분포"
              padding="compact"
            >
              <div className={styles.statusOverview}>
                <div className={styles.statusScatter}>
                  <Scatter
                    data={productStatusChartData}
                    options={productStatusChartOptions}
                  />
                </div>

                <ul>
                  <li>
                    <span className={styles.dotSelling} />
                    <span>
                      판매 중
                    </span>
                    <strong>
                      {regularSellingCount}개
                    </strong>
                  </li>

                  <li>
                    <span className={styles.dotLow} />
                    <span>
                      품절 임박
                    </span>
                    <strong>
                      {lowStockCount}개
                    </strong>
                  </li>

                  <li>
                    <span className={styles.dotHidden} />
                    <span>
                      품절·숨김
                    </span>
                    <strong>
                      {hiddenCount}개
                    </strong>
                  </li>
                </ul>
              </div>
            </AdminPanel>

            <AdminPanel
              title="카테고리별 상품 수"
              padding="compact"
            >
              <div className={styles.activityBars}>
                {categoryCounts.map(
                  ([category, count]) => (
                    <div key={category}>
                      <span>
                        {category}
                      </span>

                      <i>
                        <b
                          style={{
                            width:
                              `${(count / largestCategoryCount) * 100}%`,
                          }}
                        />
                      </i>

                      <strong>
                        {count}개
                      </strong>
                    </div>
                  )
                )}
              </div>

              <p className={styles.analyticsCaption}>
                현재 등록 데이터 집계 기준
              </p>
            </AdminPanel>
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