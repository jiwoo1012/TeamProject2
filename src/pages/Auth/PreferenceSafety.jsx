import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore'

import { auth, db } from '../../firebase/firebase'

import styles from './PreferenceSafety.module.scss'


// ========================================
// 알레르기 / 기피 재료
// ========================================

const ALLERGY_GROUPS = [
  {
    id: 'grain',
    label: '곡물',
    options: [
      { value: 'wheat', label: '밀' },
      { value: 'buckwheat', label: '메밀' },
      { value: 'soybean', label: '대두 (콩)' },
      { value: 'nuts', label: '견과류' },
      { value: 'sesame', label: '참깨' },
      { value: 'peanut', label: '땅콩' },
    ],
  },
  {
    id: 'dairyEgg',
    label: '유제품 · 난류',
    options: [
      { value: 'dairy', label: '우유 · 유제품' },
      { value: 'egg', label: '달걀' },
    ],
  },
  {
    id: 'seafood',
    label: '해산물',
    options: [
      { value: 'fish', label: '생선류' },
      {
        value: 'shellfish',
        label: '연체류 (오징어·굴 등이)',
      },
    ],
  },
  {
    id: 'other',
    label: '육류 · 기타',
    options: [
      { value: 'pork', label: '돼지고기' },
      {
        value: 'plant',
        label: '특정 과일 · 식물 원료',
        expandable: true,
      },
      { value: 'bee', label: '벌꿀' },
      {
        value: 'custom',
        label: '기타 / 직접 입력',
        expandable: true,
      },
    ],
  },
]


// ========================================
// 특정 과일 · 식물 원료
// ========================================

const PLANT_OPTIONS = [
  { value: 'apple', label: '사과' },
  { value: 'plum', label: '매실' },
  { value: 'mulberry', label: '오디' },
  { value: 'grape', label: '머루' },
  { value: 'citrus', label: '감귤' },
  { value: 'cornelianCherry', label: '산수유' },
  { value: 'ginseng', label: '인삼' },
  { value: 'chrysanthemum', label: '국화' },
  { value: 'etcPlant', label: '기타' },
  { value: 'pineNeedle', label: '솔잎' },
]


// ========================================
// 취향 설문 → 상품 JSON 수치 변환
// ========================================

const SWEETNESS_MAP = {
  dry: 1,
  mild: 3,
  sweet: 5,
  unknown: null,
}

const ACIDITY_MAP = {
  low: 1,
  medium: 3,
  high: 5,
  any: null,
}

const BODY_MAP = {
  light: 1,
  medium: 3,
  full: 5,
  unknown: null,
}

const SCENT_MAP = {
  mild: 1,
  medium: 3,
  strong: 5,
  any: null,
}

const ABV_MAP = {
  light: {
    min: 0,
    max: 10,
  },

  moderate: {
    min: 11,
    max: 16,
  },

  strong: {
    min: 17,
    max: 25,
  },

  veryStrong: {
    min: 26,
    max: null,
  },

  any: null,
}


