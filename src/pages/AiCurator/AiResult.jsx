// src/pages/AiCurator/AiResult.jsx

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

import styles from './AiResult.module.scss'

gsap.registerPlugin(ScrollTrigger)


// ========================================
// 상품 이미지
//
// 현재 ProductList와 동일하게
// product*.png 파일을 imageUrl로 연결
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


// ========================================
// imageUrl → 실제 이미지 경로
//
// 예:
// product1.png
// ↓
// Vite가 읽은 실제 이미지 URL
// ========================================

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


// JSON의 aiImageUrl(또는 aiImage)을 실제 누끼 이미지 경로로 연결
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


// ========================================
// 개발 환경에서는
// Firebase Functions Emulator 사용
//
// npm run dev → React
// firebase emulators:start --only functions
// → Functions Emulator
//
// 기본 Functions Emulator 포트: 5001
// ========================================

if (import.meta.env.DEV) {
  try {
    connectFunctionsEmulator(
      functions,
      '127.0.0.1',
      5001
    )
  } catch (error) {
    // Vite HMR로 이미 Emulator가
    // 연결되어 있는 경우 무시
  }
}


// ========================================
// Callable Function
// ========================================

const recommendJajak =
  httpsCallable(
    functions,
    'recommendJajak'
  )


// ========================================
// ID로 실제 상품 찾기
// ========================================

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


// ========================================
// Firebase Function 결과
// + 실제 상품 JSON 결합
//
// Function에서는 안전하게 ID만 반환하고,
// 화면에서 실제 상품 전체 데이터를 연결
// ========================================

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


  // 상품 JSON에서 찾을 수 없는 ID가
  // 반환된 경우 잘못된 결과로 처리
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


// ========================================
// Firebase Function 오류 메시지 변환
// ========================================

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


// ========================================
// AiResult
// ========================================

