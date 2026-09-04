import { useEffect, useState } from 'react'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'

import { subscribeToAuthState } from '../../firebase/auth'
import { db } from '../../firebase/firebase'

import styles from './AddressBook.module.scss'


const EMPTY_FORM = {
  label: '',
  recipient: '',
  address: '',
  phone: '',
  isDefault: false,
}


const AddressBook = () => {
  const [currentUser, setCurrentUser] = useState(undefined)

  const [addresses, setAddresses] = useState([])
  const [selectedAddressId, setSelectedAddressId] = useState(null)

  const [mode, setMode] = useState('list')
  const [editingId, setEditingId] = useState(null)

  const [form, setForm] = useState(EMPTY_FORM)

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const [loadError, setLoadError] = useState('')
  const [formError, setFormError] = useState('')
  const [notice, setNotice] = useState('')


  /* =========================
     로그인 상태
  ========================= */

  useEffect(() => {
    const unsubscribe =
      subscribeToAuthState(setCurrentUser)

    return unsubscribe
  }, [])


  /* =========================
     배송지 조회
  ========================= */

  useEffect(() => {
    if (currentUser === undefined) {
      return undefined
    }

    if (!currentUser) {
      setAddresses([])
      setIsLoading(false)

      return undefined
    }

    let isMounted = true


    const loadAddresses = async () => {
      setIsLoading(true)
      setLoadError('')

      try {
        const snapshot = await getDocs(
          collection(
            db,
            'users',
            currentUser.uid,
            'addresses'
          )
        )

        if (!isMounted) {
          return
        }

        const nextAddresses = snapshot.docs.map(
          (addressDocument) => {
            const data = addressDocument.data()

            return {
              id: addressDocument.id,

              label:
                data.label ||
                data.name ||
                '배송지',

              recipient:
                data.recipient ||
                data.receiver ||
                '',

              address:
                [
                  data.address,
                  data.detailAddress,
                ]
                  .filter(Boolean)
                  .join(' '),

              phone:
                data.phone ||
                '',

              isDefault:
                Boolean(
                  data.isDefault
                ),

              createdAt:
                data.createdAt,
            }
          }
        )


        nextAddresses.sort((a, b) => {
          if (
            a.isDefault !==
            b.isDefault
          ) {
            return a.isDefault
              ? -1
              : 1
          }

          return (
            Number(
              b.createdAt?.seconds ||
                0
            ) -
            Number(
              a.createdAt?.seconds ||
                0
            )
          )
        })


        setAddresses(nextAddresses)

        setSelectedAddressId(
          nextAddresses[0]?.id ||
          null
        )
      } catch (error) {
        console.error(
          '배송지 조회 실패:',
          error
        )

        if (isMounted) {
          setAddresses([])

          setLoadError(
            '배송지 정보를 불러오지 못했습니다.'
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }


    loadAddresses()


    return () => {
      isMounted = false
    }
  }, [currentUser])


  /* =========================
     공통
  ========================= */

  const showNotice = (message) => {
    setNotice(message)

    window.setTimeout(
      () => {
        setNotice('')
      },
      1800
    )
  }


  const defaultAddress =
    addresses.find(
      (address) =>
        address.isDefault
    )


  /* =========================
     추가 화면
  ========================= */

  const handleOpenAdd = () => {
    setEditingId(null)

    setForm({
      ...EMPTY_FORM,

      isDefault:
        addresses.length === 0,
    })

    setFormError('')
    setMode('form')
  }


  /* =========================
     수정 화면
  ========================= */

  const handleOpenEdit = (
    address
  ) => {
    setEditingId(address.id)

    setForm({
      label:
        address.label,

      recipient:
        address.recipient,

      address:
        address.address,

      phone:
        address.phone,

      isDefault:
        address.isDefault,
    })

    setFormError('')
    setMode('form')
  }


  const handleCancelForm = () => {
    setMode('list')
    setEditingId(null)
    setForm(EMPTY_FORM)
    setFormError('')
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
     기본 배송지 일괄 해제
  ========================= */

  const clearDefaultAddresses =
    async () => {
      if (!currentUser) {
        return
      }

      const batch =
        writeBatch(db)

      addresses.forEach(
        (address) => {
          if (
            address.isDefault
          ) {
            batch.update(
              doc(
                db,
                'users',
                currentUser.uid,
                'addresses',
                address.id
              ),
              {
                isDefault: false,
              }
            )
          }
        }
      )

      await batch.commit()
    }


  /* =========================
     배송지 저장
  ========================= */

  const handleSubmit = async (
    event
  ) => {
    event.preventDefault()

    if (!currentUser) {
      setFormError(
        '로그인 후 배송지를 등록할 수 있습니다.'
      )

      return
    }


    const label =
      form.label.trim()

    const recipient =
      form.recipient.trim()

    const address =
      form.address.trim()

    const phone =
      form.phone.trim()


    if (!label) {
      setFormError(
        '배송지 이름을 입력해주세요.'
      )

      return
    }


    if (!recipient) {
      setFormError(
        '받는 분을 입력해주세요.'
      )

      return
    }


    if (!address) {
      setFormError(
        '배송지 주소를 입력해주세요.'
      )

      return
    }


    if (!phone) {
      setFormError(
        '휴대폰 번호를 입력해주세요.'
      )

      return
    }


    try {
      setIsSaving(true)
      setFormError('')


      if (form.isDefault) {
        await clearDefaultAddresses()
      }


      const payload = {
        label,
        recipient,
        address,
        detailAddress: '',
        phone,

        isDefault:
          form.isDefault ||
          addresses.length === 0,

        updatedAt:
          serverTimestamp(),
      }


      if (editingId) {
        await updateDoc(
          doc(
            db,
            'users',
            currentUser.uid,
            'addresses',
            editingId
          ),
          payload
        )


        setAddresses(
          (current) =>
            current.map(
              (item) => ({
                ...item,

                ...(item.id ===
                editingId
                  ? {
                      ...payload,

                      updatedAt:
                        new Date(),
                    }
                  : form.isDefault
                    ? {
                        isDefault:
                          false,
                      }
                    : {}),
              })
            )
        )

        showNotice(
          '배송지가 수정되었습니다.'
        )
      } else {
        const documentRef =
          await addDoc(
            collection(
              db,
              'users',
              currentUser.uid,
              'addresses'
            ),
            {
              ...payload,

              createdAt:
                serverTimestamp(),
            }
          )


        setAddresses(
          (current) => [
            ...(
              form.isDefault ||
              current.length === 0
                ? current.map(
                    (item) => ({
                      ...item,

                      isDefault:
                        false,
                    })
                  )
                : current
            ),

            {
              id:
                documentRef.id,

              ...payload,

              createdAt:
                new Date(),
            },
          ]
        )

        showNotice(
          '새 배송지가 등록되었습니다.'
        )
      }


      setMode('list')
      setEditingId(null)
      setForm(EMPTY_FORM)
    } catch (error) {
      console.error(
        '배송지 저장 실패:',
        error
      )

      setFormError(
        '배송지 저장 중 오류가 발생했습니다.'
      )
    } finally {
      setIsSaving(false)
    }
  }


  /* =========================
     기본 배송지 설정
  ========================= */

  const handleSetDefault =
    async (addressId) => {
      if (
        !currentUser ||
        !addressId
      ) {
        return
      }


      try {
        const batch =
          writeBatch(db)


        addresses.forEach(
          (address) => {
            batch.update(
              doc(
                db,
                'users',
                currentUser.uid,
                'addresses',
                address.id
              ),
              {
                isDefault:
                  address.id ===
                  addressId,
              }
            )
          }
        )


        await batch.commit()


        setAddresses(
          (current) =>
            current
              .map(
                (address) => ({
                  ...address,

                  isDefault:
                    address.id ===
                    addressId,
                })
              )
              .sort(
                (a, b) =>
                  Number(
                    b.isDefault
                  ) -
                  Number(
                    a.isDefault
                  )
              )
        )


        setSelectedAddressId(
          addressId
        )

        showNotice(
          '기본 배송지가 변경되었습니다.'
        )
      } catch (error) {
        console.error(
          '기본 배송지 변경 실패:',
          error
        )

        showNotice(
          '기본 배송지를 변경하지 못했습니다.'
        )
      }
    }


  /* =========================
     배송지 삭제
  ========================= */

  const handleDelete =
    async (address) => {
      if (
        !currentUser ||
        !address
      ) {
        return
      }


      const confirmed =
        window.confirm(
          `'${address.label}' 배송지를 삭제하시겠습니까?`
        )


      if (!confirmed) {
        return
      }


      try {
        await deleteDoc(
          doc(
            db,
            'users',
            currentUser.uid,
            'addresses',
            address.id
          )
        )


        const remaining =
          addresses.filter(
            (item) =>
              item.id !==
              address.id
          )


        /*
         * 기본 배송지를 삭제했는데
         * 다른 배송지가 남아 있으면
         * 첫 번째 배송지를 기본으로 설정
         */
        if (
          address.isDefault &&
          remaining.length > 0
        ) {
          const nextDefault =
            remaining[0]

          await updateDoc(
            doc(
              db,
              'users',
              currentUser.uid,
              'addresses',
              nextDefault.id
            ),
            {
              isDefault: true,
            }
          )

          nextDefault.isDefault =
            true
        }


        setAddresses(remaining)

        setSelectedAddressId(
          remaining[0]?.id ||
          null
        )


        showNotice(
          '배송지가 삭제되었습니다.'
        )
      } catch (error) {
        console.error(
          '배송지 삭제 실패:',
          error
        )

        showNotice(
          '배송지 삭제 중 오류가 발생했습니다.'
        )
      }
    }


  /* =========================
     로딩
  ========================= */

  if (isLoading) {
    return (
      <section
        className={styles.page}
      >
        <div
          className={
            styles.addressCard
          }
        >
          <p
            className={
              styles.loading
            }
          >
            배송지 정보를
            불러오는 중입니다...
          </p>
        </div>
      </section>
    )
  }


  return (
    <section
      className={styles.page}
      aria-labelledby="address-title"
    >

      <div
        className={
          styles.addressCard
        }
      >

        {/* =====================
            LIST
        ===================== */}

        {mode === 'list' ? (
          <>
            <header
              className={
                styles.pageHeader
              }
            >
              <div
                className={
                  styles.titleArea
                }
              >
                <h2
                  id="address-title"
                >
                  배송지 관리
                </h2>

                <p>
                  배송지와 기본 배송지를
                  자유롭게 관리할 수
                  있어요.
                </p>
              </div>
            </header>


            <div
              className={
                styles.titleDivider
              }
            />


            {loadError ? (
              <div
                className={
                  styles.stateBox
                }
                role="alert"
              >
                {loadError}
              </div>
            ) : addresses.length >
              0 ? (
              <>
                {/* 기본 배송지 */}

                <section
                  className={
                    styles.defaultSection
                  }
                >
                  <h3>
                    기본 배송지
                  </h3>


                  {defaultAddress ? (
                    <button
                      type="button"
                      className={
                        styles.defaultAddress
                      }
                      onClick={() =>
                        setSelectedAddressId(
                          defaultAddress.id
                        )
                      }
                    >
                      <span
                        className={
                          styles.checkIcon
                        }
                        aria-hidden="true"
                      >
                        ✓
                      </span>


                      <div
                        className={
                          styles.addressInfo
                        }
                      >
                        <strong>
                          {
                            defaultAddress.address
                          }
                        </strong>

                        <p>
                          {
                            defaultAddress.recipient
                          }

                          <span>
                            {
                              defaultAddress.phone
                            }
                          </span>
                        </p>
                      </div>
                    </button>
                  ) : (
                    <p
                      className={
                        styles.noDefault
                      }
                    >
                      기본 배송지가
                      설정되어 있지
                      않습니다.
                    </p>
                  )}
                </section>


                {/* 배송지 이름 탭 */}

                <div
                  className={
                    styles.addressTabs
                  }
                >
                  {addresses.map(
                    (address) => (
                      <button
                        key={
                          address.id
                        }
                        type="button"
                        className={`${styles.addressTab} ${
                          selectedAddressId ===
                          address.id
                            ? styles.activeTab
                            : ''
                        }`}
                        onClick={() =>
                          setSelectedAddressId(
                            address.id
                          )
                        }
                      >
                        <span
                          className={
                            styles.tabDot
                          }
                          aria-hidden="true"
                        />

                        {
                          address.label
                        }
                      </button>
                    )
                  )}


                  <button
                    type="button"
                    className={
                      styles.addCircleButton
                    }
                    aria-label="새 배송지 추가"
                    onClick={
                      handleOpenAdd
                    }
                  >
                    +
                  </button>
                </div>


                {/* 배송지 목록 */}

                <div
                  className={
                    styles.addressList
                  }
                >
                  {addresses.map(
                    (address) => (
                      <article
                        key={
                          address.id
                        }
                        className={`${styles.addressItem} ${
                          selectedAddressId ===
                          address.id
                            ? styles.selectedItem
                            : ''
                        }`}
                      >
                        <button
                          type="button"
                          className={
                            styles.addressSelect
                          }
                          onClick={() =>
                            setSelectedAddressId(
                              address.id
                            )
                          }
                        >
                          <span
                            className={
                              styles.itemCheck
                            }
                            aria-hidden="true"
                          >
                            ✓
                          </span>


                          <div
                            className={
                              styles.addressInfo
                            }
                          >
                            <div
                              className={
                                styles.itemTitle
                              }
                            >
                              <strong>
                                {
                                  address.address
                                }
                              </strong>

                              {address.isDefault && (
                                <span
                                  className={
                                    styles.defaultBadge
                                  }
                                >
                                  기본
                                </span>
                              )}
                            </div>


                            <p>
                              {
                                address.recipient
                              }

                              <span>
                                {
                                  address.phone
                                }
                              </span>
                            </p>
                          </div>
                        </button>


                        <div
                          className={
                            styles.itemActions
                          }
                        >
                          {!address.isDefault && (
                            <button
                              type="button"
                              onClick={() =>
                                handleSetDefault(
                                  address.id
                                )
                              }
                            >
                              기본 설정
                            </button>
                          )}


                          <button
                            type="button"
                            onClick={() =>
                              handleOpenEdit(
                                address
                              )
                            }
                          >
                            수정
                          </button>


                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                address
                              )
                            }
                          >
                            삭제
                          </button>
                        </div>
                      </article>
                    )
                  )}
                </div>


                <button
                  type="button"
                  className={
                    styles.addAddressButton
                  }
                  onClick={
                    handleOpenAdd
                  }
                >
                  + 새 배송지 추가
                </button>
              </>
            ) : (
              <div
                className={
                  styles.emptyState
                }
              >
                <span
                  className={
                    styles.emptyIcon
                  }
                  aria-hidden="true"
                >
                  ⌂
                </span>

                <strong>
                  등록된 배송지가
                  없습니다.
                </strong>

                <p>
                  자주 사용하는
                  배송지를 등록해보세요.
                </p>

                <button
                  type="button"
                  onClick={
                    handleOpenAdd
                  }
                >
                  배송지 추가
                </button>
              </div>
            )}
          </>
        ) : (

          /* =====================
              ADD / EDIT FORM
          ===================== */

          <>
            <header
              className={
                styles.pageHeader
              }
            >
              <div
                className={
                  styles.titleArea
                }
              >
                <h2
                  id="address-title"
                >
                  {editingId
                    ? '배송지 수정'
                    : '배송지 추가'}
                </h2>
              </div>
            </header>


            <div
              className={
                styles.titleDivider
              }
            />


            <form
              className={
                styles.addressForm
              }
              onSubmit={
                handleSubmit
              }
            >

              <label
                className={
                  styles.formRow
                }
              >
                <span>
                  배송지 이름
                </span>

                <input
                  type="text"
                  name="label"
                  value={
                    form.label
                  }
                  placeholder="이름을 입력해주세요"
                  onChange={
                    handleChange
                  }
                />
              </label>


              <label
                className={
                  styles.formRow
                }
              >
                <span>
                  받는 분
                </span>

                <input
                  type="text"
                  name="recipient"
                  value={
                    form.recipient
                  }
                  placeholder="받는 분을 입력해주세요"
                  onChange={
                    handleChange
                  }
                />
              </label>


              <label
                className={
                  styles.formRow
                }
              >
                <span>
                  받으실 곳
                </span>

                <input
                  type="text"
                  name="address"
                  value={
                    form.address
                  }
                  placeholder="상세 주소를 입력해주세요"
                  onChange={
                    handleChange
                  }
                />
              </label>


              <label
                className={
                  styles.formRow
                }
              >
                <span>
                  휴대폰
                </span>

                <input
                  type="tel"
                  name="phone"
                  value={
                    form.phone
                  }
                  placeholder="휴대폰 번호를 입력해주세요"
                  onChange={
                    handleChange
                  }
                />
              </label>


              <label
                className={
                  styles.defaultCheck
                }
              >
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={
                    form.isDefault
                  }
                  onChange={
                    handleChange
                  }
                />

                <span
                  className={
                    styles.customCheck
                  }
                  aria-hidden="true"
                />

                <span>
                  기본 배송지로
                  설정합니다.
                </span>
              </label>


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
                    styles.cancelButton
                  }
                  onClick={
                    handleCancelForm
                  }
                >
                  취소
                </button>


                <button
                  type="submit"
                  className={
                    styles.saveButton
                  }
                  disabled={
                    isSaving
                  }
                >
                  {isSaving
                    ? '저장 중...'
                    : editingId
                      ? '수정 완료'
                      : '배송지 저장'}
                </button>
              </div>
            </form>
          </>
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


export default AddressBook