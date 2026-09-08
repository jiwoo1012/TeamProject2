import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './MainSectionNav.module.scss'

const SECTIONS = [
  { id: 'ai-intro-section', label: '조합 추천받기 섹션 이동' },
  { id: 'feature-section', label: '자작 스토리 섹션 이동' },
  { id: 'best-seller-section', label: '베스트셀러 섹션 이동' },
  { id: 'events-grid-section', label: '이벤트 섹션 이동' },
  { id: 'makdong-section', label: '막동이 소개 섹션 이동' },
]

const MainSectionNav = ({ contentRef }) => {
  const menuId = useId()
  const containerRef = useRef(null)
  const buttonRef = useRef(null)

  const [isVisible, setIsVisible] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [activeSectionId, setActiveSectionId] = useState(null)

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

  useEffect(() => {
    if (!isVisible) setIsOpen(false)
  }, [isVisible])

  useEffect(() => {
    if (!isVisible) return undefined

    const sectionElements = SECTIONS
      .map(({ id }) => document.getElementById(id))
      .filter(Boolean)

    if (sectionElements.length === 0) return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting)
        if (visibleEntries.length === 0) return

        const closest = visibleEntries.reduce((best, entry) => (
          Math.abs(entry.boundingClientRect.top) < Math.abs(best.boundingClientRect.top) ? entry : best
        ))
        setActiveSectionId(closest.target.id)
      },
      { rootMargin: '-40% 0px -40% 0px', threshold: 0 },
    )

    sectionElements.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [isVisible])

  useEffect(() => {
    if (!isOpen) return undefined

    const handlePointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
        buttonRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const handleSelect = (sectionId) => {
    setIsOpen(false)
    setActiveSectionId(sectionId)
    const target = document.getElementById(sectionId)
    target?.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
      block: 'start',
    })
  }

  if (!isVisible) return null

  return createPortal(
    <div className={styles.container} ref={containerRef}>
      <nav
        id={menuId}
        className={`${styles.panel} ${isOpen ? styles.panelOpen : ''}`}
        role="menu"
        aria-label="섹션 바로가기"
        aria-hidden={!isOpen}
        aria-orientation="vertical"
      >
        <div className={styles.panelInner}>
          {SECTIONS.map(({ id, label }, index) => (
            <button
              key={id}
              className={`${styles.panelItem} ${id === activeSectionId ? styles.panelItemActive : ''}`}
              style={{ '--item-index': index }}
              type="button"
              role="menuitem"
              tabIndex={isOpen ? 0 : -1}
              aria-current={id === activeSectionId ? 'true' : undefined}
              onClick={() => handleSelect(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </nav>

      <button
        ref={buttonRef}
        className={styles.button}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-label={isOpen ? '섹션 바로가기 메뉴 닫기' : '섹션 바로가기 메뉴 열기'}
        onClick={() => setIsOpen((open) => !open)}
      >
        <svg className={styles.buttonIcon} viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M5 15L12 8L19 15" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>,
    document.body,
  )
}

export default MainSectionNav
