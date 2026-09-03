/**
 * date.js — jedinstveno formatiranje datuma (bs-BA), par uz lib/price.js.
 *
 * NAMJERNO ne koristi toLocaleDateString / Intl.DateTimeFormat, iz dva
 * nezavisna razloga — oba obaraju hidraciju SSR stabla:
 *
 * 1) PODACI O LOKALU se razlikuju između implementacija, i uz eksplicitan
 *    locale. Izmjereno na ovom projektu:
 *       Node 23 (full-icu):  toLocaleDateString('bs', {…month:'long'})
 *                            ->  "7. mart 2026."
 *       WebKit / Safari:     ->  "2026 M03 7"   (nema 'bs' podatke uopšte)
 *
 * 2) VREMENSKA ZONA je zona runtimea. Produkcijski server obično radi u UTC,
 *    a posjetilac je u Sarajevu (UTC+1 / +2) — pa se za timestamp oko ponoći
 *    server i klijent ne slažu ni oko kalendarskog dana.
 *
 * Zato datum računamo ručno i uvijek u zoni Europe/Sarajevo. Rezultat je
 * bajt-identičan na serveru i klijentu, i identičan onome što je ICU do sada
 * ispisivao na serveru (provjereno kroz sve mjesece i DST granice).
 *
 *   formatDate('2026-03-07T12:00:00Z')                  -> "7. 3. 2026."
 *   formatDate('2026-03-07T12:00:00Z', { style: 'long' }) -> "7. mart 2026."
 */

const MJESECI = [
  'januar', 'februar', 'mart', 'april', 'maj', 'juni',
  'juli', 'august', 'septembar', 'oktobar', 'novembar', 'decembar',
]

const EMPTY = '—'
const SAT = 3600000

/** UTC timestamp posljednje nedjelje u mjesecu, u zadati UTC sat. */
function lastSundayUTC(year, month, hourUTC) {
  const zadnji = new Date(Date.UTC(year, month + 1, 0))
  const dan = zadnji.getUTCDate() - zadnji.getUTCDay()
  return Date.UTC(year, month, dan, hourUTC)
}

/**
 * Pomak zone Europe/Sarajevo: CET (UTC+1), a CEST (UTC+2) od posljednje
 * nedjelje u martu 01:00 UTC do posljednje nedjelje u oktobru 01:00 UTC.
 * To je EU pravilo, na snazi od 1996. i BiH ga prati.
 */
function pomakSarajevo(ts) {
  const godina = new Date(ts).getUTCFullYear()
  const pocetak = lastSundayUTC(godina, 2, 1)
  const kraj = lastSundayUTC(godina, 9, 1)
  return (ts >= pocetak && ts < kraj ? 2 : 1) * SAT
}

/** Dijelovi datuma u sarajevskoj zoni, ili null za nevaljanu vrijednost. */
function dijelovi(value) {
  if (value === null || value === undefined) return null
  if (typeof value === 'string' && value.trim() === '') return null

  const ts = (value instanceof Date ? value : new Date(value)).getTime()
  if (!Number.isFinite(ts)) return null

  const lokalno = new Date(ts + pomakSarajevo(ts))
  return { dan: lokalno.getUTCDate(), mjesec: lokalno.getUTCMonth(), godina: lokalno.getUTCFullYear() }
}

/**
 * @param {string|number|Date|null|undefined} value  ISO string ili Date
 * @param {{ style?: 'short'|'long' }} [options]
 *   short -> "7. 3. 2026."   long -> "7. mart 2026."
 * @returns {string} formatiran datum, ili "—" za prazne/nevaljane vrijednosti
 */
export function formatDate(value, { style = 'short' } = {}) {
  const d = dijelovi(value)
  if (!d) return EMPTY

  return style === 'long'
    ? `${d.dan}. ${MJESECI[d.mjesec]} ${d.godina}.`
    : `${d.dan}. ${d.mjesec + 1}. ${d.godina}.`
}

/** Skraćenice koje se koriste kroz aplikaciju. */
export const fmtDatum = (v) => formatDate(v)
export const fmtDatumDugi = (v) => formatDate(v, { style: 'long' })
