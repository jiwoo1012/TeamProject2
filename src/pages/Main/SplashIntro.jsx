import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { gsap } from 'gsap'
import styles from './SplashIntro.module.scss'

const SplashIntro = ({ onComplete }) => {
  const navigate = useNavigate()
  const splashRef = useRef(null)
  const progressRef = useRef(null)
  const copyRef = useRef(null)
  const completeRef = useRef(onComplete)

  useEffect(() => {
    completeRef.current = onComplete
  }, [onComplete])

  useEffect(() => {
    const media = gsap.matchMedia()
    let hasCompleted = false

    const complete = () => {
      if (hasCompleted) return
      hasCompleted = true
      if (completeRef.current) completeRef.current()
      else navigate('/', { replace: true })
    }

    media.add({
      reduceMotion: '(prefers-reduced-motion: reduce)',
      allowMotion: '(prefers-reduced-motion: no-preference)',
    }, (context) => {
      const isReducedMotion = context.conditions.reduceMotion
      // 실제 다운로드 비율이 아닌 브랜드 인트로 연출용 진행률입니다.
      const progress = { value: 0 }
      const updateProgress = () => {
        if (!progressRef.current) return
        progressRef.current.textContent = String(Math.floor(progress.value))
      }
      updateProgress()

      const timeline = gsap.timeline({ onComplete: complete })
      timeline
        .fromTo(copyRef.current, { '--reveal': '0%' }, {
          '--reveal': '100%',
          duration: isReducedMotion ? 0.4 : 3.3,
          ease: 'none',
        }, 0)
        .to(progress, { value: 82, duration: isReducedMotion ? 0.4 : 2, ease: 'power2.inOut', onUpdate: updateProgress }, 0)
        .to(progress, { value: 99, duration: isReducedMotion ? 0.2 : 1.1, ease: 'sine.out', onUpdate: updateProgress })
        .to(progress, { value: 100, duration: 0.2, ease: 'none', onUpdate: updateProgress })
        .to({}, { duration: 0.4 })

      if (isReducedMotion) {
        timeline.to(splashRef.current, { opacity: 0, duration: 0.3 })
      } else {
        timeline.to(splashRef.current, { yPercent: -100, duration: 1.1, ease: 'power4.inOut' })
      }
    })

    return () => media.revert()
  }, [navigate])

  return (
    <section ref={splashRef} className={styles.splash} aria-label="자작 시작 화면">
      <p ref={copyRef} className={styles.copy}>
        당신의 하루에, 자작.
        <span className={styles.copyReveal} aria-hidden="true">당신의 하루에, 자작.</span>
      </p>
      <span ref={progressRef} className={styles.progress} aria-hidden="true">0</span>
    </section>
  )
}

export default SplashIntro
