import { useEffect, useMemo, useState } from 'react'
import { subscribeToAuthState } from '../../firebase/auth'
import { getCollection, updateDocument } from '../../firebase/firestore'
import styles from './UserManage.module.scss'

const formatDate = (timestamp) => {
  const date = timestamp?.toDate?.()
  if (!date) return '-'
  return new Intl.DateTimeFormat('ko-CA').format(date)
}

const formatDateTime = (timestamp) => {
  const date = timestamp?.toDate?.()
  if (!date) return '-'
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(date)
}

const toMember = (member) => ({
  id: member.id,
  nickname: member.nickname || member.email?.split('@')[0] || '회원',
  email: member.email || '-',
  joinedAt: formatDate(member.createdAt),
  lastLoginAt: formatDateTime(member.lastLoginAt),
  updatedAt: formatDateTime(member.updatedAt),
  status: member.status === 'suspended' ? 'suspended' : 'active',
  role: member.role === 'admin' ? 'admin' : 'user',
  orders: 0,
  wishlist: 0,
  events: 0,
  recommendations: 0,
})

const statusLabels = { active: '정상', suspended: '이용 정지' }
const roleLabels = { user: '일반 회원', admin: '관리자' }

const UserAvatar = ({ nickname, large = false }) => (
  <span className={`${styles.avatar} ${large ? styles.largeAvatar : ''}`} aria-hidden="true">
    {nickname.slice(0, 1)}
  </span>
)

