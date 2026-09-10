import { getFunctions, httpsCallable } from 'firebase/functions'
import app from '../firebase/firebase'

export const cancelSavedRecommendation = (recommendationId) =>
  httpsCallable(getFunctions(app), 'saveJajakRecommendation')({ recommendationId, isSaved: false })
