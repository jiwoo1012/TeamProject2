import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore'

import {
  Link,
} from 'react-router-dom'

import {
  subscribeToAuthState,
} from '../../firebase/auth'

import {
  db,
} from '../../firebase/firebase'

import MyPageHeader from '../../components/mypage/MyPageHeader'
import StatusBadge from '../../components/mypage/StatusBadge'

import styles from './InquiryHistory.module.scss'


const ITEMS_PER_PAGE = 5


const filterItems = [
  {
    label: '전체',
    value: 'all',
  },
  {
    label: '답변 대기',
    value: 'pending',
  },
  {
    label: '답변 완료',
    value: 'answered',
  },
]


/* =========================
   FORMAT DATE
========================= */

const formatDate = (
  value
) => {
  if (!value) {
    return '-'
  }


  const date =
    value?.toDate?.() ||
    new Date(value)


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return '-'
  }


  return new Intl.DateTimeFormat(
    'ko-KR',
    {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }
  )
    .format(date)
    .replaceAll(' ', '')
}


/* =========================
   STATUS
========================= */

const getInquiryStatus = (
  inquiry
) => {
  const rawStatus =
    inquiry.status ||
    inquiry.answerStatus ||
    ''


  if (
    rawStatus === 'answered' ||
    rawStatus === 'complete' ||
    rawStatus === 'completed' ||
    rawStatus === '답변완료' ||
    inquiry.answer
  ) {
    return 'answered'
  }


  return 'pending'
}


const getStatusLabel = (
  status
) =>
  status === 'answered'
    ? '답변 완료'
    : '답변 대기'


const getStatusTone = (
  status
) =>
  status === 'answered'
    ? 'complete'
    : 'pending'


/* =========================
   ARROW ICON
========================= */

const ArrowIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m9 5 7 7-7 7" />
  </svg>
)


/* =========================
   EMPTY ICON
========================= */

const EmptyIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 3h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-5l-4 3v-3H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />

    <path d="M8 8h8" />
    <path d="M8 12h5" />
  </svg>
)


