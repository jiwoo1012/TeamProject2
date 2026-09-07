import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import adminTopOrnament from '../../assets/images/admin/adminTopOrnament.svg'

import styles from './AiLogManage.module.scss'


const PAGE_SIZE = 8


// ========================================
// 시연용 AI 추천 기록
// ========================================

const mockLogs = [
  {
    id: 'AI_10020',
    userId: 'user_0001',
    user: '홍길동',
    memberType: 'member',

    date: '2026.09.07',
    time: '14:32',

    preference: '달콤함, 저도수, 은은한 향',
    representativeProduct: '복순도가 손막걸리',

    status: 'success',

    preferenceDetail: {
      sweetness: '달콤함',
      acidity: '은은함',
      body: '가볍고 깔끔',
      aroma: '은은함',
      alcohol: '10도 이하',
      avoidIngredients: '해당 없음',
    },

    result: {
      liquors: [
        '복순도가 손막걸리',
        '느린마을 막걸리',
        '해창 막걸리',
      ],

      foods: [
        '곶감 호두말이',
        '한우 육포',
        '약과',
      ],

      glasses: [
        '백자 술잔',
        '유기 방짜 술잔',
      ],
    },

    reason:
      '사용자가 선호하는 달콤하고 부드러운 맛과 낮은 도수, 은은한 향을 기준으로 부담 없이 즐길 수 있는 전통주를 우선 추천했습니다. 함께 곁들이기 좋은 안주와 술잔을 조합해 하나의 주안상으로 구성했습니다.',

    system: {
      candidateCount: 12,
      model: 'gpt-4o',
      promptVersion: 'v1.2',
      errorType: '-',
    },
  },

  {
    id: 'AI_10021',
    userId: 'guest_4821',
    user: '게스트_4821',
    memberType: 'guest',

    date: '2026.09.07',
    time: '13:48',

    preference: '깔끔함, 중간 도수, 산뜻한 향',
    representativeProduct: '느린마을 막걸리',

    status: 'failed',

    preferenceDetail: {
      sweetness: '거의 달지 않음',
      acidity: '은은함',
      body: '가볍고 깔끔',
      aroma: '적당함',
      alcohol: '11~16도',
      avoidIngredients: '견과류',
    },

    result: {
      liquors: [],
      foods: [],
      glasses: [],
    },

    reason:
      '추천 조건을 만족하는 후보 상품이 충분하지 않아 최종 추천 결과를 생성하지 못했습니다.',

    system: {
      candidateCount: 2,
      model: 'gpt-4o',
      promptVersion: 'v1.2',
      errorType: 'NOT_ENOUGH_CANDIDATES',
    },
  },

  {
    id: 'AI_10022',
    userId: 'user_0047',
    user: '김하늘',
    memberType: 'member',

    date: '2026.09.06',
    time: '20:11',

    preference: '드라이함, 고도수, 향 강함',
    representativeProduct: '화요 25',

    status: 'success',

    preferenceDetail: {
      sweetness: '거의 달지 않음',
      acidity: '거의 없음',
      body: '진하고 묵직',
      aroma: '확실함',
      alcohol: '17~25도',
      avoidIngredients: '해당 없음',
    },

    result: {
      liquors: [
        '화요 25',
        '문배술',
        '서울의 밤',
      ],

      foods: [
        '소고기 육포',
        '먹태 구이',
        '편육',
      ],

      glasses: [
        '유리 소주잔',
        '방짜 유기잔',
      ],
    },

    reason:
      '드라이하고 묵직한 술을 선호하는 취향을 반영해 증류주 계열을 중심으로 추천했습니다. 술의 향을 방해하지 않는 담백하고 짭짤한 안주를 함께 구성했습니다.',

    system: {
      candidateCount: 18,
      model: 'gpt-4o',
      promptVersion: 'v1.2',
      errorType: '-',
    },
  },

  {
    id: 'AI_10023',
    userId: 'user_0058',
    user: '박서연',
    memberType: 'member',

    date: '2026.09.06',
    time: '17:42',

    preference: '달콤함, 저도수, 과일향',
    representativeProduct: '매실원주',

    status: 'success',

    preferenceDetail: {
      sweetness: '달콤함',
      acidity: '확실한 산미',
      body: '가볍고 깔끔',
      aroma: '확실함',
      alcohol: '10도 이하',
      avoidIngredients: '유제품',
    },

    result: {
      liquors: [
        '매실원주',
        '복분자주',
        '오미자주',
      ],

      foods: [
        '약과',
        '곶감 호두말이',
        '과일 안주',
      ],

      glasses: [
        '튤립형 술잔',
        '유리잔',
      ],
    },

    reason:
      '달콤한 맛과 과일향을 선호하는 취향을 중심으로 과실주 계열을 추천하고 가볍게 곁들일 수 있는 디저트류를 함께 구성했습니다.',

    system: {
      candidateCount: 15,
      model: 'gpt-4o',
      promptVersion: 'v1.2',
      errorType: '-',
    },
  },

  {
    id: 'AI_10024',
    userId: 'guest_9284',
    user: '게스트_9284',
    memberType: 'guest',

    date: '2026.09.05',
    time: '19:15',

    preference: '잘 모르겠음, 도수 상관없음',
    representativeProduct: '복순도가 손막걸리',

    status: 'success',

    preferenceDetail: {
      sweetness: '잘 모르겠음',
      acidity: '상관없음',
      body: '잘 모르겠음',
      aroma: '상관없음',
      alcohol: '상관없음',
      avoidIngredients: '해당 없음',
    },

    result: {
      liquors: [
        '복순도가 손막걸리',
        '느린마을 막걸리',
        '화요 17',
      ],

      foods: [
        '모둠전',
        '한입 약과',
        '육포',
      ],

      glasses: [
        '백자 술잔',
        '유리 술잔',
      ],
    },

    reason:
      '명확한 취향 정보가 적어 전통주 입문자가 비교적 부담 없이 즐길 수 있는 상품을 중심으로 추천했습니다.',

    system: {
      candidateCount: 21,
      model: 'gpt-4o',
      promptVersion: 'v1.2',
      errorType: '-',
    },
  },

  {
    id: 'AI_10025',
    userId: 'user_0062',
    user: '정민수',
    memberType: 'member',

    date: '2026.09.05',
    time: '15:04',

    preference: '산미, 가벼움, 은은한 향',
    representativeProduct: '오미자주',

    status: 'success',

    preferenceDetail: {
      sweetness: '은은한 단맛',
      acidity: '확실한 산미',
      body: '가볍고 깔끔',
      aroma: '은은함',
      alcohol: '11~16도',
      avoidIngredients: '땅콩',
    },

    result: {
      liquors: [
        '오미자주',
        '청명주',
        '백세주',
      ],

      foods: [
        '두부김치',
        '나물전',
        '한과',
      ],

      glasses: [
        '청자 술잔',
        '유리잔',
      ],
    },

    reason:
      '산뜻한 산미와 가벼운 질감을 선호하는 취향을 반영해 깔끔하게 마실 수 있는 전통주를 중심으로 구성했습니다.',

    system: {
      candidateCount: 17,
      model: 'gpt-4o',
      promptVersion: 'v1.2',
      errorType: '-',
    },
  },

  {
    id: 'AI_10026',
    userId: 'guest_1938',
    user: '게스트_1938',
    memberType: 'guest',

    date: '2026.09.04',
    time: '21:16',

    preference: '진한 맛, 고도수',
    representativeProduct: '문배술',

    status: 'failed',

    preferenceDetail: {
      sweetness: '거의 달지 않음',
      acidity: '거의 없음',
      body: '진하고 묵직',
      aroma: '확실함',
      alcohol: '26도 이상',
      avoidIngredients: '해당 없음',
    },

    result: {
      liquors: [],
      foods: [],
      glasses: [],
    },

    reason:
      'AI 추천 요청 처리 중 응답 시간이 초과되어 결과를 생성하지 못했습니다.',

    system: {
      candidateCount: 14,
      model: 'gpt-4o',
      promptVersion: 'v1.2',
      errorType: 'OPENAI_TIMEOUT',
    },
  },

  {
    id: 'AI_10027',
    userId: 'user_0069',
    user: '이유진',
    memberType: 'member',

    date: '2026.09.04',
    time: '16:22',

    preference: '고소함, 중간 도수, 은은한 향',
    representativeProduct: '해창 막걸리',

    status: 'success',

    preferenceDetail: {
      sweetness: '은은한 단맛',
      acidity: '은은함',
      body: '적당한 무게감',
      aroma: '은은함',
      alcohol: '11~16도',
      avoidIngredients: '해당 없음',
    },

    result: {
      liquors: [
        '해창 막걸리',
        '서울 장수 막걸리',
        '느린마을 막걸리',
      ],

      foods: [
        '감자전',
        '김치전',
        '도토리묵',
      ],

      glasses: [
        '막걸리 사발',
        '백자 술잔',
      ],
    },

    reason:
      '구수하고 고소한 풍미를 선호하는 취향에 맞춰 탁주 계열을 중심으로 추천하고 전과 묵처럼 익숙한 안주를 함께 구성했습니다.',

    system: {
      candidateCount: 19,
      model: 'gpt-4o',
      promptVersion: 'v1.2',
      errorType: '-',
    },
  },

  {
    id: 'AI_10028',
    userId: 'user_0075',
    user: '최지우',
    memberType: 'member',

    date: '2026.09.03',
    time: '13:37',

    preference: '달콤함, 중간 도수, 향 강함',
    representativeProduct: '복분자주',

    status: 'success',

    preferenceDetail: {
      sweetness: '달콤함',
      acidity: '은은함',
      body: '적당한 무게감',
      aroma: '확실함',
      alcohol: '11~16도',
      avoidIngredients: '해당 없음',
    },

    result: {
      liquors: [
        '복분자주',
        '매실원주',
        '한산소곡주',
      ],

      foods: [
        '한과',
        '치즈',
        '견과류',
      ],

      glasses: [
        '와인형 전통주잔',
        '유리 술잔',
      ],
    },

    reason:
      '달콤하고 향이 뚜렷한 술을 선호하는 사용자 특성을 바탕으로 과실향과 단맛이 잘 느껴지는 제품을 우선 추천했습니다.',

    system: {
      candidateCount: 16,
      model: 'gpt-4o',
      promptVersion: 'v1.2',
      errorType: '-',
    },
  },

  {
    id: 'AI_10029',
    userId: 'guest_7752',
    user: '게스트_7752',
    memberType: 'guest',

    date: '2026.09.03',
    time: '11:12',

    preference: '가벼움, 저도수',
    representativeProduct: '느린마을 막걸리',

    status: 'success',

    preferenceDetail: {
      sweetness: '은은한 단맛',
      acidity: '상관없음',
      body: '가볍고 깔끔',
      aroma: '은은함',
      alcohol: '10도 이하',
      avoidIngredients: '해당 없음',
    },

    result: {
      liquors: [
        '느린마을 막걸리',
        '복순도가 손막걸리',
        '청명주',
      ],

      foods: [
        '감자전',
        '두부김치',
        '약과',
      ],

      glasses: [
        '백자 술잔',
        '막걸리잔',
      ],
    },

    reason:
      '술을 가볍게 즐기고 싶은 사용자에게 부담이 적은 저도수 제품과 편하게 곁들일 수 있는 안주를 추천했습니다.',

    system: {
      candidateCount: 13,
      model: 'gpt-4o',
      promptVersion: 'v1.2',
      errorType: '-',
    },
  },
]


