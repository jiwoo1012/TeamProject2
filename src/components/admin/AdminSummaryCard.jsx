import styles from './AdminSummaryCard.module.scss'


const AdminSummaryCard = ({
  icon,
  label,
  value,
  unit,
  caption,

  tone = 'primary',

  active = false,

  onClick,

  className = '',
}) => {
  const classNames = [
    styles.card,
    styles[tone],
    active
      ? styles.active
      : '',
    onClick
      ? styles.clickable
      : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')


  const content = (
    <>
      {/* ========================================
          ICON
      ======================================== */}

      {icon && (
        <span
          className={
            styles.icon
          }
          aria-hidden="true"
        >
          {typeof icon === 'string'
            ? (
              <img
                src={icon}
                alt=""
              />
            )
            : icon}
        </span>
      )}


      {/* ========================================
          CONTENT
      ======================================== */}

      <span
        className={
          styles.content
        }
      >
        <span
          className={
            styles.label
          }
        >
          {label}
        </span>


        <span
          className={
            styles.metric
          }
        >
          <strong>
            {value}
          </strong>

          {unit && (
            <span
              className={
                styles.unit
              }
            >
              {unit}
            </span>
          )}
        </span>


        {caption && (
          <small
            className={
              styles.caption
            }
          >
            {caption}
          </small>
        )}
      </span>
    </>
  )


  // 클릭 가능한 카드
  if (onClick) {
    return (
      <button
        type="button"
        className={
          classNames
        }
        onClick={
          onClick
        }
        aria-pressed={
          active
        }
      >
        {content}
      </button>
    )
  }


  // 단순 표시 카드
  return (
    <div
      className={
        classNames
      }
    >
      {content}
    </div>
  )
}


export default AdminSummaryCard