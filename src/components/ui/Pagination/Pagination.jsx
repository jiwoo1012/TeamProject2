import styles from './Pagination.module.scss'

const Pagination = ({ currentPage, totalPages, onChange }) => {
  if (totalPages <= 1) return null
  return (
    <nav className={styles.pagination} aria-label="상품 목록 페이지">
      <button type="button" aria-label="이전 페이지" disabled={currentPage === 1} onClick={() => onChange(currentPage - 1)}>‹</button>
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
        <button className={page === currentPage ? styles.active : ''} type="button" aria-current={page === currentPage ? 'page' : undefined} onClick={() => onChange(page)} key={page}>{page}</button>
      ))}
      <button type="button" aria-label="다음 페이지" disabled={currentPage === totalPages} onClick={() => onChange(currentPage + 1)}>›</button>
    </nav>
  )
}

export default Pagination
