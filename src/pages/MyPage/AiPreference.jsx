import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  useNavigate,
} from 'react-router-dom'

import {
  onAuthStateChanged,
} from 'firebase/auth'

import {
  doc,
  getDoc,
} from 'firebase/firestore'

import {
  auth,
  db,
} from '../../firebase/firebase'

import makdongImage from '../../assets/webpImages/characters/M007_Poses03.webp'
import MyPageHeader from '../../components/mypage/MyPageHeader'

import styles from './AiPreference.module.scss'


// ========================================
// 취향 표시 정보
// ========================================

const PREFERENCE_INFO = {
  sweetness: {
    title: '단맛 선호',
    left: '거의 달지 않음',
    right: '달콤함',

    options: {
      dry: {
        position: 12,
        label: '거의 달지 않은 게 좋아요',
        keyword: '드라이한 맛',
      },

      mild: {
        position: 50,
        label: '은은한 단맛이 좋아요',
        keyword: '은은한 단맛',
      },

      sweet: {
        position: 88,
        label: '달콤한 술이 좋아요',
        keyword: '달콤한 맛',
      },

      unknown: {
        position: 50,
        label: '아직 잘 모르겠어요',
        keyword: '단맛 탐색 중',
      },
    },
  },


  acidity: {
    title: '산미 선호',
    left: '산미 거의 없음',
    right: '확실한 산미',

    options: {
      low: {
        position: 12,
        label: '산미가 거의 없는 게 좋아요',
        keyword: '낮은 산미',
      },

      medium: {
        position: 50,
        label: '은은하게 상큼한 정도가 좋아요',
        keyword: '은은한 산미',
      },

      high: {
        position: 88,
        label: '새콤함이 확실한 게 좋아요',
        keyword: '뚜렷한 산미',
      },

      any: {
        position: 50,
        label: '산미는 크게 상관없어요',
        keyword: '산미 무관',
      },
    },
  },


  bodyWeight: {
    title: '무게감',
    left: '가볍고 깔끔',
    right: '진하고 묵직',

    options: {
      light: {
        position: 14,
        label: '가볍고 깔끔한 술이 좋아요',
        keyword: '가벼운 바디',
      },

      medium: {
        position: 50,
        label: '적당한 무게감이 좋아요',
        keyword: '균형 잡힌 바디',
      },

      full: {
        position: 88,
        label: '진하고 묵직한 술이 좋아요',
        keyword: '묵직한 바디',
      },

      unknown: {
        position: 50,
        label: '아직 잘 모르겠어요',
        keyword: '무게감 탐색 중',
      },
    },
  },


  scentIntensity: {
    title: '향의 강도',
    left: '은은한 향',
    right: '확실한 향',

    options: {
      mild: {
        position: 14,
        label: '은은한 향이 좋아요',
        keyword: '은은한 향',
      },

      medium: {
        position: 50,
        label: '적당히 느껴지는 향이 좋아요',
        keyword: '적당한 향',
      },

      strong: {
        position: 88,
        label: '향이 확실한 게 좋아요',
        keyword: '뚜렷한 향',
      },

      any: {
        position: 50,
        label: '향은 크게 상관없어요',
        keyword: '향 무관',
      },
    },
  },


  alcoholRange: {
    title: '도수',
    left: '저도수',
    right: '고도수',

    options: {
      light: {
        position: 12,
        label: '10도 이하',
        keyword: '저도수',
      },

      moderate: {
        position: 36,
        label: '11~16도',
        keyword: '적당한 도수',
      },

      strong: {
        position: 66,
        label: '17~25도',
        keyword: '높은 도수',
      },

      veryStrong: {
        position: 90,
        label: '26도 이상',
        keyword: '고도수',
      },

      any: {
        position: 50,
        label: '도수는 크게 상관없어요',
        keyword: '도수 무관',
      },
    },
  },
}


// ========================================
// 알레르기 / 기피 원료 한글명
// ========================================

const INGREDIENT_LABELS = {
  wheat: '밀',
  buckwheat: '메밀',
  soybean: '대두',
  nuts: '견과류',
  peanut: '땅콩',
  sesame: '참깨',
  dairy: '유제품',
  egg: '달걀',
  fish: '생선류',
  shellfish: '연체류',
  pork: '돼지고기',

  bee: '벌꿀',
  honey: '벌꿀',

  plant: '특정 과일 · 식물 원료',
  fruitPlant: '특정 과일 · 식물 원료',

  custom: '기타',
  other: '기타',

  apple: '사과',
  plum: '매실',
  mulberry: '오디',
  grape: '머루',
  citrus: '감귤류',
  cornelianCherry: '산수유',
  ginseng: '인삼',
  chrysanthemum: '국화',
  pineNeedle: '솔잎',
  etcPlant: '기타 식물 원료',
}


