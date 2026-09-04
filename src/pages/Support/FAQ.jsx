import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PATHS } from '../../routes/paths'
import styles from './FAQ.module.scss'
import searchIconImage from '../../assets/icons/searchIcon.png'
import inquiryIconImage from '../../assets/icons/inquiryIcon.png'

const FAQ_ITEMS = [
    {
    category: '주문/결제',
    isTop: true,
    question: '주문 후 결제 수단을 변경할 수 있나요?',
    answer: '결제가 완료된 이후에는 결제 수단을 변경하실 수 없습니다. 결제 수단을 변경하고 싶으신 경우, 기존 주문을 취소하신 뒤 원하시는 결제 수단으로 다시 주문해주시기 바랍니다.',
  },
  {
    category: '주문/결제',
    isTop: false,
    question: '주문은 어떻게 취소하나요?',
    answer: '마이페이지 > 주문 내역에서 취소하실 주문을 선택해주세요. 결제 완료 또는 상품 준비 중 상태에서는 직접 취소가 가능하며, 배송이 시작된 이후에는 취소가 어려우니 1:1 문의하기를 통해 문의해주시기 바랍니다.',
  },
    {
    category: '배송',
    isTop: true,
    question: '배송은 얼마나 걸리나요?',
    answer: '결제 완료 후 상품 준비까지 통상 1~2일이 소요되며, 이후 배송이 시작됩니다. 정확한 배송 현황은 마이페이지 > 주문 내역에서 실시간으로 확인하실 수 있습니다.',
  },
  {
    category: '배송',
    isTop: false,
    question: '배송지를 변경하고 싶어요.',
    answer: '배송지는 주문 시 입력하신 정보로 발송되며, 결제 완료 후에는 변경이 어렵습니다. 배송지 변경이 꼭 필요하신 경우 1:1 문의하기를 통해 빠르게 안내해드리겠습니다.',
  },
  {
    category: '교환/환불',
    isTop: true,
    question: '교환이나 환불은 어떻게 신청하나요?',
    answer: '1:1 문의하기에서 "교환/환불" 유형을 선택해 상품 정보와 사유를 남겨주시면, 확인 후 순차적으로 답변드립니다. 문의 내역과 답변은 로그인 후 문의하기 페이지에서 확인하실 수 있습니다.',
  },
  {
    category: '회원/기타',
    isTop: true,
    question: '비밀번호를 변경하고 싶어요.',
    answer: '현재 비밀번호 변경 기능은 준비 중입니다. 다른 계정 관련 문의는 1:1 문의하기를 이용해주세요.',
  },
  {
    category: '회원/기타',
    isTop: false,
    question: '찜한 상품은 어디서 확인하나요?',
    answer: '로그인 후 마이페이지 > 찜 목록에서 확인하실 수 있습니다. 찜한 상품은 최대 100개까지 저장 가능합니다.',
  },
]

const TOP_CATEGORY = '질문 TOP'
const CATEGORY_FILTERS = [TOP_CATEGORY, ...Array.from(new Set(FAQ_ITEMS.map((item) => item.category)))]

const FAQ = () => {
  const [activeCategory, setActiveCategory] = useState(TOP_CATEGORY)
  const [openIndex, setOpenIndex] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  const normalizedQuery = searchQuery.trim().toLowerCase()

  const visibleItems = FAQ_ITEMS
    .filter((item) => activeCategory === TOP_CATEGORY ? item.isTop : item.category === activeCategory)
    .filter((item) => !normalizedQuery || [item.question, item.answer]
      .some((value) => value.toLowerCase().includes(normalizedQuery)))

  return (
    <section className={styles.page}>
      <div className={styles.content}>
        <h1>자주 묻는 질문</h1>

        <label className={styles.searchBox}>
          <img src={searchIconImage} alt="" className={styles.searchIcon} />
          <span className={styles.srOnly}>FAQ 검색</span>
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => { setSearchQuery(event.target.value); setOpenIndex(null) }}
            placeholder="무엇이든 찾아보세요"
          />
        </label>

        <div className={styles.categoryTabs} role="tablist">
          {CATEGORY_FILTERS.map((category) => (
            <button
              type="button"
              role="tab"
              aria-selected={activeCategory === category}
              className={activeCategory === category ? styles.activeTab : ''}
              onClick={() => { setActiveCategory(category); setOpenIndex(null) }}
              key={category}
            >
              {category}
            </button>
          ))}
        </div>

        <ul className={styles.faqList}>
          {visibleItems.length === 0 ? (
            <li className={styles.emptyState}>검색 결과가 없습니다.</li>
          ) : visibleItems.map((item, index) => {
            const isOpen = openIndex === index
            return (
              <li className={styles.faqItem} key={`${item.category}-${index}`}>
                <button
                  type="button"
                  className={styles.faqQuestion}
                  onClick={() => setOpenIndex((current) => (current === index ? null : index))}
                  aria-expanded={isOpen}
                >
                  <span className={styles.faqQMark} aria-hidden="true">Q</span>
                  <span className={styles.faqQuestionText}>{item.question}</span>
                  <span className={styles.faqToggleIcon}>{isOpen ? '−' : '+'}</span>
                </button>

                {isOpen && (
                  <div className={styles.faqAnswer}>
                    <p>{item.answer}</p>
                  </div>
                )}
              </li>
            )
          })}
        </ul>

        <Link to={PATHS.inquiry} className={styles.floatingButton} aria-label="1:1 문의하기">
          <img src={inquiryIconImage} alt="" className={styles.inquiryIcon} />
          <em>1:1 문의하기</em>
        </Link>
      </div>
    </section>
  )
}

export default FAQ
