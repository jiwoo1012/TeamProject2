// functions/src/utils/filterProducts.js

// ========================================
// 배열 안전 처리
// ========================================

const toArray = (value) => {
  return Array.isArray(value) ? value : []
}


// ========================================
// 문자열 정규화
// 기타 / 직접 입력 재료 확인용
// ========================================

const normalizeText = (value) => {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
}


// ========================================
// 두 배열에 겹치는 값이 있는지 확인
// ========================================

const hasIntersection = (
  productTags,
  avoidTags
) => {
  const productTagList = toArray(productTags)
  const avoidTagList = toArray(avoidTags)

  return productTagList.some((tag) =>
    avoidTagList.includes(tag)
  )
}


// ========================================
// 기타 직접 입력 재료 포함 여부
//
// 예:
// customIngredient = "복숭아"
// 상품 allergyCautionInfo에 "복숭아 함유"
// → true
//
// 현재 상품 JSON에 별도 태그가 없는
// 직접 입력 재료를 위한 보조 필터링
// ========================================

const containsCustomIngredient = (
  product,
  customIngredient
) => {
  const custom = normalizeText(
    customIngredient
  )

  if (!custom) {
    return false
  }

  const searchableText = normalizeText(
    [
      product.allergyCautionInfo,
      product.productDescription,
      product.productName,
    ]
      .filter(Boolean)
      .join(' ')
  )

  return searchableText.includes(custom)
}


// ========================================
// 상품 하나가 판매 가능한 상태인지 확인
// ========================================

const isAvailableProduct = (product) => {
  if (!product) {
    return false
  }

  if (product.status !== 'selling') {
    return false
  }

  if (
    typeof product.stock === 'number' &&
    product.stock <= 0
  ) {
    return false
  }

  return true
}


// ========================================
// 안전 정보 정규화
//
// 회원:
// {
//   noAllergy: false,
//   avoidIngredients: ['wheat'],
//   plantIngredients: ['apple'],
//   customIngredient: ''
// }
//
// 비회원:
// 필요한 경우 같은 구조로 변환해서 넘기면 됨.
// ========================================

const normalizeSafety = (safety = {}) => {
  if (safety.noAllergy) {
    return {
      noAllergy: true,
      avoidIngredients: [],
      plantIngredients: [],
      customIngredient: '',
    }
  }

  return {
    noAllergy: false,

    avoidIngredients:
      toArray(
        safety.avoidIngredients
      ).filter(
        (item) =>
          item !== 'none' &&
          item !== 'other' &&
          item !== 'plant' &&
          item !== 'fruitPlant'
      ),

    plantIngredients:
      toArray(
        safety.plantIngredients
      ),

    customIngredient:
      typeof safety.customIngredient ===
      'string'
        ? safety.customIngredient.trim()
        : '',
  }
}


// ========================================
// 상품 하나의 제외 이유 확인
// ========================================

const getExclusionReason = (
  product,
  safety
) => {
  // 판매중이 아닌 상품
  if (product.status !== 'selling') {
    return 'NOT_SELLING'
  }

  // 품절 상품
  if (
    typeof product.stock === 'number' &&
    product.stock <= 0
  ) {
    return 'OUT_OF_STOCK'
  }

  // 알레르기 / 기피 재료
  if (
    hasIntersection(
      product.allergenTags,
      safety.avoidIngredients
    )
  ) {
    return 'ALLERGEN'
  }

  // 특정 과일 / 식물 원료
  if (
    hasIntersection(
      product.plantIngredientTags,
      safety.plantIngredients
    )
  ) {
    return 'PLANT_INGREDIENT'
  }

  // 기타 직접 입력
  if (
    containsCustomIngredient(
      product,
      safety.customIngredient
    )
  ) {
    return 'CUSTOM_INGREDIENT'
  }

  return null
}


// ========================================
// 상품 배열 필터링
// ========================================

const filterProductList = (
  products = [],
  safety = {}
) => {
  const normalizedSafety =
    normalizeSafety(safety)

  const safeProducts = []
  const excludedProducts = []

  products.forEach((product) => {
    if (!isAvailableProduct(product)) {
      excludedProducts.push({
        productId: product?.productId,
        reason:
          product?.status !== 'selling'
            ? 'NOT_SELLING'
            : 'OUT_OF_STOCK',
      })

      return
    }

    const exclusionReason =
      getExclusionReason(
        product,
        normalizedSafety
      )

    if (exclusionReason) {
      excludedProducts.push({
        productId: product.productId,
        reason: exclusionReason,
      })

      return
    }

    safeProducts.push(product)
  })

  return {
    safeProducts,
    excludedProducts,
  }
}


// ========================================
// 전통주 + 안주 한 번에 필터링
// ========================================

const filterProducts = ({
  liquors = [],
  foods = [],
  safety = {},
}) => {
  const normalizedSafety =
    normalizeSafety(safety)

  const liquorResult =
    filterProductList(
      liquors,
      normalizedSafety
    )

  const foodResult =
    filterProductList(
      foods,
      normalizedSafety
    )

  return {
    liquors: liquorResult.safeProducts,
    foods: foodResult.safeProducts,

    excluded: {
      liquors:
        liquorResult.excludedProducts,

      foods:
        foodResult.excludedProducts,
    },

    safety: normalizedSafety,
  }
}


module.exports = {
  filterProducts,
  filterProductList,
  normalizeSafety,
}