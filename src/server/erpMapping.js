/**
 * Mapiranje ERP artikla (proteinhouse-api.work) u naš oblik.
 *
 * Izdvojeno iz scripts/import-proteinhouse.mjs da ista pravila vrijede i za
 * jednokratni uvoz i za kontinuiranu sinhronizaciju — inače bi se razišla.
 */

/** ERP grupa → naš category slug. Nepoznate grupe padaju u `null` (nemapirano). */
export const CATEGORY_MAP = {
  'PROTEINI':               'proteini',
  'KREATINI':               'kreatini',
  'GAINERI':                'gaineri',
  'PREWORKOUT':             'pre-workout',
  'AMINOKISELINE':          'aminokiseline',
  'VITAMINI I MINERALI':    'vitamini',
  'SAGORJEVAČI MASTI':      'mrsavljenje',
  'POKRETAČI HORMONA':      'vitamini',
  'PROTEINSKE ČOKOLADICE':  'hrana',
  'ZDRAVA HRANA':           'hrana',
  'DIJETALNE NAMIRNICE':    'hrana',
  'SPORTSKA OPREMA':        'oprema',
  'ODJEĆA':                 'oprema',
  'OBUĆA':                  'oprema',
  'ISY TAJICE':             'oprema',
  'ZGLOBOVI I VEZIVNO TKIVO': 'vitamini',
}

/**
 * Koje polje iz ERP-a je prodajna cijena.
 *
 *   'cijena'   — redovna cijena, bez oznake popusta  (SIGURAN DEFAULT)
 *   'cijenaHH' — niža cijena, redovna ide kao precrtana
 *
 * Zašto default nije cijenaHH: na 1186 od 1344 artikala cijenaHH je niža, ali
 * raspodjela nije nasumična nego dvije fiksne stepenice — tačno 10% niže na
 * 723 suplementa i tačno 60% niže na 354 artikla, a tih 354 su upravo sva
 * ODJEĆA i OBUĆA. Sistematskih 60% preko cijele Gorilla Wear linije ne liči na
 * akciju nego na nabavnu cijenu. Dok se s ERP-om ne potvrdi šta cijenaHH znači,
 * uzimamo redovnu cijenu — greška na toj strani znači propuštenu akciju, a
 * greška na drugoj znači prodaju ispod nabavne.
 */
export const PRICE_SOURCE = 'cijena'

/** Prefiksi brenda u nazivu artikla — skidaju se da se brend ne ponavlja. */
const BRAND_PREFIX = ['ON', 'OST', 'BSN', 'BF', 'SW', 'MUTANT', 'PG', 'AN', 'MT']
const UNIT_RE = /^(g|kg|ml|l|caps|tabs|serv|servings|softgels)$/i
const ACRONYMS = new Set(['BCAA', 'EAA', 'CLA', 'ZMA', 'HMB', 'NO', 'L-CARNITINE'])

export const titleCase = (s) => s.replace(/\S+/g, (w) => {
  if (ACRONYMS.has(w.toUpperCase().replace(/[^A-Z-]/g, ''))) return w.toUpperCase()
  return /^[\d.,]/.test(w) ? w : w[0].toUpperCase() + w.slice(1).toLowerCase()
})

export const slugify = (s) => (s || '').toLowerCase()
  .replace(/[čć]/g, 'c').replace(/š/g, 's').replace(/ž/g, 'z').replace(/đ/g, 'd')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

/** Grupe u kojima zadnja riječ naziva označava veličinu odjeće/obuće. */
const APPAREL_GROUPS = new Set(['ODJEĆA', 'OBUĆA', 'ISY TAJICE'])
// Dio artikala nosi spojenu veličinu ("XS/S", "M/L") — i to je jedna veličina.
const SZ = '(?:XS|S|M|L|XL|XXL|XXXL|[2-5]XL)'
const CLOTHING_SIZE_RE = new RegExp(`^${SZ}(?:/${SZ})?$`, 'i')
const SHOE_SIZE_RE     = /^(3[5-9]|4[0-9]|50)$/