// ========================================
// 배열로 저장된 단일 답변 풀기
//
// 예:
// ['sweet'] → 'sweet'
// ========================================

const unwrapValue = (value) => {
  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value ?? null
}


// ========================================
// 단맛 정규화
// ========================================

const normalizeSweetness = (rawValue) => {
  const value =
    unwrapValue(rawValue)

  if (
    value === null ||
    value === undefined
  ) {
    return null
  }


  // 숫자형 데이터까지 대응
  if (
    typeof value === 'number'
  ) {
    if (value <= 2) {
      return 'dry'
    }

    if (value === 3) {
      return 'mild'
    }

    if (value >= 4) {
      return 'sweet'
    }
  }


  const normalized =
    String(value)
      .trim()
      .toLowerCase()


  const map = {
    dry: 'dry',
    mild: 'mild',
    sweet: 'sweet',
    unknown: 'unknown',

    '거의 달지 않은 술':
      'dry',

    '거의 달지 않은 게 좋아요':
      'dry',

    '은은한 술':
      'mild',

    '은은한 단맛이 좋아요':
      'mild',

    '달콤한 술':
      'sweet',

    '달콤한 술이 좋아요':
      'sweet',

    '아직 잘 모르겠어요':
      'unknown',
  }


  return (
    map[normalized] ??
    null
  )
}


// ========================================
// 산미 정규화
//
// 현재 표시용 필드:
// acidity
//
// 회원가입 질문 ID:
// sourness
// ========================================

const normalizeAcidity = (rawValue) => {
  const value =
    unwrapValue(rawValue)

  if (
    value === null ||
    value === undefined
  ) {
    return null
  }


  if (
    typeof value === 'number'
  ) {
    if (value <= 2) {
      return 'low'
    }

    if (value === 3) {
      return 'medium'
    }

    if (value >= 4) {
      return 'high'
    }
  }


  const normalized =
    String(value)
      .trim()
      .toLowerCase()


  const map = {
    low: 'low',
    medium: 'medium',
    high: 'high',
    any: 'any',

    '산미가 거의 없는 술':
      'low',

    '산미가 거의 없는 게 좋아요':
      'low',

    '은은하게 상큼한 술':
      'medium',

    '은은하게 상큼한 정도가 좋아요':
      'medium',

    '새콤함이 확실한 술':
      'high',

    '새콤함이 확실한 게 좋아요':
      'high',

    '크게 상관없어요':
      'any',

    '산미는 크게 상관없어요':
      'any',
  }


  return (
    map[normalized] ??
    null
  )
}


// ========================================
// 무게감 정규화
//
// 현재 표시용:
// bodyWeight
//
// 회원가입 질문:
// body
// ========================================

const normalizeBodyWeight = (
  rawValue
) => {
  const value =
    unwrapValue(rawValue)

  if (
    value === null ||
    value === undefined
  ) {
    return null
  }


  if (
    typeof value === 'number'
  ) {
    if (value <= 2) {
      return 'light'
    }

    if (value === 3) {
      return 'medium'
    }

    if (value >= 4) {
      return 'full'
    }
  }


  const normalized =
    String(value)
      .trim()
      .toLowerCase()


  const map = {
    light: 'light',
    medium: 'medium',
    full: 'full',
    unknown: 'unknown',

    '가볍고 깔끔한 술':
      'light',

    '가볍고 깔끔한 술이 좋아요':
      'light',

    '적당한 무게감의 술':
      'medium',

    '적당한 무게감이 좋아요':
      'medium',

    '진하고 묵직한 술':
      'full',

    '진하고 묵직한 술이 좋아요':
      'full',

    '아직 잘 모르겠어요':
      'unknown',
  }


  return (
    map[normalized] ??
    null
  )
}


// ========================================
// 향 강도 정규화
//
// 현재 표시용:
// scentIntensity
//
// 회원가입 질문:
// aroma
// ========================================