const AiResult = () => {
  const navigate =
    useNavigate()

  const location =
    useLocation()


  // ========================================
  // AiSurvey에서 전달한 값
  // ========================================

  const surveyType =
    location.state?.surveyType

  const todaySurvey =
    location.state?.todaySurvey ||
    location.state?.answers ||
    null


  // ========================================
  // 로그인 회원의 평소 취향
  //
  // AiSurvey에서 이미 Firestore를 통해
  // 불러온 userPreference
  //
  // Mock 모드에서만
  // Functions에 전달해서 사용
  //
  // 실제 OpenAI 배포 모드에서는
  // 서버가 Firestore에서 다시 조회
  // ========================================

  const userPreference =
    location.state?.userPreference ||
    null


  // ========================================
  // 추천 상태
  // ========================================

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


  // React 개발 모드에서
  // Effect 중복 호출 방지
  const hasRequestedRef =
    useRef(false)


  // ========================================
  // 스크롤 / 추천 구성 애니메이션 Ref
  // ========================================

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


  // ========================================
  // 추천 Function 호출
  // ========================================

  useEffect(() => {
    if (
      hasRequestedRef.current
    ) {
      return
    }


    // AiSurvey를 거치지 않고
    // /ai/result 직접 접속한 경우
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


    // ========================================
    // 회원인데 AiSurvey에서
    // 취향 정보를 전달받지 못한 경우
    //
    // Mock 회원 추천에서는
    // userPreference가 필요함
    // ========================================

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


          // ========================================
          // Firebase Function 호출
          //
          // 실제 상품 전체 데이터
          // + pairings
          // + 오늘 설문
          // + 회원 평소 취향 전달
          // ========================================

          const response =
            await recommendJajak({
              surveyType,

              todaySurvey,

              // ====================================
              // 회원:
              // AiSurvey에서 읽어온
              // Firestore 취향 전달
              //
              // 비회원:
              // null
              // ====================================
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


  // ========================================
  // Function 결과
  // 실제 상품 데이터와 결합
  // ========================================

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


  // ========================================
  // 현재 메인으로 보고 있는 추천
  // ========================================

  const currentResult =
    recommendationTables[
      selectedRecommendationIndex
    ] || null


  // ========================================
  // 메인 추천을 제외한 다른 추천
  // ========================================

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


  // ========================================
  // 다른 주안상 선택
  // ========================================

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


  // ========================================
  // 이 주안상 저장하기
  //
  // TODO: Firestore에 저장하는 로직 연결
  // (예: users/{uid}/savedTables 서브컬렉션에
  // currentResult.tableId 저장)
  // ========================================

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


  // ========================================
  // 토스플레이스 느낌의 추천 구성 애니메이션
  //
  // 1. 전통주 → 안주 → 술잔 순서로 회전하며 등장
  // 2. 세 상품이 하나의 주안상으로 완성
  // 3. 한 번 더 스크롤하면 전통주가 중앙으로 커지며 정면을 봄
  //
  // 기존 wheel preventDefault 방식은 ScrollTrigger와 충돌하므로
  // 제거하고 브라우저 기본 스크롤을 사용함
  // ========================================

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

    // 기존 결과 페이지가 scroll-snap을 사용하고 있어도
    // 첫 섹션의 scrub 애니메이션이 건너뛰어지지 않도록 해제
    const previousScrollSnapType =
      page.style.scrollSnapType

    page.style.scrollSnapType =
      'none'

    const liquor =
      liquorVisualRef.current

    const glass =
      glassVisualRef.current

    const food =
      foodVisualRef.current

    const infoCards =
      stage.querySelectorAll(
        `.${styles.compositionCard}`
      )

    const mm =
      gsap.matchMedia()

    mm.add(
      '(min-width: 769px) and (prefers-reduced-motion: no-preference)',
      () => {
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
              end: '+=2600',
              scrub: 1.15,
              pin: true,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          })

        // 처음에는 상품 설명 카드를 숨겨둠
        gsap.set(
          infoCards,
          {
            autoAlpha: 0,
            y: 30,
          }
        )

        // 01. 전통주 등장
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

        // 02. 안주 등장
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

        // 03. 술잔 등장
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

        // 04. 세 구성이 완성되면
        // 상품 설명 카드가 차례로 나타남
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

        // 조합이 완성된 상태를 잠깐 유지
        timeline.to(
          {},
          {
            duration: 0.55,
          }
        )

        // 05. 한 번 더 스크롤
        // 안주 / 술잔은 뒤로 빠지고
        // 전통주가 앞으로 나오면서 정면을 바라봄
        timeline.to(
          infoCards,
          {
            autoAlpha: 0,
            y: 18,
            duration: 0.35,
          },
          2.2
        )

        timeline.to(
          food,
          {
            autoAlpha: 0.16,
            x: -120,
            y: 45,
            scale: 0.78,
            duration: 0.8,
          },
          2.25
        )

        timeline.to(
          glass,
          {
            autoAlpha: 0.16,
            x: 120,
            y: 45,
            scale: 0.78,
            duration: 0.8,
          },
          2.25
        )

        timeline.to(
          liquor,
          {
            x: 0,
            y: 30,
            scale: 1.5,
            duration: 1,
            ease: 'power2.inOut',
            force3D: true,
          },
          2.28
        )

        return () => {
          timeline.scrollTrigger?.kill()
          timeline.kill()
        }
      }
    )

    // 모바일 / 모션 감소 환경에서는
    // 제품이 모두 보이는 정적인 구성으로 보여줌
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


  // ========================================
  // Section Ref
  // ========================================

  const setSectionRef =
    (index) => (el) => {
      sectionRefs.current[
        index
      ] = el
    }


  // ========================================
  // Loading
  // ========================================

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
                막둥이가 주안상을
                차리고 있어요!
              </h1>

              <p>
                오늘의 취향과 상품을
                하나씩 살펴보고 있어요.
                <br />
                잠시만 기다려주세요.
              </p>
            </div>
          </div>
        </section>
      </main>
    )
  }


  // ========================================
  // Error
  // ========================================

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


  // ========================================
  // 현재 추천 상품
  // ========================================

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
      {/* =========================
          01. 전체 주안상
          토스플레이스형 스크롤 조립 애니메이션
      ========================= */}

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
            className={
              styles.compositionHeading
            }
          >
            <h1>
              막둥이가 오늘의
              <br />
              주안상을 차렸어요!
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
                              {keyword}
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
                    술잔
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
                      glass.productDescription}
                  </p>
                </div>
              </article>
          </div>


          <div
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


          <div
            className={
              styles.scrollIndicator
            }
            aria-hidden="true"
          >
            <span
              className={
                styles.scrollDot
              }
            />

            <span
              className={
                styles.scrollLine
              }
            />

            <span
              className={
                styles.scrollLabel
              }
            >
              SCROLL
            </span>
          </div>
        </div>
      </section>


      {/* =========================
          02. 전통주
      ========================= */}

      <section
        ref={
          setSectionRef(1)
        }
        className={`${styles.section} ${styles.productSection}`}
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
                <span>
                  도수
                </span>

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
                <span>
                  단맛
                </span>

                <strong>
                  {
                    liquor.sweetness ??
                    '-'
                  }
                  /5
                </strong>
              </div>


              <div>
                <span>
                  산미
                </span>

                <strong>
                  {
                    liquor.acidity ??
                    '-'
                  }
                  /5
                </strong>
              </div>


              <div>
                <span>
                  향
                </span>

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
                <span>
                  무게감
                </span>

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
                          {
                            keyword
                          }
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


      {/* =========================
          03. 안주
      ========================= */}

      <section
        ref={
          setSectionRef(2)
        }
        className={`${styles.section} ${styles.productSection}`}
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


      {/* =========================
          04. 술잔
      ========================= */}

      <section
        ref={
          setSectionRef(3)
        }
        className={`${styles.section} ${styles.productSection}`}
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


      {/* =========================
          05. 다른 주안상
      ========================= */}

      <section
        ref={
          setSectionRef(4)
        }
        className={`${styles.section} ${styles.otherSection}`}
      >
        <div
          className={
            styles.otherInner
          }
        >
          <div
            className={
              styles.otherHeading
            }
          >
            <h2>
              막둥이가 준비한 또
              다른 주안상도 있어요
            </h2>

            <p>
              조금 다른 조합도 함께
              살펴보세요!
            </p>
          </div>


          <div
            className={
              styles.otherList
            }
          >
            {otherResults.map(
              ({
                recommendation:
                  item,

                originalIndex,
              }) => (
                <article
                  key={
                    item.tableId
                  }
                  className={
                    styles.otherCard
                  }
                >
                  <div
                    className={
                      styles.otherCardImage
                    }
                  >
                    {item
                      .images
                      .liquor && (
                      <img
                        src={
                          item
                            .images
                            .liquor
                        }
                        alt={
                          item
                            .liquor
                            .productName
                        }
                      />
                    )}
                  </div>


                  <div
                    className={
                      styles.otherCardText
                    }
                  >
                    <span>
                      막둥이의 또
                      다른 추천
                    </span>

                    <h3>
                      {
                        item
                          .liquor
                          .productName
                      }{' '}
                      주안상
                    </h3>

                    <p>
                      {
                        item
                          .liquor
                          .productName
                      }
                    </p>

                    <p>
                      {
                        item
                          .food
                          .productName
                      }
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        handleSelectOther(
                          originalIndex
                        )
                      }
                    >
                      주안상 보기
                    </button>
                  </div>
                </article>
              )
            )}
          </div>


          <div
            className={
              styles.bottomButtons
            }
          >
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

            <button
              type="button"
              className={
                styles.smallButton
              }
              onClick={() =>
                navigate(
                  '/shop'
                )
              }
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