import { useEffect, useMemo, useRef, useState } from 'react'
import adminTopOrnament from '../../assets/images/admin/adminTopOrnament.svg'
import styles from './EventManage.module.scss'

// ========================================
// 초기 이벤트 데이터
// ========================================
const initialEvents = [
  {
    id: 'EVT-1001',
    title: '막동이와 함께 둘렛길 둘러보자',
    category: '동행형',
    type: 'companion',
    status: 'progress', // progress: 진행 중, upcoming: 예정, ended: 종료
    dDay: 'D-40',
    period: '2026.05.13 ~ 2026.10.12',
    applicants: 258,
    announcementDate: '2026.10.12',
    target: '전체 로그인 회원',
    method: '이벤트 페이지에서 응모하기 버튼 클릭',
    description: '전통주를 사랑하는 분들과 함께 문경 둘렛길을 거닐며 전통주를 시음하는 오프라인 동행 이벤트입니다.',
    views: 1420,
    winnersCount: 20,
  },
  {
    id: 'EVT-1002',
    title: '여름맞이 전통주 페어링 백서 댓글 퀴즈',
    category: '응모형',
    type: 'quiz',
    status: 'progress',
    dDay: 'D-5',
    period: '2026.08.01 ~ 2026.09.10',
    applicants: 1240,
    announcementDate: '2026.09.12',
    target: '일반 회원 이상',
    method: '퀴즈 정답 댓글 작성',
    description: '여름 안주와 가장 잘 어울리는 전통주를 맞추고 경품을 받아가세요!',
    views: 4300,
    winnersCount: 50,
  },
  {
    id: 'EVT-1003',
    title: '조선시대 주막 체험단 모집',
    category: '체험단',
    type: 'experience',
    status: 'upcoming',
    dDay: 'D-3',
    period: '2026.09.15 ~ 2026.09.30',
    applicants: 89,
    announcementDate: '2026.10.01',
    target: '지정 등급 회원',
    method: '지원서 작성 및 SNS 공유',
    description: '막동이 주막 콘셉트의 팝업스토어에 초대합니다.',
    views: 920,
    winnersCount: 10,
  },
  {
    id: 'EVT-1004',
    title: '추석 명절 전통주 선물세트 사전 예약 이벤트',
    category: '할인형',
    type: 'discount',
    status: 'ended',
    dDay: '종료',
    period: '2026.07.01 ~ 2026.08.15',
    applicants: 3100,
    announcementDate: '2026.08.18',
    target: '전체 회원',
    method: '자동 적용 할인 쿠폰',
    description: '추석 명절을 맞아 사랑하는 사람들에게 우리술을 선물하세요.',
    views: 8900,
    winnersCount: 100,
  },
]

const statusLabels = {
  progress: '진행 중',
  upcoming: '예정',
  ended: '종료',
}

const typeLabels = {
  companion: '동행형',
  quiz: '응모형',
  experience: '체험단',
  discount: '할인형',
}

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6v5h-5M4 18v-5h5" />
    <path d="M6.1 9a7 7 0 0 1 11.8-2.2L20 11M4 13l2.1 4.2A7 7 0 0 0 17.9 15" />
  </svg>
)

