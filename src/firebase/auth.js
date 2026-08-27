// src/firebase/auth.js

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  signInAnonymously as firebaseSignInAnonymously,
  onAuthStateChanged,
  updateProfile,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from 'firebase/auth'
import { serverTimestamp } from 'firebase/firestore'

import { auth } from './firebase'
import { setDocument, getDocument, updateDocument } from './firestore'

// 회원가입
// nickname, email, password만 받는다 (phone/address는 받지 않음 - AGENTS.md 확정)
export const signup = async ({ nickname, email, password }) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password)
  const { uid } = userCredential.user

  // Firebase Auth의 표시 이름에도 닉네임 반영 (선택사항이지만 편의상 설정)
  await updateProfile(userCredential.user, { displayName: nickname })

  // Firestore users/{uid} 문서 생성 (AGENTS.md User Document 구조 확정본)
  // setDocument는 createdAt/updatedAt을 자동으로 넣어주지 않으므로 직접 포함시킨다.
  await setDocument('users', uid, {
    uid,
    email,
    nickname,
    role: 'user',
    status: 'active',
    isAdultVerified: false,
    points: 1000,
    userPreference: null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })

  return userCredential.user
}

// 로그인 관련 에러 코드 (정지 계정 처리를 error.code로 통일해서 페이지에서 다루기 쉽게 함)
export class AccountSuspendedError extends Error {
  constructor() {
    super('This account has been suspended.')
    this.code = 'auth/account-suspended'
  }
}

// 로그인
// rememberMe가 true면 브라우저를 닫아도 로그인 유지, false면 탭/세션 종료 시 로그아웃
// 로그인 완료 후 Firestore users/{uid} 데이터를 조회해서 함께 반환한다 (AGENTS.md 확정 사항).
// 정지된(status: 'suspended') 계정이면 즉시 로그아웃 처리하고 에러를 던진다.
export const login = async (email, password, rememberMe = true) => {
  await setPersistence(
    auth,
    rememberMe ? browserLocalPersistence : browserSessionPersistence
  )
  const userCredential = await signInWithEmailAndPassword(auth, email, password)
  const { uid } = userCredential.user

  const userData = await getDocument('users', uid)

  if (userData?.status === 'suspended') {
    await signOut(auth)
    throw new AccountSuspendedError()
  }

  await updateDocument('users', uid, {
    lastLoginAt: serverTimestamp(),
  })

  return { user: userCredential.user, userData }
}

// 로그아웃
// 로그아웃 성공 시 jajak_cart 삭제까지 포함 (AGENTS.md Cart Rules 확정)
//
// 주의: src/utils/cartStorage.js는 이유진님 담당 파일로, 아직 clearCart 함수가
// 구현되지 않은 상태(빈 파일)일 수 있다. import 시점에 없는 함수를 정적으로
// import하면 앱 전체가 SyntaxError로 죽어버리므로, 여기서는 로그아웃을
// 실행하는 시점에 동적으로 import해서 있으면 호출하고 없으면 조용히 건너뛴다.
// cartStorage.js가 완성되면 이 코드는 그대로 두어도 자동으로 정상 동작한다.
export const logout = async () => {
  await signOut(auth)

  try {
    const cartStorage = await import('../utils/cartStorage')
    if (typeof cartStorage.clearCart === 'function') {
      cartStorage.clearCart()
    }
  } catch {
    // cartStorage.js가 아직 준비되지 않았거나 로드에 실패한 경우 무시한다.
  }
}

// 비회원(익명) 인증
// AdultModal / useAdultCheck / 비회원 AI 흐름(김지우 담당)에서 이 함수를 호출해서 사용
export const signInAnonymously = async () => {
  const userCredential = await firebaseSignInAnonymously(auth)
  return userCredential.user
}

// 인증 상태 변화 구독
// 사용 예: const unsubscribe = subscribeToAuthState((user) => {...}); 이후 unsubscribe()로 해제
export const subscribeToAuthState = (callback) => {
  return onAuthStateChanged(auth, callback)
}

// 현재 로그인된 사용자의 Firestore 회원 데이터 조회
export const getCurrentUserData = async (uid) => {
  return getDocument('users', uid)
}
