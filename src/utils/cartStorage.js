import {
  deleteDocument,
  getCollection,
  setDocument,
} from '../firebase/firestore'

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

export const getRemoteCart = async (uid) => {
  if (!uid) return []

  return getCollection(`users/${uid}/cart`)
}

export const syncRemoteCart = async (uid, cartItems) => {
  if (!uid) return

  const normalizedItems = cartItems
    .map(({ productId, quantity }) => ({
      productId,
      quantity: Math.floor(Number(quantity)),
    }))
    .filter((item) => item.productId && item.quantity > 0)

  const remoteItems = await getRemoteCart(uid)
  const nextProductIds = new Set(normalizedItems.map((item) => item.productId))

  await Promise.all([
    ...normalizedItems.map((item) => setDocument(`users/${uid}/cart`, item.productId, item)),
    ...remoteItems
      .filter((item) => !nextProductIds.has(item.id))
      .map((item) => deleteDocument(`users/${uid}/cart`, item.id)),
  ])
}

export const clearRemoteCart = async (uid) => {
  if (!uid) return

  const remoteItems = await getRemoteCart(uid)
  await Promise.all(
    remoteItems.map((item) => deleteDocument(`users/${uid}/cart`, item.id)),
  )
}
