import { useEffect, useMemo, useRef, useState } from 'react'
import adminTopOrnament from '../../assets/images/admin/adminTopOrnament.svg'
import styles from './NoticeManage.module.scss'

// ========================================
// 초기 공지사항 데이터 (세로 높이 균형을 위해 6개로 보강)
// ========================================
const initialNotices = [
  {
    id: 'NOTICE-01',
    title: '추석 연휴 배송 지연 및 고객센터 운영 안내',
    category: '배송',
    status: 'progress',
    isImportant: true,
    author: '운영자',
    createdAt: '2025.10.12 10:30',
    scheduledAt: '2025.10.13 11:50',
    target: '전체 회원',
    views: 2205,
    content: '안녕하세요, 전통주 플랫폼 자작(JAJAK)입니다. 다가오는 추석 연휴 기간 택배사 휴무로 인해 9월 28일 오후 2시 이후 주문 건은 연휴 이후 순차 발송됩니다.',
  },
  {
    id: 'NOTICE-02',
    title: '신규 전통주 AI 추천 서비스 "막동이" 오픈 이벤트',
    category: '이벤트',
    status: 'scheduled',
    isImportant: true,
    author: '마케팅팀',
    createdAt: '2025.10.11 14:00',
    scheduledAt: '2025.10.15 09:00',
    target: '전체 회원',
    views: 1874,
    content: '나만의 취향에 맞는 전통주를 찾아주는 AI 큐레이션 서비스 "막동이"가 정식 오픈합니다. 오픈 기념 첫 추천 이용 시 10% 할인 쿠폰을 드립니다!',
  },
  {
    id: 'NOTICE-03',
    title: '개인정보 처리방침 개정 안내 (제 4조 관련)',
    category: '정책',
    status: 'progress',
    isImportant: false,
    author: '법무팀',
    createdAt: '2025.10.05 09:15',
    scheduledAt: '-',
    target: '전체 회원',
    views: 940,
    content: '자작 서비스를 이용해 주시는 회원 여러분께 감사드리며, 개정된 개인정보 처리방침에 대해 안내해 드립니다.',
  },
  {
    id: 'NOTICE-04',
    title: '시스템 정기 점검에 따른 서비스 일시 중단 안내',
    category: '시스템',
    status: 'hidden',
    isImportant: false,
    author: '개발팀',
    createdAt: '2025.09.28 18:00',
    scheduledAt: '-',
    target: '로그인 회원',
    views: 520,
    content: '더 안정적인 서비스 제공을 위한 서버 DB 증설 및 최적화 점검이 진행됩니다.',
  },
  {
    id: 'NOTICE-05',
    title: '10월 전통주 시음회 참가자 선정 결과 발표',
    category: '기타',
    status: 'progress',
    isImportant: false,
    author: '운영자',
    createdAt: '2025.09.20 11:00',
    scheduledAt: '-',
    target: '전체 회원',
    views: 1120,
    content: '10월 문경 둘렛길 전통주 시음회 이벤트에 당첨되신 총 20분의 회원님들을 발표합니다.',
  },
  {
    id: 'NOTICE-06',
    title: '가을 시즌 한정 전통주 기획전 오픈 안내',
    category: '이벤트',
    status: 'progress',
    isImportant: false,
    author: 'MD팀',
    createdAt: '2025.09.15 09:00',
    scheduledAt: '-',
    target: '전체 회원',
    views: 3150,
    content: '선선한 가을 날씨와 가장 잘 어울리는 가을 한정 전통주 10선을 만나보세요.',
  },
]

const statusLabels = {
  progress: '게시 중',
  scheduled: '예약',
  hidden: '숨김',
}

const categories = ['전체 분류', '배송', '이벤트', '정책', '시스템', '기타']

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6v5h-5M4 18v-5h5" />
    <path d="M6.1 9a7 7 0 0 1 11.8-2.2L20 11M4 13l2.1 4.2A7 7 0 0 0 17.9 15" />
  </svg>
)

