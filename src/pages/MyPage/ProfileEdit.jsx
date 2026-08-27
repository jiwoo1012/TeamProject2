import { useEffect, useMemo, useState } from 'react'
import { updatePassword, updateProfile } from 'firebase/auth'
import { subscribeToAuthState, getCurrentUserData } from '../../firebase/auth'
import { addDocument, deleteDocument, getCollection, updateDocument } from '../../firebase/firestore'
import makdongPose from '../../assets/characters/M007_Poses03.png'
import profileAvatarMakdongDefault from '../../assets/images/mypage/profileAvatar-makdong-default.png'
import profileAvatarMakdongCheers from '../../assets/images/mypage/profileAvatar-makdong-cheers.png'
import profileAvatarMakdongJeon from '../../assets/images/mypage/profileAvatar-makdong-jeon.png'
import profileAvatarMakdongPouch from '../../assets/images/mypage/profileAvatar-makdong-pouch.png'
import profileAvatarMakdongTipsy from '../../assets/images/mypage/profileAvatar-makdong-tipsy.png'
import profileAvatarMakdongSleepy from '../../assets/images/mypage/profileAvatar-makdong-sleepy.png'
import profileAvatarMakdongServing from '../../assets/images/mypage/profileAvatar-makdong-serving.png'
import profileAvatarMakdongRainy from '../../assets/images/mypage/profileAvatar-makdong-rainy.png'
import styles from './ProfileEdit.module.scss'

const avatarPresets = [
  { id: 'profile-makdong-default', label: '막둥이 기본 프로필', src: profileAvatarMakdongDefault },
  { id: 'profile-makdong-cheers', label: '술잔을 든 막둥이', src: profileAvatarMakdongCheers },
  { id: 'profile-makdong-jeon', label: '전을 든 막둥이', src: profileAvatarMakdongJeon },
  { id: 'profile-makdong-pouch', label: '복주머니 막둥이', src: profileAvatarMakdongPouch },
  { id: 'profile-makdong-tipsy', label: '살짝 취한 막둥이', src: profileAvatarMakdongTipsy },
  { id: 'profile-makdong-sleepy', label: '잠든 막둥이', src: profileAvatarMakdongSleepy },
  { id: 'profile-makdong-serving', label: '한 상 대령 막둥이', src: profileAvatarMakdongServing },
  { id: 'profile-makdong-rainy', label: '비 오는 날 막둥이', src: profileAvatarMakdongRainy },
]

const getAvatarStorageKey = (uid) => `jajak_profile_avatar_${uid}`

const getMemberLabel = (role) => {
  if (role === 'admin') return '관리자'
  return '일반 회원'
}

const EmptyProfileCard = () => (
  <article className={`${styles.infoCard} ${styles.emptyCard}`}>
    <span className={styles.emptyIcon} aria-hidden="true" />
    <h2>등록된 정보가 없습니다.</h2>
    <p>회원 정보를 입력하고<br />나만의 자작 시간을 시작해보세요.</p>
    <button type="button" className={styles.editProfileButton}>회원 정보 등록</button>
  </article>
)

const EmptyDeliveryCard = ({ onAdd }) => (
  <article className={`${styles.infoCard} ${styles.emptyCard}`}>
    <span className={`${styles.emptyIcon} ${styles.deliveryEmptyIcon}`} aria-hidden="true">
      <svg viewBox="0 0 64 64" fill="none">
        <path d="M32 56S14 41.4 14 28a18 18 0 1 1 36 0c0 13.4-18 28-18 28Z" />
        <circle cx="32" cy="28" r="6" />
      </svg>
    </span>
    <h2>등록된 배송지가 없습니다.</h2>
    <p>자주 사용하는 배송지를 추가하면<br />더 빠르게 주문할 수 있어요.</p>
    <button type="button" className={styles.addAddressButton} onClick={onAdd}><span aria-hidden="true">+</span> 새 배송지 추가</button>
  </article>
)

