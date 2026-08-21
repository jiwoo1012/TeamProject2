import liquors from './liquors.json'
import foods from './foods.json'
import glasses from './glasses.json'
import gifts from './gifts.json'

const products = [
  ...liquors,
  ...foods,
  ...glasses,
  ...gifts,
]

export {
  liquors,
  foods,
  glasses,
  gifts,
  products,
}