import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  useNavigate,
} from 'react-router-dom'

import {
  onAuthStateChanged,
} from 'firebase/auth'

import {
  collection,
  getDocs,
  orderBy,
  query,
} from 'firebase/firestore'

import {
  auth,
  db,
} from '../../firebase/firebase'

import {
  products,
} from '../../data/products'

import MyPageHeader from '../../components/mypage/MyPageHeader'

import styles from './AiHistory.module.scss'
import { cancelSavedRecommendation } from '../../services/recommendationApi'


const FILTERS = [
  '전체',
  '저장한 추천',
  '최근 추천',
]


const PAGE_SIZE = 3
const RECENT_LIMIT = 5


/* ========================================
   상품 이미지
======================================== */

const productImages =
  import.meta.glob(
    '../../assets/webpImages/images/products/**/*.webp',
    {
      eager: true,
      import: 'default',
    }
  )


const resolveProductImage = (
  imageUrl
) => {
  if (!imageUrl) {
    return null
  }


  if (
    imageUrl.startsWith(
      'http://'
    ) ||
    imageUrl.startsWith(
      'https://'
    ) ||
    imageUrl.startsWith(
      'data:'
    ) ||
    imageUrl.startsWith(
      'blob:'
    )
  ) {
    return imageUrl
  }


  const normalizedUrl =
    String(
      imageUrl
    ).replace(
      /\\/g,
      '/'
    )


  const fileName =
    normalizedUrl
      .split('/')
      .pop()


  const matchedImage =
    Object.entries(
      productImages
    ).find(
      ([path]) =>
        (path.endsWith(
          `/${fileName}`
        ) || path.endsWith((`/${fileName}`).replace(/\.(png|jpe?g)$/i, '.webp')))
    )?.[1]


  if (matchedImage) {
    return matchedImage
  }


  if (
    normalizedUrl.startsWith(
      '/'
    )
  ) {
    return normalizedUrl
  }


  return null
}


/* ========================================
   날짜
======================================== */

const formatDate = (
  timestamp
) => {
  if (!timestamp) {
    return ''
  }


  const date =
    timestamp.toDate
      ? timestamp.toDate()
      : new Date(
          timestamp
        )


  const year =
    date.getFullYear()


  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      '0'
    )


  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      '0'
    )


  return `${year}.${month}.${day}`
}


/* ========================================
   날짜 비교
======================================== */

const getCreatedAtMillis = (
  item
) => {
  if (
    item?.createdAt
      ?.toMillis
  ) {
    return item
      .createdAt
      .toMillis()
  }


  if (
    item?.createdAt
      ?.toDate
  ) {
    return item
      .createdAt
      .toDate()
      .getTime()
  }


  if (item?.createdAt) {
    const time =
      new Date(
        item.createdAt
      ).getTime()


    return Number.isNaN(
      time
    )
      ? 0
      : time
  }


  return 0
}


/* ========================================
   설문 라벨
======================================== */

const TASTE_LABELS = {
  sweet:
    '달콤하고 부드러운 맛',

  sour:
    '새콤하고 산뜻한 맛',

  clean:
    '깔끔하고 가벼운 맛',

  savory:
    '구수하고 담백한 맛',

  rich:
    '진하고 묵직한 맛',

  bitter:
    '쌉싸름한 맛',

  dry:
    '드라이한 맛',

  preference:
    '평소 취향 반영',
}


const ALCOHOL_LABELS = {
  light:
    '10도 이하',

  medium:
    '11~16도',

  strong:
    '17~25도',

  veryStrong:
    '26도 이상',

  preference:
    '평소 도수 취향',
}


const MOOD_LABELS = {
  refresh:
    '기분 전환',

  relax:
    '편안한 휴식',

  food:
    '안주와 함께',

  special:
    '특별한 분위기',

  deep:
    '깊은 풍미',
}


const FOOD_LABELS = {
  meal:
    '간편식',

  snack:
    '상온 안주',

  dessert:
    '디저트',

  recommend:
    'AI 추천 안주',
}


/* ========================================
   추천 제목
======================================== */

