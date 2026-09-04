import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs, query, where } from 'firebase/firestore'

import { db } from '../../firebase/firebase'
import Pagination from '../../components/ui/Pagination/Pagination'
import searchIconImage from '../../assets/icons/searchIcon.png'
import styles from './NoticeList.module.scss'

const formatDate = (timestamp) => {
  const date = timestamp?.toDate?.()
  return date ? new Intl.DateTimeFormat('ko-CA').format(date) : '-'
}

const CATEGORY_FILTERS = ['전체', '소식', '배송', '이벤트', '서비스', '점검']
const PAGE_SIZE = 6

const CATEGORY_BADGE_CLASS = {
  소식: 'categoryNews',
  배송: 'categoryDelivery',
  이벤트: 'categoryEvent',
  서비스: 'categoryService',
  점검: 'categoryMaintenance',
}

const NoticeList = () => {
  const [notices, setNotices] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('전체')
  const [currentPage, setCurrentPage] = useState(1)

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
      .filter((notice) => activeCategory === '전체' || notice.category === activeCategory)
      .filter((notice) => !normalizedQuery || [notice.title, notice.content]
        .some((value) => value?.toLowerCase().includes(normalizedQuery)))
      .sort((a, b) => {
        if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1
        return (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)
      })
  }, [notices, searchQuery, activeCategory])

  const totalPages = Math.max(1, Math.ceil(visibleNotices.length / PAGE_SIZE))
  const pagedNotices = visibleNotices.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, activeCategory])

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <h1>공지사항</h1>
        <p>자작의 새로운 소식과 서비스 안내를 확인해주세요.</p>
      </section>

      <section className={styles.content} aria-labelledby="notice-list-title">
        <div className={styles.toolbar}>
          <h2 id="notice-list-title">전체 공지 <em>{notices.length}</em></h2>
        </div>

        <div className={styles.filterRow}>
          <div className={styles.categoryTabs} role="tablist">
            {CATEGORY_FILTERS.map((category) => (
              <button
                type="button"
                role="tab"
                aria-selected={activeCategory === category}
                className={activeCategory === category ? styles.activeTab : ''}
                onClick={() => setActiveCategory(category)}
                key={category}
              >
                {category}
              </button>
            ))}
          </div>

          <label className={styles.searchBox}>
            <img src={searchIconImage} alt="" aria-hidden="true" />
            <span className={styles.srOnly}>공지 검색</span>
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="제목 또는 내용 검색"
            />
          </label>
        </div>

        {isLoading ? <div className={styles.emptyState}>공지사항을 불러오는 중입니다.</div>
          : loadError ? <div className={styles.emptyState}>{loadError}</div>
            : visibleNotices.length === 0 ? <div className={styles.emptyState}>등록된 공지사항이 없습니다.</div>
              : <>
                <div className={styles.list}>
                  {pagedNotices.map((notice) => (
                    <Link className={styles.noticeItem} key={notice.id} to={`/notices/${notice.id}`}>
                      <div>{notice.isPinned && <span className={styles.pinBadge}>중요</span>}{notice.category && <span className={`${styles.categoryBadge} ${styles[CATEGORY_BADGE_CLASS[notice.category]] || ''}`}>{notice.category}</span>}<strong>{notice.title}</strong><p>{notice.content}</p></div>
                      <time>{formatDate(notice.createdAt)}</time>
                    </Link>
                  ))}
                </div>
                <div className={styles.paginationWrap}>
                  <Pagination currentPage={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
                </div>
              </>}
      </section>
    </main>
  )
}

export default NoticeList
