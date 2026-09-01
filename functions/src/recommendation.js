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
// Mock 모드 확인
//
// functions/.env.local
// USE_MOCK_AI=true
//
// true:
// 실제 OpenAI API 호출 없이
// 후보 상품을 사용해 임시 추천 생성
//
// false:
// 실제 OpenAI API 호출
// ========================================

const isMockAiEnabled = () => {
  return (
    String(
      process.env.USE_MOCK_AI || ''
    )
      .trim()
      .toLowerCase() === 'true'
  )
}


// ========================================
// Mock 추천용 텍스트 정규화
// ========================================

const normalizeText = (value) => {
  if (Array.isArray(value)) {
    return value
      .join(' ')
      .toLowerCase()
  }

  return String(value || '')
    .toLowerCase()
}


// ========================================
// 특정 키워드가 포함되어 있는지 확인
// ========================================

const includesAny = (
  value,
  keywords = []
) => {
  const text =
    normalizeText(value)

  return keywords.some(
    (keyword) =>
      text.includes(
        String(keyword).toLowerCase()
      )
  )
}


// ========================================
// 강도 값 숫자로 변환
//
// 상품 JSON이
// 숫자 / low / medium / high 등
// 어느 형태여도 최대한 대응
// ========================================

const getLevelScore = (value) => {
  if (
    typeof value === 'number'
  ) {
    return value
  }

  const normalized =
    normalizeText(value)

  if (
    [
      'high',
      'strong',
      '높음',
      '강함',
      '강',
      '진함',
    ].some(
      (item) =>
        normalized.includes(item)
    )
  ) {
    return 3
  }

  if (
    [
      'medium',
      'normal',
      '중간',
      '보통',
      '적당',
    ].some(
      (item) =>
        normalized.includes(item)
    )
  ) {
    return 2
  }

  if (
    [
      'low',
      'light',
      '낮음',
      '약함',
      '약',
      '가벼움',
    ].some(
      (item) =>
        normalized.includes(item)
    )
  ) {
    return 1
  }

  return 0
}


// ========================================
// Mock 추천
// 오늘 도수 조건 점수
// ========================================

const getAlcoholMockScore = (
  liquor,
  alcohol
) => {
  if (
    typeof liquor?.abv !== 'number'
  ) {
    return 0
  }

  const abv = liquor.abv

  switch (alcohol) {
    case 'light':
      return abv <= 10
        ? 6
        : 0

    case 'medium':
      return (
        abv >= 11 &&
        abv <= 16
      )
        ? 6
        : 0

    case 'strong':
      return (
        abv >= 17 &&
        abv <= 25
      )
        ? 6
        : 0

    case 'veryStrong':
      return abv >= 26
        ? 6
        : 0

    case 'any':
    case 'preference':
    default:
      return 0
  }
}


// ========================================
// Mock 추천
// 오늘 맛 조건 점수
// ========================================

const getSingleTasteMockScore = (
  liquor,
  taste
) => {
  if (!liquor || !taste) {
    return 0
  }

  const searchableText = [
    ...(Array.isArray(
      liquor.flavorKeywords
    )
      ? liquor.flavorKeywords
      : []),

    liquor.productDescription,
    liquor.liquorType,
  ]
    .filter(Boolean)
    .join(' ')

  switch (taste) {
    case 'sweet': {
      let score = 0

      if (
        includesAny(
          searchableText,
          [
            'sweet',
            '달콤',
            '단맛',
            '부드러',
          ]
        )
      ) {
        score += 4
      }

      if (
        getLevelScore(
          liquor.sweetness
        ) >= 2
      ) {
        score += 3
      }

      return score
    }

    case 'sour': {
      let score = 0

      if (
        includesAny(
          searchableText,
          [
            'sour',
            'acid',
            '새콤',
            '산뜻',
            '산미',
          ]
        )
      ) {
        score += 4
      }

      if (
        getLevelScore(
          liquor.acidity
        ) >= 2
      ) {
        score += 3
      }

      return score
    }

    case 'clean': {
      let score = 0

      if (
        includesAny(
          searchableText,
          [
            'clean',
            'light',
            '깔끔',
            '담백',
            '산뜻',
            '가벼',
          ]
        )
      ) {
        score += 5
      }

      if (
        getLevelScore(
          liquor.bodyWeight
        ) === 1
      ) {
        score += 2
      }

      return score
    }

    case 'savory': {
      if (
        includesAny(
          searchableText,
          [
            'savory',
            'grain',
            'nutty',
            '고소',
            '구수',
            '곡물',
            '담백',
          ]
        )
      ) {
        return 6
      }

      return 0
    }

    case 'rich': {
      let score = 0

      if (
        includesAny(
          searchableText,
          [
            'rich',
            'deep',
            '진한',
            '묵직',
            '풍부',
            '깊은',
          ]
        )
      ) {
        score += 4
      }

      if (
        getLevelScore(
          liquor.bodyWeight
        ) >= 3
      ) {
        score += 3
      }

      return score
    }

    case 'bitter':
    case 'dry': {
      if (
        includesAny(
          searchableText,
          [
            'bitter',
            'dry',
            '쌉싸름',
            '드라이',
          ]
        )
      ) {
        return 6
      }

      return 0
    }

    case 'unknown':
    case 'preference':
    default:
      return 0
  }
}


