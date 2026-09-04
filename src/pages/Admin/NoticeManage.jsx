import { useEffect, useMemo, useRef, useState } from 'react'
import { auth } from '../../firebase/firebase'
import { subscribeToAuthState } from '../../firebase/auth'
import {
  addDocument,
  deleteDocument,
  getCollection,
  updateDocument,
} from '../../firebase/firestore'
import adminTopOrnament from '../../assets/images/admin/adminTopOrnament.svg'
import styles from './NoticeManage.module.scss'

const statusLabels = {
  published: '게시 중',
  draft: '숨김',
}

const categories = ['전체 분류', '배송', '이벤트', '정책', '시스템', '기타']

const toDate = (value) => value?.toDate?.() || (value ? new Date(value) : null)

const formatDateTime = (value) => {
  const date = toDate(value)
  if (!date || Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

const formatDate = (value) => {
  const date = toDate(value)
  if (!date || Number.isNaN(date.getTime())) return '-'

  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

const formatNoticeId = (noticeId = '') => {
  if (noticeId.length <= 8) return noticeId
  return `${noticeId.slice(0, 3)}…${noticeId.slice(-4)}`
}

const normalizeNotice = (notice) => ({
  ...notice,
  status: notice.status === 'published' ? 'published' : 'draft',
  isPinned: Boolean(notice.isPinned),
  authorName: notice.authorName || '관리자',
  target: notice.target || '전체 회원',
  views: Number(notice.views || 0),
})

const RefreshIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6v5h-5M4 18v-5h5" />
    <path d="M6.1 9a7 7 0 0 1 11.8-2.2L20 11M4 13l2.1 4.2A7 7 0 0 0 17.9 15" />
  </svg>
)

const NoticeManage = () => {
  const [notices, setNotices] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('전체 분류')
  const [statusFilter, setStatusFilter] = useState('all')
  const [activeCardKey, setActiveCardKey] = useState('total')
  const [selectedIds, setSelectedIds] = useState([])
  const [selectedNoticeId, setSelectedNoticeId] = useState(null)
  const [isCreating, setIsCreating] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 외부 클릭 감지 Refs
  const tableRef = useRef(null)
  const panelRef = useRef(null)

  // 선택 공지 데이터
  const selectedNotice = notices.find((n) => n.id === selectedNoticeId) || null
  const [draftTitle, setDraftTitle] = useState('')
  const [draftCategory, setDraftCategory] = useState('배송')
  const [draftStatus, setDraftStatus] = useState('published')
  const [draftIsPinned, setDraftIsPinned] = useState(false)
  const [draftContent, setDraftContent] = useState('')

  const loadNotices = async () => {
    setIsLoading(true)
    setLoadError('')

    try {
      const noticeDocs = await getCollection('notices')
      setNotices(
        noticeDocs
          .map(normalizeNotice)
          .sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0)),
      )
      setSelectedIds([])
    } catch (error) {
      console.error('공지사항 조회 실패:', error)
      setLoadError('공지사항을 불러오지 못했습니다. 관리자 권한을 확인해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user) => {
      if (user) {
        loadNotices()
      } else {
        setNotices([])
        setLoadError('관리자 로그인 후 공지사항을 관리할 수 있습니다.')
        setIsLoading(false)
      }
    })

    return unsubscribe
  }, [])

  // 외부 빈 공간 클릭 시 통계 패널로 복귀
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!selectedNoticeId && !isCreating) return
      if (
        (panelRef.current && panelRef.current.contains(e.target)) ||
        (tableRef.current && tableRef.current.contains(e.target))
      ) {
        return
      }
      setSelectedNoticeId(null)
      setIsCreating(false)
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [isCreating, selectedNoticeId])

  // 새로고침 핸들러
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadNotices()
    setSelectedNoticeId(null)
    setIsCreating(false)
    setIsRefreshing(false)
    setToastMessage('공지사항 목록을 새로고침했습니다.')
    setTimeout(() => {
      setToastMessage('')
    }, 2500)
  }

  // 지표 계산
  const totalCount = notices.length
  const publishedCount = notices.filter((n) => n.status === 'published').length
  const draftCount = notices.filter((n) => n.status === 'draft').length
  const importantCount = notices.filter((n) => n.isPinned).length

  const summaryCards = [
    { key: 'total', label: '전체 공지', value: totalCount, unit: '건', caption: '등록된 전체 공지' },
    { key: 'published', label: '게시 중', value: publishedCount, unit: '건', caption: '현재 노출 중인 공지' },
    { key: 'draft', label: '숨김', value: draftCount, unit: '건', caption: '현재 비공개 공지' },
    { key: 'important', label: '중요 공지', value: importantCount, unit: '건', caption: '상단 고정 공지' },
  ]

  // 카드 클릭 필터 연동
  const handleCardClick = (key) => {
    setActiveCardKey(key)
    setSearchQuery('')
    setCategoryFilter('전체 분류')

    if (key === 'total') setStatusFilter('all')
    else if (key === 'published') setStatusFilter('published')
    else if (key === 'draft') setStatusFilter('draft')
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
      if (statusFilter === 'published') matchesStatus = n.status === 'published'
      else if (statusFilter === 'draft') matchesStatus = n.status === 'draft'
      else if (statusFilter === 'important') matchesStatus = n.isPinned

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
    setIsCreating(false)
    setSelectedNoticeId(notice.id)
    setDraftTitle(notice.title)
    setDraftCategory(notice.category)
    setDraftStatus(notice.status)
    setDraftIsPinned(notice.isPinned)
    setDraftContent(notice.content)
  }

  const openCreatePanel = () => {
    setSelectedNoticeId(null)
    setIsCreating(true)
    setDraftTitle('')
    setDraftCategory('배송')
    setDraftStatus('draft')
    setDraftIsPinned(false)
    setDraftContent('')
  }

  const handleSaveEdit = async () => {
    if (!selectedNotice && !isCreating) return

    const title = draftTitle.trim()
    const content = draftContent.trim()
    if (!title || !content) {
      setToastMessage('제목과 본문을 입력해주세요.')
      return
    }

    const noticeData = {
      title,
      content,
      category: draftCategory,
      status: draftStatus,
      isPinned: draftIsPinned,
      authorId: selectedNotice?.authorId || auth.currentUser?.uid || '',
      authorName: selectedNotice?.authorName || auth.currentUser?.displayName || '관리자',
      target: '전체 회원',
      views: selectedNotice?.views || 0,
    }

    setIsSaving(true)
    try {
      if (isCreating) {
        await addDocument('notices', noticeData)
      } else {
        await updateDocument('notices', selectedNotice.id, noticeData)
      }

      await loadNotices()
      setSelectedNoticeId(null)
      setIsCreating(false)
      setToastMessage(isCreating ? '공지사항이 등록되었습니다.' : '공지사항이 수정되었습니다.')
      setTimeout(() => setToastMessage(''), 3000)
    } catch (error) {
      console.error('공지사항 저장 실패:', error)
      setToastMessage('공지사항을 저장하지 못했습니다. 관리자 권한을 확인해주세요.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteNotice = async () => {
    if (!selectedNotice) return
    if (window.confirm(`'${selectedNotice.title}' 공지를 정말 삭제하시겠습니까?`)) {
      setIsSaving(true)
      try {
        await deleteDocument('notices', selectedNotice.id)
        setNotices((prev) => prev.filter((n) => n.id !== selectedNotice.id))
        setSelectedNoticeId(null)
        setToastMessage('공지사항이 삭제되었습니다.')
        setTimeout(() => setToastMessage(''), 3000)
      } catch (error) {
        console.error('공지사항 삭제 실패:', error)
        setToastMessage('공지사항을 삭제하지 못했습니다. 관리자 권한을 확인해주세요.')
      } finally {
        setIsSaving(false)
      }
    }
  }

  const handleBulkHide = async () => {
    if (selectedIds.length === 0 || isSaving) return

    setIsSaving(true)
    try {
      await Promise.all(
        selectedIds.map((noticeId) => updateDocument('notices', noticeId, { status: 'draft' })),
      )
      setNotices((current) => current.map((notice) => (
        selectedIds.includes(notice.id) ? { ...notice, status: 'draft' } : notice
      )))
      setSelectedIds([])
      setToastMessage('선택한 공지를 숨김 처리했습니다.')
      setTimeout(() => setToastMessage(''), 3000)
    } catch (error) {
      console.error('공지사항 일괄 숨김 실패:', error)
      setToastMessage('선택한 공지를 숨김 처리하지 못했습니다.')
    } finally {
      setIsSaving(false)
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
                <option value="published">게시 중</option>
                <option value="draft">숨김</option>
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
                <button type="button" className={styles.bulkButton} onClick={handleBulkHide} disabled={isSaving}>
                  선택 {selectedIds.length}개 숨김 처리
                </button>
              )}
              <button type="button" className={styles.registerButton} onClick={openCreatePanel}>
                + 새 공지 등록
              </button>
            </div>
          </div>

          {/* 테이블 영역 */}
          <div className={styles.tableWrap} ref={tableRef}>
            <table className={styles.dataTable}>
              <colgroup>
                <col className={styles.selectColumn} />
                <col className={styles.idColumn} />
                <col className={styles.titleColumn} />
                <col className={styles.categoryColumn} />
                <col className={styles.dateColumn} />
                <col className={styles.statusColumn} />
                <col className={styles.pinColumn} />
                <col className={styles.targetColumn} />
                <col className={styles.viewsColumn} />
                <col className={styles.manageColumn} />
              </colgroup>
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
                {isLoading && (
                  <tr><td colSpan="10">공지사항을 불러오는 중입니다.</td></tr>
                )}
                {!isLoading && loadError && (
                  <tr><td colSpan="10">{loadError}</td></tr>
                )}
                {!isLoading && !loadError && filteredNotices.length === 0 && (
                  <tr><td colSpan="10">등록된 공지사항이 없습니다.</td></tr>
                )}
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
                    <td className={styles.noticeIdCell}>
                      <strong title={n.id}>{formatNoticeId(n.id)}</strong>
                    </td>
                    <td>
                      <span className={styles.noticeTitleText}>{n.title}</span>
                    </td>
                    <td>{n.category}</td>
                    <td className={styles.noticeDateCell}>{formatDate(n.createdAt)}</td>
                    <td>
                      <span className={`${styles.statusBadge} ${styles[n.status]}`}>
                        {statusLabels[n.status]}
                      </span>
                    </td>
                    <td>
                      <span className={n.isPinned ? styles.importantBadge : styles.normalBadge}>
                        {n.isPinned ? '중요' : '일반'}
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
        {(selectedNotice || isCreating) ? (
          <aside className={styles.editPanel} ref={panelRef} aria-labelledby="notice-detail-title">
            <header className={styles.panelTopHeader}>
              <h2 id="notice-detail-title">{isCreating ? '새 공지 등록' : '공지 상세 보기'}</h2>
              <button type="button" onClick={() => { setSelectedNoticeId(null); setIsCreating(false) }} aria-label="닫기">
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
                    checked={draftIsPinned}
                    onChange={(e) => setDraftIsPinned(e.target.checked)}
                  />
                  <span>중요 고정</span>
                </label>
              </div>

              <dl className={styles.metaDl}>
                <div>
                  <dt>공지 ID</dt>
                  <dd>{selectedNotice?.id || '등록 후 자동 생성'}</dd>
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
                      <option value="published">게시 중</option>
                      <option value="draft">숨김</option>
                    </select>
                  </dd>
                </div>
                <div>
                  <dt>작성일</dt>
                  <dd>{formatDateTime(selectedNotice?.createdAt)}</dd>
                </div>
                <div>
                  <dt>최근 수정</dt>
                  <dd>{formatDateTime(selectedNotice?.updatedAt || selectedNotice?.createdAt)}</dd>
                </div>
                <div>
                  <dt>노출 대상</dt>
                  <dd>{selectedNotice?.target || '전체 회원'}</dd>
                </div>
                <div>
                  <dt>조회수</dt>
                  <dd>{Number(selectedNotice?.views || 0).toLocaleString()}</dd>
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
              {!isCreating && (
                <button type="button" className={styles.deleteBtn} onClick={handleDeleteNotice} disabled={isSaving}>
                  공지 삭제
                </button>
              )}
              <button type="button" className={styles.saveBtn} onClick={handleSaveEdit} disabled={isSaving}>
                {isSaving ? '저장 중...' : isCreating ? '등록하기' : '저장하기'}
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
                  style={{ '--active-rate': `${Math.round((publishedCount / totalCount) * 100 || 0)}%` }}
                >
                  <span>전체</span>
                  <strong>{totalCount}건</strong>
                </div>
                <ul>
                  <li>
                    <span className={styles.dotProgress} />
                    <span>게시 중</span>
                    <strong>{publishedCount}건</strong>
                  </li>
                  <li>
                    <span className={styles.dotScheduled} />
                    <span>숨김</span>
                    <strong>{draftCount}건</strong>
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