const normalizeScentIntensity = (
  rawValue
) => {
  const value =
    unwrapValue(rawValue)

  if (
    value === null ||
    value === undefined
  ) {
    return null
  }


  if (
    typeof value === 'number'
  ) {
    if (value <= 2) {
      return 'mild'
    }

    if (value === 3) {
      return 'medium'
    }

    if (value >= 4) {
      return 'strong'
    }
  }


  const normalized =
    String(value)
      .trim()
      .toLowerCase()


  const map = {
    mild: 'mild',
    medium: 'medium',
    strong: 'strong',
    any: 'any',

    '은은한 향':
      'mild',

    '은은한 향이 좋아요':
      'mild',

    '적당히 느껴지는 향':
      'medium',

    '적당히 느껴지는 향이 좋아요':
      'medium',

    '향이 확실한 술':
      'strong',

    '향이 확실한 게 좋아요':
      'strong',

    '향은 크게 상관없어요':
      'any',
  }


  return (
    map[normalized] ??
    null
  )
}


// ========================================
// 도수 정규화
//
// 현재 표시용:
// alcoholRange
//
// 회원가입 질문:
// abv
//
// 문자열 / 배열 / 숫자 / 범위 객체
// 전부 대응
// ========================================

const normalizeAlcoholRange = (
  rawValue
) => {
  let value =
    unwrapValue(rawValue)


  if (
    value === null ||
    value === undefined
  ) {
    return null
  }


  // 예:
  // {
  //   min: 11,
  //   max: 16
  // }
  if (
    typeof value === 'object' &&
    !Array.isArray(value)
  ) {
    const directValue =
      value.value ??
      value.type ??
      value.key ??
      null


    if (directValue) {
      return normalizeAlcoholRange(
        directValue
      )
    }


    const min =
      value.min !==
        undefined
        ? Number(
            value.min
          )
        : null

    const max =
      value.max !==
        undefined
        ? Number(
            value.max
          )
        : null


    if (
      max !== null &&
      !Number.isNaN(max) &&
      max <= 10
    ) {
      return 'light'
    }


    if (
      min !== null &&
      max !== null &&
      !Number.isNaN(min) &&
      !Number.isNaN(max)
    ) {
      if (
        min >= 26
      ) {
        return 'veryStrong'
      }

      if (
        min >= 17
      ) {
        return 'strong'
      }

      if (
        min >= 11
      ) {
        return 'moderate'
      }

      if (
        max <= 10
      ) {
        return 'light'
      }
    }
  }


  if (
    typeof value === 'number'
  ) {
    // 실제 도수 숫자가 저장된 경우
    if (value <= 10) {
      return 'light'
    }

    if (value <= 16) {
      return 'moderate'
    }

    if (value <= 25) {
      return 'strong'
    }

    return 'veryStrong'
  }


  const normalized =
    String(value)
      .trim()
      .toLowerCase()


  const map = {
    light: 'light',
    moderate: 'moderate',
    medium: 'moderate',
    strong: 'strong',
    verystrong: 'veryStrong',
    'very-strong':
      'veryStrong',

    any: 'any',

    '10도 이하':
      'light',

    '11~16도':
      'moderate',

    '11~16도':
      'moderate',

    '17~25도':
      'strong',

    '17~25도':
      'strong',

    '26도 이상':
      'veryStrong',

    '도수는 크게 상관없어요':
      'any',
  }


  return (
    map[normalized] ??
    null
  )
}


// ========================================
// Firestore 취향 데이터 정규화
//
// 신/구 필드 모두 대응
//
// acidity ↔ sourness
// bodyWeight ↔ body
// scentIntensity ↔ aroma
// alcoholRange ↔ abv
// ========================================

const normalizePreference = (
  rawPreference
) => {
  if (
    !rawPreference ||
    typeof rawPreference !==
      'object'
  ) {
    return null
  }


  const sweetness =
    normalizeSweetness(
      rawPreference.sweetness
    )


  const acidity =
    normalizeAcidity(
      rawPreference.acidity ??
        rawPreference.sourness
    )


  const bodyWeight =
    normalizeBodyWeight(
      rawPreference.bodyWeight ??
        rawPreference.body
    )


  const scentIntensity =
    normalizeScentIntensity(
      rawPreference.scentIntensity ??
        rawPreference.aroma
    )


  const alcoholRange =
    normalizeAlcoholRange(
      rawPreference.alcoholRange ??
        rawPreference.abv ??
        rawPreference.alcoholByVolume
    )


  const safety =
    rawPreference.safety &&
    typeof rawPreference.safety ===
      'object'
      ? rawPreference.safety
      : {
          noAllergy:
            rawPreference.noAllergy ??
            false,

          avoidIngredients:
            rawPreference
              .avoidIngredients ??
            [],

          plantIngredients:
            rawPreference
              .plantIngredients ??
            [],

          customIngredient:
            rawPreference
              .customIngredient ??
            '',
        }


  return {
    ...rawPreference,

    sweetness,
    acidity,
    bodyWeight,
    scentIntensity,
    alcoholRange,
    safety,
  }
}


