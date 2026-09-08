import styles from './AdminEmptyState.module.scss'


const DefaultIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <rect
      x="4"
      y="5"
      width="16"
      height="14"
      rx="2"
    />

    <path d="M8 9h8" />
    <path d="M8 13h5" />
  </svg>
)


const AdminEmptyState = ({
  icon,

  title = '데이터가 없습니다.',
  description,

  action,

  size = 'default',

  className = '',
}) => {
  const classNames = [
    styles.emptyState,
    styles[`size-${size}`],
    className,
  ]
    .filter(Boolean)
    .join(' ')


  return (
    <div
      className={classNames}
      role="status"
    >
      {/* ========================================
          ICON
      ======================================== */}

      <span
        className={
          styles.icon
        }
        aria-hidden="true"
      >
        {icon || <DefaultIcon />}
      </span>


      {/* ========================================
          TEXT
      ======================================== */}

      <div
        className={
          styles.content
        }
      >
        <strong
          className={
            styles.title
          }
        >
          {title}
        </strong>


        {description && (
          <p
            className={
              styles.description
            }
          >
            {description}
          </p>
        )}
      </div>


      {/* ========================================
          ACTION
      ======================================== */}

      {action && (
        <div
          className={
            styles.action
          }
        >
          {action}
        </div>
      )}
    </div>
  )
}


export default AdminEmptyState