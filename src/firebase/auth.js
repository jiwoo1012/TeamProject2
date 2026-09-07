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
import {
  setDocument,
  getDocument,
  updateDocument,
} from './firestore'

import * as cartStorage from '../utils/cartStorage'


// ==========================================
// 회원가입
// ==========================================

// nickname, email, password만 받는다.
// phone/address는 회원가입 단계에서 받지 않는다.
export const signup = async ({ nickname, email, password }) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  )

  const { uid } = userCredential.user

  // Firebase Auth 표시 이름에 닉네임 반영
  await updateProfile(userCredential.user, {
    displayName: nickname,
  })

  // Firestore users/{uid} 문서 생성
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


// ==========================================
// 로그인 관련 에러
// ==========================================

// 정지 계정을 페이지에서 동일한 error.code로 처리하기 위한 커스텀 에러
export class AccountSuspendedError extends Error {
  constructor() {
    super('This account has been suspended.')

    this.name = 'AccountSuspendedError'
    this.code = 'auth/account-suspended'
  }
}


// ==========================================
// 로그인
// ==========================================

// rememberMe가 true면 브라우저를 닫아도 로그인 유지
// false면 현재 브라우저 세션 동안만 로그인 유지
export const login = async (
  email,
  password,
  rememberMe = true
) => {
  await setPersistence(
    auth,
    rememberMe
      ? browserLocalPersistence
      : browserSessionPersistence
  )

  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  )

  const { uid } = userCredential.user

  // Firestore 회원 데이터 조회
  const userData = await getDocument('users', uid)

  // 정지 계정이면 즉시 로그아웃
  if (userData?.status === 'suspended') {
    await signOut(auth)

    throw new AccountSuspendedError()
  }

  // 마지막 로그인 시간 갱신
  await updateDocument('users', uid, {
    lastLoginAt: serverTimestamp(),
  })

  return {
    user: userCredential.user,
    userData,
  }
}


// ==========================================
// 로그아웃
// ==========================================

// Firebase 로그아웃 후 로컬 장바구니 데이터도 삭제한다.
//
// cartStorage는 namespace import 방식으로 가져오므로
// clearCart 함수가 아직 존재하지 않아도 import 자체가 실패하지 않는다.
// 함수가 존재할 때만 실행한다.
export const logout = async () => {
  await signOut(auth)

  try {
    if (typeof cartStorage.clearCart === 'function') {
      cartStorage.clearCart()
    }
  } catch (error) {
    // 장바구니 초기화 실패가 로그아웃 자체를 막지 않도록 처리
    console.warn('장바구니 초기화 중 오류가 발생했습니다.', error)
  }
}


// ==========================================
// 비회원(익명) 인증
// ==========================================

// AdultModal / useAdultCheck / 비회원 AI 흐름에서 사용
export const signInAnonymously = async () => {
  const userCredential = await firebaseSignInAnonymously(auth)

  return userCredential.user
}


// ==========================================
// 인증 상태 변화 구독
// ==========================================

// 사용 예:
// const unsubscribe = subscribeToAuthState((user) => {
//   ...
// })
//
// 이후:
// unsubscribe()
export const subscribeToAuthState = (callback) => {
  return onAuthStateChanged(auth, callback)
}


// ==========================================
// 현재 로그인 사용자 데이터 조회
// ==========================================

export const getCurrentUserData = async (uid) => {
  return getDocument('users', uid)
}