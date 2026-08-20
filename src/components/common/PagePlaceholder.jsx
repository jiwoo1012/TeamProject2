const PagePlaceholder = ({ title, styles }) => (
  <section className={styles.page}>
    <div className={styles.content}>
      <h1>{title}</h1>
      <p>페이지를 준비하고 있습니다.</p>
    </div>
  </section>
)

export default PagePlaceholder