const EventManage = () => {
  const [events, setEvents] = useState(initialEvents)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('전체 유형')
  const [activeTab, setActiveTab] = useState('all') // 상단 탭 필터 (all, progress, upcoming, ended)
  const [activeCardKey, setActiveCardKey] = useState('total') // 요약 카드 클릭 필터
  const [selectedEventId, setSelectedEventId] = useState(null)
  const [activeDetailTab, setActiveDetailTab] = useState('info') // 우측 상세 패널 내부 탭
  const [toastMessage, setToastMessage] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 외부 클릭 감지 Refs
  const gridRef = useRef(null)
  const panelRef = useRef(null)

  const selectedEvent = events.find((ev) => ev.id === selectedEventId) || null
  const [draftTitle, setDraftTitle] = useState('')
  const [draftPeriod, setDraftPeriod] = useState('')
  const [draftStatus, setDraftStatus] = useState('progress')
  const [draftDescription, setDraftDescription] = useState('')

  // 외부 클릭 시 패널 닫기
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!selectedEventId) return
      if (
        (panelRef.current && panelRef.current.contains(e.target)) ||
        (gridRef.current && gridRef.current.contains(e.target))
      ) {
        return
      }
      setSelectedEventId(null)
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [selectedEventId])

  // 새로고침 핸들러
  const handleRefresh = () => {
    setIsRefreshing(true)
    setEvents(initialEvents)
    setTimeout(() => {
      setIsRefreshing(false)
      setToastMessage('이벤트 목록을 새로고침했습니다.')
      setTimeout(() => setToastMessage(''), 2500)
    }, 600)
  }

  // 지표 카운트 계산
  const totalCount = events.length
  const progressCount = events.filter((ev) => ev.status === 'progress').length
  const upcomingCount = events.filter((ev) => ev.status === 'upcoming').length
  const endedCount = events.filter((ev) => ev.status === 'ended').length
  const totalApplicants = events.reduce((sum, ev) => sum + ev.applicants, 0)

  const summaryCards = [
    { key: 'totalApplicants', label: '총 응모 수', value: totalApplicants.toLocaleString(), unit: '건', caption: '누적 참여 건수' },
    { key: 'pendingWinner', label: '당첨자 발표 대기', value: '2', unit: '건', caption: '즉시 추첨 필요' },
    { key: 'unannounced', label: '당첨자 미발표', value: '1', unit: '건', caption: '기한 초과 주의' },
    { key: 'todayClosing', label: '오늘 마감 이벤트', value: '1', unit: '개', caption: '실시간 마감 임박' },
  ]

  // 상단 요약 카드 클릭 필터
  const handleCardClick = (key) => {
    setActiveCardKey(key)
    if (key === 'todayClosing') {
      setActiveTab('progress')
    } else {
      setActiveTab('all')
    }
  }

  // 필터링된 이벤트 목록
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchesQuery = !searchQuery.trim() || ev.title.toLowerCase().includes(searchQuery.toLowerCase()) || ev.id.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesTab = activeTab === 'all' || ev.status === activeTab
      const matchesType = typeFilter === '전체 유형' || ev.category === typeFilter
      return matchesQuery && matchesTab && matchesType
    })
  }, [events, searchQuery, activeTab, typeFilter])

  // 이벤트 수정 패널 열기
  const openEditPanel = (ev) => {
    setSelectedEventId(ev.id)
    setActiveDetailTab('info')
    setDraftTitle(ev.title)
    setDraftPeriod(ev.period)
    setDraftStatus(ev.status)
    setDraftDescription(ev.description)
  }

  const handleSaveEdit = () => {
    if (!selectedEvent) return
    setEvents((prev) =>
      prev.map((ev) =>
        ev.id === selectedEvent.id
          ? { ...ev, title: draftTitle, period: draftPeriod, status: draftStatus, description: draftDescription }
          : ev
      )
    )
    setSelectedEventId(null)
    setToastMessage('이벤트 정보가 수정되었습니다.')
    setTimeout(() => setToastMessage(''), 3000)
  }

  const handleDeleteEvent = () => {
    if (!selectedEvent) return
    if (window.confirm(`'${selectedEvent.title}' 이벤트를 정말 삭제하시겠습니까?`)) {
      setEvents((prev) => prev.filter((ev) => ev.id !== selectedEvent.id))
      setSelectedEventId(null)
      setToastMessage('이벤트가 삭제되었습니다.')
      setTimeout(() => setToastMessage(''), 3000)
    }
  }

  return (
    <section className={styles.page} aria-labelledby="event-manage-title">
      {/* 툴바 */}
      <header className={styles.pageToolbar}>
        <h1 id="event-manage-title">이벤트 관리</h1>
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

      {/* 상단 상태별 탭 필터 + 등록 버튼 바 */}
      <div className={styles.topFilterBar}>
        <div className={styles.tabGroup}>
          <button
            type="button"
            className={activeTab === 'all' ? styles.activeTab : ''}
            onClick={() => { setActiveTab('all'); setActiveCardKey(null); }}
          >
            전체 이벤트 <span>{totalCount}</span>
          </button>
          <button
            type="button"
            className={activeTab === 'progress' ? styles.activeTab : ''}
            onClick={() => { setActiveTab('progress'); setActiveCardKey(null); }}
          >
            진행 중 <span>{progressCount}</span>
          </button>
          <button
            type="button"
            className={activeTab === 'upcoming' ? styles.activeTab : ''}
            onClick={() => { setActiveTab('upcoming'); setActiveCardKey(null); }}
          >
            예정 <span>{upcomingCount}</span>
          </button>
          <button
            type="button"
            className={activeTab === 'ended' ? styles.activeTab : ''}
            onClick={() => { setActiveTab('ended'); setActiveCardKey(null); }}
          >
            종료 <span>{endedCount}</span>
          </button>
        </div>

        <button type="button" className={styles.registerButton}>
          + 새 이벤트 등록
        </button>
      </div>

      {/* 상단 4대 핵심 지표 카드 */}
      <section className={styles.summaryArea} aria-label="이벤트 지표 요약">
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

      {/* 메인 2단 그리드 (좌: 이벤트 카드 리스트 / 우: 상세 및 수정 패널) */}
      <div className={styles.managementGrid}>
        
        {/* 좌측 영역: 검색 필터 + 이벤트 카드 그리드 */}
        <section className={styles.mainSection}>
          <div className={styles.filterBar}>
            <label className={styles.searchField}>
              <span className={styles.srOnly}>이벤트 검색</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m16 16 4 4" /></svg>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="이벤트명 검색"
              />
            </label>

            <label className={styles.selectField}>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="전체 유형">전체 유형</option>
                <option value="동행형">동행형</option>
                <option value="응모형">응모형</option>
                <option value="체험단">체험단</option>
                <option value="할인형">할인형</option>
              </select>
            </label>

            <button
              type="button"
              className={styles.resetButton}
              onClick={() => { setSearchQuery(''); setTypeFilter('전체 유형'); setActiveTab('all'); setActiveCardKey('total'); }}
            >
              초기화
            </button>
          </div>

          {/* 이벤트 카드 그리드 목록 */}
          <div className={styles.eventGridContainer} ref={gridRef}>
            {filteredEvents.length === 0 ? (
              <div className={styles.emptyState}>검색 결과가 없습니다.</div>
            ) : (
              filteredEvents.map((ev) => (
                <article
                  key={ev.id}
                  className={`${styles.eventCard} ${selectedEventId === ev.id ? styles.selectedCard : ''}`}
                  onClick={() => openEditPanel(ev)}
                >
                  <div className={styles.cardHeaderRow}>
                    <div className={styles.badges}>
                      <span className={`${styles.statusBadge} ${styles[ev.status]}`}>{statusLabels[ev.status]}</span>
                      <span className={styles.dDayBadge}>{ev.dDay}</span>
                    </div>
                    <span className={styles.evId}>{ev.id}</span>
                  </div>

                  <div className={styles.cardBodyRow}>
                    <div className={styles.evThumbPlaceholder} aria-hidden="true" />
                    <div className={styles.evTextInfo}>
                      <h3 title={ev.title}>{ev.title}</h3>
                      <p>{ev.period}</p>
                      <small>{ev.category} 스포트라이트 조건</small>
                    </div>
                  </div>

                  <div className={styles.cardFooterRow}>
                    <div className={styles.statPill}>
                      <span>응모 수</span>
                      <strong>{ev.applicants.toLocaleString()}건</strong>
                    </div>
                    <div className={styles.statPill}>
                      <span>당첨자 발표일</span>
                      <strong>{ev.announcementDate}</strong>
                    </div>
                  </div>

                  <div className={styles.cardActionRow} onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      className={styles.manageBtn}
                      onClick={() => openEditPanel(ev)}
                    >
                      상세 보기
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

        {/* 우측 패널 (이벤트 상세 보기 / 탭형 수정) */}
        {selectedEvent ? (
          <aside className={styles.detailPanel} ref={panelRef} aria-labelledby="event-detail-title">
            <header className={styles.panelTopHeader}>
              <h2 id="event-detail-title">이벤트 상세 보기</h2>
              <button type="button" onClick={() => setSelectedEventId(null)} aria-label="닫기">×</button>
            </header>

            {/* 선택 이벤트 요약 카드 */}
            <div className={styles.selectedSummaryCard}>
              <div className={styles.scThumb} />
              <div className={styles.scInfo}>
                <span className={`${styles.statusBadge} ${styles[selectedEvent.status]}`}>{statusLabels[selectedEvent.status]}</span>
                <h3 title={draftTitle}>{draftTitle}</h3>
                <dl>
                  <div><dt>이벤트 ID</dt><dd>{selectedEvent.id}</dd></div>
                  <div><dt>이벤트 유형</dt><dd>{selectedEvent.category} ({selectedEvent.type})</dd></div>
                  <div><dt>생성일</dt><dd>{selectedEvent.announcementDate}</dd></div>
                </dl>
              </div>
            </div>

            {/* 내부 탭 네비게이션 */}
            <nav className={styles.detailTabNav} aria-label="이벤트 상세 관리 탭">
              <button
                type="button"
                className={activeDetailTab === 'info' ? styles.activeDetailTab : ''}
                onClick={() => setActiveDetailTab('info')}
              >
                기본 정보
              </button>
              <button
                type="button"
                className={activeDetailTab === 'prize' ? styles.activeDetailTab : ''}
                onClick={() => setActiveDetailTab('prize')}
              >
                경품
              </button>
              <button
                type="button"
                className={activeDetailTab === 'applicants' ? styles.activeDetailTab : ''}
                onClick={() => setActiveDetailTab('applicants')}
              >
                응모 현황
              </button>
              <button
                type="button"
                className={activeDetailTab === 'winners' ? styles.activeDetailTab : ''}
                onClick={() => setActiveDetailTab('winners')}
              >
                당첨자 관리
              </button>
              <button
                type="button"
                className={activeDetailTab === 'history' ? styles.activeDetailTab : ''}
                onClick={() => setActiveDetailTab('history')}
              >
                히스토리
              </button>
            </nav>

            {/* 탭 1: 기본 정보 수정 폼 */}
            {activeDetailTab === 'info' && (
              <div className={styles.detailFormBody}>
                <div className={styles.inputGroup}>
                  <label>이벤트 타이틀 *</label>
                  <input type="text" value={draftTitle} onChange={(e) => setDraftTitle(e.target.value)} />
                </div>

                <div className={styles.inputGroup}>
                  <label>이벤트 기간 *</label>
                  <input type="text" value={draftPeriod} onChange={(e) => setDraftPeriod(e.target.value)} />
                </div>

                <div className={styles.inputGroup}>
                  <label>진행 상태 *</label>
                  <select value={draftStatus} onChange={(e) => setDraftStatus(e.target.value)}>
                    <option value="progress">진행 중</option>
                    <option value="upcoming">예정</option>
                    <option value="ended">종료</option>
                  </select>
                </div>

                <div className={styles.inputGroup}>
                  <label>참여 대상</label>
                  <span className={styles.readOnlyText}>{selectedEvent.target}</span>
                </div>

                <div className={styles.inputGroup}>
                  <label>응모 방법</label>
                  <span className={styles.readOnlyText}>{selectedEvent.method}</span>
                </div>

                <div className={styles.inputGroup}>
                  <label>상세 설명</label>
                  <textarea rows="3" value={draftDescription} onChange={(e) => setDraftDescription(e.target.value)} />
                </div>
              </div>
            )}

            {/* 탭 2~5 간이 컨텐츠 (포트폴리오 시연용) */}
            {activeDetailTab !== 'info' && (
              <div className={styles.dummyTabContent}>
                <p>현재 <strong>{activeDetailTab.toUpperCase()}</strong> 관리 모듈입니다.</p>
                <span>실시간 데이터 연동 후 상세 내역이 출력됩니다.</span>
              </div>
            )}

            <div className={styles.panelFooterActions}>
              <button type="button" className={styles.deleteBtn} onClick={handleDeleteEvent}>이벤트 삭제</button>
              <button type="button" className={styles.saveBtn} onClick={handleSaveEdit}>저장</button>
            </div>
          </aside>
        ) : (
          /* 평상시 우측 공백 위젯 (가이드 영역) */
          <aside className={styles.analyticsColumn} ref={panelRef}>
            <section className={styles.analyticsCard}>
              <header className={styles.analyticsHeader}>
                <h2>이벤트 운영 가이드</h2>
                <span>GUIDE</span>
              </header>
              <div className={styles.guideBox}>
                <p>좌측 목록에서 이벤트를 선택하거나 <strong>+ 새 이벤트 등록</strong>을 통해 캠페인을 시작하세요.</p>
                <ul>
                  <li>당첨자 발표일은 마감 직후 3일 이내 지정을 권장합니다.</li>
                  <li>전통주 동행형 이벤트는 사전 답사 로그가 필수입니다.</li>
                </ul>
              </div>
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

export default EventManage