// ========================================
// Mock 추천
// 회원: 단일 맛
// 비회원: 최대 2개 맛
// ========================================

const getTasteMockScore = (
  liquor,
  taste
) => {
  if (
    Array.isArray(taste)
  ) {
    return taste.reduce(
      (total, item) =>
        total +
        getSingleTasteMockScore(
          liquor,
          item
        ),
      0
    )
  }

  return getSingleTasteMockScore(
    liquor,
    taste
  )
}


// ========================================
// Mock 추천
// 안주 유형 점수
// ========================================

const getFoodMockScore = (
  food,
  foodAnswer
) => {
  if (
    !food ||
    !foodAnswer ||
    foodAnswer === 'recommend'
  ) {
    return 0
  }

  const snackType =
    normalizeText(
      food.snackType
    )

  switch (foodAnswer) {
    case 'meal':
      return includesAny(
        snackType,
        [
          'meal',
          '간편식',
          '식사',
        ]
      )
        ? 5
        : 0

    case 'snack':
      return includesAny(
        snackType,
        [
          'snack',
          '상온',
          '안주',
        ]
      )
        ? 5
        : 0

    case 'dessert':
      return includesAny(
        snackType,
        [
          'dessert',
          '디저트',
        ]
      )
        ? 5
        : 0

    default:
      return 0
  }
}


// ========================================
// Mock 추천
// 오늘의 상황 점수
// ========================================

const getMoodMockScore = (
  liquor,
  mood
) => {
  if (
    !liquor ||
    !mood ||
    mood === 'random'
  ) {
    return 0
  }

  const searchableText = [
    liquor.recommendedSituation,
    liquor.productDescription,
    liquor.timeOfDay,
  ]
    .filter(Boolean)
    .join(' ')

  const keywordMap = {
    refresh: [
      'refresh',
      '기분 전환',
      '산뜻',
      '가볍',
      '상쾌',
    ],

    relax: [
      'relax',
      '휴식',
      '편안',
      '조용',
      '마무리',
    ],

    food: [
      'food',
      '식사',
      '안주',
      '음식',
    ],

    special: [
      'special',
      '특별',
      '기념',
      '분위기',
    ],

    deep: [
      'deep',
      '깊',
      '천천히',
      '풍미',
      '묵직',
    ],
  }

  const keywords =
    keywordMap[mood] || []

  return includesAny(
    searchableText,
    keywords
  )
    ? 4
    : 0
}


// ========================================
// Mock 추천
// 회원 평소 취향 간단 비교
//
// 정확한 AI 판단 대신,
// 상품 데이터와 동일한 필드가 존재할 때만
// 보조 점수로 사용
// ========================================