const topProducts = [
  {
    name: '복순도가 손막걸리',
    count: 52,
  },
  {
    name: '느린마을 막걸리',
    count: 43,
  },
  {
    name: '화요 25',
    count: 35,
  },
  {
    name: '오미자주',
    count: 29,
  },
  {
    name: '문배술',
    count: 23,
  },
]


// ========================================
// 요약 아이콘
// ========================================

const SummaryIcon = ({ type }) => {
  const icons = {
    total: (
      <>
        <rect
          x="4"
          y="4"
          width="16"
          height="16"
          rx="3"
        />
        <path d="M8 9h8M8 12h8M8 15h5" />
      </>
    ),

    week: (
      <>
        <rect
          x="3"
          y="5"
          width="18"
          height="16"
          rx="2"
        />
        <path d="M7 3v4M17 3v4M3 10h18" />
      </>
    ),

    success: (
      <>
        <circle
          cx="12"
          cy="12"
          r="9"
        />
        <path d="m8 12 2.5 2.5L16 9" />
      </>
    ),

    fail: (
      <>
        <circle
          cx="12"
          cy="12"
          r="9"
        />
        <path d="m9 9 6 6M15 9l-6 6" />
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
// AI 추천 관리
// ========================================

const AiLogManage = () => {
  const [
    searchQuery,
    setSearchQuery,
  ] = useState('')

  const [
    memberFilter,
    setMemberFilter,
  ] = useState('all')

  const [
    statusFilter,
    setStatusFilter,
  ] = useState('all')

  const [
    currentPage,
    setCurrentPage,
  ] = useState(1)

  const [
    selectedId,
    setSelectedId,
  ] = useState(null)

  const [
    detailStep,
    setDetailStep,
  ] = useState(1)

  const [
    topPeriod,
    setTopPeriod,
  ] = useState('all')


  // ========================================
  // 필터
  // ========================================

  const filteredLogs =
    useMemo(() => {
      const keyword =
        searchQuery
          .trim()
          .toLowerCase()

      return mockLogs.filter(
        (log) => {
          const matchesSearch =
            !keyword ||
            [
              log.id,
              log.userId,
              log.user,
              log.preference,
              log.representativeProduct,
            ].some((value) =>
              String(value || '')
                .toLowerCase()
                .includes(keyword)
            )

          const matchesMember =
            memberFilter === 'all' ||
            log.memberType ===
              memberFilter

          const matchesStatus =
            statusFilter === 'all' ||
            log.status ===
              statusFilter

          return (
            matchesSearch &&
            matchesMember &&
            matchesStatus
          )
        }
      )
    }, [
      searchQuery,
      memberFilter,
      statusFilter,
    ])


  // ========================================
  // 페이지네이션
  // ========================================

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredLogs.length /
          PAGE_SIZE
      )
    )

  const safeCurrentPage =
    Math.min(
      currentPage,
      totalPages
    )

  const visibleLogs =
    filteredLogs.slice(
      (safeCurrentPage - 1) *
        PAGE_SIZE,

      safeCurrentPage *
        PAGE_SIZE
    )


  useEffect(() => {
    setCurrentPage(1)
  }, [
    searchQuery,
    memberFilter,
    statusFilter,
  ])


  const pageNumbers =
    Array.from(
      {
        length:
          Math.min(
            totalPages,
            3
          ),
      },
      (_, index) =>
        index + 1
    )


  // ========================================
  // 선택된 상세
  // ========================================

  const selectedLog =
    mockLogs.find(
      (log) =>
        log.id === selectedId
    ) || null


  // ========================================
  // 상세 열기
  // 무조건 1단계부터 시작
  // ========================================

  const openDetail = (log) => {
    setSelectedId(log.id)
    setDetailStep(1)
  }


  // ========================================
  // 필터 초기화
  // ========================================

  const resetFilters = () => {
    setSearchQuery('')
    setMemberFilter('all')
    setStatusFilter('all')
    setCurrentPage(1)
  }


  const summaryCards = [
    {
      key: 'summaryTotal',
      icon: 'total',
      label: '전체 추천 횟수',
      value: 128,
      unit: '건',
    },
    {
      key: 'summaryWeek',
      icon: 'week',
      label: '최근 7일 추천',
      value: 30,
      unit: '건',
    },
    {
      key: 'summarySuccess',
      icon: 'success',
      label: '추천 성공률',
      value: 12,
      unit: '건',
    },
    {
      key: 'summaryFail',
      icon: 'fail',
      label: '추천 실패',
      value: 8,
      unit: '건',
    },
  ]


  return (
    <section
      className={styles.page}
      aria-labelledby="ai-log-title"
    >

      {/* ========================================
          제목
      ======================================== */}

      <header
        className={styles.pageHeader}
      >
        <h1 id="ai-log-title">
          AI 추천 기록 관리
        </h1>
      </header>


      {/* ========================================
          전통 문양
      ======================================== */}

      <img
        className={styles.topOrnament}
        src={adminTopOrnament}
        alt=""
        aria-hidden="true"
      />


      {/* ========================================
          요약 카드
      ======================================== */}

      <section
        className={styles.summaryArea}
        aria-label="AI 추천 현황"
      >
        <div
          className={styles.summaryGrid}
        >
          {summaryCards.map(
            (card) => (
              <article
                key={card.key}
                className={
                  styles.summaryCard
                }
              >
                <span
                  className={`${styles.summaryIcon} ${styles[card.key]}`}
                >
                  <SummaryIcon
                    type={card.icon}
                  />
                </span>

                <div
                  className={
                    styles.summaryContent
                  }
                >
                  <span>
                    {card.label}
                  </span>

                  <strong>
                    {card.value}

                    <em>
                      {card.unit}
                    </em>
                  </strong>
                </div>
              </article>
            )
          )}
        </div>
      </section>


      {/* ========================================
          본문
      ======================================== */}

      <div
        className={
          styles.managementGrid
        }
      >

        {/* ========================================
            왼쪽 목록
        ======================================== */}

        <section
          className={styles.mainSection}
        >

          {/* 필터 */}

          <div
            className={styles.filterBar}
          >
            <label
              className={
                styles.searchField
              }
            >
              <span
                className={styles.srOnly}
              >
                AI 추천 검색
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
                onChange={(event) =>
                  setSearchQuery(
                    event.target.value
                  )
                }
                placeholder="사용자 ID, 추천 ID, 상품명으로 검색"
              />
            </label>


            <label
              className={
                styles.selectField
              }
            >
              <span
                className={styles.srOnly}
              >
                회원 유형
              </span>

              <select
                value={memberFilter}
                onChange={(event) =>
                  setMemberFilter(
                    event.target.value
                  )
                }
              >
                <option value="all">
                  회원 유형
                </option>

                <option value="member">
                  회원
                </option>

                <option value="guest">
                  비회원
                </option>
              </select>
            </label>


            <label
              className={
                styles.selectField
              }
            >
              <span
                className={styles.srOnly}
              >
                추천 상태
              </span>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target.value
                  )
                }
              >
                <option value="all">
                  추천 상태
                </option>

                <option value="success">
                  성공
                </option>

                <option value="failed">
                  실패
                </option>
              </select>
            </label>


            <button
              type="button"
              className={
                styles.resetButton
              }
              onClick={resetFilters}
            >
              초기화
            </button>
          </div>


          {/* 목록 제목 */}

          <div
            className={
              styles.listHeading
            }
          >
            <h2>
              AI 추천 기록
            </h2>

            <span>
              총 {filteredLogs.length}건
            </span>
          </div>


          {/* 테이블 */}

          <div
            className={styles.tableWrap}
          >
            <table
              className={styles.logTable}
            >
              <thead>
                <tr>
                  <th>추천 ID</th>
                  <th>사용자</th>
                  <th>회원 유형</th>
                  <th>추천 일자</th>
                  <th>사용자 취향 요약</th>
                  <th>대표 추천 상품</th>
                  <th>상태</th>
                  <th>관리</th>
                </tr>
              </thead>

              <tbody>
                {visibleLogs.length > 0 ? (
                  visibleLogs.map(
                    (log) => (
                      <tr
                        key={log.id}
                        className={
                          selectedId === log.id
                            ? styles.selectedRow
                            : ''
                        }
                      >
                        <td>
                          {log.id}
                        </td>

                        <td>
                          {log.user}
                        </td>

                        <td>
                          <span
                            className={`${styles.memberBadge} ${
                              log.memberType ===
                              'member'
                                ? styles.member
                                : styles.guest
                            }`}
                          >
                            {log.memberType ===
                            'member'
                              ? '회원'
                              : '비회원'}
                          </span>
                        </td>

                        <td>
                          {log.date}
                        </td>

                        <td
                          className={
                            styles.preferenceCell
                          }
                          title={
                            log.preference
                          }
                        >
                          {log.preference}
                        </td>

                        <td
                          className={
                            styles.productCell
                          }
                        >
                          {
                            log.representativeProduct
                          }
                        </td>

                        <td>
                          <span
                            className={`${styles.statusBadge} ${
                              log.status ===
                              'success'
                                ? styles.successStatus
                                : styles.failStatus
                            }`}
                          >
                            <i />

                            {log.status ===
                            'success'
                              ? '성공'
                              : '실패'}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className={
                              styles.detailButton
                            }
                            onClick={() =>
                              openDetail(log)
                            }
                          >
                            상세 보기
                          </button>
                        </td>
                      </tr>
                    )
                  )
                ) : (
                  <tr>
                    <td
                      colSpan="8"
                      className={
                        styles.emptyState
                      }
                    >
                      검색 조건에 맞는
                      추천 기록이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>


          {/* 페이지네이션 */}

          <nav
            className={
              styles.pagination
            }
          >
            <button
              type="button"
              disabled={
                safeCurrentPage === 1
              }
              onClick={() =>
                setCurrentPage(
                  (page) =>
                    Math.max(
                      1,
                      page - 1
                    )
                )
              }
            >
              ‹
            </button>

            {pageNumbers.map(
              (page) => (
                <button
                  type="button"
                  key={page}
                  className={
                    page ===
                    safeCurrentPage
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
              disabled={
                safeCurrentPage ===
                totalPages
              }
              onClick={() =>
                setCurrentPage(
                  (page) =>
                    Math.min(
                      totalPages,
                      page + 1
                    )
                )
              }
            >
              ›
            </button>
          </nav>

        </section>


        {/* ========================================
            오른쪽 영역
        ======================================== */}

        {!selectedLog ? (
          <aside
            className={
              styles.analyticsColumn
            }
          >

            {/* 회원 / 비회원 */}

            <section
              className={
                styles.analyticsCard
              }
            >
              <h2>
                회원/비회원 이용 비율
              </h2>

              <div
                className={
                  styles.memberRatioArea
                }
              >
                <div
                  className={
                    styles.donutChart
                  }
                >
                  <div>
                    <span>전체</span>
                    <strong>
                      1,234건
                    </strong>
                  </div>
                </div>

                <ul
                  className={
                    styles.ratioLegend
                  }
                >
                  <li>
                    <i
                      className={
                        styles.memberDot
                      }
                    />
                    회원
                  </li>

                  <li>
                    <i
                      className={
                        styles.guestDot
                      }
                    />
                    비회원
                  </li>
                </ul>
              </div>

              <div
                className={
                  styles.ratioNotice
                }
              >
                <span>ⓘ</span>
                비회원의 AI 추천 비중이
                꾸준히 증가하고 있습니다.
              </div>
            </section>


            {/* TOP 5 */}

            <section
              className={
                styles.analyticsCard
              }
            >
              <div
                className={
                  styles.topHeader
                }
              >
                <h2>
                  추천 상품 TOP 5
                </h2>

                <select
                  value={topPeriod}
                  onChange={(event) =>
                    setTopPeriod(
                      event.target.value
                    )
                  }
                >
                  <option value="all">
                    전체 기간
                  </option>

                  <option value="7">
                    최근 7일
                  </option>

                  <option value="30">
                    최근 30일
                  </option>
                </select>
              </div>

              <div
                className={
                  styles.topProductList
                }
              >
                {topProducts.map(
                  (product, index) => (
                    <div
                      className={
                        styles.topProductRow
                      }
                      key={product.name}
                    >
                      <span
                        className={
                          styles.rank
                        }
                      >
                        {index + 1}
                      </span>

                      <strong>
                        {product.name}
                      </strong>

                      <span
                        className={
                          styles.barTrack
                        }
                      >
                        <i
                          style={{
                            width:
                              `${
                                (
                                  product.count /
                                  topProducts[0]
                                    .count
                                ) * 100
                              }%`,
                          }}
                        />
                      </span>

                      <small>
                        {product.count}회
                      </small>
                    </div>
                  )
                )}
              </div>
            </section>

          </aside>
        ) : (
          <aside
            className={
              styles.detailPanel
            }
          >

            <h2>
              AI 추천 상세
            </h2>


            {/* ========================================
                상세 1단계
                기본 정보 + 회원 취향 정보
            ======================================== */}

            {detailStep === 1 && (
              <div
                className={
                  styles.detailPage
                }
              >

                {/* 기본 정보 */}

                <section
                  className={
                    styles.detailSection
                  }
                >
                  <h3>
                    기본 정보
                  </h3>

                  <dl
                    className={
                      styles.detailInfoList
                    }
                  >
                    <div>
                      <dt>추천 ID</dt>
                      <dd>
                        {selectedLog.id}
                      </dd>
                    </div>

                    <div>
                      <dt>사용자 ID</dt>
                      <dd>
                        {
                          selectedLog.userId
                        }
                      </dd>
                    </div>

                    <div>
                      <dt>사용자</dt>
                      <dd>
                        {selectedLog.user}
                      </dd>
                    </div>

                    <div>
                      <dt>회원 유형</dt>
                      <dd>
                        <span
                          className={`${styles.memberBadge} ${
                            selectedLog.memberType ===
                            'member'
                              ? styles.member
                              : styles.guest
                          }`}
                        >
                          {selectedLog.memberType ===
                          'member'
                            ? '회원'
                            : '비회원'}
                        </span>
                      </dd>
                    </div>

                    <div>
                      <dt>추천 일자</dt>
                      <dd>
                        {
                          selectedLog.date
                        }
                      </dd>
                    </div>

                    <div>
                      <dt>추천 시간</dt>
                      <dd>
                        {
                          selectedLog.time
                        }
                      </dd>
                    </div>

                    <div>
                      <dt>추천 상태</dt>
                      <dd>
                        <span
                          className={`${styles.statusBadge} ${
                            selectedLog.status ===
                            'success'
                              ? styles.successStatus
                              : styles.failStatus
                          }`}
                        >
                          <i />

                          {selectedLog.status ===
                          'success'
                            ? '성공'
                            : '실패'}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </section>


                {/* 회원 취향 정보 */}

                <section
                  className={
                    styles.detailSection
                  }
                >
                  <h3>
                    회원 취향 정보
                  </h3>

                  <dl
                    className={
                      styles.detailInfoList
                    }
                  >
                    <div>
                      <dt>단맛 선호</dt>

                      <dd>
                        {
                          selectedLog
                            .preferenceDetail
                            .sweetness
                        }
                      </dd>
                    </div>

                    <div>
                      <dt>산미 선호</dt>

                      <dd>
                        {
                          selectedLog
                            .preferenceDetail
                            .acidity
                        }
                      </dd>
                    </div>

                    <div>
                      <dt>바디감</dt>

                      <dd>
                        {
                          selectedLog
                            .preferenceDetail
                            .body
                        }
                      </dd>
                    </div>

                    <div>
                      <dt>향의 강도</dt>

                      <dd>
                        {
                          selectedLog
                            .preferenceDetail
                            .aroma
                        }
                      </dd>
                    </div>

                    <div>
                      <dt>선호 도수</dt>

                      <dd>
                        {
                          selectedLog
                            .preferenceDetail
                            .alcohol
                        }
                      </dd>
                    </div>

                    <div>
                      <dt>
                        회피 재료
                      </dt>

                      <dd>
                        {
                          selectedLog
                            .preferenceDetail
                            .avoidIngredients
                        }
                      </dd>
                    </div>
                  </dl>
                </section>


                {/* 다음 */}

                <div
                  className={
                    styles.nextArea
                  }
                >
                  <button
                    type="button"
                    className={
                      styles.nextButton
                    }
                    onClick={() =>
                      setDetailStep(2)
                    }
                  >
                    다음 →
                  </button>
                </div>

              </div>
            )}


            {/* ========================================
                상세 2단계
                추천 결과 + 이유 + 시스템 정보
            ======================================== */}

            {detailStep === 2 && (
              <div
                className={
                  styles.detailPage
                }
              >

                {/* AI 추천 결과 */}

                <section
                  className={
                    styles.detailSection
                  }
                >
                  <h3>
                    AI 추천 결과
                  </h3>

                  <dl
                    className={
                      styles.resultList
                    }
                  >
                    <div>
                      <dt>
                        추천 전통주(3)
                      </dt>

                      <dd>
                        {selectedLog
                          .result
                          .liquors
                          .length > 0
                          ? selectedLog.result.liquors.join(
                              ', '
                            )
                          : '-'}
                      </dd>
                    </div>

                    <div>
                      <dt>
                        추천 안주(3)
                      </dt>

                      <dd>
                        {selectedLog
                          .result
                          .foods
                          .length > 0
                          ? selectedLog.result.foods.join(
                              ', '
                            )
                          : '-'}
                      </dd>
                    </div>

                    <div>
                      <dt>
                        추천 술잔(2)
                      </dt>

                      <dd>
                        {selectedLog
                          .result
                          .glasses
                          .length > 0
                          ? selectedLog.result.glasses.join(
                              ', '
                            )
                          : '-'}
                      </dd>
                    </div>
                  </dl>
                </section>


                {/* 추천 이유 */}

                <section
                  className={
                    styles.detailSection
                  }
                >
                  <h3>
                    추천 이유
                  </h3>

                  <div
                    className={
                      styles.reasonBox
                    }
                  >
                    {selectedLog.reason}
                  </div>
                </section>


                {/* 시스템 정보 */}

                <section
                  className={
                    styles.detailSection
                  }
                >
                  <h3>
                    시스템 정보
                  </h3>

                  <dl
                    className={
                      styles.detailInfoList
                    }
                  >
                    <div>
                      <dt>
                        후보 상품 수
                      </dt>

                      <dd>
                        {
                          selectedLog
                            .system
                            .candidateCount
                        }
                        개
                      </dd>
                    </div>

                    <div>
                      <dt>
                        모델 버전
                      </dt>

                      <dd>
                        {
                          selectedLog
                            .system
                            .model
                        }
                      </dd>
                    </div>

                    <div>
                      <dt>
                        프롬프트 버전
                      </dt>

                      <dd>
                        {
                          selectedLog
                            .system
                            .promptVersion
                        }
                      </dd>
                    </div>

                    <div>
                      <dt>
                        오류 여부
                      </dt>

                      <dd
                        className={
                          selectedLog.status ===
                          'failed'
                            ? styles.errorText
                            : ''
                        }
                      >
                        {
                          selectedLog
                            .system
                            .errorType
                        }
                      </dd>
                    </div>
                  </dl>
                </section>


                {/* 이전 */}

                <div
                  className={
                    styles.prevArea
                  }
                >
                  <button
                    type="button"
                    className={
                      styles.prevButton
                    }
                    onClick={() =>
                      setDetailStep(1)
                    }
                  >
                    ← 이전
                  </button>
                </div>

              </div>
            )}

          </aside>
        )}

      </div>

    </section>
  )
}


export default AiLogManage