const NoticeManage = () => {
  const [notices, setNotices] = useState(initialNotices)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('전체 분류')
  const [statusFilter, setStatusFilter] = useState('all')
  const [activeCardKey, setActiveCardKey] = useState('total')
  const [selectedIds, setSelectedIds] = useState([])
  const [selectedNoticeId, setSelectedNoticeId] = useState(null)
  const [toastMessage, setToastMessage] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 외부 클릭 감지 Refs
  const tableRef = useRef(null)
  const panelRef = useRef(null)

  // 선택 공지 데이터
  const selectedNotice = notices.find((n) => n.id === selectedNoticeId) || null
  const [draftTitle, setDraftTitle] = useState('')
  const [draftCategory, setDraftCategory] = useState('배송')
  const [draftStatus, setDraftStatus] = useState('progress')
  const [draftIsImportant, setDraftIsImportant] = useState(false)
  const [draftContent, setDraftContent] = useState('')

  // 외부 빈 공간 클릭 시 통계 패널로 복귀
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!selectedNoticeId) return
      if (
        (panelRef.current && panelRef.current.contains(e.target)) ||
        (tableRef.current && tableRef.current.contains(e.target))
      ) {
        return
      }
      setSelectedNoticeId(null)
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [selectedNoticeId])

  // 새로고침 핸들러
  const handleRefresh = () => {
    setIsRefreshing(true)
    setNotices(initialNotices)
    setTimeout(() => {
      setIsRefreshing(false)
      setToastMessage('공지사항 목록을 새로고침했습니다.')
      setTimeout(() => setToastMessage(''), 2500)
    }, 600)
  }

  // 지표 계산
  const totalCount = notices.length
  const progressCount = notices.filter((n) => n.status === 'progress').length
  const scheduledCount = notices.filter((n) => n.status === 'scheduled').length
  const importantCount = notices.filter((n) => n.isImportant).length

  const summaryCards = [
    { key: 'total', label: '전체 공지', value: totalCount, unit: '건', caption: '등록된 전체 공지' },
    { key: 'progress', label: '게시 중', value: progressCount, unit: '건', caption: '현재 노출 중인 공지' },
    { key: 'scheduled', label: '예약 게시', value: scheduledCount, unit: '건', caption: '발행 대기 중인 공지' },
    { key: 'important', label: '중요 공지', value: importantCount, unit: '건', caption: '상단 고정 공지' },
  ]

  // 카드 클릭 필터 연동
  const handleCardClick = (key) => {
    setActiveCardKey(key)
    setSearchQuery('')
    setCategoryFilter('전체 분류')

    if (key === 'total') setStatusFilter('all')
    else if (key === 'progress') setStatusFilter('progress')
    else if (key === 'scheduled') setStatusFilter('scheduled')
    else if (key === 'important') setStatusFilter('important')
  }

  // 필터링 적용된 목록
  const filteredNotices = useMemo(() => {
    return notices.filter((n) => {
      const matchesQuery =
        !searchQuery.trim() ||
        n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        n.id.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesCategory = categoryFilter === '전체 분류' || n.category === categoryFilter

      let matchesStatus = true
      if (statusFilter === 'progress') matchesStatus = n.status === 'progress'
      else if (statusFilter === 'scheduled') matchesStatus = n.status === 'scheduled'
      else if (statusFilter === 'hidden') matchesStatus = n.status === 'hidden'
      else if (statusFilter === 'important') matchesStatus = n.isImportant

      return matchesQuery && matchesCategory && matchesStatus
    })
  }, [notices, searchQuery, categoryFilter, statusFilter])

  const handleSelectAll = (e) => {
    setSelectedIds(e.target.checked ? filteredNotices.map((n) => n.id) : [])
  }

  const handleSelectRow = (id, e) => {
    e.stopPropagation()
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]))
  }

  const openEditPanel = (notice) => {
    setSelectedNoticeId(notice.id)
    setDraftTitle(notice.title)
    setDraftCategory(notice.category)
    setDraftStatus(notice.status)
    setDraftIsImportant(notice.isImportant)
    setDraftContent(notice.content)
  }

  const handleSaveEdit = () => {
    if (!selectedNotice) return
    setNotices((prev) =>
      prev.map((n) =>
        n.id === selectedNotice.id
          ? {
              ...n,
              title: draftTitle,
              category: draftCategory,
              status: draftStatus,
              isImportant: draftIsImportant,
              content: draftContent,
            }
          : n
      )
    )
    setSelectedNoticeId(null)
    setToastMessage('공지사항이 성공적으로 수정되었습니다.')
    setTimeout(() => setToastMessage(''), 3000)
  }

  const handleDeleteNotice = () => {
    if (!selectedNotice) return
    if (window.confirm(`'${selectedNotice.title}' 공지를 정말 삭제하시겠습니까?`)) {
      setNotices((prev) => prev.filter((n) => n.id !== selectedNotice.id))
      setSelectedNoticeId(null)
      setToastMessage('공지사항이 삭제되었습니다.')
      setTimeout(() => setToastMessage(''), 3000)
    }
  }

  const resetFilters = () => {
    setSearchQuery('')
    setCategoryFilter('전체 분류')
    setStatusFilter('all')
    setActiveCardKey('total')
  }

  return (
    <section className={styles.page} aria-labelledby="notice-manage-title">
      {/* 툴바 */}
      <header className={styles.pageToolbar}>
        <h1 id="notice-manage-title">공지사항 관리</h1>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={isRefreshing ? styles.refreshing : ''}
        >
          <RefreshIcon />
          {isRefreshing ? '불러오는 중' : '새로 고침'}
        </button>
      </header>

      {/* 전통 문양 구분선 */}
      <div className={styles.ornamentLine} aria-hidden="true">
        <img src={adminTopOrnament} alt="" />
      </div>

      {/* 상단 4대 지표 카드 */}
      <section className={styles.summaryArea} aria-label="공지 현황 요약">
        <div className={styles.summaryGrid}>
          {summaryCards.map((card) => (
            <button
              key={card.key}
              type="button"
              className={`${styles.summaryCard} ${activeCardKey === card.key ? styles.activeCard : ''}`}
              onClick={() => handleCardClick(card.key)}
            >
              <span className={`${styles.summaryIcon} ${styles[card.key]}`} aria-hidden="true">
                <i>{card.value}</i>
              </span>
              <div className={styles.summaryContent}>
                <h3>{card.label}</h3>
                <p>
                  <strong>{card.value}</strong>
                  <span>{card.unit}</span>
                </p>
                <small>{card.caption}</small>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 메인 2단 그리드 */}
      <div className={styles.managementGrid}>
        {/* 좌측: 테이블 영역 */}
        <section className={styles.mainSection}>
          {/* 필터 바 */}
          <div className={styles.filterBar}>
            <label className={styles.searchField}>
              <span className={styles.srOnly}>공지 검색</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m16 16 4 4" />
              </svg>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="제목, 내용, 공지 ID 검색"
              />
            </label>

            <label className={styles.selectField}>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setActiveCardKey(null)
                }}
              >
                <option value="all">전체 상태</option>
                <option value="progress">게시 중</option>
                <option value="scheduled">예약 게시</option>
                <option value="hidden">숨김</option>
                <option value="important">중요 공지만</option>
              </select>
            </label>

            <label className={styles.selectField}>
              <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <button type="button" className={styles.resetButton} onClick={resetFilters}>
              초기화
            </button>
          </div>

          {/* 테이블 액션 헤더 */}
          <div className={styles.sectionHeading}>
            <div className={styles.titleWrap}>
              <h2>공지 목록</h2>
              <span>총 {filteredNotices.length}건</span>
            </div>
            <div className={styles.actions}>
              {selectedIds.length > 0 && (
                <button type="button" className={styles.bulkButton}>
                  선택 {selectedIds.length}개 숨김 처리
                </button>
              )}
              <button type="button" className={styles.registerButton}>
                + 새 공지 등록
              </button>
            </div>
          </div>

          {/* 테이블 영역 */}
          <div className={styles.tableWrap} ref={tableRef}>
            <table className={styles.dataTable}>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={filteredNotices.length > 0 && selectedIds.length === filteredNotices.length}
                    />
                  </th>
                  <th>공지 ID</th>
                  <th>제목</th>
                  <th>분류</th>
                  <th>작성일</th>
                  <th>게시 상태</th>
                  <th>중요 여부</th>
                  <th>노출 대상</th>
                  <th>조회수</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredNotices.map((n) => (
                  <tr
                    key={n.id}
                    className={`${styles.clickableRow} ${selectedNoticeId === n.id ? styles.selectedRow : ''}`}
                    onClick={() => openEditPanel(n)}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(n.id)}
                        onChange={(e) => handleSelectRow(n.id, e)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                    <td>
                      <strong>{n.id}</strong>
                    </td>
                    <td>
                      <span className={styles.noticeTitleText}>{n.title}</span>
                    </td>
                    <td>{n.category}</td>
                    <td>{n.createdAt.split(' ')[0]}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[n.status]}`}>
                        {statusLabels[n.status]}
                      </span>
                    </td>
                    <td>
                      <span className={n.isImportant ? styles.importantBadge : styles.normalBadge}>
                        {n.isImportant ? '중요' : '일반'}
                      </span>
                    </td>
                    <td>{n.target}</td>
                    <td>{n.views.toLocaleString()}</td>
                    <td>
                      <button
                        type="button"
                        className={styles.editBtn}
                        onClick={(e) => {
                          e.stopPropagation()
                          openEditPanel(n)
                        }}
                      >
                        수정하기
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 우측 패널 (공지 상세 및 수정 vs 평상시 통계 패널) */}
        {selectedNotice ? (
          <aside className={styles.editPanel} ref={panelRef} aria-labelledby="notice-detail-title">
            <header className={styles.panelTopHeader}>
              <h2 id="notice-detail-title">공지 상세 보기</h2>
              <button type="button" onClick={() => setSelectedNoticeId(null)} aria-label="닫기">
                ×
              </button>
            </header>

            <div className={styles.metaFormSection}>
              <div className={styles.metaHeaderTitle}>
                <input
                  type="text"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  placeholder="공지 제목을 입력하세요"
                />
                <label className={styles.importantCheckLabel}>
                  <input
                    type="checkbox"
                    checked={draftIsImportant}
                    onChange={(e) => setDraftIsImportant(e.target.checked)}
                  />
                  <span>중요 고정</span>
                </label>
              </div>

              <dl className={styles.metaDl}>
                <div>
                  <dt>공지 ID</dt>
                  <dd>{selectedNotice.id}</dd>
                </div>
                <div>
                  <dt>분류</dt>
                  <dd>
                    <select value={draftCategory} onChange={(e) => setDraftCategory(e.target.value)}>
                      {categories
                        .filter((c) => c !== '전체 분류')
                        .map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                    </select>
                  </dd>
                </div>
                <div>
                  <dt>게시 상태</dt>
                  <dd>
                    <select value={draftStatus} onChange={(e) => setDraftStatus(e.target.value)}>
                      <option value="progress">게시 중</option>
                      <option value="scheduled">예약</option>
                      <option value="hidden">숨김</option>
                    </select>
                  </dd>
                </div>
                <div>
                  <dt>작성일</dt>
                  <dd>{selectedNotice.createdAt}</dd>
                </div>
                <div>
                  <dt>게시일</dt>
                  <dd>{selectedNotice.scheduledAt}</dd>
                </div>
                <div>
                  <dt>노출 대상</dt>
                  <dd>{selectedNotice.target}</dd>
                </div>
                <div>
                  <dt>조회수</dt>
                  <dd>{selectedNotice.views.toLocaleString()}</dd>
                </div>
              </dl>
            </div>

            <div className={styles.previewSection}>
              <h4>본문 미리 보기 및 편집</h4>
              <textarea
                rows="6"
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                placeholder="공지사항 본문을 입력하세요..."
              />
            </div>

            <div className={styles.stepFooter}>
              <button type="button" className={styles.deleteBtn} onClick={handleDeleteNotice}>
                공지 삭제
              </button>
              <button type="button" className={styles.saveBtn} onClick={handleSaveEdit}>
                저장하기
              </button>
            </div>
          </aside>
        ) : (
          /* 평상시 우측 통계 패널 (도넛 & 바 차트) */
          <aside className={styles.analyticsColumn} ref={panelRef}>
            <section className={styles.analyticsCard}>
              <header className={styles.analyticsHeader}>
                <h2>공지 상태 분포</h2>
                <span>STATUS</span>
              </header>
              <div className={styles.statusOverview}>
                <div
                  className={styles.statusDonut}
                  style={{ '--active-rate': `${Math.round((progressCount / totalCount) * 100 || 0)}%` }}
                >
                  <span>전체</span>
                  <strong>{totalCount}건</strong>
                </div>
                <ul>
                  <li>
                    <span className={styles.dotProgress} />
                    <span>게시 중</span>
                    <strong>{progressCount}건</strong>
                  </li>
                  <li>
                    <span className={styles.dotScheduled} />
                    <span>예약 게시</span>
                    <strong>{scheduledCount}건</strong>
                  </li>
                  <li>
                    <span className={styles.dotImportant} />
                    <span>중요 고정</span>
                    <strong>{importantCount}건</strong>
                  </li>
                </ul>
              </div>
            </section>

            <section className={styles.analyticsCard}>
              <header className={styles.analyticsHeader}>
                <h2>분류별 공지 현황</h2>
                <span>CATEGORY</span>
              </header>
              <div className={styles.activityBars}>
                <div>
                  <span>배송</span>
                  <i><b style={{ width: '35%' }} /></i>
                  <strong>1건</strong>
                </div>
                <div>
                  <span>이벤트</span>
                  <i><b style={{ width: '70%' }} /></i>
                  <strong>2건</strong>
                </div>
                <div>
                  <span>정책</span>
                  <i><b style={{ width: '35%' }} /></i>
                  <strong>1건</strong>
                </div>
                <div>
                  <span>시스템</span>
                  <i><b style={{ width: '35%' }} /></i>
                  <strong>1건</strong>
                </div>
              </div>
              <p className={styles.analyticsCaption}>현재 등록 공지 데이터 집계 기준</p>
            </section>
          </aside>
        )}
      </div>

      {/* 토스트 알림 */}
      {toastMessage && (
        <div className={styles.toast} role="status">
          <span>{toastMessage}</span>
          <button type="button" onClick={() => setToastMessage('')}>×</button>
        </div>
      )}
    </section>
  )
}

export default NoticeManage