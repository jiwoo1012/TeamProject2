import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import aiIntroVideo from '../../assets/videos/ai-intro.mp4'
import styles from './AiIntro.module.scss'

const SECTIONS = [
  { at: 0.05, title: 'AI 큐레이터', desc: '당신의 취향을 읽습니다' },
  { at: 0.35, title: '데이터 분석', desc: '단맛, 산미, 바디감, 향까지' },
  { at: 0.65, title: '맞춤 추천', desc: '나에게 꼭 맞는 전통주를 찾아드려요' },
]

const AiIntro = () => {
  const navigate = useNavigate()
  const wrapperRef = useRef(null)
  const videoRef = useRef(null)
  
  const progressRef = useRef(0)       // 목표 스크롤 진행도 (0 ~ 1)
  const currentProgressRef = useRef(0) // 부드러운 보간용 현재 진행도
  const durationRef = useRef(0)        // 비디오 전체 길이 (초)
  const rafRef = useRef(null)

  const [activeIdx, setActiveIdx] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  // 1. 비디오 메타데이터 로드 및 초기 프레임 세팅
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      durationRef.current = video.duration || 0
      video.currentTime = 0.001 // 첫 프레임 강제 렌더링
    }

    if (video.readyState >= 1) {
      handleLoadedMetadata()
    } else {
      video.addEventListener('loadedmetadata', handleLoadedMetadata)
    }

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [])

  // 2. 스크롤 위치 계산
  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) return

    const handleScroll = () => {
      const rect = wrapper.getBoundingClientRect()
      const wrapperHeight = wrapper.offsetHeight
      const viewportHeight = window.innerHeight
      const scrollableDistance = wrapperHeight - viewportHeight

      if (scrollableDistance <= 0) return

      const scrolled = -rect.top
      const progress = Math.min(Math.max(scrolled / scrollableDistance, 0), 1)

      progressRef.current = progress

      // 활성화 인덱스 & 완료 여부 업데이트
      const idx = SECTIONS.reduce(
        (acc, section, i) => (progress >= section.at ? i : acc),
        0
      )
      setActiveIdx(idx)
      setIsComplete(progress >= 0.95)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 3. requestAnimationFrame을 통한 부드러운 currentTime 동기화 (LERP)
  useEffect(() => {
    const video = videoRef.current

    const render = () => {
      if (video && durationRef.current > 0) {
        // 부드러운 감속 효과 (0.1 계수로 부드럽게 추종)
        currentProgressRef.current +=
          (progressRef.current - currentProgressRef.current) * 0.1

        const targetTime = currentProgressRef.current * durationRef.current
        
        // readyState가 충족될 때만 currentTime 갱신하여 멈춤 현상 방지
        if (video.readyState >= 2 && Math.abs(video.currentTime - targetTime) > 0.01) {
          video.currentTime = targetTime
        }
      }

      rafRef.current = requestAnimationFrame(render)
    }

    rafRef.current = requestAnimationFrame(render)

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  const handleSurveyClick = () => {
    navigate('/ai-survey')
  }

  return (
    <div ref={wrapperRef} className={styles.scrollWrapper}>
      <div className={styles.sticky}>
        <video
          ref={videoRef}
          className={styles.video}
          src={aiIntroVideo}
          muted
          playsInline
          preload="auto"
        />

        <div className={styles.overlay}>
          {SECTIONS.map((section, i) => (
            <div
              key={section.title}
              className={`${styles.textBlock} ${
                i === activeIdx ? styles.active : ''
              }`}
            >
              <h2>{section.title}</h2>
              <p>{section.desc}</p>
            </div>
          ))}
        </div>

        <button
          className={`${styles.surveyButton} ${isComplete ? styles.show : ''}`}
          onClick={handleSurveyClick}
        >
          막둥이에게 추천받기 →
        </button>

        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{
              transform: `scaleX(${
                activeIdx === SECTIONS.length - 1
                  ? 1
                  : (activeIdx + 1) / SECTIONS.length
              })`,
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default AiIntro