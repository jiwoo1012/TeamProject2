import styles from './AdminStatusBadge.module.scss'


const AdminStatusBadge = ({
  children,

  tone = 'neutral',

  size = 'default',

  dot = false,

  className = '',
}) => {
  const classNames = [
    styles.badge,
    styles[tone],
    styles[`size-${size}`],
    className,
  ]
    .filter(Boolean)
    .join(' ')


  return (
    <span
      className={
        classNames
      }
    >
      {dot && (
        <i
          className={
            styles.dot
          }
          aria-hidden="true"
        />
      )}

      {children}
    </span>
  )
}


export default AdminStatusBadge