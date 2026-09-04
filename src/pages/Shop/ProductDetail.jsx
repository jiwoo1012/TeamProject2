import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore'
import ProductCard from '../../components/ui/ProductCard/ProductCard'
import { fetchProducts, getManagedProducts } from '../../services/productCatalog'
import pairings from '../../data/pairings.json'
import { getCurrentUserData, subscribeToAuthState } from '../../firebase/auth'
import { addDocument, deleteDocument, getCollection, setDocument, updateDocument } from '../../firebase/firestore'
import { db } from '../../firebase/firebase'
import { getCart, saveCart } from '../../utils/cartStorage'
import { PATHS } from '../../routes/paths'
import jajakLogo from '../../assets/logos/jajakLogo.png'
import faqMakdong from '../../assets/characters/M007_Poses04.png'
import pattern2 from '../../assets/images/eventPage/pattern2.png'
import styles from './ProductDetail.module.scss'

const productImages = import.meta.glob(
  '../../assets/images/products/product*.png',
  {
    eager: true,
    import: 'default',
  }
)

const MAX_WISHLIST_COUNT = 100

const detailImages = import.meta.glob(
  '../../assets/images/products/productDetail/**/*.{png,jpg,jpeg,webp}',
  {
    eager: true,
    import: 'default',
  }
)

const stylingImages = import.meta.glob(
  '../../assets/images/products/stylingProduct/**/*.{png,jpg,jpeg,webp}',
  { eager: true, import: 'default' }
)

const resolveProductImage = (imageUrl) =>
  /^(data:|https?:\/\/)/.test(imageUrl ?? '')
    ? imageUrl
    : Object.entries(productImages).find(([path]) =>
    path.endsWith(`/${imageUrl}`)
  )?.[1]

const getFolderName = (imageUrl = '') =>
  imageUrl.replace(/\.[^.]+$/, '')

const getDetailImages = (imageUrl) => {
  const folder = getFolderName(imageUrl)

  return Object.entries(detailImages)
    .filter(([path]) =>
      path.includes(`/productDetail/${folder}/`)
    )
    .sort(([pathA], [pathB]) =>
      pathA.localeCompare(pathB, 'ko', {
        numeric: true,
      })
    )
    .map(([, source]) => source)
}

const getStylingImages = (imageUrl = '') => {
  const productNumber = getFolderName(imageUrl).replace('product', '')

  return Object.entries(stylingImages)
    .filter(([path]) => path.includes(`/stylingProduct/p${productNumber}/`))
    .sort(([pathA], [pathB]) => pathA.localeCompare(pathB, 'ko', { numeric: true }))
    .map(([, source]) => source)
}

const withImage = (product) =>
  product && {
    ...product,
    imageSrc: resolveProductImage(product.imageUrl),
  }


/* 추천 조합 미니 카드 */
const MiniPairingCard = ({
  product,
  onAddToCart,
}) => (
  <article className={styles.miniCard}>
    <Link to={`/shop/${product.productId}`}>
      <img
        src={product.imageSrc}
        alt={product.productName}
      />
    </Link>

    <div className={styles.miniInfo}>
      <span>{product.productName}</span>

      <strong>
        {product.price.toLocaleString('ko-KR')}원
      </strong>
    </div>

    <button
      className={styles.miniCart}
      type="button"
      onClick={() => onAddToCart(product)}
    >
      장바구니 담기
    </button>
  </article>
)

