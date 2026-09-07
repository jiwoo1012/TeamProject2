import { collection, doc, getDoc, getDocs, query, runTransaction, serverTimestamp, setDoc, Timestamp, where } from 'firebase/firestore'
import eventsData from '../data/events.json'
import { auth, db } from '../firebase/firebase'

const EVENT_IDS = ['event-1', 'event-2', 'event-3', 'event-4', 'event-5']
const getDateKey = (date = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date)
const getLimit = (eventId, override) => {
  if (override?.type) return override
  const index = EVENT_IDS.indexOf(eventId)
  return eventsData[index]?.event?.participationLimit ?? { type: 'per_user_total', maxCount: 1 }
}

export const getUserEventParticipations = async (userId) => {
  const snapshot = await getDocs(query(collection(db, 'eventParticipations'), where('userId', '==', userId)))
  return snapshot.docs.flatMap((item) => {
    const participation = { id: item.id, ...item.data() }
    if (!participation.results?.length) return [participation]
    return participation.results.map((result, index) => ({
      ...participation,
      ...result,
      id: result.attemptId ?? `${item.id}_${index}`,
      participationDocumentId: item.id,
      participatedAt: result.participatedAt ?? participation.participatedAt,
    }))
  })
}

export const getEventParticipationAvailability = async (eventId, participationLimit) => {
  const user = auth.currentUser
  if (!user || user.isAnonymous) return { canParticipate: false, reason: 'LOGIN_REQUIRED', usedCount: 0 }
  const [memberSnapshot, participationSnapshot] = await Promise.all([
    getDoc(doc(db, 'users', user.uid)),
    getDoc(doc(db, 'eventParticipations', `${eventId}_${user.uid}`)),
  ])
  if (memberSnapshot.data()?.role === 'admin') return { canParticipate: true, isAdmin: true, usedCount: 0 }
  const data = participationSnapshot.data() ?? {}
  const limit = getLimit(eventId, participationLimit)
  const today = getDateKey()
  const usedCount = limit.type === 'per_day_once'
    ? (data.lastParticipationDate === today ? Number(data.dailyParticipationCount ?? 1) : 0)
    : Number(data.participationCount ?? (participationSnapshot.exists() ? 1 : 0))
  return { canParticipate: usedCount < Number(limit.maxCount ?? 1), usedCount, limit }
}

export const saveEventParticipation = async (participation) => {
  await auth.authStateReady()
  const user = auth.currentUser
  if (!user || user.isAnonymous) throw new Error('LOGIN_REQUIRED')
  const userRef = doc(db, 'users', user.uid)
  const participationId = `${participation.eventId}_${user.uid}`
  const participationRef = doc(db, 'eventParticipations', participationId)
  const rewardPoints = Number(participation.rewardPoints || 0)
  const today = getDateKey()
  const attemptId = `${participationId}_${Date.now()}_${crypto.randomUUID()}`
  const attemptedAt = Timestamp.now()

  try {
    await runTransaction(db, async (transaction) => {
      const participationSnapshot = await transaction.get(participationRef)
      const userSnapshot = await transaction.get(userRef)
      if (!userSnapshot.exists()) throw new Error('USER_NOT_FOUND')
      const isAdmin = userSnapshot.data().role === 'admin'
      const previous = participationSnapshot.data() ?? {}
      const limit = getLimit(participation.eventId, participation.participationLimit)
      const totalCount = Number(previous.participationCount ?? (participationSnapshot.exists() ? 1 : 0))
      const dailyCount = previous.lastParticipationDate === today ? Number(previous.dailyParticipationCount ?? (participationSnapshot.exists() ? 1 : 0)) : 0
      if (!isAdmin) {
        const usedCount = limit.type === 'per_day_once' ? dailyCount : totalCount
        if (usedCount >= Number(limit.maxCount ?? 1)) throw new Error('ALREADY_PARTICIPATED')
      }
      if (rewardPoints > 0) {
        transaction.update(userRef, { points: Number(userSnapshot.data().points || 0) + rewardPoints, lastEventRewardId: participationId, updatedAt: serverTimestamp() })
      }
      const result = {
        attemptId, rewardType: participation.rewardType ?? null, rewardRank: participation.rewardRank ?? null,
        rewardName: participation.rewardName ?? null, rewardProductId: participation.rewardProductId ?? null,
        rewardPoints, isWinner: Boolean(participation.isWinner), outcome: participation.outcome ?? null,
        matchedPairs: participation.matchedPairs ?? null, correctCount: participation.correctCount ?? null,
        participatedAt: attemptedAt,
      }
      transaction.set(participationRef, {
        ...participation, userId: user.uid, isAdminParticipation: isAdmin, participationLimit: limit,
        participationCount: totalCount + 1, dailyParticipationCount: dailyCount + 1,
        lastParticipationDate: today, rewardPoints, results: [...(previous.results ?? []), result],
        latestResult: result, participatedAt: serverTimestamp(), updatedAt: serverTimestamp(),
        createdAt: previous.createdAt ?? serverTimestamp(),
      }, { merge: true })
    })
  } catch (error) {
    console.error('이벤트 참여 및 결과 저장 실패:', {
      code: error.code,
      message: error.message,
      eventId: participation.eventId,
      userId: user.uid,
    })
    throw error
  }

  if (rewardPoints > 0) {
    try {
      await setDoc(doc(db, `users/${user.uid}/pointHistory`, `event_${attemptId}`), {
        type: 'earn', amount: rewardPoints, reason: participation.eventTitle || '이벤트 참여 보상',
        eventId: participation.eventId, participationId, attemptId, createdAt: serverTimestamp(),
      })
    } catch (historyError) {
      console.error('이벤트 포인트 상세 내역 저장 실패:', historyError)
    }
  }
  return { success: true, awardedPoints: rewardPoints, participationId, attemptId }
}
