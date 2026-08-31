import { useLayoutEffect } from 'react'

const BRAND_PATHS = new Set(['/brand', '/brand/makdong'])

const scrollToPageTop = () => {
  const root = document.documentElement
  const previousScrollBehavior = root.style.scrollBehavior

  root.style.scrollBehavior = 'auto'
  window.scrollTo(0, 0)
  root.style.scrollBehavior = previousScrollBehavior
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