const InquiryHistory = () => {
  const [
    currentUser,
    setCurrentUser,
  ] = useState(undefined)


  const [
    inquiries,
    setInquiries,
  ] = useState([])


  const [
    selectedInquiry,
    setSelectedInquiry,
  ] = useState(null)


  const [
    activeFilter,
    setActiveFilter,
  ] = useState('all')


  const [
    isLoading,
    setIsLoading,
  ] = useState(true)


  const [
    loadError,
    setLoadError,
  ] = useState('')


  const [
    currentPage,
    setCurrentPage,
  ] = useState(1)


  /* =========================
     LOGIN
  ========================= */

  useEffect(() => {
    const unsubscribe =
      subscribeToAuthState(
        setCurrentUser
      )


    return unsubscribe
  }, [])


  /* =========================
     LOAD INQUIRIES
  ========================= */

  useEffect(() => {
    let isMounted = true


    if (
      currentUser === undefined
    ) {
      return undefined
    }


    if (!currentUser) {
      setInquiries([])
      setIsLoading(false)

      return undefined
    }


    const loadInquiries =
      async () => {
        setIsLoading(true)
        setLoadError('')


        try {
          const inquiryQuery =
            query(
              collection(
                db,
                'inquiries'
              ),

              where(
                'userId',
                '==',
                currentUser.uid
              )
            )


          const snapshot =
            await getDocs(
              inquiryQuery
            )


          const nextInquiries =
            snapshot.docs
              .map(
                (
                  inquiryDocument
                ) => {
                  const data =
                    inquiryDocument.data()


                  const createdAtMs =
                    data.createdAt
                      ?.toDate?.()
                      ?.getTime?.() ??
                    Number(
                      data.createdAt
                        ?.seconds ??
                        0
                    ) *
                      1000


                  const status =
                    getInquiryStatus(
                      data
                    )


                  return {
                    id:
                      inquiryDocument.id,

                    category:
                      data.category ||
                      data.type ||
                      '일반 문의',

                    title:
                      data.title ||
                      data.subject ||
                      '문의 내용',

                    content:
                      data.content ||
                      data.question ||
                      data.message ||
                      '',

                    answer:
                      data.answer ||
                      data.reply ||
                      data.response ||
                      '',

                    status,

                    createdAt:
                      data.createdAt,

                    createdAtMs,

                    answeredAt:
                      data.answeredAt ||
                      data.updatedAt ||
                      null,

                    writer:
                      data.userName ||
                      data.writer ||
                      currentUser.displayName ||
                      '회원',
                  }
                }
              )

              .sort(
                (a, b) =>
                  b.createdAtMs -
                  a.createdAtMs
              )


          if (isMounted) {
            setInquiries(
              nextInquiries
            )
          }
        } catch (error) {
          console.error(
            '문의 내역 조회 실패:',
            error
          )


          if (isMounted) {
            setInquiries([])

            setLoadError(
              '문의 내역을 불러오지 못했습니다.'
            )
          }
        } finally {
          if (isMounted) {
            setIsLoading(false)
          }
        }
      }


    loadInquiries()


    return () => {
      isMounted = false
    }
  }, [currentUser])


  /* =========================
     FILTER
  ========================= */

  const filteredInquiries =
    useMemo(() => {
      if (
        activeFilter ===
        'all'
      ) {
        return inquiries
      }


      return inquiries.filter(
        (inquiry) =>
          inquiry.status ===
          activeFilter
      )
    }, [
      inquiries,
      activeFilter,
    ])


  /* =========================
     PAGINATION
  ========================= */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredInquiries.length /
        ITEMS_PER_PAGE
      )
    )


  const startIndex =
    (currentPage - 1) *
    ITEMS_PER_PAGE


  const visibleInquiries =
    filteredInquiries.slice(
      startIndex,
      startIndex +
        ITEMS_PER_PAGE
    )


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


  /* =========================
     FILTER CHANGE
  ========================= */

  const handleFilterChange = (
    value
  ) => {
    setActiveFilter(
      value
    )

    setCurrentPage(1)
  }


  /* =========================
     DETAIL → LIST
  ========================= */

  const handleBackToList = () => {
    setSelectedInquiry(null)
  }


  return (
    <section
      className={
        styles.page
      }
    >
      <div
        className={
          styles.inquiryCard
        }
      >

        {selectedInquiry ? (

          /* =========================
              DETAIL
          ========================= */

          <>
            <MyPageHeader
              title="문의 상세"
            />


            {/* =========================
                DETAIL HEAD
            ========================= */}

            <div
              className={
                styles.detailHeader
              }
            >
              <div
                className={
                  styles.detailTitleArea
                }
              >
                <span
                  className={
                    styles.categoryBadge
                  }
                >
                  {
                    selectedInquiry.category
                  }
                </span>


                <strong>
                  {
                    selectedInquiry.title
                  }
                </strong>
              </div>


              <StatusBadge
                tone={
                  getStatusTone(
                    selectedInquiry.status
                  )
                }
              >
                {getStatusLabel(
                  selectedInquiry.status
                )}
              </StatusBadge>
            </div>


            <div
              className={
                styles.detailMeta
              }
            >
              <span>
                {
                  selectedInquiry.writer
                }
              </span>


              <span
                className={
                  styles.metaDivider
                }
                aria-hidden="true"
              />


              <time>
                {formatDate(
                  selectedInquiry.createdAt
                )}
              </time>
            </div>


            {/* =========================
                QUESTION
            ========================= */}

            <section
              className={
                styles.questionSection
              }
            >
              <h3>
                문의 내용
              </h3>


              <div
                className={
                  styles.questionBox
                }
              >
                {selectedInquiry.content ||
                  '문의 내용이 없습니다.'}
              </div>
            </section>


            {/* =========================
                ANSWER
            ========================= */}

            <section
              className={
                styles.answerSection
              }
            >
              <div
                className={
                  styles.answerHeading
                }
              >
                <h3>
                  답변
                </h3>


                {selectedInquiry.status ===
                  'answered' &&
                  selectedInquiry.answeredAt && (
                    <time>
                      {formatDate(
                        selectedInquiry.answeredAt
                      )}
                    </time>
                  )}
              </div>


              {selectedInquiry.status ===
              'answered' ? (
                <div
                  className={
                    styles.answerBox
                  }
                >
                  <strong>
                    자작 고객센터
                  </strong>


                  <p>
                    {selectedInquiry.answer ||
                      '답변이 등록되었습니다.'}
                  </p>
                </div>
              ) : (
                <div
                  className={
                    styles.pendingAnswer
                  }
                >
                  <span
                    aria-hidden="true"
                  >
                    !
                  </span>


                  <p>
                    현재 답변을 준비하고 있습니다.
                  </p>
                </div>
              )}
            </section>


            {/* =========================
                DETAIL ACTION
            ========================= */}

            <div
              className={
                styles.detailActions
              }
            >
              <button
                type="button"
                className={
                  styles.backButton
                }
                onClick={
                  handleBackToList
                }
              >
                목록으로
              </button>


              <Link
                to="/inquiry"
                className={
                  styles.newInquiryButton
                }
              >
                문의하기
              </Link>
            </div>
          </>

        ) : (

          /* =========================
              LIST
          ========================= */

          <>
            <MyPageHeader
              title="문의 내역"
            >
              <Link
                to="/inquiry"
                className={
                  styles.headerWriteButton
                }
              >
                문의하기
              </Link>
            </MyPageHeader>


            {/* =========================
                FILTER
            ========================= */}

            <div
              className={
                styles.filterBar
              }
              role="tablist"
              aria-label="문의 상태 필터"
            >
              {filterItems.map(
                (filter) => (
                  <button
                    key={
                      filter.value
                    }
                    type="button"
                    role="tab"
                    aria-selected={
                      activeFilter ===
                      filter.value
                    }
                    className={`${styles.filterButton} ${
                      activeFilter ===
                      filter.value
                        ? styles.activeFilter
                        : ''
                    }`}
                    onClick={() =>
                      handleFilterChange(
                        filter.value
                      )
                    }
                  >
                    {
                      filter.label
                    }
                  </button>
                )
              )}
            </div>


            {/* =========================
                COUNT
            ========================= */}

            {!isLoading &&
              !loadError &&
              filteredInquiries.length >
                0 && (
                <div
                  className={
                    styles.listHeader
                  }
                >
                  총{' '}

                  <strong>
                    {
                      filteredInquiries.length
                    }
                  </strong>

                  건
                </div>
              )}


            {/* =========================
                CONTENT
            ========================= */}

            {isLoading ? (
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
                  문의 내역을 불러오는 중입니다.
                </strong>
              </div>
            ) : loadError ? (
              <div
                className={
                  styles.stateBox
                }
                role="alert"
              >
                {loadError}
              </div>
            ) : filteredInquiries.length >
              0 ? (
              <>

                {/* =========================
                    LIST
                ========================= */}

                <div
                  className={
                    styles.inquiryList
                  }
                >
                  {visibleInquiries.map(
                    (
                      inquiry
                    ) => (
                      <button
                        key={
                          inquiry.id
                        }
                        type="button"
                        className={
                          styles.inquiryItem
                        }
                        onClick={() =>
                          setSelectedInquiry(
                            inquiry
                          )
                        }
                      >

                        <div
                          className={
                            styles.itemStatusArea
                          }
                        >
                          <StatusBadge
                            tone={
                              getStatusTone(
                                inquiry.status
                              )
                            }
                          >
                            {getStatusLabel(
                              inquiry.status
                            )}
                          </StatusBadge>
                        </div>


                        <div
                          className={
                            styles.itemInfo
                          }
                        >
                          <div
                            className={
                              styles.itemTitleRow
                            }
                          >
                            <span
                              className={
                                styles.categoryText
                              }
                            >
                              {
                                inquiry.category
                              }
                            </span>


                            <strong>
                              {
                                inquiry.title
                              }
                            </strong>
                          </div>


                          <time>
                            {formatDate(
                              inquiry.createdAt
                            )}
                          </time>
                        </div>


                        <span
                          className={
                            styles.itemArrow
                          }
                          aria-hidden="true"
                        >
                          <ArrowIcon />
                        </span>
                      </button>
                    )
                  )}
                </div>


                {/* =========================
                    PAGINATION
                ========================= */}

                {totalPages > 1 && (
                  <nav
                    className={
                      styles.pagination
                    }
                    aria-label="문의 내역 페이지"
                  >
                    <button
                      type="button"
                      disabled={
                        currentPage ===
                        1
                      }
                      onClick={() =>
                        setCurrentPage(
                          Math.max(
                            1,
                            currentPage -
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
                      ) => {
                        const pageNumber =
                          index + 1


                        return (
                          <button
                            key={
                              pageNumber
                            }
                            type="button"
                            className={
                              currentPage ===
                              pageNumber
                                ? styles.activePage
                                : ''
                            }
                            onClick={() =>
                              setCurrentPage(
                                pageNumber
                              )
                            }
                          >
                            {
                              pageNumber
                            }
                          </button>
                        )
                      }
                    )}


                    <button
                      type="button"
                      disabled={
                        currentPage ===
                        totalPages
                      }
                      onClick={() =>
                        setCurrentPage(
                          Math.min(
                            totalPages,
                            currentPage +
                              1
                          )
                        )
                      }
                      aria-label="다음 페이지"
                    >
                      ›
                    </button>
                  </nav>
                )}
              </>
            ) : (

              /* =========================
                  EMPTY
              ========================= */

              <div
                className={
                  styles.emptyState
                }
              >
                <span
                  className={
                    styles.emptyIcon
                  }
                  aria-hidden="true"
                >
                  <EmptyIcon />
                </span>


                <strong>
                  문의 내역이 없습니다.
                </strong>


                <Link
                  to="/inquiry"
                  className={
                    styles.emptyButton
                  }
                >
                  문의하기
                </Link>
              </div>
            )}
          </>
        )}

      </div>
    </section>
  )
}


export default InquiryHistory