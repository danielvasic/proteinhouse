/**
 * Uslovi dostave — jedno mjesto za korpu i checkout.
 * Ranije su prag i cijena bili hardkodirani na tri mjesta pa su lako
 * razilazili kad se jedan izmijeni.
 */
export const FREE_SHIPPING_THRESHOLD = 100
export const SHIPPING_COST = 7

/** @param {number} subtotal — međuzbir NAKON popusta @param {boolean} couponFreeShipping */
export function calcShipping(subtotal, couponFreeShipping = false) {
  if (couponFreeShipping) return 0
  return subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST
}
