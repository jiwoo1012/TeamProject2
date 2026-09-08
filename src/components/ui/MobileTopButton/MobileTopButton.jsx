import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './MobileTopButton.module.scss'

const MobileTopButton = ({ contentRef, targetRef, ariaLabel = '페이지 맨 위로 이동' }) => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const update = () => {
      const content = contentRef?.current
      setIsVisible(window.scrollY > 300 && !!content && content.getBoundingClientRect().top <= 80)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [contentRef])

  if (!isVisible) return null

  return createPortal(
    <button
      className={styles.button}
      type="button"
      aria-label={ariaLabel}
      onClick={() => window.scrollTo({
        top: targetRef?.current ? window.scrollY + targetRef.current.getBoundingClientRect().top : 0,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      })}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M6 10L12 4L18 10M12 4V20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>맨 위로</span>
    </button>,
    document.body,
  )
}

export default MobileTopButton
