import {
  useEffect,
  useMemo,
  useState,
} from 'react'

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

import {
  subscribeToAuthState,
} from '../../firebase/auth'

import {
  db,
} from '../../firebase/firebase'

import MyPageHeader from '../../components/mypage/MyPageHeader'

import styles from './AddressBook.module.scss'


const ADDRESSES_PER_PAGE = 4


const EMPTY_FORM = {
  label: '',
  recipient: '',
  address: '',
  phone: '',
  isDefault: false,
}


const EMPTY_FIELD_ERRORS = {
  label: '',
  recipient: '',
  address: '',
  phone: '',
}


/* =========================
   PHONE
========================= */

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


/* =========================
   RECIPIENT
========================= */

const isValidRecipient = (
  value
) =>
  /^[\p{L}\s·.'-]+$/u.test(
    value
  )


/* =========================
   ICON
========================= */

const LocationIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />

    <circle
      cx="12"
      cy="10"
      r="2.5"
    />
  </svg>
)


const PlusIcon = () => (
  <svg
    viewBox="0 0 24 24"
    aria-hidden="true"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.7"
    strokeLinecap="round"
  >
    <path d="M12 5v14" />
    <path d="M5 12h14" />
  </svg>
)


/* =========================
   SORT
========================= */

const getCreatedAtMs = (
  value
) => {
  if (!value) {
    return 0
  }


  if (
    typeof value.toDate ===
    'function'
  ) {
    return value
      .toDate()
      .getTime()
  }


  if (
    value instanceof Date
  ) {
    return value.getTime()
  }


  if (value.seconds) {
    return (
      Number(
        value.seconds
      ) * 1000
    )
  }


  const date =
    new Date(value)


  return Number.isNaN(
    date.getTime()
  )
    ? 0
    : date.getTime()
}


const sortAddresses = (
  items
) =>
  [...items].sort(
    (a, b) => {
      if (
        a.isDefault !==
        b.isDefault
      ) {
        return a.isDefault
          ? -1
          : 1
      }


      return (
        getCreatedAtMs(
          b.createdAt
        ) -
        getCreatedAtMs(
          a.createdAt
        )
      )
    }
  )