// ========================================
// 날짜 표시
// ========================================

const formatDate = (
  timestamp
) => {
  if (!timestamp) {
    return ''
  }


  const date =
    timestamp.toDate
      ? timestamp.toDate()
      : new Date(timestamp)


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return ''
  }


  const year =
    date.getFullYear()

  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      '0'
    )

  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      '0'
    )


  return `${year}.${month}.${day}`
}


// ========================================
// 취향 설명
// ========================================

const buildPreferenceDescription = (
  preference
) => {
  const parts = []


  switch (
    preference
      ?.sweetness
  ) {
    case 'dry':
      parts.push(
        '단맛이 적고 깔끔한'
      )
      break

    case 'mild':
      parts.push(
        '은은한 단맛이 있는'
      )
      break

    case 'sweet':
      parts.push(
        '달콤한 맛이 또렷한'
      )
      break

    default:
      break
  }


  switch (
    preference
      ?.bodyWeight
  ) {
    case 'light':
      parts.push(
        '가볍게 넘어가는'
      )
      break

    case 'medium':
      parts.push(
        '적당한 무게감의'
      )
      break

    case 'full':
      parts.push(
        '진하고 묵직한'
      )
      break

    default:
      break
  }


  switch (
    preference
      ?.scentIntensity
  ) {
    case 'mild':
      parts.push(
        '향이 은은한'
      )
      break

    case 'medium':
      parts.push(
        '향이 자연스럽게 느껴지는'
      )
      break

    case 'strong':
      parts.push(
        '개성 있는 향이 또렷한'
      )
      break

    default:
      break
  }


  if (
    parts.length === 0
  ) {
    return '아직 뚜렷하게 정해진 취향보다는 다양한 전통주를 경험해보는 것이 잘 맞아요.'
  }


  return `${parts
    .slice(0, 3)
    .join(', ')} 전통주를 편하게 즐기는 취향이에요.`
}


// ========================================
// 분석 요약 제목
// ========================================

const buildSummaryTitle = (
  preference
) => {
  if (
    preference
      ?.sweetness ===
    'sweet'
  ) {
    return '기분 좋게 달콤한 전통주가 잘 어울려요.'
  }


  if (
    preference
      ?.acidity ===
    'high'
  ) {
    return '산뜻한 산미가 살아 있는 전통주가 잘 어울려요.'
  }


  if (
    preference
      ?.bodyWeight ===
      'full' ||
    preference
      ?.alcoholRange ===
      'strong' ||
    preference
      ?.alcoholRange ===
      'veryStrong'
  ) {
    return '풍미를 천천히 음미할 수 있는 진한 한 잔이 잘 어울려요.'
  }


  if (
    preference
      ?.bodyWeight ===
      'light' &&
    (
      preference
        ?.alcoholRange ===
        'light' ||
      preference
        ?.alcoholRange ===
        'moderate'
    )
  ) {
    return '가볍고 부담 없이 즐기는 한 잔이 잘 어울려요.'
  }


  return '균형 잡힌 편안한 한 잔이 잘 어울려요.'
}


// ========================================
// 잘 맞는 전통주 스타일
// ========================================

