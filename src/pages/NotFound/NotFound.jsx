import { Link, useNavigate } from 'react-router-dom'
import makdong from '../../assets/images/brand/makdong-look-up-hands-behind.png'
import liquor from '../../assets/images/brand/guide-liquor.png'
import pairing from '../../assets/images/brand/guide-pairing.png'
import choice from '../../assets/images/brand/guide-choice.png'
import giftSet from '../../assets/images/products/productDetail/product23/celadon_1_gift_box_open.png'
import styles from './NotFound.module.scss'

const menus = [
  { label: '전통주', to: '/shop?category=liquor', image: liquor },
  { label: '페어링', to: '/shop?category=food', image: pairing },
  { label: '잔 · 선물세트', to: '/shop?category=gift', image: giftSet },
  { label: 'AI 추천', to: '/ai', image: makdong },
  { label: '이벤트', to: '/events', image: choice },
]

const NotFound = () => {
  const navigate = useNavigate()
  const handleBack = () => window.history.state?.idx > 0 ? navigate(-1) : navigate('/', { replace: true })
  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-labelledby="not-found-title">
        <div className={styles.visual}><img src={makdong} alt="길을 살펴보는 막동이" /></div>
        <div className={styles.message}>
          <span className={styles.code} aria-hidden="true">404</span>
          <h1 id="not-found-title">이런, 길을 잘못 드셨나 봅니다</h1>
          <p>나으리께서 찾으시는 곳이 사라졌거나,<br />다른 길로 접어드신 듯합니다.</p>
          <div className={styles.actions}>
            <Link to="/">주막으로 돌아가기</Link>
            <button type="button" onClick={handleBack}>왔던 길로 되돌아가기</button>
          </div>
        </div>
      </section>
      <section className={styles.shortcuts} aria-labelledby="shortcut-title">
        <h2 id="shortcut-title">나으리, 어디로 가시렵니까?</h2>
        <p>아래에서 가실 곳을 골라주시지요.</p>
        <nav aria-label="주요 메뉴 바로가기"><ul>
          {menus.map(({ label, to, image }) => <li key={label}><Link to={to}>
            <span className={styles.icon}><img src={image} alt="" /></span>
            <strong>{label}</strong><span className={styles.caption}>바로가기 <span aria-hidden="true">›</span></span>
          </Link></li>)}
        </ul></nav>
      </section>
    </main>
  )
}
export default NotFound