const UserManage = () => {
  const [members, setMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('newest')
  const [selectedId, setSelectedId] = useState(null)
  const [modalMember, setModalMember] = useState(null)
  const [draftStatus, setDraftStatus] = useState('active')
  const [draftRole, setDraftRole] = useState('user')
  const [currentPage, setCurrentPage] = useState(1)
  const [toastMessage, setToastMessage] = useState('')
  const [confirmSuspension, setConfirmSuspension] = useState(false)

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user) => {
      if (!user) {
        setMembers([])
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      setLoadError('')
      getCollection('users')
        .then((docs) => {
          const nextMembers = docs.map(toMember)
          setMembers(nextMembers)
          setSelectedId((current) => current || nextMembers[0]?.id || null)
        })
        .catch((error) => {
          console.error('회원 목록 조회 실패:', error)
          setLoadError('회원 목록을 불러오지 못했습니다. 관리자 권한을 확인해주세요.')
        })
        .finally(() => setIsLoading(false))
    })

    return unsubscribe
  }, [])

  const filteredMembers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return members
      .filter((member) => {
        const matchesQuery = !normalizedQuery || [member.nickname, member.email, member.id]
          .some((value) => value.toLowerCase().includes(normalizedQuery))
        const matchesStatus = statusFilter === 'all' || member.status === statusFilter
        const matchesRole = roleFilter === 'all' || member.role === roleFilter

        return matchesQuery && matchesStatus && matchesRole
      })
      .sort((a, b) => {
        if (sortOrder === 'name') return a.nickname.localeCompare(b.nickname, 'ko')
        if (sortOrder === 'oldest') return a.joinedAt.localeCompare(b.joinedAt)
        return b.joinedAt.localeCompare(a.joinedAt)
      })
  }, [members, query, roleFilter, sortOrder, statusFilter])

  const selectedMember = filteredMembers.find((member) => member.id === selectedId) || filteredMembers[0]
  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / 4))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const visibleMembers = filteredMembers.slice((safeCurrentPage - 1) * 4, safeCurrentPage * 4)
  const suspendedCount = members.filter((member) => member.status === 'suspended').length
  const adminCount = members.filter((member) => member.role === 'admin').length
  const today = new Intl.DateTimeFormat('ko-CA').format(new Date())
  const todayCount = members.filter((member) => member.joinedAt === today).length

  const resetFilters = () => {
    setQuery('')
    setStatusFilter('all')
    setRoleFilter('all')
    setSortOrder('newest')
    setCurrentPage(1)
  }

  const openDetailModal = (member) => {
    setModalMember(member)
    setDraftStatus(member.status)
    setDraftRole(member.role)
    setConfirmSuspension(false)
  }

  const saveMemberChanges = async () => {
    if (draftStatus === 'suspended' && modalMember.status !== 'suspended' && !confirmSuspension) {
      setConfirmSuspension(true)
      return
    }

    if (modalMember.role === 'admin' && draftRole !== 'admin' && adminCount <= 1) {
      setToastMessage('최소 한 명의 관리자 계정이 필요합니다.')
      return
    }

    setIsSaving(true)
    try {
      await updateDocument('users', modalMember.id, { status: draftStatus, role: draftRole })
      setMembers((currentMembers) => currentMembers.map((member) => (
        member.id === modalMember.id
          ? { ...member, status: draftStatus, role: draftRole, updatedAt: '방금 전' }
          : member
      )))
      setModalMember(null)
      setConfirmSuspension(false)
      setToastMessage(`${modalMember.nickname} 회원 정보가 변경되었습니다.`)
    } catch (error) {
      console.error('회원 정보 저장 실패:', error)
      setToastMessage('회원 정보 저장에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className={styles.page} aria-labelledby="user-manage-title">
      <h2 id="user-manage-title" className={styles.srOnly}>회원 관리</h2>

      <section className={styles.introCard} aria-labelledby="member-overview-title">
        <div>
          <h3 id="member-overview-title">회원 현황을 한눈에 확인하세요</h3>
          <p>가입 회원과 관리가 필요한 계정을 빠르게 확인할 수 있습니다.</p>
        </div>
        <div className={styles.introActions} aria-hidden="true"><span>회원 검색</span><span>필터 적용</span></div>
      </section>

      <section className={styles.summaryGrid} aria-label="회원 현황 요약">
        <article className={styles.summaryCard}><span>전체 회원 수</span><strong>{members.length}명</strong><em>운영 중인 회원 계정</em></article>
        <article className={styles.summaryCard}><span>오늘 가입</span><strong>{todayCount}명</strong><em>오늘 새로 가입한 계정</em></article>
        <article className={styles.summaryCard}><span>이용 정지</span><strong>{suspendedCount}명</strong><em>확인이 필요한 계정</em></article>
        <article className={styles.summaryCard}><span>관리자 계정</span><strong>{adminCount}명</strong><em>관리 권한이 있는 계정</em></article>
      </section>

      <section className={styles.filterBar} aria-label="회원 검색 및 필터">
        <label className={styles.searchField}>
          <span className={styles.srOnly}>회원 검색</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m16 16 4 4" /></svg>
          <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="이름, 이메일, 회원 ID 검색" />
        </label>
        <label className={styles.selectField}>
          <span className={styles.srOnly}>회원 상태</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">전체 상태</option><option value="active">정상</option><option value="suspended">이용 정지</option>
          </select>
        </label>
        <label className={styles.selectField}>
          <span className={styles.srOnly}>회원 권한</span>
          <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
            <option value="all">전체 권한</option><option value="user">일반 회원</option><option value="admin">관리자</option>
          </select>
        </label>
        <label className={styles.selectField}>
          <span className={styles.srOnly}>정렬</span>
          <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
            <option value="newest">최근 가입순</option><option value="oldest">오래된 가입순</option><option value="name">이름순</option>
          </select>
        </label>
        <button className={styles.resetButton} type="button" onClick={resetFilters}>초기화</button>
      </section>

      <div className={styles.managementGrid}>
        <section className={styles.memberSection} aria-labelledby="member-list-title">
          <div className={styles.sectionHeading}>
            <div className={styles.sectionTitle}><h3 id="member-list-title">회원 목록</h3><span aria-hidden="true" /></div>
            <span className={styles.memberCount}>{filteredMembers.length}명</span>
          </div>
          {isLoading ? (
            <div className={styles.emptyState}><strong>회원 목록을 불러오는 중입니다.</strong></div>
          ) : loadError ? (
            <div className={styles.emptyState}><strong>{loadError}</strong></div>
          ) : filteredMembers.length > 0 ? (
            <div className={styles.tableWrap}>
              <table className={styles.memberTable}>
                <thead><tr><th scope="col">회원</th><th scope="col">이메일</th><th scope="col">가입일</th><th scope="col">상태</th><th scope="col">권한</th><th scope="col">관리</th></tr></thead>
                <tbody>
                  {visibleMembers.map((member) => (
                    <tr key={member.id} className={selectedMember?.id === member.id ? styles.selectedRow : ''} onClick={() => setSelectedId(member.id)}>
                      <td><span className={styles.memberIdentity}><UserAvatar nickname={member.nickname} /><strong>{member.nickname}</strong></span></td>
                      <td>{member.email}</td><td>{member.joinedAt}</td>
                      <td><span className={`${styles.statusBadge} ${styles[member.status]}`}>{statusLabels[member.status]}</span></td>
                      <td><span className={styles.roleBadge}>{roleLabels[member.role]}</span></td>
                      <td><button className={styles.viewButton} type="button" onClick={(event) => { event.stopPropagation(); setSelectedId(member.id); openDetailModal(member) }}>보기</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {totalPages > 1 && (
                <nav className={styles.pagination} aria-label="회원 목록 페이지">
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                    <button className={safeCurrentPage === page ? styles.activePage : ''} type="button" key={page} onClick={() => setCurrentPage(page)}>{page}</button>
                  ))}
                </nav>
              )}
            </div>
          ) : (
            <div className={styles.emptyState}><strong>검색 결과가 없습니다.</strong><p>검색어나 필터 조건을 다시 확인해주세요.</p><button type="button" onClick={resetFilters}>필터 초기화</button></div>
          )}
        </section>

        <aside className={styles.detailPanel} aria-labelledby="member-preview-title">
          <h3 id="member-preview-title">회원 상세</h3>
          {selectedMember ? (
            <>
              <div className={styles.previewProfile}>
                <UserAvatar nickname={selectedMember.nickname} large />
                <div><strong>{selectedMember.nickname}</strong><span>{selectedMember.email}</span><div className={styles.badgeRow}><span className={`${styles.statusBadge} ${styles[selectedMember.status]}`}>{statusLabels[selectedMember.status]}</span><span className={styles.roleBadge}>{roleLabels[selectedMember.role]}</span></div></div>
              </div>
              <dl className={styles.previewList}>
                <div><dt>회원 ID</dt><dd>{selectedMember.id}</dd></div><div><dt>가입일</dt><dd>{selectedMember.joinedAt}</dd></div><div><dt>최근 로그인</dt><dd>{selectedMember.lastLoginAt}</dd></div><div><dt>주문 횟수</dt><dd>{selectedMember.orders}회</dd></div><div><dt>이벤트 참여</dt><dd>{selectedMember.events}회</dd></div>
              </dl>
              <button className={styles.detailButton} type="button" onClick={() => openDetailModal(selectedMember)}>상세 보기</button>
            </>
          ) : <p className={styles.noSelection}>회원을 선택해주세요.</p>}
        </aside>
      </div>

      {modalMember && (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={() => setModalMember(null)}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="member-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <header className={styles.modalHeader}>
              <div><h3 id="member-modal-title">회원 상세 정보</h3><p>선택한 회원의 기본 정보와 활동 현황을 확인합니다.</p></div>
              <button className={styles.closeButton} type="button" onClick={() => setModalMember(null)} aria-label="닫기">×</button>
            </header>
            <div className={styles.memberIdRow}><span>회원 ID</span><strong>{modalMember.id}</strong></div>
            <div className={styles.modalBody}>
              <div className={styles.modalProfile}><UserAvatar nickname={modalMember.nickname} large /><div><strong>{modalMember.nickname}</strong><span>{modalMember.email}</span><div className={styles.badgeRow}><span className={`${styles.statusBadge} ${styles[draftStatus]}`}>{statusLabels[draftStatus]}</span><span className={styles.roleBadge}>{roleLabels[draftRole]}</span></div></div></div>
              <div className={styles.infoGrid}>
                <dl className={styles.infoCard}><div><dt>회원 ID</dt><dd>{modalMember.id}</dd></div><div><dt>닉네임</dt><dd>{modalMember.nickname}</dd></div><div><dt>가입일</dt><dd>{modalMember.joinedAt}</dd></div><div><dt>최근 로그인</dt><dd>{modalMember.lastLoginAt}</dd></div></dl>
                <dl className={styles.infoCard}><div><dt>이메일</dt><dd>{modalMember.email}</dd></div><div><dt>상태</dt><dd>{statusLabels[draftStatus]}</dd></div><div><dt>권한</dt><dd>{roleLabels[draftRole]}</dd></div><div><dt>최근 수정</dt><dd>{modalMember.updatedAt}</dd></div></dl>
              </div>
              <section className={styles.activitySummary} aria-labelledby="activity-summary-title">
                <h4 id="activity-summary-title">활동 요약</h4><div><article><span>주문 내역</span><strong>{modalMember.orders}건</strong></article><article><span>찜 목록</span><strong>{modalMember.wishlist}건</strong></article><article><span>이벤트 참여</span><strong>{modalMember.events}건</strong></article><article><span>AI 추천</span><strong>{modalMember.recommendations}건</strong></article></div>
              </section>
              <section className={styles.memberControls} aria-labelledby="member-control-title">
                <div><h4 id="member-control-title">회원 관리</h4><p>변경한 상태와 권한은 회원 데이터에 바로 저장됩니다.</p></div>
                <div className={styles.controlFields}>
                  <label><span>상태 변경</span><select value={draftStatus} onChange={(event) => setDraftStatus(event.target.value)}><option value="active">정상</option><option value="suspended">이용 정지</option></select></label>
                  <label><span>권한 변경</span><select value={draftRole} onChange={(event) => setDraftRole(event.target.value)}><option value="user">일반 회원</option><option value="admin">관리자</option></select></label>
                </div>
              </section>
              {confirmSuspension && (
                <section className={styles.suspensionConfirm} role="alert">
                  <strong>회원 이용을 정지할까요?</strong>
                  <p>저장 후에도 이 관리자 화면에서만 반영됩니다.</p>
                  <div>
                    <button type="button" onClick={() => setConfirmSuspension(false)}>취소</button>
                    <button type="button" onClick={saveMemberChanges} disabled={isSaving}>이용 정지</button>
                  </div>
                </section>
              )}
            </div>
            <footer className={styles.modalFooter}><button type="button" onClick={() => setModalMember(null)}>취소</button><button className={styles.saveButton} type="button" disabled={isSaving} onClick={saveMemberChanges}>{isSaving ? '저장 중...' : '변경 저장'}</button></footer>
          </section>
        </div>
      )}

      {toastMessage && <div className={styles.toast} role="status"><span>{toastMessage}</span><button type="button" onClick={() => setToastMessage('')} aria-label="알림 닫기">×</button></div>}
    </section>
  )
}

export default UserManage