const AddressBook = () => {
  const [
    currentUser,
    setCurrentUser,
  ] = useState(undefined)


  const [
    addresses,
    setAddresses,
  ] = useState([])


  const [
    selectedAddressId,
    setSelectedAddressId,
  ] = useState(null)


  const [
    mode,
    setMode,
  ] = useState('list')


  const [
    editingId,
    setEditingId,
  ] = useState(null)


  const [
    form,
    setForm,
  ] = useState(
    EMPTY_FORM
  )


  const [
    fieldErrors,
    setFieldErrors,
  ] = useState(
    EMPTY_FIELD_ERRORS
  )


  const [
    isLoading,
    setIsLoading,
  ] = useState(true)


  const [
    isSaving,
    setIsSaving,
  ] = useState(false)


  const [
    loadError,
    setLoadError,
  ] = useState('')


  const [
    formError,
    setFormError,
  ] = useState('')


  const [
    notice,
    setNotice,
  ] = useState('')


  const [
    currentPage,
    setCurrentPage,
  ] = useState(1)


  /* =========================
     로그인 상태
  ========================= */

  useEffect(() => {
    const unsubscribe =
      subscribeToAuthState(
        setCurrentUser
      )


    return unsubscribe
  }, [])


  /* =========================
     배송지 조회
  ========================= */

  useEffect(() => {
    if (
      currentUser === undefined
    ) {
      return undefined
    }


    if (!currentUser) {
      setAddresses([])
      setIsLoading(false)

      return undefined
    }


    let isMounted = true


    const loadAddresses =
      async () => {
        setIsLoading(true)
        setLoadError('')


        try {
          const snapshot =
            await getDocs(
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


          const nextAddresses =
            snapshot.docs.map(
              (
                addressDocument
              ) => {
                const data =
                  addressDocument.data()


                return {
                  id:
                    addressDocument.id,

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
                    normalizePhone(
                      data.phone
                    ),

                  isDefault:
                    Boolean(
                      data.isDefault
                    ),

                  createdAt:
                    data.createdAt,
                }
              }
            )


          const sortedAddresses =
            sortAddresses(
              nextAddresses
            )


          setAddresses(
            sortedAddresses
          )


          setSelectedAddressId(
            sortedAddresses[0]
              ?.id ||
              null
          )


          setCurrentPage(1)
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
            setIsLoading(
              false
            )
          }
        }
      }


    loadAddresses()


    return () => {
      isMounted = false
    }
  }, [currentUser])


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
     DEFAULT
  ========================= */

  const defaultAddress =
    addresses.find(
      (address) =>
        address.isDefault
    )


  const otherAddresses =
    useMemo(
      () =>
        addresses.filter(
          (address) =>
            !address.isDefault
        ),
      [addresses]
    )


  /* =========================
     PAGINATION
  ========================= */

  const totalPages =
    Math.max(
      1,
      Math.ceil(
        otherAddresses.length /
          ADDRESSES_PER_PAGE
      )
    )


  const startIndex =
    (currentPage - 1) *
    ADDRESSES_PER_PAGE


  const visibleAddresses =
    otherAddresses.slice(
      startIndex,
      startIndex +
        ADDRESSES_PER_PAGE
    )


  useEffect(() => {
    if (
      currentPage >
      totalPages
    ) {
      setCurrentPage(
        totalPages
      )
    }
  }, [
    currentPage,
    totalPages,
  ])


  /* =========================
     FORM RESET
  ========================= */

  const resetFormErrors = () => {
    setFieldErrors(
      EMPTY_FIELD_ERRORS
    )

    setFormError('')
  }


  /* =========================
     추가
  ========================= */

  const handleOpenAdd = () => {
    setEditingId(null)


    setForm({
      ...EMPTY_FORM,

      isDefault:
        addresses.length === 0,
    })


    resetFormErrors()

    setMode('form')
  }


  /* =========================
     수정
  ========================= */

  const handleOpenEdit = (
    address
  ) => {
    setEditingId(
      address.id
    )


    setForm({
      label:
        address.label,

      recipient:
        address.recipient,

      address:
        address.address,

      phone:
        normalizePhone(
          address.phone
        ),

      isDefault:
        address.isDefault,
    })


    resetFormErrors()

    setMode('form')
  }


  const handleCancelForm =
    () => {
      setMode('list')

      setEditingId(null)

      setForm(
        EMPTY_FORM
      )

      resetFormErrors()
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


  /* =========================
     INPUT CHANGE
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


    /* =========================
       PHONE
    ========================= */

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
      } else if (
        numbers.length === 11 &&
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


    /* =========================
       RECIPIENT
    ========================= */

    if (
      name === 'recipient'
    ) {
      setForm(
        (current) => ({
          ...current,
          recipient: value,
        })
      )


      const trimmedValue =
        value.trim()


      if (
        trimmedValue &&
        !isValidRecipient(
          trimmedValue
        )
      ) {
        setFieldError(
          'recipient',
          '받는 분은 한글 또는 영문으로 입력해주세요.'
        )
      } else {
        setFieldError(
          'recipient',
          ''
        )
      }


      return
    }


    /* =========================
       COMMON
    ========================= */

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
      name === 'label'
    ) {
      if (!value.trim()) {
        setFieldError(
          'label',
          '배송지 이름을 입력해주세요.'
        )
      }

      return
    }


    if (
      name === 'recipient'
    ) {
      const recipient =
        value.trim()


      if (!recipient) {
        setFieldError(
          'recipient',
          '받는 분을 입력해주세요.'
        )

        return
      }


      if (
        !isValidRecipient(
          recipient
        )
      ) {
        setFieldError(
          'recipient',
          '받는 분은 한글 또는 영문으로 입력해주세요.'
        )
      }

      return
    }


    if (
      name === 'address'
    ) {
      if (!value.trim()) {
        setFieldError(
          'address',
          '배송지 주소를 입력해주세요.'
        )
      }

      return
    }


    if (
      name === 'phone'
    ) {
      const numbers =
        normalizePhone(
          value
        )


      if (!numbers) {
        setFieldError(
          'phone',
          '휴대폰 번호를 입력해주세요.'
        )

        return
      }


      if (
        !isPossiblePhonePrefix(
          numbers
        )
      ) {
        setFieldError(
          'phone',
          '휴대폰 번호는 010으로 시작해야 합니다.'
        )

        return
      }


      if (
        numbers.length !== 11
      ) {
        setFieldError(
          'phone',
          '010으로 시작하는 휴대폰 번호 11자리를 입력해주세요.'
        )

        return
      }


      if (
        !isValidPhone(
          numbers
        )
      ) {
        setFieldError(
          'phone',
          '올바른 휴대폰 번호를 입력해주세요.'
        )

        return
      }


      setFieldError(
        'phone',
        ''
      )
    }
  }


  /* =========================
     기본 배송지 해제
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
                isDefault:
                  false,
              }
            )
          }
        }
      )


      await batch.commit()
    }


  /* =========================
     SUBMIT
  ========================= */

  const handleSubmit =
    async (event) => {
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
        form.recipient
          .trim()
          .replace(
            /\s+/g,
            ' '
          )


      const address =
        form.address.trim()


      const phone =
        normalizePhone(
          form.phone
        )


      const nextErrors = {
        ...EMPTY_FIELD_ERRORS,
      }


      /* =========================
         LABEL
      ========================= */

      if (!label) {
        nextErrors.label =
          '배송지 이름을 입력해주세요.'
      } else if (
        label.length > 20
      ) {
        nextErrors.label =
          '배송지 이름은 20자 이하로 입력해주세요.'
      }


      /* =========================
         RECIPIENT
      ========================= */

      if (!recipient) {
        nextErrors.recipient =
          '받는 분을 입력해주세요.'
      } else if (
        !isValidRecipient(
          recipient
        )
      ) {
        nextErrors.recipient =
          '받는 분은 한글 또는 영문으로 입력해주세요.'
      } else if (
        recipient.length > 30
      ) {
        nextErrors.recipient =
          '받는 분은 30자 이하로 입력해주세요.'
      }


      /* =========================
         ADDRESS
      ========================= */

      if (!address) {
        nextErrors.address =
          '배송지 주소를 입력해주세요.'
      }


      /* =========================
         PHONE
      ========================= */

      if (!phone) {
        nextErrors.phone =
          '휴대폰 번호를 입력해주세요.'
      } else if (
        !isPossiblePhonePrefix(
          phone
        )
      ) {
        nextErrors.phone =
          '휴대폰 번호는 010으로 시작해야 합니다.'
      } else if (
        phone.length !== 11
      ) {
        nextErrors.phone =
          '010으로 시작하는 휴대폰 번호 11자리를 입력해주세요.'
      } else if (
        !isValidPhone(
          phone
        )
      ) {
        nextErrors.phone =
          '올바른 휴대폰 번호를 입력해주세요.'
      }


      setFieldErrors(
        nextErrors
      )


      const hasError =
        Object.values(
          nextErrors
        ).some(Boolean)


      if (hasError) {
        return
      }


      try {
        setIsSaving(true)
        setFormError('')


        if (
          form.isDefault
        ) {
          await clearDefaultAddresses()
        }


        const payload = {
          label,
          recipient,
          address,

          detailAddress: '',

          /*
           * DB에는 숫자만 저장
           * ex) 01012345678
           */
          phone,

          isDefault:
            form.isDefault ||
            addresses.length === 0,

          updatedAt:
            serverTimestamp(),
        }


        /* =========================
           EDIT
        ========================= */

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
            (current) => {
              const next =
                current.map(
                  (item) => ({
                    ...item,

                    ...(item.id ===
                    editingId
                      ? {
                          ...payload,
                        }

                      : form.isDefault
                        ? {
                            isDefault:
                              false,
                          }

                        : {}),
                  })
                )


              return sortAddresses(
                next
              )
            }
          )


          setSelectedAddressId(
            editingId
          )


          setCurrentPage(1)


          showNotice(
            '배송지가 수정되었습니다.'
          )
        } else {

          /* =========================
             ADD
          ========================= */

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


          const newAddress = {
            id:
              documentRef.id,

            ...payload,

            createdAt:
              new Date(),
          }


          setAddresses(
            (current) => {
              const normalizedCurrent =
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


              return sortAddresses(
                [
                  ...normalizedCurrent,
                  newAddress,
                ]
              )
            }
          )


          setSelectedAddressId(
            documentRef.id
          )


          setCurrentPage(1)


          showNotice(
            '새 배송지가 등록되었습니다.'
          )
        }


        setMode('list')

        setEditingId(null)

        setForm(
          EMPTY_FORM
        )

        setFieldErrors(
          EMPTY_FIELD_ERRORS
        )
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
            sortAddresses(
              current.map(
                (address) => ({
                  ...address,

                  isDefault:
                    address.id ===
                    addressId,
                })
              )
            )
        )


        setSelectedAddressId(
          addressId
        )


        setCurrentPage(1)


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
     DELETE
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


        let remaining =
          addresses.filter(
            (item) =>
              item.id !==
              address.id
          )


        /*
         * 기본 배송지를 삭제했는데
         * 다른 배송지가 있으면
         * 첫 배송지를 새 기본 배송지로
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
              isDefault:
                true,
            }
          )


          remaining =
            remaining.map(
              (item) => ({
                ...item,

                isDefault:
                  item.id ===
                  nextDefault.id,
              })
            )
        }


        const sortedRemaining =
          sortAddresses(
            remaining
          )


        setAddresses(
          sortedRemaining
        )


        setSelectedAddressId(
          sortedRemaining[0]
            ?.id ||
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
            styles.addressCard
          }
        >
          <MyPageHeader
            title="배송지 관리"
          />


          <div
            className={
              styles.stateBox
            }
            role="status"
          >
            <span
              className={
                styles.loadingSpinner
              }
              aria-hidden="true"
            />


            <strong>
              배송지 정보를 불러오는 중입니다.
            </strong>
          </div>
        </div>
      </section>
    )
  }


  /* =========================
     LOGIN REQUIRED (비회원)
  ========================= */

  if (!currentUser) {
    return (
      <section
        className={
          styles.page
        }
      >
        <div
          className={
            styles.addressCard
          }
        >
          <MyPageHeader
            title="배송지 관리"
          />


          <div
            className={
              styles.loginRequired
            }
          >
            <p>
              로그인 후 배송지를 확인하고 관리할 수 있어요.
            </p>
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
          styles.addressCard
        }
      >

        {/* =========================
            LIST
        ========================= */}

        {mode === 'list' ? (
          <>
            <MyPageHeader
              title="배송지 관리"
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

                {/* =========================
                    DEFAULT
                ========================= */}

                <section
                  className={
                    styles.defaultSection
                  }
                >
                  <h3>
                    기본 배송지
                  </h3>


                  {defaultAddress ? (
                    <div
                      className={
                        styles.defaultAddress
                      }
                    >
                      <span
                        className={
                          styles.defaultIcon
                        }
                        aria-hidden="true"
                      >
                        <LocationIcon />
                      </span>


                      <div
                        className={
                          styles.defaultInfo
                        }
                      >
                        <div
                          className={
                            styles.defaultTitleRow
                          }
                        >
                          <span
                            className={
                              styles.addressLabel
                            }
                          >
                            {
                              defaultAddress.label
                            }
                          </span>


                          <strong>
                            {
                              defaultAddress.address
                            }
                          </strong>
                        </div>


                        <p>
                          {
                            defaultAddress.recipient
                          }


                          <span>
                            {formatPhone(
                              defaultAddress.phone
                            )}
                          </span>
                        </p>
                      </div>


                      <div
                        className={
                          styles.defaultRight
                        }
                      >
                        <span
                          className={
                            styles.defaultBadge
                          }
                        >
                          기본
                        </span>


                        <button
                          type="button"
                          className={
                            styles.defaultEditButton
                          }
                          onClick={() =>
                            handleOpenEdit(
                              defaultAddress
                            )
                          }
                        >
                          수정
                        </button>


                        <button
                          type="button"
                          className={
                            styles.defaultDeleteButton
                          }
                          onClick={() =>
                            handleDelete(
                              defaultAddress
                            )
                          }
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={
                        styles.noDefault
                      }
                    >
                      기본 배송지가 없습니다.
                    </div>
                  )}
                </section>


                {/* =========================
                    LIST HEADER
                ========================= */}

                <div
                  className={
                    styles.listHeader
                  }
                >
                  <div
                    className={
                      styles.listTitle
                    }
                  >
                    <h3>
                      배송지 목록
                    </h3>


                    <span>
                      총{' '}

                      <strong>
                        {
                          addresses.length
                        }
                      </strong>

                      개
                    </span>
                  </div>


                  <button
                    type="button"
                    className={
                      styles.addButton
                    }
                    onClick={
                      handleOpenAdd
                    }
                  >
                    <PlusIcon />

                    새 배송지
                  </button>
                </div>


                {/* =========================
                    OTHER ADDRESSES
                ========================= */}

                {otherAddresses.length >
                  0 ? (
                  <>
                    <div
                      className={
                        styles.addressList
                      }
                    >
                      {visibleAddresses.map(
                        (
                          address
                        ) => (
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
                                className={`${styles.itemCheck} ${
                                  selectedAddressId ===
                                  address.id
                                    ? styles.checked
                                    : ''
                                }`}
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
                                  <span
                                    className={
                                      styles.addressLabel
                                    }
                                  >
                                    {
                                      address.label ||
                                      '배송지'
                                    }
                                  </span>


                                  <strong>
                                    {
                                      address.address
                                    }
                                  </strong>
                                </div>


                                <p>
                                  {
                                    address.recipient
                                  }


                                  <span>
                                    {formatPhone(
                                      address.phone
                                    )}
                                  </span>
                                </p>
                              </div>
                            </button>


                            <div
                              className={
                                styles.itemActions
                              }
                            >
                              <button
                                type="button"
                                className={
                                  styles.setDefaultButton
                                }
                                onClick={() =>
                                  handleSetDefault(
                                    address.id
                                  )
                                }
                              >
                                기본 설정
                              </button>


                              <button
                                type="button"
                                className={
                                  styles.editButton
                                }
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
                                className={
                                  styles.deleteButton
                                }
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


                    {/* =========================
                        PAGINATION
                    ========================= */}

                    {totalPages > 1 && (
                      <nav
                        className={
                          styles.pagination
                        }
                        aria-label="배송지 목록 페이지"
                      >
                        <button
                          type="button"
                          disabled={
                            currentPage ===
                            1
                          }
                          onClick={() =>
                            setCurrentPage(
                              Math.max(
                                1,
                                currentPage -
                                  1
                              )
                            )
                          }
                          aria-label="이전 페이지"
                        >
                          ‹
                        </button>


                        {Array.from(
                          {
                            length:
                              totalPages,
                          },
                          (
                            _,
                            index
                          ) => {
                            const pageNumber =
                              index + 1


                            return (
                              <button
                                key={
                                  pageNumber
                                }
                                type="button"
                                className={
                                  currentPage ===
                                  pageNumber
                                    ? styles.activePage
                                    : ''
                                }
                                onClick={() =>
                                  setCurrentPage(
                                    pageNumber
                                  )
                                }
                              >
                                {
                                  pageNumber
                                }
                              </button>
                            )
                          }
                        )}


                        <button
                          type="button"
                          disabled={
                            currentPage ===
                            totalPages
                          }
                          onClick={() =>
                            setCurrentPage(
                              Math.min(
                                totalPages,
                                currentPage +
                                  1
                              )
                            )
                          }
                          aria-label="다음 페이지"
                        >
                          ›
                        </button>
                      </nav>
                    )}
                  </>
                ) : (
                  <div
                    className={
                      styles.onlyDefaultState
                    }
                  >
                    추가로 등록된 배송지가 없습니다.
                  </div>
                )}

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
                  <LocationIcon />
                </span>


                <strong>
                  등록된 배송지가 없습니다.
                </strong>


                <button
                  type="button"
                  className={
                    styles.emptyButton
                  }
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

          /* =========================
              ADD / EDIT FORM
          ========================= */

          <>
            <div
              className={
                styles.formHeader
              }
            >
              <MyPageHeader
                title={
                  editingId
                    ? '배송지 수정'
                    : '배송지 추가'
                }
              />


              <button
                type="button"
                className={
                  styles.backButton
                }
                onClick={
                  handleCancelForm
                }
              >
                ‹ 목록으로
              </button>
            </div>


            <form
              className={
                styles.addressForm
              }
              onSubmit={
                handleSubmit
              }
              noValidate
            >

              {/* =========================
                  LABEL
              ========================= */}

              <div
                className={
                  styles.formField
                }
              >
                <label
                  htmlFor="address-label"
                  className={
                    styles.fieldLabel
                  }
                >
                  배송지 이름
                </label>


                <div
                  className={
                    styles.inputArea
                  }
                >
                  <input
                    id="address-label"
                    type="text"
                    name="label"
                    value={
                      form.label
                    }
                    maxLength={20}
                    placeholder="예: 집, 회사"
                    autoComplete="off"
                    className={
                      fieldErrors.label
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


                  {fieldErrors.label && (
                    <p
                      className={
                        styles.fieldError
                      }
                      role="alert"
                    >
                      {
                        fieldErrors.label
                      }
                    </p>
                  )}
                </div>
              </div>


              {/* =========================
                  RECIPIENT
              ========================= */}

              <div
                className={
                  styles.formField
                }
              >
                <label
                  htmlFor="address-recipient"
                  className={
                    styles.fieldLabel
                  }
                >
                  받는 분
                </label>


                <div
                  className={
                    styles.inputArea
                  }
                >
                  <input
                    id="address-recipient"
                    type="text"
                    name="recipient"
                    value={
                      form.recipient
                    }
                    maxLength={30}
                    placeholder="받는 분을 입력해주세요"
                    autoComplete="name"
                    className={
                      fieldErrors.recipient
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


                  {fieldErrors.recipient && (
                    <p
                      className={
                        styles.fieldError
                      }
                      role="alert"
                    >
                      {
                        fieldErrors.recipient
                      }
                    </p>
                  )}
                </div>
              </div>


              {/* =========================
                  ADDRESS
              ========================= */}

              <div
                className={
                  styles.formField
                }
              >
                <label
                  htmlFor="address-address"
                  className={
                    styles.fieldLabel
                  }
                >
                  받으실 곳
                </label>


                <div
                  className={
                    styles.inputArea
                  }
                >
                  <input
                    id="address-address"
                    type="text"
                    name="address"
                    value={
                      form.address
                    }
                    placeholder="주소를 입력해주세요"
                    autoComplete="street-address"
                    className={
                      fieldErrors.address
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


                  {fieldErrors.address && (
                    <p
                      className={
                        styles.fieldError
                      }
                      role="alert"
                    >
                      {
                        fieldErrors.address
                      }
                    </p>
                  )}
                </div>
              </div>


              {/* =========================
                  PHONE
              ========================= */}

              <div
                className={
                  styles.formField
                }
              >
                <label
                  htmlFor="address-phone"
                  className={
                    styles.fieldLabel
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
                    id="address-phone"
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
                      role="alert"
                    >
                      {
                        fieldErrors.phone
                      }
                    </p>
                  )}
                </div>
              </div>


              {/* =========================
                  DEFAULT CHECK
              ========================= */}

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
                  기본 배송지로 설정
                </span>
              </label>


              {/* =========================
                  SERVER ERROR
              ========================= */}

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


              {/* =========================
                  ACTIONS
              ========================= */}

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


        {/* =========================
            NOTICE
        ========================= */}

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
