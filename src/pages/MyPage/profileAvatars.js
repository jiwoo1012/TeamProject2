import profileAvatarMakdongDefault from '../../assets/images/mypage/profileAvatar-makdong-default.png'
import profileAvatarMakdongCheers from '../../assets/images/mypage/profileAvatar-makdong-cheers.png'
import profileAvatarMakdongJeon from '../../assets/images/mypage/profileAvatar-makdong-jeon.png'
import profileAvatarMakdongPouch from '../../assets/images/mypage/profileAvatar-makdong-pouch.png'
import profileAvatarMakdongTipsy from '../../assets/images/mypage/profileAvatar-makdong-tipsy.png'
import profileAvatarMakdongSleepy from '../../assets/images/mypage/profileAvatar-makdong-sleepy.png'
import profileAvatarMakdongServing from '../../assets/images/mypage/profileAvatar-makdong-serving.png'
import profileAvatarMakdongRainy from '../../assets/images/mypage/profileAvatar-makdong-rainy.png'
import profileAvatarMakdongLetter from '../../assets/images/mypage/profileAvatar-makdong-letter.png'
import profileAvatarMakdongWave from '../../assets/images/mypage/profileAvatar-makdong-wave.png'

export const profileAvatars = [
  { id: 'profile-makdong-default', src: profileAvatarMakdongDefault, label: '기본 막동이' },
  { id: 'profile-makdong-cheers', src: profileAvatarMakdongCheers, label: '건배 막동이' },
  { id: 'profile-makdong-jeon', src: profileAvatarMakdongJeon, label: '전 막동이' },
  { id: 'profile-makdong-pouch', src: profileAvatarMakdongPouch, label: '보자기 막동이' },
  { id: 'profile-makdong-tipsy', src: profileAvatarMakdongTipsy, label: '취한 막동이' },
  { id: 'profile-makdong-sleepy', src: profileAvatarMakdongSleepy, label: '졸린 막동이' },
  { id: 'profile-makdong-serving', src: profileAvatarMakdongServing, label: '서빙 막동이' },
  { id: 'profile-makdong-rainy', src: profileAvatarMakdongRainy, label: '비 오는 날 막동이' },
  { id: 'profile-makdong-letter', src: profileAvatarMakdongLetter, label: '편지 든 막동이' },
  { id: 'profile-makdong-wave', src: profileAvatarMakdongWave, label: '손 흔드는 막동이' },
]

export const getAvatarStorageKey = (uid) => `jajak_profile_avatar_${uid}`

export const getStoredProfileAvatar = (uid) => {
  if (!uid) return profileAvatars[0]

  const savedAvatarId = localStorage.getItem(getAvatarStorageKey(uid))
  return profileAvatars.find((avatar) => avatar.id === savedAvatarId) || profileAvatars[0]
}
