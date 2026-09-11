import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  Tooltip,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'

import { Link } from 'react-router-dom'

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'

import AdminEmptyState from '../../components/admin/AdminEmptyState'
import AdminFilterBar from '../../components/admin/AdminFilterBar'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminPanel from '../../components/admin/AdminPanel'
import AdminStatusBadge from '../../components/admin/AdminStatusBadge'
import AdminSummaryCard from '../../components/admin/AdminSummaryCard'

import { products as productData } from '../../data/products'
import { subscribeToAuthState } from '../../firebase/auth'
import { db } from '../../firebase/firebase'

import styles from './ReviewManage.module.scss'


ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip
)


// ========================================
// 기본 설정
// ========================================

const PAGE_SIZE = 10

const statusLabels = {
  visible: '게시 중',
  hidden: '숨김',
}


// ========================================
// 상품 이미지
// ========================================

const productImages = import.meta.glob(
  '../../assets/webpImages/images/products/*.webp',
  {
    eager: true,
    import: 'default',
  }
)


const resolveProductImage = (imageUrl = '') => {
  if (
    /^(data:|https?:\/\/)/.test(imageUrl)
  ) {
    return imageUrl
  }

  const fileName =
    imageUrl?.split('/').pop()

  return Object.entries(
    productImages
  ).find(([path]) =>
    (path.endsWith(`/${fileName}`) || path.endsWith((`/${fileName}`).replace(/\.(png|jpe?g)$/i, '.webp')))
  )?.[1]
}


const getProductInfo = (productId) => {
  const product =
    productData.find(
      (item) =>
        item.productId === productId
    )

  return {
    name:
      product?.productName
      || productId
      || '상품 정보 없음',

    image:
      resolveProductImage(
        product?.imageUrl
      ),
  }
}


// ========================================
// 날짜 처리
// ========================================

const getDate = (value) => {
  if (!value) return null

  if (
    typeof value?.toDate
    === 'function'
  ) {
    return value.toDate()
  }

  const date =
    new Date(value)

  return Number.isNaN(
    date.getTime()
  )
    ? null
    : date
}


const getTimeValue = (value) => {
  if (
    typeof value?.toMillis
    === 'function'
  ) {
    return value.toMillis()
  }

  return (
    getDate(value)?.getTime()
    || 0
  )
}


const formatDate = (value) => {
  const date = getDate(value)

  if (!date) return '-'

  return date.toLocaleDateString(
    'ko-CA'
  )
}


const formatDateTimeLabel = (date) => {
  if (!date) return ''

  const year = date.getFullYear()

  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0')

  const day = String(
    date.getDate()
  ).padStart(2, '0')

  const hour = String(
    date.getHours()
  ).padStart(2, '0')

  const minute = String(
    date.getMinutes()
  ).padStart(2, '0')

  return `${year}.${month}.${day} ${hour}:${minute}`
}


const formatReviewId = (
  reviewId = ''
) => {
  if (reviewId.length <= 8) {
    return reviewId
  }

  return `${reviewId.slice(0, 8)}…`
}


// ========================================
// 작성자 마스킹
// ========================================

const maskNickname = (
  nickname = '회원'
) => {
  if (!nickname) return '회원'

  if (nickname.length <= 2) {
    return `${nickname.slice(0, 1)}****`
  }

  return `${nickname.slice(
    0,
    Math.min(5, nickname.length)
  )}****`
}


// ========================================
// 리뷰 첨부 이미지
// ========================================

const getReviewImages = (
  review
) => {
  if (!review) return []

  const candidates = [
    review.imageUrls,
    review.images,
    review.photoUrls,
    review.reviewImages,
  ]

  const result =
    candidates.find(
      (value) =>
        Array.isArray(value)
    )
    || []

  return result
    .map((item) => {
      if (
        typeof item === 'string'
      ) {
        return item
      }

      return (
        item?.url
        || item?.src
        || ''
      )
    })
    .filter(Boolean)
}


// ========================================
// 요약 아이콘
// ========================================

const ReviewSummaryIcon = ({
  type,
}) => {
  const icons = {
    reviews: (
      <>
        <path d="M5 5.5A2.5 2.5 0 0 1 7.5 3h9A2.5 2.5 0 0 1 19 5.5v7a2.5 2.5 0 0 1-2.5 2.5H11l-4 3v-3.2A2.5 2.5 0 0 1 5 12.5z" />
        <path d="M8.5 8h7M8.5 11h4.5" />
      </>
    ),

    rating: (
      <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.9-5.4 2.9 1-6L3.2 9.4l6.1-.9z" />
    ),

    report: (
      <>
        <path d="M7 20V4m0 1h10l-1.8 3L17 11H7" />
        <path d="M11.2 7.2v1.7m0 2.1h.01" />
      </>
    ),

    hidden: (
      <>
        <path d="M3.5 3.5 20.5 20.5" />
        <path d="M10.6 6.1A10.8 10.8 0 0 1 21 12s-3.8 6-9 6a8.8 8.8 0 0 1-2.6-.4" />
        <path d="M6.2 8.2C4.6 9.4 3 12 3 12s3.8 6 9 6c.7 0 1.4-.1 2-.3" />
        <path d="M9.8 9.8a3.1 3.1 0 0 0 4.4 4.4" />
      </>
    ),
  }

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icons[type]}
    </svg>
  )
}


