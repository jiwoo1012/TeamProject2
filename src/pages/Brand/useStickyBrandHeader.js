import { useEffect } from 'react'

const useStickyBrandHeader = () => {
  useEffect(() => {
    document.documentElement.classList.add('brand-header-sticky')

    return () => document.documentElement.classList.remove('brand-header-sticky')
  }, [])
}

export default useStickyBrandHeader
