import {
  useEffect,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import {
  useLocation,
  useNavigate,
} from 'react-router-dom'

import { liquors } from '../../data/products'
import searchIcon from '../../assets/icons/searchIcon.png'

import styles from './MobileSearchModal.module.scss'

const RECENT_SEARCH_KEY =
  'jajak_recent_searches'

const POPULAR_KEYWORDS = [
  {
    label: '전체',
    type: 'category',
    value: 'all',
  },
  {
    label: '낮의 결',
    type: 'search',
    value: '낮의 결',
  },
  {
    label: '밤의 결',
    type: 'search',
    value: '밤의 결',
  },
  {
    label: '안주',
    type: 'category',
    value: 'food',
  },
  {
    label: '술잔',
    type: 'category',
    value: 'glass',
  },
  {
    label: '선물 세트',
    type: 'category',
    value: 'gift',
  },
]

const MobileSearchModal = ({
  isOpen,
  onClose,
  onOpenMenu,
}) => {
  const navigate = useNavigate()
  const location = useLocation()

  const searchBodyRef =
    useRef(null)

  const [keyword, setKeyword] =
    useState('')

  const [
    recentSearches,
    setRecentSearches,
  ] = useState([])

  // 현재는 전통주 데이터 앞 5개 사용
  const popularProducts =
    liquors.slice(0, 5)

  // ========================================
  // 최근 검색어 불러오기
  // ========================================

  useEffect(() => {
    if (!isOpen) {
      return
    }

    try {
      const savedSearches =
        JSON.parse(
          localStorage.getItem(
            RECENT_SEARCH_KEY
          )
        )

      if (
        Array.isArray(savedSearches)
      ) {
        setRecentSearches(
          savedSearches
        )
      } else {
        setRecentSearches([])
      }
    } catch {
      setRecentSearches([])
    }
  }, [isOpen])

  // ========================================
  // 검색창을 열 때
  // 검색 화면 자체 스크롤을 항상 맨 위로
  // ========================================

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const frameId =
      window.requestAnimationFrame(
        () => {
          if (
            searchBodyRef.current
          ) {
            searchBodyRef.current.scrollTo(
              {
                top: 0,
                left: 0,
                behavior: 'auto',
              }
            )
          }
        }
      )

    return () => {
      window.cancelAnimationFrame(
        frameId
      )
    }
  }, [isOpen])

  // ========================================
  // 검색창을 열었을 때
  // 뒤쪽 페이지 스크롤 잠금
  //
  // 현재 페이지의 스크롤 위치도 기억했다가
  // 검색창을 닫으면 원래 위치로 복원
  // ========================================

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const scrollY =
      window.scrollY

    const previousPosition =
      document.body.style.position

    const previousTop =
      document.body.style.top

    const previousWidth =
      document.body.style.width

    const previousOverflow =
      document.body.style.overflow

    document.body.style.position =
      'fixed'

    document.body.style.top =
      `-${scrollY}px`

    document.body.style.width =
      '100%'

    document.body.style.overflow =
      'hidden'

    return () => {
      document.body.style.position =
        previousPosition

      document.body.style.top =
        previousTop

      document.body.style.width =
        previousWidth

      document.body.style.overflow =
        previousOverflow

      window.scrollTo({
        top: scrollY,
        left: 0,
        behavior: 'auto',
      })
    }
  }, [isOpen])

  // ========================================
  // ESC로 검색창 닫기
  // ========================================

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const handleKeyDown = (
      event
    ) => {
      if (
        event.key === 'Escape'
      ) {
        onClose()
      }
    }

    window.addEventListener(
      'keydown',
      handleKeyDown
    )

    return () => {
      window.removeEventListener(
        'keydown',
        handleKeyDown
      )
    }
  }, [isOpen, onClose])

  // ========================================
  // 최근 검색어 저장
  // ========================================

  const saveRecentSearch = (
    searchKeyword
  ) => {
    const nextSearches = [
      searchKeyword,

      ...recentSearches.filter(
        (item) =>
          item !== searchKeyword
      ),
    ].slice(0, 5)

    setRecentSearches(
      nextSearches
    )

    localStorage.setItem(
      RECENT_SEARCH_KEY,
      JSON.stringify(
        nextSearches
      )
    )
  }

  // ========================================
  // 검색 실행
  // ========================================

  const handleSearch = (
    searchKeyword
  ) => {
    const trimmedKeyword =
      searchKeyword.trim()

    if (!trimmedKeyword) {
      return
    }

    saveRecentSearch(
      trimmedKeyword
    )

    setKeyword('')

    const isSearchResultPage =
      location.pathname ===
        '/shop' &&
      new URLSearchParams(
        location.search
      ).has('search')

    onClose()

    navigate(
      `/shop?search=${encodeURIComponent(
        trimmedKeyword
      )}`,
      {
        replace:
          isSearchResultPage,
      }
    )
  }

  // ========================================
  // 검색 제출
  // ========================================

  const handleSubmit = (
    event
  ) => {
    event.preventDefault()

    handleSearch(keyword)
  }

  // ========================================
  // 최근 검색어 하나 삭제
  // ========================================

  const handleDeleteRecent = (
    targetKeyword
  ) => {
    const nextSearches =
      recentSearches.filter(
        (item) =>
          item !== targetKeyword
      )

    setRecentSearches(
      nextSearches
    )

    localStorage.setItem(
      RECENT_SEARCH_KEY,
      JSON.stringify(
        nextSearches
      )
    )
  }

  // ========================================
  // 최근 검색어 전체 삭제
  // ========================================

  const handleClearRecent = () => {
    setRecentSearches([])

    localStorage.removeItem(
      RECENT_SEARCH_KEY
    )
  }

  // ========================================
  // 인기 검색어 클릭
  // ========================================

  const handlePopularKeyword = (
    item
  ) => {
    if (
      item.type === 'category'
    ) {
      onClose()

      navigate(
        `/shop?category=${item.value}`
      )

      return
    }

    handleSearch(
      item.value
    )
  }

  // ========================================
  // 햄버거 메뉴
  // ========================================

  const handleMenu = () => {
    onClose()

    if (onOpenMenu) {
      onOpenMenu()
    }
  }

  if (!isOpen) {
    return null
  }

  // ========================================
  // Portal
  //
  // MobileHeader 안에서 렌더링하지 않고
  // document.body 바로 아래에 렌더링
  // ========================================

  return createPortal(
    <section
      className={
        styles.mobileSearch
      }
      aria-label="모바일 상품 검색"
    >
      {/* ========================================
          SEARCH HEADER
      ======================================== */}

      <header
        className={
          styles.searchHeader
        }
      >
        {/* 뒤로가기 */}

        <button
          type="button"
          className={
            styles.backButton
          }
          aria-label="검색창 닫기"
          onClick={onClose}
        >
          <span
            aria-hidden="true"
          />
        </button>

        {/* 검색창 */}

        <form
          className={
            styles.searchForm
          }
          onSubmit={
            handleSubmit
          }
        >
          <input
            type="search"
            value={keyword}
            placeholder="어떤 상품을 검색하고 싶으세요?"
            aria-label="상품 검색어 입력"
            onChange={(
              event
            ) =>
              setKeyword(
                event.target.value
              )
            }
          />

          <button
            type="submit"
            className={
              styles.searchButton
            }
            aria-label="검색"
          >
            <img
              src={searchIcon}
              alt=""
            />
          </button>
        </form>

        {/* 햄버거 */}

        <button
          type="button"
          className={
            styles.menuButton
          }
          aria-label="메뉴 열기"
          onClick={
            handleMenu
          }
        >
          <span />
          <span />
        </button>
      </header>

      {/* ========================================
          SEARCH BODY
      ======================================== */}

      <main
        ref={searchBodyRef}
        className={
          styles.searchBody
        }
      >
        {/* ========================================
            최근 검색어
        ======================================== */}

        <section
          className={
            styles.recentSection
          }
        >
          <div
            className={
              styles.sectionHeader
            }
          >
            <h2>
              최근 검색어
            </h2>

            {recentSearches.length >
              0 && (
              <button
                type="button"
                className={
                  styles.clearButton
                }
                onClick={
                  handleClearRecent
                }
              >
                전체 삭제
              </button>
            )}
          </div>

          {recentSearches.length >
          0 ? (
            <div
              className={
                styles.recentList
              }
            >
              {recentSearches.map(
                (item) => (
                  <div
                    key={item}
                    className={
                      styles.recentItem
                    }
                  >
                    <button
                      type="button"
                      className={
                        styles.recentKeyword
                      }
                      onClick={() =>
                        handleSearch(
                          item
                        )
                      }
                    >
                      {item}
                    </button>

                    <button
                      type="button"
                      className={
                        styles.deleteButton
                      }
                      aria-label={`${item} 최근 검색어 삭제`}
                      onClick={() =>
                        handleDeleteRecent(
                          item
                        )
                      }
                    >
                      ×
                    </button>
                  </div>
                )
              )}
            </div>
          ) : (
            <div
              className={
                styles.emptyRecent
              }
            >
              <div
                className={
                  styles.clockIcon
                }
                aria-hidden="true"
              >
                <span />
              </div>

              <p>
                저장된 최근 검색어가
                없어요
              </p>
            </div>
          )}
        </section>

        {/* ========================================
            인기 검색어
        ======================================== */}

        <section
          className={
            styles.popularSection
          }
        >
          <h2>
            인기 검색어
          </h2>

          <div
            className={
              styles.keywordList
            }
          >
            {POPULAR_KEYWORDS.map(
              (item) => (
                <button
                  type="button"
                  key={
                    item.label
                  }
                  onClick={() =>
                    handlePopularKeyword(
                      item
                    )
                  }
                >
                  {item.label}
                </button>
              )
            )}
          </div>

          {/* ========================================
              인기 상품 순위
          ======================================== */}

          <ol
            className={
              styles.rankingList
            }
          >
            {popularProducts.map(
              (
                product,
                index
              ) => (
                <li
                  key={
                    product.productId
                  }
                >
                  <span
                    className={
                      styles.rank
                    }
                  >
                    {index + 1}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      handleSearch(
                        product.productName
                      )
                    }
                  >
                    {
                      product.productName
                    }
                  </button>
                </li>
              )
            )}
          </ol>
        </section>
      </main>
    </section>,
    document.body
  )
}

export default MobileSearchModal