const buildLiquorStyles = (
  preference
) => {
  const result = []


  if (
    preference
      ?.sweetness ===
      'mild' ||
    preference
      ?.sweetness ===
      'sweet'
  ) {
    result.push({
      id: 'sweet-takju',
      title:
        '부드러운 막걸리',
      description:
        '부드러운 질감과 기분 좋은 단맛을 편안하게 즐기기 좋아요.',
      tag: '탁주',
    })
  }


  if (
    preference
      ?.acidity ===
      'medium' ||
    preference
      ?.acidity ===
      'high'
  ) {
    result.push({
      id: 'fruit',
      title:
        '산뜻한 과실주',
      description:
        '상큼한 산미와 과실 향을 부담 없이 즐기기 좋아요.',
      tag: '과실주',
    })
  }


  if (
    preference
      ?.bodyWeight ===
      'light' ||
    preference
      ?.alcoholRange ===
      'light'
  ) {
    result.push({
      id: 'light-yakju',
      title:
        '깔끔한 약주',
      description:
        '깔끔한 맛과 부담 없는 무게감으로 편하게 마시기 좋아요.',
      tag: '약주',
    })
  }


  if (
    preference
      ?.bodyWeight ===
    'full'
  ) {
    result.push({
      id: 'rich-yakju',
      title:
        '풍미가 깊은 약주',
      description:
        '입안에 남는 풍미와 묵직한 여운을 천천히 즐기기 좋아요.',
      tag: '약주',
    })
  }


  if (
    preference
      ?.alcoholRange ===
      'strong' ||
    preference
      ?.alcoholRange ===
      'veryStrong'
  ) {
    result.push({
      id: 'distilled',
      title:
        '진한 증류주',
      description:
        '도수가 높고 풍미가 분명한 술을 천천히 음미하기 좋아요.',
      tag: '증류주',
    })
  }


  if (
    preference
      ?.scentIntensity ===
    'strong'
  ) {
    result.push({
      id: 'aromatic',
      title:
        '향이 또렷한 전통주',
      description:
        '과실·꽃·곡물처럼 개성 있는 향이 분명하게 느껴지는 술이에요.',
      tag: '향 중심',
    })
  }


  const defaults = [
    {
      id: 'balanced-takju',
      title:
        '균형 잡힌 막걸리',
      description:
        '부드러운 맛과 적당한 무게감으로 부담 없이 시작하기 좋아요.',
      tag: '탁주',
    },

    {
      id: 'balanced-yakju',
      title:
        '깔끔한 약주',
      description:
        '맛과 향의 균형이 좋아 천천히 취향을 알아가기 좋아요.',
      tag: '약주',
    },

    {
      id: 'beginner-fruit',
      title:
        '가벼운 과실주',
      description:
        '친숙한 과일 향과 산뜻한 맛으로 편하게 즐기기 좋아요.',
      tag: '과실주',
    },
  ]


  return [
    ...result,
    ...defaults,
  ]
    .filter(
      (
        item,
        index,
        array
      ) =>
        array.findIndex(
          (target) =>
            target.id ===
            item.id
        ) === index
    )
    .slice(
      0,
      3
    )
}


// ========================================
// AiPreference
// ========================================

