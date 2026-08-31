/**
 * Fotografije s bodyandfit.com.
 *
 * Pokriva DVA nasa brenda odjednom:
 *   Body&Fit        48 proizvoda  (vendor 'Body & Fit' + Sportwears + Accessories)
 *   Swanson Health 114 proizvoda  (vendor 'Swanson' — 141 u njihovom katalogu)
 *
 * Swanson je bio najveci brend bez ijednog izvora slika. Nasao se ovdje jer
 * ga Body&Fit preprodaje, pa im je u katalogu s punim fotografijama.
 *
 * ── Zasto JSON, a ne struganje ───────────────────────────────────────────
 * Bodyandfit.com je Shopify trgovina, a Shopify ima javni katalog na
 * /products.json (250 po stranici). To je sluzbeno suceje, ne struganje:
 * dolazi kao cist JSON s nazivom, proizvodjacem i svim fotografijama, i ne
 * lomi se kad promijene izgled stranice. Cijeli katalog su 3 zahtjeva.
 *
 * Prvi pokusaj je bio /en-int/search?q=… i vracao je 404 — kriva adresa je
 * ostavila dojam da se brend ne da rijesiti. Trebalo je pogledati robots.txt,
 * gdje se po /checkouts/ i /collections/*sort_by* odmah vidi Shopify.
 */
import axios from 'axios'
import { razlozi, pronadji } from './poklapanje.mjs'

const UA = 'Mozilla/5.0 (compatible; ProteinHouse/1.0; +https://proteinhouse.ba)'
const BAZA = 'https://www.bodyandfit.com/en-gb/products.json'

/**
 * Nasi nazivi brendova → kako se zovu kod njih (podniz, mala slova).
 *
 * Body&Fit preprodaje puno brendova, pa jedan izvor pokriva vise nasih.
 * Swanson je najveci ulov: 141 njihov proizvod, a kod nas 114 bez ijedne
 * druge moguce fotografije.
 */
export const VENDORI = {
  'Body&Fit':            ['body & fit'],
  'Swanson Health':      ['swanson'],
  'Optimum Nutrition':   ['optimum nutrition'],
  'Mutant':              ['mutant'],
  'BSN':                 ['bsn'],
  'Universal Nutrition': ['universal'],
  'Scivation':           ['scivation'],
}

let kesirano = null

/** Cijeli katalog. Dohvaca se jednom po pokretanju (~580 proizvoda, 3 zahtjeva). */
export async function ucitajKatalog() {
  if (kesirano) return kesirano

  const svi = []
  for (let stranica = 1; stranica <= 20; stranica++) {
    const { data } = await axios.get(`${BAZA}?limit=250&page=${stranica}`, {
      headers: { 'User-Agent': UA, Accept: 'application/json' },
      timeout: 30_000,
    })
    if (!data?.products?.length) break
    svi.push(...data.products)
  }

  kesirano = svi.map((p) => ({
    slug: p.title,
    vendor: String(p.vendor ?? '').toLowerCase(),
    // Shopify vraca sve fotografije; prva je naslovna.
    slika: (p.images ?? [])[0]?.src ?? null,
    ...razlozi(p.title),
  })).filter((p) => p.slika)

  return kesirano
}

/**
 * Nadji fotografiju za nas proizvod.
 * @returns {{url, ocjena, naslov}|null}
 */
export function nadjiSliku(katalog, brend, naslov, velicina = '') {
  const trazeni = VENDORI[brend]
  if (!trazeni) return null

  // Suzavamo na proizvodjaca prije poklapanja: bez toga bi se nas Swansonov
  // 'Ashwagandha 450 Mg' mogao poklopiti s necijim tudjim istoimenim.
  const podskup = katalog.filter((k) => trazeni.some((v) => k.vendor.includes(v)))
  if (!podskup.length) return null

  // Ime brenda se izbacuje iz oba naziva: njihov ga naslov nosi ('Mutant
  // Whey'), nas ne — brend nam je zasebna kolona.
  // 'Sci' i 'Uni' su ERP-ovi prefiksi u NASIM nazivima (Sci Xtend, Uni ZMA).
  const m = pronadji(podskup, naslov, velicina, 0.7, {
    izbaci: [...trazeni, brend, 'sci', 'uni', 'opti'],
  })
  return m ? { url: m.slika, ocjena: m.ocjena, naslov: m.slug } : null
}
