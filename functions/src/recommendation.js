// functions/src/recommendation.js

const OpenAI = require('openai')

const {
  filterProducts,
} = require('./utils/filterProducts')

const {
  buildCandidateTables,
} = require('./utils/buildCandidateTables')


// ========================================
// 비회원이 '특정 과일·식물 원료'를 선택했을 때
// 세부 원료를 모르기 때문에 안전하게 전체 제외
// ========================================

const ALL_PLANT_TAGS = [
  'apple',
  'plum',
  'mulberry',
  'grape',
  'citrus',
  'cornelianCherry',
  'ginseng',
  'chrysanthemum',
  'pineNeedle',
]


// ========================================
// 비회원 안전 정보 만들기
// ========================================

const buildGuestSafety = (
  todaySurvey = {}
) => {
  const avoidIngredients =
    Array.isArray(
      todaySurvey.avoidIngredients
    )
      ? todaySurvey.avoidIngredients
      : []

  const noAllergy =
    avoidIngredients.includes('none')

  const hasPlantAvoid =
    avoidIngredients.includes(
      'fruitPlant'
    )

  return {
    noAllergy,

    avoidIngredients:
      noAllergy
        ? []
        : avoidIngredients,

    plantIngredients:
      noAllergy
        ? []
        : hasPlantAvoid
          ? ALL_PLANT_TAGS
          : [],

    customIngredient:
      noAllergy
        ? ''
        : todaySurvey.otherIngredient || '',
  }
}


// ========================================
// 회원 / 비회원 안전 정보 선택
// ========================================

const getSafety = ({
  userType,
  userPreference,
  todaySurvey,
}) => {
  // 로그인 회원
  if (userType === 'member') {
    return (
      userPreference?.safety || {
        noAllergy: true,
        avoidIngredients: [],
        plantIngredients: [],
        customIngredient: '',
      }
    )
  }

  // 비회원
  return buildGuestSafety(
    todaySurvey
  )
}


// ========================================
// 판매 가능한 술잔만 사용
// ========================================

const filterAvailableGlasses = (
  glasses = []
) => {
  return glasses.filter(
    (glass) => {
      if (!glass) {
        return false
      }

      if (
        glass.status !== 'selling'
      ) {
        return false
      }

      if (
        typeof glass.stock ===
          'number' &&
        glass.stock <= 0
      ) {
        return false
      }

      return true
    }
  )
}


// ========================================
// OpenAI 프롬프트
// ========================================