const AiPreference = () => {
  const navigate =
    useNavigate()


  const [
    currentUser,
    setCurrentUser,
  ] = useState(undefined)

  const [
    preference,
    setPreference,
  ] = useState(null)

  const [
    analyzedAt,
    setAnalyzedAt,
  ] = useState('')

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    errorMessage,
    setErrorMessage,
  ] = useState('')

  const [
    memberName,
    setMemberName,
  ] = useState('회원')


  // ========================================
  // Firestore 취향 조회
  // ========================================

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,

        async (
          currentUser
        ) => {
          if (
            !currentUser ||
            currentUser
              .isAnonymous
          ) {
            setCurrentUser(
              null
            )

            setPreference(
              null
            )

            setAnalyzedAt(
              ''
            )

            setMemberName(
              '회원'
            )

            setLoading(
              false
            )

            return
          }


          setCurrentUser(
            currentUser
          )


          try {
            setLoading(
              true
            )

            setErrorMessage(
              ''
            )


            const userRef =
              doc(
                db,
                'users',
                currentUser.uid
              )


            const userSnap =
              await getDoc(
                userRef
              )


            if (
              !userSnap.exists()
            ) {
              setPreference(
                null
              )

              setMemberName(
                currentUser
                  .displayName ||
                currentUser
                  .email
                  ?.split(
                    '@'
                  )[0] ||
                '회원'
              )

              return
            }


            const userData =
              userSnap.data()


            setMemberName(
              userData
                ?.nickname ||
              currentUser
                .displayName ||
              currentUser
                .email
                ?.split(
                  '@'
                )[0] ||
              '회원'
            )


            const rawPreference =
              userData
                ?.userPreference ||
              null


            const normalizedPreference =
              normalizePreference(
                rawPreference
              )


            setPreference(
              normalizedPreference
            )


            setAnalyzedAt(
              formatDate(
                userData.updatedAt ||
                userData.createdAt
              )
            )
          } catch (error) {
            console.error(
              '취향 정보 불러오기 실패:',
              error
            )


            setErrorMessage(
              '취향 정보를 불러오지 못했습니다.'
            )


            setPreference(
              null
            )
          } finally {
            setLoading(
              false
            )
          }
        }
      )


    return () => {
      unsubscribe()
    }
  }, [])


  // ========================================
  // 취향 등록 여부
  // ========================================

  const isRegistered =
    useMemo(() => {
      if (!preference) {
        return false
      }


      return [
        preference
          .sweetness,

        preference
          .acidity,

        preference
          .bodyWeight,

        preference
          .scentIntensity,

        preference
          .alcoholRange,
      ].every(
        (value) =>
          value !== null &&
          value !== undefined &&
          value !== ''
      )
    }, [
      preference,
    ])


  // ========================================
  // 지표
  // ========================================

  const tasteRows =
    useMemo(() => {
      if (
        !isRegistered
      ) {
        return []
      }


      return Object.entries(
        PREFERENCE_INFO
      ).map(
        (
          [
            key,
            axis,
          ]
        ) => {
          const value =
            preference[key]


          const option =
            axis.options[
              value
            ]


          return {
            key,

            title:
              axis.title,

            left:
              axis.left,

            right:
              axis.right,

            answer:
              option?.label ||
              '정보 없음',

            position:
              option
                ?.position ??
              50,
          }
        }
      )
    }, [
      preference,
      isRegistered,
    ])


  // ========================================
  // 키워드
  // ========================================

  const keywordList =
    useMemo(() => {
      if (
        !isRegistered
      ) {
        return []
      }


      return Object.entries(
        PREFERENCE_INFO
      )
        .map(
          (
            [
              key,
              info,
            ]
          ) =>
            info.options[
              preference[key]
            ]?.keyword
        )
        .filter(
          Boolean
        )
    }, [
      preference,
      isRegistered,
    ])


  // ========================================
  // 안전정보
  // ========================================

  const safety =
    preference
      ?.safety ||
    {
      noAllergy: true,
      avoidIngredients: [],
      plantIngredients: [],
      customIngredient: '',
    }


  const avoidIngredientList =
    useMemo(() => {
      if (
        !preference
      ) {
        return []
      }


      if (
        safety.noAllergy
      ) {
        return []
      }


      const baseItems =
        Array.isArray(
          safety
            .avoidIngredients
        )
          ? safety
              .avoidIngredients
          : []


      const plantItems =
        Array.isArray(
          safety
            .plantIngredients
        )
          ? safety
              .plantIngredients
          : []


      const result = [
        ...baseItems,
        ...plantItems,
      ]
        .filter(
          (value) =>
            value !==
              'plant' &&
            value !==
              'fruitPlant' &&
            value !==
              'custom' &&
            value !==
              'other'
        )
        .map(
          (value) =>
            INGREDIENT_LABELS[
              value
            ] ||
            value
        )


      if (
        safety
          .customIngredient
          ?.trim()
      ) {
        result.push(
          safety
            .customIngredient
            .trim()
        )
      }


      return [
        ...new Set(
          result
        ),
      ]
    }, [
      preference,
      safety,
    ])


  // ========================================
  // 추천 스타일
  // ========================================

  const liquorStyles =
    useMemo(() => {
      if (
        !isRegistered
      ) {
        return []
      }


      return buildLiquorStyles(
        preference
      )
    }, [
      preference,
      isRegistered,
    ])


  const preferenceDescription =
    useMemo(
      () =>
        buildPreferenceDescription(
          preference
        ),
      [
        preference,
      ]
    )


  const summaryTitle =
    useMemo(
      () =>
        buildSummaryTitle(
          preference
        ),
      [
        preference,
      ]
    )


  // ========================================
  // 공통 헤더
  // ========================================

  const renderHeader = () => (
    <MyPageHeader
      title="내 취향 분석"
    />
  )


  // ========================================
  // 로딩
  // ========================================

  if (loading) {
    return (
      <div
        className={
          styles.page
        }
      >
        <div
          className={
            styles.contentCard
          }
        >
          {renderHeader()}

          <div
            className={
              styles.stateBox
            }
            role="status"
          >
            <span
              className={
                styles.loadingSpinner
              }
              aria-hidden="true"
            />

            <strong>
              취향 정보를 불러오는 중입니다.
            </strong>
          </div>
        </div>
      </div>
    )
  }


  // ========================================
  // 로그인 필요 (비회원)
  // ========================================

  if (!currentUser) {
    return (
      <div
        className={
          styles.page
        }
      >
        <div
          className={
            styles.contentCard
          }
        >
          {renderHeader()}

          <div
            className={
              styles.loginRequired
            }
          >
            <p>
              로그인 후 내 취향 분석을 확인할 수 있어요.
            </p>
          </div>
        </div>
      </div>
    )
  }


  // ========================================
  // 오류
  // ========================================

  if (errorMessage) {
    return (
      <div
        className={
          styles.page
        }
      >
        <div
          className={
            styles.contentCard
          }
        >
          {renderHeader()}

          <section
            className={
              styles.emptyState
            }
          >
            <div
              className={
                styles.emptyContent
              }
            >
              <h2>
                {errorMessage}
              </h2>

              <button
                type="button"
                className={
                  styles.primaryButton
                }
                onClick={() =>
                  window
                    .location
                    .reload()
                }
              >
                다시 불러오기
              </button>
            </div>
          </section>
        </div>
      </div>
    )
  }


  // ========================================
  // 미등록
  // ========================================

  if (!isRegistered) {
    return (
      <div
        className={
          styles.page
        }
      >
        <div
          className={
            styles.contentCard
          }
        >
          {renderHeader()}


          <section
            className={
              styles.emptyState
            }
          >
            <div
              className={
                styles.emptyCharacter
              }
            >
              <img
                src={
                  makdongImage
                }
                alt="막동이"
              />
            </div>


            <div
              className={
                styles.emptyContent
              }
            >
              <span
                className={
                  styles.emptyEyebrow
                }
              >
                아직 취향 정보가 없어요
              </span>


              <h2>
                막동이에게 나으리의 취향을
                <br />
                알려주세요!
              </h2>


              <p>
                단맛, 산미, 무게감, 향, 도수까지
                <br />
                몇 가지 질문에 답해주시면
                <br />
                나으리의 전통주 취향을 분석해드릴게요.
              </p>


              <div
                className={
                  styles.emptyTags
                }
              >
                <span>
                  단맛
                </span>

                <span>
                  산미
                </span>

                <span>
                  무게감
                </span>

                <span>
                  향
                </span>

                <span>
                  도수
                </span>
              </div>


              <button
                type="button"
                className={
                  styles.primaryButton
                }
                onClick={() =>
                  navigate(
                    '/preference'
                  )
                }
              >
                내 취향 알려주기
              </button>
            </div>
          </section>
        </div>
      </div>
    )
  }


  // ========================================
  // 등록 완료
  // ========================================

  return (
    <div
      className={
        styles.page
      }
    >
      <div
        className={
          styles.contentCard
        }
      >

        {/* 상단 */}

        <MyPageHeader
          title="내 취향 분석"
        >
          <div
            className={
              styles.analysisDate
            }
          >
            <span>
              최근 분석일
            </span>

            <strong>
              {analyzedAt ||
                '-'}
            </strong>
          </div>
        </MyPageHeader>


        {/* 대표 취향 */}

        <section
          className={
            styles.hero
          }
        >
          <div
            className={
              styles.heroCharacter
            }
          >
            <img
              src={
                makdongImage
              }
              alt="막동이"
            />
          </div>


          <div
            className={
              styles.heroContent
            }
          >
            <span
              className={
                styles.heroLabel
              }
            >
              막동이의 취향 한마디
            </span>


            <h2>
              {memberName} 나으리님은 이런 전통주를{' '}
              <br />
              좋아하는 것 같아요!
            </h2>


            <p>
              {
                preferenceDescription
              }
            </p>


            <div
              className={
                styles.heroTags
              }
            >
              {keywordList.map(
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
          </div>
        </section>


        {/* 취향 지표 */}

        <section
          className={
            styles.section
          }
        >
          <div
            className={
              styles.sectionTitle
            }
          >
            <h2>
              취향 지표
            </h2>
          </div>


          <div
            className={
              styles.axisCard
            }
          >
            {tasteRows.map(
              (
                row
              ) => (
                <div
                  key={
                    row.key
                  }
                  className={
                    styles.axisRow
                  }
                >
                  <div
                    className={
                      styles.axisName
                    }
                  >
                    <strong>
                      {
                        row.title
                      }
                    </strong>
                  </div>


                  <div
                    className={
                      styles.axisContent
                    }
                  >
                    <div
                      className={
                        styles.scaleLabels
                      }
                    >
                      <span>
                        {
                          row.left
                        }
                      </span>

                      <span>
                        {
                          row.right
                        }
                      </span>
                    </div>


                    <div
                      className={
                        styles.scale
                      }
                    >
                      <span
                        className={
                          styles.scaleTrack
                        }
                      />

                      <span
                        className={
                          styles.scaleActive
                        }
                        style={{
                          width:
                            `${row.position}%`,
                        }}
                      />

                      <span
                        className={
                          styles.scalePoint
                        }
                        style={{
                          left:
                            `${row.position}%`,
                        }}
                      />
                    </div>
                  </div>


                  <div
                    className={
                      styles.axisResult
                    }
                  >
                    {
                      row.answer
                    }
                  </div>
                </div>
              )
            )}
          </div>
        </section>


        {/* 잘 맞는 스타일 */}

        <section
          className={
            styles.section
          }
        >
          <div
            className={
              styles.sectionTitle
            }
          >
            <h2>
              잘 맞는 전통주 스타일
            </h2>

          </div>


          <div
            className={
              styles.liquorGrid
            }
          >
            {liquorStyles.map(
              (
                item,
                index
              ) => (
                <article
                  key={
                    item.id
                  }
                  className={
                    styles.liquorCard
                  }
                >
                  <div
                    className={
                      styles.liquorNumber
                    }
                  >
                    0
                    {
                      index +
                      1
                    }
                  </div>


                  <div
                    className={
                      styles.liquorContent
                    }
                  >
                    <span>
                      {
                        item.tag
                      }
                    </span>

                    <h3>
                      {
                        item.title
                      }
                    </h3>

                    <p>
                      {
                        item.description
                      }
                    </p>
                  </div>
                </article>
              )
            )}
          </div>
        </section>


        {/* 키워드 / 안전정보 */}

        <div
          className={
            styles.bottomGrid
          }
        >
          <section
            className={
              styles.infoCard
            }
          >
            <div
              className={
                styles.infoTitle
              }
            >
              <h2>
                나의 취향 키워드
              </h2>
            </div>


            <div
              className={
                styles.keywordCloud
              }
            >
              {keywordList.map(
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


            <p
              className={
                styles.keywordDescription
              }
            >
              {
                preferenceDescription
              }
            </p>
          </section>


          <section
            className={
              styles.infoCard
            }
          >
            <div
              className={
                styles.infoTitle
              }
            >
              <h2>
                안전 확인
              </h2>

              <span>
                알레르기 · 회피 재료
              </span>
            </div>


            {safety.noAllergy ||
            avoidIngredientList.length ===
              0 ? (
              <div
                className={
                  styles.safeState
                }
              >
                <span
                  className={
                    styles.safeIcon
                  }
                >
                  ✓
                </span>


                <div>
                  <strong>
                    등록된 회피 재료가 없어요.
                  </strong>

                  <p>
                    현재 저장된 알레르기 및 회피 재료가 없습니다.
                  </p>
                </div>
              </div>
            ) : (
              <div
                className={
                  styles.avoidList
                }
              >
                {avoidIngredientList.map(
                  (
                    item
                  ) => (
                    <span
                      key={
                        item
                      }
                    >
                      {
                        item
                      }
                    </span>
                  )
                )}
              </div>
            )}
          </section>
        </div>


        {/* 분석 요약 */}

        <section
          className={
            styles.summaryCard
          }
        >
          <div
            className={
              styles.summaryIcon
            }
          >
            <span>
              ✦
            </span>
          </div>


          <div>
            <span
              className={
                styles.summaryLabel
              }
            >
              막동이의 취향 분석
            </span>


            <h2>
              {
                summaryTitle
              }
            </h2>


            <p>
              {
                preferenceDescription
              }
            </p>
          </div>
        </section>


        {/* 버튼 */}

        <div
          className={
            styles.actions
          }
        >
          <button
            type="button"
            className={
              styles.secondaryButton
            }
            onClick={() =>
              navigate(
                '/preference'
              )
            }
          >
            취향 다시 설정하기
          </button>


          <button
            type="button"
            className={
              styles.primaryButton
            }
            onClick={() =>
              navigate(
                '/ai'
              )
            }
          >
            AI 주안상 추천 받기

            <span>
              →
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}


export default AiPreference
