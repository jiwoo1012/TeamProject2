import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import { Link } from 'react-router-dom'

import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'

import adminTopOrnament from '../../assets/images/admin/adminTopOrnament.svg'

import { products as productData } from '../../data/products'

import { subscribeToAuthState } from '../../firebase/auth'
import { db } from '../../firebase/firebase'

import styles from './ReviewManage.module.scss'


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
  '../../assets/images/products/*.{png,jpg,jpeg,webp}',
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
    path.endsWith(`/${fileName}`)
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
      product?.productName ||
      productId ||
      '상품 정보 없음',

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
    typeof value?.toDate ===
    'function'
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
    typeof value?.toMillis ===
    'function'
  ) {
    return value.toMillis()
  }

  return (
    getDate(value)?.getTime() || 0
  )
}


const formatDate = (value) => {
  const date = getDate(value)

  if (!date) return '-'

  return date.toLocaleDateString(
    'ko-CA'
  )
}


const formatReviewId = (reviewId = '') => {
  if (reviewId.length <= 3) return reviewId

  return `${reviewId.slice(0, 3)}…`
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
    ) || []

  return result
    .map((item) => {
      if (
        typeof item === 'string'
      ) {
        return item
      }

      return (
        item?.url ||
        item?.src ||
        ''
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
        Number(rating) || 0
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
// 리뷰 관리
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


  // ========================================
  // 리뷰 불러오기
  // ========================================

  const loadReviews =
    useCallback(async () => {
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
                    .rating || 0
                ),

              status:
                item.data()
                  .status ===
                'hidden'
                  ? 'hidden'
                  : 'visible',

              reportCount:
                Number(
                  item.data()
                    .reportCount ||
                    0
                ),
            })
          )

        const nextReviews = firestoreReviews

        setReviews(nextReviews)

        setSelectedId(
          (current) =>
            nextReviews.some(
              (review) =>
                review.id ===
                current
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
    }, [])


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

    return unsubscribe
  }, [loadReviews])


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
            !normalizedQuery ||
            [
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
            productFilter ===
              'all' ||
            review.productId ===
              productFilter

          const matchesRating =
            ratingFilter ===
              'all' ||
            review.rating ===
              Number(
                ratingFilter
              )

          const matchesStatus =
            statusFilter ===
              'all' ||
            review.status ===
              statusFilter

          return (
            matchesQuery &&
            matchesProduct &&
            matchesRating &&
            matchesStatus
          )
        })
        .sort((a, b) => {
          if (
            sortOrder ===
            'oldest'
          ) {
            return (
              getTimeValue(
                a.createdAt
              ) -
              getTimeValue(
                b.createdAt
              )
            )
          }

          if (
            sortOrder ===
            'ratingHigh'
          ) {
            return (
              b.rating -
              a.rating
            )
          }

          if (
            sortOrder ===
            'ratingLow'
          ) {
            return (
              a.rating -
              b.rating
            )
          }

          if (
            sortOrder ===
            'reported'
          ) {
            return (
              b.reportCount -
              a.reportCount
            )
          }

          return (
            getTimeValue(
              b.createdAt
            ) -
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
    ])


  // ========================================
  // 페이지네이션
  // ========================================

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredReviews.length /
          PAGE_SIZE
      )
    )

  const safeCurrentPage =
    Math.min(
      currentPage,
      totalPages
    )

  const visibleReviews =
    filteredReviews.slice(
      (safeCurrentPage - 1) *
        PAGE_SIZE,
      safeCurrentPage *
        PAGE_SIZE
    )


  useEffect(() => {
    setCurrentPage(1)
  }, [
    searchQuery,
    productFilter,
    ratingFilter,
    statusFilter,
    sortOrder,
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
        review.id ===
        selectedId
    ) || null


  useEffect(() => {
    if (
      selectedId &&
      !filteredReviews.some(
        (review) =>
          review.id ===
          selectedId
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
        review.status ===
        'hidden'
    ).length

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
            sum +
            Number(
              review.rating || 0
            ),
          0
        ) / reviews.length
      : 0


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
            (countMap.get(id) ||
              0) + 1
          )
        }
      )

      return [
        ...countMap.entries(),
      ]
        .map(
          ([productId, count]) => ({
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
            b.count -
            a.count
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
                (count /
                  reviews.length) *
                  100
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
  // 필터 초기화
  // ========================================

  const resetFilters = () => {
    setSearchQuery('')
    setProductFilter('all')
    setRatingFilter('all')
    setStatusFilter('all')
    setSortOrder('newest')
    setCurrentPage(1)
  }


  // ========================================
  // 리뷰 숨김 / 노출
  // ========================================

  const toggleVisibility =
    async (review) => {
      const nextStatus =
        review.status ===
        'visible'
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
                item.id ===
                review.id
                  ? {
                      ...item,
                      status:
                        nextStatus,
                    }
                  : item
            )
        )

        setToastMessage(
          nextStatus ===
            'visible'
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
              review.id !==
              confirmReview.id
          )

        setReviews(nextReviews)

        if (
          selectedId ===
          confirmReview.id
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


  return (
    <section
      className={styles.page}
      aria-labelledby="review-manage-title"
    >

      {/* ========================================
          상단 제목
      ======================================== */}

      <header
        className={
          styles.pageToolbar
        }
      >
        <h1
          id="review-manage-title"
        >
          리뷰 관리
        </h1>

        <button
          type="button"
          className={
            styles.refreshButton
          }
          onClick={loadReviews}
          disabled={isLoading}
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M20 11a8 8 0 1 0 2 5.3" />
            <path d="M20 4v7h-7" />
          </svg>

          새로 고침
        </button>
      </header>


      {/* ========================================
          전통 문양
      ======================================== */}

      <img
        className={
          styles.topOrnament
        }
        src={adminTopOrnament}
        alt=""
        aria-hidden="true"
      />


      {/* ========================================
          요약 카드
      ======================================== */}

      <section
        className={
          styles.summaryArea
        }
        aria-label="리뷰 현황 요약"
      >
        <div
          className={
            styles.summaryGrid
          }
        >

          <article
            className={
              styles.summaryCard
            }
          >
            <span
              className={`${styles.summaryIcon} ${styles.summaryIconTotal}`}
            >
              <ReviewSummaryIcon
                type="reviews"
              />
            </span>

            <div
              className={
                styles.summaryContent
              }
            >
              <small>
                전체 리뷰 수
              </small>

              <strong>
                {reviews.length.toLocaleString(
                  'ko-KR'
                )}

                <em>건</em>
              </strong>
            </div>
          </article>


          <article
            className={
              styles.summaryCard
            }
          >
            <span
              className={`${styles.summaryIcon} ${styles.summaryIconRating}`}
            >
              <ReviewSummaryIcon
                type="rating"
              />
            </span>

            <div
              className={
                styles.summaryContent
              }
            >
              <small>
                전체 평점
              </small>

              <strong>
                {averageRating.toFixed(
                  1
                )}

                <em>점</em>
              </strong>

              <i>
                전체 리뷰 평균
              </i>
            </div>
          </article>


          <article
            className={
              styles.summaryCard
            }
          >
            <span
              className={`${styles.summaryIcon} ${styles.summaryIconReport}`}
            >
              <ReviewSummaryIcon
                type="report"
              />
            </span>

            <div
              className={
                styles.summaryContent
              }
            >
              <small>
                신고된 리뷰
              </small>

              <strong>
                {reportedCount}

                <em>건</em>
              </strong>

              <i
                className={
                  styles.reportCaption
                }
              >
                ▲ 확인 필요
              </i>
            </div>
          </article>


          <article
            className={
              styles.summaryCard
            }
          >
            <span
              className={`${styles.summaryIcon} ${styles.summaryIconHidden}`}
            >
              <ReviewSummaryIcon
                type="hidden"
              />
            </span>

            <div
              className={
                styles.summaryContent
              }
            >
              <small>
                숨김된 리뷰
              </small>

              <strong>
                {hiddenCount}

                <em>건</em>
              </strong>
            </div>
          </article>

        </div>
      </section>


      {/* ========================================
          메인 2단
      ======================================== */}

      <div
        className={
          styles.managementGrid
        }
      >

        {/* ========================================
            왼쪽 리뷰 목록
        ======================================== */}

        <section
          className={
            styles.mainSection
          }
        >

          {/* 검색 / 필터 */}

          <div
            className={
              styles.filterBar
            }
          >
            <label
              className={
                styles.searchField
              }
            >
              <span
                className={
                  styles.srOnly
                }
              >
                리뷰 검색
              </span>

              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="7"
                />

                <path d="m16 16 4 4" />
              </svg>

              <input
                type="search"
                value={searchQuery}
                onChange={(
                  event
                ) =>
                  setSearchQuery(
                    event.target
                      .value
                  )
                }
                placeholder="상품명, 리뷰 내용, 작성자 검색"
              />
            </label>


            <label
              className={
                styles.selectField
              }
            >
              <span
                className={
                  styles.srOnly
                }
              >
                상품
              </span>

              <select
                value={
                  productFilter
                }
                onChange={(
                  event
                ) =>
                  setProductFilter(
                    event.target
                      .value
                  )
                }
              >
                <option value="all">
                  상품
                </option>

                {productOptions.map(
                  (product) => (
                    <option
                      key={
                        product.id
                      }
                      value={
                        product.id
                      }
                    >
                      {
                        product.name
                      }
                    </option>
                  )
                )}
              </select>
            </label>


            <label
              className={
                styles.selectField
              }
            >
              <span
                className={
                  styles.srOnly
                }
              >
                상태
              </span>

              <select
                value={
                  statusFilter
                }
                onChange={(
                  event
                ) =>
                  setStatusFilter(
                    event.target
                      .value
                  )
                }
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


            <label
              className={`${styles.selectField} ${styles.sortField}`}
            >
              <span
                className={
                  styles.srOnly
                }
              >
                정렬
              </span>

              <select
                value={
                  sortOrder
                }
                onChange={(
                  event
                ) =>
                  setSortOrder(
                    event.target
                      .value
                  )
                }
              >
                <option value="newest">
                  정렬
                </option>

                <option value="oldest">
                  오래된순
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


            <button
              type="button"
              className={
                styles.resetButton
              }
              onClick={
                resetFilters
              }
            >
              초기화
            </button>
          </div>


          {/* 평점 필터 */}

          <div
            className={
              styles.ratingFilterRow
            }
          >
            <span>
              평점 필터
            </span>

            <div>
              {[5, 4, 3, 2, 1].map(
                (rating) => (
                  <button
                    key={
                      rating
                    }
                    type="button"
                    className={
                      ratingFilter ===
                      String(
                        rating
                      )
                        ? styles.activeRating
                        : ''
                    }
                    onClick={() =>
                      setRatingFilter(
                        (
                          current
                        ) =>
                          current ===
                          String(
                            rating
                          )
                            ? 'all'
                            : String(
                                rating
                              )
                      )
                    }
                  >
                    {rating}점
                  </button>
                )
              )}
            </div>
          </div>


          {/* 리뷰 목록 제목 */}

          <div
            className={
              styles.sectionHeading
            }
          >
            <div>
              <h2>
                리뷰 목록
              </h2>

              <span>
                {filteredReviews.length.toLocaleString(
                  'ko-KR'
                )}
                건
              </span>
            </div>
          </div>


          {/* 테이블 */}

          {isLoading ? (
            <div
              className={
                styles.emptyState
              }
            >
              리뷰 목록을
              불러오는 중입니다.
            </div>
          ) : loadError ? (
            <div
              className={
                styles.emptyState
              }
            >
              <strong>
                {loadError}
              </strong>

              <button
                type="button"
                onClick={
                  loadReviews
                }
              >
                다시 시도
              </button>
            </div>
          ) : filteredReviews.length >
            0 ? (
            <>
              <div
                className={
                  styles.tableWrap
                }
              >
                <table
                  className={
                    styles.reviewTable
                  }
                >
                  <thead>
                    <tr>
                      <th>
                        리뷰 ID
                      </th>

                      <th>
                        상품
                      </th>

                      <th>
                        작성자
                      </th>

                      <th>
                        평점
                      </th>

                      <th>
                        리뷰 내용(요약)
                      </th>

                      <th>
                        작성일
                      </th>

                      <th>
                        상태
                      </th>

                      <th>
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
                            key={
                              review.id
                            }
                            className={
                              selectedId ===
                              review.id
                                ? styles.selectedRow
                                : ''
                            }
                            onClick={() =>
                              setSelectedId(
                                review.id
                              )
                            }
                          >
                            <td
                              className={
                                styles.reviewId
                              }
                              data-label="리뷰 ID"
                              title={
                                review.id
                              }
                            >
                              {
                                formatReviewId(
                                  review.id
                                )
                              }
                            </td>


                            <td data-label="상품">
                              <div
                                className={
                                  styles.productTableCell
                                }
                              >
                                <span
                                  className={
                                    styles.tableThumb
                                  }
                                >
                                  {product.image && (
                                    <img
                                      src={
                                        product.image
                                      }
                                      alt=""
                                    />
                                  )}
                                </span>

                                <span
                                  title={
                                    product.name
                                  }
                                >
                                  {
                                    product.name
                                  }
                                </span>
                              </div>
                            </td>


                            <td data-label="작성자">
                              {maskNickname(
                                review.nickname
                              )}
                            </td>


                            <td data-label="평점">
                              <StarRating
                                rating={
                                  review.rating
                                }
                              />
                            </td>


                            <td
                              className={
                                styles.reviewSummary
                              }
                              data-label="리뷰 내용"
                              title={
                                review.content
                              }
                            >
                              {
                                review.content
                              }
                            </td>


                            <td data-label="작성일">
                              {formatDate(
                                review.createdAt
                              )}
                            </td>


                            <td data-label="상태">
                              <span
                                className={`${styles.statusBadge} ${styles[review.status]}`}
                              >
                                {
                                  statusLabels[
                                    review
                                      .status
                                  ]
                                }
                              </span>
                            </td>


                            <td data-label="관리">
                              <button
                                type="button"
                                className={
                                  styles.detailButton
                                }
                                onClick={(
                                  event
                                ) => {
                                  event.stopPropagation()

                                  setSelectedId(
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
              </div>


              {/* 페이지네이션 */}

              <nav
                className={
                  styles.pagination
                }
                aria-label="리뷰 페이지 이동"
              >
                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        Math.max(
                          1,
                          page - 1
                        )
                    )
                  }
                  disabled={
                    safeCurrentPage ===
                    1
                  }
                  aria-label="이전 페이지"
                >
                  ‹
                </button>

                {pageNumbers.map(
                  (page) => (
                    <button
                      key={
                        page
                      }
                      type="button"
                      className={
                        safeCurrentPage ===
                        page
                          ? styles.currentPage
                          : ''
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
                  onClick={() =>
                    setCurrentPage(
                      (page) =>
                        Math.min(
                          totalPages,
                          page + 1
                        )
                    )
                  }
                  disabled={
                    safeCurrentPage ===
                    totalPages
                  }
                  aria-label="다음 페이지"
                >
                  ›
                </button>
              </nav>
            </>
          ) : (
            <div
              className={
                styles.emptyState
              }
            >
              검색 조건에 맞는
              리뷰가 없습니다.
            </div>
          )}

        </section>


        {/* ========================================
            오른쪽
            기본: 통계
            선택: 리뷰 상세
        ======================================== */}

        {selectedReview ? (
          <aside
            className={
              styles.detailPanel
            }
          >

            {/* 상세 제목 */}

            <header
              className={
                styles.detailHeading
              }
            >
              <h2>
                리뷰 상세 보기
              </h2>

              <button
                type="button"
                onClick={() =>
                  setSelectedId(
                    null
                  )
                }
                aria-label="리뷰 상세 닫기"
              >
                ×
              </button>
            </header>


            {/* 상품 정보 */}

            <div
              className={
                styles.detailProduct
              }
            >
              <span
                className={
                  styles.detailThumb
                }
              >
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
                  {
                    selectedProduct?.name
                  }
                </strong>

                <Link
                  to={`/shop/${selectedReview.productId}`}
                >
                  상품 상세보기 →
                </Link>
              </div>
            </div>


            <div
              className={
                styles.detailDivider
              }
            />


            {/* 리뷰 기본 정보 */}

            <dl
              className={
                styles.detailInfo
              }
            >
              <div>
                <dt>
                  리뷰 ID
                </dt>

                <dd>
                  {
                    selectedReview.id
                  }
                </dd>
              </div>

              <div>
                <dt>작성자</dt>

                <dd>
                  {maskNickname(
                    selectedReview.nickname
                  )}
                </dd>
              </div>

              <div>
                <dt>작성일</dt>

                <dd>
                  {formatDate(
                    selectedReview.createdAt
                  )}
                </dd>
              </div>

              <div>
                <dt>평점</dt>

                <dd
                  className={
                    styles.detailRating
                  }
                >
                  <StarRating
                    rating={
                      selectedReview.rating
                    }
                  />

                  <span>
                    {
                      selectedReview.rating
                    }
                    .0
                  </span>
                </dd>
              </div>

              <div>
                <dt>상태</dt>

                <dd>
                  <span
                    className={`${styles.statusBadge} ${styles[selectedReview.status]}`}
                  >
                    {
                      statusLabels[
                        selectedReview
                          .status
                      ]
                    }
                  </span>
                </dd>
              </div>
            </dl>


            {/* 리뷰 내용 */}

            <div
              className={
                styles.reviewContentArea
              }
            >
              <h3>
                리뷰 내용
              </h3>

              <div>
                {
                  selectedReview.content
                }
              </div>
            </div>


            {/* 첨부 이미지 */}

            <div
              className={
                styles.attachmentArea
              }
            >
              <h3>
                첨부 이미지
                <span>
                  (
                  {
                    selectedImages.length
                  }
                  )
                </span>
              </h3>

              {selectedImages.length >
              0 ? (
                <div
                  className={
                    styles.attachmentList
                  }
                >
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
                            index +
                            1
                          }`}
                        />
                      </button>
                    )
                  )}
                </div>
              ) : (
                <p
                  className={
                    styles.noAttachment
                  }
                >
                  첨부 이미지 없음
                </p>
              )}
            </div>


            {/* 상세 액션 */}

            <div
              className={
                styles.detailActions
              }
            >
              <button
                type="button"
                className={
                  styles.hideButton
                }
                disabled={isSaving}
                onClick={() =>
                  toggleVisibility(
                    selectedReview
                  )
                }
              >
                {selectedReview.status ===
                'visible'
                  ? '숨김 처리'
                  : '다시 게시'}
              </button>

              <button
                type="button"
                className={
                  styles.deleteButton
                }
                disabled={isSaving}
                onClick={() =>
                  setConfirmReview(
                    selectedReview
                  )
                }
              >
                삭제하기
              </button>
            </div>

          </aside>
        ) : (
          <aside
            className={
              styles.analyticsColumn
            }
          >

            {/* 상품별 리뷰 TOP 5 */}

            <section
              className={
                styles.analyticsCard
              }
            >
              <h2>
                상품별 리뷰 TOP 5
              </h2>

              <div
                className={
                  styles.topProductList
                }
              >
                {topProducts.length >
                0 ? (
                  topProducts.map(
                    (item) => (
                      <div
                        key={
                          item.productId
                        }
                        className={
                          styles.topProductRow
                        }
                      >
                        <span
                          title={
                            item.name
                          }
                        >
                          {
                            item.name
                          }
                        </span>

                        <i>
                          <b
                            style={{
                              width:
                                `${
                                  (item.count /
                                    maxProductCount) *
                                  100
                                }%`,
                            }}
                          />
                        </i>

                        <strong>
                          {
                            item.count
                          }
                          건
                        </strong>
                      </div>
                    )
                  )
                ) : (
                  <p
                    className={
                      styles.analyticsEmpty
                    }
                  >
                    리뷰 데이터가 없습니다.
                  </p>
                )}
              </div>
            </section>


            {/* 별점 분포 */}

            <section
              className={
                styles.analyticsCard
              }
            >
              <h2>
                전체 리뷰 별점 분포
              </h2>

              <div
                className={
                  styles.ratingDistribution
                }
              >
                {ratingDistribution.map(
                  (item) => (
                    <div
                      key={
                        item.rating
                      }
                      className={
                        styles.ratingBarRow
                      }
                    >
                      <span
                        className={
                          styles.ratingLabel
                        }
                      >
                        {'★'.repeat(
                          item.rating
                        )}

                        <i>
                          {'★'.repeat(
                            5 -
                              item.rating
                          )}
                        </i>
                      </span>

                      <span
                        className={
                          styles.ratingTrack
                        }
                      >
                        <b
                          style={{
                            width:
                              `${item.percentage}%`,
                          }}
                        />
                      </span>

                      <strong>
                        {
                          item.count
                        }
                        건
                      </strong>

                      <small>
                        {
                          item.percentage
                        }
                        %
                      </small>
                    </div>
                  )
                )}
              </div>

              <div
                className={
                  styles.averageRating
                }
              >
                평균 별점

                <strong>
                  {averageRating.toFixed(
                    2
                  )}
                  점
                </strong>
              </div>
            </section>

          </aside>
        )}

      </div>


      {/* ========================================
          삭제 확인 모달
      ======================================== */}

      {confirmReview && (
        <div
          className={
            styles.modalBackdrop
          }
          onMouseDown={() =>
            setConfirmReview(null)
          }
        >
          <section
            className={
              styles.confirmModal
            }
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="review-delete-title"
            onMouseDown={(
              event
            ) =>
              event.stopPropagation()
            }
          >
            <span
              className={
                styles.warningIcon
              }
            >
              !
            </span>

            <h3
              id="review-delete-title"
            >
              리뷰를 삭제할까요?
            </h3>

            <p>
              삭제한 리뷰는
              되돌릴 수 없습니다.
            </p>

            <strong>
              {
                selectedProduct?.name ||
                confirmReview.productId
              }
            </strong>

            <div>
              <button
                type="button"
                onClick={() =>
                  setConfirmReview(
                    null
                  )
                }
                disabled={isSaving}
              >
                취소
              </button>

              <button
                type="button"
                onClick={
                  deleteReview
                }
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
          토스트
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
