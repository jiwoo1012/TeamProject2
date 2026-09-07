import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

import makdongImage from '../../assets/characters/M007_Poses03.png'

import styles from './AiPreference.module.scss'


// ------------------------------------------------------
// 임시 취향 데이터
// 추후 Firestore users/{uid}에 저장된 취향 데이터로 교체
// ------------------------------------------------------
const MOCK_PREFERENCE = {
  registered: true,

  sweetness: '은은한 단맛이 좋아요',
  acidity: '은은하게 상큼한 정도가 좋아요',
  bodyWeight: '가볍고 깔끔한 술이 좋아요',
  scentIntensity: '은은한 향이 좋아요',
  alcoholByVolume: '10도 이하',

  avoidIngredients: ['해당 사항 없음'],

  analyzedAt: '2026.09.07',
}


// ------------------------------------------------------
// 각 취향 답변이 지표에서 어느 위치에 들어갈지 설정
// ------------------------------------------------------
const TASTE_AXIS = {
  sweetness: {
    title: '단맛 선호',
    left: '거의 달지 않음',
    right: '달콤함',
    options: {
      '거의 달지 않은 게 좋아요': 12,
      '은은한 단맛이 좋아요': 48,
      '달콤한 술이 좋아요': 88,
      '아직 잘 모르겠어요': 50,
    },
  },

  acidity: {
    title: '산미 선호',
    left: '산미 거의 없음',
    right: '확실한 산미',
    options: {
      '산미가 거의 없는 게 좋아요': 10,
      '은은하게 상큼한 정도가 좋아요': 48,
      '새콤함이 확실한 게 좋아요': 88,
      '크게 상관없어요': 50,
    },
  },

  bodyWeight: {
    title: '무게감',
    left: '가볍고 깔끔',
    right: '진하고 묵직',
    options: {
      '가볍고 깔끔한 술이 좋아요': 16,
      '적당한 무게감이 좋아요': 52,
      '진하고 묵직한 술이 좋아요': 88,
      '아직 잘 모르겠어요': 50,
    },
  },

  scentIntensity: {
    title: '향의 강도',
    left: '은은한 향',
    right: '확실한 향',
    options: {
      '은은한 향이 좋아요': 18,
      '적당히 느껴지는 향이 좋아요': 52,
      '향이 확실한 게 좋아요': 87,
      '향은 크게 상관없어요': 50,
    },
  },

  alcoholByVolume: {
    title: '도수',
    left: '저도수',
    right: '고도수',
    options: {
      '10도 이하': 12,
      '11~16도': 36,
      '17~25도': 65,
      '26도 이상': 90,
      '도수는 크게 상관없어요': 50,
    },
  },
}


const LIQUOR_STYLES = [
  {
    id: 1,
    title: '부드러운 막걸리',
    description: '은은한 단맛과 가벼운 질감을 편안하게 즐기기 좋아요.',
    tag: '탁주',
  },
  {
    id: 2,
    title: '가벼운 과실주',
    description: '산뜻한 향과 부담 없는 도수로 가볍게 즐기기 좋아요.',
    tag: '과실주',
  },
  {
    id: 3,
    title: '저도수 약주',
    description: '깔끔한 맛과 은은한 향을 중심으로 즐길 수 있어요.',
    tag: '약주',
  },
]


