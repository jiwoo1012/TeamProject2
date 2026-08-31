import { useCallback, useEffect, useMemo, useState } from 'react'
import { Timestamp, collection, deleteDoc, doc, getDocs, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore'

import { subscribeToAuthState } from '../../firebase/auth'
import { db } from '../../firebase/firebase'
import styles from './ReviewManage.module.scss'

const statusLabels = { visible: '노출 중', hidden: '숨김' }
const PAGE_SIZE = 10
const toDate = (timestamp) => timestamp?.toDate?.() || null
const toDateKey = (date) => [date.getFullYear(), date.getMonth() + 1, date.getDate()].join('-')
const formatTrendDate = (date) => `${date.getMonth() + 1}.${date.getDate()}`

const mockReviews = [
  {
    id: 'mock-review-001',
    productId: 'liq_001',
    nickname: '막걸리좋아',
    rating: 5,
    content: '은은한 단맛과 깔끔한 끝맛이 좋았어요. 다음에도 주문하고 싶습니다.',
    status: 'visible',
    reportCount: 0,
    createdAt: Timestamp.fromDate(new Date('2026-08-30T09:30:00+09:00')),
    isMock: true,
  },
  {
    id: 'mock-review-002',
    productId: 'liq_014',
    nickname: '주말한잔',
    rating: 2,
    content: '상품 자체는 괜찮지만 배송 포장이 조금 아쉬웠습니다.',
    status: 'visible',
    reportCount: 1,
    createdAt: Timestamp.fromDate(new Date('2026-08-29T14:10:00+09:00')),
    isMock: true,
  },
  {
    id: 'mock-review-003',
    productId: 'food_006',
    nickname: '전통주탐험가',
    rating: 4,
    content: '함께 곁들이기 좋고 구성도 만족스러웠습니다.',
    status: 'hidden',
    reportCount: 2,
    createdAt: Timestamp.fromDate(new Date('2026-08-27T18:45:00+09:00')),
    isMock: true,
  },
]

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
  const [isMockMode, setIsMockMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [ratingFilter, setRatingFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortOrder, setSortOrder] = useState('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedId, setSelectedId] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [confirmReview, setConfirmReview] = useState(null)
  const [isBatchDeleteConfirmOpen, setIsBatchDeleteConfirmOpen] = useState(false)
  const [toastMessage, setToastMessage] = useState('')

  const loadReviews = useCallback(async () => {
    setIsLoading(true)
    setLoadError('')
    try {
      const snapshot = await getDocs(collection(db, 'reviews'))
      const firestoreReviews = snapshot.docs.map((item) => ({
        id: item.id,
        ...item.data(),
        rating: Number(item.data().rating || 0),
        status: item.data().status === 'hidden' ? 'hidden' : 'visible',
        reportCount: Number(item.data().reportCount || 0),
      }))
      const nextReviews = firestoreReviews.length > 0 ? firestoreReviews : mockReviews
      setReviews(nextReviews)
      setIsMockMode(firestoreReviews.length === 0)
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
        setIsMockMode(false)
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

  const hiddenCount = reviews.filter((review) => review.status === 'hidden').length
  const reportedCount = reviews.filter((review) => review.reportCount > 0).length
  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0
  const lowRatingCount = reviews.filter((review) => review.rating <= 2).length
  const latestReviewDate = reviews.reduce((latest, review) => {
    const reviewDate = toDate(review.createdAt)
    return reviewDate && reviewDate > latest ? reviewDate : latest
  }, toDate(reviews[0]?.createdAt) || new Date())
  const reviewTrend = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(latestReviewDate)
    date.setDate(latestReviewDate.getDate() - (6 - index))
    const count = reviews.filter((review) => {
      const reviewDate = toDate(review.createdAt)
      return reviewDate && toDateKey(reviewDate) === toDateKey(date)
    }).length
    return { date, count }
  })
  const maxTrendCount = Math.max(...reviewTrend.map(({ count }) => count), 1)
  const totalPages = Math.max(1, Math.ceil(filteredReviews.length / PAGE_SIZE))
  const safeCurrentPage = Math.min(currentPage, totalPages)
  const visibleReviews = filteredReviews.slice(
    (safeCurrentPage - 1) * PAGE_SIZE,
    safeCurrentPage * PAGE_SIZE
  )
  const selectedReview = visibleReviews.find((review) => review.id === selectedId)
    || visibleReviews[0]
  const visibleReviewIds = visibleReviews.map((review) => review.id)
  const isCurrentPageSelected = visibleReviewIds.length > 0
    && visibleReviewIds.every((reviewId) => selectedIds.includes(reviewId))
  const pageStart = Math.max(1, Math.min(safeCurrentPage - 2, totalPages - 4))
  const pageNumbers = Array.from({ length: Math.min(5, totalPages) }, (_, index) => pageStart + index)

  const resetFilters = () => {
    setSearchQuery('')
    setRatingFilter('all')
    setStatusFilter('all')
    setSortOrder('newest')
    setCurrentPage(1)
  }

  const moveToFirstPage = () => setCurrentPage(1)

  const toggleReviewSelection = (reviewId) => {
    setSelectedIds((currentIds) => (
      currentIds.includes(reviewId)
        ? currentIds.filter((id) => id !== reviewId)
        : [...currentIds, reviewId]
    ))
  }

  const toggleCurrentPageSelection = () => {
    setSelectedIds((currentIds) => (
      isCurrentPageSelected
        ? currentIds.filter((id) => !visibleReviewIds.includes(id))
        : [...new Set([...currentIds, ...visibleReviewIds])]
    ))
  }

  const selectedRealReviewIds = selectedIds.filter((reviewId) => !reviews.find((review) => review.id === reviewId)?.isMock)

  const commitReviewBatches = async (reviewIds, applyOperation) => {
    for (let startIndex = 0; startIndex < reviewIds.length; startIndex += 450) {
      const batch = writeBatch(db)
      reviewIds.slice(startIndex, startIndex + 450).forEach((reviewId) => {
        applyOperation(batch, reviewId)
      })
      await batch.commit()
    }
  }

  const updateSelectedReviewsVisibility = async (status) => {
    if (selectedRealReviewIds.length === 0) {
      setToastMessage('로컬 목업 리뷰는 일괄 상태를 변경할 수 없습니다.')
      return
    }

    setIsSaving(true)
    try {
      await commitReviewBatches(selectedRealReviewIds, (batch, reviewId) => {
        batch.update(doc(db, 'reviews', reviewId), {
          status,
          updatedAt: serverTimestamp(),
        })
      })
      setReviews((currentReviews) => currentReviews.map((review) => (
        selectedRealReviewIds.includes(review.id) ? { ...review, status } : review
      )))
      setSelectedIds([])
      setToastMessage(`${selectedRealReviewIds.length}건의 리뷰를 ${statusLabels[status]}(으)로 변경했습니다.`)
    } catch (error) {
      console.error('리뷰 일괄 상태 변경 실패:', error)
      setToastMessage('리뷰 상태를 변경하지 못했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const deleteSelectedReviews = async () => {
    if (selectedRealReviewIds.length === 0) {
      setIsBatchDeleteConfirmOpen(false)
      setToastMessage('로컬 목업 리뷰는 삭제할 수 없습니다.')
      return
    }

    setIsSaving(true)
    try {
      await commitReviewBatches(selectedRealReviewIds, (batch, reviewId) => {
        batch.delete(doc(db, 'reviews', reviewId))
      })
      const nextReviews = reviews.filter((review) => !selectedRealReviewIds.includes(review.id))
      setReviews(nextReviews)
      setSelectedId((currentId) => selectedRealReviewIds.includes(currentId) ? nextReviews[0]?.id || null : currentId)
      setSelectedIds([])
      setIsBatchDeleteConfirmOpen(false)
      setToastMessage('선택한 리뷰를 삭제했습니다.')
    } catch (error) {
      console.error('리뷰 일괄 삭제 실패:', error)
      setToastMessage('선택한 리뷰를 삭제하지 못했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleVisibility = async (review) => {
    if (review.isMock) {
      setToastMessage('로컬 목업 리뷰는 상태를 변경할 수 없습니다.')
      return
    }

    const nextStatus = review.status === 'visible' ? 'hidden' : 'visible'
    setIsSaving(true)
    try {
      await updateDoc(doc(db, 'reviews', review.id), {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      })
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
    if (confirmReview.isMock) {
      setConfirmReview(null)
      setToastMessage('로컬 목업 리뷰는 삭제할 수 없습니다.')
      return
    }
    setIsSaving(true)
    try {
      await deleteDoc(doc(db, 'reviews', confirmReview.id))
      const nextReviews = reviews.filter((review) => review.id !== confirmReview.id)
      setReviews(nextReviews)
      setSelectedIds((currentIds) => currentIds.filter((id) => id !== confirmReview.id))
      setSelectedId((currentId) => currentId === confirmReview.id ? nextReviews[0]?.id || null : currentId)
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

      {isMockMode && <p className={styles.mockNotice}>화면 검토용 로컬 목업 리뷰를 표시하고 있습니다. 실제 리뷰가 등록되면 자동으로 교체됩니다.</p>}

      <section className={styles.reviewWorkspace} aria-label="리뷰 운영 현황">
        <article className={styles.trendCard}>
          <header><div><span>REVIEW ACTIVITY</span><h3>최근 7일 리뷰 흐름</h3></div><dl><div><dt>평균 별점</dt><dd>{averageRating.toFixed(1)}</dd></div><div><dt>전체 리뷰</dt><dd>{reviews.length}</dd></div></dl></header>
          <div className={styles.trendChart}>
            {reviewTrend.map(({ date, count }) => (
              <div key={toDateKey(date)} className={styles.trendColumn}>
                <strong>{count || ''}</strong><div><i style={{ '--trend-height': `${Math.max((count / maxTrendCount) * 100, count ? 10 : 0)}%` }} /></div><span>{formatTrendDate(date)}</span>
              </div>
            ))}
          </div>
        </article>

        <aside className={styles.attentionQueue}>
          <header><span>ATTENTION QUEUE</span><h3>먼저 확인할 리뷰</h3></header>
          <button type="button" onClick={() => { setStatusFilter('all'); setSortOrder('reported'); moveToFirstPage() }}><span>신고 접수</span><strong>{reportedCount}건</strong></button>
          <button type="button" onClick={() => { setRatingFilter('all'); setSortOrder('ratingLow'); moveToFirstPage() }}><span>1~2점 저평점</span><strong>{lowRatingCount}건</strong></button>
          <button type="button" onClick={() => { setStatusFilter('hidden'); moveToFirstPage() }}><span>숨김 상태</span><strong>{hiddenCount}건</strong></button>
        </aside>
      </section>

      <section className={styles.filterBar} aria-label="리뷰 검색 및 필터">
        <label className={styles.searchField}>
          <span className={styles.srOnly}>리뷰 검색</span>
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m16 16 4 4" /></svg>
          <input type="search" value={searchQuery} onChange={(event) => { setSearchQuery(event.target.value); moveToFirstPage() }} placeholder="상품명, 작성자, 리뷰 내용 검색" />
        </label>
        <label className={styles.selectField}>
          <span className={styles.srOnly}>별점</span>
          <select value={ratingFilter} onChange={(event) => { setRatingFilter(event.target.value); moveToFirstPage() }}>
            <option value="all">전체 별점</option>{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating}점</option>)}
          </select>
        </label>
        <label className={styles.selectField}>
          <span className={styles.srOnly}>노출 상태</span>
          <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); moveToFirstPage() }}>
            <option value="all">전체 상태</option><option value="visible">노출 중</option><option value="hidden">숨김</option>
          </select>
        </label>
        <label className={styles.selectField}>
          <span className={styles.srOnly}>정렬</span>
          <select value={sortOrder} onChange={(event) => { setSortOrder(event.target.value); moveToFirstPage() }}>
            <option value="newest">최근 등록순</option><option value="oldest">오래된 등록순</option><option value="ratingHigh">별점 높은순</option><option value="ratingLow">별점 낮은순</option><option value="reported">신고 많은순</option>
          </select>
        </label>
        <button className={styles.resetButton} type="button" onClick={resetFilters}>초기화</button>
      </section>

      {selectedIds.length > 0 && (
        <section className={styles.batchActionBar} aria-label="선택 리뷰 일괄 관리">
          <strong>리뷰 {selectedIds.length}건 선택됨</strong>
          <div>
            <button type="button" onClick={() => updateSelectedReviewsVisibility('visible')} disabled={isSaving}>노출하기</button>
            <button type="button" onClick={() => updateSelectedReviewsVisibility('hidden')} disabled={isSaving}>숨기기</button>
            <button className={styles.batchDeleteButton} type="button" onClick={() => setIsBatchDeleteConfirmOpen(true)} disabled={isSaving}>선택 삭제</button>
          </div>
        </section>
      )}

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
            <>
            <div className={styles.tableWrap}>
              <table className={styles.reviewTable}>
                <thead><tr><th scope="col" className={styles.checkColumn}><input type="checkbox" checked={isCurrentPageSelected} onChange={toggleCurrentPageSelection} aria-label="현재 페이지 리뷰 전체 선택" /></th><th scope="col">상품 / 작성자</th><th scope="col">별점</th><th scope="col">등록일</th><th scope="col">상태</th><th scope="col">신고</th><th scope="col">관리</th></tr></thead>
                <tbody>
                  {visibleReviews.map((review) => (
                    <tr key={review.id} className={selectedReview?.id === review.id ? styles.selectedRow : ''} onClick={() => setSelectedId(review.id)}>
                      <td className={styles.checkColumn}><input type="checkbox" checked={selectedIds.includes(review.id)} onChange={() => toggleReviewSelection(review.id)} onClick={(event) => event.stopPropagation()} aria-label={`${review.nickname || '회원'} 리뷰 선택`} /></td>
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
            <div className={styles.mobileReviewList}>
              {visibleReviews.map((review) => (
                <article
                  key={review.id}
                  className={`${styles.mobileReviewCard} ${selectedReview?.id === review.id ? styles.selectedReviewCard : ''}`}
                  onClick={() => setSelectedId(review.id)}
                >
                  <div className={styles.mobileCardTop}>
                    <label className={styles.mobileCheck} onClick={(event) => event.stopPropagation()}>
                      <input type="checkbox" checked={selectedIds.includes(review.id)} onChange={() => toggleReviewSelection(review.id)} aria-label={`${review.nickname || '회원'} 리뷰 선택`} />
                    </label>
                    <span className={`${styles.statusBadge} ${styles[review.status]}`}>{statusLabels[review.status]}</span>
                  </div>
                  <div className={styles.mobileReviewTitle}>
                    <strong>{review.productId}</strong><small>{review.nickname || '회원'}</small>
                  </div>
                  <div className={styles.mobileRatingLine}><StarRating rating={review.rating} /><span>{review.createdAt?.toDate?.().toLocaleDateString('ko-CA') || '-'}</span></div>
                  <p>{review.content}</p>
                  <div className={styles.mobileCardMeta}>
                    <span className={review.reportCount ? styles.reportText : ''}>신고 {review.reportCount}건</span>
                    <button type="button" onClick={(event) => { event.stopPropagation(); setSelectedId(review.id) }}>상세 보기</button>
                  </div>
                </article>
              ))}
            </div>
            </>
          ) : (
            <div className={styles.emptyState}><strong>검색 결과가 없습니다.</strong><p>검색어나 필터 조건을 다시 확인해주세요.</p><button type="button" onClick={resetFilters}>필터 초기화</button></div>
          )}

          {!isLoading && !loadError && filteredReviews.length > 0 && (
            <nav className={styles.pagination} aria-label="리뷰 페이지 이동">
              <span>선택 {selectedIds.length}건</span>
              <div>
                <button type="button" onClick={() => setCurrentPage((page) => Math.max(1, page - 1))} disabled={safeCurrentPage === 1}>이전</button>
                {pageNumbers.map((page) => <button key={page} type="button" className={page === safeCurrentPage ? styles.currentPage : ''} onClick={() => setCurrentPage(page)} aria-current={page === safeCurrentPage ? 'page' : undefined}>{page}</button>)}
                <button type="button" onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))} disabled={safeCurrentPage === totalPages}>다음</button>
              </div>
            </nav>
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

      <p className={styles.demoNotice}>{isMockMode ? '실제 리뷰가 없어 화면 확인용 로컬 목업 데이터를 표시하고 있습니다.' : '리뷰는 Firestore `reviews` 컬렉션과 연결되어 있습니다.'}</p>

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

      {isBatchDeleteConfirmOpen && (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={() => setIsBatchDeleteConfirmOpen(false)}>
          <section className={styles.confirmModal} role="alertdialog" aria-modal="true" aria-labelledby="review-batch-delete-title" onMouseDown={(event) => event.stopPropagation()}>
            <span className={styles.warningIcon} aria-hidden="true">!</span>
            <h3 id="review-batch-delete-title">선택한 리뷰를 삭제할까요?</h3>
            <p>선택한 리뷰는 모두 삭제되며 되돌릴 수 없습니다.</p>
            <div><button type="button" onClick={() => setIsBatchDeleteConfirmOpen(false)} disabled={isSaving}>취소</button><button type="button" onClick={deleteSelectedReviews} disabled={isSaving}>{isSaving ? '삭제 중...' : '선택 삭제'}</button></div>
          </section>
        </div>
      )}

      {toastMessage && <div className={styles.toast} role="status"><span>{toastMessage}</span><button type="button" onClick={() => setToastMessage('')} aria-label="알림 닫기">×</button></div>}
    </section>
  )
}

export default ReviewManage
