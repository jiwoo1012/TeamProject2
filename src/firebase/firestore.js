import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'

import { db } from './firebase'


// 문서 1개 조회
export const getDocument = async (collectionName, documentId) => {
  const docRef = doc(db, collectionName, documentId)
  const docSnap = await getDoc(docRef)

  if (!docSnap.exists()) {
    return null
  }

  return {
    id: docSnap.id,
    ...docSnap.data(),
  }
}


// 컬렉션 전체 조회
export const getCollection = async (collectionName) => {
  const collectionRef = collection(db, collectionName)
  const snapshot = await getDocs(collectionRef)

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }))
}


// 자동 ID로 문서 생성
export const addDocument = async (collectionName, data) => {
  const collectionRef = collection(db, collectionName)

  const docRef = await addDoc(collectionRef, {
    ...data,
    createdAt: serverTimestamp(),
  })

  return docRef.id
}


// 지정한 ID로 문서 생성 / 저장
export const setDocument = async (
  collectionName,
  documentId,
  data
) => {
  const docRef = doc(db, collectionName, documentId)

  await setDoc(docRef, data, {
    merge: true,
  })
}


// 문서 수정
export const updateDocument = async (
  collectionName,
  documentId,
  data
) => {
  const docRef = doc(db, collectionName, documentId)

  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  })
}


// 문서 삭제
export const deleteDocument = async (
  collectionName,
  documentId
) => {
  const docRef = doc(db, collectionName, documentId)

  await deleteDoc(docRef)
}