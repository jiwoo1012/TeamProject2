import { useEffect, useMemo, useRef, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import adminTopOrnament from '../../assets/images/admin/adminTopOrnament.svg'
import ticketIcon from '../../assets/icons/ticket.png'
import waitingIcon from '../../assets/icons/waiting.png'
import pendingIcon from '../../assets/icons/pending.png'
import endIcon from '../../assets/icons/end.png'
import eventsData from '../../data/events.json'
import { db } from '../../firebase/firebase'
import { addDocument, deleteDocument, updateDocument } from '../../firebase/firestore'
import styles from './EventManage.module.scss'

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

const parseDate = (value) => value ? new Date(`${value}T00:00:00`) : null
const dateText = (value) => value || '-'
const getEventType = (title = '') => title.includes('퀴즈') ? 'quiz' : title.includes('카드') ? 'companion' : title.includes('룰렛') ? 'experience' : 'discount'
const normalizeEvent = (source, fallbackId, applicants = 0) => {
  const event = source.event ?? source
  const startDate = event.eventPeriod?.startDate ?? event.startDate ?? ''
  const endDate = event.eventPeriod?.endDate ?? event.endDate ?? ''
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const start = parseDate(startDate)
  const end = parseDate(endDate)
  let status = event.status
  if (!status) status = event.isActive === false || (end && end < today) ? 'ended' : (start && start > today ? 'upcoming' : 'progress')
  const remaining = end ? Math.ceil((end - today) / 86400000) : null
  return {
    ...event,
    id: event.eventId ?? source.id ?? fallbackId,
    title: event.title ?? '제목 없는 이벤트',
    category: typeLabels[event.type] ?? (getEventType(event.title) === 'quiz' ? '응모형' : '동행형'),
    type: event.type ?? getEventType(event.title),
    status,
    dDay: status === 'ended' ? '종료' : remaining === 0 ? 'D-DAY' : remaining > 0 ? `D-${remaining}` : '진행 중',
    period: `${dateText(startDate)} ~ ${dateText(endDate)}`,
    startDate,
    endDate,
    applicants: Number(event.applicants ?? applicants ?? 0),
    announcementDate: event.announcementDate ?? '-',
    target: event.target ?? '로그인 회원',
    method: event.method ?? '이벤트 페이지에서 참여',
    description: event.detailDescription ?? event.description ?? '',
    shortDescription: event.description ?? '',
    participationLimit: event.participationLimit ?? { type: 'per_user_total', maxCount: 1 },
    precautions: event.precautions ?? [],
    image: event.image ?? {},
    isActive: status !== 'ended',
    winnersAnnounced: Boolean(event.winnersAnnounced),
  }
}

const fallbackEvents = eventsData.map((item, index) => normalizeEvent(item, `event-${index + 1}`))
const eventBannerImages = import.meta.glob('../../assets/images/banner/eventBanner*.png', { eager: true, import: 'default' })
const resolveEventBanner = (image = {}) => {
  const source = image.bannerUrl ?? image.url ?? ''
  if (/^(data:|https?:\/\/)/.test(source)) return source
  const fileName = source.split('/').pop()
  return Object.entries(eventBannerImages).find(([path]) => path.endsWith(`/${fileName}`))?.[1]
}

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6v5h-5M4 18v-5h5" />
    <path d="M6.1 9a7 7 0 0 1 11.8-2.2L20 11M4 13l2.1 4.2A7 7 0 0 0 17.9 15" />
  </svg>
)

