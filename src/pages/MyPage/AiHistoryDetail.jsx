import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  doc,
  getDoc,
} from 'firebase/firestore'

import {
  Link,
  useNavigate,
  useParams,
} from 'react-router-dom'

import {
  subscribeToAuthState,
} from '../../firebase/auth'

import {
  db,
} from '../../firebase/firebase'

import {
  products,
} from '../../data/products'

import MyPageHeader from '../../components/mypage/MyPageHeader'

import styles from './AiHistoryDetail.module.scss'


/* ========================================
   IMAGE
======================================== */

const productImages =
  import.meta.glob(
    '../../assets/images/products/**/*.{png,jpg,jpeg,webp,avif}',
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
        path.endsWith(
          `/${fileName}`
        )
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
   FORMAT
======================================== */

const formatDate = (
  timestamp
) => {
  if (!timestamp) {
    return '-'
  }


  const date =
    timestamp?.toDate?.() ||
    new Date(timestamp)


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '-'
  }


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


const formatPrice = (
  value
) =>
  Number(
    value || 0
  ).toLocaleString(
    'ko-KR'
  )


/* ========================================
   SURVEY LABEL
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
   TITLE
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
      return '막둥이가 추천한 오늘의 주안상'
  }
}


/* ========================================
   SURVEY CHIPS
======================================== */

const buildSurveyKeywords = (
  history
) => {
  const survey =
    history?.todaySurvey ||
    {}


  const result = []


  const tastes =
    Array.isArray(
      survey.taste
    )
      ? survey.taste
      : survey.taste
        ? [
            survey.taste,
          ]
        : []


  tastes.forEach(
    (taste) => {
      const label =
        TASTE_LABELS[
          taste
        ]


      if (label) {
        result.push(
          label
        )
      }
    }
  )


  if (
    ALCOHOL_LABELS[
      survey.alcohol
    ]
  ) {
    result.push(
      ALCOHOL_LABELS[
        survey.alcohol
      ]
    )
  }


  if (
    MOOD_LABELS[
      survey.mood
    ]
  ) {
    result.push(
      MOOD_LABELS[
        survey.mood
      ]
    )
  }


  if (
    FOOD_LABELS[
      survey.food
    ]
  ) {
    result.push(
      FOOD_LABELS[
        survey.food
      ]
    )
  }


  return [
    ...new Set(
      result
    ),
  ]
}


/* ========================================
   PRODUCT
======================================== */

const getProductData = (
  product
) => {
  if (!product) {
    return null
  }


  return {
    id:
      product.productId,

    name:
      product.productName ||
      product.name ||
      product.title ||
      '상품',

    price:
      Number(
        product.salePrice ??
        product.price ??
        0
      ),

    image:
      resolveProductImage(
        product.imageUrl ||
        product.image ||
        product.thumbnail
      ),
  }
}


/* ========================================
   PRODUCT CARD
======================================== */

const ProductInfoCard = ({
  type,
  product,
  reason,
}) => {
  if (!product) {
    return (
      <div
        className={
          styles.productCard
        }
      >
        <span
          className={
            styles.productType
          }
        >
          {type}
        </span>


        <div
          className={
            styles.productFallback
          }
        >
          상품 정보를 찾을 수 없습니다.
        </div>
      </div>
    )
  }


  return (
    <article
      className={
        styles.productCard
      }
    >
      <span
        className={
          styles.productType
        }
      >
        {type}
      </span>


      <Link
        to={`/shop/${product.id}`}
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
          >
            IMG
          </span>
        )}
      </Link>


      <div
        className={
          styles.productInfo
        }
      >
        <strong
          title={
            product.name
          }
        >
          {
            product.name
          }
        </strong>


        {product.price >
          0 && (
          <span
            className={
              styles.productPrice
            }
          >
            {formatPrice(
              product.price
            )}
            원
          </span>
        )}


        {reason && (
          <p
            className={
              styles.productReason
            }
          >
            {reason}
          </p>
        )}
      </div>


      <Link
        to={`/shop/${product.id}`}
        className={
          styles.productButton
        }
      >
        상품 보기

        <span
          aria-hidden="true"
        >
          ›
        </span>
      </Link>
    </article>
  )
}


/* ========================================
   COMPONENT
======================================== */

