import { useMemo, useState } from 'react'
import styles from './UserManage.module.scss'

const initialMembers = [
  {
    id: 'USR-00081', nickname: '홍길동', email: 'hong@example.com', joinedAt: '2026-08-26',
    lastLoginAt: '2026-08-26 10:24', updatedAt: '2026-08-26 09:52', status: 'active', role: 'user',
    orders: 12, wishlist: 8, events: 5, recommendations: 4,
  },
  {
    id: 'USR-00080', nickname: '김자작', email: 'jajak@shop.com', joinedAt: '2026-08-04',
    lastLoginAt: '2026-08-06 09:18', updatedAt: '2026-08-05 18:30', status: 'active', role: 'user',
    orders: 7, wishlist: 11, events: 2, recommendations: 6,
  },
  {
    id: 'USR-00079', nickname: '관리자', email: 'admin@jajak.com', joinedAt: '2026-08-03',
    lastLoginAt: '2026-08-06 11:02', updatedAt: '2026-08-06 11:02', status: 'active', role: 'admin',
    orders: 0, wishlist: 0, events: 0, recommendations: 1,
  },
  {
    id: 'USR-00078', nickname: '박전통', email: 'park@brew.com', joinedAt: '2026-08-01',
    lastLoginAt: '2026-08-05 20:41', updatedAt: '2026-08-05 20:41', status: 'active', role: 'user',
    orders: 4, wishlist: 3, events: 1, recommendations: 2,
  },
  {
    id: 'USR-00077', nickname: '이막동', email: 'makdong@example.com', joinedAt: '2026-07-29',
    lastLoginAt: '2026-08-02 14:10', updatedAt: '2026-08-04 16:22', status: 'suspended', role: 'user',
    orders: 2, wishlist: 5, events: 0, recommendations: 3,
  },
]

const statusLabels = { active: '정상', suspended: '이용 정지' }
const roleLabels = { user: '일반 회원', admin: '관리자' }

const UserAvatar = ({ nickname, large = false }) => (
  <span className={`${styles.avatar} ${large ? styles.largeAvatar : ''}`} aria-hidden="true">
    {nickname.slice(0, 1)}
  </span>
)

const UserManage = () => {
  const [members, setMembers] = useState(initialMembers)
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [roleFilter, setRoleFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('newest')
  const [selectedId, setSelectedId] = useState(initialMembers[0].id)
  const [modalMember, setModalMember] = useState(null)
  const [draftStatus, setDraftStatus] = useState('active')
  const [draftRole, setDraftRole] = useState('user')
  const [currentPage, setCurrentPage] = useState(1)
  const [toastMessage, setToastMessage] = useState('')
  const [confirmSuspension, setConfirmSuspension] = useState(false)

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
  const todayCount = members.filter((member) => member.joinedAt === '2026-08-26').length

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

  const saveMockChanges = () => {
    if (draftStatus === 'suspended' && modalMember.status !== 'suspended' && !confirmSuspension) {
      setConfirmSuspension(true)
      return
    }

    setMembers((currentMembers) => currentMembers.map((member) => (
      member.id === modalMember.id
        ? { ...member, status: draftStatus, role: draftRole }
        : member
    )))
    setModalMember(null)
    setConfirmSuspension(false)
    setToastMessage(`${modalMember.nickname} 회원 정보가 변경되었습니다.`)
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
          {filteredMembers.length > 0 ? (
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
                <div><h4 id="member-control-title">회원 관리</h4><p>현재는 화면 확인용이며 변경 내용은 서버에 저장되지 않습니다.</p></div>
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
                    <button type="button" onClick={saveMockChanges}>이용 정지</button>
                  </div>
                </section>
              )}
            </div>
            <footer className={styles.modalFooter}><button type="button" onClick={() => setModalMember(null)}>취소</button><button className={styles.saveButton} type="button" onClick={saveMockChanges}>변경 저장</button></footer>
          </section>
        </div>
      )}

      {toastMessage && <div className={styles.toast} role="status"><span>{toastMessage}</span><button type="button" onClick={() => setToastMessage('')} aria-label="알림 닫기">×</button></div>}
    </section>
  )
}

export default UserManage
