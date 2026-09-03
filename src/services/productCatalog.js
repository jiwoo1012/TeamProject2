import { products as productData } from '../data/products'
import { getCollection } from '../firebase/firestore'

const PRODUCT_OVERRIDES_KEY = 'jajak_admin_product_overrides'
const DELETED_PRODUCTS_KEY = 'jajak_admin_deleted_products'

const readStoredJson = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}

const applyOverride = (product, override = {}) => {
  const category = override.category
  const isLiquorCategory = ['탁주', '약주', '청주', '증류주', '과실주', '리큐르'].includes(category)
  const isAccessoryCategory = ['잔', '선물 세트'].includes(category)

  return {
    ...product,
    productName: override.name ?? product.productName,
    productType: category
      ? (isLiquorCategory ? '전통주' : (isAccessoryCategory ? '주류용품' : category))
      : product.productType,
    liquorType: category && isLiquorCategory ? category : product.liquorType,
    glassType: category === '선물 세트'
      ? '선물세트'
      : (category === '잔' && product.glassType === '선물세트' ? '술잔' : product.glassType),
    price: override.price ?? product.price,
    stock: override.stock ?? product.stock,
    status: override.displayStatus === 'hidden' ? 'hidden' : (override.status ?? product.status),
    productDescription: override.description ?? product.productDescription,
  }
}

export const getManagedProducts = ({ includeHidden = false } = {}) => {
  const overrides = readStoredJson(PRODUCT_OVERRIDES_KEY, {})
  const deletedIds = new Set(readStoredJson(DELETED_PRODUCTS_KEY, []))

  return productData
    .filter((product) => !deletedIds.has(product.productId))
    .map((product) => applyOverride(product, overrides[product.productId]))
    .filter((product) => includeHidden || product.status !== 'hidden')
}

export const fetchProducts = async ({ includeHidden = false } = {}) => {
  try {
    const products = await getCollection('products')
    return products.filter((product) => includeHidden || product.status !== 'hidden')
  } catch (error) {
    console.error('Firestore 상품 조회 실패:', error)
    return getManagedProducts({ includeHidden })
  }
}
