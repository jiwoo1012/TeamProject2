import { useLayoutEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

const ScrollToTop = () => {
  const { pathname, search, key } = useLocation()
  const previousPathRef = useRef(null)

  useLayoutEffect(() => {
    const isMainRevisit = pathname === '/' && previousPathRef.current === '/'
    previousPathRef.current = pathname
    // 메인 내 로고 이동과 state 정리는 메인 전용 스크롤 처리가 담당한다.
    if (isMainRevisit) return
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname, search, key])

  return null
}

export default ScrollToTop
