import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {
  useLocation,
  useNavigate,
} from 'react-router-dom'

import {
  connectFunctionsEmulator,
  getFunctions,
  httpsCallable,
} from 'firebase/functions'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import app from '../../firebase/firebase'

import {
  foods,
  glasses,
  liquors,
} from '../../data/products'

import pairings from '../../data/pairings.json'

import trayImage from '../../assets/images/ai/tray.png'
import backgroundImage from '../../assets/images/ai/background.png'
import makdongImage from '../../assets/characters/M007_Poses03.png'

import styles from './AiResult.module.scss'

gsap.registerPlugin(ScrollTrigger)


// ========================================
// 상품 이미지
// ========================================

const productImages = import.meta.glob(
  '../../assets/images/products/product*.png',
  {
    eager: true,
    import: 'default',
  }
)


// AI 추천 구성용 누끼 이미지
const aiAssetImages = import.meta.glob(
  '../../assets/images/ai/*.png',
  {
    eager: true,
    import: 'default',
  }
)


const resolveImage = (imageUrl) => {
  if (!imageUrl) {
    return ''
  }

  return Object.entries(
    productImages
  ).find(([path]) =>
    path.endsWith(
      `/${imageUrl}`
    )
  )?.[1] || ''
}


const resolveAiImage = (imageUrl) => {
  if (!imageUrl) {
    return ''
  }

  return Object.entries(
    aiAssetImages
  ).find(([path]) =>
    path.endsWith(
      `/${imageUrl}`
    )
  )?.[1] || ''
}

const getAiImageName = (product) =>
  product?.aiImageUrl ||
  product?.aiImage ||
  product?.aiImageName ||
  ''


// ========================================
// Firebase Functions
// ========================================

const functions =
  getFunctions(app)

if (import.meta.env.DEV) {
  try {
    connectFunctionsEmulator(
      functions,
      '127.0.0.1',
      5001
    )
  } catch (error) {
    // 무시
  }
}

const recommendJajak =
  httpsCallable(
    functions,
    'recommendJajak'
  )


const findProductById = (
  products,
  productId
) => {
  return products.find(
    (product) =>
      product.productId ===
      productId
  ) || null
}


const combineRecommendation = (
  recommendation
) => {
  if (!recommendation) {
    return null
  }

  const liquor =
    findProductById(
      liquors,
      recommendation.liquorId
    )

  const food =
    findProductById(
      foods,
      recommendation.foodId
    )

  const glass =
    findProductById(
      glasses,
      recommendation.glassId
    )

  if (
    !liquor ||
    !food ||
    !glass
  ) {
    return null
  }

  return {
    ...recommendation,
    liquor,
    food,
    glass,

    images: {
      liquor:
        resolveImage(
          liquor.imageUrl
        ),
      food:
        resolveImage(
          food.imageUrl
        ),
      glass:
        resolveImage(
          glass.imageUrl
        ),
    },

    aiImages: {
      liquor:
        resolveAiImage(
          getAiImageName(liquor)
        ),
      food:
        resolveAiImage(
          getAiImageName(food)
        ),
      glass:
        resolveAiImage(
          getAiImageName(glass)
        ),
    },
  }
}


const getErrorMessage = (
  error
) => {
  const code =
    error?.code || ''

  if (
    code ===
    'functions/unauthenticated'
  ) {
    return '로그인 정보를 확인할 수 없어요. 다시 로그인한 뒤 추천을 받아주세요.'
  }

  if (
    code ===
    'functions/failed-precondition'
  ) {
    return (
      error?.message ||
      '선택한 조건에 맞는 추천 상품을 찾지 못했어요.'
    )
  }

  if (
    code ===
    'functions/not-found'
  ) {
    return '회원 정보를 찾을 수 없어요.'
  }

  if (
    code ===
    'functions/invalid-argument'
  ) {
    return '추천에 필요한 설문 정보가 올바르지 않아요.'
  }

  if (
    code ===
    'functions/unavailable'
  ) {
    return '추천 서버에 연결할 수 없어요. Functions Emulator가 실행 중인지 확인해주세요.'
  }

  return '막둥이가 주안상을 준비하는 중 문제가 생겼어요. 다시 시도해주세요.'
}


