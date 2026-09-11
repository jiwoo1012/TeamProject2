import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import styles from './EventCelebration.module.scss'

// JAJAK 팔레트 기반 축하 색상 — 네온/무지개 계열은 쓰지 않는다.
// 히어로 배너가 이미 따뜻한 베이지/아이보리 톤이라, 채도 있는 색(틸/앰버/테라코타/세이지)을
// 더 자주 뽑아 배경 위에서 파티클이 묻히지 않고 도드라지게 가중치를 둔다. 아이보리/오트밀은
// 한지 종이 조각 느낌을 위해 소량만 남겨둔다.
const PALETTE_WEIGHTED = [
  '#4D7E7B', '#4D7E7B', '#4D7E7B',
  '#789B8F', '#789B8F',
  '#D89A52', '#D89A52', '#D89A52',
  '#C97C63', '#C97C63', '#C97C63',
  '#748C9A', '#748C9A',
  '#E7D5B5',
  '#F2EDE4',
]
// 불꽃놀이 스파크 전용 소량의 밝은 하이라이트 (spec: "small brighter highlights are acceptable")
const SPARK_HIGHLIGHTS = ['#F4C874', '#8FD9CE', '#FBE7A1']

const CONFETTI_SHAPES = ['rect', 'square', 'strip', 'circle', 'paper', 'paper', 'star']
const FIREWORK_SHAPES = ['dot', 'diamond', 'star', 'streak']

let uid = 0
const nextId = () => `p${uid++}`

const rand = (min, max) => min + Math.random() * (max - min)
const pick = (arr) => arr[(Math.random() * arr.length) | 0]
const pickDepth = () => {
  const r = Math.random()
  if (r < 0.15) return 'bg'
  if (r < 0.72) return 'mid'
  return 'fg'
}
// 깊이(depth)에 따라 크기/속도/거리/불투명도를 다르게 줘서 레이어감을 만든다.
// 전경(fg): 크고 빠르고 멀리 튐 · 배경(bg): 작고 느리고 은은함.
const DEPTH_TUNING = {
  fg: { size: 1.4, dur: 0.82, dist: 1.2, opacity: 1 },
  mid: { size: 1, dur: 1, dist: 1, opacity: 0.95 },
  bg: { size: 0.65, dur: 1.3, dist: 0.7, opacity: 0.68 },
}

// 하나의 파티클 "데이터"를 만든다. DOM은 아직 만들지 않고, 렌더링은 React가 담당한다.
const makeParticle = ({ group, shape, x, y, color, size }) => {
  const depth = pickDepth()
  return {
    id: nextId(),
    group,
    shape,
    x,
    y,
    color,
    size: size * DEPTH_TUNING[depth].size,
    depth,
  }
}

// 방사형(불꽃놀이/반짝임) 파티클 묶음 생성
const buildRadialGroup = (group, count, originX, originY, { shapes = FIREWORK_SHAPES, sizeMin = 10, sizeMax = 20, colors = PALETTE_WEIGHTED } = {}) => (
  Array.from({ length: count }, () => {
    const shape = pick(shapes)
    const highlight = Math.random() < 0.28
    return makeParticle({
      group,
      shape,
      x: originX + rand(-6, 6),
      y: originY + rand(-6, 6),
      color: highlight ? pick(SPARK_HIGHLIGHTS) : pick(colors),
      size: shape === 'streak' ? rand(sizeMin + 8, sizeMax + 16) : rand(sizeMin, sizeMax),
    })
  })
)

// 컨페티 묶음 생성 (캐논 또는 상단에서 떨어지는 비)
const buildConfettiGroup = (group, count, originFn) => (
  Array.from({ length: count }, () => {
    const shape = pick(CONFETTI_SHAPES)
    const { x, y } = originFn()
    return makeParticle({
      group,
      shape,
      x,
      y,
      color: pick(PALETTE_WEIGHTED),
      size: shape === 'strip' ? rand(4, 7) : shape === 'star' ? rand(14, 20) : rand(11, 18),
    })
  })
)

