import useSectionWheelSnap from './useSectionWheelSnap'

const useMakdongSectionWheel = ({ guideRef, blankSectionRef, storyRef, outroRef }) => {
  useSectionWheelSnap([
    { ref: blankSectionRef },
    { ref: guideRef },
    { ref: storyRef, endRef: storyRef },
    { ref: outroRef },
  ])
}

export default useMakdongSectionWheel
