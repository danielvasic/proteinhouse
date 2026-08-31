/**
 * Sluzbene fotografije proizvoda s ostrovit.com.
 *
 * OstroVit je 189 proizvoda u nasem katalogu, drugi po velicini. ERP im
 * servira slike od 255 px, a od 31.08.2026. ni to — weberp-api.com je
 * ugasen i vraca parking stranicu. Proizvodjaceva stranica je jedini
 * preostali izvor.
 *
 * ── Zasto sitemap, a ne pretraga ─────────────────────────────────────────
 * Struganje pretrage znaci jedan zahtjev po proizvodu i lomi se cim
 * promijene raspored stranice. Sitemap je jedan dohvat za cijeli katalog
 * (805 engleskih proizvoda), pa se poklapanje radi lokalno. Njihov
 * robots.txt to izricito dopusta (Allow: /, Content-Signal: use=reference);
 * AI crawleri su zabranjeni i to postujemo — ovo se vrti kao alat trgovca
 * koji preuzima fotografije proizvoda koje i sam prodaje.
 *
 * ── Poklapanje ────────────────────────────────────────────────────────────
 * Testirano na 18 nasih proizvoda: 11 poklopljeno, sva na ocjeni 1.00.
 * Pravila su izvedena iz stvarnih promasaja:
 *
 *   - Broj je GRAMAZA samo ako ga slijedi jedinica. Inace bi '8:1:1' u
 *     BCAA i '5' u 5-HTP bili shvaceni kao gramaza; posljedica je bila da
 *     se nas 'BCAA 8:1:1' samouvjereno poklopio s njihovim 'BCAA 2:1:1'.
 *   - Gramaza se usporedjuje po BROJU, ne po jedinici: mi pisemo '90 tabs',
 *     oni '90 capsules' za isti proizvod.
 *   - Boduje se SAMO ime, gramaza je filter. Inace se 'Dextrose 500 g'
 *     poklopi s 'Glutamina 500 g' — ista gramaza, krivi proizvod.
 *   - Okusi se izbacuju: nas naslov zna nositi 'Orange', njihov slug ne.
 */
import axios from 'axios'
import * as cheerio from 'cheerio'
import { gunzipSync } from 'node:zlib'

const UA = 'Mozilla/5.0 (compatible; ProteinHouse/1.0; +https://proteinhouse.ba)'
const SITEMAP = 'https://ostrovit.com/sitemap.xml.gz'

const SINONIM = {
  tablets: 'tab', tablet: 'tab', tabs: 'tab', tab: 'tab',
  capsules: 'cap', capsule: 'cap', caps: 'cap', cap: 'cap',
  gram: 'g', grams: 'g', g: 'g', kg: 'kg', ml: 'ml', l: 'l', mg: 'mg',
}
// Rijeci koje ne razlikuju proizvode — u slugu su svuda ili nigdje.
const SUVISNO = new Set(['ostrovit', 'vege', 'vega', 'r', 'the', 'and', 'plus'])
const JEDINICE = new Set(['g', 'kg', 'ml', 'l', 'tab', 'cap', 'mg'])
const OKUSI = new Set([
  'orange', 'lemon', 'cherry', 'peach', 'natural', 'chocolate', 'vanilla',
  'strawberry', 'raspberry', 'mango', 'coconut', 'almond', 'banana', 'apple',
])

/** Razlozi naziv na ime proizvoda i gramazu. */
export function razlozi(s) {
  const t = String(s ?? '').toLowerCase()
    .replace(/&/g, ' ')
    .replace(/(\d)\s*([a-z]+)/g, '$1 $2')   // '300g' → '300 g'
    .replace(/[^a-z0-9]+/g, ' ')
    .trim().split(/\s+/)
    .map((x) => SINONIM[x] ?? x)
    .filter((x) => x && !SUVISNO.has(x))

  const ime = [], mjere = []
  for (let i = 0; i < t.length; i++) {
    if (/^\d+$/.test(t[i]) && JEDINICE.has(t[i + 1])) {
      mjere.push(t[i])   // samo broj — 'tabs' i 'capsules' su isto
      i++
    } else if (!JEDINICE.has(t[i])) {
      ime.push(t[i])
    }
  }
  return { ime: new Set(ime.filter((x) => !OKUSI.has(x))), mjere }
}

async function dohvati(url, opts = {}) {
  const { data } = await axios.get(url, {
    headers: { 'User-Agent': UA, Accept: '*/*' },
    timeout: 30_000, maxRedirects: 5, ...opts,
  })
  return data
}

/**
 * Sitemap dolazi mjesovito: indeks je obican XML unatoc .gz nastavku, a
 * dijelovi su stvarno gzipani. Content-Encoding ne javljaju, pa axios ne
 * raspakira sam — prepoznajemo po magicnim bajtovima 1f 8b.
 */
async function dohvatiXml(url) {
  const data = await dohvati(url, { responseType: 'arraybuffer' })
  const buf = Buffer.from(data)
  return (buf[0] === 0x1f && buf[1] === 0x8b ? gunzipSync(buf) : buf).toString('utf8')
}

let kesiraniKatalog = null

/** Svi engleski proizvodi iz sitemapa. Dohvaca se jednom po pokretanju. */
export async function ucitajKatalog() {
  if (kesiraniKatalog) return kesiraniKatalog

  const indeks = await dohvatiXml(SITEMAP)
  const dijelovi = [...String(indeks).matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])

  const adrese = []
  for (const d of dijelovi) {
    const xml = await dohvatiXml(d)
    for (const m of String(xml).matchAll(/<loc>(https:\/\/ostrovit\.com\/en\/products\/[^<]+)<\/loc>/g)) {
      adrese.push(m[1])
    }
  }

  kesiraniKatalog = adrese.map((url) => {
    const slug = url.split('/products/')[1].replace(/\.html$/, '').replace(/-\d+$/, '')
    return { url, slug, ...razlozi(slug) }
  })
  return kesiraniKatalog
}

/**
 * Nadji proizvod u njihovom katalogu.
 * @returns {{url, slug, ocjena}|null} — null kad nije siguran
 */
export function pronadji(katalog, naslov, velicina = '', prag = 0.7) {
  const q = razlozi(`${naslov} ${velicina}`)
  if (!q.ime.size) return null

  let naj = null, najOcjena = 0
  for (const k of katalog) {
    // Gramaza je FILTER, ne bod. Kriva gramaza znaci krivu ambalazu na slici.
    if (q.mjere.length && k.mjere.length && !q.mjere.some((m) => k.mjere.includes(m))) continue
    if (!k.ime.size) continue

    let pogodaka = 0
    for (const x of q.ime) if (k.ime.has(x)) pogodaka++
    const ocjena = pogodaka / Math.max(q.ime.size, k.ime.size)
    if (ocjena > najOcjena) { najOcjena = ocjena; naj = k }
  }
  return najOcjena >= prag ? { ...naj, ocjena: najOcjena } : null
}

/** Fotografija s njihove stranice proizvoda. */
export async function slikaSaStranice(url) {
  const html = await dohvati(url, { responseType: 'text' })
  const $ = cheerio.load(html)
  let img = $('meta[property="og:image"]').attr('content')
    || $('meta[property="og:image:secure_url"]').attr('content')
    || $('meta[name="twitter:image"]').attr('content')
    || $('link[rel="image_src"]').attr('href')
  if (!img) return null
  if (img.startsWith('//')) img = 'https:' + img
  if (img.startsWith('/')) img = new URL(img, url).href
  return img
}
