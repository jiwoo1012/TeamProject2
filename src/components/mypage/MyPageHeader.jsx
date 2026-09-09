import styles from './MyPageHeader.module.scss'


const MyPageHeader = ({
  title,
  description,
  children,
}) => {
  return (
    <header className={styles.header}>
      <div className={styles.textArea}>
        <h1 className={styles.title}>
          {title}
        </h1>

        {description && (
          <p className={styles.description}>
            {description}
          </p>
        )}
      </div>

      {children && (
        <div className={styles.action}>
          {children}
        </div>
      )}
    </header>
  )
}


export default MyPageHeader