import { useEffect, useState } from 'react'
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updateProfile,
} from 'firebase/auth'
import { serverTimestamp } from 'firebase/firestore'

import {
  getCurrentUserData,
  subscribeToAuthState,
} from '../../firebase/auth'

import {
  updateDocument,
} from '../../firebase/firestore'

import styles from './ProfileEdit.module.scss'
import { getAvatarStorageKey, profileAvatars as avatarPresets } from './profileAvatars'


const VERIFY_VALID_TIME = 10 * 60 * 1000


const getInitialForm = (user, userData) => ({
  name:
    userData?.nickname ||
    user?.displayName ||
    '',

  email:
    user?.email ||
    userData?.email ||
    '',
})


const ProfileEdit = () => {
  const [currentUser, setCurrentUser] =
    useState(null)

  const [userData, setUserData] =
    useState(null)

  const [isLoading, setIsLoading] =
    useState(true)

  const [isEditing, setIsEditing] =
    useState(false)

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

  const [form, setForm] =
    useState(() =>
      getInitialForm(null, null)
    )

  const [
    selectedAvatarId,
    setSelectedAvatarId,
  ] = useState(
    'profile-makdong-default'
  )

  const [notice, setNotice] =
    useState('')

  const [formError, setFormError] =
    useState('')

  const [isSaving, setIsSaving] =
    useState(false)


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


          setCurrentUser(user)


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


            setUserData(data)

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


  const currentAvatar =
    avatarPresets.find(
      (avatar) =>
        avatar.id ===
        selectedAvatarId
    ) ||
    avatarPresets[0]


  /* =========================
     알림
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
     비밀번호 인증 열기
  ========================= */

  const handleOpenEdit = () => {
    setVerifyPassword('')
    setVerifyError('')

    setIsPasswordModalOpen(true)
  }


  const handleCloseVerifyModal =
    () => {
      if (isVerifying) {
        return
      }

      setVerifyPassword('')
      setVerifyError('')

      setIsPasswordModalOpen(false)
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


      if (!verifyPassword.trim()) {
        setVerifyError(
          '비밀번호를 입력해주세요.'
        )

        return
      }


      try {
        setIsVerifying(true)

        setVerifyError('')


        const credential =
          EmailAuthProvider.credential(
            currentUser.email,
            verifyPassword
          )


        await reauthenticateWithCredential(
          currentUser,
          credential
        )


        /* 인증 성공 */
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


        setFormError('')

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
     입력값 변경
  ========================= */

  const handleChange =
    (event) => {
      const {
        name,
        value,
        type,
        checked,
      } = event.target


      setForm(
        (current) => ({
          ...current,

          [name]:
            type === 'checkbox'
              ? checked
              : value,
        })
      )
    }


  /* =========================
     프로필 이미지 변경
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
     인증 유효성 검사
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
     회원 정보 저장
  ========================= */

  const handleSubmit =
    async (event) => {
      event.preventDefault()


      /*
       * 인증을 거치지 않았거나
       * 인증 시간이 만료된 경우
       * 저장 자체를 막는다.
       */
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


      const trimmedName =
        form.name.trim()


      if (!trimmedName) {
        setFormError(
          '이름을 입력해주세요.'
        )

        return
      }


      try {
        setIsSaving(true)

        setFormError('')


        /* Firebase Auth 이름 변경 */
        if (
          currentUser.displayName !==
          trimmedName
        ) {
          await updateProfile(
            currentUser,
            {
              displayName:
                trimmedName,
            }
          )
        }


        /* Firestore 회원 정보 변경 */
        const nextUserData = {
          nickname:
            trimmedName,

          email:
            currentUser.email,

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

        window.dispatchEvent(
          new Event('jajak-profile-change')
        )


        /*
         * 수정이 끝나면 인증 상태 폐기.
         * 다시 수정하려면 재인증 필요.
         */
        setVerifiedAt(null)

        setIsEditing(false)


        showNotice(
          '회원 정보가 수정되었습니다.'
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


        setFormError(
          '회원 정보 수정 중 오류가 발생했습니다.'
        )
      } finally {
        setIsSaving(false)
      }
    }


  const handleCancelEdit = () => {
    setIsEditing(false)

    setVerifiedAt(null)

    setFormError('')

    setForm(
      getInitialForm(
        currentUser,
        userData
      )
    )
  }


  if (isLoading) {
    return (
      <section
        className={styles.page}
      >
        <div
          className={
            styles.profileCard
          }
        >
          <p
            className={
              styles.loading
            }
          >
            회원 정보를 불러오는
            중입니다...
          </p>
        </div>
      </section>
    )
  }


  return (
    <section
      className={styles.page}
      aria-labelledby="profile-title"
    >

      <div
        className={
          styles.profileCard
        }
      >

        {/* =====================
            TITLE
        ===================== */}

        <header
          className={
            styles.pageHeader
          }
        >
          <h2
            id="profile-title"
          >
            회원 정보 관리
          </h2>
        </header>


        <div
          className={
            styles.titleDivider
          }
        />


        {/* =====================
            기본 화면
        ===================== */}

        {!isEditing ? (
          <>
            <button
              type="button"
              className={
                styles.editMenu
              }
              onClick={
                handleOpenEdit
              }
            >
              <span>
                개인 정보 수정
              </span>

              <span
                className={
                  styles.menuArrow
                }
                aria-hidden="true"
              >
                ›
              </span>
            </button>


            <div
              className={
                styles.sectionDivider
              }
            />


            <section
              className={
                styles.avatarSection
              }
              aria-labelledby="avatar-title"
            >
              <h3
                id="avatar-title"
              >
                프로필 바꾸기
              </h3>


              <div
                className={
                  styles.currentProfile
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


                <div>
                  <strong>
                    {memberName}
                  </strong>

                  <span>
                    나리님
                  </span>

                  <p>
                    {currentUser?.email}
                  </p>
                </div>
              </div>


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
                    styles.primarySmallButton
                  }
                  onClick={
                    handleSaveAvatar
                  }
                >
                  수정 완료
                </button>
              </div>
            </section>
          </>
        ) : (

          /* =====================
              개인정보 수정 화면
          ===================== */

          <form
            className={
              styles.editForm
            }
            onSubmit={
              handleSubmit
            }
          >
            <h3>
              개인 정보 수정
            </h3>


            <div
              className={
                styles.formRows
              }
            >

              {/* 이름 */}

              <label
                className={
                  styles.formRow
                }
              >
                <span>
                  이름
                </span>

                <input
                  type="text"
                  name="name"
                  value={
                    form.name
                  }
                  onChange={
                    handleChange
                  }
                />
              </label>


              {/* 이메일 */}

              <label
                className={
                  styles.formRow
                }
              >
                <span>
                  이메일
                </span>

                <input
                  type="email"
                  name="email"
                  value={
                    form.email
                  }
                  readOnly
                />
              </label>

            </div>


            {formError && (
              <p
                className={
                  styles.formError
                }
                role="alert"
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
                  ? '수정 중...'
                  : '회원 정보 수정'}
              </button>
            </div>

          </form>
        )}


        {/* =====================
            비밀번호 재확인 팝업
        ===================== */}

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
              aria-labelledby="password-modal-title"
            >

              <button
                type="button"
                className={
                  styles.modalClose
                }
                aria-label="닫기"
                onClick={
                  handleCloseVerifyModal
                }
              >
                ×
              </button>


              <h3
                id="password-modal-title"
              >
                비밀번호 재확인
              </h3>


              <p
                className={
                  styles.modalDescription
                }
              >
                회원님의 정보를 안전하게
                보호하기 위해 비밀번호를
                다시 한번 확인해주세요.
              </p>


              <div
                className={
                  styles.verifyRows
                }
              >

                <div
                  className={
                    styles.verifyRow
                  }
                >
                  <span>
                    아이디
                  </span>

                  <strong>
                    {currentUser?.email ||
                      '-'}
                  </strong>
                </div>


                <label
                  className={
                    styles.verifyRow
                  }
                >
                  <span>
                    비밀번호
                  </span>

                  <input
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
                        setVerifyError(
                          ''
                        )
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
                </label>

              </div>


              {verifyError && (
                <p
                  className={
                    styles.verifyError
                  }
                  role="alert"
                >
                  {verifyError}
                </p>
              )}


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
        )}


        {notice && (
          <p
            className={
              styles.notice
            }
            role="status"
          >
            {notice}
          </p>
        )}

      </div>

    </section>
  )
}


export default ProfileEdit