const getPreferenceMockScore = (
  liquor,
  userPreference
) => {
  if (
    !liquor ||
    !userPreference
  ) {
    return 0
  }

  let score = 0

  const comparableFields = [
    'sweetness',
    'acidity',
    'bodyWeight',
    'scentIntensity',
  ]

  comparableFields.forEach(
    (field) => {
      const preferenceValue =
        userPreference[field]

      const liquorValue =
        liquor[field]

      if (
        preferenceValue == null ||
        liquorValue == null
      ) {
        return
      }

      if (
        normalizeText(
          preferenceValue
        ) ===
        normalizeText(
          liquorValue
        )
      ) {
        score += 1
      }
    }
  )

  return score
}


// ========================================
// Mock 후보 하나 점수 계산
// ========================================

const getMockCandidateScore = ({
  table,
  todaySurvey,
  userPreference,
}) => {
  if (!table) {
    return 0
  }

  let score = 0

  score +=
    getAlcoholMockScore(
      table.liquor,
      todaySurvey.alcohol
    )

  score +=
    getTasteMockScore(
      table.liquor,
      todaySurvey.taste
    )

  score +=
    getFoodMockScore(
      table.food,
      todaySurvey.food
    )

  score +=
    getMoodMockScore(
      table.liquor,
      todaySurvey.mood
    )

  // 회원이 "평소 취향대로"를 선택한 경우
  // 또는 평소 취향 데이터가 있는 경우
  // 아주 작은 보조 점수만 반영
  if (userPreference) {
    score +=
      getPreferenceMockScore(
        table.liquor,
        userPreference
      )
  }

  return score
}


// ========================================
// 추천 시간 텍스트
// ========================================

const buildMockTimeText = (
  liquor
) => {
  const timeRange =
    liquor?.recommendedTimeRange

  if (
    typeof timeRange === 'string' &&
    timeRange.trim()
  ) {
    return `${timeRange}에 즐기기 좋은 후보예요.`
  }

  if (
    Array.isArray(timeRange) &&
    timeRange.length > 0
  ) {
    return `${timeRange.join(
      ' ~ '
    )}에 즐기기 좋은 후보예요.`
  }

  if (
    timeRange &&
    typeof timeRange === 'object'
  ) {
    const start =
      timeRange.start ||
      timeRange.from

    const end =
      timeRange.end ||
      timeRange.to

    if (start && end) {
      return `${start} ~ ${end}에 즐기기 좋은 후보예요.`
    }
  }

  return '오늘의 조건을 기준으로 고른 주안상이에요.'
}


// ========================================
// Mock 추천 이유
// ========================================

const buildMockReason = ({
  todaySurvey,
}) => {
  const criteria = []

  if (
    todaySurvey.taste &&
    todaySurvey.taste !==
      'unknown'
  ) {
    criteria.push('맛 취향')
  }

  if (
    todaySurvey.alcohol &&
    todaySurvey.alcohol !==
      'any'
  ) {
    criteria.push('도수')
  }

  if (
    todaySurvey.food
  ) {
    criteria.push('안주 선택')
  }

  if (
    todaySurvey.mood &&
    todaySurvey.mood !==
      'random'
  ) {
    criteria.push('오늘의 분위기')
  }

  if (
    criteria.length === 0
  ) {
    return '안전 필터와 실제 상품 페어링 데이터를 기준으로 골라본 주안상이에요.'
  }

  return `${criteria.join(
    ', '
  )}을 반영해 실제 상품 후보 중 골라본 주안상이에요.`
}


// ========================================
// Mock 추천 생성
//
// 실제 candidateTables 안에서만 선택.
//
// 1. 간단한 조건 점수 계산
// 2. 점수 높은 순 정렬
// 3. 가능하면 서로 다른 전통주 선택
// 4. 부족하면 남은 후보로 채움
// ========================================

