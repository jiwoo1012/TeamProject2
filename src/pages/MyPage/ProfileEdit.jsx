import { useState } from 'react'
import styles from './ProfileEdit.module.scss'

const profileDetails = [
  { label: '이름', value: '홍길동' },
  { label: '이메일', value: 'aa11@naver.com' },
  { label: '휴대폰', value: '010-1234-5678' },
  { label: '생년월일', value: '1990.01.01' },
  { label: '성별', value: '남성' },
]

const deliveryAddresses = [
  { label: '배송지명', name: '홍길동 님', phone: '010-1234-5678', address: '서울특별시 강남구 테헤란로 123, 4동 (역삼동)', isDefault: true },
  { label: '회사', phone: '010-1234-5678', address: '서울특별시 강남구 테헤란로 123, 4동 (역삼동)' },
  { label: '부모님댁', phone: '010-1234-5678', address: '서울특별시 강남구 테헤란로 123, 4동 (역삼동)' },
]

const EmptyProfileCard = () => (
  <article className={`${styles.infoCard} ${styles.emptyCard}`}>
    <span className={styles.emptyIcon} aria-hidden="true" />
    <h2>등록된 정보가 없습니다.</h2>
    <p>회원 정보를 입력하고<br />나만의 자작 시간을 시작해보세요.</p>
    <button type="button" className={styles.editProfileButton}>회원 정보 등록</button>
  </article>
)

const EmptyDeliveryCard = () => (
  <article className={`${styles.infoCard} ${styles.emptyCard}`}>
    <span className={styles.emptyIcon} aria-hidden="true" />
    <h2>등록된 배송지가 없습니다.</h2>
    <p>자주 사용하는 배송지를 추가하면<br />더 빠르게 주문할 수 있어요.</p>
    <button type="button" className={styles.addAddressButton}><span aria-hidden="true">+</span> 새 배송지 추가</button>
  </article>
)

const ProfileEdit = () => {
  const [viewMode, setViewMode] = useState('summary')
  const hasProfile = profileDetails.length > 0
  const hasAddresses = deliveryAddresses.length > 0
  const isProfileForm = viewMode === 'profileForm'
  const isPasswordForm = viewMode === 'passwordForm'

  const handleComplete = (event) => {
    event.preventDefault()
    setViewMode('summary')
  }

  const renderProfileCard = () => {
    if (!hasProfile) return <EmptyProfileCard />

    if (isProfileForm) {
      return (
        <form className={`${styles.infoCard} ${styles.formCard}`} onSubmit={handleComplete}>
          <h2>기본 정보</h2>
          <div className={styles.fieldList}>
            {profileDetails.map(({ label, value }) => (
              <label key={label} className={styles.formRow}>
                <span>{label}</span>
                <input aria-label={label} defaultValue={value} />
              </label>
            ))}
          </div>
          <button type="submit" className={styles.completeButton}>수정 완료</button>
        </form>
      )
    }

    if (isPasswordForm) {
      return (
        <form className={`${styles.infoCard} ${styles.formCard} ${styles.passwordCard}`} onSubmit={handleComplete}>
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
              <input aria-label="비밀번호" type="password" placeholder="새 비밀번호를 입력해주세요" />
            </label>
          </div>
          <button type="submit" className={styles.completeButton}>수정 완료</button>
        </form>
      )
    }

    return (
      <article className={styles.infoCard}>
        <h2>기본 정보</h2>
        <dl className={styles.detailList}>
          {profileDetails.map(({ label, value }) => <div key={label} className={styles.detailRow}><dt>{label}</dt><dd>{value}</dd></div>)}
        </dl>
        <button type="button" className={styles.editProfileButton} onClick={() => setViewMode('profileForm')}>회원 정보 수정</button>
      </article>
    )
  }

  const renderDeliveryCard = () => {
    if (!hasAddresses) return <EmptyDeliveryCard />

    if (isProfileForm) {
      return (
        <form className={`${styles.infoCard} ${styles.formCard} ${styles.deliveryFormCard}`} onSubmit={handleComplete}>
          <h2>배송지 관리</h2>
          <div className={styles.fieldList}>
            <label className={styles.formRow}><span>배송지 이름</span><input aria-label="배송지 이름" placeholder="이름을 입력해주세요" /></label>
            <label className={styles.formRow}><span>받으실 분</span><input aria-label="받으실 분" placeholder="성함을 입력해주세요" /></label>
            <label className={styles.formRow}><span>받으실 곳</span><input aria-label="받으실 곳" placeholder="상세 주소를 입력해주세요" /></label>
            <label className={styles.formRow}><span>휴대폰</span><input aria-label="휴대폰" placeholder="휴대폰 번호를 입력해주세요" /></label>
          </div>
          <label className={styles.defaultCheck}>
            <input type="checkbox" defaultChecked />
            <span className={styles.checkMark} aria-hidden="true">✓</span>
            <span>기본 배송지로 설정합니다.</span>
          </label>
          <button type="submit" className={styles.completeButton}>저장</button>
        </form>
      )
    }

    return (
      <article className={`${styles.infoCard} ${styles.deliveryCard}`}>
        <h2>배송지 관리</h2>
        <div className={styles.addressList}>
          {deliveryAddresses.map((address) => (
            <section key={address.label} className={styles.addressItem}>
              <div className={styles.addressCopy}>
                <div className={styles.addressHeading}>{address.isDefault && <span className={styles.defaultBadge}>배송지명</span>}<strong>{address.name || address.label}</strong></div>
                <p>{address.phone}</p><p>{address.address}</p>
              </div>
              <div className={styles.addressActions}>
                <button type="button" className={address.isDefault ? styles.smallOutlineButton : styles.smallPrimaryButton} onClick={() => setViewMode('profileForm')}>수정</button>
                {!address.isDefault && <button type="button" className={styles.smallOutlineButton}>삭제</button>}
              </div>
            </section>
          ))}
        </div>
        <button type="button" className={styles.addAddressButton} onClick={() => setViewMode('profileForm')}><span aria-hidden="true">+</span> 새 배송지 추가</button>
      </article>
    )
  }

  return (
    <section className={styles.page} aria-labelledby="profile-title">
      <div className={styles.profileBanner}>
        <div className={styles.avatar} aria-hidden="true"><svg viewBox="0 0 64 64"><circle cx="32" cy="24" r="11" /><path d="M13 55c1-12 9-19 19-19s18 7 19 19" /></svg></div>
        <div className={styles.bannerCopy}>
          <h2 id="profile-title"><span className={styles.memberName}>홍길동 님,</span> 반갑습니다.</h2>
          <p>자작의 회원정보를 관리해보세요.</p>
          <div className={styles.memberMeta}><span className={styles.memberBadge}>일반 회원</span><span>다음 등급까지</span><strong>1,200P</strong></div>
        </div>
        <div className={styles.bannerActions}>
          <button type="button" className={styles.outlineButton} onClick={() => setViewMode('profileForm')}>정보 수정</button>
          <button type="button" className={styles.primaryButton} onClick={() => setViewMode('passwordForm')}>비밀번호 변경</button>
        </div>
        <div className={styles.mascotPlaceholder} aria-hidden="true"><span>🦝</span></div>
      </div>
      <div className={styles.infoGrid}>{renderProfileCard()}{renderDeliveryCard()}</div>
    </section>
  )
}

export default ProfileEdit
