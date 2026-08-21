import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'

import { login, subscribeToAuthState } from '../../firebase/auth'
import { PATHS } from '../../routes/paths'
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
    default:
      return '로그인 중 오류가 발생했습니다.'
  }
}

const Login = () => {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    email: '',
    password: '',
    rememberMe: false,
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 이미 로그인된 사용자가 /login에 접근하면 메인으로 이동 (AGENTS.md Routes 규칙)
  // 단, 익명(비회원) 로그인 상태는 여기 해당하지 않으므로 제외한다.
  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user) => {
      if (user && !user.isAnonymous) {
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await login(form.email, form.password, form.rememberMe)
      navigate(PATHS.home)
    } catch (err) {
      setError(getLoginErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className={styles.login}>
      <div className={styles.visual}>
        {/* 막동이 캐릭터 이미지 - 자산 준비되는 대로 교체 */}
        {/* <img src={makdongImage} alt="막동이" /> */}
      </div>

      <div className={styles.formArea}>
        <h1>어서오세요, 나리</h1>

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

          <label htmlFor="password">비밀번호</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="비밀번호를 입력해주세요"
            value={form.password}
            onChange={handleChange}
            required
          />
          <p className={styles.hint}>
            비밀번호는 8자 이상, 영문/숫자/특수문자 조합이어야 합니다.
          </p>

          {error && <p className={styles.error}>{error}</p>}

          <button type="submit" className={styles.submitButton} disabled={isSubmitting}>
            {isSubmitting ? '로그인 중...' : '로그인'}
          </button>

          <div className={styles.subRow}>
            <label className={styles.rememberLabel}>
              <input
                name="rememberMe"
                type="checkbox"
                checked={form.rememberMe}
                onChange={handleChange}
              />
              로그인 상태 유지
            </label>
            {/* 비밀번호 찾기 기능은 구현 범위 확정 전까지 링크만 노출 */}
            <span className={styles.forgotPassword}>비밀번호 찾기</span>
          </div>
        </form>

        <p className={styles.switchLink}>
          아직 회원이 아니신가요? 회원이 되어 막동이의 추천을 받아보세요.{' '}
          <Link to={PATHS.signup}>회원가입</Link>
        </p>
      </div>
    </div>
  )
}

export default Login