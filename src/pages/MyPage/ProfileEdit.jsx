import {
  useEffect,
  useState,
} from 'react'

import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateEmail,
  updatePassword,
  updateProfile,
} from 'firebase/auth'

import {
  serverTimestamp,
} from 'firebase/firestore'

import {
  getCurrentUserData,
  subscribeToAuthState,
} from '../../firebase/auth'

import {
  updateDocument,
} from '../../firebase/firestore'

import MyPageHeader from '../../components/mypage/MyPageHeader'

import {
  getAvatarStorageKey,
  profileAvatars as avatarPresets,
} from './profileAvatars'

import styles from './ProfileEdit.module.scss'


const VERIFY_VALID_TIME =
  10 * 60 * 1000

const MAX_NAME_LENGTH = 20

const ACCOUNT_ID_PATTERN =
  /^[A-Za-z0-9._-]{4,20}$/

const NAME_PATTERN =
  /^[가-힣A-Za-z\s·.'-]+$/

const EMAIL_PATTERN =
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/


const EMPTY_ERRORS = {
  accountId: '',
  newPassword: '',
  confirmPassword: '',
  name: '',
  email: '',
  phone: '',
  birthDate: '',
}


const normalizePhone = (
  value
) =>
  String(value || '')
    .replace(/\D/g, '')
    .slice(0, 11)


const formatPhone = (
  value
) => {
  const numbers =
    normalizePhone(value)

  if (
    numbers.length <= 3
  ) {
    return numbers
  }

  if (
    numbers.length <= 7
  ) {
    return `${numbers.slice(
      0,
      3
    )}-${numbers.slice(3)}`
  }

  return `${numbers.slice(
    0,
    3
  )}-${numbers.slice(
    3,
    7
  )}-${numbers.slice(7)}`
}


const isValidPhone = (
  value
) =>
  /^010\d{8}$/.test(
    normalizePhone(value)
  )


const isPossiblePhonePrefix = (
  value
) => {
  const numbers =
    normalizePhone(value)

  if (!numbers) {
    return true
  }

  if (
    numbers.length <= 3
  ) {
    return '010'.startsWith(
      numbers
    )
  }

  return numbers.startsWith(
    '010'
  )
}


const getInitialForm = (
  user,
  userData
) => ({
  accountId:
    userData?.accountId ||
    user?.email?.split('@')[0] ||
    '',

  newPassword: '',
  confirmPassword: '',

  name:
    userData?.nickname ||
    user?.displayName ||
    '',

  email:
    user?.email ||
    userData?.email ||
    '',

  phone:
    normalizePhone(
      userData?.phone
    ),

  gender:
    userData?.gender ||
    'unset',

  birthDate:
    userData?.birthDate ||
    '',

  marketingAgree:
    Boolean(
      userData?.marketingAgree ??
      userData?.marketingConsent ??
      false
    ),

  marketingSms:
    Boolean(
      userData?.marketingSms ??
      userData?.smsConsent ??
      false
    ),

  marketingEmail:
    Boolean(
      userData?.marketingEmail ??
      userData?.emailConsent ??
      false
    ),
})


const getTodayString = () => {
  const now =
    new Date()

  const year =
    now.getFullYear()

  const month =
    String(
      now.getMonth() + 1
    ).padStart(2, '0')

  const day =
    String(
      now.getDate()
    ).padStart(2, '0')

  return `${year}-${month}-${day}`
}


const LockIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect
      x="5"
      y="10"
      width="14"
      height="10"
      rx="2"
    />

    <path d="M8 10V7a4 4 0 0 1 8 0v3" />
  </svg>
)


const EditIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 20h9" />

    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
  </svg>
)


