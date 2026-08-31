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
 * Poklapanje naziva je u ./poklapanje.mjs. Na 18 testiranih nasih proizvoda
 * 11 je poklopljeno, sva na ocjeni 1.00.
 */
import axios from 'axios'
import * as cheerio from 'cheerio'
import { gunzipSync } from 'node:zlib'
import { razlozi, pronadji } from './poklapanje.mjs'

const UA = 'Mozilla/5.0 (compatible; ProteinHouse/1.0; +https://proteinhouse.ba)'
const SITEMAP = 'https://ostrovit.com/sitemap.xml.gz'

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

export { pronadji }
