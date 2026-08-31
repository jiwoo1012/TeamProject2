import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

import styles from './AiResult.module.scss'

// 실제 이미지 경로만 여기에 넣어주면 됨
const RESULT_IMAGES = {
  liquor: '',
  food: '',
  glass: '',
  another01: '',
  another02: '',
}

// OpenAI 연결 전 임시 결과
// 네가 보내준 실제 상품 데이터 + pairing 기준
const MOCK_RESULT = {
  liquor: {
    productId: 'liq_001',
    productName: '햇쌀 맑은 이화주',
    alcoholByVolume: '8.0%',
    sweetness: 5,
    acidity: 2,
    scentIntensity: 3,
    bodyWeight: 5,
    flavorKeywords: ['구수함', '달달함', '되직함'],
    productDescription:
      '찹쌀과 누룩으로 빚어 숟가락으로 떠먹을 수 있을 정도로 되직한 탁주입니다. 쌀 고유의 구수한 단맛이 은은하게 퍼집니다.',
  },

  food: {
    productId: 'snk_005',
    productName: '감말랭이와 호두 정과',
    snackType: '디저트',
    productDescription:
      '당도가 높은 곶감을 한입 크기로 썬 감말랭이와 바삭하게 조린 호두 정과를 담은 전통 디저트입니다.',
  },

  glass: {
    productId: 'gls_001',
    productName: '투박한 황토 옹기잔',
    volume: '50ml',
    productDescription:
      '거친 질감의 황토로 빚어 손에 쥐었을 때 포근한 온기가 느껴지는 전통 사발 형태의 술잔입니다.',
  },

  reason:
    '오늘의 취향과 분위기를 바탕으로 막둥이가 어울리는 전통주와 안주, 술잔을 하나의 주안상으로 준비했어요.',
}

const OTHER_RESULTS = [
  {
    id: 1,
    title: '산뜻하게 즐기는 주안상',
    liquor: '새벽 솔잎 막걸리',
    food: '바삭 감자 채전 밀키트',
  },
  {
    id: 2,
    title: '조용한 밤을 위한 주안상',
    liquor: '오디 품은 백련주',
    food: '흑임자 쌀다과 세트',
  },
]

