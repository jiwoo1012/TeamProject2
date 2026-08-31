import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs, query, where } from 'firebase/firestore'

import { db } from '../../firebase/firebase'
import styles from './NoticeList.module.scss'

const formatDate = (timestamp) => {
  const date = timestamp?.toDate?.()
  return date ? new Intl.DateTimeFormat('ko-CA').format(date) : '-'
}

const NoticeList = () => {
  const [notices, setNotices] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    let isActive = true
    getDocs(query(collection(db, 'notices'), where('status', '==', 'published')))
      .then((snapshot) => {
        if (!isActive) return
        setNotices(snapshot.docs.map((item) => ({ id: item.id, ...item.data() })))
      })
      .catch((error) => {
        console.error('공지사항 목록 조회 실패:', error)
        if (isActive) setLoadError('공지사항을 불러오지 못했습니다.')
      })
      .finally(() => { if (isActive) setIsLoading(false) })

    return () => { isActive = false }
  }, [])

  const visibleNotices = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    return notices
      .filter((notice) => !normalizedQuery || [notice.title, notice.content]
        .some((value) => value?.toLowerCase().includes(normalizedQuery)))
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
        return (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)
      })
  }, [notices, searchQuery])

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <span>NOTICE</span>
        <h1>공지사항</h1>
        <p>자작의 새로운 소식과 서비스 안내를 확인해주세요.</p>
      </section>

      <section className={styles.content} aria-labelledby="notice-list-title">
        <div className={styles.toolbar}>
          <h2 id="notice-list-title">전체 공지 <em>{notices.length}</em></h2>
          <label><span className={styles.srOnly}>공지 검색</span><input type="search" value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="제목 또는 내용 검색" /></label>
        </div>

        {isLoading ? <div className={styles.emptyState}>공지사항을 불러오는 중입니다.</div>
          : loadError ? <div className={styles.emptyState}>{loadError}</div>
            : visibleNotices.length === 0 ? <div className={styles.emptyState}>등록된 공지사항이 없습니다.</div>
              : <div className={styles.list}>
                {visibleNotices.map((notice) => (
                  <Link className={styles.noticeItem} key={notice.id} to={`/notices/${notice.id}`}>
                    <div>{notice.isPinned && <span className={styles.pinBadge}>중요</span>}<strong>{notice.title}</strong><p>{notice.content}</p></div>
                    <time>{formatDate(notice.createdAt)}</time>
                  </Link>
                ))}
              </div>}
      </section>
    </main>
  )
}

export default NoticeList
