import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import aiIntroVideo from '../../assets/videos/ai-intro.mp4'
import styles from './AiIntro.module.scss'

const SECTIONS = [
  {
    at: 0.05,
    title: 'AI 큐레이터',
    desc: '당신의 취향을 읽습니다',
  },
  {
    at: 0.35,
    title: '데이터 분석',
    desc: '단맛, 산미, 바디감, 향까지',
  },
  {
    at: 0.65,
    title: '맞춤 추천',
    desc: '나에게 꼭 맞는 전통주를 찾아드려요',
  },
]

const AiIntro = () => {
  const navigate = useNavigate()

  const wrapperRef = useRef(null)
  const videoRef = useRef(null)

  // 목표 스크롤 진행도 (0 ~ 1)
  const progressRef = useRef(0)

  // 부드러운 보간용 현재 진행도
  const currentProgressRef = useRef(0)

  // 비디오 전체 길이
  const durationRef = useRef(0)

  const rafRef = useRef(null)

  const [activeIdx, setActiveIdx] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  // ========================================
  // 1. 비디오 메타데이터 로드
  // ========================================
  useEffect(() => {
    const video = videoRef.current

    if (!video) return

    const handleLoadedMetadata = () => {
      durationRef.current = video.duration || 0

      // 첫 프레임 강제 렌더링
      video.currentTime = 0.001
    }

    if (video.readyState >= 1) {
      handleLoadedMetadata()
    } else {
      video.addEventListener(
        'loadedmetadata',
        handleLoadedMetadata
      )
    }

    return () => {
      video.removeEventListener(
        'loadedmetadata',
        handleLoadedMetadata
      )
    }
  }, [])

  // ========================================
  // 2. 스크롤 위치 계산
  // ========================================
  useEffect(() => {
    const wrapper = wrapperRef.current

    if (!wrapper) return

    const handleScroll = () => {
      const rect = wrapper.getBoundingClientRect()

      const wrapperHeight = wrapper.offsetHeight
      const viewportHeight = window.innerHeight

      const scrollableDistance =
        wrapperHeight - viewportHeight

      if (scrollableDistance <= 0) return

      const scrolled = -rect.top

      const progress = Math.min(
        Math.max(
          scrolled / scrollableDistance,
          0
        ),
        1
      )

      progressRef.current = progress

      // 현재 보여줄 텍스트 계산
      const idx = SECTIONS.reduce(
        (acc, section, i) =>
          progress >= section.at ? i : acc,
        0
      )

      setActiveIdx(idx)

      // 거의 마지막까지 스크롤했을 때 버튼 등장
      setIsComplete(progress >= 0.97)
    }

    window.addEventListener(
      'scroll',
      handleScroll,
      {
        passive: true,
      }
    )

    handleScroll()

    return () => {
      window.removeEventListener(
        'scroll',
        handleScroll
      )
    }
  }, [])

  // ========================================
  // 3. 스크롤과 비디오 currentTime 동기화
  // ========================================
  useEffect(() => {
    const video = videoRef.current

    const render = () => {
      if (
        video &&
        durationRef.current > 0
      ) {
        // LERP 방식으로 스크롤 위치를 부드럽게 추종
        currentProgressRef.current +=
          (
            progressRef.current -
            currentProgressRef.current
          ) * 0.1

        const targetTime =
          currentProgressRef.current *
          durationRef.current

        // 영상이 준비된 경우에만 시간 이동
        if (
          video.readyState >= 2 &&
          Math.abs(
            video.currentTime - targetTime
          ) > 0.01
        ) {
          video.currentTime = targetTime
        }
      }

      rafRef.current =
        requestAnimationFrame(render)
    }

    rafRef.current =
      requestAnimationFrame(render)

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(
          rafRef.current
        )
      }
    }
  }, [])

  // ========================================
  // 4. AI 추천 설문 이동
  // ========================================
  const handleSurveyClick = () => {
    navigate('/ai/survey')
  }

  return (
    <div
      ref={wrapperRef}
      className={styles.scrollWrapper}
    >
      <div className={styles.sticky}>

        {/* AI 인트로 영상 */}
        <video
          ref={videoRef}
          className={styles.video}
          src={aiIntroVideo}
          muted
          playsInline
          preload="auto"
        />

        {/* 스크롤에 따라 변경되는 설명 */}
        <div className={styles.overlay}>
          {SECTIONS.map(
            (section, i) => (
              <div
                key={section.title}
                className={`
                  ${styles.textBlock}
                  ${
                    i === activeIdx
                      ? styles.active
                      : ''
                  }
                `}
              >
                <h2>
                  {section.title}
                </h2>

                <p>
                  {section.desc}
                </p>
              </div>
            )
          )}
        </div>

        {/* 마지막까지 스크롤하면 등장 */}
        <button
          type="button"
          className={`
            ${styles.surveyButton}
            ${
              isComplete
                ? styles.show
                : ''
            }
          `}
          onClick={handleSurveyClick}
          tabIndex={
            isComplete ? 0 : -1
          }
          aria-hidden={!isComplete}
        >
          막둥이에게 주안상 추천받기
          <span
            className={
              styles.buttonArrow
            }
          >
            →
          </span>
        </button>

        {/* 진행 바 */}
        <div
          className={
            styles.progressBar
          }
        >
          <div
            className={
              styles.progressFill
            }
            style={{
              transform: `scaleX(${
                activeIdx ===
                SECTIONS.length - 1
                  ? 1
                  : (activeIdx + 1) /
                    SECTIONS.length
              })`,
            }}
          />
        </div>

      </div>
    </div>
  )
}

export default AiIntro