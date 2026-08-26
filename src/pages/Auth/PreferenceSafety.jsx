import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import styles from './PreferenceSafety.module.scss'


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


const PreferenceSafety = () => {
  const navigate = useNavigate()

  const [selectedItems, setSelectedItems] = useState([])
  const [selectedPlants, setSelectedPlants] = useState([])
  const [customInput, setCustomInput] = useState('')
  const [noAllergy, setNoAllergy] = useState(false)


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

  const handleSave = () => {
    const safetyAnswers = {
      noAllergy,
      avoidIngredients: selectedItems,
      plantIngredients: selectedPlants,
      customIngredient: customInput.trim(),
    }

    console.log('안전 확인 답변:', safetyAnswers)

    navigate('/preference/complete')
  }


  const canSave =
    noAllergy ||
    selectedItems.length > 0 ||
    selectedPlants.length > 0 ||
    customInput.trim().length > 0


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
          <span className={styles.noticeIcon}>i</span>

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
          >
            <span>‹</span>
            이전
          </button>


          <button
            type="button"
            className={styles.saveButton}
            onClick={handleSave}
            disabled={!canSave}
          >
            취향 저장하기
            <span>›</span>
          </button>

        </div>

      </div>

    </main>
  )
}


export default PreferenceSafety