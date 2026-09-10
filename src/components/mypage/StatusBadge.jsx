import styles from './StatusBadge.module.scss'


const StatusBadge = ({
  children,
  tone = 'default',
  className = '',
}) => {
  return (
    <span
      className={`${styles.badge} ${
        styles[tone] || styles.default
      } ${className}`}
    >
      {children}
    </span>
  )
}


export default StatusBadge