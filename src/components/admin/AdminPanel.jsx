import styles from './AdminPanel.module.scss'


const AdminPanel = ({
  title,
  titleId,

  eyebrow,
  action,

  children,

  className = '',
  bodyClassName = '',

  padding = 'default',
}) => {
  const panelClassNames = [
    styles.panel,
    styles[`padding-${padding}`],
    className,
  ]
    .filter(Boolean)
    .join(' ')


  const bodyClassNames = [
    styles.body,
    bodyClassName,
  ]
    .filter(Boolean)
    .join(' ')


  return (
    <section
      className={panelClassNames}
      aria-labelledby={
        titleId || undefined
      }
    >
      {/* ========================================
          PANEL HEADER
      ======================================== */}

      {(title || eyebrow || action) && (
        <header
          className={
            styles.header
          }
        >
          <div
            className={
              styles.titleArea
            }
          >
            {title && (
              <h2
                id={titleId}
              >
                {title}
              </h2>
            )}

            {eyebrow && (
              <span
                className={
                  styles.eyebrow
                }
              >
                {eyebrow}
              </span>
            )}
          </div>


          {action && (
            <div
              className={
                styles.action
              }
            >
              {action}
            </div>
          )}
        </header>
      )}


      {/* ========================================
          PANEL CONTENT
      ======================================== */}

      <div
        className={
          bodyClassNames
        }
      >
        {children}
      </div>
    </section>
  )
}


export default AdminPanel