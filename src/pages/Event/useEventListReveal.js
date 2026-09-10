import { useLayoutEffect } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import styles from './EventList.module.scss'

gsap.registerPlugin(ScrollTrigger)

// Small, sophisticated entrance for the event grid: title/filters fade up,
// the featured roulette card fades up right after, then the remaining cards
// follow with a very small stagger. Re-runs when the visible card set
// changes (filter tab switch) so the reveal replays for the new cards.
const useEventListReveal = (sectionRef, replayKey) => {
  useLayoutEffect(() => {
    const section = sectionRef.current
    if (!section) return undefined

    const heading = section.querySelector(`.${styles.sectionHeading}`)
    const filters = section.querySelector(`.${styles.filters}`)
    const cards = gsap.utils.toArray(section.querySelectorAll(`.${styles.eventCard}`))
    const targets = [heading, filters, ...cards].filter(Boolean)

    if (targets.length === 0) return undefined

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(targets, { clearProps: 'opacity,visibility,transform' })
      return undefined
    }

    const featured = cards.find((card) => card.classList.contains(styles.featuredCard))
    const restCards = cards.filter((card) => card !== featured)

    gsap.set(heading, { autoAlpha: 0, y: 24 })
    gsap.set(filters, { autoAlpha: 0, y: 16 })
    gsap.set(cards, { autoAlpha: 0, y: 28 })

    // Once the entrance finishes, drop the inline transform GSAP leaves
    // behind — otherwise it out-specificities the CSS :hover lift on
    // .eventCard forever after, since an inline style always wins over a
    // stylesheet rule regardless of :hover.
    const releaseInlineTransform = () => gsap.set(cards, { clearProps: 'transform' })

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 78%',
        toggleActions: 'play none none reverse',
      },
      onComplete: releaseInlineTransform,
    })
      .to(heading, { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power2.out' })
      .to(filters, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.35')
      .to(
        featured ?? [],
        { autoAlpha: 1, y: 0, duration: 0.75, ease: 'power2.out' },
        '-=0.25',
      )
      .to(
        restCards,
        { autoAlpha: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out' },
        featured ? '-=0.45' : '-=0.25',
      )

    return () => {
      timeline.scrollTrigger?.kill()
      timeline.kill()
      gsap.set(targets, { clearProps: 'opacity,visibility,transform' })
    }
  }, [sectionRef, replayKey])
}

export default useEventListReveal
