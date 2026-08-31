import { useEffect, useState } from 'react'
import { updateProfile } from 'firebase/auth'
import { collection, doc, serverTimestamp, writeBatch } from 'firebase/firestore'
import { useLocation, useNavigate } from 'react-router-dom'
import { ORDER_STATUS } from '../../constants/orderStatus'
import { getCurrentUserData, subscribeToAuthState } from '../../firebase/auth'
import { auth, db } from '../../firebase/firebase'
import { addDocument, getCollection, updateDocument } from '../../firebase/firestore'
import { PATHS } from '../../routes/paths'
import { clearCart, clearRemoteCart } from '../../utils/cartStorage'
import cartTopOrnament from '../../assets/images/mypage/cartTopOrnament.svg'
import cartStepOrnament from '../../assets/images/mypage/cartStepOrnament.svg'
import styles from './Checkout.module.scss'

const formatPrice = (value) => `${value.toLocaleString('ko-KR')}원`

const PurchaseSteps = () => (
  <nav className={styles.purchaseSteps} aria-label="주문 진행 단계">
    <span>장바구니</span>
    <img className={styles.stepFlower} src={cartStepOrnament} alt="" />
    <strong>주문서 작성 / 결제</strong>
    <img className={styles.stepFlower} src={cartStepOrnament} alt="" />
    <span>완료</span>
  </nav>
)

const ChoiceRadio = ({ name, checked, onChange, label }) => (
  <label className={styles.choiceRadio}>
    <input
      type="radio"
      name={name}
      checked={checked}
      onChange={onChange}
    />
    <span className={styles.radioMark} aria-hidden="true" />
    <span>{label}</span>
  </label>
)

const RoundCheckbox = ({ checked, onChange, label, muted = false }) => (
  <label className={`${styles.roundCheckbox} ${muted ? styles.mutedCheckbox : ''}`}>
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
    />
    <span className={styles.checkMark} aria-hidden="true" />
    <span>{label}</span>
  </label>
)

const deliveryMemoPresets = ['문 앞에 놓아주세요', '배송 전 연락주세요', '경비실에 맡겨주세요']
const emptyAddressDraft = { label: '', recipient: '', phone: '', address: '', detailAddress: '' }