const buildMockAiRecommendations = ({
  candidateTables,
  todaySurvey,
  userPreference,
  recommendationCount,
}) => {
  const scoredCandidates =
    candidateTables
      .map(
        (table, index) => ({
          table,

          index,

          score:
            getMockCandidateScore({
              table,
              todaySurvey,
              userPreference,
            }),
        })
      )
      .sort(
        (a, b) => {
          if (
            b.score !== a.score
          ) {
            return (
              b.score - a.score
            )
          }

          // 점수가 같으면
          // 기존 pairings 순서 유지
          return (
            a.index - b.index
          )
        }
      )


  const selected = []

  const selectedTableIds =
    new Set()

  const selectedLiquorIds =
    new Set()


  // ========================================
  // 1차:
  // 가능하면 서로 다른 술을 먼저 선택
  // ========================================

  scoredCandidates.forEach(
    ({ table }) => {
      if (
        selected.length >=
        recommendationCount
      ) {
        return
      }

      const liquorId =
        table.liquor?.productId

      if (
        !liquorId ||
        selectedLiquorIds.has(
          liquorId
        )
      ) {
        return
      }

      selected.push(table)

      selectedTableIds.add(
        table.tableId
      )

      selectedLiquorIds.add(
        liquorId
      )
    }
  )


  // ========================================
  // 2차:
  // 서로 다른 술만으로 개수가 부족한 경우
  // 남은 후보에서 채움
  // ========================================

  scoredCandidates.forEach(
    ({ table }) => {
      if (
        selected.length >=
        recommendationCount
      ) {
        return
      }

      if (
        selectedTableIds.has(
          table.tableId
        )
      ) {
        return
      }

      selected.push(table)

      selectedTableIds.add(
        table.tableId
      )
    }
  )


  // ========================================
  // OpenAI 응답과 같은 모양으로 만들어
  // 기존 검증 로직 재사용
  // ========================================

  return selected.map(
    (table) => ({
      tableId:
        table.tableId,

      reason:
        buildMockReason({
          todaySurvey,
        }),

      liquorReason:
        '오늘 선택한 조건과 실제 전통주 상품 데이터를 비교해 고른 후보예요.',

      foodReason:
        todaySurvey.food ===
        'recommend'
          ? 'pairings.json에서 이 전통주와 함께 연결된 안주 후보예요.'
          : '오늘 선택한 안주 유형과 실제 페어링 데이터를 함께 확인한 후보예요.',

      glassReason:
        'pairings.json에서 이 전통주와 함께 연결된 술잔 후보예요.',

      recommendedTimeText:
        buildMockTimeText(
          table.liquor
        ),
    })
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
// AI 또는 Mock이 반환한 추천 검증
// + 최종 형태 변환
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
  // 2. Mock 모드 확인
  // ========================================

  const useMockAi =
    isMockAiEnabled()


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
  // 9. Mock 모드
  //
  // OpenAI API를 전혀 호출하지 않음
  // 실제 candidateTables 안에서 추천
  // ========================================

  if (useMockAi) {
    const mockAiRecommendations =
      buildMockAiRecommendations({
        candidateTables,

        todaySurvey,

        userPreference,

        recommendationCount:
          actualRecommendationCount,
      })


    const recommendations =
      buildFinalRecommendations({
        aiRecommendations:
          mockAiRecommendations,

        candidateTables,
      })


    if (
      recommendations.length !==
      actualRecommendationCount
    ) {
      console.error(
        'Mock 추천 개수 불일치:',
        {
          expected:
            actualRecommendationCount,

          received:
            recommendations.length,
        }
      )

      throw new Error(
        'INVALID_RECOMMENDATION_COUNT'
      )
    }


    return {
      recommendations,

      meta: {
        userType,

        model:
          'mock',

        isMock:
          true,

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


  // ========================================
  // 10. 실제 OpenAI 모드
  // API Key 확인
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
  // 11. OpenAI Client
  // ========================================

  const openai =
    new OpenAI({
      apiKey,
    })


  // ========================================
  // 12. OpenAI에게 전달할 데이터
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
  // 13. OpenAI 호출
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
  // 14. AI 응답 텍스트 확인
  // ========================================

  if (!response.output_text) {
    throw new Error(
      'EMPTY_OPENAI_RESPONSE'
    )
  }


  // ========================================
  // 15. JSON 변환
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
  // 16. 후보 검증 + 최종 결과 생성
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
  // 17. 추천 개수 검증
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
  // 18. 최종 반환
  // ========================================

  return {
    recommendations,

    meta: {
      userType,

      model,

      isMock:
        false,

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