const ProfileEdit = () => {
  const [viewMode, setViewMode] = useState('summary')
  const [firebaseUser, setFirebaseUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [selectedAvatarId, setSelectedAvatarId] = useState('pose03')
  const [addresses, setAddresses] = useState([])
  const [editingAddressId, setEditingAddressId] = useState(null)
  const [addressError, setAddressError] = useState('')

  useEffect(() => {
    const unsubscribe = subscribeToAuthState(async (user) => {
      setFirebaseUser(user)
      setLoadError('')

      if (!user) {
        setUserData(null)
        setAddresses([])
        setSelectedAvatarId('pose03')
        setIsLoading(false)
        return
      }

      const savedAvatarId = localStorage.getItem(getAvatarStorageKey(user.uid))
      if (avatarPresets.some((avatar) => avatar.id === savedAvatarId)) {
        setSelectedAvatarId(savedAvatarId)
      } else {
        setSelectedAvatarId('pose03')
      }

      try {
        const [data, addressDocs] = await Promise.all([
          getCurrentUserData(user.uid),
          getCollection(`users/${user.uid}/addresses`),
        ])
        setUserData(data)
        setAddresses(addressDocs)
      } catch (error) {
        console.error('회원정보 조회 실패:', error)
        setUserData(null)
        setLoadError('회원정보를 불러오지 못했습니다.')
      } finally {
        setIsLoading(false)
      }
    })

    return unsubscribe
  }, [])

  const profileDetails = useMemo(
    () => [
      {
        label: '이름',
        value: userData?.nickname || firebaseUser?.displayName || '등록되지 않음',
      },
      {
        label: '이메일',
        value: userData?.email || firebaseUser?.email || '등록되지 않음',
      },
      { label: '휴대폰', value: userData?.phone || '등록되지 않음' },
      { label: '생년월일', value: '등록되지 않음' },
      { label: '성별', value: '등록되지 않음' },
    ],
    [firebaseUser, userData],
  )

  const memberName = firebaseUser
    ? userData?.nickname ||
      firebaseUser?.displayName ||
      firebaseUser?.email?.split('@')[0] ||
      '회원'
    : ''

  const memberLabel = getMemberLabel(userData?.role)
  const points = Number(userData?.points ?? 0)

  const hasProfile = Boolean(firebaseUser)
  const hasAddresses = addresses.length > 0
  const isProfileForm = viewMode === 'profileForm'
  const isPasswordForm = viewMode === 'passwordForm'
  const isAddressForm = viewMode === 'addressForm'
  const selectedAvatar = avatarPresets.find((avatar) => avatar.id === selectedAvatarId) || avatarPresets[2]

  const handleAvatarPreset = (avatarId) => {
    if (!firebaseUser) return

    setSelectedAvatarId(avatarId)
    localStorage.setItem(getAvatarStorageKey(firebaseUser.uid), avatarId)
  }

  const handleProfileComplete = async (event) => {
    event.preventDefault()

    if (!firebaseUser) {
      setSaveError('로그인 후 회원정보를 수정할 수 있습니다.')
      return
    }

    const formData = new FormData(event.currentTarget)
    const nickname = String(formData.get('nickname') || '').trim()

    if (!nickname) {
      setSaveError('이름을 입력해주세요.')
      return
    }

    setIsSaving(true)
    setSaveError('')

    try {
      await updateDocument('users', firebaseUser.uid, { nickname })
      await updateProfile(firebaseUser, { displayName: nickname })
      setUserData((current) => ({ ...current, nickname }))
      setViewMode('summary')
    } catch (error) {
      console.error('회원정보 수정 실패:', error)
      setSaveError('회원정보 수정에 실패했습니다.')
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordComplete = async (event) => {
    event.preventDefault()

    if (!firebaseUser) {
      setPasswordError('로그인 후 비밀번호를 변경할 수 있습니다.')
      return
    }

    const formData = new FormData(event.currentTarget)
    const newPassword = String(formData.get('newPassword') || '')

    if (newPassword.length < 6) {
      setPasswordError('비밀번호는 6자 이상 입력해주세요.')
      return
    }

    setIsSaving(true)
    setPasswordError('')

    try {
      await updatePassword(firebaseUser, newPassword)
      setViewMode('summary')
    } catch (error) {
      console.error('비밀번호 변경 실패:', error)

      if (error?.code === 'auth/requires-recent-login') {
        setPasswordError('보안을 위해 다시 로그인한 뒤 비밀번호를 변경해주세요.')
      } else if (error?.code === 'auth/weak-password') {
        setPasswordError('더 안전한 비밀번호를 입력해주세요.')
      } else {
        setPasswordError('비밀번호 변경에 실패했습니다.')
      }
    } finally {
      setIsSaving(false)
    }
  }

  const openAddressForm = (address = null) => {
    setEditingAddressId(address?.id || null)
    setAddressError('')
    setViewMode('addressForm')
  }

  const handleAddressComplete = async (event) => {
    event.preventDefault()
    if (!firebaseUser) return

    const formData = new FormData(event.currentTarget)
    const address = {
      label: String(formData.get('label') || '').trim(),
      recipient: String(formData.get('recipient') || '').trim(),
      phone: String(formData.get('phone') || '').trim(),
      address: String(formData.get('address') || '').trim(),
      detailAddress: String(formData.get('detailAddress') || '').trim(),
      isDefault: editingAddressId
        ? Boolean(addresses.find((item) => item.id === editingAddressId)?.isDefault)
        : addresses.length === 0,
    }

    if (!address.label || !address.recipient || !address.phone || !address.address) {
      setAddressError('배송지명, 받으실 분, 휴대폰 번호와 주소를 입력해주세요.')
      return
    }

    try {
      if (editingAddressId) {
        await updateDocument(`users/${firebaseUser.uid}/addresses`, editingAddressId, address)
        setAddresses((current) => current.map((item) => (
          item.id === editingAddressId ? { ...item, ...address } : item
        )))
      } else {
        const id = await addDocument(`users/${firebaseUser.uid}/addresses`, address)
        setAddresses((current) => [...current, { id, ...address }])
      }
      setViewMode('summary')
    } catch (error) {
      console.error('배송지 저장 실패:', error)
      setAddressError('배송지를 저장하지 못했습니다. 잠시 후 다시 시도해주세요.')
    }
  }

  const handleAddressDelete = async (addressId) => {
    if (!firebaseUser) return

    try {
      await deleteDocument(`users/${firebaseUser.uid}/addresses`, addressId)
      setAddresses((current) => current.filter((address) => address.id !== addressId))
    } catch (error) {
      console.error('배송지 삭제 실패:', error)
      setAddressError('배송지를 삭제하지 못했습니다. 잠시 후 다시 시도해주세요.')
    }
  }

  const renderProfileCard = () => {
    if (!hasProfile) return <EmptyProfileCard />

    if (isProfileForm) {
      return (
        <form className={`${styles.infoCard} ${styles.formCard}`} onSubmit={handleProfileComplete}>
          <h2>기본 정보</h2>
          <section className={styles.avatarPicker} aria-labelledby="avatar-picker-title">
            <div className={styles.avatarPickerHeading}>
              <h3 id="avatar-picker-title">프로필 캐릭터</h3>
              <p>이 브라우저에서만 적용됩니다.</p>
            </div>
            <div className={styles.avatarPresetList}>
              {avatarPresets.map((avatar) => (
                <button
                  key={avatar.id}
                  type="button"
                  className={selectedAvatarId === avatar.id ? styles.avatarPresetActive : ''}
                  aria-pressed={selectedAvatarId === avatar.id}
                  aria-label={`${avatar.label} 적용`}
                  onClick={() => handleAvatarPreset(avatar.id)}
                >
                  <img src={avatar.src} alt="" />
                </button>
              ))}
            </div>
          </section>
          <div className={styles.fieldList}>
            {profileDetails.map(({ label, value }) => {
              const isNickname = label === '이름'

              return (
                <label key={label} className={styles.formRow}>
                  <span>{label}</span>
                  <input
                    aria-label={label}
                    name={isNickname ? 'nickname' : undefined}
                    defaultValue={value}
                    readOnly={!isNickname}
                  />
                </label>
              )
            })}
          </div>
          {saveError && <p role="alert">{saveError}</p>}
          <button type="submit" className={styles.completeButton} disabled={isSaving}>
            {isSaving ? '저장 중...' : '수정 완료'}
          </button>
        </form>
      )
    }

    if (isPasswordForm) {
      return (
        <form className={`${styles.infoCard} ${styles.formCard} ${styles.passwordCard}`} onSubmit={handlePasswordComplete}>
          <h2>비밀번호 변경</h2>
          <div className={styles.fieldList}>
            {profileDetails.slice(0, 2).map(({ label, value }) => (
              <div key={label} className={styles.formRow}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
            <label className={styles.formRow}>
              <span>비밀번호</span>
              <input
                aria-label="비밀번호"
                name="newPassword"
                type="password"
                minLength="6"
                autoComplete="new-password"
                placeholder="새 비밀번호를 입력해주세요"
              />
            </label>
          </div>
          {passwordError && <p role="alert">{passwordError}</p>}
          <button type="submit" className={styles.completeButton} disabled={isSaving}>
            {isSaving ? '변경 중...' : '수정 완료'}
          </button>
        </form>
      )
    }

    return (
      <article className={styles.infoCard}>
        <h2>기본 정보</h2>
        <p className={styles.infoDescription}>회원 계정 정보를 확인하고 관리할 수 있습니다.</p>
        <dl className={styles.detailList}>
          {profileDetails.map(({ label, value }) => (
            <div key={label} className={styles.detailRow}>
              <dt>{label}</dt>
              <dd className={value === '등록되지 않음' ? styles.unregisteredValue : ''}>{value}</dd>
            </div>
          ))}
        </dl>
        <button
          type="button"
          className={styles.editProfileButton}
          onClick={() => {
            setSaveError('')
            setViewMode('profileForm')
          }}
        >
          회원 정보 수정
        </button>
      </article>
    )
  }

  const renderDeliveryCard = () => {
    const editingAddress = addresses.find((address) => address.id === editingAddressId)

    if (!hasAddresses && !isAddressForm) return <EmptyDeliveryCard onAdd={() => openAddressForm()} />

    if (isAddressForm) {
      return (
        <form key={editingAddressId || 'new'} className={`${styles.infoCard} ${styles.formCard} ${styles.deliveryFormCard}`} onSubmit={handleAddressComplete}>
          <h2>배송지 관리</h2>
          <div className={styles.fieldList}>
            <label className={styles.formRow}><span>배송지 이름</span><input name="label" aria-label="배송지 이름" defaultValue={editingAddress?.label || ''} placeholder="이름을 입력해주세요" /></label>
            <label className={styles.formRow}><span>받으실 분</span><input name="recipient" aria-label="받으실 분" defaultValue={editingAddress?.recipient || ''} placeholder="성함을 입력해주세요" /></label>
            <label className={styles.formRow}><span>주소</span><input name="address" aria-label="주소" defaultValue={editingAddress?.address || ''} placeholder="주소를 입력해주세요" /></label>
            <label className={styles.formRow}><span>상세 주소</span><input name="detailAddress" aria-label="상세 주소" defaultValue={editingAddress?.detailAddress || ''} placeholder="상세 주소를 입력해주세요" /></label>
            <label className={styles.formRow}><span>휴대폰</span><input name="phone" aria-label="휴대폰" defaultValue={editingAddress?.phone || ''} placeholder="휴대폰 번호를 입력해주세요" /></label>
          </div>
          {addressError && <p role="alert">{addressError}</p>}
          <button type="submit" className={styles.completeButton}>저장</button>
        </form>
      )
    }

    return (
      <article className={`${styles.infoCard} ${styles.deliveryCard}`}>
        <h2>배송지 관리</h2>
        <div className={styles.addressList}>
          {addresses.map((address) => (
            <section key={address.label} className={styles.addressItem}>
              <div className={styles.addressCopy}>
                <div className={styles.addressHeading}>{address.isDefault && <span className={styles.defaultBadge}>기본 배송지</span>}<strong>{address.recipient}</strong></div>
                <p>{address.phone}</p><p>{address.address} {address.detailAddress}</p>
              </div>
              <div className={styles.addressActions}>
                <button type="button" className={address.isDefault ? styles.smallOutlineButton : styles.smallPrimaryButton} onClick={() => openAddressForm(address)}>수정</button>
                {!address.isDefault && <button type="button" className={styles.smallOutlineButton} onClick={() => handleAddressDelete(address.id)}>삭제</button>}
              </div>
            </section>
          ))}
        </div>
        <button type="button" className={styles.addAddressButton} onClick={() => openAddressForm()}><span aria-hidden="true">+</span> 새 배송지 추가</button>
      </article>
    )
  }

  return (
   <section className={styles.page} aria-labelledby="profile-title">
  {isLoading && <p role="status">회원정보를 불러오는 중입니다.</p>}
  {!isLoading && loadError && <p role="alert">{loadError}</p>}

  <div className={styles.profileBanner}>
        <button
          type="button"
          className={styles.avatar}
          disabled={!firebaseUser}
          aria-label="프로필 캐릭터 수정"
          onClick={() => {
            setSaveError('')
            setViewMode('profileForm')
          }}
        >
          {firebaseUser ? <img src={selectedAvatar.src} alt="" /> : <svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="24" r="11" /><path d="M13 55c1-12 9-19 19-19s18 7 19 19" /></svg>}
        </button>
        <div className={styles.bannerCopy}>
          <h2 id="profile-title">
            {firebaseUser ? (
              <><span className={styles.memberName}>{memberName} 님,</span> 반갑습니다.</>
            ) : (
              '로그인 후 이용해주세요.'
            )}
          </h2>
          <p>{firebaseUser ? '자작의 회원정보를 관리해보세요.' : '로그인 후 회원정보를 확인할 수 있습니다.'}</p>
          <div className={styles.memberMeta}>
            <span className={styles.memberBadge}>{firebaseUser ? memberLabel : '-'}</span>
            <span>보유 포인트</span>
            <strong>{firebaseUser ? points.toLocaleString('ko-KR') : 0}P</strong>
          </div>
        </div>
        <div className={styles.bannerActions}>
          <button
            type="button"
            className={styles.outlineButton}
            disabled={!firebaseUser}
            onClick={() => {
              setSaveError('')
              setViewMode('profileForm')
            }}
          >
            정보 수정
          </button>
          <button
            type="button"
            className={styles.primaryButton}
            disabled={!firebaseUser}
            onClick={() => {
              setPasswordError('')
              setViewMode('passwordForm')
            }}
          >
            비밀번호 변경
          </button>
        </div>
        <div className={styles.mascotPlaceholder} aria-hidden="true">
          <img className={styles.mascotImage} src={makdongPose} alt="" />
        </div>
      </div>
      <div className={styles.infoGrid}>{renderProfileCard()}{renderDeliveryCard()}</div>
    </section>
  )
}

export default ProfileEdit