const buildHistoryTitle = (
  history
) => {
  const survey =
    history?.todaySurvey ||
    {}


  const taste =
    Array.isArray(
      survey.taste
    )
      ? survey.taste[0]
      : survey.taste


  switch (taste) {
    case 'sweet':
      return '달콤하고 부드럽게 즐기는 오늘의 한 상'

    case 'sour':
      return '산뜻하고 가볍게 즐기는 오늘의 한 상'

    case 'clean':
      return '깔끔하게 즐기기 좋은 오늘의 한 상'

    case 'savory':
      return '구수하고 담백하게 즐기는 오늘의 한 상'

    case 'rich':
      return '깊고 묵직하게 즐기는 오늘의 한 상'

    case 'bitter':
    case 'dry':
      return '드라이한 매력을 담은 오늘의 한 상'

    case 'preference':
      return '내 취향을 담은 오늘의 주안상'

    default:
      break
  }


  switch (
    survey.mood
  ) {
    case 'refresh':
      return '기분 전환이 필요한 오늘의 한 상'

    case 'relax':
      return '하루를 편안하게 마무리하는 한 상'

    case 'food':
      return '맛있는 안주와 함께하는 오늘의 한 상'

    case 'special':
      return '조금 특별하게 즐기는 오늘의 한 상'

    case 'deep':
      return '천천히 깊은 풍미를 즐기는 한 상'

    default:
      return '막동이가 추천한 오늘의 주안상'
  }
}


/* ========================================
   추천 키워드
======================================== */

const buildHistoryKeywords = (
  history
) => {
  const survey =
    history?.todaySurvey ||
    {}


  const keywords = []


  const tasteValues =
    Array.isArray(
      survey.taste
    )
      ? survey.taste
      : [
          survey.taste,
        ]


  tasteValues.forEach(
    (taste) => {
      const label =
        TASTE_LABELS[
          taste
        ]


      if (label) {
        keywords.push(
          label
        )
      }
    }
  )


  const alcoholLabel =
    ALCOHOL_LABELS[
      survey.alcohol
    ]


  if (alcoholLabel) {
    keywords.push(
      alcoholLabel
    )
  }


  const moodLabel =
    MOOD_LABELS[
      survey.mood
    ]


  if (moodLabel) {
    keywords.push(
      moodLabel
    )
  }


  const foodLabel =
    FOOD_LABELS[
      survey.food
    ]


  if (foodLabel) {
    keywords.push(
      foodLabel
    )
  }


  return [
    ...new Set(
      keywords
    ),
  ].slice(
    0,
    3
  )
}


/* ========================================
   COMPONENT
======================================== */