const EventManage = () => {
  const [events, setEvents] = useState(fallbackEvents)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('전체 유형')
  const [activeTab, setActiveTab] = useState('all') // 상단 탭 필터 (all, progress, upcoming, ended)
  const [activeCardKey, setActiveCardKey] = useState('total') // 요약 카드 클릭 필터
  const [selectedEventId, setSelectedEventId] = useState(null)
  const [activeDetailTab, setActiveDetailTab] = useState('info') // 우측 상세 패널 내부 탭
  const [toastMessage, setToastMessage] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [panelMode, setPanelMode] = useState('guide')
  const [participationCounts, setParticipationCounts] = useState({})
  const [newEvent, setNewEvent] = useState({ title: '', description: '', detailDescription: '', startDate: '', endDate: '', type: 'quiz', maxCount: 1, announcementDate: '', bannerUrl: '' })

  // 외부 클릭 감지 Refs
  const gridRef = useRef(null)
  const panelRef = useRef(null)

  const selectedEvent = events.find((ev) => ev.id === selectedEventId) || null
  const [draftTitle, setDraftTitle] = useState('')
  const [draftPeriod, setDraftPeriod] = useState('')
  const [draftStatus, setDraftStatus] = useState('progress')
  const [draftDescription, setDraftDescription] = useState('')
  const [draftBanner, setDraftBanner] = useState('')

  useEffect(() => onSnapshot(collection(db, 'eventParticipations'), (snapshot) => {
    const counts = {}
    snapshot.docs.forEach((item) => {
      const eventId = item.data().eventId
      if (eventId) counts[eventId] = (counts[eventId] ?? 0) + 1
    })
    setParticipationCounts(counts)
  }, () => setParticipationCounts({})), [])

  useEffect(() => onSnapshot(collection(db, 'events'), (snapshot) => {
    if (snapshot.empty) {
      setEvents(fallbackEvents)
      return
    }
    setEvents(snapshot.docs.map((item) => normalizeEvent({ id: item.id, ...item.data() }, item.id, participationCounts[item.id])))
  }, () => setEvents(fallbackEvents)), [participationCounts])

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
  const totalApplicants = events.reduce((sum, ev) => sum + Number(participationCounts[ev.id] ?? ev.applicants ?? 0), 0)
  const pendingWinnerCount = 0
  const unannouncedCount = 0
  const todayKey = new Date().toLocaleDateString('sv-SE')
  const todayClosingCount = events.filter((event) => event.endDate === todayKey).length

  const summaryCards = [
    { key: 'totalApplicants', label: '총 응모 수', value: totalApplicants.toLocaleString(), unit: '건', caption: '누적 참여 건수', icon: ticketIcon },
    { key: 'pendingWinner', label: '당첨자 발표 대기', value: pendingWinnerCount, unit: '건', caption: '즉시 추첨 필요', icon: waitingIcon },
    { key: 'unannounced', label: '당첨자 미발표', value: unannouncedCount, unit: '건', caption: '기한 초과 주의', icon: pendingIcon },
    { key: 'todayClosing', label: '오늘 마감 이벤트', value: todayClosingCount, unit: '개', caption: '실시간 마감 임박', icon: endIcon },
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
    setPanelMode('detail')
    setSelectedEventId(ev.id)
    setActiveDetailTab('info')
    setDraftTitle(ev.title)
    setDraftPeriod(ev.period)
    setDraftStatus(ev.status)
    setDraftDescription(ev.description)
    setDraftBanner(resolveEventBanner(ev.image) ?? '')
  }

  const handleBannerChange = (event, isNewEvent = false) => {
    const file = event.target.files?.[0]
    if (!file?.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => {
      const image = new Image()
      image.onload = () => {
        const maxWidth = 1200
        const scale = Math.min(1, maxWidth / image.width)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(image.width * scale)
        canvas.height = Math.round(image.height * scale)
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height)
        const bannerUrl = canvas.toDataURL('image/jpeg', 0.78)
        if (isNewEvent) setNewEvent((current) => ({ ...current, bannerUrl }))
        else setDraftBanner(bannerUrl)
      }
      image.src = reader.result
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const handleSaveEdit = async () => {
    if (!selectedEvent) return
    const [startDate, endDate] = draftPeriod.split('~').map((value) => value.trim())
    try {
      await updateDocument('events', selectedEvent.id, { title: draftTitle, description: draftDescription, detailDescription: draftDescription, eventPeriod: { startDate, endDate }, isActive: draftStatus !== 'ended', status: draftStatus, image: { ...selectedEvent.image, bannerUrl: draftBanner } })
    } catch (error) {
      console.error('이벤트 수정 실패:', error)
      setToastMessage('이벤트 정보를 수정하지 못했습니다.')
      return
    }
    setSelectedEventId(null)
    setToastMessage('이벤트 정보가 수정되었습니다.')
    setTimeout(() => setToastMessage(''), 3000)
  }

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return
    if (window.confirm(`'${selectedEvent.title}' 이벤트를 정말 삭제하시겠습니까?`)) {
      try { await deleteDocument('events', selectedEvent.id) } catch (error) { console.error('이벤트 삭제 실패:', error); setToastMessage('이벤트를 삭제하지 못했습니다.'); return }
      setSelectedEventId(null)
      setToastMessage('이벤트가 삭제되었습니다.')
      setTimeout(() => setToastMessage(''), 3000)
    }
  }

  const handleCreateEvent = async (event) => {
    event.preventDefault()
    if (!newEvent.title.trim() || !newEvent.startDate || !newEvent.endDate) return
    try {
      await addDocument('events', {
        title: newEvent.title.trim(), description: newEvent.description.trim(), detailDescription: newEvent.detailDescription.trim() || newEvent.description.trim(),
        type: newEvent.type, eventPeriod: { startDate: newEvent.startDate, endDate: newEvent.endDate }, announcementDate: newEvent.announcementDate || null,
        participationLimit: { type: 'per_user_total', maxCount: Number(newEvent.maxCount) || 1 }, precautions: ['본 이벤트는 회원 로그인 후 참여 가능합니다.'], isActive: true,
        image: { bannerUrl: newEvent.bannerUrl ?? '' },
      })
      setNewEvent({ title: '', description: '', detailDescription: '', startDate: '', endDate: '', type: 'quiz', maxCount: 1, announcementDate: '', bannerUrl: '' })
      setPanelMode('guide')
      setToastMessage('새 이벤트가 등록되었습니다.')
      setTimeout(() => setToastMessage(''), 3000)
    } catch (error) { console.error('이벤트 등록 실패:', error); setToastMessage('이벤트를 등록하지 못했습니다. 관리자 권한을 확인해주세요.') }
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

        <div className={styles.managementButtons}>
          <button type="button" className={styles.winnerButton} onClick={() => { setSelectedEventId(null); setPanelMode('winners') }}>당첨자 관리</button>
          <button type="button" className={styles.registerButton} onClick={() => { setSelectedEventId(null); setPanelMode('register') }}>+ 새 이벤트 등록</button>
        </div>
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
                <img src={card.icon} alt="" />
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
                    <div className={styles.evThumbPlaceholder}>{resolveEventBanner(ev.image) && <img src={resolveEventBanner(ev.image)} alt="" />}</div>
                    <div className={styles.evTextInfo}>
                      <h3 title={ev.title}>{ev.title}</h3>
                      <p>{ev.period}</p>
                      <small>{ev.category} 스포트라이트 조건</small>
                    </div>
                  </div>

                  <div className={styles.cardFooterRow}>
                    <div className={styles.statPill}>
                      <span>응모 수</span>
                      <strong>{Number(participationCounts[ev.id] ?? ev.applicants ?? 0).toLocaleString()}건</strong>
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
        {panelMode === 'register' ? (
          <aside className={styles.detailPanel} ref={panelRef} aria-labelledby="new-event-title">
            <header className={styles.panelTopHeader}><h2 id="new-event-title">새 이벤트 등록</h2><button type="button" onClick={() => setPanelMode('guide')} aria-label="닫기">×</button></header>
            <form className={styles.detailFormBody} onSubmit={handleCreateEvent}>
              <div className={styles.inputGroup}><label htmlFor="new-event-name">이벤트 제목 *</label><input id="new-event-name" value={newEvent.title} onChange={(e) => setNewEvent((current) => ({ ...current, title: e.target.value }))} required /></div>
              <div className={styles.inputGroup}><label htmlFor="new-event-type">이벤트 유형 *</label><select id="new-event-type" value={newEvent.type} onChange={(e) => setNewEvent((current) => ({ ...current, type: e.target.value }))}><option value="quiz">응모형</option><option value="companion">동행형</option><option value="experience">체험형</option><option value="discount">할인형</option></select></div>
              <div className={styles.inputGroup}>
                <label htmlFor="new-event-banner">이벤트 배너 *</label>
                <label className={styles.bannerUpload} htmlFor="new-event-banner">{newEvent.bannerUrl ? <img src={newEvent.bannerUrl} alt="등록할 이벤트 배너" /> : <span>배너 이미지 선택</span>}</label>
                <input className={styles.srOnly} id="new-event-banner" type="file" accept="image/*" onChange={(event) => handleBannerChange(event, true)} required={!newEvent.bannerUrl} />
              </div>
              <div className={styles.dateFields}><div className={styles.inputGroup}><label htmlFor="new-start-date">시작일 *</label><input id="new-start-date" type="date" value={newEvent.startDate} onChange={(e) => setNewEvent((current) => ({ ...current, startDate: e.target.value }))} required /></div><div className={styles.inputGroup}><label htmlFor="new-end-date">종료일 *</label><input id="new-end-date" type="date" value={newEvent.endDate} onChange={(e) => setNewEvent((current) => ({ ...current, endDate: e.target.value }))} required /></div></div>
              <div className={styles.inputGroup}><label htmlFor="new-description">목록 설명</label><textarea id="new-description" rows="2" value={newEvent.description} onChange={(e) => setNewEvent((current) => ({ ...current, description: e.target.value }))} /></div>
              <div className={styles.inputGroup}><label htmlFor="new-detail">상세 설명</label><textarea id="new-detail" rows="4" value={newEvent.detailDescription} onChange={(e) => setNewEvent((current) => ({ ...current, detailDescription: e.target.value }))} /></div>
              <div className={styles.dateFields}><div className={styles.inputGroup}><label htmlFor="new-max-count">참여 가능 횟수</label><input id="new-max-count" type="number" min="1" value={newEvent.maxCount} onChange={(e) => setNewEvent((current) => ({ ...current, maxCount: e.target.value }))} /></div><div className={styles.inputGroup}><label htmlFor="new-announcement">발표일</label><input id="new-announcement" type="date" value={newEvent.announcementDate} onChange={(e) => setNewEvent((current) => ({ ...current, announcementDate: e.target.value }))} /></div></div>
              <button type="submit" className={styles.createButton}>이벤트 등록</button>
            </form>
          </aside>
        ) : panelMode === 'winners' ? (
          <aside className={styles.detailPanel} ref={panelRef} aria-labelledby="winner-manage-title">
            <header className={styles.panelTopHeader}><h2 id="winner-manage-title">당첨자 관리</h2><button type="button" onClick={() => setPanelMode('guide')} aria-label="닫기">×</button></header>
            <div className={styles.winnerManageBody}>
              <p>이벤트별 당첨자 발표 상태를 확인하세요.</p>
              {events.map((event) => <div className={styles.winnerEventRow} key={event.id}><span><strong>{event.title}</strong><small>{Number(participationCounts[event.id] ?? event.applicants ?? 0).toLocaleString()}명 참여</small></span><button type="button">당첨자 확인</button></div>)}
            </div>
          </aside>
        ) : selectedEvent ? (
          <aside className={styles.detailPanel} ref={panelRef} aria-labelledby="event-detail-title">
            <header className={styles.panelTopHeader}>
              <h2 id="event-detail-title">이벤트 상세 보기</h2>
              <button type="button" onClick={() => setSelectedEventId(null)} aria-label="닫기">×</button>
            </header>

            {/* 선택 이벤트 요약 카드 */}
            <div className={styles.selectedSummaryCard}>
              <div className={styles.scThumb}>{draftBanner && <img src={draftBanner} alt="이벤트 배너" />}</div>
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
                <div className={styles.inputGroup}>
                  <label htmlFor="edit-event-banner">배너 이미지</label>
                  <label className={styles.bannerUpload} htmlFor="edit-event-banner">{draftBanner ? <img src={draftBanner} alt="수정할 이벤트 배너" /> : <span>배너 이미지 선택</span>}</label>
                  <input className={styles.srOnly} id="edit-event-banner" type="file" accept="image/*" onChange={handleBannerChange} />
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