const buildParticles = (isMobile) => {
  const w = window.innerWidth
  const h = window.innerHeight
  const density = isMobile ? 0.6 : 1
  const n = (count) => Math.max(4, Math.round(count * density))

  const list = []

  // 0.00s — 소소한 예고 반짝임
  list.push(...buildRadialGroup('anticipation', n(6), w * 0.5, h * (isMobile ? 0.2 : 0.22), {
    shapes: ['dot'], sizeMin: 5, sizeMax: 8,
  }))

  // 0.15s — 좌/우 하단 컨페티 캐논
  list.push(...buildConfettiGroup('cannonLeft', n(16), () => ({ x: w * rand(0.03, 0.08), y: h * rand(0.93, 0.99) })))
  list.push(...buildConfettiGroup('cannonRight', n(16), () => ({ x: w * rand(0.92, 0.97), y: h * rand(0.93, 0.99) })))

  if (isMobile) {
    // 모바일: 좌/우 측면에서도 별도로 터지도록(spec 12) 중간 높이 사이드 캐논 추가
    list.push(...buildConfettiGroup('cannonSideL', n(8), () => ({ x: w * rand(0, 0.04), y: h * rand(0.45, 0.6) })))
    list.push(...buildConfettiGroup('cannonSideR', n(8), () => ({ x: w * rand(0.96, 1), y: h * rand(0.45, 0.6) })))
  }

  // 0.30s / 0.45s — 좌상단 / 우상단 불꽃
  list.push(...buildRadialGroup('fireworkUL', n(14), w * 0.15, h * (isMobile ? 0.12 : 0.16)))
  list.push(...buildRadialGroup('fireworkUR', n(14), w * 0.85, h * (isMobile ? 0.12 : 0.16)))

  // 0.65s — 더 큰 2차 폭발 (좌/우, "opposite-side burst")
  list.push(...buildRadialGroup('fireworkBig1', n(18), w * 0.1, h * (isMobile ? 0.24 : 0.34), { sizeMax: 16 }))
  list.push(...buildRadialGroup('fireworkBig2', n(18), w * 0.9, h * (isMobile ? 0.26 : 0.32), { sizeMax: 16 }))

  // 0.85s — 중앙/히어로 부근 강한 축하 버스트 (모바일은 히어로 텍스트를 피해 더 아래로)
  list.push(...buildRadialGroup('centerBurst', n(20), w * 0.5, h * (isMobile ? 0.4 : 0.36), {
    shapes: ['star', 'dot', 'streak', 'glow'], sizeMax: 15,
  }))

  // 1.00s — 상단(및 일부 측면)에서 퍼지며 떨어지는 2차 컨페티
  list.push(...buildConfettiGroup('confettiRain', n(20), () => {
    const edge = Math.random()
    if (edge < 0.15) return { x: w * rand(0, 0.03), y: h * rand(0.1, 0.5) }
    if (edge < 0.3) return { x: w * rand(0.97, 1), y: h * rand(0.1, 0.5) }
    return { x: w * rand(0.05, 0.95), y: h * rand(-0.02, 0.06) }
  }))

  // 1.20s — 보조 반짝임 버스트 두 곳
  list.push(...buildRadialGroup('sparkle2a', n(8), w * 0.26, h * 0.46, { shapes: ['dot', 'star'], sizeMax: 11 }))
  list.push(...buildRadialGroup('sparkle2b', n(8), w * 0.74, h * 0.5, { shapes: ['dot', 'star'], sizeMax: 11 }))

  // 2.60s — 마무리 작은 불꽃/반짝임
  list.push(...buildRadialGroup('finalSparkle', n(10), w * 0.5, h * 0.5, { shapes: ['dot', 'star', 'glow'], sizeMax: 11 }))

  return list
}

// 아주 절제된 reduced-motion용 반짝임 몇 개 (spec: "very subtle short fade/sparkle effect")
const buildReducedParticles = () => {
  const w = window.innerWidth
  const h = window.innerHeight
  return Array.from({ length: 6 }, () => makeParticle({
    group: 'reduced',
    shape: 'dot',
    x: w * rand(0.35, 0.65),
    y: h * rand(0.3, 0.5),
    color: pick(PALETTE_WEIGHTED),
    size: rand(6, 9),
  }))
}

