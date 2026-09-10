import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCurrentUserData, subscribeToAuthState } from '../../firebase/auth'
import { saveEventParticipation } from '../../services/eventParticipation'
import quizData from '../../data/quizs.json'
import { PATHS } from '../../routes/paths'
import knotPattern from '../../assets/images/eventPage/pattern.png'
import styles from './OxQuizEvent.module.scss'

const EVENT_ID = 'event-3'
const EVENT_TITLE = '술술 풀리는 막동이 OX 퀴즈'
const POINTS_PER_ANSWER = 500
const REWARD_MILESTONE_COUNT = 5

const quizImages = import.meta.glob('../../assets/images/products/explain/*.png', {
  eager: true,
  import: 'default',
})

const resolveQuizImage = (imageUrl) => {
  const fileName = imageUrl?.split('/').pop()
  return Object.entries(quizImages).find(([path]) => path.endsWith(`/${fileName}`))?.[1]
}

const formatDate = () => new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric', month: '2-digit', day: '2-digit',
}).format(new Date())

const OxQuizEvent = () => {
  const navigate = useNavigate()
  const quizzes = useMemo(() => quizData.map((quiz) => ({
    ...quiz,
    answer: quiz.Answer.toUpperCase(),
    image: resolveQuizImage(quiz.imageUrl),
  })), [])
  const hasSavedRef = useRef(false)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [correctCount, setCorrectCount] = useState(0)
  const [nickname, setNickname] = useState('')
  const [isResultOpen, setIsResultOpen] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')
  const [justCompletedMilestone, setJustCompletedMilestone] = useState(-1)
  const [pointBurst, setPointBurst] = useState(null)

  const currentQuiz = quizzes[currentIndex]
  const isAnswered = Boolean(selectedAnswer)
  const isCorrect = isAnswered && selectedAnswer === currentQuiz.answer
  const isLastQuiz = currentIndex === quizzes.length - 1
  const earnedPoints = correctCount * POINTS_PER_ANSWER

  // Checkpoints derived from the real per-answer reward (POINTS_PER_ANSWER),
  // grouped into REWARD_MILESTONE_COUNT even steps so the bar stays compact
  // regardless of how many questions the quiz has.
  const rewardMilestones = useMemo(() => {
    const count = Math.min(REWARD_MILESTONE_COUNT, quizzes.length)
    const step = quizzes.length / count
    return Array.from({ length: count }, (_, index) => {
      const correctNeeded = Math.round(step * (index + 1))
      return { correctNeeded, points: correctNeeded * POINTS_PER_ANSWER }
    })
  }, [quizzes.length])

  useEffect(() => {
    document.body.classList.add('jajak-ox-quiz')
    return () => document.body.classList.remove('jajak-ox-quiz')
  }, [])

  useEffect(() => {
    let active = true
    const unsubscribe = subscribeToAuthState(async (currentUser) => {
      const member = currentUser && !currentUser.isAnonymous ? currentUser : null
      if (!member) return
      try {
        const memberData = await getCurrentUserData(member.uid)
        if (active) setNickname(memberData?.nickname ?? member.displayName ?? '')
      } catch {
        if (active) setNickname(member.displayName ?? '')
      }
    })
    return () => {
      active = false
      unsubscribe()
    }
  }, [])

  const currentMilestoneIndex = rewardMilestones.findIndex((milestone) => correctCount < milestone.correctNeeded)

  useEffect(() => {
    if (correctCount === 0) return
    setPointBurst({ id: correctCount, amount: POINTS_PER_ANSWER })
    const reachedIndex = rewardMilestones.findIndex((milestone) => milestone.correctNeeded === correctCount)
    if (reachedIndex !== -1) setJustCompletedMilestone(reachedIndex)
    const burstTimer = setTimeout(() => setPointBurst(null), 900)
    const pulseTimer = setTimeout(() => setJustCompletedMilestone(-1), 700)
    return () => {
      clearTimeout(burstTimer)
      clearTimeout(pulseTimer)
    }
  }, [correctCount, rewardMilestones])

  const saveResult = useCallback(async (finalCorrectCount) => {
    if (hasSavedRef.current) return
    hasSavedRef.current = 'saving'
    const finalPoints = finalCorrectCount * POINTS_PER_ANSWER

    try {
      await saveEventParticipation({
        eventId: EVENT_ID, eventTitle: EVENT_TITLE, rewardType: 'point',
        rewardRank: null, rewardName: `${finalCorrectCount}문제 정답 포인트`,
        rewardProductId: null, rewardPoints: finalPoints, isWinner: finalPoints > 0,
        outcome: 'completed', correctCount: finalCorrectCount,
      })
      hasSavedRef.current = 'saved'
      setSaveMessage(`${finalPoints.toLocaleString('ko-KR')}P가 지급되었습니다.`)
    } catch (error) {
      hasSavedRef.current = false
      setSaveMessage(error.message === 'LOGIN_REQUIRED'
        ? '로그인 상태에서만 포인트와 참여 내역이 저장됩니다.'
        : error.message === 'ALREADY_PARTICIPATED'
          ? '오늘의 참여 기회를 이미 사용했습니다.'
          : '결과를 저장하지 못했습니다. 잠시 후 다시 확인해주세요.')
    }
  }, [])

  const handleAnswer = (answer) => {
    if (isAnswered) return
    setSelectedAnswer(answer)
    if (answer === currentQuiz.answer) setCorrectCount((count) => count + 1)
  }

  const handleContinue = () => {
    if (!isAnswered) return
    if (isLastQuiz) {
      setIsResultOpen(true)
      void saveResult(correctCount)
      return
    }
    setCurrentIndex((index) => index + 1)
    setSelectedAnswer('')
  }

  const handleQuit = async () => {
    await saveResult(correctCount)
    navigate(PATHS.events)
  }

  const progressPercent = ((currentIndex + (isAnswered ? 1 : 0)) / quizzes.length) * 100

  return (
    <main className={styles.page}>
      <button className={styles.quitButton} type="button" onClick={handleQuit}>← 그만두기</button>

      <div className={styles.quizShell}>
        <div className={styles.progressHeader}>
          <div className={styles.progressMeta}>
            <strong>{currentIndex + 1} / {quizzes.length}</strong>
            <strong>현재 맞춘 정답 {correctCount}개</strong>
          </div>
          <div
            className={styles.progressBar}
            role="progressbar"
            aria-valuenow={currentIndex + 1}
            aria-valuemin={1}
            aria-valuemax={quizzes.length}
          >
            <span style={{ width: `${progressPercent}%` }} />
            <span className={styles.progressKnob} style={{ left: `${progressPercent}%` }} />
          </div>
        </div>

        <div className={styles.rewardTrack} aria-label="포인트 적립 현황">
          <div className={styles.rewardSummary}>
            <span>포인트 적립 현황</span>
            <span className={styles.rewardTotal}>
              {earnedPoints.toLocaleString('ko-KR')}P
              {pointBurst && (
                <span key={pointBurst.id} className={styles.pointBurst} aria-hidden="true">
                  +{pointBurst.amount.toLocaleString('ko-KR')}P
                </span>
              )}
            </span>
          </div>
          <div className={styles.rewardTrackRow}>
            <div className={styles.rewardLine}>
              <span style={{ width: `${Math.min(100, (correctCount / quizzes.length) * 100)}%` }} />
            </div>
            <ul className={styles.rewardMilestones}>
              {rewardMilestones.map((milestone, index) => {
                const isCompleted = correctCount >= milestone.correctNeeded
                const isCurrent = index === currentMilestoneIndex
                return (
                  <li
                    className={`${styles.rewardMilestone} ${isCompleted ? styles.isCompleted : ''} ${isCurrent ? styles.isCurrent : ''} ${index === justCompletedMilestone ? styles.isPulsing : ''}`}
                    key={milestone.correctNeeded}
                  >
                    <span className={styles.rewardNode} aria-hidden="true">{isCompleted && 'P'}</span>
                    <span className={styles.rewardLabel}>{milestone.points.toLocaleString('ko-KR')}P</span>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>

        <section className={`${styles.questionPanel} ${isAnswered ? styles.isAnswered : ''}`} aria-live="polite" key={currentQuiz.id}>
          <img className={styles.cardMark} src={knotPattern} alt="" aria-hidden="true" />
          <div className={styles.visualArea}>
            <img src={currentQuiz.image} alt={`${currentIndex + 1}번 문제 관련 이미지`} />
          </div>
          <div className={styles.copyArea}>
            {isAnswered ? (
              <>
                <div className={styles.feedbackHead}>
                  <p className={styles.answerTitle}>정답 : {currentQuiz.answer}</p>
                  <p className={`${styles.feedbackMessage} ${isCorrect ? styles.isCorrect : styles.isWrong}`}>
                    {isCorrect ? '정답입니다!' : '아쉬워요, 오답입니다!'}
                  </p>
                </div>
                <p className={styles.explanation}>{currentQuiz.explanation}</p>
                <button className={styles.continueButton} type="button" onClick={handleContinue}>
                  {isLastQuiz ? '결과 보기' : '다음 문제'}
                </button>
              </>
            ) : (
              <>
                <p className={styles.questionNumber}>Q{currentIndex + 1}.</p>
                <h1>{currentQuiz.question}</h1>
              </>
            )}
          </div>
        </section>

        <section className={styles.answerArea} aria-label="OX 답변 선택">
          {['O', 'X'].map((answer) => {
            const isThisSelected = selectedAnswer === answer
            const isCorrectAnswerButton = isAnswered && !isCorrect && answer === currentQuiz.answer
            return (
              <button
                className={`${styles.answerButton} ${isThisSelected ? styles.isSelected : ''} ${answer === 'X' ? styles.isX : ''} ${isThisSelected ? (isCorrect ? styles.isCorrectSelected : styles.isWrongSelected) : ''} ${isCorrectAnswerButton ? styles.isCorrectHint : ''}`}
                type="button"
                disabled={isAnswered}
                aria-pressed={isThisSelected}
                onClick={() => handleAnswer(answer)}
                key={answer}
              >
                <span className={styles.answerGlyph} aria-hidden="true">{answer}</span>
                <strong>{answer === 'O' ? '맞습니다!' : '아닙니다!'}</strong>
                {isCorrectAnswerButton && <span className={styles.correctBadge} aria-hidden="true">✓</span>}
              </button>
            )
          })}
        </section>
      </div>

      {isResultOpen && (
        <div className={styles.modalBackdrop}>
          <section className={styles.resultModal} role="dialog" aria-modal="true" aria-labelledby="quiz-result-title">
            <button className={styles.closeButton} type="button" aria-label="결과 닫기" onClick={() => navigate(PATHS.events)}>×</button>
            <h2 id="quiz-result-title">{nickname ? `${nickname}나으리가` : '나으리가'} 맞춘 문제는<br />총 {correctCount}문제!</h2>
            <div className={styles.resultPoint}><strong>{earnedPoints.toLocaleString('ko-KR')}P 증정</strong></div>
            <dl>
              <div><dt>응모 이벤트</dt><dd>{EVENT_TITLE}</dd></div>
              <div><dt>응모 날짜</dt><dd>{formatDate()}</dd></div>
              <div><dt>당첨일</dt><dd>{formatDate()}</dd></div>
            </dl>
            {saveMessage && <p className={styles.saveMessage}>{saveMessage}</p>}
            <div className={styles.resultActions}>
              <Link to={PATHS.events}>목록으로 돌아가기</Link>
              <Link to={`${PATHS.mypage}/events`}>내역 확인하기</Link>
            </div>
          </section>
        </div>
      )}
    </main>
  )
}

export default OxQuizEvent
