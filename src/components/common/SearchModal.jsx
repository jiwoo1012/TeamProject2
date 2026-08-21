import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import searchIcon from '../../assets/icons/searchIcon.png'

import styles from './SearchModal.module.scss'


const RECENT_SEARCH_KEY = 'jajak_recent_searches'

const POPULAR_KEYWORDS = [
  '막걸리',
  '복분자주',
  '약주/청주',
  '전통주 선물',
]


const SearchModal = ({
  isOpen,
  onClose,
  recommendedProducts = [],
}) => {
  const navigate = useNavigate()

  const [keyword, setKeyword] = useState('')
  const [recentSearches, setRecentSearches] = useState([])


  /* ========================================
     최근 검색어 불러오기
  ======================================== */

  useEffect(() => {
    if (!isOpen) {
      return
    }

    try {
      const savedSearches = JSON.parse(
        localStorage.getItem(RECENT_SEARCH_KEY)
      )

      if (Array.isArray(savedSearches)) {
        setRecentSearches(savedSearches)
      } else {
        setRecentSearches([])
      }
    } catch {
      setRecentSearches([])
    }
  }, [isOpen])


  /* ========================================
     모달 오픈 시 body scroll 방지
  ======================================== */

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const previousOverflow = document.body.style.overflow

    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen])


  /* ========================================
     ESC로 닫기
  ======================================== */

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])


  /* ========================================
     최근 검색어 저장
  ======================================== */

  const saveRecentSearch = (searchKeyword) => {
    const nextSearches = [
      searchKeyword,
      ...recentSearches.filter(
        (item) => item !== searchKeyword
      ),
    ].slice(0, 5)

    setRecentSearches(nextSearches)

    localStorage.setItem(
      RECENT_SEARCH_KEY,
      JSON.stringify(nextSearches)
    )
  }


  /* ========================================
     검색 실행
  ======================================== */

  const handleSearch = (searchKeyword) => {
    const trimmedKeyword = searchKeyword.trim()

    if (!trimmedKeyword) {
      return
    }

    saveRecentSearch(trimmedKeyword)

    setKeyword('')
    onClose()

    navigate(
      `/shop?search=${encodeURIComponent(trimmedKeyword)}`
    )
  }


  const handleSubmit = (e) => {
    e.preventDefault()

    handleSearch(keyword)
  }


  /* ========================================
     최근 검색어 개별 삭제
  ======================================== */

  const handleDeleteRecent = (targetKeyword) => {
    const nextSearches = recentSearches.filter(
      (item) => item !== targetKeyword
    )

    setRecentSearches(nextSearches)

    localStorage.setItem(
      RECENT_SEARCH_KEY,
      JSON.stringify(nextSearches)
    )
  }


  /* ========================================
     최근 검색어 전체 삭제
  ======================================== */

  const handleClearRecent = () => {
    setRecentSearches([])

    localStorage.removeItem(RECENT_SEARCH_KEY)
  }


  /* ========================================
     인기 검색어 클릭
  ======================================== */

  const handlePopularKeyword = (popularKeyword) => {
    handleSearch(popularKeyword)
  }


  if (!isOpen) {
    return null
  }


  return (
    <div className={styles.searchModal}>

      {/* ========================================
          HEADER 아래 DIM
      ======================================== */}

      <div
        className={styles.overlay}
        aria-hidden="true"
        onClick={onClose}
      />


      {/* ========================================
          SEARCH PANEL
      ======================================== */}

      <section
        className={styles.searchPanel}
        role="dialog"
        aria-modal="true"
        aria-label="상품 검색"
      >

        {/* 닫기 버튼 */}

        <button
          type="button"
          className={styles.closeButton}
          aria-label="검색창 닫기"
          onClick={onClose}
        >
          <span />
          <span />
        </button>


        <div className={styles.searchContent}>

          {/* ========================================
              INTRO
          ======================================== */}

          <div className={styles.intro}>
            <h2>
              자작에서 찾고 계신
              <br />
              한잔을 검색해보세요.
            </h2>

            <p>
              전통주부터 페어링, 잔, 선물 세트까지 빠르게 찾아보세요.
            </p>
          </div>


          {/* ========================================
              SEARCH INPUT
          ======================================== */}

          <form
            className={styles.searchForm}
            onSubmit={handleSubmit}
          >
            <input
              type="search"
              value={keyword}
              placeholder="검색어를 입력해주세요"
              aria-label="상품 검색어 입력"
              autoFocus
              onChange={(e) => setKeyword(e.target.value)}
            />

            <button
              type="submit"
              aria-label="검색"
            >
              <img
                src={searchIcon}
                alt=""
              />
            </button>
          </form>


          {/* ========================================
              인기 검색어
          ======================================== */}

          <div className={styles.section}>
            <h3>인기 검색어</h3>

            <div className={styles.keywordList}>
              {POPULAR_KEYWORDS.map((item) => (
                <button
                  type="button"
                  key={item}
                  className={styles.keywordChip}
                  onClick={() => handlePopularKeyword(item)}
                >
                  # {item}
                </button>
              ))}
            </div>
          </div>


          {/* ========================================
              최근 검색어
          ======================================== */}

          <div className={styles.recentSection}>

            <div className={styles.sectionHeader}>
              <h3>최근 검색어</h3>

              {recentSearches.length >= 2 && (
                <button
                  type="button"
                  className={styles.clearAllButton}
                  onClick={handleClearRecent}
                >
                  전체 삭제
                </button>
              )}
            </div>


            {recentSearches.length > 0 ? (
              <div className={styles.recentList}>

                {recentSearches.map((item) => (
                  <div
                    key={item}
                    className={styles.recentChip}
                  >
                    <button
                      type="button"
                      className={styles.recentKeyword}
                      onClick={() => handleSearch(item)}
                    >
                      {item}
                    </button>

                    <button
                      type="button"
                      className={styles.deleteRecent}
                      aria-label={`${item} 검색어 삭제`}
                      onClick={() => handleDeleteRecent(item)}
                    >
                      ×
                    </button>
                  </div>
                ))}

              </div>
            ) : (
              <p className={styles.emptyRecent}>
                아직 최근 검색 기록이 없어요.
              </p>
            )}

          </div>


          <div className={styles.divider} />


          {/* ========================================
              자작 추천 검색
          ======================================== */}

          <div className={styles.recommendSection}>

            <div className={styles.recommendHeading}>
              <h3>자작 추천 검색</h3>

              <p>
                요즘 많이 찾는 상품을 만나보세요.
              </p>
            </div>


            {recommendedProducts.length > 0 ? (
              <div className={styles.productGrid}>

                {recommendedProducts
                  .slice(0, 2)
                  .map((product) => (
                    <Link
                      key={product.productId}
                      to={`/shop/${product.productId}`}
                      className={styles.productCard}
                      onClick={onClose}
                    >

                      <div className={styles.productImage}>
                        {product.image && (
                          <img
                            src={product.image}
                            alt={product.name}
                          />
                        )}
                      </div>


                      <div className={styles.productInfo}>

                        <span className={styles.recommendLabel}>
                          추천상품
                        </span>

                        <strong>
                          {product.name}
                        </strong>

                        {product.description && (
                          <p>
                            {product.description}
                          </p>
                        )}

                        {product.price !== undefined && (
                          <span className={styles.price}>
                            {Number(
                              product.price
                            ).toLocaleString('ko-KR')}
                            원
                          </span>
                        )}

                      </div>

                    </Link>
                  ))}

              </div>
            ) : (

              /* 상품 연결 전 Skeleton */

              <div
                className={styles.productGrid}
                aria-hidden="true"
              >

                {[1, 2].map((item) => (
                  <div
                    key={item}
                    className={styles.skeletonCard}
                  >

                    <div className={styles.skeletonImage} />

                    <div className={styles.skeletonInfo}>

                      <div
                        className={`${styles.skeletonLine} ${styles.skeletonLabel}`}
                      />

                      <div
                        className={`${styles.skeletonLine} ${styles.skeletonTitle}`}
                      />

                      <div
                        className={`${styles.skeletonLine} ${styles.skeletonDescription}`}
                      />

                      <div
                        className={`${styles.skeletonLine} ${styles.skeletonPrice}`}
                      />

                    </div>

                  </div>
                ))}

              </div>
            )}

          </div>


          {/* ========================================
              AI 추천 이동
          ======================================== */}

          <div className={styles.aiGuide}>

            <span>
              원하는 상품을 찾지 못했나요?
            </span>

            <Link
              to="/ai"
              onClick={onClose}
            >
              AI 추천으로 찾아보기
              <span>›</span>
            </Link>

          </div>

        </div>

      </section>

    </div>
  )
}


export default SearchModal