const Checkout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const orderItems = Array.isArray(location.state?.items) ? location.state.items : []
  const [currentUser, setCurrentUser] = useState(auth.currentUser)
  const [memberData, setMemberData] = useState(null)
  const [ordererMode, setOrdererMode] = useState('member')
  const [deliveryMode, setDeliveryMode] = useState('direct')
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [saveDelivery, setSaveDelivery] = useState(true)
  const [agreed, setAgreed] = useState(false)
  const [pointInput, setPointInput] = useState(() => String(location.state?.usedPoints || 0))
  const [activeModal, setActiveModal] = useState(null)
  const [profileDraft, setProfileDraft] = useState({ name: '', phone: '', email: '' })
  const [savedAddresses, setSavedAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [isAddingAddress, setIsAddingAddress] = useState(false)
  const [addressDraft, setAddressDraft] = useState(emptyAddressDraft)
  const [addressError, setAddressError] = useState('')
  const [profileError, setProfileError] = useState('')
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [shipping, setShipping] = useState({
    recipient: '',
    phone: '',
    address: '',
    detailAddress: '',
    memo: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => subscribeToAuthState(setCurrentUser), [])

  useEffect(() => {
    if (!currentUser) {
      setMemberData(null)
      setSavedAddresses([])
      return undefined
    }

    let isCancelled = false

    Promise.all([
      getCurrentUserData(currentUser.uid),
      getCollection(`users/${currentUser.uid}/addresses`),
    ])
      .then(([userData, addresses]) => {
        if (isCancelled) return
        setMemberData(userData)
        setSavedAddresses(addresses)
        setSelectedAddressId(addresses.find((address) => address.isDefault)?.id || addresses[0]?.id || '')
      })
      .catch((error) => {
        console.error('주문 회원정보 조회 실패:', error)
        if (!isCancelled) setSubmitError('회원 정보 또는 배송지를 불러오지 못했습니다.')
      })

    return () => { isCancelled = true }
  }, [currentUser])

  useEffect(() => {
    if (!activeModal) return undefined

    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setActiveModal(null)
    }

    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [activeModal])

  const itemTotal = orderItems.reduce((sum, item) => sum + (item.price - item.discount) * item.quantity, 0)
  const availablePoints = Number(memberData?.points ?? 0)
  const usedPoints = Math.min(Number(pointInput) || 0, availablePoints, itemTotal)
  const totalPrice = Math.max(itemTotal - usedPoints, 0)
  const allUsablePoints = Math.min(availablePoints, itemTotal)
  const isUsingAllPoints = allUsablePoints > 0 && usedPoints === allUsablePoints

  useEffect(() => {
    setPointInput((current) => String(Math.min(Number(current) || 0, allUsablePoints)))
  }, [allUsablePoints])

  const member = {
    name: memberData?.nickname || currentUser?.displayName || '회원',
    phone: memberData?.phone || '등록되지 않음',
    email: memberData?.email || currentUser?.email || '등록되지 않음',
  }

  const handleShippingChange = (event) => {
    const { name, value } = event.target
    setShipping((current) => ({ ...current, [name]: value }))
    setFieldErrors((current) => ({ ...current, [name]: '' }))
  }

  const openProfileModal = () => {
    setProfileDraft(member)
    setProfileError('')
    setActiveModal('profile')
  }

  const saveProfile = async () => {
    const nickname = profileDraft.name.trim()
    const phone = profileDraft.phone.trim()

    if (!nickname || !phone) {
      setProfileError('성함과 휴대폰 번호를 입력해주세요.')
      return
    }

    if (!currentUser) return

    setIsSavingProfile(true)
    setProfileError('')
    try {
      await updateDocument('users', currentUser.uid, { nickname, phone })
      await updateProfile(currentUser, { displayName: nickname })
      setMemberData((current) => ({ ...current, nickname, phone }))
      setActiveModal(null)
    } catch (error) {
      console.error('기본정보 저장 실패:', error)
      setProfileError('기본정보를 저장하지 못했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  const applySelectedAddress = () => {
    const selectedAddress = savedAddresses.find((address) => address.id === selectedAddressId)

    if (!selectedAddress) return

    setShipping((current) => ({
      ...current,
      recipient: selectedAddress.recipient,
      phone: selectedAddress.phone,
      address: selectedAddress.address,
      detailAddress: selectedAddress.detailAddress,
    }))
    setFieldErrors((current) => ({
      ...current,
      recipient: '',
      phone: '',
      address: '',
    }))
    setDeliveryMode('default')
    setActiveModal(null)
  }

  const handleDeliveryModeChange = (mode) => {
    setDeliveryMode(mode)

    if (mode === 'default') {
      const defaultAddress = savedAddresses.find((address) => address.isDefault) || savedAddresses[0]
      if (defaultAddress) {
        setShipping((current) => ({
          ...current,
          recipient: defaultAddress.recipient,
          phone: defaultAddress.phone,
          address: defaultAddress.address,
          detailAddress: defaultAddress.detailAddress,
        }))
      }
    }

    if (mode === 'orderer') {
      setShipping((current) => ({
        ...current,
        recipient: member.name,
        phone: member.phone === '등록되지 않음' ? '' : member.phone,
      }))
    }
  }

  const handlePointChange = (event) => {
    const nextValue = event.target.value
    setPointInput(nextValue === '' ? '' : String(Math.max(0, Math.min(Number(nextValue) || 0, allUsablePoints))))
  }

  const handleUseAllPoints = () => {
    setPointInput(isUsingAllPoints ? '0' : String(allUsablePoints))
  }

  const handleMemoPreset = (memo) => {
    const isCustom = memo === '기타'
    setShipping((current) => ({ ...current, memo: isCustom ? '' : memo }))
  }

  const handleAddressDraftChange = (event) => {
    const { name, value } = event.target
    setAddressDraft((current) => ({ ...current, [name]: value }))
    setAddressError('')
  }

  const saveAddress = async () => {
    if (!addressDraft.label || !addressDraft.recipient || !addressDraft.phone || !addressDraft.address) {
      setAddressError('배송지명, 받으실 분, 휴대폰 번호, 주소를 입력해주세요.')
      return
    }

    if (!currentUser) return

    try {
      const addressId = await addDocument(`users/${currentUser.uid}/addresses`, {
        ...addressDraft,
        isDefault: savedAddresses.length === 0,
      })
      const nextAddress = { ...addressDraft, id: addressId, isDefault: savedAddresses.length === 0 }
      setSavedAddresses((current) => [...current, nextAddress])
      setSelectedAddressId(addressId)
      setShipping((current) => ({ ...current, recipient: nextAddress.recipient, phone: nextAddress.phone, address: nextAddress.address, detailAddress: nextAddress.detailAddress }))
      setDeliveryMode('default')
      setAddressDraft(emptyAddressDraft)
      setIsAddingAddress(false)
      setActiveModal(null)
    } catch (error) {
      console.error('배송지 저장 실패:', error)
      setAddressError('배송지를 저장하지 못했습니다. 잠시 후 다시 시도해주세요.')
    }
  }

  const handlePayment = async () => {
    if (!currentUser) {
      setSubmitError('로그인 후 주문할 수 있습니다.')
      return
    }

    if (orderItems.length === 0) {
      setSubmitError('주문할 상품이 없습니다. 장바구니에서 다시 진행해주세요.')
      return
    }

    const nextFieldErrors = {
      recipient: shipping.recipient ? '' : '받으실 분을 입력해주세요.',
      phone: shipping.phone ? '' : '휴대폰 번호를 입력해주세요.',
      address: shipping.address ? '' : '주소를 입력해주세요.',
    }

    if (Object.values(nextFieldErrors).some(Boolean)) {
      setFieldErrors(nextFieldErrors)
      setSubmitError('받으실 분, 주소, 휴대폰 번호를 입력해주세요.')
      return
    }

    if (!agreed) {
      setSubmitError('구매 진행 동의가 필요합니다.')
      return
    }

    setIsSubmitting(true)
    setSubmitError('')

    const orderRef = doc(collection(db, 'orders'))
    const orderedAt = new Date().toISOString()
    const orderSnapshot = {
      orderId: orderRef.id,
      userId: currentUser.uid,
      customerName: member.name,
      items: orderItems.map((item) => ({
        productId: item.id,
        productName: item.name,
        price: item.price - item.discount,
        quantity: item.quantity,
        imageUrl: item.imageUrl || '',
      })),
      // 리뷰 작성 권한 확인에 사용한다. Firestore Rules에서 orderId와 함께 검증한다.
      productIds: orderItems.map((item) => item.id),
      shipping,
      paymentMethod,
      productAmount: itemTotal,
      shippingFee: 0,
      discountAmount: orderItems.reduce(
        (sum, item) => sum + item.discount * item.quantity,
        0,
      ),
      usedPoints,
      totalAmount: totalPrice,
      status: ORDER_STATUS.PAID,
      createdAt: serverTimestamp(),
    }

    try {
      const batch = writeBatch(db)
      batch.set(orderRef, orderSnapshot)

      if (usedPoints > 0) {
        batch.update(doc(db, 'users', currentUser.uid), {
          points: Math.max(availablePoints - usedPoints, 0),
          updatedAt: serverTimestamp(),
        })
      }

      await batch.commit()
      if (saveDelivery) {
        const hasSameAddress = savedAddresses.some((address) => (
          address.recipient === shipping.recipient
          && address.phone === shipping.phone
          && address.address === shipping.address
          && address.detailAddress === shipping.detailAddress
        ))

        if (!hasSameAddress) {
          try {
            const addressId = await addDocument(`users/${currentUser.uid}/addresses`, {
              label: '최근 배송지',
              recipient: shipping.recipient,
              phone: shipping.phone,
              address: shipping.address,
              detailAddress: shipping.detailAddress,
              isDefault: savedAddresses.length === 0,
            })
            setSavedAddresses((current) => [...current, {
              label: '최근 배송지',
              recipient: shipping.recipient,
              phone: shipping.phone,
              address: shipping.address,
              detailAddress: shipping.detailAddress,
              isDefault: savedAddresses.length === 0,
              id: addressId,
            }])
          } catch (addressError) {
            console.error('주문 후 배송지 저장 실패:', addressError)
          }
        }
      }
      clearCart()
      try {
        await clearRemoteCart(currentUser.uid)
      } catch (cartError) {
        console.error('주문 후 장바구니 초기화 실패:', cartError)
      }
      navigate('/order-complete', {
        replace: true,
        state: {
          order: {
            ...orderSnapshot,
            createdAt: orderedAt,
          },
        },
      })
    } catch (error) {
      console.error('주문 저장 실패:', error)
      setSubmitError('주문을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className={styles.page} aria-labelledby="checkout-title">
      <img className={styles.topOrnament} src={cartTopOrnament} alt="" />

      <header className={styles.pageHeader}>
        <h1 id="checkout-title">주문서 작성 / 결제</h1>
        <PurchaseSteps />
      </header>

      <div className={styles.mainGrid}>
        <div className={styles.checkoutContent}>
          <section className={styles.productSection} aria-label="주문 상품">
            <div className={styles.productHead}>
              <span>상품 정보</span><span>할인</span><span>합계</span><span>수량</span>
            </div>
            {orderItems.length === 0 && (
              <p role="status">장바구니에서 주문할 상품을 선택해주세요.</p>
            )}
            {orderItems.map((item) => (
              <article className={styles.productRow} key={item.id}>
                <div className={styles.productInfo}>
                  <div className={styles.productImage}>
                    {item.imageUrl ? <img src={item.imageUrl} alt={item.name} /> : <span>IMG</span>}
                  </div>
                  <div>
                    <strong>{item.name}</strong>
                    <span>{item.option}</span>
                  </div>
                </div>
                <span>{item.discount ? `-${formatPrice(item.discount)}` : '0원'}</span>
                <span>{formatPrice((item.price - item.discount) * item.quantity)}</span>
                <strong>{item.quantity}개</strong>
              </article>
            ))}
          </section>

          <button type="button" className={styles.backToCart} onClick={() => navigate(PATHS.cart)}>← 장바구니 가기</button>

          <section className={styles.formSection} aria-labelledby="orderer-info-title">
            <h2 id="orderer-info-title">주문자 정보</h2>
            <div className={styles.formCard}>
              <div className={styles.optionLine}>
                <strong>배송지 확인</strong>
                <ChoiceRadio
                  name="ordererMode"
                  checked={ordererMode === 'member'}
                  onChange={() => setOrdererMode('member')}
                  label="기본 정보와 동일"
                />
                <ChoiceRadio
                  name="ordererMode"
                  checked={ordererMode === 'direct'}
                  onChange={() => setOrdererMode('direct')}
                  label="직접 입력"
                />
                <button type="button" onClick={openProfileModal}>기본 정보 관리</button>
              </div>
              <dl className={styles.ordererInfo}>
                <div><dt>주문자 성함</dt><dd>{member.name}</dd></div>
                <div><dt>휴대폰 번호</dt><dd>{member.phone}</dd></div>
                <div><dt>이메일</dt><dd>{member.email}</dd></div>
              </dl>
            </div>
          </section>

          <section className={styles.formSection} aria-labelledby="delivery-info-title">
            <h2 id="delivery-info-title">배송 정보</h2>
            <div className={`${styles.formCard} ${styles.deliveryCard}`}>
              <div className={styles.optionLine}>
                <strong>배송지 확인</strong>
                <ChoiceRadio
                  name="deliveryMode"
                  checked={deliveryMode === 'default'}
                  onChange={() => handleDeliveryModeChange('default')}
                  label="기본 배송지"
                />
                <ChoiceRadio
                  name="deliveryMode"
                  checked={deliveryMode === 'direct'}
                  onChange={() => handleDeliveryModeChange('direct')}
                  label="직접 입력"
                />
                <ChoiceRadio
                  name="deliveryMode"
                  checked={deliveryMode === 'orderer'}
                  onChange={() => handleDeliveryModeChange('orderer')}
                  label="주문자 정보와 동일"
                />
                <button type="button" onClick={() => setActiveModal('address')}>배송지 관리</button>
              </div>

              <div className={styles.inputRows}>
                <label><span>받으실 분</span><div><input className={fieldErrors.recipient ? styles.inputError : ''} name="recipient" type="text" value={shipping.recipient} onChange={handleShippingChange} placeholder="성함을 입력해주세요" />{fieldErrors.recipient && <small>{fieldErrors.recipient}</small>}</div></label>
                <div className={styles.addressRow}>
                  <span>받으실 곳</span>
                  <div>
                    <input className={fieldErrors.address ? styles.inputError : ''} name="address" type="text" value={shipping.address} onChange={handleShippingChange} placeholder="주소를 검색해주세요" />
                    {fieldErrors.address && <small>{fieldErrors.address}</small>}
                    <input name="detailAddress" type="text" value={shipping.detailAddress} onChange={handleShippingChange} placeholder="상세 주소를 입력해주세요" />
                  </div>
                </div>
                <label><span>휴대폰 번호</span><div><input className={fieldErrors.phone ? styles.inputError : ''} name="phone" type="tel" value={shipping.phone} onChange={handleShippingChange} placeholder="휴대폰 번호를 입력해주세요" />{fieldErrors.phone && <small>{fieldErrors.phone}</small>}</div></label>
                <label><span>남기실 말씀</span><div><input name="memo" type="text" value={shipping.memo} onChange={handleShippingChange} placeholder="문구를 작성해주세요" /><div className={styles.memoChips}>{[...deliveryMemoPresets, '기타'].map((memo) => <button type="button" key={memo} onClick={() => handleMemoPreset(memo)}>{memo}</button>)}</div></div></label>
              </div>

              <div className={styles.saveLine}>
                <strong>회원 정보 반영</strong>
                <RoundCheckbox
                  checked={saveDelivery}
                  onChange={(event) => setSaveDelivery(event.target.checked)}
                  label="나의 배송지에 추가합니다."
                />
              </div>

              <div className={styles.paymentSection}>
                <h3>결제 수단 선택 / 결제</h3>
                <div className={styles.paymentOptions}>
                  <strong>일반 결제</strong>
                  {[
                    ['bank', '무통장 입금'], ['card', '신용카드'], ['virtual', '가상계좌'],
                    ['payco', '페이코'], ['naver', '네이버페이'], ['kakao', '카카오페이'], ['toss', '토스페이'],
                  ].map(([value, label]) => (
                    <ChoiceRadio
                      key={value}
                      name="payment"
                      checked={paymentMethod === value}
                      onChange={() => setPaymentMethod(value)}
                      label={label}
                    />
                  ))}
                </div>
              </div>

              <div className={styles.agreementLine}>
                <RoundCheckbox
                  checked={agreed}
                  onChange={(event) => setAgreed(event.target.checked)}
                  label="(필수) 구매하실 상품의 결제 정보를 확인하였으며, 구매 진행에 동의합니다."
                />
              </div>
            </div>
          </section>
        </div>

        <aside className={styles.summaryCard} aria-label="주문 금액">
          <h2><span>주문 금액</span><em>선택 {orderItems.length}개</em></h2>
          <dl className={styles.summaryList}>
            <div><dt>총 상품 금액</dt><dd>{formatPrice(itemTotal)}</dd></div>
            <div><dt>상품 할인</dt><dd>{formatPrice(0)}</dd></div>
            <div><dt>배송비</dt><dd>{formatPrice(0)}</dd></div>
          </dl>
          <div className={styles.pointSection}>
            <div className={styles.pointHeading}><h3>포인트 사용</h3><span>보유 {availablePoints.toLocaleString('ko-KR')}P</span></div>
            <div className={styles.pointInputRow}>
              <label><input type="number" min="0" max={allUsablePoints} value={pointInput} onChange={handlePointChange} /><span>P</span></label>
              <button type="button" onClick={handleUseAllPoints}>{isUsingAllPoints ? '사용 취소' : '전액사용'}</button>
            </div>
            <p><span>사용 포인트</span><strong>-{usedPoints.toLocaleString('ko-KR')}P</strong></p>
          </div>
          <div className={styles.totalPrice}><span>총 결제 금액</span><strong>{formatPrice(totalPrice)}</strong></div>

          {submitError && <p className={styles.submitError} role="alert">{submitError}</p>}

          <button
            type="button"
            className={styles.payButton}
            disabled={!agreed || isSubmitting || orderItems.length === 0}
            onClick={handlePayment}
          >
            {isSubmitting ? '주문 저장 중...' : '결제하기'}
          </button>
        </aside>
      </div>

      {activeModal && (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={() => setActiveModal(null)}>
          <section className={styles.managementModal} role="dialog" aria-modal="true" aria-labelledby="checkout-modal-title" onMouseDown={(event) => event.stopPropagation()}>
            <header className={styles.modalHeader}>
              <div>
                <p className={styles.modalEyebrow}>{activeModal === 'profile' ? 'MY PROFILE' : 'DELIVERY ADDRESS'}</p>
                <h2 id="checkout-modal-title">{activeModal === 'profile' ? '기본 정보 관리' : '배송지 관리'}</h2>
                <p>{activeModal === 'profile' ? '주문에 사용할 회원 정보를 확인하고 수정할 수 있습니다.' : '주문에 사용할 배송지를 선택해주세요.'}</p>
              </div>
              <button className={styles.modalClose} type="button" onClick={() => setActiveModal(null)} aria-label="닫기">×</button>
            </header>

            {activeModal === 'profile' ? (
              <div className={styles.modalBody}>
                <p className={styles.modalNotice}>안전한 주문을 위해 회원 정보를 한 번 더 확인해주세요.</p>
                <div className={styles.profileFields}>
                  <label><span>성함</span><input value={profileDraft.name} onChange={(event) => setProfileDraft((current) => ({ ...current, name: event.target.value }))} /></label>
                  <label><span>휴대폰 번호</span><input value={profileDraft.phone} onChange={(event) => setProfileDraft((current) => ({ ...current, phone: event.target.value }))} /></label>
                  <label><span>이메일</span><input type="email" value={profileDraft.email} readOnly /></label>
                </div>
                {profileError && <p className={styles.addressError} role="alert">{profileError}</p>}
              </div>
            ) : (
              <div className={styles.modalBody}>
                {!isAddingAddress && <button className={styles.addAddressButton} type="button" onClick={() => setIsAddingAddress(true)}>+ 새 배송지 추가</button>}
                {isAddingAddress ? (
                  <div className={styles.addressForm}>
                    <label><span>배송지명</span><input name="label" value={addressDraft.label} onChange={handleAddressDraftChange} placeholder="예: 우리 집" /></label>
                    <label><span>받으실 분</span><input name="recipient" value={addressDraft.recipient} onChange={handleAddressDraftChange} placeholder="성함을 입력해주세요" /></label>
                    <label><span>휴대폰 번호</span><input name="phone" value={addressDraft.phone} onChange={handleAddressDraftChange} placeholder="010-0000-0000" /></label>
                    <label><span>주소</span><input name="address" value={addressDraft.address} onChange={handleAddressDraftChange} placeholder="주소를 입력해주세요" /></label>
                    <label><span>상세 주소</span><input name="detailAddress" value={addressDraft.detailAddress} onChange={handleAddressDraftChange} placeholder="상세 주소를 입력해주세요" /></label>
                    {addressError && <p className={styles.addressError} role="alert">{addressError}</p>}
                  </div>
                ) : <div className={styles.addressList}>
                  {savedAddresses.map((address) => (
                    <label className={`${styles.addressOption} ${selectedAddressId === address.id ? styles.selectedAddress : ''}`} key={address.id}>
                      <input type="radio" name="savedAddress" checked={selectedAddressId === address.id} onChange={() => setSelectedAddressId(address.id)} />
                      <span className={styles.addressRadio} aria-hidden="true" />
                      <span className={styles.addressCopy}>
                        <strong>{address.label}{address.isDefault && <em>기본 배송지</em>}</strong>
                        <span>{address.recipient} · {address.phone}</span>
                        <span>{address.address} {address.detailAddress}</span>
                      </span>
                    </label>
                  ))}
                </div>}
                <p className={styles.modalNotice}>{isAddingAddress ? '추가한 배송지는 현재 주문 화면에서만 사용할 수 있습니다.' : '선택한 배송지는 현재 주문서 입력란에만 반영됩니다.'}</p>
              </div>
            )}

            <footer className={styles.modalFooter}>
              <button type="button" onClick={() => setActiveModal(null)}>취소</button>
              <button className={styles.modalConfirm} type="button" disabled={isSavingProfile} onClick={activeModal === 'profile' ? saveProfile : isAddingAddress ? saveAddress : applySelectedAddress}>
                {activeModal === 'profile' ? (isSavingProfile ? '저장 중...' : '저장') : isAddingAddress ? '배송지 추가' : '선택한 배송지 적용'}
              </button>
            </footer>
          </section>
        </div>
      )}
    </section>
  )
}

export default Checkout
