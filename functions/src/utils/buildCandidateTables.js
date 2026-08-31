// functions/src/utils/buildCandidateTables.js


// ========================================
// 상품 배열 → ID 기준 Map 생성
//
// 예:
// [
//   { productId: 'liq_001', ... },
//   { productId: 'liq_002', ... }
// ]
//
// ↓
//
// Map {
//   'liq_001' => 상품 객체,
//   'liq_002' => 상품 객체
// }
// ========================================

const createProductMap = (products = []) => {
  return new Map(
    products
      .filter(
        (product) =>
          product &&
          product.productId
      )
      .map(
        (product) => [
          product.productId,
          product,
        ]
      )
  )
}


// ========================================
// OpenAI에 전달할 전통주 정보 정리
//
// 상품 JSON 전체를 그대로 보내기보다
// 추천 판단에 필요한 정보만 추림
// ========================================

const compactLiquor = (liquor) => {
  return {
    productId: liquor.productId,
    productName: liquor.productName,

    liquorType: liquor.liquorType,

    abv:
      typeof liquor.abv === 'number'
        ? liquor.abv
        : null,

    flavorKeywords:
      Array.isArray(liquor.flavorKeywords)
        ? liquor.flavorKeywords
        : [],

    sweetness:
      liquor.sweetness ?? null,

    acidity:
      liquor.acidity ?? null,

    carbonation:
      liquor.carbonation ?? null,

    scentIntensity:
      liquor.scentIntensity ?? null,

    bodyWeight:
      liquor.bodyWeight ?? null,

    timeOfDay:
      liquor.timeOfDay ?? null,

    beginnerRecommendation:
      liquor.beginnerRecommendation ?? null,

    recommendedSituation:
      liquor.recommendedSituation ?? null,

    recommendedTimeRange:
      liquor.recommendedTimeRange ?? null,

    productDescription:
      liquor.productDescription ?? '',
  }
}


// ========================================
// OpenAI에 전달할 안주 정보 정리
// ========================================

const compactFood = (food) => {
  return {
    productId: food.productId,
    productName: food.productName,

    snackType:
      food.snackType ?? null,

    productDescription:
      food.productDescription ?? '',
  }
}


// ========================================
// OpenAI에 전달할 술잔 정보 정리
// ========================================

const compactGlass = (glass) => {
  return {
    productId: glass.productId,
    productName: glass.productName,

    glassType:
      glass.glassType ?? null,

    volume:
      glass.volume ?? null,

    productDescription:
      glass.productDescription ?? '',
  }
}


// ========================================
// 후보 주안상 생성
// ========================================

const buildCandidateTables = ({
  liquors = [],
  foods = [],
  glasses = [],
  pairings = [],
}) => {
  // ----------------------------------------
  // 안전 필터를 통과한 상품만 Map으로 변환
  // ----------------------------------------

  const liquorMap =
    createProductMap(liquors)

  const foodMap =
    createProductMap(foods)

  const glassMap =
    createProductMap(glasses)


  const candidateTables = []

  // 잘못된 pairing ID 확인용
  const invalidReferences = {
    liquors: [],
    foods: [],
    glasses: [],
  }


  // ========================================
  // pairings.json 순회
  // ========================================

  pairings.forEach((pairing) => {
    if (
      !pairing ||
      !pairing.liquorId
    ) {
      return
    }


    // ========================================
    // 1. 전통주 확인
    //
    // filterProducts에서 제외된 술이면
    // liquorMap에 존재하지 않으므로
    // 해당 pairing 전체를 사용하지 않음
    // ========================================

    const liquor =
      liquorMap.get(
        pairing.liquorId
      )

    if (!liquor) {
      /*
       * filterProducts에서 알레르기 등의 이유로
       * 정상적으로 제거됐을 수도 있기 때문에
       * 여기서는 무조건 오류로 보지는 않음.
       */

      return
    }


    // ========================================
    // 2. 연결된 안주 중
    // 실제로 안전하게 남아있는 안주만 가져오기
    // ========================================

    const pairedFoodIds =
      Array.isArray(
        pairing.pairedFoodIds
      )
        ? pairing.pairedFoodIds
        : []


    const pairedFoods = []

    pairedFoodIds.forEach((foodId) => {
      const food =
        foodMap.get(foodId)

      if (food) {
        pairedFoods.push(food)

        return
      }

      /*
       * 알레르기 필터 때문에 제거된 안주일 수도 있음.
       * 따라서 실제 원본 존재 여부까지는
       * 여기서 판단하지 않음.
       */
    })


    // ========================================
    // 3. 연결된 술잔 확인
    // ========================================

    const recommendedGlassIds =
      Array.isArray(
        pairing.recommendedGlassIds
      )
        ? pairing.recommendedGlassIds
        : []


    const pairedGlasses = []

    recommendedGlassIds.forEach(
      (glassId) => {
        const glass =
          glassMap.get(glassId)

        if (glass) {
          pairedGlasses.push(glass)

          return
        }

        // gft_*처럼 실제 술잔 JSON에 없는 ID
        if (
          !invalidReferences.glasses.includes(
            glassId
          )
        ) {
          invalidReferences.glasses.push(
            glassId
          )
        }
      }
    )


    // ========================================
    // 4. 사용할 안주 또는 술잔이 없으면
    // 해당 술의 주안상 후보 생성 불가
    // ========================================

    if (
      pairedFoods.length === 0 ||
      pairedGlasses.length === 0
    ) {
      return
    }


    // ========================================
    // 5. 가능한 조합 생성
    //
    // 예:
    //
    // 술: liq_001
    //
    // 안주:
    // snk_001
    // snk_005
    //
    // 술잔:
    // gls_002
    //
    // ↓
    //
    // 후보 2개 생성
    // ========================================

    pairedFoods.forEach((food) => {
      pairedGlasses.forEach(
        (glass) => {
          candidateTables.push({
            tableId:
              `${liquor.productId}` +
              `__${food.productId}` +
              `__${glass.productId}`,

            liquor:
              compactLiquor(liquor),

            food:
              compactFood(food),

            glass:
              compactGlass(glass),
          })
        }
      )
    })
  })


  // ========================================
  // 결과
  // ========================================

  return {
    candidateTables,

    totalCount:
      candidateTables.length,

    invalidReferences,
  }
}


module.exports = {
  buildCandidateTables,
}