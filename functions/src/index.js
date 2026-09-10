// functions/src/index.js

const {
  setGlobalOptions,
} = require('firebase-functions/v2')

const {
  onCall,
  HttpsError,
} = require('firebase-functions/v2/https')

const {
  defineSecret,
} = require('firebase-functions/params')

const logger =
  require('firebase-functions/logger')

const {
  initializeApp,
} = require('firebase-admin/app')

const {
  getFirestore,
  FieldValue,
} = require('firebase-admin/firestore')


// ========================================
// Firebase Admin 초기화
// ========================================

initializeApp()

const db = getFirestore()


// ========================================
// Functions 공통 설정
// ========================================

setGlobalOptions({
  maxInstances: 10,
})


// ========================================
// OpenAI Secret
// ========================================

const OPENAI_API_KEY =
  defineSecret(
    'OPENAI_API_KEY'
  )


// ========================================
// Mock 모드 확인
// ========================================

const USE_MOCK_AI =
  String(
    process.env.USE_MOCK_AI ||
      ''
  )
    .trim()
    .toLowerCase() === 'true'


// ========================================
// 함수 옵션
//
// callable 함수는 모든 Vercel Preview /
// Production origin에서 호출 가능
// ========================================

const recommendationOptions =
  USE_MOCK_AI
    ? {
        cors: true,
      }
    : {
        cors: true,

        secrets: [
          OPENAI_API_KEY,
        ],
      }


// ========================================
// 일반 객체인지 확인
// ========================================

const isPlainObject = (
  value
) => {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  )
}


// ========================================
// 추천 Function
// ========================================

// 기존 추천 기록에 저장 표시만 추가한다. 추천 내용은 클라이언트에서 받지 않는다.
exports.saveJajakRecommendation = onCall({ cors: true }, async (request) => {
  if (!request.auth || request.auth.token.firebase?.sign_in_provider === 'anonymous') {
    throw new HttpsError('unauthenticated', '로그인 후 추천 결과를 저장할 수 있습니다.')
  }
  const { recommendationId, isSaved = true } = request.data || {}
  if (typeof isSaved !== 'boolean') {
    throw new HttpsError('invalid-argument', '저장 상태가 올바르지 않습니다.')
  }
  if (typeof recommendationId !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(recommendationId)) {
    throw new HttpsError('invalid-argument', '올바른 추천 기록이 필요합니다.')
  }
  const userRef = db.collection('users').doc(request.auth.uid)
  const recommendationRef = userRef.collection('recommendations').doc(recommendationId)
  await db.runTransaction(async (transaction) => {
    const user = await transaction.get(userRef)
    if (!user.exists || user.data().status !== 'active') {
      throw new HttpsError('permission-denied', '추천 결과를 저장할 수 없는 회원 상태입니다.')
    }
    const snapshot = await transaction.get(recommendationRef)
    if (!snapshot.exists) {
      throw new HttpsError('not-found', '추천 기록을 찾을 수 없습니다.')
    }
    if (snapshot.data().isSaved !== isSaved) {
      transaction.update(recommendationRef, { isSaved })
    }
  })
  return { recommendationId, isSaved }
})

