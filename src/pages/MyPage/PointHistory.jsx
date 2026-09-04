import { useEffect, useMemo, useState } from 'react'

import {
  getCurrentUserData,
  subscribeToAuthState,
} from '../../firebase/auth'

import {
  getCollection,
} from '../../firebase/firestore'

import styles from './PointHistory.module.scss'


const filterItems = [
  {
    label: '전체',
    value: 'all',
  },
  {
    label: '적립',
    value: 'earn',
  },
  {
    label: '사용',
    value: 'use',
  },
]


const formatNumber = (value) =>
  Number(value || 0).toLocaleString(
    'ko-KR'
  )


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


const normalizeType = (
  type,
  amount
) => {
  if (
    type === 'earn' ||
    type === 'earned' ||
    type === 'plus'
  ) {
    return 'earn'
  }

  if (
    type === 'use' ||
    type === 'used' ||
    type === 'minus'
  ) {
    return 'use'
  }

  return Number(amount) >= 0
    ? 'earn'
    : 'use'
}


const PointHistory = () => {
  const [
    currentUser,
    setCurrentUser,
  ] = useState(undefined)

  const [points, setPoints] =
    useState(0)

  const [
    pointHistory,
    setPointHistory,
  ] = useState([])

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
     포인트 데이터 조회
  ========================= */

  useEffect(() => {
    let isMounted = true


    if (
      currentUser === undefined
    ) {
      return undefined
    }


    if (!currentUser) {
      setPoints(0)
      setPointHistory([])
      setIsLoading(false)

      return undefined
    }


    const loadPointData =
      async () => {
        setIsLoading(true)
        setLoadError('')


        try {
          const [
            userData,
            historyDocs,
          ] = await Promise.all([
            getCurrentUserData(
              currentUser.uid
            ),

            getCollection(
              `users/${currentUser.uid}/pointHistory`
            ),
          ])


          if (!isMounted) {
            return
          }


          setPoints(
            Number(
              userData?.points ??
                0
            )
          )


          const normalized =
            historyDocs
              .map((doc) => {
                const amount =
                  Number(
                    doc.amount ??
                      0
                  )

                return {
                  id:
                    doc.id,

                  type:
                    normalizeType(
                      doc.type,
                      amount
                    ),

                  amount:
                    Math.abs(
                      amount
                    ),

                  reason:
                    doc.reason ||
                    doc.description ||
                    '포인트 내역',

                  createdAt:
                    doc.createdAt,

                  createdAtMs:
                    doc.createdAt
                      ?.toDate?.()
                      ?.getTime?.() ??
                    Number(
                      doc.createdAt
                        ?.seconds ??
                        0
                    ) *
                      1000,

                  orderId:
                    doc.orderId ||
                    '',
                }
              })

              .sort(
                (a, b) =>
                  b.createdAtMs -
                  a.createdAtMs
              )


          setPointHistory(
            normalized
          )
        } catch (error) {
          console.error(
            '포인트 내역 조회 실패:',
            error
          )


          if (isMounted) {
            setPointHistory([])

            setLoadError(
              '포인트 내역을 불러오지 못했습니다.'
            )
          }
        } finally {
          if (isMounted) {
            setIsLoading(false)
          }
        }
      }


    loadPointData()


    return () => {
      isMounted = false
    }
  }, [currentUser])


  /* =========================
     필터
  ========================= */

  const filteredHistory =
    useMemo(() => {
      if (
        activeFilter === 'all'
      ) {
        return pointHistory
      }


      return pointHistory.filter(
        (item) =>
          item.type ===
          activeFilter
      )
    }, [
      pointHistory,
      activeFilter,
    ])


  /* =========================
     요약
  ========================= */

  const earnedPoints =
    pointHistory
      .filter(
        (item) =>
          item.type === 'earn'
      )
      .reduce(
        (sum, item) =>
          sum + item.amount,
        0
      )


  const usedPoints =
    pointHistory
      .filter(
        (item) =>
          item.type === 'use'
      )
      .reduce(
        (sum, item) =>
          sum + item.amount,
        0
      )


  return (
    <section
      className={styles.page}
      aria-labelledby="point-history-title"
    >

      <div
        className={
          styles.pointCard
        }
      >

        {/* =====================
            HEADER
        ===================== */}

        <header
          className={
            styles.pageHeader
          }
        >
          <h2
            id="point-history-title"
          >
            포인트
          </h2>
        </header>


        <div
          className={
            styles.titleDivider
          }
        />


        {/* =====================
            CURRENT POINT
        ===================== */}

        <section
          className={
            styles.pointSummary
          }
          aria-label="현재 보유 포인트"
        >
          <div
            className={
              styles.mainPoint
            }
          >
            <span>
              현재 보유 포인트
            </span>

            <strong>
              {formatNumber(
                points
              )}
              <em>
                POINT
              </em>
            </strong>
          </div>


          <div
            className={
              styles.summaryInfo
            }
          >
            <div>
              <span>
                누적 적립
              </span>

              <strong>
                +
                {formatNumber(
                  earnedPoints
                )}
                P
              </strong>
            </div>


            <div>
              <span>
                누적 사용
              </span>

              <strong>
                -
                {formatNumber(
                  usedPoints
                )}
                P
              </strong>
            </div>


            <div>
              <span>
                소멸 예정
              </span>

              <strong>
                0P
              </strong>
            </div>
          </div>
        </section>


        {/* =====================
            HISTORY HEADER
        ===================== */}

        <section
          className={
            styles.historySection
          }
          aria-labelledby="point-list-title"
        >

          <div
            className={
              styles.historyHeader
            }
          >
            <h3
              id="point-list-title"
            >
              포인트 내역
            </h3>


            <div
              className={
                styles.filters
              }
              role="tablist"
              aria-label="포인트 내역 필터"
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
          </div>


          {/* =====================
              CONTENT
          ===================== */}

          {isLoading ? (

            <div
              className={
                styles.stateBox
              }
              role="status"
            >
              포인트 내역을
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

          ) : filteredHistory.length >
            0 ? (

            <div
              className={
                styles.historyList
              }
            >
              {filteredHistory.map(
                (item) => (

                  <article
                    key={
                      item.id
                    }
                    className={
                      styles.historyItem
                    }
                  >

                    <div
                      className={`${styles.pointAmount} ${
                        item.type ===
                        'earn'
                          ? styles.earn
                          : styles.use
                      }`}
                    >
                      <strong>
                        {item.type ===
                        'earn'
                          ? '+'
                          : '-'}
                        {formatNumber(
                          item.amount
                        )}
                      </strong>

                      <span>
                        P
                      </span>
                    </div>


                    <div
                      className={
                        styles.historyInfo
                      }
                    >
                      <strong>
                        {
                          item.reason
                        }
                      </strong>

                      <div
                        className={
                          styles.historyMeta
                        }
                      >
                        <time>
                          {formatDate(
                            item.createdAt
                          )}
                        </time>

                        {item.orderId && (
                          <span>
                            주문번호{' '}
                            {item.orderId.slice(
                              0,
                              12
                            )}
                          </span>
                        )}
                      </div>
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
              <span
                className={
                  styles.emptyIcon
                }
                aria-hidden="true"
              >
                P
              </span>

              <strong>
                포인트 내역이
                없습니다.
              </strong>

              <p>
                포인트를 적립하거나
                사용하면 이곳에서
                확인할 수 있어요.
              </p>
            </div>

          )}

        </section>

      </div>

    </section>
  )
}


export default PointHistory