const AiResult = () => {
  const navigate =
    useNavigate()

  const location =
    useLocation()

  const surveyType =
    location.state?.surveyType

  const todaySurvey =
    location.state?.todaySurvey ||
    location.state?.answers ||
    null

  const userPreference =
    location.state?.userPreference ||
    null

  const [
    recommendationResponse,
    setRecommendationResponse,
  ] = useState(null)

  const [
    isLoading,
    setIsLoading,
  ] = useState(true)

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('')

  const [
    selectedRecommendationIndex,
    setSelectedRecommendationIndex,
  ] = useState(0)

  const hasRequestedRef =
    useRef(false)

  const pageRef =
    useRef(null)

  const sectionRefs =
    useRef([])

  const currentSectionRef =
    useRef(0)

  const compositionSectionRef =
    useRef(null)

  const compositionStageRef =
    useRef(null)

  const liquorVisualRef =
    useRef(null)

  const glassVisualRef =
    useRef(null)

  const foodVisualRef =
    useRef(null)

  const compositionHeadingRef =
    useRef(null)

  const bgPatternRef =
    useRef(null)

  const trayRef =
    useRef(null)

  const compositionFooterRef =
    useRef(null)

  const liquorDetailTextRef =
    useRef(null)

  const foodDetailTextRef =
    useRef(null)

  const glassDetailTextRef =
    useRef(null)

  const liquorFocusTargetRef =
    useRef(null)

  const foodDetailVisualRef =
    useRef(null)

  const glassDetailVisualRef =
    useRef(null)


  useEffect(() => {
    if (
      hasRequestedRef.current
    ) {
      return
    }

    if (
      !surveyType ||
      !todaySurvey
    ) {
      setIsLoading(false)
      setErrorMessage(
        '추천에 필요한 설문 정보가 없어요. 먼저 막둥이의 질문에 답해주세요.'
      )
      return
    }

    if (
      surveyType === 'member' &&
      !userPreference
    ) {
      setIsLoading(false)
      setErrorMessage(
        '저장된 취향 정보를 확인할 수 없어요. 취향 등록 상태를 확인해주세요.'
      )
      return
    }

    hasRequestedRef.current =
      true

    const fetchRecommendation =
      async () => {
        try {
          setIsLoading(true)
          setErrorMessage('')

          const response =
            await recommendJajak({
              surveyType,
              todaySurvey,
              userPreference:
                surveyType === 'member'
                  ? userPreference
                  : null,
              liquors,
              foods,
              glasses,
              pairings,
            })

          const data =
            response.data

          if (
            !data ||
            !Array.isArray(
              data.recommendations
            ) ||
            data.recommendations
              .length === 0
          ) {
            throw new Error(
              'EMPTY_RECOMMENDATIONS'
            )
          }

          setRecommendationResponse(
            data
          )
        } catch (error) {
          console.error(
            'JAJAK 추천 불러오기 실패:',
            error
          )
          setErrorMessage(
            getErrorMessage(
              error
            )
          )
        } finally {
          setIsLoading(false)
        }
      }

    fetchRecommendation()
  }, [
    surveyType,
    todaySurvey,
    userPreference,
  ])


  const recommendationTables =
    useMemo(() => {
      const recommendations =
        recommendationResponse
          ?.recommendations

      if (
        !Array.isArray(
          recommendations
        )
      ) {
        return []
      }

      return recommendations
        .map(
          combineRecommendation
        )
        .filter(Boolean)
    }, [
      recommendationResponse,
    ])


  const currentResult =
    recommendationTables[
      selectedRecommendationIndex
    ] || null


  const otherResults =
    recommendationTables
      .map(
        (
          recommendation,
          index
        ) => ({
          recommendation,
          originalIndex:
            index,
        })
      )
      .filter(
        ({ originalIndex }) =>
          originalIndex !==
          selectedRecommendationIndex
      )


  const handleSelectOther =
    (index) => {
      setSelectedRecommendationIndex(
        index
      )
      currentSectionRef.current = 0
      sectionRefs.current[0]
        ?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
    }


  const handleSaveTable =
    () => {
      if (!currentResult) {
        return
      }
      console.log(
        '주안상 저장:',
        currentResult.tableId
      )
    }


  useEffect(() => {
    if (
      isLoading ||
      !currentResult ||
      !pageRef.current ||
      !compositionSectionRef.current ||
      !compositionStageRef.current
    ) {
      return undefined
    }

    const page =
      pageRef.current

    const section =
      compositionSectionRef.current

    const stage =
      compositionStageRef.current

    const pageComputedStyle =
      window.getComputedStyle(
        page
      )

    const pageIsScroller =
      /auto|scroll/.test(
        pageComputedStyle
          .overflowY
      ) &&
      page.scrollHeight >
        page.clientHeight + 1

    const scrollContainer =
      pageIsScroller
        ? page
        : window

    const previousScrollSnapType =
      page.style.scrollSnapType

    page.style.scrollSnapType =
      'none'

    const heading =
      compositionHeadingRef.current

    const liquor =
      liquorVisualRef.current

    const food =
      foodVisualRef.current

    const glass =
      glassVisualRef.current

    const bgPattern =
      bgPatternRef.current

    const tray =
      trayRef.current

    const footer =
      compositionFooterRef.current

    const liquorDetailText =
      liquorDetailTextRef.current

    const foodDetailText =
      foodDetailTextRef.current

    const glassDetailText =
      glassDetailTextRef.current

    const liquorFocusTarget =
      liquorFocusTargetRef.current

    const foodDetailVisual =
      foodDetailVisualRef.current

    const glassDetailVisual =
      glassDetailVisualRef.current

    const infoCards =
      stage.querySelectorAll(
        `.${styles.compositionCard}`
      )

    const getLiquorOffset =
      () => {
        if (
          !liquor ||
          !liquorFocusTarget
        ) {
          return {
            x: 0,
            y: 0,
          }
        }

        const liquorRect =
          liquor.getBoundingClientRect()

        const targetRect =
          liquorFocusTarget
            .getBoundingClientRect()

        return {
          x:
            targetRect.left +
            targetRect.width / 2 -
            (
              liquorRect.left +
              liquorRect.width / 2
            ),

          y:
            targetRect.top +
            targetRect.height / 2 -
            (
              liquorRect.top +
              liquorRect.height / 2
            ),
        }
      }

    const mm =
      gsap.matchMedia()

    mm.add(
      '(min-width: 769px) and (prefers-reduced-motion: no-preference)',
      () => {
        gsap.set(
          infoCards,
          {
            autoAlpha: 0,
            y: 30,
          }
        )

        gsap.set(
          [
            liquorDetailText,
            foodDetailText,
            glassDetailText,
          ],
          {
            autoAlpha: 0,
            x: -36,
            y: 0,
          }
        )

        gsap.set(
          [
            foodDetailVisual,
            glassDetailVisual,
          ],
          {
            autoAlpha: 0,
            y: 54,
            scale: 0.94,
          }
        )

        const timeline =
          gsap.timeline({
            defaults: {
              ease: 'power2.out',
            },

            scrollTrigger: {
              trigger: section,
              scroller:
                scrollContainer,
              start: 'top top',
              end: '+=7200',
              scrub: 1.1,
              pin: true,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          })


        // ========================================
        // 01. 현재 주안상 연출
        // 기존 위치값은 그대로 사용
        // ========================================

        timeline.fromTo(
          liquor,
          {
            autoAlpha: 0,
            x: 0,
            y: 250,
            scale: 0.72,
          },
          {
            autoAlpha: 1,
            x: 0,
            y: 0,
            scale: 1,
            duration: 1,
            force3D: true,
          },
          0
        )

        timeline.fromTo(
          food,
          {
            autoAlpha: 0,
            x: -80,
            y: 120,
            scale: 0.76,
          },
          {
            autoAlpha: 1,
            x: 0,
            y: 0,
            scale: 1,
            duration: 0.95,
            force3D: true,
          },
          0.34
        )

        timeline.fromTo(
          glass,
          {
            autoAlpha: 0,
            x: 80,
            y: 145,
            scale: 0.7,
          },
          {
            autoAlpha: 1,
            x: 0,
            y: 0,
            scale: 1,
            duration: 0.95,
            force3D: true,
          },
          0.62
        )

        timeline.to(
          infoCards,
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.12,
          },
          1.28
        )

        // 완성된 주안상을 잠깐 유지
        timeline.to(
          {},
          {
            duration: 0.85,
          }
        )


        // ========================================
        // 02. 전통주 포커스
        // 제목/안주/잔/쟁반/문양/버튼은 사라지고
        // 기존 전통주만 오른쪽으로 이동
        // ========================================

        timeline.addLabel(
          'liquorFocus'
        )

        timeline.to(
          infoCards,
          {
            autoAlpha: 0,
            y: 16,
            duration: 0.38,
            stagger: 0.04,
          },
          'liquorFocus'
        )

        timeline.to(
          heading,
          {
            autoAlpha: 0,
            y: -34,
            duration: 0.58,
          },
          'liquorFocus'
        )

        timeline.to(
          footer,
          {
            autoAlpha: 0,
            y: 24,
            duration: 0.48,
          },
          'liquorFocus'
        )

        timeline.to(
          bgPattern,
          {
            autoAlpha: 0,
            scale: 1.04,
            duration: 0.58,
          },
          'liquorFocus+=0.05'
        )

        timeline.to(
          tray,
          {
            autoAlpha: 0,
            y: 34,
            duration: 0.62,
          },
          'liquorFocus+=0.03'
        )

        timeline.to(
          food,
          {
            autoAlpha: 0,
            x: -120,
            y: 44,
            scale: 0.82,
            duration: 0.64,
          },
          'liquorFocus+=0.05'
        )

        timeline.to(
          glass,
          {
            autoAlpha: 0,
            x: 120,
            y: 44,
            scale: 0.82,
            duration: 0.64,
          },
          'liquorFocus+=0.05'
        )

        timeline.to(
          liquor,
          {
            x: () =>
              getLiquorOffset().x,
            y: () =>
              getLiquorOffset().y,
            scale: 1.14,
            duration: 0.9,
            ease: 'power2.inOut',
            force3D: true,
          },
          'liquorFocus+=0.08'
        )

        timeline.fromTo(
          liquorDetailText,
          {
            autoAlpha: 0,
            x: -36,
          },
          {
            autoAlpha: 1,
            x: 0,
            duration: 0.62,
          },
          'liquorFocus+=0.46'
        )

        // 전통주 소개 화면 유지
        timeline.to(
          {},
          {
            duration: 1.15,
          }
        )


        // ========================================
        // 03. 전통주 -> 안주
        // 화면은 고정, 왼쪽 텍스트/오른쪽 사진만 교체
        // ========================================

        timeline.addLabel(
          'foodFocus'
        )

        timeline.to(
          liquorDetailText,
          {
            autoAlpha: 0,
            x: -26,
            y: -14,
            duration: 0.42,
          },
          'foodFocus'
        )

        timeline.to(
          liquor,
          {
            autoAlpha: 0,
            y: '-=28',
            scale: 1.08,
            duration: 0.48,
          },
          'foodFocus'
        )

        timeline.fromTo(
          foodDetailVisual,
          {
            autoAlpha: 0,
            y: 54,
            scale: 0.94,
          },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.62,
          },
          'foodFocus+=0.18'
        )

        timeline.fromTo(
          foodDetailText,
          {
            autoAlpha: 0,
            x: -36,
            y: 12,
          },
          {
            autoAlpha: 1,
            x: 0,
            y: 0,
            duration: 0.58,
          },
          'foodFocus+=0.2'
        )

        // 안주 소개 화면 유지
        timeline.to(
          {},
          {
            duration: 1.15,
          }
        )


        // ========================================
        // 04. 안주 -> 술잔
        // 화면은 고정, 왼쪽 텍스트/오른쪽 사진만 교체
        // ========================================

        timeline.addLabel(
          'glassFocus'
        )

        timeline.to(
          foodDetailText,
          {
            autoAlpha: 0,
            x: -26,
            y: -14,
            duration: 0.42,
          },
          'glassFocus'
        )

        timeline.to(
          foodDetailVisual,
          {
            autoAlpha: 0,
            y: -34,
            scale: 0.96,
            duration: 0.48,
          },
          'glassFocus'
        )

        timeline.fromTo(
          glassDetailVisual,
          {
            autoAlpha: 0,
            y: 54,
            scale: 0.92,
          },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.62,
          },
          'glassFocus+=0.18'
        )

        timeline.fromTo(
          glassDetailText,
          {
            autoAlpha: 0,
            x: -36,
            y: 12,
          },
          {
            autoAlpha: 1,
            x: 0,
            y: 0,
            duration: 0.58,
          },
          'glassFocus+=0.2'
        )

        // 술잔 소개 화면을 충분히 보여준 뒤 pin 해제
        timeline.to(
          {},
          {
            duration: 1.3,
          }
        )

        return () => {
          timeline.scrollTrigger?.kill()
          timeline.kill()
        }
      }
    )


    // 모바일 / 모션 감소 환경에서는
    // 기존 상세 섹션을 그대로 사용
    mm.add(
      '(max-width: 768px), (prefers-reduced-motion: reduce)',
      () => {
        gsap.set(
          [
            liquor,
            food,
            glass,
            ...infoCards,
          ],
          {
            clearProps: 'all',
            autoAlpha: 1,
          }
        )
      }
    )


    const refreshId =
      window.requestAnimationFrame(
        () => {
          ScrollTrigger.refresh()
        }
      )


    return () => {
      window.cancelAnimationFrame(
        refreshId
      )
      mm.revert()
      page.style.scrollSnapType =
        previousScrollSnapType
    }
  }, [
    isLoading,
    currentResult,
  ])

  const setSectionRef =
    (index) => (el) => {
      sectionRefs.current[
        index
      ] = el
    }


  if (isLoading) {
    return (
      <main
        className={
          styles.aiResult
        }
      >
        <section
          className={`${styles.section} ${styles.introSection}`}
        >
          <div
            className={
              styles.introInner
            }
          >
            <div
              className={
                styles.introText
              }
            >
              <h1>
                막둥이가 정성을 담아
                <br />
                주안상을 차리고 있어요!
              </h1>
              <p>
                오늘의 취향에 딱 맞는 안주와 술을
                <br />
                정갈하게 모으고 있습니다.
              </p>
            </div>
          </div>
        </section>
      </main>
    )
  }


  if (
    errorMessage ||
    !currentResult
  ) {
    return (
      <main
        className={
          styles.aiResult
        }
      >
        <section
          className={`${styles.section} ${styles.introSection}`}
        >
          <div
            className={
              styles.introInner
            }
          >
            <div
              className={
                styles.introText
              }
            >
              <h1>
                주안상을 준비하지
                <br />
                못했어요.
              </h1>
              <p>
                {errorMessage ||
                  '추천 결과를 불러올 수 없어요.'}
              </p>
              <button
                type="button"
                className={
                  styles.smallButton
                }
                onClick={() =>
                  navigate(
                    '/ai/survey'
                  )
                }
              >
                다시 추천받기
              </button>
            </div>
          </div>
        </section>
      </main>
    )
  }


  const {
    liquor,
    food,
    glass,
    images,
    aiImages,
  } = currentResult


  return (
    <main
      ref={pageRef}
      className={
        styles.aiResult
      }
    >
      {/* =========================================
          01. 주안상 메인 화면 (트레이 + 상차림)
      ========================================= */}

      <section
        ref={(el) => {
          sectionRefs.current[0] =
            el
          compositionSectionRef.current =
            el
        }}
        className={
          styles.compositionSection
        }
      >
        <div
          className={
            styles.compositionInner
          }
        >
          <div
            ref={compositionHeadingRef}
            className={
              styles.compositionHeading
            }
          >
            <h1>
              막둥이가 오늘의
              <br />
              주안상을 정갈히 차렸어요!
            </h1>
            <p>
              {currentResult.reason}
            </p>
          </div>


          <div
            ref={compositionStageRef}
            className={
              styles.compositionStage
            }
          >
            {/* 전통 창살 배경 문양 */}
            <img
              ref={bgPatternRef}
              src={backgroundImage}
              alt="전통 문양 배경"
              className={styles.bgPatternImage}
            />

            {/* 쟁반(트레이) 이미지 */}
            <img
              ref={trayRef}
              src={trayImage}
              alt="주안상 트레이"
              className={styles.trayImage}
            />

            {/* 안주 */}
            <article
              ref={foodVisualRef}
              className={`${styles.compositionItem} ${styles.foodItem}`}
            >
              <div
                className={
                  styles.imageWrap
                }
              >
                <img
                  src={aiImages.food || images.food}
                  alt={food.productName}
                />
              </div>

              <div
                className={`${styles.compositionCard} ${styles.foodCard}`}
              >
                <span>
                  제철 안주
                </span>
                <strong>
                  {food.productName}
                </strong>
                <p className={styles.cardMeta}>
                  {currentResult.foodReason || food.productDescription || '술과 찰떡궁합인 오늘의 안주예요.'}
                </p>
              </div>
            </article>


            {/* 전통주 */}
            <article
              ref={liquorVisualRef}
              className={`${styles.compositionItem} ${styles.liquorItem}`}
            >
              <div
                className={
                  styles.imageWrap
                }
              >
                <img
                  src={aiImages.liquor || images.liquor}
                  alt={liquor.productName}
                />
              </div>

              <div
                className={`${styles.compositionCard} ${styles.liquorCard}`}
              >
                <span>
                  메인 술
                </span>
                <strong>
                  {liquor.productName}
                </strong>

                {(liquor.liquorType ||
                  liquor.alcoholByVolume) && (
                  <p
                    className={
                      styles.cardMeta
                    }
                  >
                    {liquor.liquorType ||
                      '전통주'}
                    {liquor.alcoholByVolume
                      ? ` · ${liquor.alcoholByVolume}`
                      : ''}
                  </p>
                )}

                {Array.isArray(
                  liquor.flavorKeywords
                ) &&
                  liquor.flavorKeywords
                    .length > 0 && (
                    <ul
                      className={
                        styles.cardKeywords
                      }
                    >
                      {liquor.flavorKeywords
                        .slice(0, 3)
                        .map((keyword) => (
                          <li key={keyword}>
                            #{keyword}
                          </li>
                        ))}
                    </ul>
                  )}
              </div>
            </article>


            {/* 술잔 */}
            <article
              ref={glassVisualRef}
              className={`${styles.compositionItem} ${styles.glassItem}`}
            >
              <div
                className={
                  styles.imageWrap
                }
              >
                <img
                  src={aiImages.glass || images.glass}
                  alt={glass.productName}
                />
              </div>

              <div
                className={`${styles.compositionCard} ${styles.glassCard}`}
              >
                <span>
                  오늘의 잔
                </span>
                <strong>
                  {glass.productName}
                </strong>
                <p
                  className={
                    styles.cardMeta
                  }
                >
                  {currentResult.glassReason ||
                    glass.productDescription || '전통주의 풍미를 더해줄 어울림 잔이에요.'}
                </p>
              </div>
            </article>
          </div>


          <div
            ref={compositionFooterRef}
            className={
              styles.compositionFooter
            }
          >
            <button
              type="button"
              className={
                styles.saveButton
              }
              onClick={
                handleSaveTable
              }
            >
              이 주안상 저장하기
            </button>
          </div>


          {/* =========================================
              스크롤 상세 쇼케이스
              처음에는 보이지 않고,
              주안상 완성 이후 GSAP으로만 등장
          ========================================= */}
          <div
            className={
              styles.detailShowcase
            }
          >
            <div
              className={
                styles.detailTextArea
              }
            >
              {/* 전통주 추천 이유 */}
              <article
                ref={
                  liquorDetailTextRef
                }
                className={
                  styles.detailPanel
                }
              >
                <span
                  className={
                    styles.detailEyebrow
                  }
                >
                  TODAY&apos;S LIQUOR
                </span>

                <p
                  className={
                    styles.detailKicker
                  }
                >
                  막둥이가 고른 오늘의 한 잔
                </p>

                <h2>
                  {liquor.productName}
                </h2>

                <p
                  className={
                    styles.detailReason
                  }
                >
                  {
                    currentResult
                      .liquorReason ||
                    liquor
                      .productDescription ||
                    '오늘의 취향과 가장 잘 맞는 전통주로 골랐어요.'
                  }
                </p>

                <div
                  className={
                    styles.detailMetaTags
                  }
                >
                  {liquor
                    .liquorType && (
                    <span>
                      {
                        liquor
                          .liquorType
                      }
                    </span>
                  )}

                  {(liquor
                    .alcoholByVolume ||
                    typeof liquor.abv ===
                      'number') && (
                    <span>
                      {
                        liquor
                          .alcoholByVolume ||
                        `${liquor.abv}%`
                      }
                    </span>
                  )}

                  {Array.isArray(
                    liquor
                      .flavorKeywords
                  ) &&
                    liquor
                      .flavorKeywords
                      .slice(0, 2)
                      .map(
                        (
                          keyword
                        ) => (
                          <span
                            key={
                              keyword
                            }
                          >
                            #{keyword}
                          </span>
                        )
                      )}
                </div>

                <button
                  type="button"
                  className={
                    styles.detailButton
                  }
                  onClick={() =>
                    navigate(
                      `/product/${liquor.productId}`
                    )
                  }
                >
                  상품 자세히 보기
                </button>
              </article>


              {/* 안주 추천 이유 */}
              <article
                ref={
                  foodDetailTextRef
                }
                className={
                  styles.detailPanel
                }
              >
                <span
                  className={
                    styles.detailEyebrow
                  }
                >
                  TODAY&apos;S PAIRING
                </span>

                <p
                  className={
                    styles.detailKicker
                  }
                >
                  막둥이가 곁들인 오늘의 한 접시
                </p>

                <h2>
                  {food.productName}
                </h2>

                <p
                  className={
                    styles.detailReason
                  }
                >
                  {
                    currentResult
                      .foodReason ||
                    food
                      .productDescription ||
                    '오늘의 전통주와 가장 잘 어울리는 안주로 골랐어요.'
                  }
                </p>

                <div
                  className={
                    styles.detailMetaTags
                  }
                >
                  {food
                    .snackType && (
                    <span>
                      {
                        food
                          .snackType
                      }
                    </span>
                  )}

                  {food
                    .volume && (
                    <span>
                      {
                        food
                          .volume
                      }
                    </span>
                  )}

                  {food
                    .brandManufacturer && (
                    <span>
                      {
                        food
                          .brandManufacturer
                      }
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className={
                    styles.detailButton
                  }
                  onClick={() =>
                    navigate(
                      `/product/${food.productId}`
                    )
                  }
                >
                  상품 자세히 보기
                </button>
              </article>


              {/* 술잔 추천 이유 */}
              <article
                ref={
                  glassDetailTextRef
                }
                className={
                  styles.detailPanel
                }
              >
                <span
                  className={
                    styles.detailEyebrow
                  }
                >
                  TODAY&apos;S GLASS
                </span>

                <p
                  className={
                    styles.detailKicker
                  }
                >
                  마지막으로 고른 오늘의 잔
                </p>

                <h2>
                  {glass.productName}
                </h2>

                <p
                  className={
                    styles.detailReason
                  }
                >
                  {
                    currentResult
                      .glassReason ||
                    glass
                      .productDescription ||
                    '오늘의 술과 안주를 더 기분 좋게 즐길 수 있는 잔으로 골랐어요.'
                  }
                </p>

                <div
                  className={
                    styles.detailMetaTags
                  }
                >
                  {glass
                    .glassType && (
                    <span>
                      {
                        glass
                          .glassType
                      }
                    </span>
                  )}

                  {glass
                    .volume && (
                    <span>
                      {
                        glass
                          .volume
                      }
                    </span>
                  )}

                  {glass
                    .brandManufacturer && (
                    <span>
                      {
                        glass
                          .brandManufacturer
                      }
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  className={
                    styles.detailButton
                  }
                  onClick={() =>
                    navigate(
                      `/product/${glass.productId}`
                    )
                  }
                >
                  상품 자세히 보기
                </button>
              </article>
            </div>


            <div
              className={
                styles.detailVisualArea
              }
            >
              {/* 기존 전통주가 이동할 최종 위치.
                  화면에는 보이지 않는 기준점 */}
              <div
                ref={
                  liquorFocusTargetRef
                }
                className={
                  styles.liquorFocusTarget
                }
                aria-hidden="true"
              />


              {/* 안주 상세 사진 */}
              <div
                ref={
                  foodDetailVisualRef
                }
                className={`${styles.detailVisual} ${styles.detailFoodVisual}`}
              >
                <img
                  src={
                    aiImages.food ||
                    images.food
                  }
                  alt={
                    food.productName
                  }
                />
              </div>


              {/* 술잔 상세 사진 */}
              <div
                ref={
                  glassDetailVisualRef
                }
                className={`${styles.detailVisual} ${styles.detailGlassVisual}`}
              >
                <img
                  src={
                    aiImages.glass ||
                    images.glass
                  }
                  alt={
                    glass.productName
                  }
                />
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* =========================================
          02. 전통주 상세 섹션
          모바일에서는 기존 방식 유지
      ========================================= */}

      <section
        ref={
          setSectionRef(1)
        }
        className={`${styles.section} ${styles.productSection} ${styles.desktopHiddenDetailSection}`}
      >
        <div
          className={
            styles.productInner
          }
        >
          <div
            className={
              styles.productInfo
            }
          >
            <p
              className={
                styles.productTitleLabel
              }
            >
              오늘의 한 잔,
            </p>

            <h2>
              {liquor.productName}
            </h2>

            <p
              className={
                styles.productDescription
              }
            >
              {
                liquor.productDescription
              }
            </p>


            {currentResult
              .liquorReason && (
              <p
                className={
                  styles.productDescription
                }
              >
                {
                  currentResult
                    .liquorReason
                }
              </p>
            )}


            <div
              className={
                styles.liquorStats
              }
            >
              <div>
                <span>도수</span>
                <strong>
                  {
                    liquor
                      .alcoholByVolume ||
                    (
                      typeof liquor.abv ===
                      'number'
                        ? `${liquor.abv}%`
                        : '-'
                    )
                  }
                </strong>
              </div>


              <div>
                <span>단맛</span>
                <strong>
                  {
                    liquor.sweetness ??
                    '-'
                  }
                  /5
                </strong>
              </div>


              <div>
                <span>산미</span>
                <strong>
                  {
                    liquor.acidity ??
                    '-'
                  }
                  /5
                </strong>
              </div>


              <div>
                <span>향</span>
                <strong>
                  {
                    liquor
                      .scentIntensity ??
                    '-'
                  }
                  /5
                </strong>
              </div>


              <div>
                <span>무게감</span>
                <strong>
                  {
                    liquor
                      .bodyWeight ??
                    '-'
                  }
                  /5
                </strong>
              </div>
            </div>


            {Array.isArray(
              liquor.flavorKeywords
            ) &&
              liquor
                .flavorKeywords
                .length > 0 && (
                <div
                  className={
                    styles.keywordList
                  }
                >
                  {liquor
                    .flavorKeywords
                    .map(
                      (
                        keyword
                      ) => (
                        <span
                          key={
                            keyword
                          }
                        >
                          #{keyword}
                        </span>
                      )
                    )}
                </div>
              )}


            <button
              type="button"
              className={
                styles.smallButton
              }
              onClick={() =>
                navigate(
                  `/product/${liquor.productId}`
                )
              }
            >
              상품 자세히 보기
            </button>
          </div>


          <div
            className={
              styles.productImage
            }
          >
            {images.liquor && (
              <img
                src={
                  images.liquor
                }
                alt={
                  liquor.productName
                }
              />
            )}
          </div>
        </div>
      </section>


      {/* =========================================
          03. 안주 상세 섹션 (모바일)
      ========================================= */}

      <section
        ref={
          setSectionRef(2)
        }
        className={`${styles.section} ${styles.productSection} ${styles.desktopHiddenDetailSection}`}
      >
        <div
          className={
            styles.productInner
          }
        >
          <div
            className={
              styles.productInfo
            }
          >
            <p
              className={
                styles.productTitleLabel
              }
            >
              오늘의 한 접시,
            </p>

            <h2>
              {food.productName}
            </h2>

            <p
              className={
                styles.productDescription
              }
            >
              {
                food.productDescription
              }
            </p>


            {currentResult
              .foodReason && (
              <p
                className={
                  styles.productDescription
                }
              >
                {
                  currentResult
                    .foodReason
                }
              </p>
            )}


            <div
              className={
                styles.keywordList
              }
            >
              {food.snackType && (
                <span>
                  {
                    food.snackType
                  }
                </span>
              )}

              {food.volume && (
                <span>
                  {food.volume}
                </span>
              )}

              {food
                .brandManufacturer && (
                <span>
                  {
                    food
                      .brandManufacturer
                  }
                </span>
              )}
            </div>


            <button
              type="button"
              className={
                styles.smallButton
              }
              onClick={() =>
                navigate(
                  `/product/${food.productId}`
                )
              }
            >
              상품 자세히 보기
            </button>
          </div>


          <div
            className={
              styles.productImage
            }
          >
            {images.food && (
              <img
                src={
                  images.food
                }
                alt={
                  food.productName
                }
              />
            )}
          </div>
        </div>
      </section>


      {/* =========================================
          04. 술잔 상세 섹션 (모바일)
      ========================================= */}

      <section
        ref={
          setSectionRef(3)
        }
        className={`${styles.section} ${styles.productSection} ${styles.desktopHiddenDetailSection}`}
      >
        <div
          className={
            styles.productInner
          }
        >
          <div
            className={
              styles.productInfo
            }
          >
            <p
              className={
                styles.productTitleLabel
              }
            >
              오늘의 술잔,
            </p>

            <h2>
              {glass.productName}
            </h2>

            <p
              className={
                styles.productDescription
              }
            >
              {
                glass.productDescription
              }
            </p>


            {currentResult
              .glassReason && (
              <p
                className={
                  styles.productDescription
                }
              >
                {
                  currentResult
                    .glassReason
                }
              </p>
            )}


            <div
              className={
                styles.keywordList
              }
            >
              {glass.glassType && (
                <span>
                  {
                    glass.glassType
                  }
                </span>
              )}

              {glass.volume && (
                <span>
                  {
                    glass.volume
                  }
                </span>
              )}

              {glass
                .brandManufacturer && (
                <span>
                  {
                    glass
                      .brandManufacturer
                  }
                </span>
              )}
            </div>


            <button
              type="button"
              className={
                styles.smallButton
              }
              onClick={() =>
                navigate(
                  `/product/${glass.productId}`
                )
              }
            >
              상품 자세히 보기
            </button>
          </div>


          <div
            className={
              styles.productImage
            }
          >
            {images.glass && (
              <img
                src={
                  images.glass
                }
                alt={
                  glass.productName
                }
              />
            )}
          </div>
        </div>
      </section>


      {/* =========================================
          05. 다른 주안상
      ========================================= */}

      <section
        ref={setSectionRef(4)}
        className={`${styles.section} ${styles.otherSection}`}
      >
        <div className={styles.otherInner}>
          <header className={styles.otherHeading}>
            <h2>
              막둥이가 준비한 또 다른 주안상도 있어요
            </h2>
            <p>
              같은 취향을 조금 다른 분위기로 즐겨보세요!
            </p>
          </header>

          <div className={styles.otherShowcase}>
            <img
              src={makdongImage}
              alt="다른 주안상을 소개하는 막둥이"
              className={styles.otherMakdong}
            />

            <div className={styles.otherList}>
              {otherResults
                .slice(0, 2)
                .map(
                  (
                    {
                      recommendation: item,
                      originalIndex,
                    },
                    cardIndex
                  ) => {
                    const flavorKeywords =
                      Array.isArray(
                        item.liquor.flavorKeywords
                      )
                        ? item.liquor.flavorKeywords
                        : []

                    const tags = [
                      flavorKeywords[0] ||
                        item.liquor.liquorType ||
                        '전통주',
                      flavorKeywords[1] ||
                        item.food.snackType ||
                        '막둥이 추천',
                    ].filter(Boolean)

                    const cardTitle =
                      cardIndex === 0
                        ? '산뜻하게 즐기는 상'
                        : '좀 더 깊게 즐기는 상'

                    return (
                      <article
                        key={item.tableId}
                        className={styles.otherCard}
                      >
                        <h3>{cardTitle}</h3>

                        <div className={styles.otherCardImage}>
                          <div className={styles.otherMiniStage}>
                            <img
                              src={backgroundImage}
                              alt=""
                              aria-hidden="true"
                              className={styles.otherMiniPattern}
                            />

                            <img
                              src={trayImage}
                              alt=""
                              aria-hidden="true"
                              className={styles.otherMiniTray}
                            />

                            {(item.aiImages.food ||
                              item.images.food) && (
                              <img
                                src={
                                  item.aiImages.food ||
                                  item.images.food
                                }
                                alt={item.food.productName}
                                className={styles.otherMiniFood}
                              />
                            )}

                            {(item.aiImages.liquor ||
                              item.images.liquor) && (
                              <img
                                src={
                                  item.aiImages.liquor ||
                                  item.images.liquor
                                }
                                alt={item.liquor.productName}
                                className={styles.otherMiniLiquor}
                              />
                            )}

                            {(item.aiImages.glass ||
                              item.images.glass) && (
                              <img
                                src={
                                  item.aiImages.glass ||
                                  item.images.glass
                                }
                                alt={item.glass.productName}
                                className={styles.otherMiniGlass}
                              />
                            )}
                          </div>
                        </div>

                        <div className={styles.otherCardText}>
                          <p className={styles.otherCardReason}>
                            {item.reason ||
                              `${item.liquor.productName}와 ${item.food.productName}을 함께 즐기는 막둥이의 또 다른 주안상이에요.`}
                          </p>

                          <div className={styles.otherCardTags}>
                            {tags.map((tag) => (
                              <span key={tag}>
                                #{tag}
                              </span>
                            ))}
                          </div>

                          <button
                            type="button"
                            className={styles.otherCardLink}
                            onClick={() =>
                              handleSelectOther(
                                originalIndex
                              )
                            }
                          >
                            자세히 보기
                            <span aria-hidden="true">›</span>
                          </button>
                        </div>
                      </article>
                    )
                  }
                )}
            </div>
          </div>

          <div className={styles.bottomButtons}>
            <button
              type="button"
              className={styles.otherBottomButton}
              onClick={() => navigate('/ai/survey')}
            >
              다시 추천받기
            </button>

            <button
              type="button"
              className={styles.otherBottomButton}
              onClick={() => navigate('/shop')}
            >
              더 많은 상품 보러 가기
              <span aria-hidden="true">›</span>
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}


export default AiResult