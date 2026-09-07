import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import { useNavigate } from 'react-router-dom'

import {
  collection,
  getDocs,
  orderBy,
  query,
} from 'firebase/firestore'

import { auth, db } from '../../firebase/firebase'

import styles from './AiHistory.module.scss'


const FILTERS = [
  '전체',
  '저장한 추천',
  '최근 추천',
]

const PAGE_SIZE = 3


const formatDate = (timestamp) => {
  if (!timestamp) return ''

  const date = timestamp.toDate
    ? timestamp.toDate()
    : new Date(timestamp)

  const year = date.getFullYear()
  const month = String(
    date.getMonth() + 1
  ).padStart(2, '0')
  const day = String(
    date.getDate()
  ).padStart(2, '0')

  return `${year}.${month}.${day}`
}


const AiHistory = () => {
  const navigate = useNavigate()

  const [recommendations, setRecommendations] = useState([])
  const [activeFilter, setActiveFilter] = useState('전체')
  const [sort, setSort] = useState('최신순')

  const [currentPage, setCurrentPage] = useState(1)

  const [loading, setLoading] = useState(true)


  // ---------------------------------------
  // Firestore 추천 기록 불러오기
  // ---------------------------------------

  useEffect(() => {
    const fetchRecommendations = async () => {
      const user = auth.currentUser

      if (!user) {
        setLoading(false)
        return
      }

      try {
        const recommendationRef = collection(
          db,
          'users',
          user.uid,
          'recommendations'
        )

        const recommendationQuery = query(
          recommendationRef,
          orderBy('createdAt', 'desc')
        )

        const snapshot = await getDocs(
          recommendationQuery
        )

        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))

        setRecommendations(data)
      } catch (error) {
        console.error(
          'AI 추천 기록 불러오기 실패:',
          error
        )
      } finally {
        setLoading(false)
      }
    }

    fetchRecommendations()
  }, [])


  // ---------------------------------------
  // 요약 데이터
  // ---------------------------------------

  const summaryData = useMemo(() => {
    const savedCount = recommendations.filter(
      (item) => item.isSaved
    ).length

    return [
      {
        label: '전체 추천',
        value: recommendations.length,
      },
      {
        label: '저장한 추천',
        value: savedCount,
      },
      {
        label: '최근 추천',
        value: Math.min(
          recommendations.length,
          2
        ),
      },
    ]
  }, [recommendations])


  // ---------------------------------------
  // 최근 저장한 추천
  // ---------------------------------------

  const recentRecommendations = useMemo(() => {
    return recommendations
      .filter((item) => item.isSaved)
      .slice(0, 2)
  }, [recommendations])


  // ---------------------------------------
  // 필터
  // ---------------------------------------

  const filteredRecommendations = useMemo(() => {
    let result = [...recommendations]

    if (activeFilter === '저장한 추천') {
      result = result.filter(
        (item) => item.isSaved
      )
    }

    if (activeFilter === '최근 추천') {
      result = result.slice(0, 5)
    }

    result.sort((a, b) => {
      const aDate =
        a.createdAt?.toMillis?.() ?? 0

      const bDate =
        b.createdAt?.toMillis?.() ?? 0

      if (sort === '최신순') {
        return bDate - aDate
      }

      return aDate - bDate
    })

    return result
  }, [
    recommendations,
    activeFilter,
    sort,
  ])


  // ---------------------------------------
  // 페이지네이션
  // ---------------------------------------

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredRecommendations.length /
        PAGE_SIZE
    )
  )


  const paginatedRecommendations =
    useMemo(() => {
      const start =
        (currentPage - 1) *
        PAGE_SIZE

      return filteredRecommendations.slice(
        start,
        start + PAGE_SIZE
      )
    }, [
      filteredRecommendations,
      currentPage,
    ])


  // 필터 변경 시 1페이지로
  useEffect(() => {
    setCurrentPage(1)
  }, [
    activeFilter,
    sort,
  ])


  // ---------------------------------------
  // 상세 페이지 이동
  // ---------------------------------------

  const handleDetail = (id) => {
    navigate(
      `/mypage/ai-history/${id}`
    )
  }


  // ---------------------------------------
  // 로딩
  // ---------------------------------------

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.contentCard}>
          <p>추천 기록을 불러오는 중입니다.</p>
        </div>
      </div>
    )
  }


  return (
    <div className={styles.page}>
      <div className={styles.contentCard}>
        {/* 제목 */}

        <header className={styles.pageHeader}>
          <h1>AI 추천 기록</h1>
        </header>


        {/* 추천 요약 */}

        <section className={styles.summary}>
          {summaryData.map((item) => (
            <div
              key={item.label}
              className={styles.summaryItem}
            >
              <span
                className={styles.summaryIcon}
              />

              <div className={styles.summaryText}>
                <span>
                  {item.label}
                </span>

                <strong>
                  {item.value}
                </strong>
              </div>
            </div>
          ))}
        </section>


        {/* 최근 저장한 추천 */}

        <section
          className={styles.recentSection}
        >
          <h2>최근 저장한 추천</h2>

          {recentRecommendations.length >
          0 ? (
            <div
              className={styles.recentList}
            >
              {recentRecommendations.map(
                (item) => (
                  <button
                    key={item.id}
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
                      {item.sets?.[0]
                        ?.liquor
                        ?.image && (
                        <img
                          src={
                            item
                              .sets[0]
                              .liquor
                              .image
                          }
                          alt={
                            item
                              .sets[0]
                              .liquor
                              .name
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
                        {item.title ||
                          'AI 추천 주안상'}
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
                        {item.keywords?.map(
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
                    >
                      ›
                    </span>
                  </button>
                )
              )}
            </div>
          ) : (
            <p>
              저장한 추천이 없습니다.
            </p>
          )}
        </section>


        {/* 추천 목록 */}

        <section
          className={styles.historySection}
        >
          <div
            className={styles.historyTop}
          >
            <div>
              <h2>
                추천받은 주안상 목록
              </h2>

              <div
                className={styles.filters}
              >
                {FILTERS.map(
                  (filter) => (
                    <button
                      key={filter}
                      type="button"
                      className={`${
                        styles.filterButton
                      } ${
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
                      {filter}
                    </button>
                  )
                )}
              </div>
            </div>

            <select
              className={
                styles.sortSelect
              }
              value={sort}
              onChange={(e) =>
                setSort(
                  e.target.value
                )
              }
            >
              <option value="최신순">
                최신순
              </option>

              <option value="오래된순">
                오래된순
              </option>
            </select>
          </div>


          <div
            className={styles.historyList}
          >
            {paginatedRecommendations.length >
            0 ? (
              paginatedRecommendations.map(
                (history) => {
                  /*
                   * 목록에서는
                   * 추천받은 3개 주안상 중
                   * 첫 번째 세트를 대표로 노출
                   */
                  const firstSet =
                    history.sets?.[0]

                  const products = [
                    {
                      type: '전통주',
                      data:
                        firstSet?.liquor,
                    },
                    {
                      type: '안주',
                      data:
                        firstSet?.food,
                    },
                    {
                      type: '술잔',
                      data:
                        firstSet?.glass,
                    },
                  ]

                  return (
                    <article
                      key={history.id}
                      className={
                        styles.historyCard
                      }
                    >
                      <div
                        className={
                          styles.historyThumbnail
                        }
                      >
                        {firstSet
                          ?.liquor
                          ?.image && (
                          <img
                            src={
                              firstSet
                                .liquor
                                .image
                            }
                            alt={
                              firstSet
                                .liquor
                                .name
                            }
                          />
                        )}
                      </div>


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
                            {history.title ||
                              'AI 추천 주안상'}
                          </strong>
                        </div>


                        <div
                          className={
                            styles.products
                          }
                        >
                          {products.map(
                            (
                              product
                            ) => {
                              if (
                                !product.data
                              ) {
                                return null
                              }

                              return (
                                <div
                                  key={
                                    product.type
                                  }
                                  className={
                                    styles.product
                                  }
                                >
                                  <span
                                    className={
                                      styles.productImage
                                    }
                                  >
                                    {product
                                      .data
                                      .image && (
                                      <img
                                        src={
                                          product
                                            .data
                                            .image
                                        }
                                        alt={
                                          product
                                            .data
                                            .name
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

                                    <strong>
                                      {
                                        product
                                          .data
                                          .name
                                      }
                                    </strong>
                                  </div>
                                </div>
                              )
                            }
                          )}
                        </div>
                      </div>


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
                        <span>›</span>
                      </button>
                    </article>
                  )
                }
              )
            ) : (
              <div>
                아직 AI 추천 기록이
                없습니다.
              </div>
            )}
          </div>
        </section>


        {/* 페이지네이션 */}

        {filteredRecommendations.length >
          0 && (
          <div
            className={styles.pagination}
          >
            <button
              type="button"
              disabled={
                currentPage === 1
              }
              onClick={() =>
                setCurrentPage(
                  (prev) =>
                    Math.max(
                      prev - 1,
                      1
                    )
                )
              }
            >
              ‹
            </button>

            {Array.from(
              {
                length:
                  totalPages,
              },
              (_, index) =>
                index + 1
            ).map((page) => (
              <button
                key={page}
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
            ))}

            <button
              type="button"
              disabled={
                currentPage ===
                totalPages
              }
              onClick={() =>
                setCurrentPage(
                  (prev) =>
                    Math.min(
                      prev + 1,
                      totalPages
                    )
                )
              }
            >
              ›
            </button>
          </div>
        )}
      </div>
    </div>
  )
}


export default AiHistory