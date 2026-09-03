/**
 * price.js — jedinstveno formatiranje cijena (BAM / konvertibilna marka).
 *
 * NAMJERNO ne koristi Intl.NumberFormat. ECMA-402 dopušta da se podaci o
 * lokalu razlikuju između implementacija, pa i uz EKSPLICITAN locale
 * ('bs-BA') Node i preglednik daju različit niz — izmjereno na ovom projektu:
 *
 *   Node 23 (full-icu):  Intl…('bs-BA').format(0)  ->  "0,00 KM"
 *   WebKit / Safari:     Intl…('bs-BA').format(0)  ->  "BAM 0.00"
 *
 * Obje implementacije pritom tvrde da im je resolvedOptions().locale 'bs-BA',
 * pa se na to ne može osloniti. Ta je razlika obarala hidraciju cijelog SSR
 * stabla (CartDrawer je prvi čvor s cijenom, pa je React odbacivao stranicu).
 *
 * Zato format računamo ručno: Number.prototype.toFixed je precizno definiran
 * u ECMA-262 (§21.1.3.3) i daje identičan rezultat u svakom JS engineu, pa su
 * server i klijent uvijek bajt-identični.
 *
 * BiH konvencija: decimalni zarez, tačka za hiljade, simbol iza broja.
 *   7.5     -> "7,50 KM"
 *   1234.5  -> "1.234,50 KM"
 *   0       -> "0,00 KM"
 */

const DECIMAL_SEPARATOR = ','
const GROUP_SEPARATOR = '.'
const CURRENCY_SUFFIX = 'KM'
const EMPTY = '—'

/** "1234567" -> "1.234.567" */
function groupThousands(digits) {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, GROUP_SEPARATOR)
}

/**
 * @param {number|string|null|undefined} value
 * @param {{ decimals?: number, suffix?: boolean }} [options]
 *   decimals — broj decimala (0 za cjelobrojne prikaze poput filtera cijene)
 *   suffix   — dodaj " KM" na kraj
 * @returns {string} npr. "1.234,50 KM", ili "—" za prazne/nevaljane vrijednosti
 */
export function formatPrice(value, { decimals = 2, suffix = true } = {}) {
  if (value === null || value === undefined) return EMPTY
  if (typeof value === 'string' && value.trim() === '') return EMPTY

  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return EMPTY

  const fixed = Math.abs(n).toFixed(decimals)
  const [int, frac] = fixed.split('.')
  const sign = n < 0 && Number(fixed) > 0 ? '-' : ''
  const number = groupThousands(int) + (frac ? DECIMAL_SEPARATOR + frac : '')

  return sign + number + (suffix ? ' ' + CURRENCY_SUFFIX : '')
}

/** Skraćenica koja se koristi kroz cijeli storefront. */
export const fmtKM = (n) => formatPrice(n)
