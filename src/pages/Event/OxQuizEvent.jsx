import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getCurrentUserData, subscribeToAuthState } from '../../firebase/auth'
import { saveEventParticipation } from '../../services/eventParticipation'
import quizData from '../../data/quizs.json'
import { PATHS } from '../../routes/paths'
import backgroundImage from '../../assets/images/eventPage/background3.jpg'
import styles from './OxQuizEvent.module.scss'

const EVENT_ID = 'event-3'
const EVENT_TITLE = '술술 풀리는 막동이 OX 퀴즈'
const POINTS_PER_ANSWER = 500

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
  const userRef = useRef(null)
  const hasSavedRef = useRef(false)

  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [correctCount, setCorrectCount] = useState(0)
  const [nickname, setNickname] = useState('')
  const [isResultOpen, setIsResultOpen] = useState(false)
  const [isQuitOpen, setIsQuitOpen] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const currentQuiz = quizzes[currentIndex]
  const isAnswered = Boolean(selectedAnswer)
  const isLastQuiz = currentIndex === quizzes.length - 1
  const earnedPoints = correctCount * POINTS_PER_ANSWER

  useEffect(() => {
    document.body.classList.add('jajak-ox-quiz')
    return () => document.body.classList.remove('jajak-ox-quiz')
  }, [])

  useEffect(() => {
    let active = true
    const unsubscribe = subscribeToAuthState(async (currentUser) => {
      const member = currentUser && !currentUser.isAnonymous ? currentUser : null
      userRef.current = member
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

  const saveResult = useCallback(async (finalCorrectCount) => {
    if (hasSavedRef.current) return
    hasSavedRef.current = true
    const user = userRef.current
    const finalPoints = finalCorrectCount * POINTS_PER_ANSWER

    if (!user) {
      setSaveMessage('로그인 상태에서만 포인트와 참여 내역이 저장됩니다.')
      return
    }

    try {
      await saveEventParticipation({
        eventId: EVENT_ID, eventTitle: EVENT_TITLE, rewardType: 'point',
        rewardRank: null, rewardName: `${finalCorrectCount}문제 정답 포인트`,
        rewardProductId: null, rewardPoints: finalPoints, isWinner: finalPoints > 0,
      })
      setSaveMessage(`${finalPoints.toLocaleString('ko-KR')}P가 지급되었습니다.`)
    } catch (error) {
      setSaveMessage(error.message === 'ALREADY_PARTICIPATED'
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

  return (
    <main className={`${styles.page} ${isQuitOpen ? styles.isPaused : ''}`} style={{ '--quiz-background': `url(${backgroundImage})` }}>
      <div className={styles.quizShell}>
        <div className={styles.progressHeader}>
          <strong>{currentIndex + 1}/{quizzes.length}</strong>
          <strong>현재 맞춘 정답 {correctCount}개</strong>
        </div>

        <section className={`${styles.questionPanel} ${isAnswered ? styles.isAnswered : ''}`} aria-live="polite" key={currentQuiz.id}>
          <div className={styles.visualArea}>
            <img src={currentQuiz.image} alt={`${currentIndex + 1}번 문제 관련 이미지`} />
          </div>
          <div className={styles.copyArea}>
            {isAnswered ? (
              <>
                <p className={styles.answerTitle}>정답 : {currentQuiz.answer}</p>
                <p className={styles.explanation}>{currentQuiz.explanation}</p>
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
          {['O', 'X'].map((answer) => (
            <button
              className={`${styles.answerButton} ${selectedAnswer === answer ? styles.isSelected : ''} ${answer === 'X' ? styles.isX : ''}`}
              type="button"
              disabled={isAnswered}
              aria-pressed={selectedAnswer === answer}
              onClick={() => handleAnswer(answer)}
              key={answer}
            >
              <span aria-hidden="true">{answer}</span>
              <strong>{answer === 'O' ? '맞습니다!' : '아닙니다!'}</strong>
            </button>
          ))}

          {isAnswered && (
            <button className={styles.continueButton} type="button" onClick={handleContinue}>
              {isLastQuiz ? '결과 보기' : '다음 문제'}
              <span aria-hidden="true">›</span>
            </button>
          )}
        </section>
      </div>

      <button className={styles.quitButton} type="button" onClick={() => setIsQuitOpen(true)}>← 그만두기</button>

      {isQuitOpen && (
        <div className={styles.modalBackdrop}>
          <section className={styles.quitModal} role="dialog" aria-modal="true" aria-labelledby="quiz-quit-title">
            <h2 id="quiz-quit-title">퀴즈를 그만두시겠습니까?</h2>
            <p>그만 두게 될 시 오늘의 기회를 소진하게 됩니다. 괜찮으시겠습니까?</p>
            <div>
              <button type="button" onClick={() => setIsQuitOpen(false)}>계속하기</button>
              <button type="button" onClick={handleQuit}>그만두기</button>
            </div>
          </section>
        </div>
      )}

      {isResultOpen && (
        <div className={styles.modalBackdrop}>
          <section className={styles.resultModal} role="dialog" aria-modal="true" aria-labelledby="quiz-result-title">
            <button className={styles.closeButton} type="button" aria-label="결과 닫기" onClick={() => navigate(PATHS.events)}>×</button>
            <h2 id="quiz-result-title">{nickname ? `${nickname}나리가` : '나리가'} 맞춘 문제는<br />총 {correctCount}문제!</h2>
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
