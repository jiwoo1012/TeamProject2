import { Link } from 'react-router-dom'
import pour from '../../assets/characters/M007_Poses01.png'
import choose from '../../assets/characters/M007_Poses02.png'
import hello from '../../assets/characters/M007_Poses03.png'
import sitting from '../../assets/characters/M007_Poses04.png'
import front from '../../assets/characters/M007_Poses05.png'
import survey from '../../assets/characters/M007_Poses06.png'
import listen from '../../assets/characters/M007_Poses07.png'
import useStickyBrandHeader from './useStickyBrandHeader'
import styles from './MakdongIntro.module.scss'

const jobs = [
  { number: '01', title: '오늘은 어떤 하루였나요?', text: '먼저 오늘의 기분과 함께하고 싶은 순간을 가만히 들어요.', image: listen, alt: '이야기를 듣는 막동이' },
  { number: '02', title: '취향을 살펴보고', text: '좋아하는 맛과 향, 원하는 분위기를 하나씩 함께 찾아봐요.', image: survey, alt: '취향 설문지를 든 막동이' },
  { number: '03', title: '술과 안주를 골라', text: '당신의 하루와 취향에 잘 어울리는 조합을 정성껏 골라요.', image: choose, alt: '술병을 들고 추천하는 막동이' },
  { number: '04', title: '오늘의 한 상을 준비해요.', text: '술과 안주, 잔이 조화로운 오늘만의 한 상을 완성해요.', image: pour, alt: '술을 따르는 막동이' },
]

const MakdongIntro = () => {
  useStickyBrandHeader()

  return (
    <main className={styles.page}>
      <section className={styles.intro} aria-labelledby="makdong-title">
        <div className={styles.introCopy}>
          <h1 id="makdong-title">MAKDONG</h1>
          <p>오늘 당신의 한 잔을 함께 골라줄<br />자작의 작은 큐레이터, 막동이를 소개합니다.</p>
        </div>
        <div className={styles.introVisual}>
          <span>안녕, 나는 막동이야!</span>
          <img src={hello} alt="손을 흔들며 인사하는 막동이" />
        </div>
      </section>

      <section className={styles.profile} aria-labelledby="profile-title">
        <div className={styles.profileVisual}>
          <img src={front} alt="정면으로 서 있는 막동이" />
        </div>
        <div className={styles.profileCopy}>
          <h2 id="profile-title">자작에 사는 작은 너구리, 막동이</h2>
          <p className={styles.description}>좋은 술과 맛있는 안주를 찾아다니는 걸 좋아해요.<br />오늘 하루가 어땠는지 가만히 듣고,<br />당신에게 어울리는 한 상을 준비해주는 다정한 친구예요.</p>
          <dl className={styles.facts}>
            <div><dt>NAME</dt><dd>막동이</dd></div>
            <div><dt>SPECIES</dt><dd>너구리</dd></div>
            <div><dt>ROLE</dt><dd>AI 큐레이터</dd></div>
            <div><dt>LIKES</dt><dd>맛있는 한 상</dd></div>
          </dl>
        </div>
      </section>

      <section className={styles.raccoon} aria-labelledby="raccoon-title">
        <div className={styles.raccoonCopy}>
          <h2 id="raccoon-title">정겹고, 호기심 많고,<br />먹는 것을 좋아하는 친구.</h2>
          <p>막동이는 자작이 전하고 싶은 친근하고 다정한 분위기를 담아 탄생했습니다.</p>
        </div>
        <div className={styles.raccoonVisual}>
          <img src={hello} alt="막동이의 밝고 호기심 많은 표정" />
        </div>
      </section>

      <section className={styles.jobs} aria-labelledby="jobs-title">
        <header>
          <h2 id="jobs-title">막동이는 이렇게 한 상을 준비해요.</h2>
        </header>
        <ol>
          {jobs.map(({ number, title, text, image, alt }) => (
            <li key={number}>
              <div className={styles.jobVisual}><img src={image} alt={alt} /></div>
              <div className={styles.jobCopy}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.outro} aria-labelledby="outro-title">
        <div className={styles.outroVisual}>
          <i aria-hidden="true" />
          <img src={sitting} alt="술병을 안고 앉은 막동이" />
        </div>
        <div className={styles.outroCopy}>
          <h2 id="outro-title">오늘은 어떤 한 잔이 필요하세요?</h2>
          <p>막동이가 당신의 취향과 오늘의 기분을 살펴<br />어울리는 한 상을 준비해드릴게요.</p>
          <Link to="/ai">막동이에게 추천받기 <span aria-hidden="true">→</span></Link>
        </div>
      </section>
    </main>
  )
}

export default MakdongIntro
