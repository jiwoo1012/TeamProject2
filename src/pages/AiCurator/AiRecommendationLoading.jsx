import {
  useEffect,
  useRef,
  useState,
} from 'react'

import loadingVideo from '../../assets/videos/ai-recommendation-loading.mp4'

import styles from './AiRecommendationLoading.module.scss'


const MESSAGES = [
  '막둥이가 주안상을 차리고 있어요!',
  '잠시만 기다려주세요!',
]


const AiRecommendationLoading = ({
  isComplete = false,
  onComplete,
}) => {
  const [
    progress,
    setProgress,
  ] = useState(0)

  const [
    messageIndex,
    setMessageIndex,
  ] = useState(0)

  const [
    messagePhase,
    setMessagePhase,
  ] = useState('show')

  const startTimeRef =
    useRef(Date.now())


  // ========================================
  // 로딩 게이지
  //
  // 약 10초 동안 90% 근처까지 진행
  // 실제 결과가 올 때까지 94% 이하에서 대기
  // ========================================

  useEffect(() => {
    if (isComplete) {
      return undefined
    }

    const interval =
      window.setInterval(
        () => {
          const elapsed =
            Date.now() -
            startTimeRef.current

          setProgress(() => {
            // 0 ~ 3초
            if (elapsed < 3000) {
              return Math.min(
                35,
                (elapsed / 3000) * 35
              )
            }

            // 3 ~ 7초
            if (elapsed < 7000) {
              return Math.min(
                70,
                35 +
                  (
                    (elapsed - 3000) /
                    4000
                  ) *
                    35
              )
            }

            // 7 ~ 10초
            if (elapsed < 10000) {
              return Math.min(
                88,
                70 +
                  (
                    (elapsed - 7000) /
                    3000
                  ) *
                    18
              )
            }

            // 10초가 넘어가면
            // 아주 천천히 94%까지만 진행
            return Math.min(
              94,
              88 +
                (
                  (elapsed - 10000) /
                  10000
                ) *
                  6
            )
          })
        },
        100
      )

    return () => {
      window.clearInterval(
        interval
      )
    }
  }, [isComplete])


  // ========================================
  // 실제 추천 완료
  //
  // 결과 도착 → 100%
  // 잠깐 보여준 뒤 결과 페이지 전환
  // ========================================

  useEffect(() => {
    if (!isComplete) {
      return undefined
    }

    setProgress(100)

    const timeout =
      window.setTimeout(
        () => {
          onComplete?.()
        },
        550
      )

    return () => {
      window.clearTimeout(
        timeout
      )
    }
  }, [
    isComplete,
    onComplete,
  ])


  // ========================================
  // 문구 3초 간격 교체
  //
  // 현재 문구:
  // 위로 사라짐
  //
  // 다음 문구:
  // 아래에서 위로 등장
  // ========================================

  useEffect(() => {
    const interval =
      window.setInterval(
        () => {
          setMessagePhase(
            'exit'
          )

          window.setTimeout(
            () => {
              setMessageIndex(
                (current) =>
                  (
                    current + 1
                  ) %
                  MESSAGES.length
              )

              setMessagePhase(
                'enter'
              )

              requestAnimationFrame(
                () => {
                  requestAnimationFrame(
                    () => {
                      setMessagePhase(
                        'show'
                      )
                    }
                  )
                }
              )
            },
            350
          )
        },
        3000
      )

    return () => {
      window.clearInterval(
        interval
      )
    }
  }, [])


  return (
    <main
      className={
        styles.loadingPage
      }
    >
      <div
        className={
          styles.loadingInner
        }
      >
        {/* 문구 */}

        <div
          className={
            styles.messageWindow
          }
        >
          <h1
            className={`
              ${styles.message}
              ${styles[messagePhase]}
            `}
          >
            {
              MESSAGES[
                messageIndex
              ]
            }
          </h1>
        </div>


        {/* 게이지 */}

        <div
          className={
            styles.progressArea
          }
        >
          <div
            className={
              styles.progressTrack
            }
          >
            <div
              className={
                styles.progressBar
              }
              style={{
                width:
                  `${progress}%`,
              }}
            />
          </div>

          <span
            className={
              styles.progressNumber
            }
          >
            {Math.round(
              progress
            )}
            %
          </span>
        </div>


        {/* 막둥이 영상 */}

        <div
          className={
            styles.videoWrap
          }
        >
          <video
            className={
              styles.video
            }
            src={
              loadingVideo
            }
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          />
        </div>
      </div>
    </main>
  )
}


export default AiRecommendationLoading