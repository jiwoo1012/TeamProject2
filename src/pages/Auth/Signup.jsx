import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'

import { signup, subscribeToAuthState } from '../../firebase/auth'
import { PATHS } from '../../routes/paths'

import checkIconImage from '../../assets/icons/checkIcon.png'
import eyeIconImage from '../../assets/icons/eye.png'
import eyeNoIconImage from '../../assets/icons/eyeNO.png'
import clipboardIconImage from '../../assets/icons/clipboardIcon.png'
import closeIconImage from '../../assets/icons/closeIcon.png'
import makdongImage from '../../assets/characters/M007_Poses03.png'

import styles from './Signup.module.scss'

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/

const getSignupErrorMessage = (error) => {
  switch (error.code) {
    case 'auth/email-already-in-use':
      return '이미 가입된 이메일입니다.'
    case 'auth/invalid-email':
      return '올바른 이메일 형식이 아닙니다.'
    case 'auth/weak-password':
      return '비밀번호가 너무 약합니다.'
    default:
      return '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.'
  }
}

const Signup = () => {
  const navigate = useNavigate()
  const pageRef = useRef(null)

  const [form, setForm] = useState({
    email: '',
    nickname: '',
    password: '',
    passwordConfirm: '',
    agree: false,
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  const justSignedUpRef = useRef(false)
  const submittingRef = useRef(false)

  // Header가 일반 문서 흐름에서 위쪽 공간을 차지하고 있어서, .signup에
  // height: 100vh만 주면 (헤더 높이만큼) 뷰포트를 넘어 스크롤이 생긴다.
  // 실제 렌더링된 헤더 높이를 측정해 CSS 변수로 빼주는 방식으로 처리한다.
  useEffect(() => {
    const page = pageRef.current
    const header =
      document.querySelector('body > #root header') ??
      document.querySelector('header')

    if (!page || !header) return undefined

    const updateHeaderHeight = () => {
      page.style.setProperty(
        '--auth-header-height',
        `${header.getBoundingClientRect().height}px`
      )
    }

    updateHeaderHeight()

    const resizeObserver = new ResizeObserver(updateHeaderHeight)
    resizeObserver.observe(header)
    window.addEventListener('resize', updateHeaderHeight)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', updateHeaderHeight)
      page.style.removeProperty('--auth-header-height')
    }
  }, [])

  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user) => {
      if (user && !user.isAnonymous && !justSignedUpRef.current) {
        navigate(PATHS.home, { replace: true })
      }
    })

    return unsubscribe
  }, [navigate])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target

    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const isPasswordValid =
    form.password.length === 0 || PASSWORD_RULE.test(form.password)

  const isPasswordMatched =
    form.passwordConfirm.length === 0 ||
    form.password === form.passwordConfirm

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (submittingRef.current) return
    submittingRef.current = true

    setError('')

    if (!PASSWORD_RULE.test(form.password)) {
      setError('비밀번호는 8자 이상, 영문/숫자/특수문자를 조합해야 합니다.')
      submittingRef.current = false
      return
    }

    if (form.password !== form.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.')
      submittingRef.current = false
      return
    }

    if (!form.agree) {
      setError('약관에 동의해주세요.')
      submittingRef.current = false
      return
    }

    setIsSubmitting(true)
    justSignedUpRef.current = true

    try {
      await signup({
        nickname: form.nickname,
        email: form.email,
        password: form.password,
      })

      setShowSuccessModal(true)
    } catch (err) {
      setError(getSignupErrorMessage(err))
    } finally {
      setIsSubmitting(false)
      submittingRef.current = false
    }
  }

  const handleGoToPreference = () => {
    navigate(PATHS.preference)
  }

  const handleCloseModal = () => {
    setShowSuccessModal(false)
    navigate(PATHS.home)
  }

  return (
    <div className={styles.signup} ref={pageRef}>
      <div className={styles.visual}>
        <img src={makdongImage} alt="막동이" />
      </div>

      <div className={styles.container}>
        <div className={styles.formArea}>
          <h1>반갑습니다, 나리</h1>

          <form onSubmit={handleSubmit}>
            <label htmlFor="email">이메일</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="이메일을 입력해주세요"
              value={form.email}
              onChange={handleChange}
              required
            />

            <label htmlFor="nickname">닉네임</label>
            <input
              id="nickname"
              name="nickname"
              type="text"
              placeholder="닉네임을 입력해주세요"
              value={form.nickname}
              onChange={handleChange}
              required
            />

            <label htmlFor="password">비밀번호</label>

            <div className={styles.passwordField}>
              <input
                id="password"
                name="password"
                type={isPasswordVisible ? 'text' : 'password'}
                placeholder="비밀번호를 입력해주세요"
                value={form.password}
                onChange={handleChange}
                required
              />

              <button
                type="button"
                className={styles.togglePasswordButton}
                onClick={() => setIsPasswordVisible((prev) => !prev)}
                aria-label={
                  isPasswordVisible
                    ? '비밀번호 숨기기'
                    : '비밀번호 보기'
                }
              >
                <img
                  src={
                    isPasswordVisible
                      ? eyeNoIconImage
                      : eyeIconImage
                  }
                  alt=""
                  className={styles.eyeIcon}
                />
              </button>
            </div>

            <p className={isPasswordValid ? styles.hint : styles.hintError}>
              8자 이상, 영문/숫자/특수문자 조합으로 입력해주세요.
            </p>

            <label htmlFor="passwordConfirm">비밀번호 확인</label>

            <input
              id="passwordConfirm"
              name="passwordConfirm"
              type="password"
              placeholder="비밀번호를 다시 입력해주세요"
              value={form.passwordConfirm}
              onChange={handleChange}
              required
            />

            {form.passwordConfirm.length > 0 && (
              <p
                className={
                  isPasswordMatched
                    ? styles.hint
                    : styles.hintError
                }
              >
                {isPasswordMatched
                  ? '비밀번호가 일치합니다.'
                  : '비밀번호가 일치하지 않습니다.'}
              </p>
            )}

            <div className={styles.agreeGroup}>
              <span className={styles.fieldLabel}>약관 동의</span>

              <label
                htmlFor="agree"
                className={styles.agreeLabel}
              >
                <input
                  id="agree"
                  name="agree"
                  type="checkbox"
                  checked={form.agree}
                  onChange={handleChange}
                />

                <span
                  className={styles.checkboxBox}
                  aria-hidden="true"
                />

                [필수] 서비스 이용약관 및 개인정보 처리방침에 동의합니다.
              </label>
            </div>

            {error && (
              <p className={styles.error}>
                {error}
              </p>
            )}

            <button
              type="submit"
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? '가입 중...' : '회원가입'}
            </button>
          </form>

          <p className={styles.switchLink}>
            이미 계정이 있으신가요?

            <Link
              to={PATHS.login}
              className={styles.switchLinkAction}
            >
              로그인
            </Link>
          </p>
        </div>
      </div>

      {showSuccessModal && (
        <div
          className={styles.overlay}
          onClick={handleCloseModal}
        >
          <div
            className={styles.successModal}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={styles.closeButton}
              onClick={handleCloseModal}
              aria-label="닫기"
            >
              <img
                src={closeIconImage}
                alt=""
              />
            </button>

            <img
              src={checkIconImage}
              alt=""
              className={styles.checkIcon}
            />

            <h2>회원가입이 완료되었습니다!</h2>

            <p>
              자작에서 나에게 꼭 맞는 한 잔을 만나보세요.
            </p>

            <hr className={styles.divider} />

            <div className={styles.previewBox}>
              <img
                src={clipboardIconImage}
                alt=""
                className={styles.clipboardIcon}
              />

              <p>
                간단한 5가지 질문에 답하면
                <br />
                막동이가 취향에 맞는
                <br />
                <span className={styles.highlight}>
                  전통주와 안주
                </span>
                를 추천해드려요.
              </p>
            </div>

            <button
              type="button"
              className={`${styles.submitButton} ${styles.modalActionButton}`}
              onClick={handleGoToPreference}
            >
              취향 프로필 만들기
            </button>

            <p className={styles.laterHint}>
              <span aria-hidden="true">⏱</span>
              {' '}
              약 1분이면 완료할 수 있어요.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Signup