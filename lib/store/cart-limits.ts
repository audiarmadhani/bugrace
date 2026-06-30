import { getProductById } from '@/data/products';

export const MAX_CART_LINE_QUANTITY = 99;
export const MAX_DISTINCT_CART_ITEMS = 10;

export type CartLineRef = { productId: string; quantity: number };

export function validateAddToCartQuantity(
  productId: string,
  quantity: number,
  stock: number,
  existingCart: CartLineRef[] = []
): number | null {
  if (quantity < 1) return null;

  const existingQty =
    existingCart.find((line) => line.productId === productId)?.quantity ?? 0;
  const isNewLine = existingQty === 0;

  if (isNewLine && existingCart.length >= MAX_DISTINCT_CART_ITEMS) {
    return null;
  }

  const nextQty = existingQty + quantity;
  if (nextQty > stock || nextQty > MAX_CART_LINE_QUANTITY) {
    return null;
  }

  return quantity;
}

export function validateCartLineQuantity(
  productId: string,
  quantity: number
): number | null {
  if (quantity < 1 || quantity > MAX_CART_LINE_QUANTITY) {
    return null;
  }

  const product = getProductById(productId);
  const stock = product?.stock ?? 0;
  if (quantity > stock) {
    return null;
  }

  return quantity;
}