const PreferenceSafety = () => {
  const navigate = useNavigate()

  const [selectedItems, setSelectedItems] = useState([])
  const [selectedPlants, setSelectedPlants] = useState([])
  const [customInput, setCustomInput] = useState('')
  const [noAllergy, setNoAllergy] = useState(false)
  const [isSaving, setIsSaving] = useState(false)


  const isPlantOpen = selectedItems.includes('plant')
  const isCustomOpen = selectedItems.includes('custom')


  // ========================================
  // 기본 알레르기 / 기피 재료 선택
  // ========================================

  const handleSelectItem = (value) => {
    setNoAllergy(false)

    setSelectedItems((prev) => {
      const isSelected = prev.includes(value)

      if (isSelected) {
        // 특정 과일 · 식물 원료 닫을 때 세부 선택 초기화
        if (value === 'plant') {
          setSelectedPlants([])
        }

        // 기타 / 직접 입력 닫을 때 입력값 초기화
        if (value === 'custom') {
          setCustomInput('')
        }

        return prev.filter((item) => item !== value)
      }

      return [...prev, value]
    })
  }


  // ========================================
  // 특정 과일 · 식물 원료 세부 선택
  // ========================================

  const handleSelectPlant = (value) => {
    setSelectedPlants((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value)
      }

      return [...prev, value]
    })
  }


  // ========================================
  // 해당 사항 없음
  // ========================================

  const handleNoAllergy = () => {
    if (noAllergy) {
      setNoAllergy(false)
      return
    }

    setNoAllergy(true)

    // 다른 답변 모두 초기화
    setSelectedItems([])
    setSelectedPlants([])
    setCustomInput('')
  }


  // ========================================
  // 이전
  // ========================================

  const handlePrev = () => {
    navigate('/preference/safety-intro')
  }


  // ========================================
  // 취향 저장
  // ========================================

  const handleSave = async () => {
    if (isSaving) return

    setIsSaving(true)

    try {
      // ========================================
      // 현재 로그인 사용자
      // ========================================

      const user = auth.currentUser

      if (!user) {
        setIsSaving(false)

        alert('로그인 정보를 확인할 수 없습니다.')

        navigate('/login')
        return
      }


      // ========================================
      // 앞의 5문항 답변 가져오기
      // ========================================

      const savedAnswers =
        sessionStorage.getItem('preferenceAnswers')

      if (!savedAnswers) {
        setIsSaving(false)

        alert('취향 설문 정보를 찾을 수 없습니다.')

        navigate('/preference/questions')
        return
      }


      const preferenceAnswers =
        JSON.parse(savedAnswers)


      // ========================================
      // 각 질문의 실제 선택값
      // ========================================

      const sweetnessValue =
        preferenceAnswers.sweetness?.[0]

      const acidityValue =
        preferenceAnswers.sourness?.[0]

      const bodyValue =
        preferenceAnswers.body?.[0]

      const scentValue =
        preferenceAnswers.aroma?.[0]

      const abvValue =
        preferenceAnswers.abv?.[0]


      // ========================================
      // plant / custom은 UI용 선택값이므로
      // 기본 기피 재료 배열에서는 제외
      // ========================================

      const avoidIngredients =
        selectedItems.filter(
          (item) =>
            item !== 'plant' &&
            item !== 'custom'
        )


      // ========================================
      // 최종 Firestore 저장 데이터
      // ========================================

      const userPreference = {
        sweetness:
          SWEETNESS_MAP[sweetnessValue] ?? null,

        acidity:
          ACIDITY_MAP[acidityValue] ?? null,

        bodyWeight:
          BODY_MAP[bodyValue] ?? null,

        scentIntensity:
          SCENT_MAP[scentValue] ?? null,

        alcoholRange:
          ABV_MAP[abvValue] ?? null,

        safety: {
          noAllergy,

          avoidIngredients:
            noAllergy
              ? []
              : avoidIngredients,

          plantIngredients:
            noAllergy
              ? []
              : selectedPlants,

          customIngredient:
            noAllergy
              ? ''
              : customInput.trim(),
        },
      }


      console.log(
        'Firestore 저장 데이터:',
        userPreference
      )


      // ========================================
      // users/{uid}
      // ========================================

      const userRef = doc(
        db,
        'users',
        user.uid
      )


      // ========================================
      // Firestore 저장
      // ========================================

      await updateDoc(userRef, {
        userPreference,
        updatedAt: serverTimestamp(),
      })


      // ========================================
      // 임시 설문 데이터 삭제
      // ========================================

      sessionStorage.removeItem(
        'preferenceAnswers'
      )


      // ========================================
      // 완료 페이지
      // ========================================

      navigate('/preference/complete')
    } catch (error) {
      console.error(
        '취향 정보 저장 실패:',
        error
      )

      alert(
        '취향 정보를 저장하지 못했습니다. 다시 시도해주세요.'
      )

      setIsSaving(false)
    }
  }


  // ========================================
  // 저장 가능 여부
  // ========================================

  const hasRegularIngredient =
    selectedItems.some(
      (item) =>
        item !== 'plant' &&
        item !== 'custom'
    )

  const hasPlantAnswer =
    isPlantOpen &&
    selectedPlants.length > 0

  const hasCustomAnswer =
    isCustomOpen &&
    customInput.trim().length > 0

  const plantSelectionValid =
    !isPlantOpen ||
    selectedPlants.length > 0

  const customSelectionValid =
    !isCustomOpen ||
    customInput.trim().length > 0

  const hasAvoidIngredient =
    hasRegularIngredient ||
    hasPlantAnswer ||
    hasCustomAnswer

  const canSave =
    noAllergy ||
    (
      hasAvoidIngredient &&
      plantSelectionValid &&
      customSelectionValid
    )


  return (
    <main className={styles.preferenceSafety}>

      <div className={styles.inner}>

        {/* ========================================
            페이지 제목
        ======================================== */}

        <section className={styles.headerArea}>

          <div className={styles.categoryBadge}>
            안전 확인
          </div>

          <h1 className={styles.title}>
            알레르기가 있거나 반드시 피해야 하는 재료가 있나요?
          </h1>

          <p className={styles.description}>
            안전한 추천을 위해 해당하는 재료를 알려주세요.
            전 항목 복수 선택이 가능합니다.
          </p>

        </section>


        {/* ========================================
            기본 재료 선택
        ======================================== */}

        <section className={styles.allergyBox}>

          <div className={styles.boxHeader}>

            <div className={styles.boxTitleArea}>
              <h2 className={styles.boxTitle}>
                알레르기 · 기피 재료
              </h2>

              <span className={styles.multipleBadge}>
                복수 선택
              </span>
            </div>


            <button
              type="button"
              className={`
                ${styles.noneButton}
                ${noAllergy ? styles.noneSelected : ''}
              `}
              onClick={handleNoAllergy}
            >
              해당 사항 없어요
            </button>

          </div>


          <div className={styles.groups}>

            {ALLERGY_GROUPS.map((group) => (
              <div
                key={group.id}
                className={styles.groupRow}
              >

                <strong className={styles.groupLabel}>
                  {group.label}
                </strong>


                <div className={styles.optionList}>

                  {group.options.map((option) => {
                    const isSelected =
                      selectedItems.includes(option.value)

                    return (
                      <button
                        key={option.value}
                        type="button"
                        className={`
                          ${styles.optionButton}
                          ${isSelected ? styles.selected : ''}
                          ${
                            option.expandable
                              ? styles.expandableButton
                              : ''
                          }
                        `}
                        onClick={() =>
                          handleSelectItem(option.value)
                        }
                      >
                        {option.label}

                        {option.expandable && (
                          <span className={styles.expandIcon}>
                            ?
                          </span>
                        )}
                      </button>
                    )
                  })}

                </div>

              </div>
            ))}

          </div>

        </section>


        {/* ========================================
            특정 과일 · 식물 원료
        ======================================== */}

        {isPlantOpen && (
          <section className={styles.detailBox}>

            <div className={styles.detailInfo}>
              <h3 className={styles.detailTitle}>
                세부 원료 선택
              </h3>

              <p className={styles.detailDescription}>
                해당 과일·식물 원료가 포함된 제품을
                추천에서 제외해요.
              </p>
            </div>


            <div className={styles.plantOptions}>

              {PLANT_OPTIONS.map((option) => {
                const isSelected =
                  selectedPlants.includes(option.value)

                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`
                      ${styles.plantButton}
                      ${isSelected ? styles.plantSelected : ''}
                    `}
                    onClick={() =>
                      handleSelectPlant(option.value)
                    }
                  >
                    {option.label}
                  </button>
                )
              })}

            </div>

          </section>
        )}


        {/* ========================================
            기타 / 직접 입력
        ======================================== */}

        {isCustomOpen && (
          <section className={styles.customBox}>

            <label
              htmlFor="customIngredient"
              className={styles.customLabel}
            >
              기타 / 직접 입력
            </label>

            <input
              id="customIngredient"
              type="text"
              value={customInput}
              className={styles.customInput}
              placeholder="예: 복숭아, 보리, 꿀"
              onChange={(e) =>
                setCustomInput(e.target.value)
              }
            />

          </section>
        )}


        {/* ========================================
            안내 문구
        ======================================== */}

        <div className={styles.notice}>
          <span className={styles.noticeIcon}>
            i
          </span>

          입력한 정보는 더 안전한 추천을 위한
          필터링에만 사용됩니다.
        </div>


        {/* ========================================
            이전 / 저장
        ======================================== */}

        <div className={styles.buttonArea}>

          <button
            type="button"
            className={styles.prevButton}
            onClick={handlePrev}
            disabled={isSaving}
          >
            <span>‹</span>
            이전
          </button>


          <button
            type="button"
            className={styles.saveButton}
            onClick={handleSave}
            disabled={!canSave || isSaving}
          >
            {isSaving
              ? '저장 중...'
              : '취향 저장하기'
            }

            {!isSaving && (
              <span>›</span>
            )}
          </button>

        </div>

      </div>

    </main>
  )
}

export default PreferenceSafety