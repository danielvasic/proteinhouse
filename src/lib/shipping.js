/**
 * Uslovi dostave — jedno mjesto za korpu i checkout.
 *
 * Pravila od Vice (18.08.2026):
 *   do 100 KM        →  9 KM
 *   100 – 149 KM     →  7 KM
 *   preko 149 KM     →  besplatna
 *
 * Ranije je bilo "besplatno preko 100, inače 7" — i poruke na sajtu i obračun
 * su bili netačni. Ako se pragovi opet promijene, mijenja se SAMO ovaj fajl;
 * tekstove u bazi (news bar, footer) treba uskladiti ručno u adminu.
 */
export const FREE_SHIPPING_THRESHOLD = 149
export const MID_BAND_MIN   = 100
export const SHIPPING_MID   = 7
export const SHIPPING_BASE  = 9

/** @param {number} subtotal — međuzbir NAKON popusta @param {boolean} couponFreeShipping */
export function calcShipping(subtotal, couponFreeShipping = false) {
  if (couponFreeShipping) return 0
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0
  if (subtotal >= MID_BAND_MIN) return SHIPPING_MID
  return SHIPPING_BASE
}
