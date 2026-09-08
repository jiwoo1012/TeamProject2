import { useLayoutEffect } from 'react'

const BRAND_PATHS = new Set(['/brand', '/brand/makdong'])

const scrollToPageTop = () => {
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
}

const useStickyBrandHeader = () => {
  useLayoutEffect(() => {
    const root = document.documentElement

    const handleBrandNavigation = (event) => {
      const link = event.target.closest('a[href]')
      if (!link || !BRAND_PATHS.has(link.getAttribute('href'))) return

      scrollToPageTop()
    }

    root.classList.add('brand-header-sticky')
    scrollToPageTop()
    document.addEventListener('click', handleBrandNavigation)

    return () => {
      root.classList.remove('brand-header-sticky')
      document.removeEventListener('click', handleBrandNavigation)
    }
  }, [])
}

export default useStickyBrandHeader