const AiHistoryDetail = () => {
  const navigate =
    useNavigate()


  const {
    recommendationId,
  } = useParams()


  const [
    currentUser,
    setCurrentUser,
  ] = useState(undefined)


  const [
    recommendation,
    setRecommendation,
  ] = useState(null)


  const [
    isLoading,
    setIsLoading,
  ] = useState(true)


  const [
    loadError,
    setLoadError,
  ] = useState('')


  /* ========================================
     PRODUCT MAP
  ======================================== */

  const productMap =
    useMemo(
      () =>
        new Map(
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
        ),
      []
    )


  const findProduct = (
    productId
  ) => {
    if (
      productId ===
        undefined ||
      productId ===
        null
    ) {
      return null
    }


    const product =
      productMap.get(
        String(
          productId
        )
      )


    return getProductData(
      product
    )
  }


  /* ========================================
     AUTH
  ======================================== */

  useEffect(() => {
    const unsubscribe =
      subscribeToAuthState(
        setCurrentUser
      )


    return unsubscribe
  }, [])


  /* ========================================
     DETAIL LOAD
  ======================================== */

  useEffect(() => {
    let isMounted = true


    if (
      currentUser === undefined
    ) {
      return undefined
    }


    if (
      !currentUser ||
      !recommendationId
    ) {
      setRecommendation(
        null
      )

      setLoadError(
        '추천 기록을 확인할 수 없습니다.'
      )

      setIsLoading(
        false
      )

      return undefined
    }


    const loadRecommendation =
      async () => {
        setIsLoading(
          true
        )

        setLoadError('')


        try {
          const recommendationRef =
            doc(
              db,
              'users',
              currentUser.uid,
              'recommendations',
              recommendationId
            )


          const snapshot =
            await getDoc(
              recommendationRef
            )


          if (!isMounted) {
            return
          }


          if (
            !snapshot.exists()
          ) {
            setRecommendation(
              null
            )

            setLoadError(
              '해당 추천 기록을 찾을 수 없습니다.'
            )

            return
          }


          setRecommendation({
            id:
              snapshot.id,

            ...snapshot.data(),
          })
        } catch (error) {
          console.error(
            'AI 추천 상세 조회 실패:',
            error
          )


          if (isMounted) {
            setRecommendation(
              null
            )

            setLoadError(
              '추천 기록을 불러오지 못했습니다.'
            )
          }
        } finally {
          if (isMounted) {
            setIsLoading(
              false
            )
          }
        }
      }


    loadRecommendation()


    return () => {
      isMounted = false
    }
  }, [
    currentUser,
    recommendationId,
  ])


  /* ========================================
     RECOMMENDATION TABLES
  ======================================== */

  const recommendationTables =
    useMemo(() => {
      const items =
        recommendation
          ?.recommendations


      if (
        !Array.isArray(
          items
        )
      ) {
        return []
      }


      return items.map(
        (
          item,
          index
        ) => ({
          ...item,

          index:
            index + 1,

          liquor:
            findProduct(
              item.liquorId
            ),

          food:
            findProduct(
              item.foodId
            ),

          glass:
            findProduct(
              item.glassId
            ),
        })
      )
    }, [
      recommendation,
      productMap,
    ])


  const surveyKeywords =
    useMemo(
      () =>
        buildSurveyKeywords(
          recommendation
        ),
      [recommendation]
    )


  /* ========================================
     LOADING
  ======================================== */

  if (isLoading) {
    return (
      <section
        className={
          styles.page
        }
      >
        <div
          className={
            styles.detailCard
          }
        >
          <MyPageHeader
            title="AI 추천 상세"
          />


          <div
            className={
              styles.stateBox
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
      </section>
    )
  }


  /* ========================================
     ERROR
  ======================================== */

  if (
    loadError ||
    !recommendation
  ) {
    return (
      <section
        className={
          styles.page
        }
      >
        <div
          className={
            styles.detailCard
          }
        >
          <MyPageHeader
            title="AI 추천 상세"
          />


          <div
            className={
              styles.errorState
            }
          >
            <strong>
              {loadError ||
                '추천 기록을 찾을 수 없습니다.'}
            </strong>


            <button
              type="button"
              onClick={() =>
                navigate(
                  '/mypage/ai-history'
                )
              }
            >
              목록으로
            </button>
          </div>
        </div>
      </section>
    )
  }


  /* ========================================
     RENDER
  ======================================== */

  return (
    <section
      className={
        styles.page
      }
    >
      <div
        className={
          styles.detailCard
        }
      >

        {/* =========================
            HEADER
        ========================= */}

        <MyPageHeader
          title="AI 추천 상세"
        >
          <button
            type="button"
            className={
              styles.headerBackButton
            }
            onClick={() =>
              navigate(
                '/mypage/ai-history'
              )
            }
          >
            ‹ 목록으로
          </button>
        </MyPageHeader>


        {/* =========================
            OVERVIEW
        ========================= */}

        <section
          className={
            styles.overview
          }
        >
          <div
            className={
              styles.overviewTop
            }
          >
            <time>
              {formatDate(
                recommendation.createdAt
              )}
            </time>


            {recommendation.isSaved && (
              <span
                className={
                  styles.savedBadge
                }
              >
                저장됨
              </span>
            )}
          </div>


          <h2>
            {buildHistoryTitle(
              recommendation
            )}
          </h2>


          {surveyKeywords.length >
            0 && (
            <div
              className={
                styles.surveyArea
              }
            >
              <span
                className={
                  styles.surveyLabel
                }
              >
                추천 당시 선택
              </span>


              <div
                className={
                  styles.surveyKeywords
                }
              >
                {surveyKeywords.map(
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
          )}
        </section>


        {/* =========================
            RESULT TITLE
        ========================= */}

        <div
          className={
            styles.sectionHeading
          }
        >
          <h2>
            추천받은 주안상
          </h2>

          <span>
            총{' '}

            <strong>
              {
                recommendationTables.length
              }
            </strong>

            세트
          </span>
        </div>


        {/* =========================
            TABLES
        ========================= */}

        {recommendationTables.length >
          0 ? (
          <div
            className={
              styles.tableList
            }
          >
            {recommendationTables.map(
              (
                table
              ) => (
                <article
                  key={
                    table.tableId ||
                    table.index
                  }
                  className={
                    styles.tableCard
                  }
                >

                  {/* =========================
                      TABLE HEADER
                  ========================= */}

                  <header
                    className={
                      styles.tableHeader
                    }
                  >
                    <div
                      className={
                        styles.tableTitle
                      }
                    >
                      <span
                        className={
                          styles.tableNumber
                        }
                      >
                        {String(
                          table.index
                        ).padStart(
                          2,
                          '0'
                        )}
                      </span>


                      <strong>
                        {table.index ===
                          1
                          ? '첫 번째 주안상'
                          : table.index ===
                              2
                            ? '두 번째 주안상'
                            : '세 번째 주안상'}
                      </strong>
                    </div>


                    {table.recommendedTimeText && (
                      <span
                        className={
                          styles.timeBadge
                        }
                      >
                        {
                          table.recommendedTimeText
                        }
                      </span>
                    )}
                  </header>


                  {/* =========================
                      MAIN REASON
                  ========================= */}

                  {table.reason && (
                    <div
                      className={
                        styles.mainReason
                      }
                    >
                      <strong>
                        막둥이의 추천 이유
                      </strong>


                      <p>
                        {
                          table.reason
                        }
                      </p>
                    </div>
                  )}


                  {/* =========================
                      PRODUCTS
                  ========================= */}

                  <div
                    className={
                      styles.productGrid
                    }
                  >
                    <ProductInfoCard
                      type="전통주"
                      product={
                        table.liquor
                      }
                      reason={
                        table.liquorReason
                      }
                    />


                    <ProductInfoCard
                      type="안주"
                      product={
                        table.food
                      }
                      reason={
                        table.foodReason
                      }
                    />


                    <ProductInfoCard
                      type="술잔"
                      product={
                        table.glass
                      }
                      reason={
                        table.glassReason
                      }
                    />
                  </div>

                </article>
              )
            )}
          </div>
        ) : (
          <div
            className={
              styles.emptyState
            }
          >
            추천된 주안상 정보를 찾을 수 없습니다.
          </div>
        )}


        {/* =========================
            BOTTOM ACTION
        ========================= */}

        <div
          className={
            styles.bottomActions
          }
        >
          <button
            type="button"
            className={
              styles.backButton
            }
            onClick={() =>
              navigate(
                '/mypage/ai-history'
              )
            }
          >
            목록으로
          </button>
        </div>

      </div>
    </section>
  )
}


export default AiHistoryDetail