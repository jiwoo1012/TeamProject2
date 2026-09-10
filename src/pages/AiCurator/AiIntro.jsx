import {
  useEffect,
  useState,
} from 'react'

import {
  useNavigate,
} from 'react-router-dom'

import liquorsData from '../../data/products/liquors.json'

import {
  subscribeToAuthState,
} from '../../firebase/auth'

import AiLoginModal from '../../components/ai/AiLoginModal'

import styles from './AiIntro.module.scss'


const MESSAGE_LINES = [
  '막동이에게',
  '주안상을',
  '추천받아보세요!',
]

const CARD_COUNT = 16


// ========================================
// 상품 이미지 불러오기
// ========================================

const productImages = import.meta.glob(
  '../../assets/webpImages/images/products/**/*.webp',
  {
    eager: true,
    import: 'default',
  }
)


// ========================================
// JSON 이미지 경로와 실제 이미지 연결
// ========================================

const resolveProductImage = (
  product
) => {
  const imagePath =
    product?.image ||
    product?.imageUrl ||
    product?.thumbnail ||
    product?.thumbnailUrl

  if (!imagePath) {
    return ''
  }

  const fileName =
    imagePath
      .replace(/\\/g, '/')
      .split('/')
      .pop()

  const matchedImage =
    Object.entries(
      productImages
    ).find(
      ([path]) =>
        (path.endsWith(
          `/${fileName}`
        ) || path.endsWith((`/${fileName}`).replace(/\.(png|jpe?g)$/i, '.webp')))
    )

  return matchedImage?.[1] || ''
}


// ========================================
// liquors 데이터 형태 대응
// ========================================

const liquorProducts =
  Array.isArray(
    liquorsData
  )
    ? liquorsData
    : liquorsData?.products || []


// 카드에 사용할 상품 16개

const CARD_PRODUCTS =
  liquorProducts.slice(
    0,
    CARD_COUNT
  )


const AiIntro = () => {
  const navigate =
    useNavigate()

  const [
    currentUser,
    setCurrentUser,
  ] = useState(null)

  const [
    isAuthReady,
    setIsAuthReady,
  ] = useState(false)

  const [
    isLoginModalOpen,
    setIsLoginModalOpen,
  ] = useState(false)


  // ========================================
  // 로그인 상태 확인
  // ========================================

  useEffect(() => {
    const unsubscribe =
      subscribeToAuthState(
        (user) => {
          setCurrentUser(
            user
          )

          setIsAuthReady(
            true
          )
        }
      )

    return () => {
      if (
        typeof unsubscribe ===
        'function'
      ) {
        unsubscribe()
      }
    }
  }, [])


  // ========================================
  // 실제 로그인 회원 여부
  //
  // Firebase Anonymous Auth는
  // user 객체가 있어도 비회원으로 처리
  // ========================================

  const isMember =
    Boolean(
      currentUser &&
      !currentUser.isAnonymous
    )


  // ========================================
  // 추천 받기
  //
  // 회원 → 바로 설문
  // 비회원 → 로그인 안내 모달
  // ========================================

  const handleSurveyClick = () => {
    if (!isAuthReady) {
      return
    }

    if (isMember) {
      navigate(
        '/ai/survey'
      )

      return
    }

    setIsLoginModalOpen(
      true
    )
  }


  // ========================================
  // 비회원으로 추천 받기
  // ========================================

  const handleGuestClick = () => {
    setIsLoginModalOpen(
      false
    )

    navigate(
      '/ai/survey',
      {
        state: {
          isGuestMode: true,
        },
      }
    )
  }


  // ========================================
  // 로그인
  // ========================================

  const handleLoginClick = () => {
    setIsLoginModalOpen(
      false
    )

    navigate(
      '/login'
    )
  }


  // ========================================
  // 모달 닫기
  // ========================================

  const handleModalClose = () => {
    setIsLoginModalOpen(
      false
    )
  }


  let charIndex = 0


  return (
    <main
      className={
        styles.aiIntro
      }
    >
      {/* ========================================
          카드 원형

          기존 위치 / 크기 / 확대 / 회전 유지
      ======================================== */}

      <div
        className={
          styles.orbitScale
        }
      >
        <div
          className={
            styles.orbit
          }
        >
          {Array.from(
            {
              length:
                CARD_COUNT,
            },

            (
              _,
              index
            ) => {
              const angle =
                (
                  360 /
                  CARD_COUNT
                ) *
                index

              const product =
                CARD_PRODUCTS.length >
                0
                  ? CARD_PRODUCTS[
                      index %
                        CARD_PRODUCTS.length
                    ]
                  : null

              const productImage =
                resolveProductImage(
                  product
                )


              return (
                <div
                  key={`${
                    product?.productId ??
                    product?.id ??
                    'product'
                  }-${index}`}
                  className={
                    styles.card
                  }
                  style={{
                    '--angle':
                      `${angle}deg`,
                  }}
                >
                  {productImage && (
                    <img
                      src={
                        productImage
                      }
                      alt={
                        product?.name ||
                        product?.productName ||
                        '전통주 상품'
                      }
                      className={
                        styles.cardImage
                      }
                    />
                  )}
                </div>
              )
            }
          )}
        </div>
      </div>


      {/* ========================================
          중앙 콘텐츠
      ======================================== */}

      <div
        className={
          styles.content
        }
      >
        {/* 제목 */}

        <h1
          className={
            styles.title
          }
        >
          {MESSAGE_LINES.map(
            (
              line,
              lineIndex
            ) => (
              <span
                key={line}
                className={
                  styles.titleLine
                }
              >
                {[...line].map(
                  (
                    char,
                    index
                  ) => {
                    const currentIndex =
                      charIndex++

                    return (
                      <span
                        key={
                          `${lineIndex}-${index}`
                        }
                        className={
                          styles.character
                        }
                        style={{
                          '--char-index':
                            currentIndex,
                        }}
                      >
                        {char}
                      </span>
                    )
                  }
                )}
              </span>
            )
          )}
        </h1>


        {/* 소요 시간 안내 */}

        <p
          className={
            styles.subCopy
          }
        >
          몇 가지만 알려주세요.

          <span
            className={
              styles.subHighlight
            }
          >
            {' '}
            약 30초
          </span>

          면 충분해요!
        </p>


        {/* 추천 버튼 */}

        <button
          type="button"
          className={
            styles.surveyButton
          }
          onClick={
            handleSurveyClick
          }
          disabled={
            !isAuthReady
          }
        >
          <span>
            주안상 추천 받기
          </span>

          <span
            className={
              styles.buttonArrow
            }
            aria-hidden="true"
          >
            →
          </span>
        </button>
      </div>


      {/* ========================================
          비로그인 사용자용 로그인 안내 모달
      ======================================== */}

      <AiLoginModal
        isOpen={
          isLoginModalOpen
        }
        onClose={
          handleModalClose
        }
        onGuest={
          handleGuestClick
        }
        onLogin={
          handleLoginClick
        }
      />
    </main>
  )
}


export default AiIntro