exports.recommendJajak =
  onCall(
    recommendationOptions,

    async (request) => {
      let aiLogRef = null
      try {
        // ========================================
        // 1. 요청 데이터
        // ========================================

        const data =
          request.data || {}


        const {
          surveyType,

          todaySurvey,

          // Mock 회원 추천에서만 사용
          userPreference:
            clientUserPreference,

          liquors,

          foods,

          glasses,

          pairings,
        } = data


        // ========================================
        // 2. 사용자 유형 검증
        // ========================================

        if (
          surveyType !== 'member' &&
          surveyType !== 'guest'
        ) {
          throw new HttpsError(
            'invalid-argument',
            '올바르지 않은 사용자 유형입니다.'
          )
        }


        // ========================================
        // 3. 오늘 설문 검증
        // ========================================

        if (
          !isPlainObject(
            todaySurvey
          )
        ) {
          throw new HttpsError(
            'invalid-argument',
            '오늘의 설문 답변이 없습니다.'
          )
        }


        // ========================================
        // 4. 상품 데이터 검증
        // ========================================

        if (
          !Array.isArray(
            liquors
          ) ||
          !Array.isArray(
            foods
          ) ||
          !Array.isArray(
            glasses
          ) ||
          !Array.isArray(
            pairings
          )
        ) {
          throw new HttpsError(
            'invalid-argument',
            '추천에 필요한 상품 데이터가 없습니다.'
          )
        }


        // ========================================
        // 5. 회원 취향 준비
        //
        // 비회원:
        // userPreference = null
        //
        // Mock 회원:
        // 프론트에서 이미 읽어온
        // userPreference 사용
        //
        // 실제 AI 회원:
        // 서버에서 Firestore 직접 조회
        // ========================================

        let userPreference =
          null


        if (
          surveyType ===
          'member'
        ) {
          // ========================================
          // 회원은 Mock이라도
          // 로그인 인증은 반드시 확인
          // ========================================

          if (!request.auth) {
            throw new HttpsError(
              'unauthenticated',
              '로그인이 필요한 추천입니다.'
            )
          }


          // ========================================
          // Mock 모드
          //
          // Functions Emulator에서
          // 실제 Firestore 서버 조회를 피하고
          // AiSurvey에서 이미 읽어온
          // 취향 정보를 사용
          // ========================================

          if (USE_MOCK_AI) {
            if (
              !isPlainObject(
                clientUserPreference
              )
            ) {
              throw new HttpsError(
                'failed-precondition',
                '회원 취향 정보를 확인할 수 없습니다.'
              )
            }


            userPreference =
              clientUserPreference


            logger.info(
              'Mock 회원 취향 사용',
              {
                uid:
                  request.auth.uid,
              }
            )
          } else {
            // ========================================
            // 실제 AI 모드
            //
            // 클라이언트가 보내온 취향은
            // 신뢰하지 않고
            // 서버가 Firestore에서 직접 조회
            // ========================================

            const uid =
              request.auth.uid


            const userRef =
              db
                .collection(
                  'users'
                )
                .doc(uid)


            const userSnap =
              await userRef.get()


            if (
              !userSnap.exists
            ) {
              throw new HttpsError(
                'not-found',
                '회원 정보를 찾을 수 없습니다.'
              )
            }


            const userData =
              userSnap.data()


            userPreference =
              userData
                .userPreference ||
              null


            if (
              !userPreference
            ) {
              throw new HttpsError(
                'failed-precondition',
                '먼저 취향 정보를 등록해주세요.'
              )
            }
          }
        }


        // ========================================
        // 6. OpenAI Key
        //
        // Mock:
        // OpenAI 호출 X
        //
        // 실제 AI:
        // Secret 사용
        // ========================================

        let openaiApiKey =
          null


        if (!USE_MOCK_AI) {
          openaiApiKey =
            OPENAI_API_KEY.value()


          if (!openaiApiKey) {
            throw new HttpsError(
              'failed-precondition',
              'OpenAI API 설정이 필요합니다.'
            )
          }
        }


        // ========================================
        // 7. 실행 로그
        // ========================================

        logger.info(
          'JAJAK 추천 요청',
          {
            mode:
              USE_MOCK_AI
                ? 'mock'
                : 'openai',

            userType:
              surveyType,

            uid:
              request.auth
                ?.uid ||
              'guest',

            hasUserPreference:
              Boolean(
                userPreference
              ),
          }
        )
        // ========================================
        // 관리자용 AI 추천 이용 로그 생성
        //
        // 회원 / 비회원 모두 저장
        // ========================================

        aiLogRef =
          db
            .collection(
              'aiRecommendationLogs'
            )
            .doc()


        await aiLogRef.set({
          uid:
            request.auth
              ?.uid
            || null,

          userType:
            surveyType,

          status:
            'pending',

          createdAt:
            FieldValue
              .serverTimestamp(),

          updatedAt:
            FieldValue
              .serverTimestamp(),

          mode:
            USE_MOCK_AI
              ? 'mock'
              : 'openai',

          todaySurvey:
            todaySurvey || null,

          model:
            null,

          candidateCount:
            0,

          recommendationCount:
            0,

          recommendationId:
            null,

          errorType:
            null,

          errorMessage:
            null,
        })


        // ========================================
        // 8. recommendation.js 지연 로딩
        //
        // Emulator 초기 구동 시
        // 무거운 OpenAI 관련 코드를
        // 바로 불러오지 않음
        // ========================================

        const {
          createRecommendation,
        } = require(
          './recommendation'
        )


        // ========================================
        // 9. 추천 실행
        // ========================================

        const result =
          await createRecommendation({
            userType:
              surveyType,

            userPreference,

            todaySurvey,

            liquors,

            foods,

            glasses,

            pairings,

            openaiApiKey,

            recommendationCount:
              3,
          })


        // ========================================
        // 10. 회원 추천 기록 Firestore 저장
        //
        // 비회원 추천:
        // 저장하지 않음
        //
        // 회원 추천:
        // users/{uid}/recommendations/{id}
        // 경로에 추천 1회당 문서 1개 저장
        // ========================================

        let recommendationId =
          null


        if (
          surveyType === 'member' &&
          request.auth
        ) {
          const uid =
            request.auth.uid


          const recommendationRef =
            db
              .collection(
                'users'
              )
              .doc(uid)
              .collection(
                'recommendations'
              )
              .doc()


          await recommendationRef.set({
            // 추천을 받은 회원
            uid,

            // 사용자 유형
            userType:
              'member',

            // 추천받은 날짜
            createdAt:
              FieldValue
                .serverTimestamp(),

            // 사용자가 별도로 저장한 추천인지
            // 처음 추천받았을 때는 false
            isSaved:
              false,

            // 추천 당시 오늘의 설문
            todaySurvey,

            // AI가 실제로 추천한 주안상 3개
            recommendations:
              result.recommendations,

            // 추천 관련 정보
            meta: {
              model:
                result.meta
                  ?.model ||
                null,

              isMock:
                Boolean(
                  result.meta
                    ?.isMock
                ),

              candidateCount:
                result.meta
                  ?.candidateCount ||
                0,

              recommendationCount:
                result
                  .recommendations
                  ?.length ||
                0,
            },
          })


          recommendationId =
            recommendationRef.id


          logger.info(
            'JAJAK 추천 기록 저장 완료',
            {
              uid,

              recommendationId,

              recommendationCount:
                result
                  .recommendations
                  ?.length ||
                0,
            }
          )
        }


        // ========================================
        // 관리자용 AI 로그 성공 처리
        // ========================================

        if (aiLogRef) {
          await aiLogRef.update({
            status:
              'success',

            updatedAt:
              FieldValue
                .serverTimestamp(),

            model:
              result.meta
                ?.model
              || null,

            candidateCount:
              result.meta
                ?.candidateCount
              || 0,

            recommendationCount:
              result
                .recommendations
                ?.length
              || 0,

            recommendationId:
              recommendationId
              || null,

            errorType:
              null,

            errorMessage:
              null,
          })
        }


        // ========================================
        // 11. 완료 로그
        // ========================================

        logger.info(
          'JAJAK 추천 완료',
          {
            mode:
              result.meta
                ?.isMock
                ? 'mock'
                : 'openai',

            userType:
              surveyType,

            uid:
              request.auth
                ?.uid ||
              'guest',

            candidateCount:
              result.meta
                ?.candidateCount,

            recommendationCount:
              result
                .recommendations
                ?.length,

            recommendationId,
          }
        )


        // ========================================
        // 12. 프론트 반환
        //
        // 추천 결과와 함께
        // Firestore 추천 기록 ID도 전달
        // ========================================

        return {
          ...result,

          recommendationId,
        }
      } catch (error) {
        // ========================================
        // 관리자용 AI 로그 실패 처리
        // ========================================

        if (aiLogRef) {
          try {
            await aiLogRef.update({
              status:
                'failed',

              updatedAt:
                FieldValue
                  .serverTimestamp(),

              errorType:
                error?.code
                || error?.message
                || 'UNKNOWN_ERROR',

              errorMessage:
                error?.message
                || '알 수 없는 오류',
            })
          } catch (logError) {
            logger.error(
              'AI 추천 실패 로그 저장 오류',
              {
                message:
                  logError?.message,
              }
            )
          }
        }


        // ========================================
        // Firebase HttpsError
        // ========================================

        if (
          error instanceof
          HttpsError
        ) {
          throw error
        }


        // ========================================
        // 추천 후보 없음
        // ========================================

        if (
          error?.message ===
          'NO_SAFE_CANDIDATES'
        ) {
          logger.warn(
            '추천 가능한 안전 상품 없음',
            error.details || {}
          )


          throw new HttpsError(
            'failed-precondition',
            '선택한 조건에 맞는 안전한 추천 상품을 찾지 못했습니다.'
          )
        }


        // ========================================
        // OpenAI API Key 없음
        // ========================================

        if (
          error?.message ===
          'OPENAI_API_KEY_MISSING'
        ) {
          logger.error(
            'OpenAI API Key 없음'
          )


          throw new HttpsError(
            'failed-precondition',
            'OpenAI API 설정이 필요합니다.'
          )
        }


        // ========================================
        // 추천 결과 오류
        // ========================================

        if (
          error?.message ===
            'EMPTY_OPENAI_RESPONSE' ||
          error?.message ===
            'INVALID_OPENAI_RESPONSE' ||
          error?.message ===
            'INVALID_RECOMMENDATION_COUNT'
        ) {
          logger.error(
            '추천 결과 오류',
            {
              message:
                error.message,
            }
          )


          throw new HttpsError(
            'internal',
            '추천 결과를 만드는 중 문제가 발생했습니다. 다시 시도해주세요.'
          )
        }


        // ========================================
        // 기타 오류
        // ========================================

        logger.error(
          'JAJAK 추천 Function 오류',
          {
            message:
              error?.message,

            stack:
              error?.stack,
          }
        )


        throw new HttpsError(
          'internal',
          'AI 추천 중 문제가 발생했습니다.'
        )
      }
    }
  )
