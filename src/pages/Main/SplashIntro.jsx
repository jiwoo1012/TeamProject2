// Page placeholder.
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './SplashIntro.module.scss'

import sun from '../../assets/images/splash/splash-sun.png'
import rain from '../../assets/images/splash/splash-rain.png'
import laugh from '../../assets/images/splash/splash-laugh.png'
import bubbleSmall from '../../assets/images/splash/splash-bubble-short.png'
import bubbleWide from '../../assets/images/splash/splash-bubble-long.png'
import bottle from '../../assets/images/splash/splash-bottle.png'
import cup from '../../assets/images/splash/splash-cup.png'
import food from '../../assets/images/splash/splash-kimchi-pancake.png'
import paperBlue from '../../assets/images/splash/splash-bg-blue.webp'
import pointingHand from '../../assets/images/main/journey/entrance-keypad-hand.png'

const SplashIntro = ({ onComplete }) => {
  const [pressed, setPressed] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const exitTimer = window.setTimeout(() => setLeaving(true), 8000)
    const completeTimer = window.setTimeout(() => {
      if (onComplete) onComplete()
      else navigate('/')
    }, 8800)

    return () => {
      window.clearTimeout(exitTimer)
      window.clearTimeout(completeTimer)
    }
  }, [navigate, onComplete])

  return (
    <section className={`${styles.splash} ${leaving ? styles.leaving : ''}`} style={{ '--splash-paper': `url(${paperBlue})` }} aria-label="막동 스플래시 인트로">
      <div className={styles.scene}>
        <img className={`${styles.sticker} ${styles.rain}`} src={rain} alt="" />
        <img className={`${styles.sticker} ${styles.sun}`} src={sun} alt="" />
        <div className={styles.laughShell}>
          <img className={`${styles.sticker} ${styles.laugh}`} src={laugh} alt="" />
        </div>
        <img className={styles.cup} src={cup} alt="막걸리 잔" />
        <div className={styles.foodShell}>
          <img className={styles.food} src={food} alt="막걸리와 곁들이는 전" />
        </div>
        <div className={`${styles.bubble} ${styles.bubbleOne}`}><img src={bubbleSmall} alt="" /><span>달달한 게 좋아!</span></div>
        <div className={`${styles.bubble} ${styles.bubbleTwo}`}><img src={bubbleWide} alt="" /><span>이런 한 상 괜찮아?</span></div>
        <div className={`${styles.bubble} ${styles.bubbleThree}`}><img src={bubbleWide} alt="" /><span>기분이 어때 :-)</span></div>
        <div className={`${styles.bubble} ${styles.bubbleFour}`}><img src={bubbleWide} alt="" /><span>오늘 하루 고생했어</span></div>
        <div className={`${styles.bubble} ${styles.bubbleFive}`}><img src={bubbleWide} alt="" /><span>오늘은 어떤 술이 땡겨?</span></div>
        <button className={`${styles.bottleButton} ${pressed ? styles.pressed : ''}`} type="button" onClick={() => setPressed((value) => !value)} aria-pressed={pressed} aria-label="막걸리 병 흔들기">
          <img src={bottle} alt="막걸리 병" />
        </button>
        <img className={styles.pointingHand} src={pointingHand} alt="" />
        <div className={styles.loading} role="status" aria-label="페이지를 준비하고 있어요">
          <div className={styles.loadingLabel}>
            <span>LOADING</span>
            <span className={styles.loadingDots} aria-hidden="true">•••</span>
          </div>
          <div className={styles.loadingTrack} aria-hidden="true">
            <span className={styles.loadingFill} />
          </div>
        </div>
      </div>
    </section>
  )
}

export default SplashIntro
