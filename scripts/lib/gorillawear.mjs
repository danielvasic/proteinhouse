/**
 * Fotografije za Gorilla Wear — 196 proizvoda, najveci brend u katalogu.
 *
 * ── Zasto ne s gorillawear.com ───────────────────────────────────────────
 * Njihova stranica je iza Cloudflare izazova (cf-mitigated: challenge,
 * "Just a moment..."). Prolazi samo robots.txt; sve ostalo, ukljucujuci
 * sitemap koji taj isti robots.txt oglasava, vraca 403. Zaobilazenje
 * zastite od botova ne dolazi u obzir — i bilo bi krhko svejedno.
 *
 * Umjesto toga se koristi Urban Gym Wear, sluzbeni Gorilla Wear dealer sa
 * Shopify trgovinom i otvorenim katalogom: 1351 Gorilla Wear proizvod sa
 * sluzbenim fotografijama. Isti pristup koji je rijesio Swansona.
 *
 * Fotografije su proizvodjaceve sluzbene, a ProteinHouse je i sam ovlasteni
 * Gorilla Wear preprodavac. Slike se kopiraju u nas storage, pa ne visimo na
 * tudjem CDN-u. Ako dobavljac ikad posalje sluzbeni media paket, on ima
 * prednost — ovo je zamjena, ne ideal.
 *
 * ── Poklapanje ───────────────────────────────────────────────────────────
 * Nasi nazivi su bosanski ("Dukserica Charlotte Crna"), njihovi engleski
 * ("Charlotte Hoodie - Black"). Sidro je NAZIV MODELA, koji je isti na obje
 * strane: Charlotte, Branson, Alexandria, Newark, Hailey, Pixley…
 *
 * Dva pravila su izvedena iz stvarnih promasaja:
 *   - Model MORA biti isti. Bez toga se "Dukserica Hailey Siva" poklopila s
 *     "Delta Hoodie - Grey" — poklopili su se samo predmet i boja.
 *   - Vrsta odjece je filter, po skupinama. Bez toga je "Dukserica Newark
 *     Plava" pokupila "Newark Pants - Blue" umjesto "Newark Sweater - Blue".
 */
import axios from 'axios'

const UA = 'Mozilla/5.0 (compatible; ProteinHouse/1.0; +https://proteinhouse.ba)'
const IZVOR = 'https://urbangymwear.co.uk/collections/gorilla-wear/products.json'

const BOJE = {
  crna: 'black', crni: 'black', crno: 'black', bijela: 'white', bijeli: 'white',
  siva: 'grey', sivi: 'grey', plava: 'blue', plavi: 'blue', crvena: 'red',
  crveno: 'red', zuta: 'yellow', zuto: 'yellow', zelena: 'green', zeleni: 'green',
  bez: 'beige', lila: 'lilac', maslinasto: 'army', maslinasta: 'army',
  roza: 'pink', smedja: 'brown', narandzasta: 'orange', tirkizna: 'turquoise',
}
const ENG_BOJE = new Set([
  'black', 'white', 'grey', 'gray', 'blue', 'red', 'yellow', 'green', 'beige',
  'lilac', 'army', 'pink', 'brown', 'orange', 'burgundy', 'navy', 'melange',
  'olive', 'purple', 'camo', 'turquoise', 'khaki', 'cream',
])

/** Unutar skupine je isti predmet; izmedju skupina nije. */
const SKUPINE = [
  ['hoodie', 'sweatshirt', 'sweater', 'jumper'],
  ['shorts'], ['pants'], ['shirt'], ['leggings'], ['tank'],
  ['jacket'], ['vest'], ['bra'], ['shoes'], ['cap'],
]
const ODJECA = {
  dukserica: 'hoodie', duks: 'hoodie', hoodie: 'hoodie',
  sweatshirt: 'sweatshirt', sweater: 'sweater', jumper: 'jumper',
  majica: 'shirt', shirt: 'shirt', tshirt: 'shirt', tee: 'shirt', top: 'shirt',
  sorc: 'shorts', sorts: 'shorts', shorts: 'shorts', sweatshorts: 'shorts',
  hlace: 'pants', pants: 'pants', sweatpants: 'pants', joggers: 'pants', trousers: 'pants',
  tajice: 'leggings', leggings: 'leggings', tights: 'leggings',
  tenkerica: 'tank', tank: 'tank', singlet: 'tank',
  prsluk: 'vest', vest: 'vest', jakna: 'jacket', jacket: 'jacket',
  kapa: 'cap', cap: 'cap', beanie: 'cap',
  patike: 'shoes', shoes: 'shoes', sneakers: 'shoes',
}
// Rijeci koje ne razlikuju proizvode.
const SUM = new Set(['gorilla', 'wear', 'oversized', 'zip', 'crop', 'cropped',
  'old', 'school', 'the', 'and', 'sleeveless', 'hooded'])

const bezKvacica = (s) => String(s).normalize('NFD')
  .replace(/[̀-ͯ]/g, '').replace(/đ/g, 'dj')

export function razlozi(s) {
  const t = bezKvacica(s).toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/)
    .map((x) => BOJE[x] ?? x)
    .filter((x) => x && !SUM.has(x))

  const boje = [], vrste = [], model = []
  for (const x of t) {
    if (ENG_BOJE.has(x)) boje.push(x)
    else if (ODJECA[x]) vrste.push(ODJECA[x])
    else model.push(x)
  }
  return { boje: new Set(boje), vrste, model: new Set(model) }
}

const skupinaOd = (v) => SKUPINE.findIndex((g) => g.includes(v))
function vrstaSlaze(a, b) {
  if (!a.length || !b.length) return true
  return a.some((x) => b.some((y) => skupinaOd(x) >= 0 && skupinaOd(x) === skupinaOd(y)))
}

let kesirano = null

export async function ucitajKatalog() {
  if (kesirano) return kesirano
  const svi = []
  for (let stranica = 1; stranica <= 20; stranica++) {
    const { data } = await axios.get(`${IZVOR}?limit=250&page=${stranica}`, {
      headers: { 'User-Agent': UA, Accept: 'application/json' }, timeout: 30_000,
    })
    if (!data?.products?.length) break
    svi.push(...data.products)
  }
  kesirano = svi
    .map((p) => ({
      naslov: p.title,
      slika: (p.images ?? [])[0]?.src ?? null,
      ...razlozi(p.title.replace(/^Gorilla Wear /i, '')),
    }))
    .filter((p) => p.slika && p.model.size)
  return kesirano
}

/** @returns {{url, ocjena, naslov}|null} */
export function nadjiSliku(katalog, naslov, _velicina = '') {
  const q = razlozi(naslov)
  if (!q.model.size) return null

  let naj = null, najOcjena = 0
  for (const k of katalog) {
    let modela = 0
    for (const x of q.model) if (k.model.has(x)) modela++
    if (!modela) continue                       // model mora biti isti
    if (!vrstaSlaze(q.vrste, k.vrste)) continue // dukserica nije hlace

    let bojaPogodak = 0
    for (const x of q.boje) if (k.boje.has(x)) bojaPogodak++
    const ocjena = (modela / Math.max(q.model.size, k.model.size)) * 0.6
      + (q.boje.size ? bojaPogodak / q.boje.size : 1) * 0.4
    if (ocjena > najOcjena) { najOcjena = ocjena; naj = k }
  }
  return najOcjena >= 0.6
    ? { url: naj.slika, ocjena: najOcjena, naslov: naj.naslov }
    : null
}
