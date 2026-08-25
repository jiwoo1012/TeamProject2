export const ORDER_STATUS = Object.freeze({
  PAID: 'paid',
  PREPARING: 'preparing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
})

export const ORDER_STATUS_LABEL = Object.freeze({
  [ORDER_STATUS.PAID]: '결제 완료',
  [ORDER_STATUS.PREPARING]: '상품 준비 중',
  [ORDER_STATUS.SHIPPED]: '배송 중',
  [ORDER_STATUS.DELIVERED]: '배송 완료',
  [ORDER_STATUS.CANCELLED]: '주문 취소',
})

export const getOrderStatusLabel = (status) =>
  ORDER_STATUS_LABEL[status] || '상태 확인 중'
