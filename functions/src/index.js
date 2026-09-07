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
//
// 실제 AI 모드에서만 사용
// ========================================

const OPENAI_API_KEY =
  defineSecret(
    'OPENAI_API_KEY'
  )


// ========================================
// Mock 모드 확인
//
// functions/.env.local
// USE_MOCK_AI=true
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
// Mock:
// OpenAI Secret 연결 X
//
// 실제 OpenAI:
// OPENAI_API_KEY Secret 연결
// ========================================

const recommendationOptions =
  USE_MOCK_AI
    ? {}
    : {
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

exports.recommendJajak =
  onCall(
    recommendationOptions,

    async (request) => {
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
        // 10. 완료 로그
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
          }
        )


        // ========================================
        // 11. 프론트 반환
        // ========================================

        return result
      } catch (error) {
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