/**
 * "ON GOLD WHEY 30 g double rich chocolate"
 *   → { base: "Gold Whey", size: "30g", flavor: "Double Rich Chocolate" }
 * "GW MAJICA JOHNSON MASLINASTA XXL"
 *   → { base: "Majica Johnson Maslinasta", size: "XXL", flavor: null }
 *
 * Base je bez gramaže i veličine — po njemu se varijante grupišu u jedan
 * proizvod, pa majica ne završi kao pet zasebnih proizvoda po veličini.
 */
export function parseName(naziv, brand = '', groupName = '') {
  let t = String(naziv || '').trim().split(/\s+/)
  const firstBrandWord = String(brand || '').split(' ')[0].toLowerCase()
  if (BRAND_PREFIX.includes(t[0]) || (firstBrandWord && t[0]?.toLowerCase() === firstBrandWord)) t = t.slice(1)

  // Odjeća i obuća: veličina je zadnja riječ, ne "broj + jedinica".
  // Provjerava se samo u tim grupama jer bi inače "L" bilo pobrkano s litrom.
  if (APPAREL_GROUPS.has(groupName) && t.length > 1) {
    const last = t[t.length - 1]
    if (CLOTHING_SIZE_RE.test(last) || SHOE_SIZE_RE.test(last)) {
      return {
        base:   titleCase(t.slice(0, -1).join(' ')),
        size:   last.toUpperCase(),
        flavor: null,
      }
    }
  }

  let si = -1
  for (let i = 0; i < t.length - 1; i++) {
    if (/^[\d.,]+$/.test(t[i]) && UNIT_RE.test(t[i + 1])) { si = i; break }
  }
  if (si < 0) return { base: titleCase(t.join(' ')), size: null, flavor: null }

  const unit = t[si + 1].toLowerCase()
  const size = /^(g|kg|ml|l)$/.test(unit) ? t[si] + unit : `${t[si]} ${unit}`
  return {
    base:   titleCase(t.slice(0, si).join(' ')),
    size,
    flavor: si + 2 < t.length ? titleCase(t.slice(si + 2).join(' ')) : null,
  }
}

export const stripHtml = (html) => (html || '')
  .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
  .replace(/<li[^>]*>/gi, '• ')
  .replace(/<[^>]+>/g, '')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
  .replace(/\n{3,}/g, '\n\n').trim()

/** Izvuci "Upotreba: …" iz opisa u zasebno polje. */
export function splitUsage(text) {
  const m = text.match(/upotreba\s*:?\s*([\s\S]+)$/i)
  if (!m) return { description: text, usage: null }
  return { description: text.slice(0, m.index).trim(), usage: m[1].trim() || null }
}

/** Prodajna cijena artikla — vidi PRICE_SOURCE za obrazloženje. */
export function sellPrice(a) {
  const reg = Number(a.price ?? a.cijena) || 0
  const hh  = Number(a.price_discount ?? a.cijenaHH) || 0
  if (PRICE_SOURCE !== 'cijenaHH') return { price: reg, oldPrice: null }
  return hh > 0 && hh < reg ? { price: hh, oldPrice: reg } : { price: reg, oldPrice: null }
}

/** Red iz API-ja → red za erp_articles. */
export function toErpArticle(a) {
  const brand  = a.nazivProizvodjaca || null
  const parsed = parseName(a.nazivArtikla, brand || '', a.nazivGrupe || '')
  return {
    sku:              String(a.sifraArtikla).trim(),
    erp_id:           a.idArtikla ?? null,
    name:             a.nazivArtikla,
    brand,
    group_name:       a.nazivGrupe || null,
    category_slug:    CATEGORY_MAP[a.nazivGrupe] || null,
    base_name:        parsed.base || null,
    size:             parsed.size,
    flavor:           parsed.flavor,
    price:            Number(a.cijena) || 0,
    price_discount:   a.cijenaHH ? Number(a.cijenaHH) : null,
    // ERP za sada ne šalje stanje ni na jednom artiklu — ostaje null dok ne
    // isporuče endpoint za skladište, da se null ne pomiješa s "nema na stanju".
    qty:              a.kolicina ?? null,
    min_qty:          a.minKolicina ?? null,
    image_path:       a.slikaPath || null,
    description_html: a.opisArtikla || null,
    is_top:           !!a.isTopProizvod,
    is_new:           !!a.isNoviProizvod,
    is_web:           !!a.isWeb,
    raw:              a,
    last_seen_at:     new Date().toISOString(),
    missing_since:    null,
  }
}