const shapeBoxSize = (p) => {
  if (p.shape === 'rect') return { w: p.size * 1.6, h: p.size * 0.75 }
  if (p.shape === 'streak') return { w: p.size * 0.28, h: p.size }
  return { w: p.size, h: p.size }
}

const EventCelebration = () => {
  const containerRef = useRef(null)
  const elMapRef = useRef(new Map())
  const [mounted, setMounted] = useState(true)
  const [particles] = useState(() => {
    const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
    const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    return reduce ? buildReducedParticles() : buildParticles(isMobile)
  })

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    // group별로 {particle 데이터, 실제 DOM element}를 함께 반환해, 애니메이션 단계에서
    // depth(fg/mid/bg)에 따라 속도·거리·불투명도를 다르게 줄 수 있게 한다.
    const byGroup = (name) => particles
      .filter((p) => p.group === name)
      .map((p) => ({ p, el: elMapRef.current.get(p.id) }))
      .filter((x) => x.el)

    const ctx = gsap.context(() => {
      const finish = () => setMounted(false)
      const tl = gsap.timeline({ onComplete: finish })

      if (reduce) {
        const items = byGroup('reduced')
        const els = items.map((x) => x.el)
        tl.to(els, { opacity: 1, scale: 1.1, duration: 0.35, ease: 'power2.out', stagger: 0.04 }, 0)
        tl.to(els, { opacity: 0, duration: 0.35, ease: 'power1.in' }, 0.5)
        return
      }

      // 방사형(불꽃/반짝임) 폭발 — 각 파티클이 자기 각도로 퍼져나가며 감속·페이드
      const radialBurst = (group, startTime, { spread = 90, durMin = 0.55, durMax = 0.95, ease = 'power3.out', scaleMax = 1.3 } = {}) => {
        const items = byGroup(group)
        items.forEach(({ p, el }, i) => {
          const tune = DEPTH_TUNING[p.depth]
          const angle = (i / items.length) * Math.PI * 2 + rand(-0.35, 0.35)
          const dist = rand(spread * 0.45, spread) * tune.dist
          const dx = Math.cos(angle) * dist
          const dy = Math.sin(angle) * dist
          const dur = rand(durMin, durMax) * tune.dur
          const t0 = startTime + rand(0, 0.08)
          gsap.set(el, { x: 0, y: 0, opacity: tune.opacity, scale: 0.3, rotation: angle * (180 / Math.PI) })
          tl.to(el, {
            x: dx, y: dy, scale: rand(0.8, scaleMax), rotation: `+=${rand(-140, 140)}`,
            opacity: 0, duration: dur, ease,
          }, t0)
        })
      }

      // 컨페티 캐논 — 대각선 위로 발사 후 중력으로 낙하하며 회전
      const confettiCannon = (group, startTime, direction) => {
        const items = byGroup(group)
        items.forEach(({ p, el }) => {
          const tune = DEPTH_TUNING[p.depth]
          const launchX = direction * rand(70, 200) * tune.dist
          const launchY = -rand(120, 240) * tune.dist
          const fallX = launchX + direction * rand(10, 60)
          const fallY = rand(260, 460)
          const rot = rand(220, 620) * (Math.random() < 0.5 ? -1 : 1)
          const delay = rand(0, 0.22)
          const upDur = rand(0.45, 0.7) * tune.dur
          const downDur = rand(0.85, 1.25) * tune.dur
          const t0 = startTime + delay
          gsap.set(el, { x: 0, y: 0, opacity: tune.opacity, scale: rand(0.85, 1.15), rotation: 0 })
          tl.to(el, { x: launchX, y: launchY, rotation: rot * 0.35, duration: upDur, ease: 'power2.out' }, t0)
          tl.to(el, { x: fallX, y: fallY, rotation: rot, duration: downDur, ease: 'power1.in' }, t0 + upDur)
          tl.to(el, { opacity: 0, duration: 0.4 }, t0 + upDur + downDur - 0.35)
        })
      }

      // 상단(또는 측면)에서 시작해 그대로 떨어지는 2차 컨페티 비
      const confettiRain = (group, startTime) => {
        const items = byGroup(group)
        items.forEach(({ p, el }) => {
          const tune = DEPTH_TUNING[p.depth]
          const dx = rand(-70, 70)
          const dy = rand(340, 560) * tune.dist
          const rot = rand(-420, 420)
          const dur = rand(1.5, 2.3) * tune.dur
          const delay = rand(0, 0.55)
          const t0 = startTime + delay
          gsap.set(el, { x: 0, y: -10, opacity: 0, scale: rand(0.8, 1.15) })
          tl.to(el, { opacity: tune.opacity, duration: 0.25, ease: 'power1.out' }, t0)
          tl.to(el, { x: dx, y: dy, rotation: rot, duration: dur, ease: 'power1.in' }, t0)
          tl.to(el, { opacity: 0, duration: 0.45 }, t0 + dur - 0.3)
        })
      }

      // ---- 타임라인 ----
      radialBurst('anticipation', 0, { spread: 30, durMin: 0.3, durMax: 0.45, ease: 'sine.out', scaleMax: 1 })
      confettiCannon('cannonLeft', 0.15, 1)
      confettiCannon('cannonRight', 0.15, -1)
      if (byGroup('cannonSideL').length) confettiCannon('cannonSideL', 0.2, 1)
      if (byGroup('cannonSideR').length) confettiCannon('cannonSideR', 0.2, -1)
      radialBurst('fireworkUL', 0.3, { spread: 105, durMin: 0.6, durMax: 0.9 })
      radialBurst('fireworkUR', 0.45, { spread: 105, durMin: 0.6, durMax: 0.9 })
      radialBurst('fireworkBig1', 0.65, { spread: 165, durMin: 0.75, durMax: 1.1 })
      radialBurst('fireworkBig2', 0.72, { spread: 165, durMin: 0.75, durMax: 1.1 })
      radialBurst('centerBurst', 0.85, { spread: 150, durMin: 0.6, durMax: 1.0, ease: 'expo.out' })
      confettiRain('confettiRain', 1.0)
      radialBurst('sparkle2a', 1.2, { spread: 70, durMin: 0.5, durMax: 0.8, ease: 'back.out(1.7)' })
      radialBurst('sparkle2b', 1.3, { spread: 70, durMin: 0.5, durMax: 0.8, ease: 'back.out(1.7)' })
      radialBurst('finalSparkle', 2.6, { spread: 80, durMin: 0.5, durMax: 0.75, ease: 'sine.out' })

      // 2.9s부터 남아있을 수 있는 모든 것을 한 번에 정리 — 개별 타이밍이 조금씩
      // 어긋나도 3.4s 근방에는 확실히 아무것도 안 보이게 한다.
      tl.to(containerRef.current, { opacity: 0, duration: 0.5, ease: 'power1.in' }, 2.9)
    }, containerRef)

    return () => {
      ctx.revert()
    }
    // particles는 최초 렌더에서만 생성되어 이후 바뀌지 않으므로 의도적으로 제외한다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!mounted) return null

  return (
    <div ref={containerRef} className={styles.celebration} role="presentation" aria-hidden="true">
      {particles.map((p) => {
        const box = shapeBoxSize(p)
        return (
          <span
            key={p.id}
            ref={(el) => { if (el) elMapRef.current.set(p.id, el); else elMapRef.current.delete(p.id) }}
            className={[styles.particle, styles[p.shape]].join(' ')}
            style={{
              left: p.x,
              top: p.y,
              width: box.w,
              height: box.h,
              marginLeft: -box.w / 2,
              marginTop: -box.h / 2,
              background: p.color,
              color: p.color,
            }}
          />
        )
      })}
    </div>
  )
}

export default EventCelebration
