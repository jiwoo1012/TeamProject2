import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore'

import { db } from '../../firebase/firebase'
import styles from './NoticeDetail.module.scss'

const formatDate = (timestamp) => {
  const date = timestamp?.toDate?.()
  if (!date) return '-'

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}. ${month}. ${day}.`
}

const sortNotices = (list) => [...list].sort((a, b) => {
  if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
  return (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)
})

// 카테고리별 뱃지 색상 구분 (NoticeList.jsx와 동일)
const CATEGORY_BADGE_CLASS = {
  소식: 'categoryNews',
  배송: 'categoryDelivery',
  이벤트: 'categoryEvent',
  서비스: 'categoryService',
  점검: 'categoryMaintenance',
}

const NoticeDetail = () => {
  const { noticeId } = useParams()
  const navigate = useNavigate()
  const [notice, setNotice] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [siblingNotices, setSiblingNotices] = useState([])

  useEffect(() => {
    let isActive = true
    getDoc(doc(db, 'notices', noticeId))
      .then((snapshot) => {
        if (!isActive) return
        if (!snapshot.exists()) throw new Error('notice/not-found')
        setNotice({ id: snapshot.id, ...snapshot.data() })
      })
      .catch((error) => {
        console.error('공지사항 상세 조회 실패:', error)
        if (isActive) setLoadError('공지사항을 찾을 수 없거나 조회할 수 없습니다.')
      })
      .finally(() => { if (isActive) setIsLoading(false) })
    return () => { isActive = false }
  }, [noticeId])

  useEffect(() => {
    let isActive = true
    getDocs(query(collection(db, 'notices'), where('status', '==', 'published')))
      .then((snapshot) => {
        if (!isActive) return
        setSiblingNotices(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })))
      })
      .catch((error) => {
        console.error('공지사항 이전/다음 글 조회 실패:', error)
      })
    return () => { isActive = false }
  }, [])

  const { prevNotice, nextNotice } = useMemo(() => {
    if (!notice || siblingNotices.length === 0) return { prevNotice: null, nextNotice: null }
    const sorted = sortNotices(siblingNotices)
    const currentIndex = sorted.findIndex((item) => item.id === notice.id)
    if (currentIndex === -1) return { prevNotice: null, nextNotice: null }
    return {
      prevNotice: currentIndex > 0 ? sorted[currentIndex - 1] : null,
      nextNotice: currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null,
    }
  }, [notice, siblingNotices])

  return (
    <main className={styles.page}>
      <section className={styles.content}>
        <h1 className={styles.pageTitle}>공지사항</h1>

        {isLoading ? <div className={styles.emptyState}>공지사항을 불러오는 중입니다.</div>
          : loadError ? <div className={styles.emptyState}>{loadError}</div>
            : <article className={styles.noticeArticle}>
              <header>
                <h2>{notice.title}</h2>
                <div>
                  {notice.isPinned && <span className={styles.pinBadge}>공지</span>}
                  {notice.category && <span className={`${styles.categoryBadge} ${styles[CATEGORY_BADGE_CLASS[notice.category]] || ''}`}>{notice.category}</span>}
                  <span className={styles.divider}>|</span>
                  <time>{formatDate(notice.createdAt)}</time>
                </div>
              </header>
              <div className={styles.body}>{notice.content}</div>
            </article>}

        {!isLoading && !loadError && (
          <nav className={styles.bottomBar} aria-label="목록 및 이전글 다음글">
            <button type="button" className={styles.listButton} onClick={() => navigate('/notices')}>
              <span aria-hidden="true">☰</span> 목록으로
            </button>

            <div className={styles.postNav}>
              <button type="button" disabled={!prevNotice} onClick={() => prevNotice && navigate(`/notices/${prevNotice.id}`)}>
                ‹ 이전 글
              </button>
              <button type="button" disabled={!nextNotice} onClick={() => nextNotice && navigate(`/notices/${nextNotice.id}`)}>
                다음 글 ›
              </button>
            </div>
          </nav>
        )}
      </section>
    </main>
  )
}

export default NoticeDetail