const AiResult = () => {
  const navigate = useNavigate()

  const pageRef = useRef(null)
  const sectionRefs = useRef([])
  const currentSectionRef = useRef(0)
  const isMovingRef = useRef(false)

  const sectionCount = 5

  useEffect(() => {
    const page = pageRef.current

    if (!page) return undefined

    const handleWheel = (e) => {
      // 모바일은 기본 터치 스크롤 사용
      if (window.innerWidth <= 768) return

      e.preventDefault()

      if (isMovingRef.current) return
      if (Math.abs(e.deltaY) < 10) return

      const direction = e.deltaY > 0 ? 1 : -1

      const nextIndex = Math.min(
        Math.max(currentSectionRef.current + direction, 0),
        sectionCount - 1
      )

      if (nextIndex === currentSectionRef.current) return

      currentSectionRef.current = nextIndex
      isMovingRef.current = true

      sectionRefs.current[nextIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      })

      window.setTimeout(() => {
        isMovingRef.current = false
      }, 700)
    }

    page.addEventListener('wheel', handleWheel, {
      passive: false,
    })

    return () => {
      page.removeEventListener('wheel', handleWheel)
    }
  }, [])

  const setSectionRef = (index) => (el) => {
    sectionRefs.current[index] = el
  }

  return (
    <main ref={pageRef} className={styles.aiResult}>
      {/* =========================
          01. 전체 주안상
      ========================= */}
      <section
        ref={setSectionRef(0)}
        className={`${styles.section} ${styles.introSection}`}
      >
        <div className={styles.introInner}>
          <div className={styles.introText}>
            <h1>막둥이가 오늘의 주안상을 차렸어요!</h1>

            <p>
              당신의 오늘과 잘 어울리는 한 상을 준비했어요.
              <br />
              하나씩 천천히 살펴볼까요?
            </p>
          </div>

          <div className={styles.tableArea}>
            <div className={`${styles.tableProduct} ${styles.tableFood}`}>
              <span className={styles.tableLabel}>오늘의 한 접시</span>

              {RESULT_IMAGES.food && (
                <img
                  src={RESULT_IMAGES.food}
                  alt={MOCK_RESULT.food.productName}
                />
              )}

              <strong>{MOCK_RESULT.food.productName}</strong>
            </div>

            <div className={`${styles.tableProduct} ${styles.tableLiquor}`}>
              <span className={styles.tableLabel}>오늘의 한 잔</span>

              {RESULT_IMAGES.liquor && (
                <img
                  src={RESULT_IMAGES.liquor}
                  alt={MOCK_RESULT.liquor.productName}
                />
              )}

              <strong>{MOCK_RESULT.liquor.productName}</strong>
            </div>

            <div className={`${styles.tableProduct} ${styles.tableGlass}`}>
              <span className={styles.tableLabel}>오늘의 술잔</span>

              {RESULT_IMAGES.glass && (
                <img
                  src={RESULT_IMAGES.glass}
                  alt={MOCK_RESULT.glass.productName}
                />
              )}

              <strong>{MOCK_RESULT.glass.productName}</strong>
            </div>
          </div>

          <button
            type="button"
            className={styles.smallButton}
            onClick={() =>
              sectionRefs.current[1]?.scrollIntoView({
                behavior: 'smooth',
              })
            }
          >
            구성 하나씩 보기
          </button>

          <div className={styles.downArrow}>↓</div>
        </div>
      </section>

      {/* =========================
          02. 전통주
      ========================= */}
      <section
        ref={setSectionRef(1)}
        className={`${styles.section} ${styles.productSection}`}
      >
        <div className={styles.productInner}>
          <div className={styles.productInfo}>
            <p className={styles.productTitleLabel}>오늘의 한 잔,</p>

            <h2>{MOCK_RESULT.liquor.productName}</h2>

            <p className={styles.productDescription}>
              {MOCK_RESULT.liquor.productDescription}
            </p>

            <div className={styles.liquorStats}>
              <div>
                <span>도수</span>
                <strong>{MOCK_RESULT.liquor.alcoholByVolume}</strong>
              </div>

              <div>
                <span>단맛</span>
                <strong>{MOCK_RESULT.liquor.sweetness}/5</strong>
              </div>

              <div>
                <span>산미</span>
                <strong>{MOCK_RESULT.liquor.acidity}/5</strong>
              </div>

              <div>
                <span>향</span>
                <strong>{MOCK_RESULT.liquor.scentIntensity}/5</strong>
              </div>

              <div>
                <span>무게감</span>
                <strong>{MOCK_RESULT.liquor.bodyWeight}/5</strong>
              </div>
            </div>

            <div className={styles.keywordList}>
              {MOCK_RESULT.liquor.flavorKeywords.map((keyword) => (
                <span key={keyword}>{keyword}</span>
              ))}
            </div>

            <button
              type="button"
              className={styles.smallButton}
              onClick={() =>
                navigate(`/product/${MOCK_RESULT.liquor.productId}`)
              }
            >
              상품 자세히 보기
            </button>
          </div>

          <div className={styles.productImage}>
            {RESULT_IMAGES.liquor && (
              <img
                src={RESULT_IMAGES.liquor}
                alt={MOCK_RESULT.liquor.productName}
              />
            )}
          </div>
        </div>
      </section>

      {/* =========================
          03. 안주
      ========================= */}
      <section
        ref={setSectionRef(2)}
        className={`${styles.section} ${styles.productSection}`}
      >
        <div className={styles.productInner}>
          <div className={styles.productInfo}>
            <p className={styles.productTitleLabel}>오늘의 한 접시,</p>

            <h2>{MOCK_RESULT.food.productName}</h2>

            <p className={styles.productDescription}>
              {MOCK_RESULT.food.productDescription}
            </p>

            <div className={styles.keywordList}>
              <span>{MOCK_RESULT.food.snackType}</span>
              <span>전통 디저트</span>
              <span>달콤한 안주</span>
            </div>

            <button
              type="button"
              className={styles.smallButton}
              onClick={() =>
                navigate(`/product/${MOCK_RESULT.food.productId}`)
              }
            >
              상품 자세히 보기
            </button>
          </div>

          <div className={styles.productImage}>
            {RESULT_IMAGES.food && (
              <img
                src={RESULT_IMAGES.food}
                alt={MOCK_RESULT.food.productName}
              />
            )}
          </div>
        </div>
      </section>

      {/* =========================
          04. 술잔
      ========================= */}
      <section
        ref={setSectionRef(3)}
        className={`${styles.section} ${styles.productSection}`}
      >
        <div className={styles.productInner}>
          <div className={styles.productInfo}>
            <p className={styles.productTitleLabel}>오늘의 술잔,</p>

            <h2>{MOCK_RESULT.glass.productName}</h2>

            <p className={styles.productDescription}>
              {MOCK_RESULT.glass.productDescription}
            </p>

            <div className={styles.keywordList}>
              <span>전통 술잔</span>
              <span>황토</span>
              <span>{MOCK_RESULT.glass.volume}</span>
            </div>

            <button
              type="button"
              className={styles.smallButton}
              onClick={() =>
                navigate(`/product/${MOCK_RESULT.glass.productId}`)
              }
            >
              상품 자세히 보기
            </button>
          </div>

          <div className={styles.productImage}>
            {RESULT_IMAGES.glass && (
              <img
                src={RESULT_IMAGES.glass}
                alt={MOCK_RESULT.glass.productName}
              />
            )}
          </div>
        </div>
      </section>

      {/* =========================
          05. 다른 주안상
      ========================= */}
      <section
        ref={setSectionRef(4)}
        className={`${styles.section} ${styles.otherSection}`}
      >
        <div className={styles.otherInner}>
          <div className={styles.otherHeading}>
            <h2>막둥이가 준비한 또 다른 주안상도 있어요</h2>

            <p>조금 다른 조합도 함께 살펴보세요!</p>
          </div>

          <div className={styles.otherList}>
            {OTHER_RESULTS.map((item, index) => {
              const imageKey =
                index === 0 ? 'another01' : 'another02'

              return (
                <article key={item.id} className={styles.otherCard}>
                  <div className={styles.otherCardImage}>
                    {RESULT_IMAGES[imageKey] && (
                      <img
                        src={RESULT_IMAGES[imageKey]}
                        alt={item.title}
                      />
                    )}
                  </div>

                  <div className={styles.otherCardText}>
                    <span>막둥이의 또 다른 추천</span>

                    <h3>{item.title}</h3>

                    <p>{item.liquor}</p>
                    <p>{item.food}</p>

                    <button type="button">
                      주안상 보기
                    </button>
                  </div>
                </article>
              )
            })}
          </div>

          <div className={styles.bottomButtons}>
            <button
              type="button"
              className={styles.smallButton}
              onClick={() => navigate('/ai/survey')}
            >
              다시 추천받기
            </button>

            <button
              type="button"
              className={styles.smallButton}
              onClick={() => navigate('/shop')}
            >
              다른 상품 보러 가기
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}

export default AiResult