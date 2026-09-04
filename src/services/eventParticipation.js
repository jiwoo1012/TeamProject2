import { collection, doc, getDoc, getDocs, query, runTransaction, serverTimestamp, setDoc, where } from 'firebase/firestore'
import { auth, db } from '../firebase/firebase'

export const getUserEventParticipations = async (userId) => {
  const snapshot = await getDocs(query(
    collection(db, 'eventParticipations'),
    where('userId', '==', userId)
  ))

  return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }))
}

export const saveEventParticipation = async (participation) => {
  const user = auth.currentUser
  if (!user) throw new Error('LOGIN_REQUIRED')

  const userRef = doc(db, 'users', user.uid)
  const memberSnapshot = await getDoc(userRef)
  if (!memberSnapshot.exists()) throw new Error('USER_NOT_FOUND')

  const isAdmin = memberSnapshot.data().role === 'admin'
  const participationId = isAdmin
    ? `${participation.eventId}_${user.uid}_${Date.now()}_${crypto.randomUUID()}`
    : `${participation.eventId}_${user.uid}`
  const participationRef = doc(db, 'eventParticipations', participationId)
  const rewardPoints = Number(participation.rewardPoints || 0)

  await runTransaction(db, async (transaction) => {
    const [participationSnapshot, userSnapshot] = await Promise.all([
      transaction.get(participationRef),
      transaction.get(userRef),
    ])
    if (participationSnapshot.exists()) throw new Error('ALREADY_PARTICIPATED')
    if (!userSnapshot.exists()) throw new Error('USER_NOT_FOUND')

    if (rewardPoints > 0) {
      transaction.update(userRef, {
        points: Number(userSnapshot.data().points || 0) + rewardPoints,
        lastEventRewardId: participationId,
        updatedAt: serverTimestamp(),
      })
    }

    transaction.set(participationRef, {
      ...participation,
      userId: user.uid,
      isAdminParticipation: isAdmin,
      rewardPoints,
      participatedAt: serverTimestamp(),
    })
  })

  if (rewardPoints > 0) {
    const pointHistoryRef = doc(
      db,
      `users/${user.uid}/pointHistory`,
      `event_${participationId}`
    )

    try {
      await setDoc(pointHistoryRef, {
        type: 'earn',
        amount: rewardPoints,
        reason: participation.eventTitle || '이벤트 참여 보상',
        eventId: participation.eventId,
        participationId,
        createdAt: serverTimestamp(),
      })
    } catch (historyError) {
      console.error('이벤트 포인트 상세 내역 저장 실패:', historyError)
    }
  }

  return { success: true, awardedPoints: rewardPoints }
}
