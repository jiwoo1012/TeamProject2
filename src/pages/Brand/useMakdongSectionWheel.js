import useSectionWheelSnap from './useSectionWheelSnap'

const DESKTOP_HEADER_HEIGHT = 80

const useMakdongSectionWheel = ({ guideRef, blankSectionRef, storyRef, outroRef }) => {
  useSectionWheelSnap(
    [
      { ref: blankSectionRef },
      { ref: guideRef },
      { ref: storyRef, endRef: storyRef },
      { ref: outroRef },
    ],
    { fallbackHeaderHeight: DESKTOP_HEADER_HEIGHT },
  )
}

export default useMakdongSectionWheel
