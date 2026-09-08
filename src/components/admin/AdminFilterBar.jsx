import styles from './AdminFilterBar.module.scss'


// ========================================
// ICON
// ========================================

const SearchIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle
      cx="11"
      cy="11"
      r="7"
    />

    <path d="m20 20-3.5-3.5" />
  </svg>
)


const ResetIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v6h6" />
  </svg>
)


// ========================================
// COMPONENT
// ========================================

const AdminFilterBar = ({
  searchValue,
  onSearchChange,
  searchPlaceholder = '검색어를 입력해주세요.',
  searchLabel = '검색',

  children,

  onReset,
  resetLabel = '초기화',

  resultText,

  className = '',
}) => {
  const classNames = [
    styles.filterBar,
    className,
  ]
    .filter(Boolean)
    .join(' ')


  const hasSearch =
    searchValue !== undefined &&
    typeof onSearchChange === 'function'


  return (
    <div className={classNames}>
      {/* ========================================
          FILTER CONTROLS
      ======================================== */}

      <div
        className={
          styles.controls
        }
      >
        {/* SEARCH */}

        {hasSearch && (
          <label
            className={
              styles.searchBox
            }
          >
            <span
              className={
                styles.searchIcon
              }
            >
              <SearchIcon />
            </span>

            <input
              type="search"
              value={searchValue}
              onChange={(event) =>
                onSearchChange(
                  event.target.value
                )
              }
              placeholder={
                searchPlaceholder
              }
              aria-label={
                searchLabel
              }
            />
          </label>
        )}


        {/* PAGE-SPECIFIC FILTERS */}

        {children && (
          <div
            className={
              styles.filters
            }
          >
            {children}
          </div>
        )}


        {/* RESET */}

        {onReset && (
          <button
            type="button"
            className={
              styles.resetButton
            }
            onClick={
              onReset
            }
          >
            <ResetIcon />

            <span>
              {resetLabel}
            </span>
          </button>
        )}
      </div>


      {/* ========================================
          RESULT TEXT
      ======================================== */}

      {resultText && (
        <div
          className={
            styles.result
          }
        >
          {resultText}
        </div>
      )}
    </div>
  )
}


export default AdminFilterBar