import styles from './Dashboard.module.scss'

const summaryCards = [
  { label: '오늘 매출', value: '—', unit: '원', caption: '전일 대비 집계 전', tone: 'primary' },
  { label: '신규 주문', value: '—', unit: '건', caption: '오늘 접수된 주문', tone: 'light' },
  { label: '신규 회원', value: '—', unit: '명', caption: '오늘 가입한 회원', tone: 'neutral' },
  { label: '처리 대기 주문', value: '—', unit: '건', caption: '발송 처리가 필요해요', tone: 'warning' },
]

const orderStatuses = ['결제 완료', '배송 준비', '배송 중', '배송 완료', '취소·환불']

const Dashboard = () => (
  <main className={styles.page}>
    <header className={styles.pageHeader}>
      <div>
        <h1>대시보드</h1>
        <p className={styles.description}>자작의 주문과 고객 흐름을 한눈에 확인하세요.</p>
      </div>
      <p className={styles.dataNotice}><span aria-hidden="true" />데이터 연결 전</p>
    </header>

    <section className={styles.summarySection} aria-labelledby="summary-title">
      <div className={styles.sectionHeading}>
        <div><p>오늘의 운영 요약</p><h2 id="summary-title">핵심 지표</h2></div>
        <span>오늘 00:00 기준</span>
      </div>
      <div className={styles.summaryGrid}>
        {summaryCards.map((card) => (
          <article className={`${styles.summaryCard} ${styles[card.tone]}`} key={card.label}>
            <div className={styles.cardTopline}><h3>{card.label}</h3><i aria-hidden="true" /></div>
            <p className={styles.metricValue}><strong>{card.value}</strong><span>{card.unit}</span></p>
            <p className={styles.metricCaption}>{card.caption}</p>
          </article>
        ))}
      </div>
    </section>

    <section className={styles.analyticsGrid} aria-label="매출 및 주문 현황">
      <article className={`${styles.panel} ${styles.salesPanel}`}>
        <div className={styles.panelHeader}>
          <div><p>SALES TREND</p><h2>최근 7일 매출</h2></div>
          <span className={styles.periodLabel}>7일</span>
        </div>
        <div className={styles.chartSummary}><span>누적 매출</span><strong>— <small>원</small></strong></div>
        <div className={styles.chartFrame} role="img" aria-label="최근 7일 매출 데이터 연결 전">
          <div className={styles.chartGrid} aria-hidden="true"><i /><i /><i /><i /></div>
          <p>매출 데이터가 연결되면 추이가 표시됩니다.</p>
        </div>
        <div className={styles.chartLabels} aria-hidden="true">
          <span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span><span>일</span>
        </div>
      </article>

      <article className={`${styles.panel} ${styles.orderPanel}`}>
        <div className={styles.panelHeader}>
          <div><p>ORDER STATUS</p><h2>주문 처리 현황</h2></div>
          <span className={styles.statusMarker}>확인 필요</span>
        </div>
        <div className={styles.orderOverview}>
          <div className={styles.donutChart} role="img" aria-label="주문 상태 데이터 연결 전">
            <div><strong>—</strong><span>전체 주문</span></div>
          </div>
          <ul className={styles.statusList}>
            {orderStatuses.map((status, index) => (
              <li className={index === 1 ? styles.pendingStatus : undefined} key={status}>
                <div><span><i aria-hidden="true" />{status}</span><strong>— <small>건</small></strong></div>
              </li>
            ))}
          </ul>
        </div>
      </article>
    </section>

    <section className={styles.bottomGrid} aria-label="최근 운영 정보">
      <article className={`${styles.panel} ${styles.ordersPanel}`}>
        <div className={styles.panelHeader}>
          <div><p>RECENT ORDERS</p><h2>최근 주문</h2></div>
          <span className={styles.textAction}>최신 10건</span>
        </div>
        <div className={styles.tableWrap}>
          <table>
            <thead><tr><th>주문번호</th><th>주문자</th><th>상품</th><th>결제금액</th><th>상태</th><th>주문일시</th></tr></thead>
            <tbody><tr><td className={styles.emptyTable} colSpan="6">
              <strong>표시할 주문 데이터가 없습니다.</strong>
              <span>Firestore 연결 후 최근 주문이 여기에 표시됩니다.</span>
            </td></tr></tbody>
          </table>
        </div>
      </article>

      <article className={`${styles.panel} ${styles.aiPanel}`}>
        <div className={styles.panelHeader}>
          <div><p>AI CURATION</p><h2>막동이 추천 이용 현황</h2></div>
          <span className={styles.aiBadge}>JAJAK AI</span>
        </div>
        <div className={styles.aiMetrics}>
          <div><span>오늘 추천 요청</span><strong>— <small>회</small></strong></div>
          <div><span>추천 후 구매 전환율</span><strong>— <small>%</small></strong></div>
        </div>
        <div className={styles.aiEmpty}><i aria-hidden="true" /><p>AI 추천 로그가 연결되면<br />이용 흐름을 분석할 수 있어요.</p></div>
      </article>
    </section>
  </main>
)

export default Dashboard
