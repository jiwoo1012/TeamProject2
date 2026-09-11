import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { PATHS } from '../../../routes/paths'
import makdongIcon from '../../../assets/images/eventPage/makdong-tavern.png'
import styles from './TavernShortcut.module.scss'

gsap.registerPlugin(ScrollTrigger)

const ATTENTION_CLASS_TIMEOUT = 2400
// Roughly the shortcut's own footprint plus MobileTopButton stacked above
// it, so it fades out before the site footer (subscribe form, links) could
// ever sit underneath a fixed bottom-right button.
const FOOTER_SAFE_ZONE_PX = 200

/**
 * Floating shortcut to 막동이주막 (existing route: PATHS.aiTavern).
 * `attentionTargetRef` is optional — when given, the shortcut plays one
 * brief wiggle + label reveal the first time that section scrolls into view.
 */
const TavernShortcut = ({ attentionTargetRef }) => {
  const linkRef = useRef(null)
  const floatRef = useRef(null)
  const [isNearFooter, setIsNearFooter] = useState(false)

  useEffect(() => {
    const footer = document.querySelector('footer')
    if (!footer) return undefined
    const updateFooterProximity = () => {
      setIsNearFooter(footer.getBoundingClientRect().top < window.innerHeight - FOOTER_SAFE_ZONE_PX)
    }
    updateFooterProximity()
    window.addEventListener('scroll', updateFooterProximity, { passive: true })
    window.addEventListener('resize', updateFooterProximity)
    return () => {
      window.removeEventListener('scroll', updateFooterProximity)
      window.removeEventListener('resize', updateFooterProximity)
    }
  }, [])

  useEffect(() => {
    const link = linkRef.current
    const floatEl = floatRef.current
    if (!link || !floatEl) return undefined

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let floatTween
    if (!prefersReducedMotion) {
      floatTween = gsap.to(floatEl, {
        y: 7,
        duration: 2.6,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      })
    }

    const pauseFloat = () => floatTween?.pause()
    const resumeFloat = () => floatTween?.play()
    link.addEventListener('pointerenter', pauseFloat)
    link.addEventListener('pointerleave', resumeFloat)
    link.addEventListener('focus', pauseFloat)
    link.addEventListener('blur', resumeFloat)

    let attentionTimer
    let attentionTrigger
    const attentionTargetEl = attentionTargetRef?.current
    if (!prefersReducedMotion && attentionTargetEl) {
      attentionTrigger = ScrollTrigger.create({
        trigger: attentionTargetEl,
        start: 'top 65%',
        once: true,
        onEnter: () => {
          link.classList.add(styles.attention)
          attentionTimer = window.setTimeout(() => {
            link.classList.remove(styles.attention)
          }, ATTENTION_CLASS_TIMEOUT)
        },
      })
    }

    return () => {
      floatTween?.kill()
      link.removeEventListener('pointerenter', pauseFloat)
      link.removeEventListener('pointerleave', resumeFloat)
      link.removeEventListener('focus', pauseFloat)
      link.removeEventListener('blur', resumeFloat)
      attentionTrigger?.kill()
      window.clearTimeout(attentionTimer)
    }
  }, [attentionTargetRef])

  return (
    <Link
      ref={linkRef}
      to={PATHS.aiTavern}
      className={`${styles.shortcut} ${isNearFooter ? styles.hidden : ''}`}
      aria-label="막동이주막 가기"
      tabIndex={isNearFooter ? -1 : 0}
    >
      <span className={styles.bubble} aria-hidden="true">막동이 주막 궁금하지 않아?</span>
      <span className={styles.iconFloat} ref={floatRef}>
        <span className={styles.mobileLabel} aria-hidden="true">막동이 주막 가기</span>
        <span className={styles.iconScale}>
          <img src={makdongIcon} alt="" aria-hidden="true"  loading="lazy" decoding="async" />
        </span>
      </span>
    </Link>
  )
}

export default TavernShortcut