const ProfileEdit = () => {
  const [
    currentUser,
    setCurrentUser,
  ] = useState(null)

  const [
    userData,
    setUserData,
  ] = useState(null)

  const [
    isLoading,
    setIsLoading,
  ] = useState(true)

  const [
    isEditing,
    setIsEditing,
  ] = useState(false)

  const [
    isPasswordModalOpen,
    setIsPasswordModalOpen,
  ] = useState(false)

  const [
    verifyPassword,
    setVerifyPassword,
  ] = useState('')

  const [
    verifyError,
    setVerifyError,
  ] = useState('')

  const [
    isVerifying,
    setIsVerifying,
  ] = useState(false)

  const [
    verifiedAt,
    setVerifiedAt,
  ] = useState(null)

  const [
    form,
    setForm,
  ] = useState(
    () =>
      getInitialForm(
        null,
        null
      )
  )

  const [
    fieldErrors,
    setFieldErrors,
  ] = useState(
    EMPTY_ERRORS
  )

  const [
    selectedAvatarId,
    setSelectedAvatarId,
  ] = useState(
    'profile-makdong-default'
  )

  const [
    notice,
    setNotice,
  ] = useState('')

  const [
    formError,
    setFormError,
  ] = useState('')

  const [
    isSaving,
    setIsSaving,
  ] = useState(false)


  /* =========================
     회원 정보 불러오기
  ========================= */

  useEffect(() => {
    let isActive = true

    const unsubscribe =
      subscribeToAuthState(
        async (user) => {
          if (!isActive) {
            return
          }

          setCurrentUser(
            user
          )

          if (!user) {
            setUserData(null)
            setIsLoading(false)

            return
          }

          setIsLoading(true)

          try {
            const data =
              await getCurrentUserData(
                user.uid
              )

            if (!isActive) {
              return
            }

            setUserData(
              data
            )

            setForm(
              getInitialForm(
                user,
                data
              )
            )

            const savedAvatarId =
              localStorage.getItem(
                getAvatarStorageKey(
                  user.uid
                )
              )

            if (
              avatarPresets.some(
                (avatar) =>
                  avatar.id ===
                  savedAvatarId
              )
            ) {
              setSelectedAvatarId(
                savedAvatarId
              )
            }
          } catch (error) {
            console.error(
              '회원 정보 조회 실패:',
              error
            )

            if (isActive) {
              setUserData(null)

              setForm(
                getInitialForm(
                  user,
                  null
                )
              )
            }
          } finally {
            if (isActive) {
              setIsLoading(false)
            }
          }
        }
      )

    return () => {
      isActive = false

      unsubscribe()
    }
  }, [])


  const memberName =
    userData?.nickname ||
    currentUser?.displayName ||
    currentUser?.email?.split(
      '@'
    )[0] ||
    '회원'


    const memberBadgeLabel =
  userData?.role === 'admin'
    ? '관리자'
    : userData?.grade === 'vip' ||
        userData?.membershipLevel === 'vip'
      ? 'VIP'
      : '일반 회원'

  const currentAvatar =
    avatarPresets.find(
      (avatar) =>
        avatar.id ===
        selectedAvatarId
    ) ||
    avatarPresets[0]


  /* =========================
     NOTICE
  ========================= */

  const showNotice = (
    message
  ) => {
    setNotice(message)

    window.setTimeout(
      () => {
        setNotice('')
      },
      1800
    )
  }


  /* =========================
     FIELD ERROR
  ========================= */

  const setFieldError = (
    name,
    message
  ) => {
    setFieldErrors(
      (current) => ({
        ...current,
        [name]: message,
      })
    )
  }


  const resetErrors = () => {
    setFieldErrors(
      EMPTY_ERRORS
    )

    setFormError('')
  }


  /* =========================
     개인정보 수정 열기
  ========================= */

  const handleOpenEdit = () => {
    setVerifyPassword('')
    setVerifyError('')

    setIsPasswordModalOpen(
      true
    )
  }


  const handleCloseVerifyModal =
    () => {
      if (isVerifying) {
        return
      }

      setVerifyPassword('')
      setVerifyError('')

      setIsPasswordModalOpen(
        false
      )
    }


  /* =========================
     Firebase 재인증
  ========================= */

  const handleVerifyPassword =
    async () => {
      if (
        !currentUser ||
        !currentUser.email
      ) {
        setVerifyError(
          '로그인 정보를 확인할 수 없습니다.'
        )

        return
      }

      if (
        !verifyPassword.trim()
      ) {
        setVerifyError(
          '비밀번호를 입력해주세요.'
        )

        return
      }

      try {
        setIsVerifying(true)
        setVerifyError('')

        const credential =
          EmailAuthProvider
            .credential(
              currentUser.email,
              verifyPassword
            )

        await reauthenticateWithCredential(
          currentUser,
          credential
        )

        setVerifiedAt(
          Date.now()
        )

        setVerifyPassword('')

        setIsPasswordModalOpen(
          false
        )

        setForm(
          getInitialForm(
            currentUser,
            userData
          )
        )

        resetErrors()

        setIsEditing(true)
      } catch (error) {
        console.error(
          '비밀번호 재인증 실패:',
          error
        )

        if (
          error.code ===
            'auth/invalid-credential' ||
          error.code ===
            'auth/wrong-password'
        ) {
          setVerifyError(
            '비밀번호가 일치하지 않습니다.'
          )
        } else if (
          error.code ===
          'auth/too-many-requests'
        ) {
          setVerifyError(
            '인증 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.'
          )
        } else {
          setVerifyError(
            '본인 인증에 실패했습니다. 다시 확인해주세요.'
          )
        }
      } finally {
        setIsVerifying(false)
      }
    }


  /* =========================
     입력 변경
  ========================= */

  const handleChange = (
    event
  ) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target

    setFormError('')


    /* 아이디 */

    if (
      name === 'accountId'
    ) {
      setForm(
        (current) => ({
          ...current,
          accountId: value,
        })
      )

      if (
        value &&
        !/^[A-Za-z0-9._-]*$/.test(
          value
        )
      ) {
        setFieldError(
          'accountId',
          '아이디는 영문, 숫자, ., _, - 만 사용할 수 있습니다.'
        )
      } else {
        setFieldError(
          'accountId',
          ''
        )
      }

      return
    }


    /* 이름 */

    if (
      name === 'name'
    ) {
      setForm(
        (current) => ({
          ...current,
          name: value,
        })
      )

      const trimmed =
        value.trim()

      if (
        trimmed &&
        !NAME_PATTERN.test(
          trimmed
        )
      ) {
        setFieldError(
          'name',
          '이름은 한글 또는 영문으로 입력해주세요.'
        )
      } else {
        setFieldError(
          'name',
          ''
        )
      }

      return
    }


    /* 휴대폰 */

    if (
      name === 'phone'
    ) {
      const numbers =
        normalizePhone(value)

      setForm(
        (current) => ({
          ...current,
          phone: numbers,
        })
      )

      if (
        numbers &&
        !isPossiblePhonePrefix(
          numbers
        )
      ) {
        setFieldError(
          'phone',
          '휴대폰 번호는 010으로 시작해야 합니다.'
        )
      } else {
        setFieldError(
          'phone',
          ''
        )
      }

      return
    }


    /* 새 비밀번호 */

    if (
      name === 'newPassword'
    ) {
      setForm(
        (current) => ({
          ...current,
          newPassword: value,
        })
      )

      if (
        value &&
        value.length < 6
      ) {
        setFieldError(
          'newPassword',
          '새 비밀번호는 6자 이상 입력해주세요.'
        )
      } else if (
        /\s/.test(value)
      ) {
        setFieldError(
          'newPassword',
          '비밀번호에는 공백을 사용할 수 없습니다.'
        )
      } else {
        setFieldError(
          'newPassword',
          ''
        )
      }

      if (
        form.confirmPassword
      ) {
        setFieldError(
          'confirmPassword',
          value ===
            form.confirmPassword
            ? ''
            : '새 비밀번호가 일치하지 않습니다.'
        )
      }

      return
    }


    /* 비밀번호 확인 */

    if (
      name ===
      'confirmPassword'
    ) {
      setForm(
        (current) => ({
          ...current,
          confirmPassword:
            value,
        })
      )

      setFieldError(
        'confirmPassword',
        value &&
          value !==
            form.newPassword
          ? '새 비밀번호가 일치하지 않습니다.'
          : ''
      )

      return
    }


    /* 마케팅 전체 */

    if (
      name ===
      'marketingAgree'
    ) {
      setForm(
        (current) => ({
          ...current,

          marketingAgree:
            checked,

          ...(!checked
            ? {
                marketingSms:
                  false,

                marketingEmail:
                  false,
              }
            : {}),
        })
      )

      return
    }


    /* 개별 마케팅 */

    if (
      name ===
        'marketingSms' ||
      name ===
        'marketingEmail'
    ) {
      setForm(
        (current) => ({
          ...current,

          [name]:
            checked,

          marketingAgree:
            checked
              ? true
              : name ===
                  'marketingSms'
                ? current
                    .marketingEmail
                : current
                    .marketingSms,
        })
      )

      return
    }


    setForm(
      (current) => ({
        ...current,

        [name]:
          type ===
          'checkbox'
            ? checked
            : value,
      })
    )


    if (
      name in fieldErrors
    ) {
      setFieldError(
        name,
        ''
      )
    }
  }


  /* =========================
     BLUR VALIDATION
  ========================= */

  const handleBlur = (
    event
  ) => {
    const {
      name,
      value,
    } = event.target


    if (
      name === 'accountId'
    ) {
      const nextValue =
        value.trim()

      if (!nextValue) {
        setFieldError(
          'accountId',
          '아이디를 입력해주세요.'
        )
      } else if (
        !ACCOUNT_ID_PATTERN.test(
          nextValue
        )
      ) {
        setFieldError(
          'accountId',
          '아이디는 4~20자의 영문, 숫자, ., _, - 로 입력해주세요.'
        )
      }

      return
    }


    if (
      name === 'name'
    ) {
      const nextValue =
        value.trim()

      if (!nextValue) {
        setFieldError(
          'name',
          '이름을 입력해주세요.'
        )
      } else if (
        !NAME_PATTERN.test(
          nextValue
        )
      ) {
        setFieldError(
          'name',
          '이름은 한글 또는 영문으로 입력해주세요.'
        )
      }

      return
    }


    if (
      name === 'email'
    ) {
      const email =
        value.trim()

      if (!email) {
        setFieldError(
          'email',
          '이메일을 입력해주세요.'
        )
      } else if (
        !EMAIL_PATTERN.test(
          email
        )
      ) {
        setFieldError(
          'email',
          '올바른 이메일 형식을 입력해주세요.'
        )
      } else {
        setFieldError(
          'email',
          ''
        )
      }

      return
    }


    if (
      name === 'phone'
    ) {
      const numbers =
        normalizePhone(value)

      if (!numbers) {
        setFieldError(
          'phone',
          '휴대폰 번호를 입력해주세요.'
        )
      } else if (
        !isPossiblePhonePrefix(
          numbers
        )
      ) {
        setFieldError(
          'phone',
          '휴대폰 번호는 010으로 시작해야 합니다.'
        )
      } else if (
        numbers.length !==
        11
      ) {
        setFieldError(
          'phone',
          '010으로 시작하는 휴대폰 번호 11자리를 입력해주세요.'
        )
      } else if (
        !isValidPhone(
          numbers
        )
      ) {
        setFieldError(
          'phone',
          '올바른 휴대폰 번호를 입력해주세요.'
        )
      } else {
        setFieldError(
          'phone',
          ''
        )
      }

      return
    }


    if (
      name === 'newPassword'
    ) {
      if (
        value &&
        value.length < 6
      ) {
        setFieldError(
          'newPassword',
          '새 비밀번호는 6자 이상 입력해주세요.'
        )
      }

      return
    }


    if (
      name ===
      'confirmPassword'
    ) {
      if (
        form.newPassword &&
        value !==
          form.newPassword
      ) {
        setFieldError(
          'confirmPassword',
          '새 비밀번호가 일치하지 않습니다.'
        )
      }

      return
    }


    if (
      name === 'birthDate' &&
      value &&
      value > getTodayString()
    ) {
      setFieldError(
        'birthDate',
        '생년월일은 오늘 이후 날짜를 선택할 수 없습니다.'
      )
    }
  }


  /* =========================
     프로필 이미지
  ========================= */

  const handleSaveAvatar = () => {
    if (!currentUser) {
      return
    }

    localStorage.setItem(
      getAvatarStorageKey(
        currentUser.uid
      ),
      selectedAvatarId
    )

    window.dispatchEvent(
      new Event(
        'jajak-profile-avatar-change'
      )
    )

    showNotice(
      '프로필 이미지가 변경되었습니다.'
    )
  }


  /* =========================
     재인증 유효 시간
  ========================= */

  const isVerificationValid =
    () => {
      if (!verifiedAt) {
        return false
      }

      return (
        Date.now() -
          verifiedAt <
        VERIFY_VALID_TIME
      )
    }


  /* =========================
     저장 검증
  ========================= */

  const validateForm = () => {
    const errors = {
      ...EMPTY_ERRORS,
    }

    const accountId =
      form.accountId.trim()

    const name =
      form.name
        .trim()
        .replace(
          /\s+/g,
          ' '
        )

    const email =
      form.email.trim()

    const phone =
      normalizePhone(
        form.phone
      )


    if (!accountId) {
      errors.accountId =
        '아이디를 입력해주세요.'
    } else if (
      !ACCOUNT_ID_PATTERN.test(
        accountId
      )
    ) {
      errors.accountId =
        '아이디는 4~20자의 영문, 숫자, ., _, - 로 입력해주세요.'
    }


    if (
      form.newPassword
    ) {
      if (
        form.newPassword.length <
        6
      ) {
        errors.newPassword =
          '새 비밀번호는 6자 이상 입력해주세요.'
      } else if (
        /\s/.test(
          form.newPassword
        )
      ) {
        errors.newPassword =
          '비밀번호에는 공백을 사용할 수 없습니다.'
      }


      if (
        !form.confirmPassword
      ) {
        errors.confirmPassword =
          '새 비밀번호를 한 번 더 입력해주세요.'
      } else if (
        form.newPassword !==
        form.confirmPassword
      ) {
        errors.confirmPassword =
          '새 비밀번호가 일치하지 않습니다.'
      }
    } else if (
      form.confirmPassword
    ) {
      errors.newPassword =
        '새 비밀번호를 입력해주세요.'
    }


    if (!name) {
      errors.name =
        '이름을 입력해주세요.'
    } else if (
      !NAME_PATTERN.test(name)
    ) {
      errors.name =
        '이름은 한글 또는 영문으로 입력해주세요.'
    } else if (
      name.length >
      MAX_NAME_LENGTH
    ) {
      errors.name =
        `이름은 ${MAX_NAME_LENGTH}자 이하로 입력해주세요.`
    }


    if (!email) {
      errors.email =
        '이메일을 입력해주세요.'
    } else if (
      !EMAIL_PATTERN.test(
        email
      )
    ) {
      errors.email =
        '올바른 이메일 형식을 입력해주세요.'
    }


    if (!phone) {
      errors.phone =
        '휴대폰 번호를 입력해주세요.'
    } else if (
      !phone.startsWith(
        '010'
      )
    ) {
      errors.phone =
        '휴대폰 번호는 010으로 시작해야 합니다.'
    } else if (
      !isValidPhone(
        phone
      )
    ) {
      errors.phone =
        '010으로 시작하는 휴대폰 번호 11자리를 입력해주세요.'
    }


    if (
      form.birthDate &&
      form.birthDate >
        getTodayString()
    ) {
      errors.birthDate =
        '생년월일은 오늘 이후 날짜를 선택할 수 없습니다.'
    }


    setFieldErrors(
      errors
    )


    return !Object.values(
      errors
    ).some(Boolean)
  }


  /* =========================
     회원 정보 저장
  ========================= */

  const handleSubmit =
    async (event) => {
      event.preventDefault()


      if (
        !isVerificationValid()
      ) {
        setIsEditing(false)

        setVerifiedAt(null)

        setVerifyPassword('')

        setVerifyError(
          '보안을 위해 비밀번호를 다시 확인해주세요.'
        )

        setIsPasswordModalOpen(
          true
        )

        return
      }


      if (!currentUser) {
        setFormError(
          '로그인 정보를 확인할 수 없습니다.'
        )

        return
      }


      if (!validateForm()) {
        return
      }


      const accountId =
        form.accountId.trim()

      const name =
        form.name
          .trim()
          .replace(
            /\s+/g,
            ' '
          )

      const email =
        form.email.trim()

      const phone =
        normalizePhone(
          form.phone
        )


      try {
        setIsSaving(true)

        setFormError('')


        /* 이름 변경 */

        if (
          currentUser.displayName !==
          name
        ) {
          await updateProfile(
            currentUser,
            {
              displayName:
                name,
            }
          )
        }


        /* 이메일 변경 */

        if (
          currentUser.email !==
          email
        ) {
          await updateEmail(
            currentUser,
            email
          )
        }


        /* 비밀번호 변경 */

        if (
          form.newPassword
        ) {
          await updatePassword(
            currentUser,
            form.newPassword
          )
        }


        const nextUserData = {
          accountId,

          nickname:
            name,

          email,

          phone,

          gender:
            form.gender,

          birthDate:
            form.birthDate,

          marketingAgree:
            form.marketingAgree,

          marketingSms:
            form.marketingSms,

          marketingEmail:
            form.marketingEmail,

          updatedAt:
            serverTimestamp(),
        }


        await updateDocument(
          'users',
          currentUser.uid,
          nextUserData
        )


        setUserData(
          (current) => ({
            ...current,
            ...nextUserData,

            updatedAt:
              new Date(),
          })
        )


        setForm(
          getInitialForm(
            {
              ...currentUser,

              displayName:
                name,

              email,
            },
            {
              ...userData,
              ...nextUserData,
            }
          )
        )


        window.dispatchEvent(
          new Event(
            'jajak-profile-change'
          )
        )


        setVerifiedAt(null)

        setIsEditing(false)


        showNotice(
          form.newPassword
            ? '회원 정보와 비밀번호가 수정되었습니다.'
            : '회원 정보가 수정되었습니다.'
        )
      } catch (error) {
        console.error(
          '회원 정보 수정 실패:',
          error
        )


        if (
          error.code ===
          'auth/requires-recent-login'
        ) {
          setVerifiedAt(null)

          setIsEditing(false)

          setVerifyError(
            '보안을 위해 비밀번호를 다시 확인해주세요.'
          )

          setIsPasswordModalOpen(
            true
          )

          return
        }


        if (
          error.code ===
          'auth/email-already-in-use'
        ) {
          setFieldError(
            'email',
            '이미 사용 중인 이메일입니다.'
          )

          return
        }


        if (
          error.code ===
          'auth/invalid-email'
        ) {
          setFieldError(
            'email',
            '올바른 이메일 형식을 입력해주세요.'
          )

          return
        }


        if (
          error.code ===
          'auth/weak-password'
        ) {
          setFieldError(
            'newPassword',
            '더 안전한 비밀번호를 입력해주세요.'
          )

          return
        }


        setFormError(
          '회원 정보 수정 중 오류가 발생했습니다.'
        )
      } finally {
        setIsSaving(false)
      }
    }


  const handleCancelEdit =
    () => {
      setIsEditing(false)

      setVerifiedAt(null)

      resetErrors()

      setForm(
        getInitialForm(
          currentUser,
          userData
        )
      )
    }


  /* =========================
     LOADING
  ========================= */

  if (isLoading) {
    return (
      <section
        className={
          styles.page
        }
      >
        <div
          className={
            styles.profileCard
          }
        >
          <MyPageHeader
            title="회원 정보 관리"
          />

          <div
            className={
              styles.stateBox
            }
          >
            <span
              className={
                styles.loadingSpinner
              }
            />

            <strong>
              회원 정보를 불러오는 중입니다.
            </strong>
          </div>
        </div>
      </section>
    )
  }


  return (
    <section
      className={
        styles.page
      }
    >
      <div
        className={
          styles.profileCard
        }
      >
        <MyPageHeader
          title="회원 정보 관리"
        />


        {!isEditing ? (
          <>
            {/* =========================
                계정 요약
            ========================= */}

            <section
              className={
                styles.accountSummary
              }
            >
              <div
                className={
                  styles.currentAvatar
                }
              >
                <img
                  src={
                    currentAvatar.src
                  }
                  alt=""
                />
              </div>


              <div
                className={
                  styles.accountInfo
                }
              >
                <div
  className={
    styles.accountNameRow
  }
>
  <strong>
    {memberName}
  </strong>

  <span
    className={
      styles.levelText
    }
  >
    나으리님
  </span>

  <span
    className={
      styles.memberBadge
    }
  >
    {memberBadgeLabel}
  </span>
</div>

                <p>
                  {currentUser?.email ||
                    '-'}
                </p>
              </div>


              <button
                type="button"
                className={
                  styles.editInfoButton
                }
                onClick={
                  handleOpenEdit
                }
              >
                <EditIcon />

                개인 정보 수정
              </button>
            </section>


            {/* =========================
                프로필 이미지
            ========================= */}

            <section
              className={
                styles.avatarSection
              }
            >
              <h3>
                프로필 이미지
              </h3>


              <div
                className={
                  styles.avatarPicker
                }
              >
                {avatarPresets.map(
                  (avatar) => (
                    <button
                      key={
                        avatar.id
                      }
                      type="button"
                      aria-label={
                        avatar.label
                      }
                      aria-pressed={
                        selectedAvatarId ===
                        avatar.id
                      }
                      className={`${styles.avatarOption} ${
                        selectedAvatarId ===
                        avatar.id
                          ? styles.selectedAvatar
                          : ''
                      }`}
                      onClick={() =>
                        setSelectedAvatarId(
                          avatar.id
                        )
                      }
                    >
                      <img
                        src={
                          avatar.src
                        }
                        alt=""
                      />
                    </button>
                  )
                )}
              </div>


              <div
                className={
                  styles.avatarActions
                }
              >
                <button
                  type="button"
                  className={
                    styles.avatarSaveButton
                  }
                  onClick={
                    handleSaveAvatar
                  }
                >
                  프로필 이미지 저장
                </button>
              </div>
            </section>
          </>
        ) : (
          <form
            className={
              styles.editForm
            }
            onSubmit={
              handleSubmit
            }
            noValidate
          >
            <div
              className={
                styles.editHeader
              }
            >
              <h3>
                개인 정보 수정
              </h3>

              <span
                className={
                  styles.verifiedBadge
                }
              >
                본인 인증 완료
              </span>
            </div>


            {/* =========================
                계정 정보
            ========================= */}

            <section
              className={
                styles.formSection
              }
            >
              <h4>
                계정 정보
              </h4>


              <div
                className={
                  styles.formRow
                }
              >
                <label
                  htmlFor="profile-id"
                  className={
                    styles.formLabel
                  }
                >
                  아이디
                </label>

                <div
                  className={
                    styles.inputArea
                  }
                >
                  <input
                    id="profile-id"
                    type="text"
                    name="accountId"
                    value={
                      form.accountId
                    }
                    maxLength={20}
                    placeholder="아이디 입력"
                    className={
                      fieldErrors.accountId
                        ? styles.inputError
                        : ''
                    }
                    onChange={
                      handleChange
                    }
                    onBlur={
                      handleBlur
                    }
                  />

                  {fieldErrors.accountId && (
                    <p
                      className={
                        styles.fieldError
                      }
                    >
                      {
                        fieldErrors.accountId
                      }
                    </p>
                  )}
                </div>
              </div>


              <div
                className={
                  styles.formRow
                }
              >
                <label
                  htmlFor="new-password"
                  className={
                    styles.formLabel
                  }
                >
                  새 비밀번호
                </label>

                <div
                  className={
                    styles.inputArea
                  }
                >
                  <input
                    id="new-password"
                    type="password"
                    name="newPassword"
                    value={
                      form.newPassword
                    }
                    autoComplete="new-password"
                    placeholder="변경하지 않으려면 비워두세요"
                    className={
                      fieldErrors.newPassword
                        ? styles.inputError
                        : ''
                    }
                    onChange={
                      handleChange
                    }
                    onBlur={
                      handleBlur
                    }
                  />

                  {fieldErrors.newPassword && (
                    <p
                      className={
                        styles.fieldError
                      }
                    >
                      {
                        fieldErrors.newPassword
                      }
                    </p>
                  )}
                </div>
              </div>


              <div
                className={
                  styles.formRow
                }
              >
                <label
                  htmlFor="confirm-password"
                  className={
                    styles.formLabel
                  }
                >
                  새 비밀번호 확인
                </label>

                <div
                  className={
                    styles.inputArea
                  }
                >
                  <input
                    id="confirm-password"
                    type="password"
                    name="confirmPassword"
                    value={
                      form.confirmPassword
                    }
                    autoComplete="new-password"
                    placeholder="새 비밀번호 재입력"
                    className={
                      fieldErrors.confirmPassword
                        ? styles.inputError
                        : ''
                    }
                    onChange={
                      handleChange
                    }
                    onBlur={
                      handleBlur
                    }
                  />

                  {fieldErrors.confirmPassword && (
                    <p
                      className={
                        styles.fieldError
                      }
                    >
                      {
                        fieldErrors.confirmPassword
                      }
                    </p>
                  )}
                </div>
              </div>
            </section>


            {/* =========================
                기본 정보
            ========================= */}

            <section
              className={
                styles.formSection
              }
            >
              <h4>
                기본 정보
              </h4>


              <div
                className={
                  styles.formRow
                }
              >
                <label
                  htmlFor="profile-name"
                  className={
                    styles.formLabel
                  }
                >
                  이름
                </label>

                <div
                  className={
                    styles.inputArea
                  }
                >
                  <input
                    id="profile-name"
                    type="text"
                    name="name"
                    value={
                      form.name
                    }
                    maxLength={
                      MAX_NAME_LENGTH
                    }
                    autoComplete="name"
                    placeholder="이름 입력"
                    className={
                      fieldErrors.name
                        ? styles.inputError
                        : ''
                    }
                    onChange={
                      handleChange
                    }
                    onBlur={
                      handleBlur
                    }
                  />

                  {fieldErrors.name && (
                    <p
                      className={
                        styles.fieldError
                      }
                    >
                      {
                        fieldErrors.name
                      }
                    </p>
                  )}
                </div>
              </div>


              <div
                className={
                  styles.formRow
                }
              >
                <label
                  htmlFor="profile-email"
                  className={
                    styles.formLabel
                  }
                >
                  이메일
                </label>

                <div
                  className={
                    styles.inputArea
                  }
                >
                  <input
                    id="profile-email"
                    type="email"
                    name="email"
                    value={
                      form.email
                    }
                    autoComplete="email"
                    placeholder="이메일 입력"
                    className={
                      fieldErrors.email
                        ? styles.inputError
                        : ''
                    }
                    onChange={
                      handleChange
                    }
                    onBlur={
                      handleBlur
                    }
                  />

                  {fieldErrors.email && (
                    <p
                      className={
                        styles.fieldError
                      }
                    >
                      {
                        fieldErrors.email
                      }
                    </p>
                  )}
                </div>
              </div>


              <div
                className={
                  styles.formRow
                }
              >
                <label
                  htmlFor="profile-phone"
                  className={
                    styles.formLabel
                  }
                >
                  휴대폰
                </label>

                <div
                  className={
                    styles.inputArea
                  }
                >
                  <input
                    id="profile-phone"
                    type="tel"
                    name="phone"
                    value={
                      formatPhone(
                        form.phone
                      )
                    }
                    maxLength={13}
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="010-0000-0000"
                    className={
                      fieldErrors.phone
                        ? styles.inputError
                        : ''
                    }
                    onChange={
                      handleChange
                    }
                    onBlur={
                      handleBlur
                    }
                  />

                  {fieldErrors.phone && (
                    <p
                      className={
                        styles.fieldError
                      }
                    >
                      {
                        fieldErrors.phone
                      }
                    </p>
                  )}
                </div>
              </div>


              {/* 성별 */}

              <div
                className={
                  styles.formRow
                }
              >
                <span
                  className={
                    styles.formLabel
                  }
                >
                  성별
                </span>

                <div
                  className={
                    styles.radioGroup
                  }
                >
                  <label>
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={
                        form.gender ===
                        'male'
                      }
                      onChange={
                        handleChange
                      }
                    />

                    <span>
                      남성
                    </span>
                  </label>


                  <label>
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={
                        form.gender ===
                        'female'
                      }
                      onChange={
                        handleChange
                      }
                    />

                    <span>
                      여성
                    </span>
                  </label>


                  <label>
                    <input
                      type="radio"
                      name="gender"
                      value="unset"
                      checked={
                        form.gender ===
                        'unset'
                      }
                      onChange={
                        handleChange
                      }
                    />

                    <span>
                      선택 안 함
                    </span>
                  </label>
                </div>
              </div>


              {/* 생년월일 */}

              <div
                className={
                  styles.formRow
                }
              >
                <label
                  htmlFor="profile-birth"
                  className={
                    styles.formLabel
                  }
                >
                  생년월일
                </label>

                <div
                  className={
                    styles.inputArea
                  }
                >
                  <input
                    id="profile-birth"
                    type="date"
                    name="birthDate"
                    value={
                      form.birthDate
                    }
                    max={
                      getTodayString()
                    }
                    className={
                      fieldErrors.birthDate
                        ? styles.inputError
                        : ''
                    }
                    onChange={
                      handleChange
                    }
                    onBlur={
                      handleBlur
                    }
                  />

                  {fieldErrors.birthDate && (
                    <p
                      className={
                        styles.fieldError
                      }
                    >
                      {
                        fieldErrors.birthDate
                      }
                    </p>
                  )}
                </div>
              </div>
            </section>


            {/* =========================
                약관 / 마케팅
            ========================= */}

            <section
              className={
                styles.formSection
              }
            >
              <h4>
                약관 및 마케팅 수신 동의
              </h4>


              <div
                className={
                  styles.agreementList
                }
              >
                <label
                  className={
                    styles.agreementRow
                  }
                >
                  <input
                    type="checkbox"
                    checked
                    disabled
                  />

                  <span
                    className={
                      styles.checkBox
                    }
                  />

                  <span
                    className={
                      styles.agreementText
                    }
                  >
                    이용약관 동의

                    <em>
                      필수
                    </em>
                  </span>
                </label>


                <label
                  className={
                    styles.agreementRow
                  }
                >
                  <input
                    type="checkbox"
                    checked
                    disabled
                  />

                  <span
                    className={
                      styles.checkBox
                    }
                  />

                  <span
                    className={
                      styles.agreementText
                    }
                  >
                    개인정보 수집 및 이용 동의

                    <em>
                      필수
                    </em>
                  </span>
                </label>


                <div
                  className={
                    styles.marketingBlock
                  }
                >
                  <label
                    className={
                      styles.agreementRow
                    }
                  >
                    <input
                      type="checkbox"
                      name="marketingAgree"
                      checked={
                        form.marketingAgree
                      }
                      onChange={
                        handleChange
                      }
                    />

                    <span
                      className={
                        styles.checkBox
                      }
                    />

                    <span
                      className={
                        styles.agreementText
                      }
                    >
                      마케팅 정보 수신 동의

                      <em>
                        선택
                      </em>
                    </span>
                  </label>


                  <div
                    className={
                      styles.marketingChannels
                    }
                  >
                    <label>
                      <input
                        type="checkbox"
                        name="marketingSms"
                        checked={
                          form.marketingSms
                        }
                        onChange={
                          handleChange
                        }
                      />

                      <span
                        className={
                          styles.smallCheck
                        }
                      />

                      문자
                    </label>


                    <label>
                      <input
                        type="checkbox"
                        name="marketingEmail"
                        checked={
                          form.marketingEmail
                        }
                        onChange={
                          handleChange
                        }
                      />

                      <span
                        className={
                          styles.smallCheck
                        }
                      />

                      이메일
                    </label>
                  </div>
                </div>
              </div>
            </section>


            {formError && (
              <p
                className={
                  styles.formError
                }
              >
                {formError}
              </p>
            )}


            <div
              className={
                styles.formActions
              }
            >
              <button
                type="button"
                className={
                  styles.cancelEditButton
                }
                onClick={
                  handleCancelEdit
                }
              >
                취소
              </button>

              <button
                type="submit"
                className={
                  styles.submitButton
                }
                disabled={
                  isSaving
                }
              >
                {isSaving
                  ? '저장 중...'
                  : '회원 정보 수정'}
              </button>
            </div>
          </form>
        )}


        {/* =========================
            비밀번호 재확인 모달
        ========================= */}

        {isPasswordModalOpen && (
          <div
            className={
              styles.modalBackdrop
            }
            onMouseDown={(
              event
            ) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                handleCloseVerifyModal()
              }
            }}
          >
            <div
              className={
                styles.passwordModal
              }
              role="dialog"
              aria-modal="true"
            >
              <button
                type="button"
                className={
                  styles.modalClose
                }
                onClick={
                  handleCloseVerifyModal
                }
              >
                ×
              </button>


              <span
                className={
                  styles.modalIcon
                }
              >
                <LockIcon />
              </span>


              <h3>
                비밀번호 재확인
              </h3>

              <p
                className={
                  styles.modalDescription
                }
              >
                회원 정보를 안전하게 변경하기 위해
                비밀번호를 다시 확인해주세요.
              </p>


              <div
                className={
                  styles.verifyRow
                }
              >
                <span>
                  아이디
                </span>

                <strong>
                  {form.accountId ||
                    currentUser?.email?.split(
                      '@'
                    )[0] ||
                    '-'}
                </strong>
              </div>


              <div
                className={
                  styles.verifyRow
                }
              >
                <label
                  htmlFor="verify-password"
                >
                  비밀번호
                </label>

                <input
                  id="verify-password"
                  type="password"
                  value={
                    verifyPassword
                  }
                  autoFocus
                  autoComplete="current-password"
                  onChange={(
                    event
                  ) => {
                    setVerifyPassword(
                      event.target.value
                    )

                    if (
                      verifyError
                    ) {
                      setVerifyError('')
                    }
                  }}
                  onKeyDown={(
                    event
                  ) => {
                    if (
                      event.key ===
                      'Enter'
                    ) {
                      event.preventDefault()

                      handleVerifyPassword()
                    }
                  }}
                />
              </div>


              {verifyError && (
                <p
                  className={
                    styles.verifyError
                  }
                >
                  {verifyError}
                </p>
              )}


              <div
                className={
                  styles.modalActions
                }
              >
                <button
                  type="button"
                  className={
                    styles.modalCancelButton
                  }
                  onClick={
                    handleCloseVerifyModal
                  }
                >
                  취소
                </button>

                <button
                  type="button"
                  className={
                    styles.verifyButton
                  }
                  disabled={
                    isVerifying
                  }
                  onClick={
                    handleVerifyPassword
                  }
                >
                  {isVerifying
                    ? '확인 중...'
                    : '확인'}
                </button>
              </div>
            </div>
          </div>
        )}


        {notice && (
          <p
            className={
              styles.notice
            }
          >
            {notice}
          </p>
        )}
      </div>
    </section>
  )
}


export default ProfileEdit