const AiPreference = () => {
  const navigate = useNavigate()

  // 나중에는 로그인 사용자 데이터로 교체
  const preference = MOCK_PREFERENCE


  const tasteRows = useMemo(() => {
    if (!preference?.registered) {
      return []
    }

    return Object.entries(TASTE_AXIS).map(([key, axis]) => {
      const answer = preference[key]

      return {
        key,
        ...axis,
        answer,
        position: axis.options[answer] ?? 50,
      }
    })
  }, [preference])


  const keywordList = useMemo(() => {
    if (!preference?.registered) {
      return []
    }

    return [
      '은은한 단맛',
      '은은한 산미',
      '가벼운 바디',
      '은은한 향',
      '저도수',
    ]
  }, [preference])


  // ------------------------------------------------------
  // 회원가입 때 취향 등록을 건너뛴 사용자
  // ------------------------------------------------------
  if (!preference?.registered) {
    return (
      <div className={styles.page}>
        <div className={styles.contentCard}>
          <header className={styles.pageHeader}>
            <div>
              <h1>내 취향 분석</h1>
              <p>막동이가 분석한 나의 전통주 취향이에요.</p>
            </div>
          </header>


          <section className={styles.emptyState}>
            <div className={styles.emptyCharacter}>
              <img
                src={makdongImage}
                alt="막동이"
              />
            </div>

            <div className={styles.emptyContent}>
              <span className={styles.emptyEyebrow}>
                아직 취향 정보가 없어요
              </span>

              <h2>
                막동이에게 나리의 취향을
                <br />
                알려주세요!
              </h2>

              <p>
                단맛, 산미, 무게감, 향, 도수까지
                <br />
                몇 가지 질문에 답해주시면
                나리의 전통주 취향을 분석해드릴게요.
              </p>

              <div className={styles.emptyTags}>
                <span>단맛</span>
                <span>산미</span>
                <span>무게감</span>
                <span>향</span>
                <span>도수</span>
              </div>

              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => navigate('/survey')}
              >
                내 취향 알려주기
              </button>
            </div>
          </section>
        </div>
      </div>
    )
  }


  // ------------------------------------------------------
  // 취향 등록 완료 사용자
  // ------------------------------------------------------
  return (
    <div className={styles.page}>
      <div className={styles.contentCard}>
        {/* 상단 */}
        <header className={styles.pageHeader}>
          <div>
            <h1>내 취향 분석</h1>
            <p>막동이가 분석한 나의 전통주 취향이에요.</p>
          </div>

          <div className={styles.analysisDate}>
            <span>최근 분석일</span>
            <strong>{preference.analyzedAt}</strong>
          </div>
        </header>


        {/* 대표 취향 설명 */}
        <section className={styles.hero}>
          <div className={styles.heroCharacter}>
            <img
              src={makdongImage}
              alt="막동이"
            />
          </div>

          <div className={styles.heroContent}>
            <span className={styles.heroLabel}>
              막동이의 취향 한마디
            </span>

            <h2>
              나리님은 이런 전통주를
              <br />
              좋아하는 것 같아요!
            </h2>

            <p>
              은은한 단맛과 산뜻한 느낌이 있으면서
              가볍고 부담 없이 즐길 수 있는 술이 잘 맞아요.
              향은 너무 강하기보다 은은하게 느껴지고,
              도수도 낮은 편을 선호하는 취향이에요.
            </p>

            <div className={styles.heroTags}>
              {keywordList.map((keyword) => (
                <span key={keyword}>
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        </section>


        {/* 취향 지표 */}
        <section className={styles.section}>
          <div className={styles.sectionTitle}>
            <h2>취향 지표</h2>
            <p>
              회원가입 시 선택한 답변을 기준으로 분석했어요.
            </p>
          </div>

          <div className={styles.axisCard}>
            {tasteRows.map((row) => (
              <div
                key={row.key}
                className={styles.axisRow}
              >
                <div className={styles.axisName}>
                  <strong>{row.title}</strong>
                </div>

                <div className={styles.axisContent}>
                  <div className={styles.scaleLabels}>
                    <span>{row.left}</span>
                    <span>{row.right}</span>
                  </div>

                  <div className={styles.scale}>
                    <span className={styles.scaleTrack} />

                    <span
                      className={styles.scaleActive}
                      style={{
                        width: `${row.position}%`,
                      }}
                    />

                    <span
                      className={styles.scalePoint}
                      style={{
                        left: `${row.position}%`,
                      }}
                    />
                  </div>
                </div>

                <div className={styles.axisResult}>
                  {row.answer}
                </div>
              </div>
            ))}
          </div>
        </section>


        {/* 잘 맞는 주종 */}
        <section className={styles.section}>
          <div className={styles.sectionTitle}>
            <h2>잘 맞는 전통주 스타일</h2>
            <p>
              현재 취향을 기준으로 잘 맞을 가능성이 높은 스타일이에요.
            </p>
          </div>

          <div className={styles.liquorGrid}>
            {LIQUOR_STYLES.map((item, index) => (
              <article
                key={item.id}
                className={styles.liquorCard}
              >
                <div className={styles.liquorNumber}>
                  0{index + 1}
                </div>

                <div className={styles.liquorContent}>
                  <span>{item.tag}</span>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>


        {/* 아래 정보 */}
        <div className={styles.bottomGrid}>
          {/* 키워드 */}
          <section className={styles.infoCard}>
            <div className={styles.infoTitle}>
              <h2>나의 취향 키워드</h2>
            </div>

            <div className={styles.keywordCloud}>
              {keywordList.map((keyword) => (
                <span key={keyword}>
                  {keyword}
                </span>
              ))}
            </div>

            <p className={styles.keywordDescription}>
              달거나 향이 강한 술보다는 부드럽고 깔끔하게
              넘어가는 전통주에 조금 더 잘 맞는 취향이에요.
            </p>
          </section>


          {/* 안전 확인 */}
          <section className={styles.infoCard}>
            <div className={styles.infoTitle}>
              <h2>안전 확인</h2>
              <span>알레르기 · 회피 재료</span>
            </div>

            {preference.avoidIngredients.includes(
              '해당 사항 없음'
            ) ? (
              <div className={styles.safeState}>
                <span className={styles.safeIcon}>
                  ✓
                </span>

                <div>
                  <strong>등록된 회피 재료가 없어요.</strong>
                  <p>
                    현재 저장된 알레르기 및 회피 재료가
                    없습니다.
                  </p>
                </div>
              </div>
            ) : (
              <div className={styles.avoidList}>
                {preference.avoidIngredients.map((item) => (
                  <span key={item}>
                    {item}
                  </span>
                ))}
              </div>
            )}
          </section>
        </div>


        {/* 분석 요약 */}
        <section className={styles.summaryCard}>
          <div className={styles.summaryIcon}>
            <span>✦</span>
          </div>

          <div>
            <span className={styles.summaryLabel}>
              막동이의 취향 분석
            </span>

            <h2>
              가볍고 산뜻하게 즐기는 한 잔이 잘 어울려요.
            </h2>

            <p>
              은은한 단맛과 향을 선호하고 무게감과 도수가
              낮은 편을 좋아해요. 막걸리나 가벼운 과실주,
              저도수 약주처럼 부담 없이 즐길 수 있는
              전통주부터 만나보세요.
            </p>
          </div>
        </section>


        {/* 버튼 */}
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={() => navigate('/preference')}
          >
            취향 다시 설정하기
          </button>

          <button
            type="button"
            className={styles.primaryButton}
            onClick={() => navigate('/ai')}
          >
            AI 주안상 추천 받기
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  )
}


export default AiPreference