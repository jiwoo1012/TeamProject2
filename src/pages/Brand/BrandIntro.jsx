import { Link } from 'react-router-dom'
import brandStoryCup from '../../assets/images/main/brand-story/brand-story-cup.png'
import brandStoryPour from '../../assets/images/main/brand-story/brand-story-pour-after.png'
import brandStoryScene from '../../assets/images/main/brand-story/brand-story-pouring.webp'
import storyTable from '../../assets/images/main/hero/main-hero-table-sunset.webp'
import senseTaste from '../../assets/images/main/ai-recommendation/happy-day-black-liquor.png'
import sensePairing from '../../assets/images/main/ai-recommendation/happy-day-grilled-pollock.png'
import senseScent from '../../assets/images/main/ai-recommendation/sweet-craving-orange-liquor.png'
import senseWarmth from '../../assets/images/main/hero/main-hero-table.webp'
import makdong from '../../assets/characters/M007_Poses01.png'
import useStickyBrandHeader from './useStickyBrandHeader'
import styles from './BrandIntro.module.scss'

const BrandIntro = () => {
  useStickyBrandHeader()

  return (
    <main className={styles.page}>
      <section className={styles.hero} aria-labelledby="brand-story-title">
        <div className={styles.copy}>
          <h1 id="brand-story-title" className={styles.title}>
            <span>좋은 술 한 잔에는</span>
            <span>다정한 이야기가 있습니다</span>
          </h1>
          <p className={styles.description}>
            자작은 우리 술이 어렵지 않도록,
            <br />
            오늘의 마음과 가장 잘 어울리는 한 잔을 건넵니다.
          </p>
        </div>

        <div className={styles.visual} aria-hidden="true">
          <img className={styles.scene} src={brandStoryScene} alt="" />
          <img className={styles.pour} src={brandStoryPour} alt="" />
          <img className={styles.cup} src={brandStoryCup} alt="" />
          <span className={styles.sun} />
        </div>

      </section>

      <section className={styles.story} aria-labelledby="brand-alone-title">
        <div className={styles.storyInner}>
          <div className={styles.storyCopy}>
            <h2 id="brand-alone-title">
              혼자 보내는 저녁도
              <br />
              누군가 준비해준 한 상처럼
              <br />
              따뜻할 수 없을까?
            </h2>
            <p className={styles.storyDescription}>
              하루를 마치고 돌아온 집에서 무엇을 먹고 마실지 결정하는 일조차
              <br className={styles.desktopBreak} />
              버겁게 느껴지는 날이 있습니다. 자작은 그 순간에서 시작했습니다.
            </p>
          </div>

          <figure className={styles.storyImage}>
            <img src={storyTable} alt="전통주와 안주가 놓인 따뜻한 저녁 주안상" />
          </figure>
        </div>
      </section>

      <section className={styles.reason} aria-labelledby="traditional-liquor-title">
        <div className={styles.reasonHeading}>
          <h2 id="traditional-liquor-title">왜 전통주인가?</h2>
          <p>
            전통주 한 병에는 지역의 자연과 재료, 그리고 빚는 사람의 시간이 담겨 있습니다.
            <br className={styles.desktopBreak} />
            자작은 그 안에 담긴 저마다의 이야기를 오늘의 식탁으로 이어갑니다.
          </p>
        </div>

        <ol className={styles.reasonList}>
          <li>
            <strong>지역의 풍경</strong>
            <p>술이 태어난 고장의 계절과 풍토를 한 잔 안에서 만납니다.</p>
          </li>
          <li>
            <strong>우리의 재료</strong>
            <p>쌀과 과실, 꽃과 약초가 가진 고유한 맛과 향을 발견합니다.</p>
          </li>
          <li>
            <strong>빚는 사람</strong>
            <p>오랜 시간 술을 지켜온 사람들의 손길과 마음을 전합니다.</p>
          </li>
        </ol>
      </section>

      <section className={styles.curation} aria-labelledby="curation-title">
        <div className={styles.curationHeading}>
          <h2 id="curation-title">
            전통주를 고르는 일을 넘어
            <br />
            오늘의 나를 돌보는 한 상을 만듭니다.
          </h2>
          <p>
            술의 종류와 향, 도수만이 아니라 오늘의 기분과 함께 먹을 음식,
            <br className={styles.desktopBreak} />
            어떤 잔에 따라 마실지까지 하나의 경험으로 연결합니다.
          </p>
        </div>

        <ol className={styles.curationSteps}>
          <li>
            <span className={styles.stepIcon} aria-hidden="true">01</span>
            <strong>기분과 상황 이해</strong>
          </li>
          <li>
            <span className={styles.stepIcon} aria-hidden="true">02</span>
            <strong>전통주 추천</strong>
          </li>
          <li>
            <span className={styles.stepIcon} aria-hidden="true">03</span>
            <strong>페어링 안주 제안</strong>
          </li>
          <li>
            <span className={styles.stepIcon} aria-hidden="true">04</span>
            <strong>어울리는 잔 추천</strong>
          </li>
          <li>
            <span className={styles.stepIcon} aria-hidden="true">05</span>
            <strong>오늘의 한 상 완성</strong>
          </li>
        </ol>
      </section>

      <section className={styles.senses} aria-labelledby="senses-title">
        <header className={styles.sensesHeading}>
          <h2 id="senses-title">
            한 상을 이루는
            <br />
            다섯 가지 감각
          </h2>
        </header>

        <div className={styles.senseCards}>
          <article className={styles.senseCard}>
            <img src={storyTable} alt="저녁빛이 비치는 주안상" />
            <div className={styles.senseText}>
              <span>01</span>
              <h3>잔에 담긴 빛</h3>
              <p>맑게 빛나는 약주부터 부드럽게 흐려진 탁주까지, 술이 가진 고유한 색은 오늘의 분위기를 먼저 보여줍니다.</p>
            </div>
          </article>
          <article className={styles.senseCard}>
            <img src={senseScent} alt="은은한 향을 품은 전통주" />
            <div className={styles.senseText}>
              <span>02</span>
              <h3>코끝에 머무는 향</h3>
              <p>쌀의 은은한 단향과 과실의 산뜻함, 누룩의 깊은 향. 자작은 술의 향을 어렵지 않은 말로 풀어드립니다.</p>
            </div>
          </article>
          <article className={styles.senseCard}>
            <img src={senseTaste} alt="검은 병에 담긴 전통주" />
            <div className={styles.senseText}>
              <span>03</span>
              <h3>입안에 남는 맛</h3>
              <p>달콤함과 산뜻함, 담백함과 깊은 여운. 맛의 특징을 알기 쉽게 정리해 편안한 선택을 돕습니다.</p>
            </div>
          </article>
          <article className={styles.senseCard}>
            <img src={sensePairing} alt="전통주와 함께 즐기는 구운 안주" />
            <div className={styles.senseText}>
              <span>04</span>
              <h3>함께할 때 완성되는 한입</h3>
              <p>좋은 술도 무엇과 함께 먹느냐에 따라 달라집니다. 술과 안주가 서로를 돋보이게 하는 작은 한 상을 제안합니다.</p>
            </div>
          </article>
          <article className={styles.senseCard}>
            <img src={senseWarmth} alt="전통주와 안주가 차려진 따뜻한 식탁" />
            <div className={styles.senseText}>
              <span>05</span>
              <h3>손끝에 닿는 잔</h3>
              <p>같은 술도 어떤 잔에 따르느냐에 따라 경험이 달라집니다. 도자기와 유리의 촉감까지 취향에 맞게 연결합니다.</p>
            </div>
          </article>
        </div>
      </section>

      <section className={styles.message} aria-labelledby="brand-message-title">
        <div className={styles.messageInner}>
          <h2 id="brand-message-title">
            자작은 혼자 마시는 시간을
            <br />
            외로운 시간이 아닌 나를 돌보는 시간으로 바꿉니다.
          </h2>
          <p className={styles.messageDescription}>
            술을 많이 마시게 하는 것이 아니라, 나에게 맞는 술을 천천히 이해하고
            <br className={styles.desktopBreak} />
            좋은 안주와 함께 즐길 수 있도록 돕는 것. 그것이 자작의 따뜻한 출발입니다.
          </p>
        </div>
      </section>

      <section className={styles.closing} aria-labelledby="closing-title">
        <div className={styles.closingInner}>
          <div className={styles.closingIntro}>
            <h2 id="closing-title">
              막동이가
              <br />
              도와드립니다.
            </h2>
            <div className={styles.makdongVisual}>
              <img src={makdong} alt="자작의 전통주 큐레이터 막동이" />
            </div>
            <Link className={styles.shopLink} to="/brand/makdong">막동이 이야기 보기</Link>
          </div>

          <ol className={styles.closingValues}>
            <li>
              <h3>이해하기 쉬운 전통주</h3>
              <p>어려운 술의 특징을 누구나 이해하기 쉬운 언어로 소개합니다.</p>
            </li>
            <li>
              <h3>술과 안주, 잔의 연결</h3>
              <p>한 잔의 맛을 온전히 즐길 수 있도록 어울리는 한 상을 제안합니다.</p>
            </li>
            <li>
              <h3>나에게 맞는 선택</h3>
              <p>오늘의 기분과 취향을 살펴 부담 없이 선택할 수 있게 돕습니다.</p>
            </li>
            <li>
              <h3>혼자여도 충분한 한 상</h3>
              <p>나를 위해 차린 한 상이 따뜻한 휴식으로 이어지게 합니다.</p>
            </li>
          </ol>
        </div>
      </section>
    </main>
  )
}

export default BrandIntro
