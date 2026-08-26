const CART_KEY = 'jajak_cart'

export const getCart = () => {
  try {
    const savedCart = localStorage.getItem(CART_KEY)

    if (!savedCart) {
      return []
    }

    const parsedCart = JSON.parse(savedCart)

    return Array.isArray(parsedCart) ? parsedCart : []
  } catch (error) {
    console.error('장바구니 불러오기 실패:', error)
    return []
  }
}

export const saveCart = (cartItems) => {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cartItems))
  } catch (error) {
    console.error('장바구니 저장 실패:', error)
  }
}

export const clearCart = () => {
  try {
    localStorage.removeItem(CART_KEY)
  } catch (error) {
    console.error('장바구니 초기화 실패:', error)
  }
}