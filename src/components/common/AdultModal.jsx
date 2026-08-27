import React from 'react'
import styles from './AdultModal.module.scss'

import makdongImg from '../../assets/characters/M007_Poses05.png'


const AdultModal = ({
  isOpen = true,
  onVerify,
  onExit,
}) => {
  if (!isOpen) return null

  const handleVerify = () => {
    if (onVerify) {
      onVerify()
    }
  }

  const handleExit = () => {
    if (onExit) {
      onExit()
      return
    }

    window.history.back()
  }


  return (
    <div className={styles.overlay}>

      <section
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="adult-modal-title"
      >

        {/* 성인 인증 이미지 */}
        <div className={styles.visualArea}>
          <div className={styles.prohibition}>
            <img
              src={makdongImg}
              alt="성인 인증 안내 막둥이"
              className={styles.makdong}
            />

            <span className={styles.slash} />
          </div>
        </div>


        {/* 안내 */}
        <div className={styles.content}>
          <h2
            id="adult-modal-title"
            className={styles.title}
          >
            성인 인증이 필요합니다
          </h2>

          <p className={styles.description}>
            <strong>JAJAK(자작)</strong>은 만 19세 이상만 이용할 수 있습니다.
            <br />
            본인인증 후 서비스를 이용해주세요.
          </p>
        </div>


        {/* 버튼 */}
        <div className={styles.buttonArea}>
          <button
            type="button"
            className={styles.verifyButton}
            onClick={handleVerify}
          >
            만 19세 이상입니다
          </button>

          <button
            type="button"
            className={styles.exitButton}
            onClick={handleExit}
          >
            나가기
          </button>
        </div>


        <p className={styles.notice}>
          만 19세 미만 고객은 서비스 이용이 제한됩니다.
        </p>

      </section>

    </div>
  )
}


export default AdultModal