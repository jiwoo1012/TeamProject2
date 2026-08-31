import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { addDoc, collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore'

import { subscribeToAuthState } from '../../firebase/auth'
import { db } from '../../firebase/firebase'
import styles from './NoticeManage.module.scss'

const createEmptyDraft = () => ({
  title: '',
  content: '',
  status: 'draft',
  isPinned: false,
})

const statusLabels = { published: '게시 중', draft: '임시 저장', private: '비공개' }
const PAGE_SIZE = 10
const timestampToMillis = (timestamp) => timestamp?.toMillis?.() ?? 0
const formatDate = (timestamp) => {
  const date = timestamp?.toDate?.()
  return date ? new Intl.DateTimeFormat('ko-CA').format(date) : '-'
}

const NoticeManage = () => {
  const [notices, setNotices] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedId, setSelectedId] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [editingNotice, setEditingNotice] = useState(null)
  const [confirmNotice, setConfirmNotice] = useState(null)
  const [isBatchDeleteConfirmOpen, setIsBatchDeleteConfirmOpen] = useState(false)
  const [draft, setDraft] = useState(null)
  const [toastMessage, setToastMessage] = useState('')

  const loadNotices = useCallback(async () => {
    setIsLoading(true)
    setLoadError('')
    try {
      const snapshot = await getDocs(collection(db, 'notices'))
      const nextNotices = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
      setNotices(nextNotices)
      setSelectedId((current) => current || nextNotices[0]?.id || null)
    } catch (error) {
      console.error('공지사항 목록 조회 실패:', error)
      setLoadError('공지사항을 불러오지 못했습니다. 관리자 권한을 확인해주세요.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user) => {
      setCurrentUser(user)
      if (user) loadNotices()
      else {
        setNotices([])
        setIsLoading(false)
      }
    })
    return unsubscribe
  }, [loadNotices])

  const filteredNotices = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return notices
      .filter((notice) => {
        const matchesQuery = !normalizedQuery
          || [notice.title, notice.content, notice.authorName]
            .some((value) => String(value || '').toLowerCase().includes(normalizedQuery))
        const matchesStatus = statusFilter === 'all' || notice.status === statusFilter
        return matchesQuery && matchesStatus
      })
      .sort((a, b) => {
        if (sortOrder === 'oldest') return timestampToMillis(a.createdAt) - timestampToMillis(b.createdAt)
        if (sortOrder === 'views') return Number(b.views || 0) - Number(a.views || 0)
        return timestampToMillis(b.createdAt) - timestampToMillis(a.createdAt)
      })
  }, [notices, searchQuery, sortOrder, statusFilter])

  const selectedNotice = filteredNotices.find((notice) => notice.id === selectedId)
    || filteredNotices[0]
  const publishedCount = notices.filter((notice) => notice.status === 'published').length
  const draftCount = notices.filter((notice) => notice.status === 'draft').length
  const pinnedCount = notices.filter((notice) => notice.isPinned).length
  const totalPages = Math.max(1, Math.ceil(filteredNotices.length / PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const visibleNotices = filteredNotices.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE
  )
  const visibleNoticeIds = visibleNotices.map((notice) => notice.id)
  const isCurrentPageSelected = visibleNoticeIds.length > 0
    && visibleNoticeIds.every((noticeId) => selectedIds.includes(noticeId))
  const pageStart = Math.max(1, Math.min(safeCurrentPage - 2, totalPages - 4))
  const pageNumbers = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => pageStart + index
  )

  const moveToFirstPage = () => setCurrentPage(1)

  const openCreateModal = () => {
    setEditingNotice(null)
    setDraft(createEmptyDraft())
  }

  const openEditModal = (notice) => {
    setEditingNotice(notice)
    setDraft({ title: notice.title, content: notice.content, status: notice.status, isPinned: notice.isPinned })
  }

  const closeModal = () => {
    setEditingNotice(null)
    setDraft(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const title = draft.title.trim()
    const content = draft.content.trim()
    if (!title || !content) return

    if (!currentUser) {
      setToastMessage('관리자 로그인 정보를 확인해주세요.')
      return
    }

    setIsSaving(true)
    try {
      if (editingNotice) {
        await updateDoc(doc(db, 'notices', editingNotice.id), {
          ...draft, title, content, updatedAt: serverTimestamp(),
        })
        setToastMessage('공지사항이 수정되었습니다.')
      } else {
        const noticeRef = await addDoc(collection(db, 'notices'), {
          ...draft,
          title,
          content,
          authorId: currentUser.uid,
          authorName: currentUser.displayName || currentUser.email || '관리자',
          views: 0,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
        setSelectedId(noticeRef.id)
        setToastMessage('공지사항이 저장되었습니다.')
      }
      closeModal()
      await loadNotices()
    } catch (error) {
      console.error('공지사항 저장 실패:', error)
      setToastMessage('공지사항 저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const resetFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setSortOrder('newest')
    moveToFirstPage()
  }

  const toggleNoticeSelection = (noticeId) => {
    setSelectedIds((currentIds) => (
      currentIds.includes(noticeId)
        ? currentIds.filter((id) => id !== noticeId)
        : [...currentIds, noticeId]
    ))
  }

  const toggleCurrentPageSelection = () => {
    setSelectedIds((currentIds) => {
      if (isCurrentPageSelected) {
        return currentIds.filter((id) => !visibleNoticeIds.includes(id))
      }
      return [...new Set([...currentIds, ...visibleNoticeIds])]
    })
  }

  const commitSelectedNoticeBatches = async (operation) => {
    for (let start = 0; start < selectedIds.length; start += 450) {
      const batch = writeBatch(db)
      selectedIds.slice(start, start + 450).forEach((noticeId) => operation(batch, noticeId))
      await batch.commit()
    }
  }

  const updateSelectedNoticesStatus = async (status) => {
    if (selectedIds.length === 0) return

    setIsSaving(true)
    try {
      await commitSelectedNoticeBatches((batch, noticeId) => {
        batch.update(doc(db, 'notices', noticeId), {
          status,
          updatedAt: serverTimestamp(),
        })
      })
      setNotices((currentNotices) => currentNotices.map((notice) => (
        selectedIds.includes(notice.id) ? { ...notice, status } : notice
      )))
      setSelectedIds([])
      setToastMessage(`${selectedIds.length}건의 공지 상태를 ${statusLabels[status]}(으)로 변경했습니다.`)
    } catch (error) {
      console.error('공지사항 일괄 상태 변경 실패:', error)
      setToastMessage('공지사항 상태를 변경하지 못했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const deleteSelectedNotices = async () => {
    if (selectedIds.length === 0) return

    setIsSaving(true)
    try {
      await commitSelectedNoticeBatches((batch, noticeId) => batch.delete(doc(db, 'notices', noticeId)))
      const nextNotices = notices.filter((notice) => !selectedIds.includes(notice.id))
      setNotices(nextNotices)
      setSelectedId((currentId) => selectedIds.includes(currentId) ? nextNotices[0]?.id || null : currentId)
      setSelectedIds([])
      setIsBatchDeleteConfirmOpen(false)
      setToastMessage('선택한 공지사항을 삭제했습니다.')
    } catch (error) {
      console.error('공지사항 일괄 삭제 실패:', error)
      setToastMessage('선택한 공지사항을 삭제하지 못했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const deleteNotice = async () => {
    if (!confirmNotice) return

    setIsSaving(true)
    try {
      await deleteDoc(doc(db, 'notices', confirmNotice.id))
      const nextNotices = notices.filter((notice) => notice.id !== confirmNotice.id)
      setNotices(nextNotices)
      setSelectedIds((currentIds) => currentIds.filter((id) => id !== confirmNotice.id))
      setSelectedId((currentId) => currentId === confirmNotice.id ? nextNotices[0]?.id || null : currentId)
      setConfirmNotice(null)
      setToastMessage('공지사항을 삭제했습니다.')
    } catch (error) {
      console.error('공지사항 삭제 실패:', error)
      setToastMessage('공지사항 삭제에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className={styles.page} aria-labelledby="notice-manage-title">
      <h2 id="notice-manage-title" className={styles.srOnly}>공지사항 관리</h2>

      <section className={styles.introCard} aria-labelledby="notice-overview-title">
        <div>
          <span className={styles.eyebrow}>NOTICE MANAGEMENT</span>
          <h3 id="notice-overview-title">공지사항을 한곳에서 관리하세요</h3>
          <p>게시 상태와 중요 공지를 확인하고 새로운 안내를 작성할 수 있습니다.</p>
        </div>
        <div className={styles.introActions}>
          <Link to="/notices">사용자 화면 보기</Link>
          <button type="button" onClick={openCreateModal}>새 공지 작성</button>
        </div>
      </section>

      <section className={styles.summaryGrid} aria-label="공지사항 현황 요약">
        <article className={styles.summaryCard}><span>전체 공지</span><strong>{notices.length}</strong><small>등록된 공지사항</small></article>
        <article className={styles.summaryCard}><span>게시 중</span><strong>{publishedCount}</strong><small>사용자에게 공개</small></article>
        <article className={styles.summaryCard}><span>임시 저장</span><strong>{draftCount}</strong><small>작성 중인 공지</small></article>
        <article className={styles.summaryCard}><span>중요 공지</span><strong>{pinnedCount}</strong><small>상단 고정 공지</small></article>
      </section>

      <section className={styles.filterBar} aria-label="공지사항 검색 및 필터">
        <label className={styles.searchField}>
          <span className={styles.srOnly}>공지사항 검색</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m16 16 4 4" /></svg>
          <input type="search" value={searchQuery} onChange={(event) => { setSearchQuery(event.target.value); moveToFirstPage() }} placeholder="제목 또는 내용 검색" />
        </label>
        <label className={styles.selectField}>
          <span className={styles.srOnly}>게시 상태</span>
          <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); moveToFirstPage() }}>
            <option value="all">전체 상태</option><option value="published">게시 중</option><option value="draft">임시 저장</option><option value="private">비공개</option>
          </select>
        </label>
        <label className={styles.selectField}>
          <span className={styles.srOnly}>정렬</span>
          <select value={sortOrder} onChange={(event) => { setSortOrder(event.target.value); moveToFirstPage() }}>
            <option value="newest">최근 등록순</option><option value="oldest">오래된 등록순</option><option value="views">조회수순</option>
          </select>
        </label>
        <button className={styles.resetButton} type="button" onClick={resetFilters}>초기화</button>
      </section>

      {selectedIds.length > 0 && (
        <section className={styles.batchActionBar} aria-label="선택 공지 일괄 관리">
          <strong>공지 {selectedIds.length}건 선택됨</strong>
          <div>
            <button type="button" onClick={() => updateSelectedNoticesStatus('published')} disabled={isSaving}>게시 중 전환</button>
            <button type="button" onClick={() => updateSelectedNoticesStatus('private')} disabled={isSaving}>비공개 전환</button>
            <button className={styles.batchDeleteButton} type="button" onClick={() => setIsBatchDeleteConfirmOpen(true)} disabled={isSaving}>선택 삭제</button>
          </div>
        </section>
      )}

      <div className={styles.managementGrid}>
        <section className={styles.listSection} aria-labelledby="notice-list-title">
          <div className={styles.sectionHeading}>
            <div><h3 id="notice-list-title">공지사항 목록</h3><span aria-hidden="true" /></div>
            <span className={styles.countBadge}>{filteredNotices.length}건</span>
          </div>

          {isLoading ? (
            <div className={styles.emptyState}><strong>공지사항을 불러오는 중입니다.</strong></div>
          ) : loadError ? (
            <div className={styles.emptyState}><strong>{loadError}</strong><button type="button" onClick={loadNotices}>다시 시도</button></div>
          ) : filteredNotices.length > 0 ? (
            <>
            <div className={styles.tableWrap}>
              <table className={styles.noticeTable}>
                <thead><tr><th scope="col" className={styles.checkColumn}><input type="checkbox" checked={isCurrentPageSelected} onChange={toggleCurrentPageSelection} aria-label="현재 페이지 공지 전체 선택" /></th><th scope="col">공지 제목</th><th scope="col">상태</th><th scope="col">등록일</th><th scope="col">조회</th><th scope="col">관리</th></tr></thead>
                <tbody>
                  {visibleNotices.map((notice) => (
                    <tr key={notice.id} className={selectedNotice?.id === notice.id ? styles.selectedRow : ''} onClick={() => setSelectedId(notice.id)}>
                      <td className={styles.checkColumn}><input type="checkbox" checked={selectedIds.includes(notice.id)} onChange={() => toggleNoticeSelection(notice.id)} onClick={(event) => event.stopPropagation()} aria-label={`${notice.title} 선택`} /></td>
                      <td><span className={styles.titleCell}>{notice.isPinned && <span className={styles.pinBadge}>중요</span>}<strong>{notice.title}</strong></span></td>
                      <td><span className={`${styles.statusBadge} ${styles[notice.status]}`}>{statusLabels[notice.status]}</span></td>
                      <td>{formatDate(notice.createdAt)}</td><td>{Number(notice.views || 0).toLocaleString('ko-KR')}</td>
                      <td><button type="button" onClick={(event) => { event.stopPropagation(); openEditModal(notice) }}>수정</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className={styles.mobileNoticeList}>
              {visibleNotices.map((notice) => (
                <article
                  key={notice.id}
                  className={`${styles.mobileNoticeCard} ${selectedNotice?.id === notice.id ? styles.selectedNoticeCard : ''}`}
                  onClick={() => setSelectedId(notice.id)}
                >
                  <div className={styles.mobileCardTop}>
                    <label className={styles.mobileCheck} onClick={(event) => event.stopPropagation()}>
                      <input type="checkbox" checked={selectedIds.includes(notice.id)} onChange={() => toggleNoticeSelection(notice.id)} aria-label={`${notice.title} 선택`} />
                    </label>
                    <span className={`${styles.statusBadge} ${styles[notice.status]}`}>{statusLabels[notice.status]}</span>
                  </div>
                  <strong>{notice.title}</strong>
                  <div className={styles.mobileCardMeta}>
                    <span>{formatDate(notice.createdAt)}</span><span>조회 {Number(notice.views || 0).toLocaleString('ko-KR')}</span>
                  </div>
                  <button type="button" onClick={(event) => { event.stopPropagation(); openEditModal(notice) }}>수정하기</button>
                </article>
              ))}
            </div>
            </>
          ) : (
            <div className={styles.emptyState}><strong>검색 결과가 없습니다.</strong><p>검색어나 필터 조건을 다시 확인해주세요.</p><button type="button" onClick={resetFilters}>필터 초기화</button></div>
          )}

          {!isLoading && !loadError && filteredNotices.length > 0 && (
            <nav className={styles.pagination} aria-label="공지사항 페이지 이동">
              <span>선택 {selectedIds.length}건</span>
              <div>
                <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={safeCurrentPage === 1}>이전</button>
                {pageNumbers.map((page) => <button key={page} type="button" className={page === safeCurrentPage ? styles.currentPage : ''} onClick={() => setCurrentPage(page)} aria-current={page === safeCurrentPage ? 'page' : undefined}>{page}</button>)}
                <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={safeCurrentPage === totalPages}>다음</button>
              </div>
            </nav>
          )}
        </section>

        <aside className={styles.detailPanel} aria-labelledby="notice-preview-title">
          <div className={styles.detailHeading}>
            <div><span>PREVIEW</span><h3 id="notice-preview-title">공지 미리보기</h3></div>
            {selectedNotice && <span className={`${styles.statusBadge} ${styles[selectedNotice.status]}`}>{statusLabels[selectedNotice.status]}</span>}
          </div>
          {selectedNotice ? (
            <>
              {selectedNotice.isPinned && <span className={styles.pinLabel}>상단 고정 공지</span>}
              <h4>{selectedNotice.title}</h4>
              <p className={styles.previewContent}>{selectedNotice.content}</p>
              <dl className={styles.previewList}>
                <div><dt>작성자</dt><dd>{selectedNotice.authorName || '관리자'}</dd></div><div><dt>등록일</dt><dd>{formatDate(selectedNotice.createdAt)}</dd></div><div><dt>최근 수정</dt><dd>{formatDate(selectedNotice.updatedAt)}</dd></div><div><dt>조회수</dt><dd>{Number(selectedNotice.views || 0).toLocaleString('ko-KR')}회</dd></div>
              </dl>
              <div className={styles.detailActions}>
                <button className={styles.detailButton} type="button" onClick={() => openEditModal(selectedNotice)}>공지 수정하기</button>
                <button className={styles.deleteButton} type="button" onClick={() => setConfirmNotice(selectedNotice)}>공지 삭제</button>
              </div>
            </>
          ) : <p className={styles.noSelection}>공지사항을 선택해주세요.</p>}
        </aside>
      </div>

      <p className={styles.demoNotice}>공지사항은 Firestore `notices` 컬렉션과 연결되어 있습니다.</p>

      {draft && (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={closeModal}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="notice-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <header className={styles.modalHeader}>
              <div><h3 id="notice-modal-title">{editingNotice ? '공지사항 수정' : '새 공지사항 작성'}</h3><p>사용자에게 전달할 공지 내용을 입력해주세요.</p></div>
              <button type="button" onClick={closeModal} aria-label="닫기">×</button>
            </header>
            <form onSubmit={handleSubmit}>
              <div className={styles.modalBody}>
                <label><span>공지 제목</span><input value={draft.title} maxLength={80} required onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} placeholder="공지 제목을 입력해주세요." /></label>
                <label><span>공지 내용</span><textarea value={draft.content} rows="9" maxLength={2000} required onChange={(event) => setDraft((current) => ({ ...current, content: event.target.value }))} placeholder="공지 내용을 입력해주세요." /></label>
                <div className={styles.formOptions}>
                  <label><span>게시 상태</span><select value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}><option value="draft">임시 저장</option><option value="published">게시 중</option><option value="private">비공개</option></select></label>
                  <label className={styles.checkField}><input type="checkbox" checked={draft.isPinned} onChange={(event) => setDraft((current) => ({ ...current, isPinned: event.target.checked }))} /><span>중요 공지로 상단 고정</span></label>
                </div>
              </div>
              <footer className={styles.modalFooter}><button type="button" onClick={closeModal} disabled={isSaving}>취소</button><button className={styles.saveButton} type="submit" disabled={isSaving}>{isSaving ? '저장 중...' : editingNotice ? '수정 완료' : '공지 저장'}</button></footer>
            </form>
          </section>
        </div>
      )}

      {confirmNotice && (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={() => setConfirmNotice(null)}>
          <section className={styles.confirmModal} role="alertdialog" aria-modal="true" aria-labelledby="notice-delete-title" onMouseDown={(event) => event.stopPropagation()}>
            <span className={styles.warningIcon} aria-hidden="true">!</span>
            <h3 id="notice-delete-title">공지사항을 삭제할까요?</h3>
            <p>삭제한 공지사항은 되돌릴 수 없습니다. 게시 상태와 내용을 확인한 뒤 진행해주세요.</p>
            <strong>{confirmNotice.title}</strong>
            <div><button type="button" onClick={() => setConfirmNotice(null)} disabled={isSaving}>취소</button><button type="button" onClick={deleteNotice} disabled={isSaving}>{isSaving ? '삭제 중...' : '삭제'}</button></div>
          </section>
        </div>
      )}

      {isBatchDeleteConfirmOpen && (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={() => setIsBatchDeleteConfirmOpen(false)}>
          <section className={styles.confirmModal} role="alertdialog" aria-modal="true" aria-labelledby="notice-batch-delete-title" onMouseDown={(event) => event.stopPropagation()}>
            <span className={styles.warningIcon} aria-hidden="true">!</span>
            <h3 id="notice-batch-delete-title">선택한 공지를 삭제할까요?</h3>
            <p>선택한 {selectedIds.length}건의 공지사항은 모두 삭제되며 되돌릴 수 없습니다.</p>
            <div><button type="button" onClick={() => setIsBatchDeleteConfirmOpen(false)} disabled={isSaving}>취소</button><button type="button" onClick={deleteSelectedNotices} disabled={isSaving}>{isSaving ? '삭제 중...' : '선택 삭제'}</button></div>
          </section>
        </div>
      )}

      {toastMessage && <div className={styles.toast} role="status"><span>{toastMessage}</span><button type="button" onClick={() => setToastMessage('')} aria-label="알림 닫기">×</button></div>}
    </section>
  )
}

export default NoticeManage
