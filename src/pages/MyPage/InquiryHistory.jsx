import { useEffect, useMemo, useState } from 'react'
import {
  collection,
  getDocs,
  query,
  where,
} from 'firebase/firestore'
import { Link } from 'react-router-dom'

import { subscribeToAuthState } from '../../firebase/auth'
import { db } from '../../firebase/firebase'

import styles from './InquiryHistory.module.scss'


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


const formatDate = (value) => {
  if (!value) return '-'

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


  /* =========================
     로그인 상태
  ========================= */

  useEffect(() => {
    const unsubscribe =
      subscribeToAuthState(
        setCurrentUser
      )

    return unsubscribe
  }, [])


  /* =========================
     문의 내역 조회
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
     필터
  ========================= */

  const filteredInquiries =
    useMemo(() => {
      if (
        activeFilter === 'all'
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
     상세 → 목록
  ========================= */

  const handleBackToList = () => {
    setSelectedInquiry(null)
  }


  return (
    <section
      className={styles.page}
      aria-labelledby="inquiry-title"
    >

      <div
        className={
          styles.inquiryCard
        }
      >

        {selectedInquiry ? (

          /* ===================================
             문의 상세
          =================================== */

          <>
            <header
              className={
                styles.pageHeader
              }
            >
              <h2
                id="inquiry-title"
              >
                문의 상세 보기
              </h2>
            </header>


            <div
              className={
                styles.titleDivider
              }
            />


            {/* 문의 상단 정보 */}

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


              <span
                className={`${styles.statusBadge} ${
                  selectedInquiry.status ===
                  'answered'
                    ? styles.answered
                    : styles.pending
                }`}
              >
                {getStatusLabel(
                  selectedInquiry.status
                )}
              </span>
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

              <time>
                {formatDate(
                  selectedInquiry.createdAt
                )}
              </time>
            </div>


            {/* 문의 내용 */}

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


            {/* 답변 */}

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
                    자작 고객센터입니다.
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
                    현재 답변을 준비하고
                    있습니다.
                    <br />
                    조금만 기다려주세요.
                  </p>
                </div>
              )}
            </section>


            <div
              className={
                styles.detailGuide
              }
            >
              문의에 대한 추가 문의가
              있다면 새 문의를 등록해주세요.
            </div>


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

          /* ===================================
             문의 목록
          =================================== */

          <>
            <header
              className={
                styles.pageHeader
              }
            >
              <h2
                id="inquiry-title"
              >
                문의 내역
              </h2>
            </header>


            <div
              className={
                styles.titleDivider
              }
            />


            {/* 상단 필터 */}

            <div
              className={
                styles.listControls
              }
            >
              <div
                className={
                  styles.filters
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
                        setActiveFilter(
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


              <Link
                to="/inquiry"
                className={
                  styles.writeButton
                }
              >
                문의하기
              </Link>
            </div>


            {/* 목록 */}

            {isLoading ? (
              <div
                className={
                  styles.stateBox
                }
                role="status"
              >
                문의 내역을
                불러오는 중입니다.
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
              <div
                className={
                  styles.inquiryList
                }
              >
                {filteredInquiries.map(
                  (inquiry) => (
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
                        <span
                          className={`${styles.statusBadge} ${
                            inquiry.status ===
                            'answered'
                              ? styles.answered
                              : styles.pending
                          }`}
                        >
                          {getStatusLabel(
                            inquiry.status
                          )}
                        </span>
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
            ) : (
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
                  ?
                </span>

                <strong>
                  문의 내역이
                  없습니다.
                </strong>

                <p>
                  궁금한 점이 있다면
                  언제든 문의해주세요.
                </p>

                <Link
                  to="/inquiry"
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