const buildInstructions = ({
  userType,
  recommendationCount,
}) => {
  return `
당신은 전통주 큐레이션 서비스 JAJAK(자작)의 AI 큐레이터 '막둥이'입니다.

사용자의 평소 취향과 오늘의 상황을 함께 살펴보고,
제공된 candidateTables 안에서 오늘 가장 잘 어울리는 주안상을 골라주세요.

주안상은 반드시 다음 세 상품으로 구성됩니다.

- 전통주 1개
- 안주 1개
- 술잔 1개

현재 사용자 유형은 "${userType}"입니다.

==================================================
[가장 중요한 규칙]
==================================================

1. 반드시 candidateTables 안에 존재하는 tableId만 선택하세요.

2. candidateTables에 없는 전통주, 안주, 술잔을 절대 새로 만들어내거나 추천하지 마세요.

3. 상품명, 도수, 맛, 향, 특징, 상황 등의 정보를 임의로 만들어내지 마세요.

4. candidateTables는 이미 알레르기, 기피 재료, 품절 상품 등의 안전 필터를 통과한 후보입니다.

5. 사용자의 오늘 답변을 가장 우선해서 판단하세요.

6. 로그인 회원의 경우 userPreference는 평소 취향입니다.
오늘 답변과 평소 취향이 충돌한다면 오늘 답변을 우선하세요.

7. 오늘 답변에서 "평소 취향대로"를 선택한 항목은 userPreference를 적극적으로 사용하세요.

8. "상관없음", "잘 모르겠음", "막둥이에게 맡기기"와 같은 답변은 강한 조건으로 사용하지 마세요.

==================================================
[오늘 설문 값의 의미]
==================================================

mood

- refresh:
  가볍게 기분 전환하고 싶은 상황

- relax:
  조용히 쉬면서 하루를 마무리하고 싶은 상황

- food:
  맛있는 안주와 함께 제대로 즐기고 싶은 상황

- special:
  평소보다 특별한 분위기를 원하는 상황

- deep:
  깊은 풍미를 천천히 즐기고 싶은 상황

- random:
  특별한 조건 없이 추천을 맡긴 상황


taste

- sweet:
  달콤하고 부드러운 맛

- sour:
  새콤하고 산뜻한 맛

- clean:
  깔끔하고 가벼운 맛

- savory:
  구수하고 담백한 맛

- rich:
  진하고 묵직한 맛

- bitter 또는 dry:
  쌉싸름하고 드라이한 맛

- preference:
  회원의 평소 취향을 우선

- unknown:
  맛에 대한 강한 선호 없음


alcohol

- light:
  10도 이하 또는 비교적 가벼운 술

- medium:
  11~16도 정도의 균형 잡힌 술

- strong:
  17~25도 정도의 진한 술

- veryStrong:
  26도 이상의 강한 술

- preference:
  회원의 평소 도수 취향을 우선

- any:
  도수를 중요한 조건으로 사용하지 않음


food

- meal:
  간편식 선호

- snack:
  상온안주 선호

- dessert:
  디저트 선호

- recommend:
  사용자 안주 선호보다 술과의 페어링을 우선


==================================================
[전통주 판단 기준]
==================================================

전통주는 다음 정보를 종합적으로 비교하세요.

- flavorKeywords
- sweetness
- acidity
- bodyWeight
- scentIntensity
- abv
- recommendedSituation
- beginnerRecommendation
- timeOfDay
- recommendedTimeRange
- productDescription

한 가지 조건만 보고 고르지 말고
사용자의 오늘 상황과 취향을 전체적으로 비교하세요.


==================================================
[안주 판단 기준]
==================================================

안주는 선택한 술과 candidateTables에서 이미 연결되어 있습니다.

사용자의 food 답변과 snackType을 함께 고려하세요.

food가 recommend라면 사용자의 안주 유형보다
이미 구성된 술과 안주의 조화를 우선하세요.


==================================================
[술잔 판단 기준]
==================================================

술잔 역시 candidateTables에 존재하는 술잔만 선택하세요.

술잔 데이터에 없는 분위기, 재질 특성, 기능 등을 임의로 만들어내지 마세요.


==================================================
[추천 시간]
==================================================

전통주의 recommendedTimeRange와 recommendedSituation을 근거로
오늘 즐기기 좋은 시간대를 자연스럽게 설명하세요.

예:
"오후 8시에서 10시 사이, 하루를 천천히 정리하며 즐기기 좋아요."

recommendedTimeRange에 없는 시간을 임의로 만들어내지 마세요.

건강상 효능이나 특정 시간에 음주하면 더 건강하다는 식의 표현은 절대 사용하지 마세요.


==================================================
[추천 이유]
==================================================

추천 이유는 사용자가 실제로 선택한 답변과
상품 데이터에 존재하는 정보를 근거로 작성하세요.

사용자가 말하지 않은 감정이나 상황을 임의로 단정하지 마세요.

자연스럽고 친근한 한국어로 작성하세요.

막둥이 캐릭터 말투는 너무 과하지 않게 사용하세요.

각 설명은 짧고 명확하게 작성하세요.


==================================================
[추천 개수]
==================================================

정확히 ${recommendationCount}개의 주안상을 선택하세요.

가능하면 서로 다른 전통주를 선택하여
각 추천이 비슷해 보이지 않도록 하세요.

하지만 다양성을 위해 적합도가 낮은 후보를 억지로 선택하지 마세요.
`
}


// ========================================
// OpenAI Structured Output Schema
// ========================================

const buildResponseSchema = (
  recommendationCount
) => {
  return {
    type: 'object',

    additionalProperties: false,

    properties: {
      recommendations: {
        type: 'array',

        minItems:
          recommendationCount,

        maxItems:
          recommendationCount,

        items: {
          type: 'object',

          additionalProperties: false,

          properties: {
            tableId: {
              type: 'string',
            },

            reason: {
              type: 'string',
            },

            liquorReason: {
              type: 'string',
            },

            foodReason: {
              type: 'string',
            },

            glassReason: {
              type: 'string',
            },

            recommendedTimeText: {
              type: 'string',
            },
          },

          required: [
            'tableId',
            'reason',
            'liquorReason',
            'foodReason',
            'glassReason',
            'recommendedTimeText',
          ],
        },
      },
    },

    required: [
      'recommendations',
    ],
  }
}


// ========================================
// AI가 반환한 추천 검증 + 최종 형태 변환
// ========================================

const buildFinalRecommendations = ({
  aiRecommendations,
  candidateTables,
}) => {
  const candidateMap =
    new Map(
      candidateTables.map(
        (table) => [
          table.tableId,
          table,
        ]
      )
    )

  const usedTableIds =
    new Set()

  const finalRecommendations = []

  aiRecommendations.forEach(
    (recommendation) => {
      const table =
        candidateMap.get(
          recommendation.tableId
        )

      // 후보에 없는 tableId
      if (!table) {
        return
      }

      // 중복 추천 방지
      if (
        usedTableIds.has(
          recommendation.tableId
        )
      ) {
        return
      }

      usedTableIds.add(
        recommendation.tableId
      )

      finalRecommendations.push({
        tableId:
          recommendation.tableId,

        liquorId:
          table.liquor.productId,

        foodId:
          table.food.productId,

        glassId:
          table.glass.productId,

        reason:
          recommendation.reason,

        liquorReason:
          recommendation.liquorReason,

        foodReason:
          recommendation.foodReason,

        glassReason:
          recommendation.glassReason,

        recommendedTimeText:
          recommendation.recommendedTimeText,

        recommendedTimeRange:
          table.liquor
            .recommendedTimeRange ||
          null,
      })
    }
  )

  return finalRecommendations
}