const ProductDetail = () => {
  const { productId } = useParams()
  const noticeTimerRef = useRef(null)

  const [activeTab, setActiveTab] = useState('detail')
  const [openAccordion, setOpenAccordion] = useState(null)
  const [pairPage, setPairPage] = useState(0)
  const [isWished, setIsWished] = useState(false)
  const [isWishLoading, setIsWishLoading] = useState(false)
  const [uid, setUid] = useState(null)
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [notice, setNotice] = useState(null)
  const [reviews, setReviews] = useState([])
  const [memberNickname, setMemberNickname] = useState('')
  const [reviewRating, setReviewRating] = useState(0)
  const [reviewContent, setReviewContent] = useState('')
  const [editingReviewId, setEditingReviewId] = useState(null)
  const [purchasedOrders, setPurchasedOrders] = useState([])
  const [reviewOrderId, setReviewOrderId] = useState('')
  const [isReviewSaving, setIsReviewSaving] = useState(false)
  const [products, setProducts] = useState(getManagedProducts)
  const foods = useMemo(() => products.filter((item) => item.productType === '안주'), [products])

  useEffect(() => {
    let isMounted = true
    fetchProducts().then((items) => {
      if (isMounted) setProducts(items)
    })
    return () => { isMounted = false }
  }, [])

  useEffect(() => () => {
    window.clearTimeout(noticeTimerRef.current)
  }, [])

  useEffect(() => {
    const page = document.querySelector(`.${styles.page}`)

    const header =
      document.querySelector('body > #root header') ??
      document.querySelector('header')

    if (!page || !header) return undefined

    const previousPosition = header.style.position
    const previousTop = header.style.top
    const previousWidth = header.style.width

    const updateHeaderHeight = () =>
      page.style.setProperty(
        '--detail-header-height',
        `${header.getBoundingClientRect().height}px`
      )

    header.style.position = 'sticky'
    header.style.top = '0'
    header.style.width = '100%'

    updateHeaderHeight()

    const resizeObserver = new ResizeObserver(
      updateHeaderHeight
    )

    resizeObserver.observe(header)

    return () => {
      resizeObserver.disconnect()

      page.style.removeProperty(
        '--detail-header-height'
      )

      header.style.position = previousPosition
      header.style.top = previousTop
      header.style.width = previousWidth
    }
  }, [])

  const product = useMemo(() => {
    const exactProduct = products.find(
      (item) => item.productId === productId
    )

    if (exactProduct) {
      return withImage(exactProduct)
    }

    return withImage(
      products.find(
        (item) =>
          getFolderName(item.imageUrl) ===
          `product${productId}`
      )
    )
  }, [productId, products])

  const productDetailImages = useMemo(
    () => getDetailImages(product?.imageUrl),
    [product]
  )

  const productStylingImages = useMemo(
    () => getStylingImages(product?.imageUrl),
    [product]
  )

  // 로그인 사용자 확인
  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user) => {
      const member = user && !user.isAnonymous ? user : null
      setUid(member?.uid ?? null)
      setMemberNickname(member?.displayName ?? '')
      setIsAuthReady(true)
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    if (!uid) {
      setMemberNickname('')
      return undefined
    }

    let isCancelled = false

    getCurrentUserData(uid)
      .then((userData) => {
        if (!isCancelled) setMemberNickname(userData?.nickname ?? '')
      })
      .catch((error) => {
        console.error('회원 닉네임 조회 실패:', error)
      })

    return () => {
      isCancelled = true
    }
  }, [uid])

  useEffect(() => {
    if (!product) return undefined

    let isCancelled = false

    getDocs(query(
      collection(db, 'reviews'),
      where('productId', '==', product.productId),
      where('status', '==', 'visible')
    ))
      .then((snapshot) => {
        if (isCancelled) return
        const nextReviews = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
        setReviews(nextReviews)
      })
      .catch((error) => {
        console.error('리뷰 목록 조회 실패:', error)
        if (!isCancelled) setReviews([])
      })

    return () => { isCancelled = true }
  }, [product])

  useEffect(() => {
    if (!uid || !product) {
      setPurchasedOrders([])
      setReviewOrderId('')
      return undefined
    }

    let isCancelled = false

    getDocs(query(collection(db, 'orders'), where('userId', '==', uid)))
      .then((snapshot) => {
        if (isCancelled) return
        const nextOrders = snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }))
          .filter((order) => Array.isArray(order.productIds) && order.productIds.includes(product.productId))
          .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0))
        setPurchasedOrders(nextOrders)
        setReviewOrderId((current) => current || nextOrders[0]?.id || '')
      })
      .catch((error) => {
        console.error('리뷰 작성 가능 주문 조회 실패:', error)
        if (!isCancelled) setPurchasedOrders([])
      })

    return () => { isCancelled = true }
  }, [product, uid])

  // 현재 상품이 이미 찜되어 있는지 Firestore에서 확인
  useEffect(() => {
    if (!isAuthReady || !product) return undefined

    if (!uid) {
      setIsWished(false)
      return undefined
    }

    let isCancelled = false

    getCollection(`users/${uid}/wishlist`)
      .then((docs) => {
        if (isCancelled) return

        const wished = docs.some(
          (wishDoc) =>
            (wishDoc.productId ?? wishDoc.id) === product.productId
        )

        setIsWished(wished)
      })
      .catch((error) => {
        console.error('찜 상태 조회 실패:', error)
        if (!isCancelled) setIsWished(false)
      })

    return () => {
      isCancelled = true
    }
  }, [uid, isAuthReady, product])

  const relatedProducts = useMemo(() => {
    if (!product) return []

    const directPairing = pairings.find(
      ({ liquorId }) =>
        liquorId === product.productId
    )

    let ids = directPairing
      ? [
          ...directPairing.pairedFoodIds,
          ...directPairing.recommendedGlassIds,
        ]
      : []

    if (!directPairing) {
      ids = pairings
        .filter(
          ({
            pairedFoodIds,
            recommendedGlassIds,
          }) =>
            [
              ...pairedFoodIds,
              ...recommendedGlassIds,
            ].includes(product.productId)
        )
        .map(({ liquorId }) => liquorId)
    }

    return [...new Set(ids)]
      .map((id) =>
        withImage(
          products.find(
            (item) => item.productId === id
          )
        )
      )
      .filter(Boolean)
  }, [product, products])

  const recommendedFoods = useMemo(() => {
    if (!product) return []

    const directPairing = pairings.find(
      ({ liquorId }) =>
        liquorId === product.productId
    )

    if (directPairing) {
      return directPairing.pairedFoodIds
        .map((id) =>
          withImage(
            foods.find(
              (item) => item.productId === id
            )
          )
        )
        .filter(Boolean)
    }

    return relatedProducts.filter(
      (item) =>
        item.productType === '안주' &&
        item.productId !== product.productId
    )
  }, [foods, product, relatedProducts])

  const pairPageCount = Math.max(
    1,
    Math.ceil(relatedProducts.length / 2)
  )

  useEffect(() => {
    setPairPage(0)

    if (pairPageCount <= 1) return undefined

    const timer = window.setInterval(() => {
      setPairPage((current) => (current + 1) % pairPageCount)
    }, 4000)

    return () => window.clearInterval(timer)
  }, [productId, pairPageCount])

  if (!product) {
    return (
      <main className={styles.notFound}>
        <h1>상품을 찾을 수 없습니다.</h1>

        <Link to="/shop">
          상품 목록으로 돌아가기
        </Link>
      </main>
    )
  }

  const discountRate =
    Number.parseInt(product.discountRate, 10) || 0

  const salePrice = Math.round(
    product.price * (1 - discountRate / 100)
  )
  const isSoldOut = product.status === 'soldout' || Number(product.stock) <= 0
  const isLowStock = !isSoldOut && Number(product.stock) > 0 && Number(product.stock) <= 5

  const stylingImageOne = productStylingImages[0] ?? productDetailImages[0] ?? product.imageSrc
  const stylingImageTwo = productStylingImages.at(-1) ?? productDetailImages.at(-1) ?? product.imageSrc
  const tastingNotes = [
    { label: '당도', value: Number(product.sweetness ?? 0) },
    { label: '산도', value: Number(product.acidity ?? 0) },
    { label: '탄산', value: Number(product.carbonation ?? 0) },
    { label: '묵직함', value: Number(product.bodyWeight ?? 0) },
  ]

  const visiblePairings = relatedProducts.slice(
    pairPage * 2,
    pairPage * 2 + 2
  )

  const accordions = [
    {
      id: 'delivery',
      title: '무료 배송 & 반품',
      content:
        '배송 및 반품 정책은 주문 단계에서 최종 확인할 수 있습니다.',
    },

    product.allergyCautionInfo && {
      id: 'allergy',
      title: '알레르기 주의사항',
      content: product.allergyCautionInfo,
    },

    product.recommendedDrinkingTemperature && {
      id: 'temperature',
      title: '추천 음용 온도',
      content: product.recommendedDrinkingTemperature,
    },
  ].filter(Boolean)


  const handleNotice = (message, isLoginPrompt = false) => {
    window.clearTimeout(noticeTimerRef.current)
    setNotice({ message, isLoginPrompt })

    noticeTimerRef.current = window.setTimeout(
      () => setNotice(null),
      2600
    )
  }


  /*
    장바구니 담기

    ProductList와 동일하게
    jajak_cart를 사용한다.

    같은 상품이 있으면 수량 +1
    없으면 새 상품 추가
  */
  const handleAddToCart = (cartProduct) => {
    const cart = getCart()

    const existingItem = cart.find(
      (item) =>
        item.productId === cartProduct.productId
    )

    const nextCart = existingItem
      ? cart.map((item) =>
          item.productId === cartProduct.productId
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item
        )
      : [
          ...cart,
          {
            productId: cartProduct.productId,
            quantity: 1,
          },
        ]

    saveCart(nextCart)

    handleNotice('장바구니에 담았어요.')
  }


  // 상품 상세 찜하기 / 찜 해제
  // 저장 위치: users/{uid}/wishlist/{productId}
  const handleToggleWish = async () => {
    if (!isAuthReady) {
      handleNotice('로그인 정보를 확인하는 중이에요.')
      return
    }

    if (!uid) {
      handleNotice('로그인 후 찜할 수 있어요.', true)
      return
    }

    if (isWishLoading) return

    setIsWishLoading(true)

    try {
      if (isWished) {
        await deleteDocument(
          `users/${uid}/wishlist`,
          product.productId
        )

        setIsWished(false)
        handleNotice('찜 목록에서 삭제했어요.')
        return
      }

      const wishlistDocs = await getCollection(
        `users/${uid}/wishlist`
      )

      if (wishlistDocs.length >= MAX_WISHLIST_COUNT) {
        handleNotice(
          `찜은 최대 ${MAX_WISHLIST_COUNT}개까지 저장할 수 있어요.`
        )
        return
      }

      await setDocument(
        `users/${uid}/wishlist`,
        product.productId,
        {
          productId: product.productId,
          createdAt: serverTimestamp(),
        }
      )

      setIsWished(true)
      handleNotice('찜 목록에 담았어요.')
    } catch (error) {
      console.error('찜 처리 실패:', error)
      handleNotice('찜 처리 중 오류가 발생했습니다.')
    } finally {
      setIsWishLoading(false)
    }
  }


  const handleReviewSubmit = async (event) => {
    event.preventDefault()

    if (!uid || isReviewSaving) return

    const nickname = memberNickname.trim()
    const content = reviewContent.trim()

    if (
      !nickname ||
      !content ||
      reviewRating === 0 ||
      (!editingReviewId && !reviewOrderId)
    ) {
      handleNotice('구매한 주문을 선택해주세요.')
      return
    }

    setIsReviewSaving(true)
    try {
      if (editingReviewId) {
        await updateDocument('reviews', editingReviewId, { nickname, rating: reviewRating, content })
      } else {
        await addDocument('reviews', {
          orderId: reviewOrderId,
          productId: product.productId,
          authorId: uid,
          nickname,
          rating: reviewRating,
          content,
          status: 'visible',
          reportCount: 0,
        })
      }
      const snapshot = await getDocs(query(
        collection(db, 'reviews'),
        where('productId', '==', product.productId),
        where('status', '==', 'visible')
      ))
      setReviews(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
        .sort((a, b) => (b.createdAt?.toMillis?.() ?? 0) - (a.createdAt?.toMillis?.() ?? 0)))
      setEditingReviewId(null)
      setReviewRating(0)
      setReviewContent('')
      handleNotice(editingReviewId ? '리뷰를 수정했어요.' : '리뷰를 등록했어요.')
    } catch (error) {
      console.error('리뷰 저장 실패:', error)
      handleNotice('리뷰 저장에 실패했습니다. 구매 주문을 확인해주세요.')
    } finally {
      setIsReviewSaving(false)
    }
  }


  const handleReviewEdit = (review) => {
    setEditingReviewId(review.id)
    setReviewRating(review.rating)
    setReviewContent(review.content)
  }


  const handleReviewDelete = async (reviewId) => {
    try {
      await deleteDocument('reviews', reviewId)
      setReviews((current) => current.filter(({ id }) => id !== reviewId))
      if (editingReviewId === reviewId) {
        setEditingReviewId(null)
        setReviewRating(0)
        setReviewContent('')
      }
      handleNotice('리뷰를 삭제했어요.')
    } catch (error) {
      console.error('리뷰 삭제 실패:', error)
      handleNotice('리뷰 삭제에 실패했습니다.')
    }
  }


  const averageRating = reviews.length
    ? reviews.reduce(
        (sum, review) =>
          sum + review.rating,
        0
      ) / reviews.length
    : 0

  const formatReviewDate = (createdAt) => {
    const date = createdAt?.toDate?.()
    return date
      ? new Intl.DateTimeFormat('ko-CA').format(date)
      : createdAt || '-'
  }


  return (
    <main className={styles.page}>
      <div className={styles.layout}>

        <div className={styles.mainColumn}>

          <section
            className={styles.gallery}
            aria-label="상품 이미지"
          >
            <div className={styles.mainImage}>
              <img
                src={product.imageSrc}
                alt={product.productName}
              />
            </div>

            <div className={styles.thumbnails}>
              {productDetailImages
                .slice(0, 3)
                .map((image, index) => (
                  <img
                    src={image}
                    alt={`${product.productName} 상세 이미지 ${
                      index + 1
                    }`}
                    key={image}
                  />
                ))}
            </div>
          </section>


          <div
            className={styles.tabs}
            role="tablist"
          >
            <button
              className={
                activeTab === 'detail'
                  ? styles.activeTab
                  : ''
              }
              type="button"
              role="tab"
              aria-selected={
                activeTab === 'detail'
              }
              onClick={() =>
                setActiveTab('detail')
              }
            >
              상품 상세 정보
            </button>

            <button
              className={
                activeTab === 'review'
                  ? styles.activeTab
                  : ''
              }
              type="button"
              role="tab"
              aria-selected={
                activeTab === 'review'
              }
              onClick={() =>
                setActiveTab('review')
              }
            >
              리뷰({reviews.length})
            </button>
          </div>


          {activeTab === 'detail' ? (
            <section
              className={styles.detailContent}
              aria-label="상품 상세 정보"
            >
              <section className={styles.brandStory}>
                <img src={jajakLogo} alt="자작" />
                <h2>자작</h2>
                <p>“방대한 정보 속에서 헤매던 나만의 취향을 찾아, 일상 속에 우리 술의 깊은 향기를 스며들게 하는 감성 전통주 큐레이션 플랫폼.”</p>
              </section>

              <section className={styles.styledProduct}>
                <img src={stylingImageOne} alt={`${product.productName} 연출 이미지`} loading="lazy" />
                <div className={styles.styledCategory}>{product.productType} &gt; {product.liquorType ?? product.snackType ?? product.glassType ?? '추천 상품'}</div>
                <div className={styles.styledTitle}>
                  <h2>{product.productName}</h2>
                  <p>{product.productDescription}</p>
                </div>
              </section>

              {product.productType === '전통주' && (
                <>
                  <section className={styles.tastingSection}>
                    <h2>TASTING NOTES</h2>
                    <div className={styles.tastingGrid}>
                      {tastingNotes.map((note) => (
                        <div className={styles.tastingNote} key={note.label}>
                          <span>{note.label}</span>
                          <strong>{note.value} / 5</strong>
                        </div>
                      ))}
                    </div>
                  </section>

                  <div className={styles.detailOrnament} aria-hidden="true">
                    <img src={pattern2} alt="" />
                  </div>
                </>
              )}

              <section className={styles.faqSection}>
                <img src={faqMakdong} alt="질문을 안내하는 막동이" loading="lazy" />
                <div>
                  <h2>자주 묻는 질문</h2>
                  <dl>
                    <div><dt>Q1. 배송받을 때 꼭 본인이 직접 수령해야 하나요? 부재 시 어떻게 되나요?</dt><dd>주류 상품은 청소년 보호법에 따라 반드시 성인 본인 확인이 이루어져야 합니다. 만약 부재 중이실 경우 택배 기사님과 연락하여 재배송이나 지정된 수령 일정을 조율하시는 것을 권장해 드립니다.</dd></div>
                    <div><dt>Q2. 전통주마다 유통기한이 다 다른데, 보통 얼마나 두고 마실 수 있나요?</dt><dd>주종에 따라 천차만별입니다. 생막걸리의 경우 유통기한이 짧아(약 2~4주 내외) 수령 즉시 드시는 것이 가장 좋으며, 살균 막걸리나 약주, 증류주, 리큐르는 상대적으로 유통기한이 넉넉하오니 제품 상세 페이지의 기한을 꼭 확인해 주세요.</dd></div>
                    <div><dt>Q3. 묶음 배송으로 주문했는데, 택배 상자가 여러 개로 나누어져서 오거나 도착일이 다를 수 있나요?</dt><dd>네, 그럴 수 있습니다. 자작은 전국의 다양한 로컬 양조장들과 협력하고 있기에, 양조장의 위치나 출고지 상황에 따라 다른 물류 창고에서 출발하는 경우가 많습니다. 이 때문에 한 번에 주문하셨더라도 상품별로 택배 송장이 따로 발송되거나 도착 날짜가 하루 이틀 정도 차이가 날 수 있는 점 너른 양해 부탁드립니다.</dd></div>
                  </dl>
                </div>
              </section>

              <figure className={styles.secondStylingImage}>
                <img src={stylingImageTwo} alt={`${product.productName} 두 번째 연출 이미지`} loading="lazy" />
              </figure>

              <section className={styles.cautionSection}>
                <h2>구매 전에 확인하세요.</h2>
                <ul>
                  <li>알찬재료 꼼꼼히 포장하여 발송하나, 택배 배송 중 간혹 파손이 발생할 수 있습니다. 파손된 상품을 받으셨을 경우, 수령 당일 파손된 상태의 박스와 상품 사진을 남겨 고객센터로 접수해 주셔야 신속하게 처리가 가능한 점 유의해주세요.</li>
                  <li>안전한 주류 배송 및 파손 방지를 위해 일부 도서산간 및 제주 지역은 택배사 정책에 따라 배송이 제한되거나 추가 배송비가 발생할 수 있습니다.</li>
                  <li>주류는 단순 변심이나 개인적인 취향(맛이나 향이 기대와 다르다는 이유 등)에 의한 교환 및 환불이 법적·식품위생상 원칙적으로 불가합니다. 구매 전 상세 페이지의 테이스팅 노트와 도수를 꼼꼼히 살펴보신 후 신중한 구매를 부탁드립니다.</li>
                </ul>
              </section>
            </section>
          ) : (
            <section className={styles.reviewSection}>

              {isAuthReady && uid && (editingReviewId || purchasedOrders.length > 0) ? (
              <form
                className={styles.reviewForm}
                onSubmit={handleReviewSubmit}
              >
                <h2>
                  {editingReviewId
                    ? '리뷰 수정'
                    : '리뷰 작성'}
                </h2>

                <label
                  className={styles.nicknameField}
                >
                  <span>닉네임</span>

                  <input
                    value={memberNickname}
                    maxLength={20}
                    required
                    readOnly
                  />
                </label>

                {!editingReviewId && (
                  <label className={styles.nicknameField}>
                    <span>구매 주문</span>
                    <select value={reviewOrderId} onChange={(event) => setReviewOrderId(event.target.value)} required>
                      <option value="">구매 주문을 선택해주세요.</option>
                      {purchasedOrders.map((order) => (
                        <option key={order.id} value={order.id}>
                          {order.id} · {order.createdAt?.toDate?.().toLocaleDateString('ko-KR') || '주문'}
                        </option>
                      ))}
                    </select>
                  </label>
                )}

                <fieldset
                  className={styles.starField}
                >
                  <legend>별점</legend>

                  <div>
                    {[1, 2, 3, 4, 5].map(
                      (star) => (
                        <button
                          className={
                            star <= reviewRating
                              ? styles.selectedStar
                              : ''
                          }
                          type="button"
                          aria-label={`${star}점`}
                          aria-pressed={
                            star === reviewRating
                          }
                          onClick={() =>
                            setReviewRating(star)
                          }
                          key={star}
                        >
                          ★
                        </button>
                      )
                    )}
                  </div>
                </fieldset>

                <label
                  className={styles.contentField}
                >
                  <span>리뷰 내용</span>

                  <textarea
                    value={reviewContent}
                    rows="5"
                    maxLength={500}
                    required
                    onChange={(event) =>
                      setReviewContent(
                        event.target.value
                      )
                    }
                  />
                </label>

                <div
                  className={styles.formActions}
                >
                  {editingReviewId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingReviewId(null)
                        setReviewRating(0)
                        setReviewContent('')
                      }}
                    >
                      취소
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={
                      !memberNickname.trim() ||
                      !reviewContent.trim() ||
                      reviewRating === 0 ||
                      (!editingReviewId && !reviewOrderId) ||
                      isReviewSaving
                    }
                  >
                    {isReviewSaving
                      ? '저장 중...'
                      : editingReviewId
                      ? '수정 완료'
                      : '리뷰 등록'}
                  </button>
                </div>
              </form>
              ) : (
                <p className={styles.reviewLoginNotice}>
                  {isAuthReady && uid
                    ? '구매 완료한 상품에만 리뷰를 작성할 수 있습니다.'
                    : isAuthReady
                    ? '로그인 후 리뷰를 작성할 수 있습니다.'
                    : '로그인 정보를 확인하고 있습니다.'}
                </p>
              )}


              <div className={styles.reviewList}>
                {reviews.length === 0 ? (
                  <p className={styles.reviewEmpty}>
                    아직 등록된 리뷰가 없습니다.
                  </p>
                ) : (
                  reviews.map((review) => (
                    <article
                      className={styles.reviewItem}
                      key={review.id}
                    >
                      <header>
                        <strong>
                          {review.nickname}
                        </strong>

                        <span>
                          {'★'.repeat(review.rating)}
                          {'☆'.repeat(
                            5 - review.rating
                          )}
                        </span>

                        <time>
                          {formatReviewDate(review.createdAt)}
                        </time>
                      </header>

                      <p>{review.content}</p>

                      {uid && review.authorId === uid && (
                        <div>
                          <button
                            type="button"
                            onClick={() =>
                              handleReviewEdit(
                                review
                              )
                            }
                          >
                            수정
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleReviewDelete(
                                review.id
                              )
                            }
                          >
                            삭제
                          </button>
                        </div>
                      )}
                    </article>
                  ))
                )}
              </div>

            </section>
          )}


          {recommendedFoods.length > 0 && (
            <section
              className={styles.recommendedFoods}
            >
              <h2>추천 안주</h2>

              <div className={styles.foodGrid}>
                {recommendedFoods.map(
                  (food) => (
                    <ProductCard
                      product={food}
                      onAddToCart={
                        handleAddToCart
                      }
                      key={food.productId}
                    />
                  )
                )}
              </div>
            </section>
          )}

        </div>


        <aside className={styles.purchasePanel}>

          <p className={styles.brand}>
            {product.brandManufacturer}
          </p>

          <h1>{product.productName} {isLowStock && <small className={styles.lowStockLabel}>재고 임박</small>}</h1>

          <div className={styles.price}>
            {discountRate > 0 && (
              <span>{discountRate}%</span>
            )}

            <strong>
              {salePrice.toLocaleString('ko-KR')}원
            </strong>
          </div>

          <p className={styles.description}>
            {product.productDescription}
          </p>

          <div
            className={styles.rating}
            aria-label={
              reviews.length
                ? `평균 별점 ${averageRating.toFixed(
                    1
                  )}점`
                : '평점 정보 없음'
            }
          >
            <span>
              {reviews.length
                ? `${averageRating.toFixed(1)} ★`
                : '☆☆☆☆☆'}
            </span>

            <small>
              리뷰 {reviews.length}개
            </small>
          </div>


          <div className={styles.purchaseActions}>

            <button
              className={`${styles.wishButton} ${
                isWished ? styles.wished : ''
              }`}
              type="button"
              onClick={handleToggleWish}
              disabled={isWishLoading}
            >
              {isWished
                ? '♥ 찜한 상품'
                : '♡ 찜하기'}
            </button>


            <button
              className={`${styles.cartButton} ${isSoldOut ? styles.soldOutButton : ''}`}
              type="button"
              disabled={isSoldOut}
              onClick={() =>
                handleAddToCart(product)
              }
            >
              {isSoldOut ? '품절' : '장바구니에 담기'}
            </button>

          </div>


          {notice && (
            <div className={styles.notice} role={notice.isLoginPrompt ? 'alert' : 'status'}>
              <span
                className={`${styles.noticeIcon} ${
                  notice.isLoginPrompt ? styles.loginNoticeIcon : ''
                }`}
                aria-hidden="true"
              >
                {notice.isLoginPrompt ? '!' : '✓'}
              </span>
              <strong>{notice.message}</strong>
              {notice.isLoginPrompt && (
                <Link to={PATHS.login}>로그인하러 가기 <span aria-hidden="true">›</span></Link>
              )}
            </div>
          )}


          <div className={styles.accordions}>
            {accordions.map((item) => (
              <div
                className={styles.accordion}
                key={item.id}
              >
                <button
                  type="button"
                  aria-expanded={
                    openAccordion === item.id
                  }
                  onClick={() =>
                    setOpenAccordion((open) =>
                      open === item.id
                        ? null
                        : item.id
                    )
                  }
                >
                  <span>{item.title}</span>

                  <span>
                    {openAccordion === item.id
                      ? '−'
                      : '+'}
                  </span>
                </button>

                <div
                  className={`${styles.accordionContent} ${
                    openAccordion === item.id
                      ? styles.open
                      : ''
                  }`}
                >
                  <p>{item.content}</p>
                </div>
              </div>
            ))}
          </div>


          {relatedProducts.length > 0 && (
            <section className={styles.pairings}>
              <h2>추천 조합</h2>

              <div className={styles.pairingSlider}>
                <button
                  className={styles.pairingArrow}
                  type="button"
                  aria-label="이전 추천 조합"
                  onClick={() => setPairPage((current) => (current - 1 + pairPageCount) % pairPageCount)}
                >
                  &lt;
                </button>

                <div className={styles.pairingViewport}>
                  <div className={styles.miniGrid} key={pairPage}>
                    {visiblePairings.map((item) => (
                      <MiniPairingCard
                        product={item}
                        onAddToCart={handleAddToCart}
                        key={item.productId}
                      />
                    ))}
                  </div>
                </div>

                <button
                  className={styles.pairingArrow}
                  type="button"
                  aria-label="다음 추천 조합"
                  onClick={() => setPairPage((current) => (current + 1) % pairPageCount)}
                >
                  &gt;
                </button>
              </div>
            </section>
          )}

        </aside>

      </div>
    </main>
  )
}

export default ProductDetail
