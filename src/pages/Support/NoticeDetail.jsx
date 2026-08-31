import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'

import { db } from '../../firebase/firebase'
import styles from './NoticeDetail.module.scss'

const formatDate = (timestamp) => {
  const date = timestamp?.toDate?.()
  return date ? new Intl.DateTimeFormat('ko-CA').format(date) : '-'
}

const NoticeDetail = () => {
  const { noticeId } = useParams()
  const [notice, setNotice] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')

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

  return (
    <main className={styles.page}>
      <section className={styles.content}>
        <Link className={styles.backLink} to="/notices">← 공지사항 목록</Link>
        {isLoading ? <div className={styles.emptyState}>공지사항을 불러오는 중입니다.</div>
          : loadError ? <div className={styles.emptyState}>{loadError}</div>
            : <article className={styles.noticeArticle}>
              <header>
                {notice.isPinned && <span className={styles.pinBadge}>중요 공지</span>}
                <h1>{notice.title}</h1>
                <div><span>작성자 {notice.authorName || '관리자'}</span><time>{formatDate(notice.createdAt)}</time></div>
              </header>
              <div className={styles.body}>{notice.content}</div>
            </article>}
      </section>
    </main>
  )
}

export default NoticeDetail
