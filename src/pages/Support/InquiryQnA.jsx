import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { addDocument, getCollection } from '../../firebase/firestore'
import { subscribeToAuthState } from '../../firebase/auth'
import { PATHS } from '../../routes/paths'
import styles from './InquiryQnA.module.scss'
import { serverTimestamp } from 'firebase/firestore'
import checkIcon from '../../assets/icons/checkIcon.png'
import clipboardIcon from '../../assets/icons/clipboardIcon.png'
import closeIcon from '../../assets/icons/closeIcon.png'

// 문의 유형 (AGENTS.md 확정)
const INQUIRY_CATEGORIES = [
  { value: 'order_payment', label: '주문/결제' },
  { value: 'delivery', label: '배송' },
  { value: 'exchange_refund', label: '교환/환불' },
  { value: 'member_etc', label: '회원/기타' },
]

const INQUIRY_STATUS_LABEL = {
  pending: '답변 대기',
  answered: '답변 완료',
}

const CONTENT_MAX_LENGTH = 1000
const TITLE_MAX_LENGTH = 50
const MAX_FILE_COUNT = 3

const InquiryQnA = () => {
  const [uid, setUid] = useState(null)
  const [isAuthReady, setIsAuthReady] = useState(false)

  // view: 'choice'(비로그인 초기 선택) | 'form'(문의 작성) | 'history'(회원 문의 내역)
  const [view, setView] = useState('choice')

  const [category, setCategory] = useState(INQUIRY_CATEGORIES[0].value)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [files, setFiles] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [submittedInfo, setSubmittedInfo] = useState(null)

  const [inquiries, setInquiries] = useState([])
  const [isListLoading, setIsListLoading] = useState(true)
  const [openInquiryId, setOpenInquiryId] = useState(null)

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user) => {
      const loggedInUid = user && !user.isAnonymous ? user.uid : null
      setUid(loggedInUid)
      setIsAuthReady(true)
      // 로그인 회원은 바로 작성 화면으로, 비로그인은 선택 화면부터
      setView(loggedInUid ? 'form' : 'choice')
    })
    return unsubscribe
  }, [])

  // 회원 본인 문의 내역만 조회 (AGENTS.md 확정: 일반 회원은 본인 문의만 조회, 비회원은 내역 조회 없음)
  useEffect(() => {
    if (!uid) {
      setInquiries([])
      setIsListLoading(false)
      return undefined
    }

    let isCancelled = false
    setIsListLoading(true)

    getCollection('inquiries')
      .then((docs) => {
        if (isCancelled) return
        setInquiries(docs.filter((item) => item.userId === uid))
      })
      .catch((error) => {
        console.error('문의 내역 조회 실패:', error)
        if (!isCancelled) setInquiries([])
      })
      .finally(() => {
        if (!isCancelled) setIsListLoading(false)
      })

    return () => {
      isCancelled = true
    }
  }, [uid])

  const sortedInquiries = useMemo(() => (
    [...inquiries].sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
  ), [inquiries])

  const resetForm = () => {
    setCategory(INQUIRY_CATEGORIES[0].value)
    setTitle('')
    setContent('')
    setEmail('')
    setPhone('')
    setFiles([])
  }

  const handleFileChange = (event) => {
    const selected = Array.from(event.target.files || [])
    setFiles(selected.slice(0, MAX_FILE_COUNT))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setFormError('')

    const trimmedTitle = title.trim()
    const trimmedContent = content.trim()
    const trimmedEmail = email.trim()
    const trimmedPhone = phone.trim()

    if (!trimmedTitle || !trimmedContent) {
      setFormError('제목과 내용을 모두 입력해주세요.')
      return
    }

    // 비회원은 답변 안내를 위한 이메일이 필수
    if (!uid && !trimmedEmail) {
      setFormError('답변을 받으실 이메일을 입력해주세요.')
      return
    }

    // 회원은 연락처가 필수 (AGENTS.md 확정 화면 기준)
    if (uid && !trimmedPhone) {
      setFormError('연락 가능한 연락처를 입력해주세요.')
      return
    }

    if (isSubmitting) return
    setIsSubmitting(true)

    try {
      const payload = {
        userId: uid ?? null,
        isGuest: !uid,
        category,
        title: trimmedTitle,
        content: trimmedContent,
        contactEmail: uid ? null : trimmedEmail,
        contactPhone: trimmedPhone || null,
        status: 'pending',
        answer: null,
        createdAt: serverTimestamp(),
      }

      const newId = await addDocument('inquiries', payload)

      if (uid) {
        setInquiries((current) => [
          { id: newId, ...payload, createdAt: { seconds: Math.floor(Date.now() / 1000) } },
          ...current,
        ])
      }

      setSubmittedInfo({ isGuest: !uid, contact: uid ? trimmedPhone : trimmedEmail })
      resetForm()
    } catch (error) {
      console.error('문의 등록 실패:', error)
      setFormError('문의 등록 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderForm = () => (
    <form className={styles.inquiryForm} onSubmit={handleSubmit}>
      <label className={styles.formRow}>
        <span>문의 유형 *</span>
        <div className={styles.fieldControl}>
          <select value={category} onChange={(event) => setCategory(event.target.value)}>
            {INQUIRY_CATEGORIES.map((item) => (
              <option value={item.value} key={item.value}>{item.label}</option>
            ))}
          </select>
        </div>
      </label>

      <label className={styles.formRow}>
        <span>제목 *</span>
        <div className={styles.fieldControl}>
          <input
            type="text"
            value={title}
            maxLength={TITLE_MAX_LENGTH}
            placeholder={`제목을 입력해주세요 (최대 ${TITLE_MAX_LENGTH}자)`}
            onChange={(event) => setTitle(event.target.value)}
            required
          />
        </div>
      </label>

      <label className={styles.formRow}>
        <span>내용 *</span>
        <div className={styles.fieldControl}>
          <textarea
            value={content}
            rows={6}
            maxLength={CONTENT_MAX_LENGTH}
            placeholder="문의 내용을 자세히 입력해주세요"
            onChange={(event) => setContent(event.target.value)}
            required
          />
          <em className={styles.charCount}>{content.length} / {CONTENT_MAX_LENGTH}</em>
        </div>
      </label>

      <label className={styles.formRow}>
        <span>첨부 파일(선택)</span>
        <div className={styles.fieldControl}>
          <div className={styles.fileInputRow}>
            <label className={styles.fileButton}>
              파일 선택
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                multiple
                onChange={handleFileChange}
                hidden
              />
            </label>
            <span className={styles.fileStatus}>
              {files.length === 0 ? '선택된 파일이 없습니다.' : `${files.length}개 파일 선택됨`}
            </span>
          </div>
          <em className={styles.fieldHint}>최대 3개, 총 10MB 이하 (jpg, png, pdf)</em>
        </div>
      </label>

      {!uid && (
        <label className={styles.formRow}>
          <span>이메일 *</span>
          <div className={styles.fieldControl}>
            <input
              type="email"
              value={email}
              placeholder="답변을 받을 이메일을 입력해주세요"
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <em className={styles.fieldHint}>비회원 문의는 입력하신 이메일로 답변을 안내드립니다.</em>
          </div>
        </label>
      )}

      <label className={styles.formRow}>
        <span>연락처{!uid && ' (선택)'}{uid && ' *'}</span>
        <div className={styles.fieldControl}>
          <input
            type="tel"
            value={phone}
            placeholder="연락 가능한 전화번호를 입력해주세요"
            onChange={(event) => setPhone(event.target.value)}
            required={Boolean(uid)}
          />
        </div>
      </label>

      {formError && <p className={styles.formError} role="alert">{formError}</p>}

      <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
        {isSubmitting ? '접수 중...' : '문의 접수하기'}
      </button>
    </form>
  )

  const renderHistory = () => (
    <div className={styles.inquiryHistory}>
      <button type="button" className={styles.backLink} onClick={() => setView('form')}>
        ← 새 문의 작성
      </button>

      <h2>나의 문의 내역</h2>

      {isListLoading ? (
        <p className={styles.status}>문의 내역을 불러오는 중입니다...</p>
      ) : sortedInquiries.length === 0 ? (
        <p className={styles.empty}>등록된 문의 내역이 없습니다.</p>
      ) : (
        <ul className={styles.inquiryList}>
          {sortedInquiries.map((item) => {
            const isOpen = openInquiryId === item.id
            const categoryLabel = INQUIRY_CATEGORIES.find((c) => c.value === item.category)?.label ?? item.category

            return (
              <li className={styles.inquiryItem} key={item.id}>
                <button
                  type="button"
                  className={styles.inquiryHeader}
                  onClick={() => setOpenInquiryId((current) => (current === item.id ? null : item.id))}
                  aria-expanded={isOpen}
                >
                  <span className={`${styles.statusBadge} ${item.status === 'answered' ? styles.answered : ''}`}>
                    {INQUIRY_STATUS_LABEL[item.status] ?? INQUIRY_STATUS_LABEL.pending}
                  </span>
                  <span className={styles.inquiryCategory}>{categoryLabel}</span>
                  <span className={styles.inquiryTitle}>{item.title}</span>
                  <span>{isOpen ? '−' : '+'}</span>
                </button>

                {isOpen && (
                  <div className={styles.inquiryBody}>
                    <p className={styles.inquiryContent}>{item.content}</p>

                    {item.status === 'answered' && item.answer ? (
                      <div className={styles.answerBox}>
                        <strong>답변</strong>
                        <p>{item.answer}</p>
                      </div>
                    ) : (
                      <p className={styles.waitingNotice}>아직 답변이 등록되지 않았습니다.</p>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )

  return (
    <section className={styles.page}>
      <div className={styles.content}>
        <div className={styles.titleRow}>
          <h1>1:1 문의하기</h1>
          {isAuthReady && uid && view === 'form' && (
            <button type="button" className={styles.historyLink} onClick={() => setView('history')}>
              내 문의 내역 보기 →
            </button>
          )}
        </div>

        {!isAuthReady ? (
          <p className={styles.status}>확인 중입니다...</p>
        ) : view === 'choice' ? (
          <div className={styles.choiceBox}>
            <p className={styles.choiceMessage}>
              <strong>로그인 후 문의</strong>하시면
              <br />
              문의 내역이 저장되어 답변을 편리하게 확인하실 수 있어요.
            </p>
            <div className={styles.choiceButtons}>
              <Link to={PATHS.login} className={styles.loginButton}>로그인하기</Link>
              <button type="button" className={styles.guestButton} onClick={() => setView('form')}>
                비회원 문의
              </button>
            </div>
          </div>
        ) : view === 'history' ? (
          renderHistory()
        ) : (
          renderForm()
        )}
      </div>

      {submittedInfo && (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true">
          <div className={styles.modalBox}>
            <button
              type="button"
              className={styles.modalClose}
              onClick={() => setSubmittedInfo(null)}
              aria-label="닫기"
            >
              <img src={closeIcon} alt="" />
            </button>
            <div className={styles.modalIcon} aria-hidden="true">
              <img src={checkIcon} alt="" />
            </div>
            <p className={styles.modalTitle}>문의가 접수되었습니다!</p>
            <p className={styles.modalDesc}>
              소중한 문의를 남겨주셔서 감사합니다.
              <br />
              확인 후 순차적으로 답변드릴게요.
            </p>
            <hr className={styles.modalDivider} />
            <div className={styles.modalContact}>
              <img src={clipboardIcon} alt="" className={styles.modalContactIcon} />
                <p className={styles.modalContactText}>
                문의 내용 확인 후
                <br />
                {submittedInfo.isGuest ? '입력하신 ' : '등록하신 '}
                <span className={styles.modalContactHighlight}>
                  {submittedInfo.isGuest ? '이메일' : '연락처'}
                </span>
                로
                <br />
                답변 안내를 보내드려요.
              </p>
            </div>
            <button
              type="button"
              className={styles.modalConfirm}
              onClick={() => setSubmittedInfo(null)}
            >
              확인
            </button>
            <p className={styles.modalNotice}>
              ⏱ 답변까지 영업일 기준 1~2일 정도 소요될 수 있어요.
            </p>
          </div>
        </div>
      )}
    </section>
  )
}

export default InquiryQnA
