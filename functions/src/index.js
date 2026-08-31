const {
  setGlobalOptions,
} = require("firebase-functions/v2");

const {
  onCall,
  HttpsError,
} = require("firebase-functions/v2/https");

const {
  defineSecret,
} = require("firebase-functions/params");

const logger =
  require("firebase-functions/logger");

const {
  initializeApp,
} = require("firebase-admin/app");

const {
  getFirestore,
} = require("firebase-admin/firestore");

const {
  createRecommendation,
} = require("./recommendation");


// ========================================
// Firebase Admin 초기화
// ========================================

initializeApp();

const db = getFirestore();


// ========================================
// Functions 공통 설정
// ========================================

setGlobalOptions({
  maxInstances: 10,
});


// ========================================
// OpenAI API Key
//
// Firebase Secret Manager에서 관리
// ========================================

const OPENAI_API_KEY =
  defineSecret("OPENAI_API_KEY");


// ========================================
// 간단한 객체 확인
// ========================================

const isPlainObject = (value) => {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
};


// ========================================
// 추천 요청
// ========================================

exports.recommendJajak = onCall(
  {
    secrets: [
      OPENAI_API_KEY,
    ],
  },

  async (request) => {
    try {
      // ========================================
      // 1. 프론트에서 전달받은 데이터
      // ========================================

      const data =
        request.data || {};

      const {
        surveyType,
        todaySurvey,

        liquors,
        foods,
        glasses,
        pairings,
      } = data;


      // ========================================
      // 2. 사용자 유형 확인
      // ========================================

      if (
        surveyType !== "member" &&
        surveyType !== "guest"
      ) {
        throw new HttpsError(
          "invalid-argument",
          "올바르지 않은 사용자 유형입니다."
        );
      }


      // ========================================
      // 3. 오늘 설문 확인
      // ========================================

      if (
        !isPlainObject(
          todaySurvey
        )
      ) {
        throw new HttpsError(
          "invalid-argument",
          "오늘의 설문 답변이 없습니다."
        );
      }


      // ========================================
      // 4. 상품 데이터 확인
      // ========================================

      if (
        !Array.isArray(liquors) ||
        !Array.isArray(foods) ||
        !Array.isArray(glasses) ||
        !Array.isArray(pairings)
      ) {
        throw new HttpsError(
          "invalid-argument",
          "추천에 필요한 상품 데이터가 없습니다."
        );
      }


      // ========================================
      // 5. 로그인 회원 취향 가져오기
      // ========================================

      let userPreference = null;


      if (
        surveyType === "member"
      ) {
        // 로그인하지 않았는데
        // 회원 추천을 요청한 경우
        if (!request.auth) {
          throw new HttpsError(
            "unauthenticated",
            "로그인이 필요한 추천입니다."
          );
        }


        const uid =
          request.auth.uid;


        const userRef =
          db
            .collection("users")
            .doc(uid);


        const userSnap =
          await userRef.get();


        if (!userSnap.exists) {
          throw new HttpsError(
            "not-found",
            "회원 정보를 찾을 수 없습니다."
          );
        }


        const userData =
          userSnap.data();


        userPreference =
          userData.userPreference ||
          null;


        // 회원인데 취향 설문을
        // 아직 등록하지 않은 경우
        if (!userPreference) {
          throw new HttpsError(
            "failed-precondition",
            "먼저 취향 정보를 등록해주세요."
          );
        }
      }


      // ========================================
      // 6. OpenAI Secret 확인
      // ========================================

      const openaiApiKey =
        OPENAI_API_KEY.value();


      if (!openaiApiKey) {
        logger.error(
          "OPENAI_API_KEY가 설정되지 않았습니다."
        );

        throw new HttpsError(
          "internal",
          "AI 추천 설정을 확인할 수 없습니다."
        );
      }


      // ========================================
      // 7. 추천 로직 실행
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

          // 메인 추천 1개
          // + 다른 추천 2개
          recommendationCount: 3,
        });


      // ========================================
      // 8. 로그
      // ========================================

      logger.info(
        "JAJAK AI 추천 완료",
        {
          userType:
            surveyType,

          uid:
            request.auth?.uid ||
            "guest",

          candidateCount:
            result.meta
              ?.candidateCount,

          recommendationCount:
            result.recommendations
              ?.length,
        }
      );


      // ========================================
      // 9. 프론트에 추천 결과 반환
      // ========================================

      return result;
    } catch (error) {
      // ========================================
      // 이미 HttpsError인 경우
      // 그대로 전달
      // ========================================

      if (
        error instanceof
        HttpsError
      ) {
        throw error;
      }


      // ========================================
      // 안전한 후보가 없는 경우
      // ========================================

      if (
        error.message ===
        "NO_SAFE_CANDIDATES"
      ) {
        logger.warn(
          "추천 가능한 안전 상품 없음",
          error.details || {}
        );

        throw new HttpsError(
          "failed-precondition",
          "선택한 조건에 맞는 안전한 추천 상품을 찾지 못했습니다."
        );
      }


      // ========================================
      // OpenAI 응답 문제
      // ========================================

      if (
        error.message ===
          "EMPTY_OPENAI_RESPONSE" ||
        error.message ===
          "INVALID_OPENAI_RESPONSE" ||
        error.message ===
          "INVALID_RECOMMENDATION_COUNT"
      ) {
        logger.error(
          "OpenAI 추천 응답 오류",
          {
            message:
              error.message,
          }
        );

        throw new HttpsError(
          "internal",
          "추천 결과를 만드는 중 문제가 발생했습니다. 다시 시도해주세요."
        );
      }


      // ========================================
      // 알 수 없는 오류
      // ========================================

      logger.error(
        "JAJAK 추천 Function 오류",
        {
          message:
            error?.message,

          stack:
            error?.stack,
        }
      );


      throw new HttpsError(
        "internal",
        "AI 추천 중 문제가 발생했습니다."
      );
    }
  }
);