// ========================================
// 별점
// ========================================

const StarRating = ({
  rating,
}) => {
  const safeRating =
    Math.max(
      0,
      Math.min(
        5,
        Math.round(
          Number(rating) || 0
        )
      )
    )

  return (
    <span
      className={styles.stars}
      aria-label={`${safeRating}점`}
    >
      <span>
        {'★'.repeat(safeRating)}
      </span>

      {'★'.repeat(
        5 - safeRating
      )}
    </span>
  )
}


// ========================================
// Component
// ========================================

const ReviewManage = () => {
  const [
    reviews,
    setReviews,
  ] = useState([])

  const [
    isLoading,
    setIsLoading,
  ] = useState(true)

  const [
    loadError,
    setLoadError,
  ] = useState('')

  const [
    isSaving,
    setIsSaving,
  ] = useState(false)

  const [
    lastUpdatedAt,
    setLastUpdatedAt,
  ] = useState(null)

  const [
    searchQuery,
    setSearchQuery,
  ] = useState('')

  const [
    productFilter,
    setProductFilter,
  ] = useState('all')

  const [
    ratingFilter,
    setRatingFilter,
  ] = useState('all')

  const [
    statusFilter,
    setStatusFilter,
  ] = useState('all')

  const [
    sortOrder,
    setSortOrder,
  ] = useState('newest')

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1)

  const [
    selectedId,
    setSelectedId,
  ] = useState(null)

  const [
    confirmReview,
    setConfirmReview,
  ] = useState(null)

  const [
    toastMessage,
    setToastMessage,
  ] = useState('')

  const [
    activeSummaryKey,
    setActiveSummaryKey,
  ] = useState('reviews')

  const detailPanelRef =
    useRef(null)


  // ========================================
  // 리뷰 불러오기
  // ========================================

  const loadReviews =
    useCallback(
      async (
        showRefreshToast = false
      ) => {
        setIsLoading(true)
        setLoadError('')

        try {
          const snapshot =
            await getDocs(
              collection(
                db,
                'reviews'
              )
            )

          const firestoreReviews =
            snapshot.docs.map(
              (item) => ({
                id: item.id,
                ...item.data(),

                rating:
                  Number(
                    item.data()
                      .rating
                    || 0
                  ),

                status:
                  item.data()
                    .status
                  === 'hidden'
                    ? 'hidden'
                    : 'visible',

                reportCount:
                  Number(
                    item.data()
                      .reportCount
                    || 0
                  ),
              })
            )

          const nextReviews =
            firestoreReviews

          setReviews(nextReviews)
          setLastUpdatedAt(
            new Date()
          )

          if (showRefreshToast) {
            setToastMessage(
              '리뷰 목록을 새로고침했습니다.'
            )
          }

          setSelectedId(
            (current) =>
              nextReviews.some(
                (review) =>
                  review.id
                  === current
              )
                ? current
                : null
          )
        } catch (error) {
          console.error(
            '리뷰 목록 조회 실패:',
            error
          )

          setLoadError(
            '리뷰 목록을 불러오지 못했습니다.'
          )
        } finally {
          setIsLoading(false)
        }
      },
      []
    )


  useEffect(() => {
    const unsubscribe =
      subscribeToAuthState(
        (user) => {
          if (user) {
            loadReviews()
          } else {
            setReviews([])
            setSelectedId(null)
            setIsLoading(false)
          }
        }
      )

    return () => {
      if (
        typeof unsubscribe
        === 'function'
      ) {
        unsubscribe()
      }
    }
  }, [loadReviews])


  // ========================================
  // Toast 자동 닫기
  // ========================================

  useEffect(() => {
    if (!toastMessage) {
      return undefined
    }

    const timer =
      window.setTimeout(
        () => {
          setToastMessage('')
        },
        2500
      )

    return () => {
      window.clearTimeout(timer)
    }
  }, [toastMessage])


  // ========================================
  // 상품 필터 목록
  // ========================================

  const productOptions =
    useMemo(() => {
      const ids = [
        ...new Set(
          reviews
            .map(
              (review) =>
                review.productId
            )
            .filter(Boolean)
        ),
      ]

      return ids.map((id) => ({
        id,
        name:
          getProductInfo(id).name,
      }))
    }, [reviews])


  // ========================================
  // 필터링
  // ========================================

  const filteredReviews =
    useMemo(() => {
      const normalizedQuery =
        searchQuery
          .trim()
          .toLowerCase()

      return reviews
        .filter((review) => {
          const product =
            getProductInfo(
              review.productId
            )

          const matchesQuery =
            !normalizedQuery
            || [
              review.id,
              review.productId,
              product.name,
              review.nickname,
              review.content,
            ].some((value) =>
              String(value || '')
                .toLowerCase()
                .includes(
                  normalizedQuery
                )
            )

          const matchesProduct =
            productFilter === 'all'
            || review.productId
              === productFilter

          const matchesRating =
            ratingFilter === 'all'
            || review.rating
              === Number(
                ratingFilter
              )

          const matchesStatus =
            statusFilter === 'all'
            || review.status
              === statusFilter

          const matchesSummary =
            activeSummaryKey
            !== 'report'
            || Number(
              review.reportCount
            ) > 0

          return (
            matchesQuery
            && matchesProduct
            && matchesRating
            && matchesStatus
            && matchesSummary
          )
        })

        .sort((a, b) => {
          if (
            sortOrder
            === 'oldest'
          ) {
            return (
              getTimeValue(
                a.createdAt
              )
              -
              getTimeValue(
                b.createdAt
              )
            )
          }

          if (
            sortOrder
            === 'ratingHigh'
          ) {
            return (
              b.rating
              - a.rating
            )
          }

          if (
            sortOrder
            === 'ratingLow'
          ) {
            return (
              a.rating
              - b.rating
            )
          }

          if (
            sortOrder
            === 'reported'
          ) {
            return (
              b.reportCount
              - a.reportCount
            )
          }

          return (
            getTimeValue(
              b.createdAt
            )
            -
            getTimeValue(
              a.createdAt
            )
          )
        })
    }, [
      reviews,
      searchQuery,
      productFilter,
      ratingFilter,
      statusFilter,
      sortOrder,
      activeSummaryKey,
    ])


  // ========================================
  // 페이지네이션
  // ========================================

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredReviews.length
        / PAGE_SIZE
      )
    )

  const safeCurrentPage =
    Math.min(
      currentPage,
      totalPages
    )

  const visibleReviews =
    filteredReviews.slice(
      (
        safeCurrentPage - 1
      ) * PAGE_SIZE,

      safeCurrentPage
      * PAGE_SIZE
    )


  useEffect(() => {
    setCurrentPage(1)
  }, [
    searchQuery,
    productFilter,
    ratingFilter,
    statusFilter,
    sortOrder,
    activeSummaryKey,
  ])


  useEffect(() => {
    setCurrentPage(
      (page) =>
        Math.min(
          page,
          totalPages
        )
    )
  }, [totalPages])


  // ========================================
  // 선택 리뷰
  // ========================================

  const selectedReview =
    reviews.find(
      (review) =>
        review.id === selectedId
    ) || null


  useEffect(() => {
    if (
      selectedId
      && !filteredReviews.some(
        (review) =>
          review.id === selectedId
      )
    ) {
      setSelectedId(null)
    }
  }, [
    filteredReviews,
    selectedId,
  ])


  // ========================================
  // 요약 통계
  // ========================================

  const hiddenCount =
    reviews.filter(
      (review) =>
        review.status
        === 'hidden'
    ).length

  const visibleCount =
    reviews.length
    - hiddenCount

  const reportedCount =
    reviews.filter(
      (review) =>
        Number(
          review.reportCount
        ) > 0
    ).length

  const averageRating =
    reviews.length > 0
      ? reviews.reduce(
        (sum, review) =>
          sum
          + Number(
            review.rating || 0
          ),
        0
      ) / reviews.length
      : 0


  const summaryCards = [
    {
      key: 'reviews',
      label: '전체 리뷰 수',
      value: reviews.length,
      unit: '건',
      caption:
        `게시 중 ${visibleCount}건`,
      tone: 'primary',
    },
    {
      key: 'rating',
      label: '전체 평점',
      value:
        averageRating.toFixed(1),
      unit: '점',
      caption: '전체 리뷰 평균',
      tone: 'info',
    },
    {
      key: 'report',
      label: '신고된 리뷰',
      value: reportedCount,
      unit: '건',
      caption:
        reportedCount > 0
          ? '확인 필요'
          : '신고 리뷰 없음',
      tone: 'danger',
    },
    {
      key: 'hidden',
      label: '숨김된 리뷰',
      value: hiddenCount,
      unit: '건',
      caption:
        `전체 리뷰의 ${
          reviews.length
            ? Math.round(
              (
                hiddenCount
                / reviews.length
              ) * 100
            )
            : 0
        }%`,
      tone: 'warning',
    },
  ]


  // ========================================
  // 상품별 리뷰 TOP 5
  // ========================================

  const topProducts =
    useMemo(() => {
      const countMap =
        new Map()

      reviews.forEach(
        (review) => {
          const id =
            review.productId

          if (!id) return

          countMap.set(
            id,
            (
              countMap.get(id)
              || 0
            ) + 1
          )
        }
      )

      return [
        ...countMap.entries(),
      ]
        .map(
          (
            [
              productId,
              count,
            ]
          ) => ({
            productId,
            count,
            name:
              getProductInfo(
                productId
              ).name,
          })
        )
        .sort(
          (a, b) =>
            b.count
            - a.count
        )
        .slice(0, 5)
    }, [reviews])


  const maxProductCount =
    Math.max(
      ...topProducts.map(
        (item) =>
          item.count
      ),
      1
    )


  // ========================================
  // 별점 분포
  // ========================================

  const ratingDistribution =
    [5, 4, 3, 2, 1].map(
      (rating) => {
        const count =
          reviews.filter(
            (review) =>
              Number(
                review.rating
              ) === rating
          ).length

        const percentage =
          reviews.length
            ? Math.round(
              (
                count
                / reviews.length
              ) * 100
            )
            : 0

        return {
          rating,
          count,
          percentage,
        }
      }
    )


  // ========================================
  // 상품별 리뷰 TOP 5 - Horizontal Bar
  // ========================================

  const topProductChartData =
    useMemo(
      () => ({
        labels:
          topProducts.map(
            (_, index) =>
              String(index + 1)
          ),

        datasets: [
          {
            label: '리뷰 수',

            data:
              topProducts.map(
                (item) =>
                  item.count
              ),

            backgroundColor:
              'rgba(86, 138, 128, 0.86)',

            borderColor:
              '#568a80',

            borderWidth: 1,

            borderRadius: 999,

            barThickness: 9,
          },
        ],
      }),
      [topProducts]
    )


  const topProductLabelPlugin =
    useMemo(
      () => ({
        id: 'reviewTopProductLabels',

        afterDatasetsDraw: (chart) => {
          const {
            ctx,
            chartArea,
          } = chart

          const meta =
            chart.getDatasetMeta(0)

          if (
            !chartArea
            || !meta?.data
          ) {
            return
          }

          ctx.save()

          meta.data.forEach(
            (bar, index) => {
              const product =
                topProducts[index]

              if (!product) {
                return
              }

              const y = bar.y

              const badgeSize = 22
              const badgeX =
                chartArea.left - 132
              const badgeY =
                y - badgeSize / 2

              ctx.beginPath()
              ctx.roundRect(
                badgeX,
                badgeY,
                badgeSize,
                badgeSize,
                4
              )

              ctx.fillStyle =
                '#568a80'
              ctx.fill()

              ctx.fillStyle =
                '#ffffff'

              ctx.font =
                '700 12px sans-serif'

              ctx.textAlign =
                'center'

              ctx.textBaseline =
                'middle'

              ctx.fillText(
                String(index + 1),
                badgeX
                  + badgeSize / 2,
                y
              )

              ctx.fillStyle =
                '#303533'

              ctx.font =
                '600 12px sans-serif'

              ctx.textAlign =
                'left'

              const productName =
                product.name.length > 10
                  ? `${product.name.slice(0, 10)}…`
                  : product.name

              ctx.fillText(
                productName,
                badgeX
                  + badgeSize
                  + 8,
                y
              )

              ctx.fillStyle =
                '#505754'

              ctx.font =
                '700 12px sans-serif'

              ctx.textAlign =
                'left'

              ctx.fillText(
                `${product.count}건`,
                chartArea.right + 6,
                y
              )
            }
          )

          ctx.restore()
        },
      }),
      [topProducts]
    )


  const topProductChartOptions =
    useMemo(
      () => ({
        responsive: true,
        maintainAspectRatio: false,

        indexAxis: 'y',

        layout: {
          padding: {
            left: 132,
            right: 40,
            top: 4,
            bottom: 4,
          },
        },

        animation: {
          duration: 900,
          easing: 'easeOutQuart',
        },

        plugins: {
          legend: {
            display: false,
          },

          tooltip: {
            enabled: true,

            displayColors: false,

            padding: 10,

            callbacks: {
              title: (items) => {
                const index =
                  items[0]?.dataIndex

                return (
                  topProducts[index]
                    ?.name
                  || ''
                )
              },

              label: (context) =>
                `리뷰 ${context.raw}건`,
            },
          },
        },

        scales: {
          x: {
            beginAtZero: true,

            suggestedMax:
              Math.max(
                maxProductCount,
                1
              ),

            display: false,

            grid: {
              display: false,
            },

            border: {
              display: false,
            },
          },

          y: {
            display: false,

            grid: {
              display: false,
            },

            border: {
              display: false,
            },
          },
        },
      }),
      [
        maxProductCount,
        topProducts,
      ]
    )


  // ========================================
  // 전체 리뷰 별점 분포 - Vertical Bar
  // ========================================

  const ratingChartItems =
    useMemo(
      () =>
        [...ratingDistribution]
          .reverse(),
      [reviews]
    )


  const ratingChartData =
    useMemo(
      () => ({
        labels:
          ratingChartItems.map(
            (item) =>
              `${item.rating}★`
          ),

        datasets: [
          {
            label: '리뷰 수',

            data:
              ratingChartItems.map(
                (item) =>
                  item.count
              ),

            backgroundColor:
              'rgba(86, 138, 128, 0.84)',

            borderColor:
              '#568a80',

            borderWidth: 1,

            borderRadius: 5,

            maxBarThickness: 28,
          },
        ],
      }),
      [ratingChartItems]
    )


  const ratingChartOptions =
    useMemo(
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
            enabled: true,

            displayColors: false,

            padding: 10,

            callbacks: {
              label: (context) => {
                const item =
                  ratingChartItems[
                    context.dataIndex
                  ]

                return [
                  `리뷰 ${item?.count || 0}건`,
                  `전체의 ${item?.percentage || 0}%`,
                ]
              },
            },
          },
        },

        scales: {
          x: {
            grid: {
              display: false,
            },

            border: {
              display: false,
            },

            ticks: {
              color: '#747b78',

              font: {
                size: 10,
                weight: '600',
              },
            },
          },

          y: {
            beginAtZero: true,

            suggestedMax:
              Math.max(
                ...ratingChartItems.map(
                  (item) =>
                    item.count
                ),
                1
              ),

            border: {
              display: false,
            },

            grid: {
              color:
                'rgba(223, 226, 224, 0.72)',
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
      [ratingChartItems]
    )


  // ========================================
  // 필터 초기화
  // ========================================

  const resetFilters = () => {
    setSearchQuery('')
    setProductFilter('all')
    setRatingFilter('all')
    setStatusFilter('all')
    setSortOrder('newest')
    setActiveSummaryKey('reviews')
    setSelectedId(null)
    setCurrentPage(1)
  }


  // ========================================
  // 요약 카드 필터
  // ========================================

  const handleSummaryFilter = (key) => {
    setSearchQuery('')
    setProductFilter('all')
    setRatingFilter('all')
    setStatusFilter('all')
    setSortOrder('newest')
    setSelectedId(null)
    setCurrentPage(1)
    setActiveSummaryKey(key)

    if (key === 'rating') {
      setSortOrder('ratingHigh')
    }

    if (key === 'report') {
      setSortOrder('reported')
    }

    if (key === 'hidden') {
      setStatusFilter('hidden')
    }
  }


  // ========================================
  // 리뷰 상세 열기
  // ========================================

  const openReviewDetail = (reviewId) => {
    setSelectedId(reviewId)

    if (
      typeof window !== 'undefined'
      && window.matchMedia(
        '(max-width: 767px)'
      ).matches
    ) {
      window.setTimeout(() => {
        detailPanelRef.current
          ?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          })
      }, 100)
    }
  }


  // ========================================
  // 리뷰 숨김 / 노출
  // ========================================

  const toggleVisibility =
    async (review) => {
      const nextStatus =
        review.status
        === 'visible'
          ? 'hidden'
          : 'visible'

      setIsSaving(true)

      try {
        await updateDoc(
          doc(
            db,
            'reviews',
            review.id
          ),
          {
            status:
              nextStatus,

            updatedAt:
              serverTimestamp(),
          }
        )

        setReviews(
          (current) =>
            current.map(
              (item) =>
                item.id
                === review.id
                  ? {
                    ...item,
                    status:
                      nextStatus,
                  }
                  : item
            )
        )

        setToastMessage(
          nextStatus
          === 'visible'
            ? '리뷰를 다시 게시했습니다.'
            : '리뷰를 숨김 처리했습니다.'
        )
      } catch (error) {
        console.error(
          '리뷰 상태 변경 실패:',
          error
        )

        setToastMessage(
          '리뷰 상태 변경에 실패했습니다.'
        )
      } finally {
        setIsSaving(false)
      }
    }


  // ========================================
  // 리뷰 삭제
  // ========================================

  const deleteReview =
    async () => {
      if (!confirmReview) {
        return
      }

      setIsSaving(true)

      try {
        await deleteDoc(
          doc(
            db,
            'reviews',
            confirmReview.id
          )
        )

        const nextReviews =
          reviews.filter(
            (review) =>
              review.id
              !== confirmReview.id
          )

        setReviews(nextReviews)

        if (
          selectedId
          === confirmReview.id
        ) {
          setSelectedId(null)
        }

        setConfirmReview(null)

        setToastMessage(
          '리뷰가 삭제되었습니다.'
        )
      } catch (error) {
        console.error(
          '리뷰 삭제 실패:',
          error
        )

        setToastMessage(
          '리뷰 삭제에 실패했습니다.'
        )
      } finally {
        setIsSaving(false)
      }
    }


  // ========================================
  // 페이지 번호
  // ========================================

  const pageStart =
    Math.max(
      1,
      Math.min(
        safeCurrentPage - 2,
        totalPages - 4
      )
    )

  const pageNumbers =
    Array.from(
      {
        length:
          Math.min(
            5,
            totalPages
          ),
      },
      (_, index) =>
        pageStart + index
    )


  // ========================================
  // 선택 리뷰 상세 정보
  // ========================================

  const selectedProduct =
    selectedReview
      ? getProductInfo(
        selectedReview.productId
      )
      : null

  const selectedImages =
    getReviewImages(
      selectedReview
    )


  // ========================================
  // Render
  // ========================================

  return (
    <section
      className={styles.page}
      aria-labelledby="review-manage-title"
    >
      {/* ========================================
          제목
      ======================================== */}

      <AdminPageHeader
        title="리뷰 관리"
        titleId="review-manage-title"
        onRefresh={() =>
          loadReviews(true)
        }
        isRefreshing={isLoading}
      />


      {/* ========================================
          리뷰 현황
      ======================================== */}

      <section
        className={styles.summaryArea}
        aria-label="리뷰 현황 요약"
      >
        <div className={styles.summaryGrid}>
          {summaryCards.map(
            (card) => (
              <AdminSummaryCard
                key={card.key}
                icon={
                  <ReviewSummaryIcon
                    type={card.key}
                  />
                }
                label={card.label}
                value={String(card.value)}
                unit={card.unit}
                caption={card.caption}
                tone={card.tone}
                active={
                  activeSummaryKey
                  === card.key
                }
                onClick={() =>
                  handleSummaryFilter(
                    card.key
                  )
                }
              />
            )
          )}
        </div>
      </section>


      {/* ========================================
          리뷰 관리 본문
      ======================================== */}

      <div className={styles.managementGrid}>
        {/* 리뷰 목록 */}

        <section
          className={styles.mainSection}
          aria-labelledby="review-list-title"
        >
          {/* 검색 / 필터 */}

          <AdminFilterBar
            searchValue={searchQuery}
            onSearchChange={(value) => {
              setSearchQuery(value)
              setActiveSummaryKey(null)
              setCurrentPage(1)
            }}
            searchPlaceholder="상품명, 리뷰 내용, 작성자 검색"
            searchLabel="리뷰 검색"
            onReset={resetFilters}
          >
            <label className={styles.selectField}>
              <span className={styles.srOnly}>
                상품
              </span>

              <select
                value={productFilter}
                onChange={(event) => {
                  setProductFilter(
                    event.target.value
                  )
                  setActiveSummaryKey(null)
                }}
              >
                <option value="all">
                  전체 상품
                </option>

                {productOptions.map(
                  (product) => (
                    <option
                      key={product.id}
                      value={product.id}
                    >
                      {product.name}
                    </option>
                  )
                )}
              </select>
            </label>


            <label className={styles.selectField}>
              <span className={styles.srOnly}>
                상태
              </span>

              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(
                    event.target.value
                  )
                  setActiveSummaryKey(null)
                }}
              >
                <option value="all">
                  전체 상태
                </option>

                <option value="visible">
                  게시 중
                </option>

                <option value="hidden">
                  숨김
                </option>
              </select>
            </label>


            <label className={styles.selectField}>
              <span className={styles.srOnly}>
                정렬
              </span>

              <select
                value={sortOrder}
                onChange={(event) => {
                  setSortOrder(
                    event.target.value
                  )
                  setActiveSummaryKey(null)
                }}
              >
                <option value="newest">
                  최근 작성순
                </option>

                <option value="oldest">
                  오래된 작성순
                </option>

                <option value="ratingHigh">
                  평점 높은순
                </option>

                <option value="ratingLow">
                  평점 낮은순
                </option>

                <option value="reported">
                  신고 많은순
                </option>
              </select>
            </label>
          </AdminFilterBar>


          {/* 평점 필터 */}

          <div className={styles.ratingFilterRow}>
            <span>
              평점
            </span>

            <div>
              <button
                type="button"
                className={
                  ratingFilter
                  === 'all'
                    ? styles.activeRating
                    : ''
                }
                onClick={() => {
                  setRatingFilter('all')
                  setActiveSummaryKey(null)
                }}
              >
                전체
              </button>

              {[5, 4, 3, 2, 1].map(
                (rating) => (
                  <button
                    key={rating}
                    type="button"
                    className={
                      ratingFilter
                      === String(rating)
                        ? styles.activeRating
                        : ''
                    }
                    onClick={() => {
                      setRatingFilter(
                        (current) =>
                          current
                          === String(rating)
                            ? 'all'
                            : String(rating)
                      )
                      setActiveSummaryKey(null)
                    }}
                  >
                    {rating}점
                  </button>
                )
              )}
            </div>
          </div>


          {/* 리뷰 목록 제목 */}

          <div className={styles.sectionHeading}>
            <div>
              <h2 id="review-list-title">
                리뷰 목록
              </h2>
            </div>

            <span className={styles.reviewCount}>
              총{' '}
              <strong>
                {filteredReviews.length.toLocaleString(
                  'ko-KR'
                )}
              </strong>
              건
            </span>
          </div>


          {/* 리뷰 목록 */}

          {isLoading ? (
            <AdminEmptyState
              title="리뷰 목록을 불러오는 중입니다."
              description="잠시만 기다려주세요."
            />
          ) : loadError ? (
            <AdminEmptyState
              title="리뷰 목록을 불러오지 못했습니다."
              description={loadError}
              action={
                <button
                  type="button"
                  onClick={() =>
                    loadReviews()
                  }
                >
                  다시 불러오기
                </button>
              }
            />
          ) : filteredReviews.length === 0 ? (
            <AdminEmptyState
              title="검색 결과가 없습니다."
              description="검색어나 필터 조건을 다시 확인해주세요."
            />
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.reviewTable}>
                <thead>
                  <tr>
                    <th scope="col">
                      리뷰 ID
                    </th>

                    <th scope="col">
                      상품
                    </th>

                    <th scope="col">
                      작성자
                    </th>

                    <th scope="col">
                      평점
                    </th>

                    <th scope="col">
                      리뷰 내용
                    </th>

                    <th scope="col">
                      작성일
                    </th>

                    <th scope="col">
                      상태
                    </th>

                    <th scope="col">
                      관리
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {visibleReviews.map(
                    (review) => {
                      const product =
                        getProductInfo(
                          review.productId
                        )

                      return (
                        <tr
                          key={review.id}
                          className={
                            selectedId
                            === review.id
                              ? styles.selectedRow
                              : ''
                          }
                          onClick={() =>
                            openReviewDetail(
                              review.id
                            )
                          }
                        >
                          <td>
                            <span
                              className={styles.reviewId}
                              title={review.id}
                            >
                              {formatReviewId(
                                review.id
                              )}
                            </span>
                          </td>

                          <td>
                            <div className={styles.productTableCell}>
                              <span className={styles.tableThumb}>
                                {product.image && (
                                  <img
                                    src={product.image}
                                    alt=""
                                  />
                                )}
                              </span>

                              <span
                                title={product.name}
                              >
                                {product.name}
                              </span>
                            </div>
                          </td>

                          <td>
                            <span className={styles.authorName}>
                              {maskNickname(
                                review.nickname
                              )}
                            </span>
                          </td>

                          <td>
                            <StarRating
                              rating={
                                review.rating
                              }
                            />
                          </td>

                          <td>
                            <span
                              className={styles.reviewSummary}
                              title={
                                review.content
                              }
                            >
                              {review.content}
                            </span>
                          </td>

                          <td>
                            {formatDate(
                              review.createdAt
                            )}
                          </td>

                          <td>
                            <AdminStatusBadge
                              tone={
                                review.status
                                === 'visible'
                                  ? 'success'
                                  : 'neutral'
                              }
                            >
                              {
                                statusLabels[
                                  review.status
                                ]
                              }
                            </AdminStatusBadge>
                          </td>

                          <td>
                            <button
                              type="button"
                              className={styles.viewButton}
                              onClick={(event) => {
                                event.stopPropagation()

                                openReviewDetail(
                                  review.id
                                )
                              }}
                            >
                              상세 보기
                            </button>
                          </td>
                        </tr>
                      )
                    }
                  )}
                </tbody>
              </table>


              {totalPages > 1 && (
                <nav
                  className={styles.pagination}
                  aria-label="리뷰 목록 페이지"
                >
                  <button
                    type="button"
                    aria-label="이전 페이지"
                    disabled={
                      safeCurrentPage
                      === 1
                    }
                    onClick={() =>
                      setCurrentPage(
                        Math.max(
                          1,
                          safeCurrentPage - 1
                        )
                      )
                    }
                  >
                    ‹
                  </button>


                  {pageNumbers.map(
                    (page) => (
                      <button
                        key={page}
                        type="button"
                        className={
                          page
                          === safeCurrentPage
                            ? styles.activePage
                            : ''
                        }
                        aria-current={
                          page
                          === safeCurrentPage
                            ? 'page'
                            : undefined
                        }
                        onClick={() =>
                          setCurrentPage(
                            page
                          )
                        }
                      >
                        {page}
                      </button>
                    )
                  )}


                  <button
                    type="button"
                    aria-label="다음 페이지"
                    disabled={
                      safeCurrentPage
                      === totalPages
                    }
                    onClick={() =>
                      setCurrentPage(
                        Math.min(
                          totalPages,
                          safeCurrentPage + 1
                        )
                      )
                    }
                  >
                    ›
                  </button>
                </nav>
              )}
            </div>
          )}
        </section>


        {/* ========================================
            우측 영역
        ======================================== */}

        {selectedReview ? (
          // 리뷰 상세

          <aside
            ref={detailPanelRef}
            className={styles.detailPanel}
            aria-labelledby="review-detail-title"
          >
            <header className={styles.detailHeader}>
              <div>
                <h2 id="review-detail-title">
                  리뷰 상세
                </h2>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedId(null)
                }
                aria-label="리뷰 상세 닫기"
              >
                ×
              </button>
            </header>


            <div className={styles.detailProduct}>
              <span className={styles.detailThumb}>
                {selectedProduct?.image && (
                  <img
                    src={
                      selectedProduct.image
                    }
                    alt=""
                  />
                )}
              </span>

              <div>
                <strong>
                  {selectedProduct?.name}
                </strong>

                <Link
                  to={`/shop/${selectedReview.productId}`}
                >
                  상품 상세보기 →
                </Link>
              </div>
            </div>


            <section className={styles.detailBlock}>
              <h3>
                기본 정보
              </h3>

              <dl>
                <div>
                  <dt>
                    리뷰 ID
                  </dt>

                  <dd
                    title={
                      selectedReview.id
                    }
                  >
                    {selectedReview.id}
                  </dd>
                </div>

                <div>
                  <dt>
                    작성자
                  </dt>

                  <dd>
                    {maskNickname(
                      selectedReview.nickname
                    )}
                  </dd>
                </div>

                <div>
                  <dt>
                    작성일
                  </dt>

                  <dd>
                    {formatDate(
                      selectedReview.createdAt
                    )}
                  </dd>
                </div>

                <div>
                  <dt>
                    평점
                  </dt>

                  <dd className={styles.detailRating}>
                    <StarRating
                      rating={
                        selectedReview.rating
                      }
                    />

                    <span>
                      {
                        Number(
                          selectedReview.rating
                        ).toFixed(1)
                      }
                    </span>
                  </dd>
                </div>

                <div>
                  <dt>
                    상태
                  </dt>

                  <dd>
                    <AdminStatusBadge
                      tone={
                        selectedReview.status
                        === 'visible'
                          ? 'success'
                          : 'neutral'
                      }
                      size="small"
                    >
                      {
                        statusLabels[
                          selectedReview.status
                        ]
                      }
                    </AdminStatusBadge>
                  </dd>
                </div>
              </dl>
            </section>


            <section className={styles.detailBlock}>
              <h3>
                리뷰 내용
              </h3>

              <div className={styles.reviewContentBox}>
                {selectedReview.content}
              </div>
            </section>


            <section className={styles.detailBlock}>
              <h3>
                첨부 이미지
                <span className={styles.attachmentCount}>
                  {' '}
                  ({selectedImages.length})
                </span>
              </h3>

              {selectedImages.length > 0 ? (
                <div className={styles.attachmentList}>
                  {selectedImages.map(
                    (
                      image,
                      index
                    ) => (
                      <button
                        type="button"
                        key={`${image}-${index}`}
                        onClick={() =>
                          window.open(
                            image,
                            '_blank',
                            'noopener,noreferrer'
                          )
                        }
                      >
                        <img
                          src={image}
                          alt={`리뷰 첨부 이미지 ${
                            index + 1
                          }`}
                        />
                      </button>
                    )
                  )}
                </div>
              ) : (
                <p className={styles.noAttachment}>
                  첨부 이미지 없음
                </p>
              )}
            </section>


            <footer className={styles.detailFooter}>
              <button
                type="button"
                className={styles.hideButton}
                disabled={isSaving}
                onClick={() =>
                  toggleVisibility(
                    selectedReview
                  )
                }
              >
                {selectedReview.status
                === 'visible'
                  ? '숨김 처리'
                  : '다시 게시'}
              </button>

              <button
                type="button"
                className={styles.deleteButton}
                disabled={isSaving}
                onClick={() =>
                  setConfirmReview(
                    selectedReview
                  )
                }
              >
                삭제하기
              </button>
            </footer>
          </aside>
        ) : (
          // 리뷰 분석

          <aside
            className={styles.analyticsColumn}
            aria-label="리뷰 분석"
          >
            <AdminPanel
              title="상품별 리뷰 TOP 5"
              padding="compact"
            >
              {topProducts.length > 0 ? (
                <div className={styles.topProductChart}>
                  <Bar
                    data={topProductChartData}
                    options={topProductChartOptions}
                    plugins={[
                      topProductLabelPlugin,
                    ]}
                  />
                </div>
              ) : (
                <p className={styles.analyticsEmpty}>
                  리뷰 데이터가 없습니다.
                </p>
              )}
            </AdminPanel>


            <AdminPanel
              title="전체 리뷰 별점 분포"
              padding="compact"
            >
              <div className={styles.ratingChart}>
                <Bar
                  data={ratingChartData}
                  options={ratingChartOptions}
                />
              </div>

              <p className={styles.analyticsCaption}>
                평균 별점{' '}
                <strong>
                  {averageRating.toFixed(2)}점
                </strong>

                {lastUpdatedAt && (
                  <>
                    {' · '}
                    {formatDateTimeLabel(
                      lastUpdatedAt
                    )}
                  </>
                )}
              </p>
            </AdminPanel>
          </aside>
        )}
      </div>


      {/* ========================================
          삭제 확인 모달
      ======================================== */}

      {confirmReview && (
        <div
          className={styles.modalBackdrop}
          onMouseDown={() =>
            setConfirmReview(null)
          }
        >
          <section
            className={styles.confirmModal}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="review-delete-title"
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            <span className={styles.warningIcon}>
              !
            </span>

            <h3 id="review-delete-title">
              리뷰를 삭제할까요?
            </h3>

            <p>
              삭제한 리뷰는 되돌릴 수 없습니다.
            </p>

            <strong>
              {
                selectedProduct?.name
                || confirmReview.productId
              }
            </strong>

            <div>
              <button
                type="button"
                onClick={() =>
                  setConfirmReview(null)
                }
                disabled={isSaving}
              >
                취소
              </button>

              <button
                type="button"
                onClick={deleteReview}
                disabled={isSaving}
              >
                {isSaving
                  ? '삭제 중...'
                  : '삭제'}
              </button>
            </div>
          </section>
        </div>
      )}


      {/* ========================================
          Toast
      ======================================== */}

      {toastMessage && (
        <div
          className={styles.toast}
          role="status"
        >
          <span>
            {toastMessage}
          </span>

          <button
            type="button"
            onClick={() =>
              setToastMessage('')
            }
            aria-label="알림 닫기"
          >
            ×
          </button>
        </div>
      )}
    </section>
  )
}


export default ReviewManage