const AiHistory = () => {
  const [isCancellingSave, setIsCancellingSave] = useState(false)
  const [cancelSaveMessage, setCancelSaveMessage] = useState('')
  const handleCancelSave = async (id) => {
    if (isCancellingSave) return
    setIsCancellingSave(true)
    setCancelSaveMessage('')
    try {
      await cancelSavedRecommendation(id)
      setRecommendations((items) => items.map((item) => item.id === id ? { ...item, isSaved: false } : item))
      setCancelSaveMessage('저장을 취소했어요. 전체 추천 기록은 유지됩니다.')
    } catch {
      setCancelSaveMessage('저장 취소에 실패했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsCancellingSave(false)
    }
  }
  const navigate =
    useNavigate()


  const [
    recommendations,
    setRecommendations,
  ] = useState([])


  const [
    activeFilter,
    setActiveFilter,
  ] = useState(
    '전체'
  )


  const [
    sort,
    setSort,
  ] = useState(
    '최신순'
  )


  const [
    currentPage,
    setCurrentPage,
  ] = useState(1)


  const [
    loading,
    setLoading,
  ] = useState(true)


  /* ========================================
     상품 MAP
  ======================================== */

  const productMap =
    useMemo(() => {
      return new Map(
        products.map(
          (
            product
          ) => [
            String(
              product.productId
            ),
            product,
          ]
        )
      )
    }, [])


  const getProductById = (
    productId
  ) => {
    if (
      productId ===
        null ||
      productId ===
        undefined
    ) {
      return null
    }


    return (
      productMap.get(
        String(
          productId
        )
      ) ||
      null
    )
  }


  const buildProduct = (
    type,
    productId
  ) => {
    const product =
      getProductById(
        productId
      )


    if (!product) {
      return {
        type,

        id:
          productId,

        name:
          '상품 정보를 찾을 수 없습니다.',

        image:
          null,
      }
    }


    const productName =
      product.productName ??
      product.name ??
      product.title ??
      '상품명'


    const imageUrl =
      product.imageUrl ??
      product.image ??
      product.thumbnail ??
      null


    return {
      type,

      id:
        product.productId,

      name:
        productName,

      image:
        resolveProductImage(
          imageUrl
        ),

      raw:
        product,
    }
  }


  /* ========================================
     추천 기록 불러오기
  ======================================== */

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,

        async (
          currentUser
        ) => {
          if (
            !currentUser ||
            currentUser.isAnonymous
          ) {
            setRecommendations(
              []
            )

            setLoading(
              false
            )

            return
          }


          setLoading(
            true
          )


          try {
            const recommendationRef =
              collection(
                db,
                'users',
                currentUser.uid,
                'recommendations'
              )


            const recommendationQuery =
              query(
                recommendationRef,

                orderBy(
                  'createdAt',
                  'desc'
                )
              )


            const snapshot =
              await getDocs(
                recommendationQuery
              )


            const data =
              snapshot.docs.map(
                (
                  document
                ) => ({
                  id:
                    document.id,

                  ...document.data(),
                })
              )


            setRecommendations(
              data
            )
          } catch (error) {
            console.error(
              'AI 추천 기록 불러오기 실패:',
              error
            )

            setRecommendations(
              []
            )
          } finally {
            setLoading(
              false
            )
          }
        }
      )


    return () =>
      unsubscribe()
  }, [])


  /* ========================================
     최신순
  ======================================== */

  const latestRecommendations =
    useMemo(() => {
      return [
        ...recommendations,
      ].sort(
        (a, b) =>
          getCreatedAtMillis(
            b
          ) -
          getCreatedAtMillis(
            a
          )
      )
    }, [
      recommendations,
    ])


  /* ========================================
     SUMMARY
  ======================================== */

  const summaryData =
    useMemo(() => {
      const savedCount =
        recommendations.filter(
          (item) =>
            item.isSaved ===
            true
        ).length


      return [
        {
          label:
            '전체 추천',

          value:
            recommendations.length,
        },

        {
          label:
            '저장한 추천',

          value:
            savedCount,
        },

        {
          label:
            '최근 추천',

          value:
            Math.min(
              recommendations.length,
              RECENT_LIMIT
            ),
        },
      ]
    }, [
      recommendations,
    ])


  /* ========================================
     최근 저장한 추천
  ======================================== */

  const recentRecommendations =
    useMemo(() => {
      return latestRecommendations
        .filter(
          (item) =>
            item.isSaved ===
            true
        )
        .slice(
          0,
          2
        )
    }, [
      latestRecommendations,
    ])


  /* ========================================
     FILTER + SORT
  ======================================== */

  const filteredRecommendations =
    useMemo(() => {
      let result = [
        ...recommendations,
      ]


      if (
        activeFilter ===
        '저장한 추천'
      ) {
        result =
          result.filter(
            (item) =>
              item.isSaved ===
              true
          )
      }


      result.sort(
        (a, b) => {
          const aDate =
            getCreatedAtMillis(
              a
            )


          const bDate =
            getCreatedAtMillis(
              b
            )


          if (
            sort ===
            '최신순'
          ) {
            return (
              bDate -
              aDate
            )
          }


          return (
            aDate -
            bDate
          )
        }
      )


      if (
        activeFilter ===
        '최근 추천'
      ) {
        const recent = [
          ...recommendations,
        ]
          .sort(
            (a, b) =>
              getCreatedAtMillis(
                b
              ) -
              getCreatedAtMillis(
                a
              )
          )
          .slice(
            0,
            RECENT_LIMIT
          )


        if (
          sort ===
          '오래된순'
        ) {
          recent.reverse()
        }


        result =
          recent
      }


      return result
    }, [
      recommendations,
      activeFilter,
      sort,
    ])


  /* ========================================
     PAGINATION
  ======================================== */

  const totalPages =
    Math.max(
      1,

      Math.ceil(
        filteredRecommendations.length /
          PAGE_SIZE
      )
    )


  const paginatedRecommendations =
    useMemo(() => {
      const start =
        (
          currentPage -
          1
        ) *
        PAGE_SIZE


      return filteredRecommendations.slice(
        start,

        start +
          PAGE_SIZE
      )
    }, [
      filteredRecommendations,
      currentPage,
    ])


  useEffect(() => {
    setCurrentPage(
      1
    )
  }, [
    activeFilter,
    sort,
  ])


  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages
      )
    }
  }, [
    currentPage,
    totalPages,
  ])


  /* ========================================
     DETAIL
  ======================================== */

  const handleDetail = (
    id
  ) => {
    navigate(
      `/mypage/ai-history/${id}`
    )
  }


  /* ========================================
     LOADING
  ======================================== */

  if (loading) {
    return (
      <div
        className={
          styles.page
        }
      >
        <div
          className={
            styles.contentCard
          }
        >
          <MyPageHeader
            title="AI 추천 기록"
          />


          <div
            className={
              styles.loadingState
            }
            role="status"
          >
            <span
              className={
                styles.loadingSpinner
              }
              aria-hidden="true"
            />

            <strong>
              추천 기록을 불러오는 중입니다.
            </strong>
          </div>
        </div>
      </div>
    )
  }


  return (
    <div
      className={
        styles.page
      }
    >
      <div
        className={
          styles.contentCard
        }
      >

        {/* =========================
            HEADER
        ========================= */}

        <MyPageHeader
          title="AI 추천 기록"
        />


        {/* =========================
            SUMMARY
        ========================= */}

        <section
          className={
            styles.summary
          }
        >
          {summaryData.map(
            (item) => (
              <div
                key={
                  item.label
                }
                className={
                  styles.summaryItem
                }
              >
                <span
                  className={
                    styles.summaryLabel
                  }
                >
                  {
                    item.label
                  }
                </span>

                <strong>
                  {
                    item.value
                  }
                </strong>
              </div>
            )
          )}
        </section>


        {/* =========================
            RECENT SAVED
        ========================= */}

        <section
          className={
            styles.recentSection
          }
        >
          <h2>
            최근 저장한 추천
          </h2>
          {cancelSaveMessage && <p role="status">{cancelSaveMessage}</p>}


          {recentRecommendations.length >
          0 ? (
            <div
              className={
                styles.recentList
              }
            >
              {recentRecommendations.map(
                (item) => {
                  const firstRecommendation =
                    item
                      .recommendations
                      ?.[0]


                  const liquor =
                    buildProduct(
                      '전통주',

                      firstRecommendation
                        ?.liquorId
                    )


                  const keywords =
                    buildHistoryKeywords(
                      item
                    )


                  return (
                    <div key={item.id} className={styles.recentSavedItem}>
                    <button
                      key={
                        item.id
                      }
                      type="button"
                      className={
                        styles.recentCard
                      }
                      onClick={() =>
                        handleDetail(
                          item.id
                        )
                      }
                    >
                      <div
                        className={
                          styles.recentThumbnail
                        }
                      >
                        {liquor.image ? (
                          <img
                            src={
                              liquor.image
                            }
                            alt={
                              liquor.name
                            }
                          />
                        ) : (
                          <span
                            className={
                              styles.imageFallback
                            }
                          />
                        )}
                      </div>


                      <div
                        className={
                          styles.recentInfo
                        }
                      >
                        <strong>
                          {
                            buildHistoryTitle(
                              item
                            )
                          }
                        </strong>


                        <span
                          className={
                            styles.recentDate
                          }
                        >
                          {formatDate(
                            item.createdAt
                          )}
                        </span>


                        <div
                          className={
                            styles.keywordList
                          }
                        >
                          {keywords.map(
                            (
                              keyword
                            ) => (
                              <span
                                key={
                                  keyword
                                }
                              >
                                {
                                  keyword
                                }
                              </span>
                            )
                          )}
                        </div>
                      </div>


                      <span
                        className={
                          styles.arrow
                        }
                        aria-hidden="true"
                      >
                        ›
                      </span>
                    </button>
                    <button type="button" className={styles.cancelSaveButton} disabled={isCancellingSave}
                      onClick={() => handleCancelSave(item.id)}>저장 취소</button>
                    </div>
                  )
                }
              )}
            </div>
          ) : (
            <div
              className={
                styles.recentEmpty
              }
            >
              아직 저장한 추천이 없습니다.
            </div>
          )}
        </section>


        {/* =========================
            HISTORY
        ========================= */}

        <section
          className={
            styles.historySection
          }
        >
          <div
            className={
              styles.historyHeader
            }
          >
            <h2>
              추천받은 주안상 목록
            </h2>


            <select
              className={
                styles.sortSelect
              }
              value={
                sort
              }
              onChange={(
                event
              ) =>
                setSort(
                  event.target.value
                )
              }
            >
              <option
                value="최신순"
              >
                최신순
              </option>

              <option
                value="오래된순"
              >
                오래된순
              </option>
            </select>
          </div>


          {/* =========================
              FILTER
          ========================= */}

          <div
            className={
              styles.filters
            }
          >
            {FILTERS.map(
              (filter) => (
                <button
                  key={
                    filter
                  }
                  type="button"
                  className={`${styles.filterButton} ${
                    activeFilter ===
                    filter
                      ? styles.activeFilter
                      : ''
                  }`}
                  onClick={() =>
                    setActiveFilter(
                      filter
                    )
                  }
                >
                  {
                    filter
                  }
                </button>
              )
            )}
          </div>


          {/* =========================
              COUNT
          ========================= */}

          {filteredRecommendations.length >
            0 && (
            <div
              className={
                styles.listCount
              }
            >
              총{' '}

              <strong>
                {
                  filteredRecommendations.length
                }
              </strong>

              건
            </div>
          )}


          {/* =========================
              LIST
          ========================= */}

          <div
            className={
              styles.historyList
            }
          >
            {paginatedRecommendations.length >
            0 ? (
              paginatedRecommendations.map(
                (
                  history
                ) => {
                  const firstRecommendation =
                    history
                      .recommendations
                      ?.[0]


                  const liquor =
                    buildProduct(
                      '전통주',

                      firstRecommendation
                        ?.liquorId
                    )


                  const food =
                    buildProduct(
                      '안주',

                      firstRecommendation
                        ?.foodId
                    )


                  const glass =
                    buildProduct(
                      '술잔',

                      firstRecommendation
                        ?.glassId
                    )


                  const historyProducts = [
                    liquor,
                    food,
                    glass,
                  ]


                  return (
                    <article
                      key={
                        history.id
                      }
                      className={
                        styles.historyCard
                      }
                    >

                      {/* 대표 이미지 */}

                      <div
                        className={
                          styles.historyThumbnail
                        }
                      >
                        {liquor.image ? (
                          <img
                            src={
                              liquor.image
                            }
                            alt={
                              liquor.name
                            }
                          />
                        ) : (
                          <span
                            className={
                              styles.imageFallback
                            }
                          />
                        )}
                      </div>


                      {/* 추천 정보 */}

                      <div
                        className={
                          styles.historyContent
                        }
                      >
                        <div
                          className={
                            styles.historyTitle
                          }
                        >
                          <span>
                            {formatDate(
                              history.createdAt
                            )}
                          </span>

                          <strong>
                            {
                              buildHistoryTitle(
                                history
                              )
                            }
                          </strong>
                        </div>


                        <div
                          className={
                            styles.products
                          }
                        >
                          {historyProducts.map(
                            (
                              product
                            ) => (
                              <div
                                key={`${history.id}-${product.type}`}
                                className={
                                  styles.product
                                }
                              >
                                <span
                                  className={
                                    styles.productImage
                                  }
                                >
                                  {product.image ? (
                                    <img
                                      src={
                                        product.image
                                      }
                                      alt={
                                        product.name
                                      }
                                    />
                                  ) : (
                                    <span
                                      className={
                                        styles.imageFallback
                                      }
                                    />
                                  )}
                                </span>


                                <div
                                  className={
                                    styles.productText
                                  }
                                >
                                  <span>
                                    {
                                      product.type
                                    }
                                  </span>

                                  <strong
                                    title={
                                      product.name
                                    }
                                  >
                                    {
                                      product.name
                                    }
                                  </strong>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>


                      {/* 상세 */}

                      <button
                        type="button"
                        className={
                          styles.detailButton
                        }
                        onClick={() =>
                          handleDetail(
                            history.id
                          )
                        }
                      >
                        상세 보기

                        <span
                          aria-hidden="true"
                        >
                          ›
                        </span>
                      </button>
                    </article>
                  )
                }
              )
            ) : (
              <div
                className={
                  styles.emptyState
                }
              >
                {activeFilter ===
                '저장한 추천'
                  ? '아직 저장한 추천이 없습니다.'
                  : '아직 AI 추천 기록이 없습니다.'}
              </div>
            )}
          </div>
        </section>


        {/* =========================
            PAGINATION
        ========================= */}

        {filteredRecommendations.length >
          PAGE_SIZE && (
          <nav
            className={
              styles.pagination
            }
            aria-label="AI 추천 기록 페이지"
          >
            <button
              type="button"
              disabled={
                currentPage === 1
              }
              onClick={() =>
                setCurrentPage(
                  (
                    prev
                  ) =>
                    Math.max(
                      prev - 1,
                      1
                    )
                )
              }
              aria-label="이전 페이지"
            >
              ‹
            </button>


            {Array.from(
              {
                length:
                  totalPages,
              },
              (
                _,
                index
              ) =>
                index + 1
            ).map(
              (
                page
              ) => (
                <button
                  key={
                    page
                  }
                  type="button"
                  className={
                    currentPage ===
                    page
                      ? styles.activePage
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
              disabled={
                currentPage ===
                totalPages
              }
              onClick={() =>
                setCurrentPage(
                  (
                    prev
                  ) =>
                    Math.min(
                      prev + 1,
                      totalPages
                    )
                )
              }
              aria-label="다음 페이지"
            >
              ›
            </button>
          </nav>
        )}

      </div>
    </div>
  )
}


export default AiHistory
