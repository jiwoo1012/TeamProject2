import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  collection,
  getDocs,
  query as firestoreQuery,
  where,
} from 'firebase/firestore'

import AdminEmptyState from '../../components/admin/AdminEmptyState'
import AdminFilterBar from '../../components/admin/AdminFilterBar'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminPanel from '../../components/admin/AdminPanel'
import AdminStatusBadge from '../../components/admin/AdminStatusBadge'
import AdminSummaryCard from '../../components/admin/AdminSummaryCard'

import { subscribeToAuthState } from '../../firebase/auth'
import { db } from '../../firebase/firebase'
import {
  getCollection,
  updateDocument,
} from '../../firebase/firestore'

import styles from './UserManage.module.scss'


// ========================================
// 날짜 처리
// ========================================

const toDate = (timestamp) => (
  timestamp?.toDate?.() || null
)


const formatDate = (timestamp) => {
  const date = toDate(timestamp)

  return date
    ? new Intl.DateTimeFormat('ko-CA').format(date)
    : '-'
}


const formatDateTime = (timestamp) => {
  const date = toDate(timestamp)

  if (!date) return '-'

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
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


const isWithinDays = (date, days) => {
  if (!date) return false

  const threshold = new Date()

  threshold.setHours(0, 0, 0, 0)
  threshold.setDate(
    threshold.getDate() - (days - 1)
  )

  return date >= threshold
}


// ========================================
// 표시 형식
// ========================================

const formatMemberId = (memberId = '') => (
  memberId.length > 14
    ? `${memberId.slice(0, 11)}…`
    : memberId
)


const formatTableEmail = (email = '') => {
  const atIndex = email.indexOf('@')

  if (atIndex < 0) {
    return email.length > 18
      ? `${email.slice(0, 15)}…`
      : email
  }

  const localPart = email.slice(0, atIndex)

  const visibleLocalPart =
    localPart.length > 15
      ? `${localPart.slice(0, 14)}…`
      : localPart

  return `${visibleLocalPart}@…`
}


// ========================================
// 회원 데이터
// ========================================

const toMember = (member) => ({
  id: member.id,

  nickname:
    member.nickname
    || member.email?.split('@')[0]
    || '회원',

  email: member.email || '-',

  joinedAt: formatDate(member.createdAt),
  createdAtDate: toDate(member.createdAt),

  lastLoginAt: formatDateTime(member.lastLoginAt),
  lastLoginDate: toDate(member.lastLoginAt),

  points: Number(member.points) || 0,

  isAdultVerified:
    member.isAdultVerified === true,

  status:
    member.status === 'suspended'
      ? 'suspended'
      : 'active',

  role:
    member.role === 'admin'
      ? 'admin'
      : 'user',

  orders: 0,
  recentOrders: 0,
  totalPurchase: 0,
  wishlist: 0,
})


const statusLabels = {
  active: '정상',
  suspended: '이용 정지',
}


const roleLabels = {
  user: '일반 회원',
  admin: '관리자',
}


// ========================================
// 아이콘
// ========================================

const UserAvatar = ({ nickname }) => (
  <span
    className={styles.avatar}
    aria-hidden="true"
  >
    {nickname.slice(0, 1)}
  </span>
)


const SummaryIcon = ({ type }) => {
  const iconProps = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  if (type === 'today') {
    return (
      <svg {...iconProps}>
        <circle cx="9" cy="8" r="3" />

        <path d="M3.5 19c.4-4 2.2-6 5.5-6s5.1 2 5.5 6M18 6v6M15 9h6" />
      </svg>
    )
  }


  if (type === 'suspended') {
    return (
      <svg {...iconProps}>
        <circle cx="9" cy="8" r="3" />

        <path d="M3.5 19c.4-4 2.2-6 5.5-6 1.3 0 2.4.3 3.3.9M16 16h6" />
      </svg>
    )
  }


  if (type === 'admin') {
    return (
      <svg {...iconProps}>
        <path d="M12 3 19 6v5c0 4.6-2.6 7.8-7 10-4.4-2.2-7-5.4-7-10V6l7-3Z" />

        <circle cx="12" cy="10" r="2" />

        <path d="M8.8 16c.5-2 1.6-3 3.2-3s2.7 1 3.2 3" />
      </svg>
    )
  }


  return (
    <svg {...iconProps}>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />

      <path d="M3.5 19c.4-4 2.2-6 5.5-6s5.1 2 5.5 6M15 14c2.9 0 4.6 1.7 5 5" />
    </svg>
  )
}


// ========================================
// Component
// ========================================

const UserManage = () => {
  const [members, setMembers] = useState([])

  const [isLoading, setIsLoading] =
    useState(true)

  const [loadError, setLoadError] =
    useState('')

  const [isSaving, setIsSaving] =
    useState(false)

  const [lastUpdatedAt, setLastUpdatedAt] =
    useState(null)

  const [searchQuery, setSearchQuery] =
    useState('')

  const [statusFilter, setStatusFilter] =
    useState('all')

  const [roleFilter, setRoleFilter] =
    useState('all')

  const [summaryFilter, setSummaryFilter] =
    useState('all')

  const [sortOrder, setSortOrder] =
    useState('newest')

  const [selectedId, setSelectedId] =
    useState(null)

  const [draftStatus, setDraftStatus] =
    useState('active')

  const [draftRole, setDraftRole] =
    useState('user')

  const [currentPage, setCurrentPage] =
    useState(1)

  const [toastMessage, setToastMessage] =
    useState('')

  const [
    confirmSuspension,
    setConfirmSuspension,
  ] = useState(false)


  // ========================================
  // 회원 조회
  // ========================================

  const loadMembers = useCallback(
    async (showRefreshToast = false) => {
    setIsLoading(true)
    setLoadError('')

    try {
      const docs =
        await getCollection('users')


      const nextMembers =
        await Promise.all(
          docs.map(async (doc) => {
            const member = toMember(doc)

            try {
              const [
                wishlist,
                orderSnapshot,
              ] = await Promise.all([
                getCollection(
                  `users/${doc.id}/wishlist`
                ),

                getDocs(
                  firestoreQuery(
                    collection(db, 'orders'),

                    where(
                      'userId',
                      '==',
                      doc.id
                    )
                  )
                ),
              ])


              const orders =
                orderSnapshot.docs.map(
                  (orderDoc) =>
                    orderDoc.data()
                )


              return {
                ...member,

                orders:
                  orders.length,

                recentOrders:
                  orders.filter(
                    (order) =>
                      isWithinDays(
                        toDate(order.createdAt),
                        7
                      )
                  ).length,

                totalPurchase:
                  orders.reduce(
                    (sum, order) =>
                      sum
                      + Number(
                        order.totalAmount
                        || 0
                      ),
                    0
                  ),

                wishlist:
                  wishlist.length,
              }
            } catch (error) {
              console.error(
                '회원 활동 요약 조회 실패:',
                error
              )

              return member
            }
          })
        )


      setMembers(nextMembers)
      setLastUpdatedAt(new Date())

      if (showRefreshToast) {
        setToastMessage(
          '회원 목록을 새로고침했습니다.'
        )
      }


      setSelectedId(
        (current) => (
          current
          && nextMembers.some(
            (member) =>
              member.id === current
          )
            ? current
            : null
        )
      )
    } catch (error) {
      console.error(
        '회원 목록 조회 실패:',
        error
      )

      setLoadError(
        '회원 목록을 불러오지 못했습니다. 관리자 권한을 확인해주세요.'
      )
    } finally {
      setIsLoading(false)
    }
  }, [])


  useEffect(() => {
  const unsubscribe =
    subscribeToAuthState((user) => {
      if (!user) {
        setMembers([])
        setIsLoading(false)

        return
      }

      loadMembers()
    })

  return () => {
    if (typeof unsubscribe === 'function') {
      unsubscribe()
    }
  }
}, [loadMembers])


// ========================================
// Toast 자동 닫기
// ========================================

useEffect(() => {
  if (!toastMessage) {
    return undefined
  }

  const timer = window.setTimeout(
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
  // 데이터 계산
  // ========================================

  const today =
    new Intl.DateTimeFormat(
      'ko-CA'
    ).format(new Date())


  const filteredMembers =
    useMemo(() => {
      const normalizedQuery =
        searchQuery
          .trim()
          .toLowerCase()


      return members
        .filter((member) => {
          const matchesQuery =
            !normalizedQuery
            || [
              member.nickname,
              member.email,
              member.id,
            ].some(
              (value) =>
                value
                  .toLowerCase()
                  .includes(
                    normalizedQuery
                  )
            )


          const matchesStatus =
            statusFilter === 'all'
            || member.status
              === statusFilter


          const matchesRole =
            roleFilter === 'all'
            || member.role
              === roleFilter


          const matchesSummary =
            summaryFilter !== 'today'
            || member.joinedAt
              === today


          return (
            matchesQuery
            && matchesStatus
            && matchesRole
            && matchesSummary
          )
        })

        .sort((a, b) => {
          if (sortOrder === 'name') {
            return a.nickname.localeCompare(
              b.nickname,
              'ko'
            )
          }


          if (sortOrder === 'oldest') {
            return (
              (
                a.createdAtDate
                  ?.getTime()
                || 0
              )
              -
              (
                b.createdAtDate
                  ?.getTime()
                || 0
              )
            )
          }


          return (
            (
              b.createdAtDate
                ?.getTime()
              || 0
            )
            -
            (
              a.createdAtDate
                ?.getTime()
              || 0
            )
          )
        })
    }, [
      members,
      roleFilter,
      searchQuery,
      sortOrder,
      statusFilter,
      summaryFilter,
      today,
    ])


  const selectedMember =
    members.find(
      (member) =>
        member.id === selectedId
    ) || null


  const pageSize = 10


  const totalPages =
    Math.max(
      1,
      Math.ceil(
        filteredMembers.length
        / pageSize
      )
    )


  const safeCurrentPage =
    Math.min(
      currentPage,
      totalPages
    )


  const visibleMembers =
    filteredMembers.slice(
      (
        safeCurrentPage - 1
      ) * pageSize,

      safeCurrentPage
      * pageSize
    )


  const suspendedCount =
    members.filter(
      (member) =>
        member.status
        === 'suspended'
    ).length


  const activeCount =
    members.length
    - suspendedCount


  const adminCount =
    members.filter(
      (member) =>
        member.role
        === 'admin'
    ).length

  const activeAdminCount =
    members.filter(
      (member) =>
        member.role === 'admin'
        && member.status === 'active'
    ).length


  const todayCount =
    members.filter(
      (member) =>
        member.joinedAt
        === today
    ).length


  const activeRate =
    members.length
      ? Math.round(
        (
          activeCount
          / members.length
        ) * 100
      )
      : 0


  const suspendedRate =
    members.length
      ? 100 - activeRate
      : 0


  const adminRate =
    members.length
      ? Math.round(
        (
          adminCount
          / members.length
        ) * 100
      )
      : 0


  const recentSignupCount =
    members.filter(
      (member) =>
        isWithinDays(
          member.createdAtDate,
          7
        )
    ).length


  // ========================================
  // 상단 카드
  // ========================================

  const summaryCards = [
    {
      key: 'total',
      label: '전체 회원 수',
      value: members.length,
      caption: `정상 이용 ${activeCount}명`,
    },
    {
      key: 'today',
      label: '오늘 가입',
      value: todayCount,
      caption:
        `최근 7일 ${recentSignupCount}명 가입`,
    },
    {
      key: 'suspended',
      label: '이용 정지',
      value: suspendedCount,
      caption:
        `전체 회원의 ${suspendedRate}%`,
    },
    {
      key: 'admin',
      label: '관리자 계정',
      value: adminCount,
      caption:
        `전체 회원의 ${adminRate}%`,
    },
  ]


  const activityItems = [
    {
      label: '최근 7일 가입',
      value: recentSignupCount,
    },
    {
      label: '최근 7일 로그인',
      value:
        members.filter(
          (member) =>
            isWithinDays(
              member.lastLoginDate,
              7
            )
        ).length,
    },
    {
      label: '최근 7일 주문',
      value:
        members.reduce(
          (sum, member) =>
            sum
            + member.recentOrders,
          0
        ),
    },
    {
      label: '찜 보유 회원',
      value:
        members.filter(
          (member) =>
            member.wishlist > 0
        ).length,
    },
  ]


  const maxActivity =
    Math.max(
      1,
      ...activityItems.map(
        (item) => item.value
      )
    )


  // ========================================
  // 필터
  // ========================================

  const resetFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setRoleFilter('all')
    setSummaryFilter('all')
    setSortOrder('newest')
    setCurrentPage(1)
  }


  const handleSummaryFilter = (key) => {
    setSearchQuery('')

    setSummaryFilter(
      key === 'today'
        ? 'today'
        : 'all'
    )

    setStatusFilter(
      key === 'suspended'
        ? 'suspended'
        : 'all'
    )

    setRoleFilter(
      key === 'admin'
        ? 'admin'
        : 'all'
    )

    setCurrentPage(1)
    setSelectedId(null)
  }


  const activeSummaryKey =
    summaryFilter === 'today'
      ? 'today'
      : statusFilter === 'suspended'
        && roleFilter === 'all'
        ? 'suspended'
        : roleFilter === 'admin'
          && statusFilter === 'all'
          ? 'admin'
          : statusFilter === 'all'
            && roleFilter === 'all'
            ? 'total'
            : null


  // ========================================
  // 상세
  // ========================================

  const openDetailPanel = (member) => {
    setSelectedId(member.id)

    setDraftStatus(
      member.status
    )

    setDraftRole(
      member.role
    )

    setConfirmSuspension(false)
  }


  const closeDetailPanel = () => {
    setSelectedId(null)
    setConfirmSuspension(false)
  }


  const saveMemberChanges =
    async () => {
      if (!selectedMember) return


      if (
        selectedMember.role === 'admin'
        && selectedMember.status === 'active'
        && (
          draftRole !== 'admin'
          || draftStatus !== 'active'
        )
        && activeAdminCount <= 1
      ) {
        setToastMessage(
          '최소 한 명의 정상 관리자 계정이 필요합니다.'
        )

        return
      }


      if (
        draftStatus === 'suspended'
        && selectedMember.status
          !== 'suspended'
        && !confirmSuspension
      ) {
        setConfirmSuspension(true)

        return
      }


      setIsSaving(true)


      try {
        await updateDocument(
          'users',
          selectedMember.id,
          {
            status: draftStatus,
            role: draftRole,
          }
        )


        setMembers(
          (currentMembers) =>
            currentMembers.map(
              (member) => (
                member.id
                  === selectedMember.id
                  ? {
                    ...member,
                    status:
                      draftStatus,
                    role:
                      draftRole,
                  }
                  : member
              )
            )
        )


        setConfirmSuspension(false)

        setToastMessage(
          `${selectedMember.nickname} 회원 정보가 변경되었습니다.`
        )
      } catch (error) {
        console.error(
          '회원 정보 저장 실패:',
          error
        )

        setToastMessage(
          '회원 정보 저장에 실패했습니다.'
        )
      } finally {
        setIsSaving(false)
      }
    }


  // ========================================
  // Render
  // ========================================

  return (
    <section
      className={styles.page}
      aria-labelledby="user-manage-title"
    >
      {/* ========================================
          제목
      ======================================== */}

      <AdminPageHeader
        title="회원 관리"
        titleId="user-manage-title"
        onRefresh={() =>
          loadMembers(true)
        }
        isRefreshing={isLoading}
      />


      {/* ========================================
          회원 현황
      ======================================== */}

      <section
        className={styles.summaryArea}
        aria-label="회원 현황 요약"
      >
        <div className={styles.summaryGrid}>
          {summaryCards.map((card) => (
            <AdminSummaryCard
              key={card.key}
              icon={
                <SummaryIcon
                  type={card.key}
                />
              }
              label={card.label}
              value={
                card.value.toLocaleString(
                  'ko-KR'
                )
              }
              unit="명"
              caption={card.caption}
              tone={
                card.key === 'suspended'
                  ? 'danger'
                  : card.key === 'admin'
                    ? 'info'
                    : card.key === 'today'
                      ? 'warning'
                      : 'primary'
              }
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
          ))}
        </div>
      </section>


      {/* ========================================
          회원 관리 본문
      ======================================== */}

      <div className={styles.managementGrid}>
        {/* 회원 목록 */}

        <section
          className={styles.memberSection}
          aria-labelledby="member-list-title"
        >
          {/* 검색 / 필터 */}

          <AdminFilterBar
            searchValue={searchQuery}
            onSearchChange={(value) => {
              setSearchQuery(value)
              setCurrentPage(1)
            }}
            searchPlaceholder="이름, 이메일, 회원 ID 검색"
            searchLabel="회원 검색"
            onReset={resetFilters}
          >
            <label className={styles.selectField}>
              <span className={styles.srOnly}>
                회원 상태
              </span>

              <select
                value={statusFilter}
                onChange={(event) => {
                  setStatusFilter(
                    event.target.value
                  )

                  setSummaryFilter('all')
                  setCurrentPage(1)
                }}
              >
                <option value="all">
                  전체 상태
                </option>

                <option value="active">
                  정상
                </option>

                <option value="suspended">
                  이용 정지
                </option>
              </select>
            </label>


            <label className={styles.selectField}>
              <span className={styles.srOnly}>
                회원 권한
              </span>

              <select
                value={roleFilter}
                onChange={(event) => {
                  setRoleFilter(
                    event.target.value
                  )

                  setSummaryFilter('all')
                  setCurrentPage(1)
                }}
              >
                <option value="all">
                  전체 권한
                </option>

                <option value="user">
                  일반 회원
                </option>

                <option value="admin">
                  관리자
                </option>
              </select>
            </label>


            <label className={styles.selectField}>
              <span className={styles.srOnly}>
                정렬
              </span>

              <select
                value={sortOrder}
                onChange={(event) =>
                  setSortOrder(
                    event.target.value
                  )
                }
              >
                <option value="newest">
                  최근 가입순
                </option>

                <option value="oldest">
                  오래된 가입순
                </option>

                <option value="name">
                  이름순
                </option>
              </select>
            </label>
          </AdminFilterBar>


          {/* 회원 목록 제목 */}

          <div className={styles.sectionHeading}>
            <div>
              <h2 id="member-list-title">
                회원 목록
              </h2>

            </div>

            <span className={styles.memberCount}>
              총{' '}
              <strong>
                {filteredMembers.length.toLocaleString(
                  'ko-KR'
                )}
              </strong>
              명
            </span>
          </div>


          {/* 회원 목록 */}

          {isLoading ? (
            <AdminEmptyState
              title="회원 목록을 불러오는 중입니다."
              description="잠시만 기다려주세요."
            />
          ) : loadError ? (
            <AdminEmptyState
              title="회원 목록을 불러오지 못했습니다."
              description={loadError}
              action={
                <button
                  type="button"
                  onClick={loadMembers}
                >
                  다시 불러오기
                </button>
              }
            />
          ) : filteredMembers.length === 0 ? (
            <AdminEmptyState
              title="검색 결과가 없습니다."
              description="검색어나 필터 조건을 다시 확인해주세요."
            />
          ) : (
            <div className={styles.tableWrap}>
              <table className={styles.memberTable}>
                <thead>
                  <tr>
                    <th scope="col">
                      회원 ID
                    </th>

                    <th scope="col">
                      이름
                    </th>

                    <th scope="col">
                      이메일
                    </th>

                    <th scope="col">
                      가입일
                    </th>

                    <th scope="col">
                      최근 로그인
                    </th>

                    <th scope="col">
                      상태
                    </th>

                    <th scope="col">
                      권한
                    </th>

                    <th scope="col">
                      관리
                    </th>
                  </tr>
                </thead>


                <tbody>
                  {visibleMembers.map(
                    (member) => (
                      <tr
                        key={member.id}
                        className={
                          selectedId
                          === member.id
                            ? styles.selectedRow
                            : ''
                        }
                      >
                        <td>
                          <span
                            className={styles.memberId}
                            title={member.id}
                          >
                            {formatMemberId(
                              member.id
                            )}
                          </span>
                        </td>

                        <td>
                          <strong
                            className={
                              styles.memberName
                            }
                          >
                            {member.nickname}
                          </strong>
                        </td>

                        <td>
                          <span
                            className={
                              styles.memberEmail
                            }
                            title={member.email}
                          >
                            {formatTableEmail(
                              member.email
                            )}
                          </span>
                        </td>

                        <td>
                          {member.joinedAt}
                        </td>

                        <td>
                          <span
                            className={
                              styles.lastLogin
                            }
                          >
                            {member.lastLoginAt}
                          </span>
                        </td>

                        <td>
                          <AdminStatusBadge
                            tone={
                              member.status
                              === 'active'
                                ? 'success'
                                : 'danger'
                            }
                          >
                            {
                              statusLabels[
                                member.status
                              ]
                            }
                          </AdminStatusBadge>
                        </td>

                        <td>
                          <AdminStatusBadge
                            tone={
                              member.role
                              === 'admin'
                                ? 'info'
                                : 'neutral'
                            }
                          >
                            {
                              roleLabels[
                                member.role
                              ]
                            }
                          </AdminStatusBadge>
                        </td>

                        <td>
                          <button
                            type="button"
                            className={
                              styles.viewButton
                            }
                            onClick={() =>
                              openDetailPanel(
                                member
                              )
                            }
                          >
                            상세 보기
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>


              {totalPages > 1 && (
                <nav
                  className={
                    styles.pagination
                  }
                  aria-label="회원 목록 페이지"
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
                        safeCurrentPage - 1
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
                  ))}


                  <button
                    type="button"
                    aria-label="다음 페이지"
                    disabled={
                      safeCurrentPage
                      === totalPages
                    }
                    onClick={() =>
                      setCurrentPage(
                        safeCurrentPage + 1
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

        {selectedMember ? (
          // 회원 상세

          <aside
            className={styles.detailPanel}
            aria-labelledby="member-detail-title"
          >
            <header className={styles.detailHeader}>
              <div>
                <h2 id="member-detail-title">
                  회원 상세
                </h2>
              </div>

              <button
                type="button"
                onClick={closeDetailPanel}
                aria-label="회원 상세 닫기"
              >
                ×
              </button>
            </header>


            <div className={styles.profileSummary}>
              <UserAvatar
                nickname={
                  selectedMember.nickname
                }
              />

              <div>
                <strong>
                  {selectedMember.nickname}
                </strong>

                <span>
                  {selectedMember.email}
                </span>

                <small>
                  회원 ID
                  <br />

                  {selectedMember.id}
                </small>
              </div>
            </div>


            <section className={styles.detailBlock}>
              <h3>
                기본 정보
              </h3>

              <dl>
                <div>
                  <dt>
                    가입일
                  </dt>

                  <dd>
                    {selectedMember.joinedAt}
                  </dd>
                </div>

                <div>
                  <dt>
                    최근 로그인
                  </dt>

                  <dd>
                    {
                      selectedMember
                        .lastLoginAt
                    }
                  </dd>
                </div>

                <div>
                  <dt>
                    성인 인증
                  </dt>

                  <dd>
                    <AdminStatusBadge
                      tone={
                        selectedMember
                          .isAdultVerified
                          ? 'success'
                          : 'neutral'
                      }
                      size="small"
                    >
                      {
                        selectedMember
                          .isAdultVerified
                          ? '인증 완료'
                          : '미인증'
                      }
                    </AdminStatusBadge>
                  </dd>
                </div>
              </dl>
            </section>


            <section className={styles.detailBlock}>
              <h3>
                계정 관리
              </h3>

              <div className={styles.accountFields}>
                <label>
                  <span>
                    현재 상태
                  </span>

                  <select
                    value={draftStatus}
                    onChange={(event) => {
                      setDraftStatus(
                        event.target.value
                      )

                      setConfirmSuspension(
                        false
                      )
                    }}
                  >
                    <option value="active">
                      정상
                    </option>

                    <option value="suspended">
                      이용 정지
                    </option>
                  </select>
                </label>


                <label>
                  <span>
                    회원 권한
                  </span>

                  <select
                    value={draftRole}
                    onChange={(event) =>
                      setDraftRole(
                        event.target.value
                      )
                    }
                  >
                    <option value="user">
                      일반 회원
                    </option>

                    <option value="admin">
                      관리자
                    </option>
                  </select>
                </label>
              </div>
            </section>


            <section className={styles.detailBlock}>
              <h3>
                활동 요약
              </h3>

              <div className={styles.activityCards}>
                <article>
                  <span>
                    주문 횟수
                  </span>

                  <strong>
                    {
                      selectedMember.orders
                    }
                    <small>
                      건
                    </small>
                  </strong>
                </article>


                <article>
                  <span>
                    총 구매 금액
                  </span>

                  <strong>
                    {
                      selectedMember
                        .totalPurchase
                        .toLocaleString(
                          'ko-KR'
                        )
                    }
                    <small>
                      원
                    </small>
                  </strong>
                </article>


                <article>
                  <span>
                    찜 목록
                  </span>

                  <strong>
                    {
                      selectedMember
                        .wishlist
                    }
                    <small>
                      개
                    </small>
                  </strong>
                </article>


                <article>
                  <span>
                    보유 포인트
                  </span>

                  <strong>
                    {
                      selectedMember
                        .points
                        .toLocaleString(
                          'ko-KR'
                        )
                    }
                    <small>
                      P
                    </small>
                  </strong>
                </article>
              </div>
            </section>


            {confirmSuspension && (
              <div
                className={
                  styles.suspensionConfirm
                }
                role="alert"
              >
                <strong>
                  이용 정지 상태로
                  변경됩니다.
                </strong>

                <span>
                  저장 버튼을 눌러 적용해주세요.
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setConfirmSuspension(
                      false
                    )
                  }
                >
                  취소
                </button>
              </div>
            )}


            <footer className={styles.detailFooter}>
              <button
                type="button"
                className={
                  styles.suspendButton
                }
                onClick={() => {
                  setDraftStatus(
                    'suspended'
                  )

                  setConfirmSuspension(
                    true
                  )
                }}
              >
                이용 정지
              </button>


              <button
                type="button"
                className={
                  styles.saveButton
                }
                disabled={isSaving}
                onClick={
                  saveMemberChanges
                }
              >
                {isSaving
                  ? '저장 중...'
                  : '변경사항 저장'}
              </button>
            </footer>
          </aside>
        ) : (
          // 회원 분석

          <aside
            className={styles.analyticsColumn}
            aria-label="회원 분석"
          >
            <AdminPanel
              title="회원 상태 분포"
              padding="compact"
            >
              <div className={styles.statusOverview}>
                <div
                  className={styles.statusDonut}
                  style={{
                    '--active-rate':
                      `${activeRate}%`,
                  }}
                >
                  <div>
                    <span>
                      전체 회원
                    </span>

                    <strong>
                      {members.length.toLocaleString(
                        'ko-KR'
                      )}

                      <small>
                        명
                      </small>
                    </strong>
                  </div>
                </div>


                <ul>
                  <li>
                    <span
                      className={
                        styles.activeDot
                      }
                    />

                    <span>
                      정상
                    </span>

                    <strong>
                      {activeCount}명
                    </strong>
                  </li>


                  <li>
                    <span
                      className={
                        styles.suspendedDot
                      }
                    />

                    <span>
                      이용 정지
                    </span>

                    <strong>
                      {suspendedCount}명
                    </strong>
                  </li>
                </ul>
              </div>
            </AdminPanel>


            <AdminPanel
              title="회원 활동 요약"
              padding="compact"
            >
              <div className={styles.activityBars}>
                {activityItems.map(
                  (item) => (
                    <div
                      key={item.label}
                      className={
                        styles.activityBarItem
                      }
                    >
                      <div
                        className={
                          styles.activityBarHeader
                        }
                      >
                        <span>
                          {item.label}
                        </span>

                        <strong>
                          {item.value}명
                        </strong>
                      </div>

                      <i>
                        <b
                          style={{
                            width:
                              `${
                                (
                                  item.value
                                  / maxActivity
                                )
                                * 100
                              }%`,
                          }}
                        />
                      </i>
                    </div>
                  )
                )}
              </div>


              <p className={styles.analyticsCaption}>
                현재 조회 데이터 기준:  

                {lastUpdatedAt && (
                  <strong>
                    {formatDateTimeLabel(
                      lastUpdatedAt
                    )}
                  </strong>
                )}
              </p>
            </AdminPanel>
          </aside>
        )}
      </div>


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


export default UserManage