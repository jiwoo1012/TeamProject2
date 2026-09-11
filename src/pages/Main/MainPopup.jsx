import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'

import popupImage from '../../assets/images/main/popup/main-event-popup.webp'
import popupImage2 from '../../assets/images/main/popup/main-event-popup2.webp'

import styles from './MainPopup.module.scss'


const POPUPS = [
  {
    id: 'event1',
    image: popupImage,
    key: 'jajak_main_popup_hidden_until',
    alt: '자작 회원가입 이벤트 안내',
    to: '/login',
  },
  {
    id: 'event2',
    image: popupImage2,
    key: 'jajak_main_popup2_hidden_until',
    alt: '막동이 주막 게임 이벤트 안내',
    to: '/ai/tavern',
  },
]


const POPUP_APPEAR_DELAY = 1500


const MainPopup = ({ enabled = true }) => {
  const [closedIds, setClosedIds] = useState(() =>
    POPUPS
      .filter((popup) => {
        try {
          return Number(localStorage.getItem(popup.key)) > Date.now()
        } catch {
          return false
        }
      })
      .map((popup) => popup.id)
  )

  const [isVisible, setIsVisible] = useState(false)

  const groupRef = useRef(null)

  const remaining = POPUPS.filter(
    (popup) => !closedIds.includes(popup.id)
  )

  const isOpen = enabled && remaining.length > 0


  const closePopup = (id) => {
    setClosedIds((ids) => [...ids, id])

    requestAnimationFrame(() =>
      groupRef.current
        ?.querySelector('[data-close]')
        ?.focus({ preventScroll: true })
    )
  }


  useEffect(() => {
    if (!isOpen) {
      setIsVisible(false)
      return undefined
    }

    const timer = setTimeout(
      () => setIsVisible(true),
      POPUP_APPEAR_DELAY
    )

    return () => clearTimeout(timer)
  }, [isOpen])


  useEffect(() => {
    if (!isVisible || !isOpen) {
      return undefined
    }

    const previousFocus = document.activeElement

    const root = document.documentElement
    const body = document.body

    const previousRootOverflow = root.style.overflow
    const previousBodyOverflow = body.style.overflow

    root.style.overflow = 'hidden'
    body.style.overflow = 'hidden'

    groupRef.current
      ?.querySelector('[data-close]')
      ?.focus({ preventScroll: true })


    const handleKeyDown = (event) => {
      const buttons = [
        ...groupRef.current.querySelectorAll('button')
      ]

      if (event.key === 'Escape') {
        event.preventDefault()

        const id =
          document.activeElement
            ?.closest('[data-popup-id]')
            ?.dataset.popupId ||
          groupRef.current
            .querySelector('[data-popup-id]')
            ?.dataset.popupId

        setClosedIds((ids) => [...ids, id])

        requestAnimationFrame(() =>
          groupRef.current
            ?.querySelector('[data-close]')
            ?.focus({ preventScroll: true })
        )
      }


      if (event.key === 'Tab') {
        event.preventDefault()

        const index = buttons.indexOf(
          document.activeElement
        )

        buttons[
          (
            index +
            (event.shiftKey ? -1 : 1) +
            buttons.length
          ) % buttons.length
        ]?.focus()
      }
    }


    const blockWheel = (event) => {
      event.stopImmediatePropagation()
    }


    window.addEventListener(
      'wheel',
      blockWheel,
      {
        capture: true,
        passive: true,
      }
    )

    document.addEventListener(
      'keydown',
      handleKeyDown
    )


    return () => {
      root.style.overflow = previousRootOverflow
      body.style.overflow = previousBodyOverflow

      window.removeEventListener(
        'wheel',
        blockWheel,
        true
      )

      document.removeEventListener(
        'keydown',
        handleKeyDown
      )

      if (previousFocus?.isConnected) {
        previousFocus.focus?.({
          preventScroll: true,
        })
      }
    }
  }, [isVisible, isOpen])


  const handleHideToday = (popup) => {
    const midnight = new Date()

    midnight.setHours(24, 0, 0, 0)

    try {
      localStorage.setItem(
        popup.key,
        String(midnight.getTime())
      )
    } catch {
      // storage 사용 불가 시에도 닫기는 가능
    }

    closePopup(popup.id)
  }


  if (!isVisible || !isOpen) {
    return null
  }


  return createPortal(
    <div
      className={styles.backdrop}
      role="dialog"
      aria-modal="true"
      aria-label="자작 이벤트 안내"
    >
      <div
        ref={groupRef}
        className={styles.popupGroup}
      >
        {remaining.map((popup) => (
          <section
            className={styles.popup}
            key={popup.id}
            data-popup-id={popup.id}
            aria-label={popup.alt}
          >

            {/* 이벤트 페이지 이동 */}
            <Link
              to={popup.to}
              className={styles.imageLink}
              aria-label={`${popup.alt} 자세히 보기`}
            >
              <div className={styles.imageArea}>
                <img
                  src={popup.image}
                  alt={popup.alt}
                />
              </div>
            </Link>


            <div className={styles.actions}>
              <button
                type="button"
                onClick={() =>
                  handleHideToday(popup)
                }
              >
                오늘 하루동안 보지 않기
              </button>

              <button
                data-close
                type="button"
                onClick={() =>
                  closePopup(popup.id)
                }
              >
                닫기
              </button>
            </div>

          </section>
        ))}
      </div>
    </div>,
    document.body,
  )
}


export default MainPopup
