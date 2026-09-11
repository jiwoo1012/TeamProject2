import adminTopOrnament
  from '../../assets/images/admin/adminTopOrnament.svg'

import styles from './AdminPageHeader.module.scss'


// ========================================
// ICON
// ========================================

const RefreshIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M20 6v5h-5M4 18v-5h5" />

    <path d="M6.1 9a7 7 0 0 1 11.8-2.2L20 11M4 13l2.1 4.2A7 7 0 0 0 17.9 15" />
  </svg>
)


// ========================================
// COMPONENT
// ========================================

const AdminPageHeader = ({
  title,
  titleId,

  onRefresh,
  isRefreshing = false,

  children,
}) => {
  return (
    <>
      {/* ========================================
          PAGE TOOLBAR
      ======================================== */}

      <header
        className={
          styles.toolbar
        }
      >
        <h1 id={titleId}>
          {title}
        </h1>


        {(onRefresh || children) && (
          <div
            className={
              styles.actions
            }
          >
            {children}


            {onRefresh && (
              <button
                type="button"
                className={
                  styles.refreshButton
                }
                onClick={
                  onRefresh
                }
                disabled={
                  isRefreshing
                }
              >
                <span
                  className={
                    isRefreshing
                      ? styles.refreshing
                      : ''
                  }
                >
                  <RefreshIcon />
                </span>

                {isRefreshing
                  ? '불러오는 중'
                  : '새로 고침'}
              </button>
            )}
          </div>
        )}
      </header>


      {/* ========================================
          ORNAMENT
      ======================================== */}

      <div
        className={
          styles.ornament
        }
        aria-hidden="true"
      >
        <img
          src={
            adminTopOrnament
          }
          alt=""
         loading="lazy" decoding="async" />
      </div>
    </>
  )
}


export default AdminPageHeader