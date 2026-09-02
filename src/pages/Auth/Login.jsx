import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'

import { login, subscribeToAuthState } from '../../firebase/auth'
import { PATHS } from '../../routes/paths'

import makdongImage from '../../assets/characters/M007_Poses03.png'
import eyeIconImage from '../../assets/icons/eye.png'
import eyeNoIconImage from '../../assets/icons/eyeNO.png'

import styles from './Login.module.scss'


const getLoginErrorMessage = (error) => {
  switch (error.code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return '이메일 또는 비밀번호가 올바르지 않습니다.'

    case 'auth/invalid-email':
      return '올바른 이메일 형식이 아닙니다.'

    case 'auth/too-many-requests':
      return '잠시 후 다시 시도해주세요.'

    case 'auth/account-suspended':
      return '이용이 제한된 계정입니다. 고객센터로 문의해주세요.'

    default:
      return '로그인 중 오류가 발생했습니다.'
  }
}


const Login = () => {
  const navigate = useNavigate()
  const pageRef = useRef(null)
  const isCheckingStatusRef = useRef(false)

  const [form, setForm] = useState({
    email: '',
    password: '',
    rememberMe: false,
  })

  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)


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
      if (isCheckingStatusRef.current) return

      if (user && !user.isAnonymous) {
        navigate(PATHS.home, {
          replace: true,
          state: {
            skipJourney: true,
          },
        })
      }
    })


    return unsubscribe
  }, [navigate])


  const handleChange = (e) => {
    const {
      name,
      value,
      type,
      checked,
    } = e.target


    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }


  const handleSubmit = async (e) => {
    e.preventDefault()

    setError('')
    setIsSubmitting(true)

    isCheckingStatusRef.current = true


    try {
      await login(
        form.email,
        form.password,
        form.rememberMe
      )


      navigate(PATHS.home, {
        replace: true,
        state: {
          skipJourney: true,
        },
      })
    } catch (err) {
      setError(getLoginErrorMessage(err))
    } finally {
      setIsSubmitting(false)

      isCheckingStatusRef.current = false
    }
  }


  return (
    <div
      className={styles.login}
      ref={pageRef}
    >
      <div className={styles.visual}>
        <img
          src={makdongImage}
          alt="막동이"
        />
      </div>


      <div className={styles.container}>
        <div className={styles.formArea}>

          <h1>
            어서오세요, 나리
          </h1>


          <form onSubmit={handleSubmit}>

            <label htmlFor="email">
              이메일
            </label>

            <input
              id="email"
              name="email"
              type="email"
              placeholder="이메일을 입력해주세요"
              value={form.email}
              onChange={handleChange}
              required
            />


            <label htmlFor="password">
              비밀번호
            </label>


            <div className={styles.passwordField}>

              <input
                id="password"
                name="password"
                type={
                  isPasswordVisible
                    ? 'text'
                    : 'password'
                }
                placeholder="비밀번호를 입력해주세요"
                value={form.password}
                onChange={handleChange}
                required
              />


              <button
                type="button"
                className={styles.togglePasswordButton}
                onClick={() =>
                  setIsPasswordVisible((prev) => !prev)
                }
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


            <p className={styles.hint}>
              비밀번호는 8자 이상, 영문/숫자/특수문자 조합이어야 합니다.
            </p>


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
              {
                isSubmitting
                  ? '로그인 중...'
                  : '로그인'
              }
            </button>


            <div className={styles.subRow}>

              <label className={styles.rememberLabel}>
                <input
                  name="rememberMe"
                  type="checkbox"
                  checked={form.rememberMe}
                  onChange={handleChange}
                />

                <span
                  className={styles.checkboxBox}
                  aria-hidden="true"
                />

                로그인 상태 유지
              </label>


              <span className={styles.forgotPassword}>
                비밀번호 찾기
              </span>

            </div>

          </form>


          <p className={styles.switchLink}>

            <span>
              아직 회원이 아니신가요?
              <br />
              회원이 되어 막동이의 추천을 받아보세요.
            </span>

            <Link
              to={PATHS.signup}
              className={styles.switchLinkAction}
            >
              회원가입
            </Link>

          </p>

        </div>
      </div>
    </div>
  )
}


export default Login