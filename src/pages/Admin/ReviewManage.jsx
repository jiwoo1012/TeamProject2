import { useCallback, useEffect, useMemo, useState } from 'react'
import { collection, deleteDoc, doc, getDocs, updateDoc } from 'firebase/firestore'

import { subscribeToAuthState } from '../../firebase/auth'
import { db } from '../../firebase/firebase'
import styles from './ReviewManage.module.scss'

const statusLabels = { visible: '노출 중', hidden: '숨김' }

const StarRating = ({ rating }) => (
  <span className={styles.stars} aria-label={`${rating}점`}>
    <span>{'★'.repeat(rating)}</span>{'★'.repeat(5 - rating)}
  </span>
)

const ReviewManage = () => {
  const [reviews, setReviews] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [ratingFilter, setRatingFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('newest')
  const [selectedId, setSelectedId] = useState(null)
  const [confirmReview, setConfirmReview] = useState(null)
  const [toastMessage, setToastMessage] = useState('')

  const loadReviews = useCallback(async () => {
    setIsLoading(true)
    setLoadError('')
    try {
      const snapshot = await getDocs(collection(db, 'reviews'))
      const nextReviews = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
        status: item.data().status === 'hidden' ? 'hidden' : 'visible',
        reportCount: Number(item.data().reportCount || 0),
      }))
      setReviews(nextReviews)
      setSelectedId((current) => current || nextReviews[0]?.id || null)
    } catch (error) {
      console.error('리뷰 목록 조회 실패:', error)
      setLoadError('리뷰 목록을 불러오지 못했습니다. 관리자 권한을 확인해주세요.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user) => {
      if (user) loadReviews()
      else {
        setReviews([])
        setIsLoading(false)
      }
    })
    return unsubscribe
  }, [loadReviews])

  const filteredReviews = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    return reviews
      .filter((review) => {
        const matchesQuery = !normalizedQuery
          || [review.productId, review.nickname, review.content]
            .some((value) => String(value || '').toLowerCase().includes(normalizedQuery))
        const matchesRating = ratingFilter === 'all' || review.rating === Number(ratingFilter)
        const matchesStatus = statusFilter === 'all' || review.status === statusFilter
        return matchesQuery && matchesRating && matchesStatus
      })
      .sort((a, b) => {
        if (sortOrder === 'oldest') return (a.createdAt?.toMillis?.() ?? 0) - (b.createdAt?.toMillis?.() ?? 0)
        if (sortOrder === 'ratingHigh') return b.rating - a.rating
        if (sortOrder === 'ratingLow') return a.rating - b.rating
        if (sortOrder === 'reported') return b.reportCount - a.reportCount
        return (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)
      })
  }, [ratingFilter, reviews, searchQuery, sortOrder, statusFilter])

  const selectedReview = filteredReviews.find((review) => review.id === selectedId)
    || filteredReviews[0]
  const hiddenCount = reviews.filter((review) => review.status === 'hidden').length
  const reportedCount = reviews.filter((review) => review.reportCount > 0).length
  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0

  const resetFilters = () => {
    setSearchQuery('')
    setRatingFilter('all')
    setStatusFilter('all')
    setSortOrder('newest')
  }

  const toggleVisibility = async (review) => {
    const nextStatus = review.status === 'visible' ? 'hidden' : 'visible'
    setIsSaving(true)
    try {
      await updateDoc(doc(db, 'reviews', review.id), { status: nextStatus })
      setReviews((current) => current.map((item) => item.id === review.id ? { ...item, status: nextStatus } : item))
      setToastMessage(nextStatus === 'visible' ? '리뷰를 다시 노출했습니다.' : '리뷰를 숨김 처리했습니다.')
    } catch (error) {
      console.error('리뷰 상태 변경 실패:', error)
      setToastMessage('리뷰 상태 변경에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const deleteReview = async () => {
    if (!confirmReview) return
    setIsSaving(true)
    try {
      await deleteDoc(doc(db, 'reviews', confirmReview.id))
      setReviews((current) => current.filter((review) => review.id !== confirmReview.id))
      setSelectedId((current) => current === confirmReview.id ? '' : current)
      setConfirmReview(null)
      setToastMessage('리뷰가 삭제되었습니다.')
    } catch (error) {
      console.error('리뷰 삭제 실패:', error)
      setToastMessage('리뷰 삭제에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <section className={styles.page} aria-labelledby="review-manage-title">
      <h2 id="review-manage-title" className={styles.srOnly}>리뷰 관리</h2>

      <section className={styles.introCard} aria-labelledby="review-overview-title">
        <div>
          <span className={styles.eyebrow}>REVIEW MANAGEMENT</span>
          <h3 id="review-overview-title">고객 리뷰를 빠르게 살펴보세요</h3>
          <p>상품별 리뷰와 별점, 신고 여부를 확인하고 노출 상태를 관리할 수 있습니다.</p>
        </div>
        <button type="button" onClick={() => { setStatusFilter('all'); setSortOrder('reported') }}>신고 리뷰 확인</button>
      </section>

      <section className={styles.summaryGrid} aria-label="리뷰 현황 요약">
        <article className={styles.summaryCard}><span>전체 리뷰</span><strong>{reviews.length}</strong><small>등록된 상품 리뷰</small></article>
        <article className={styles.summaryCard}><span>평균 별점</span><strong>{averageRating.toFixed(1)}</strong><small>5점 만점 기준</small></article>
        <article className={styles.summaryCard}><span>숨김 리뷰</span><strong>{hiddenCount}</strong><small>현재 비노출 상태</small></article>
        <article className={`${styles.summaryCard} ${reportedCount ? styles.alertCard : ''}`}><span>신고 접수</span><strong>{reportedCount}</strong><small>확인이 필요한 리뷰</small></article>
      </section>

      <section className={styles.filterBar} aria-label="리뷰 검색 및 필터">
        <label className={styles.searchField}>
          <span className={styles.srOnly}>리뷰 검색</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m16 16 4 4" /></svg>
          <input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="상품명, 작성자, 리뷰 내용 검색" />
        </label>
        <label className={styles.selectField}>
          <span className={styles.srOnly}>별점</span>
          <select value={ratingFilter} onChange={(event) => setRatingFilter(event.target.value)}>
            <option value="all">전체 별점</option>{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating}점</option>)}
          </select>
        </label>
        <label className={styles.selectField}>
          <span className={styles.srOnly}>노출 상태</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="all">전체 상태</option><option value="visible">노출 중</option><option value="hidden">숨김</option>
          </select>
        </label>
        <label className={styles.selectField}>
          <span className={styles.srOnly}>정렬</span>
          <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}>
            <option value="newest">최근 등록순</option><option value="oldest">오래된 등록순</option><option value="ratingHigh">별점 높은순</option><option value="ratingLow">별점 낮은순</option><option value="reported">신고 많은순</option>
          </select>
        </label>
        <button className={styles.resetButton} type="button" onClick={resetFilters}>초기화</button>
      </section>

      <div className={styles.managementGrid}>
        <section className={styles.listSection} aria-labelledby="review-list-title">
          <div className={styles.sectionHeading}>
            <div><h3 id="review-list-title">리뷰 목록</h3><span aria-hidden="true" /></div>
            <span className={styles.countBadge}>{filteredReviews.length}건</span>
          </div>

          {isLoading ? (
            <div className={styles.emptyState}><strong>리뷰 목록을 불러오는 중입니다.</strong></div>
          ) : loadError ? (
            <div className={styles.emptyState}><strong>{loadError}</strong><button type="button" onClick={loadReviews}>다시 시도</button></div>
          ) : filteredReviews.length > 0 ? (
            <div className={styles.tableWrap}>
              <table className={styles.reviewTable}>
                <thead><tr><th scope="col">상품 / 작성자</th><th scope="col">별점</th><th scope="col">등록일</th><th scope="col">상태</th><th scope="col">신고</th><th scope="col">관리</th></tr></thead>
                <tbody>
                  {filteredReviews.map((review) => (
                    <tr key={review.id} className={selectedReview?.id === review.id ? styles.selectedRow : ''} onClick={() => setSelectedId(review.id)}>
                      <td><span className={styles.reviewIdentity}><strong>{review.productId}</strong><small>{review.nickname || '회원'}</small></span></td>
                      <td><StarRating rating={review.rating} /></td><td>{review.createdAt?.toDate?.().toLocaleDateString('ko-CA') || '-'}</td>
                      <td><span className={`${styles.statusBadge} ${styles[review.status]}`}>{statusLabels[review.status]}</span></td>
                      <td><span className={review.reportCount ? styles.reportBadge : styles.reportEmpty}>{review.reportCount}건</span></td>
                      <td><button type="button" onClick={(event) => { event.stopPropagation(); setSelectedId(review.id) }}>보기</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className={styles.emptyState}><strong>검색 결과가 없습니다.</strong><p>검색어나 필터 조건을 다시 확인해주세요.</p><button type="button" onClick={resetFilters}>필터 초기화</button></div>
          )}
        </section>

        <aside className={styles.detailPanel} aria-labelledby="review-detail-title">
          <div className={styles.detailHeading}>
            <div><span>REVIEW DETAIL</span><h3 id="review-detail-title">리뷰 상세</h3></div>
            {selectedReview && <span className={`${styles.statusBadge} ${styles[selectedReview.status]}`}>{statusLabels[selectedReview.status]}</span>}
          </div>
          {selectedReview ? (
            <>
              <div className={styles.productInfo}><span>상품</span><strong>{selectedReview.productId}</strong></div>
              <div className={styles.ratingRow}><StarRating rating={selectedReview.rating} /><strong>{selectedReview.rating}.0</strong></div>
              <blockquote>{selectedReview.content}</blockquote>
              <dl className={styles.previewList}>
                <div><dt>작성자</dt><dd>{selectedReview.nickname || '회원'}</dd></div><div><dt>등록일</dt><dd>{selectedReview.createdAt?.toDate?.().toLocaleDateString('ko-CA') || '-'}</dd></div><div><dt>리뷰 ID</dt><dd>{selectedReview.id}</dd></div><div><dt>신고 접수</dt><dd className={selectedReview.reportCount ? styles.reportText : ''}>{selectedReview.reportCount}건</dd></div>
              </dl>
              <div className={styles.detailActions}>
                <button type="button" onClick={() => toggleVisibility(selectedReview)}>{selectedReview.status === 'visible' ? '리뷰 숨기기' : '다시 노출하기'}</button>
                <button type="button" onClick={() => setConfirmReview(selectedReview)}>리뷰 삭제</button>
              </div>
            </>
          ) : <p className={styles.noSelection}>리뷰를 선택해주세요.</p>}
        </aside>
      </div>

      <p className={styles.demoNotice}>리뷰는 Firestore `reviews` 컬렉션과 연결되어 있습니다.</p>

      {confirmReview && (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={() => setConfirmReview(null)}>
          <section className={styles.confirmModal} role="alertdialog" aria-modal="true" aria-labelledby="review-delete-title" onMouseDown={(event) => event.stopPropagation()}>
            <span className={styles.warningIcon} aria-hidden="true">!</span>
            <h3 id="review-delete-title">리뷰를 삭제할까요?</h3>
            <p>삭제한 리뷰는 되돌릴 수 없습니다. 신고 내용과 상품 정보를 확인한 후 진행해주세요.</p>
            <strong>{confirmReview.productId} · {confirmReview.nickname || '회원'}</strong>
            <div><button type="button" onClick={() => setConfirmReview(null)} disabled={isSaving}>취소</button><button type="button" onClick={deleteReview} disabled={isSaving}>{isSaving ? '삭제 중...' : '삭제'}</button></div>
          </section>
        </div>
      )}

      {toastMessage && <div className={styles.toast} role="status"><span>{toastMessage}</span><button type="button" onClick={() => setToastMessage('')} aria-label="알림 닫기">×</button></div>}
    </section>
  )
}

export default ReviewManage