// ========================================
// 메인 추천 함수
// ========================================

const createRecommendation = async ({
  userType,

  userPreference = null,

  todaySurvey = {},

  liquors = [],

  foods = [],

  glasses = [],

  pairings = [],

  openaiApiKey = null,

  recommendationCount = 3,

  model = 'gpt-5.6-luna',
}) => {
  // ========================================
  // 1. 기본 검증
  // ========================================

  if (
    userType !== 'member' &&
    userType !== 'guest'
  ) {
    throw new Error(
      'INVALID_USER_TYPE'
    )
  }


  // ========================================
  // 2. OpenAI API Key 확인
  // ========================================

  const apiKey =
    openaiApiKey ||
    process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error(
      'OPENAI_API_KEY_MISSING'
    )
  }


  // ========================================
  // 3. 회원 / 비회원 안전 정보 만들기
  // ========================================

  const safety = getSafety({
    userType,
    userPreference,
    todaySurvey,
  })


  // ========================================
  // 4. 알레르기 / 품절 필터링
  // ========================================

  const filtered =
    filterProducts({
      liquors,
      foods,
      safety,
    })


  // ========================================
  // 5. 판매 가능한 술잔 필터링
  // ========================================

  const availableGlasses =
    filterAvailableGlasses(
      glasses
    )


  // ========================================
  // 6. 가능한 주안상 후보 생성
  // ========================================

  const candidateResult =
    buildCandidateTables({
      liquors:
        filtered.liquors,

      foods:
        filtered.foods,

      glasses:
        availableGlasses,

      pairings,
    })


  const {
    candidateTables,
    totalCount,
    invalidReferences,
  } = candidateResult


  // ========================================
  // 7. 후보가 하나도 없는 경우
  // ========================================

  if (totalCount === 0) {
    const error =
      new Error(
        'NO_SAFE_CANDIDATES'
      )

    error.details = {
      excluded:
        filtered.excluded,

      invalidReferences,
    }

    throw error
  }


  // ========================================
  // 8. 실제 추천 가능한 개수 결정
  // ========================================

  const actualRecommendationCount =
    Math.min(
      recommendationCount,
      totalCount
    )


  // ========================================
  // 9. OpenAI Client
  // ========================================

  const openai =
    new OpenAI({
      apiKey,
    })


  // ========================================
  // 10. OpenAI에게 전달할 데이터
  // ========================================

  const inputData = {
    userType,

    userPreference:
      userType === 'member'
        ? userPreference
        : null,

    todaySurvey,

    candidateTables,

    recommendationCount:
      actualRecommendationCount,
  }


  // ========================================
  // 11. OpenAI 호출
  // ========================================

  const response =
    await openai.responses.create({
      model,

      instructions:
        buildInstructions({
          userType,

          recommendationCount:
            actualRecommendationCount,
        }),

      input:
        JSON.stringify(
          inputData
        ),

      text: {
        format: {
          type: 'json_schema',

          name:
            'jajak_recommendation',

          strict: true,

          schema:
            buildResponseSchema(
              actualRecommendationCount
            ),
        },
      },
    })


  // ========================================
  // 12. AI 응답 텍스트 확인
  // ========================================

  if (!response.output_text) {
    throw new Error(
      'EMPTY_OPENAI_RESPONSE'
    )
  }


  // ========================================
  // 13. JSON 변환
  // ========================================

  let parsedResult

  try {
    parsedResult =
      JSON.parse(
        response.output_text
      )
  } catch (error) {
    console.error(
      'OpenAI JSON 파싱 실패:',
      response.output_text
    )

    throw new Error(
      'INVALID_OPENAI_RESPONSE'
    )
  }


  // ========================================
  // 14. 후보 검증 + 최종 결과 생성
  // ========================================

  const recommendations =
    buildFinalRecommendations({
      aiRecommendations:
        parsedResult
          .recommendations ||
        [],

      candidateTables,
    })


  // ========================================
  // 15. 추천 개수 검증
  // ========================================

  if (
    recommendations.length !==
    actualRecommendationCount
  ) {
    console.error(
      '추천 개수 불일치:',
      {
        expected:
          actualRecommendationCount,

        received:
          recommendations.length,

        aiResult:
          parsedResult,
      }
    )

    throw new Error(
      'INVALID_RECOMMENDATION_COUNT'
    )
  }


  // ========================================
  // 16. 최종 반환
  // ========================================

  return {
    recommendations,

    meta: {
      userType,

      model,

      candidateCount:
        totalCount,

      recommendationCount:
        recommendations.length,

      excluded:
        filtered.excluded,

      invalidReferences,
    },
  }
}


module.exports = {
  createRecommendation,
}