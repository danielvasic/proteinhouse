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

/**
 * Boje po KORIJENU, ne po punom obliku. Bosanski pridjev se sklanja po rodu
 * i broju — crna/crni/crno/crne, maslinasta/maslinasti/maslinaste — pa je
 * popis punih oblika uvijek nepotpun. 'crn' hvata sve.
 */
const BOJE_KORIJEN = [
  ['crn', 'black'], ['bijel', 'white'], ['bjel', 'white'], ['siv', 'grey'],
  ['plav', 'blue'], ['crven', 'red'], ['zut', 'yellow'], ['zelen', 'green'],
  ['bez', 'beige'], ['lila', 'lilac'], ['maslinast', 'army'], ['roza', 'pink'],
  ['smedj', 'brown'], ['narandzast', 'orange'], ['ljubicast', 'purple'],
  ['violet', 'purple'], ['zlatn', 'gold'], ['tirkizn', 'turquoise'],
  ['maskiran', 'camo'], ['bordo', 'burgundy'],
]
const ENG_BOJE = new Set([
  'black', 'white', 'grey', 'gray', 'blue', 'red', 'yellow', 'green', 'beige',
  'lilac', 'army', 'pink', 'brown', 'orange', 'burgundy', 'navy', 'melange',
  'olive', 'purple', 'camo', 'turquoise', 'khaki', 'cream', 'gold', 'anthracite',
])
function bojaOd(t) {
  if (ENG_BOJE.has(t)) return t
  for (const [k, v] of BOJE_KORIJEN) if (t.startsWith(k)) return v
  return null
}

/** Unutar skupine je isti predmet; izmedju skupina nije. */
const SKUPINE = [
  ['hoodie', 'sweatshirt', 'sweater', 'jumper'],
  ['shorts'], ['pants'], ['shirt'], ['leggings'],
  // Tank top i sportski top su kod nas cesto isto; kod njih 'Tank Top' i
  // 'Sports Bra'. Drzimo ih u istoj skupini da se ne promase.
  ['tank', 'bra'],
  ['jacket'], ['vest'], ['shoes'], ['cap'], ['grips'], ['shaker'], ['dress'], ['towel'], ['belt'], ['bag'], ['socks'], ['gloves'],
]
/** Odjevni predmeti, isto po korijenu zbog deklinacije. */
const ODJECA_KORIJEN = [
  ['dukseric', 'hoodie'], ['duks', 'hoodie'], ['hoodie', 'hoodie'],
  ['sweatshirt', 'sweatshirt'], ['sweater', 'sweater'], ['jumper', 'jumper'],
  ['majic', 'shirt'], ['shirt', 'shirt'], ['tshirt', 'shirt'], ['tee', 'shirt'],
  ['sorc', 'shorts'], ['sorts', 'shorts'], ['shorts', 'shorts'], ['sweatshorts', 'shorts'],
  ['hlac', 'pants'], ['pants', 'pants'], ['sweatpants', 'pants'], ['joggers', 'pants'],
  ['trousers', 'pants'],
  ['tajic', 'leggings'], ['leggings', 'leggings'], ['tights', 'leggings'],
  ['tenkeric', 'tank'], ['tank', 'tank'], ['singlet', 'tank'],
  ['prsluk', 'vest'], ['vest', 'vest'],
  ['jakn', 'jacket'], ['jacket', 'jacket'],
  ['haljin', 'dress'], ['dress', 'dress'],
  ['kapa', 'cap'], ['beanie', 'cap'],
  ['patik', 'shoes'], ['shoes', 'shoes'], ['sneakers', 'shoes'],
  ['griper', 'grips'], ['grips', 'grips'], ['straps', 'grips'],
  ['shaker', 'shaker'], ['boca', 'shaker'], ['bottle', 'shaker'],
  ['pesk', 'towel'], ['rucnik', 'towel'], ['towel', 'towel'],
  ['kais', 'belt'], ['belt', 'belt'], ['pojas', 'belt'],
  ['torb', 'bag'], ['bag', 'bag'], ['ruksak', 'bag'], ['backpack', 'bag'],
  ['carap', 'socks'], ['socks', 'socks'],
  ['rukavic', 'gloves'], ['gloves', 'gloves'],
  ['rashguard', 'shirt'],
]
/**
 * Kratke rijeci se poklapaju TOCNO, ne po prefiksu. Prefiks od tri slova
 * pogadja nazive modela:
 *   'bra' → 'Branson' se citao kao grudnjak
 *   'top' → 'High Tops' (tenisice) se citalo kao majica
 *   'cap' → 'Capri', 'tee' → bilo sto na 'tee'
 */
const ODJECA_TOCNO = { top: 'tank', bra: 'bra', cap: 'cap', tee: 'shirt' }

function odjecaOd(t) {
  if (ODJECA_TOCNO[t]) return ODJECA_TOCNO[t]
  for (const [k, v] of ODJECA_KORIJEN) if (t.startsWith(k)) return v
  return null
}

/**
 * Opisni dodaci koji ne razlikuju proizvod.
 *
 * Vecina je s NJIHOVE strane — 'Elmira V-Neck T-Shirt', 'Hilton Seamless
 * Sports Bra' — i bez izbacivanja napuhu njihov skup pa poklapanje padne.
 * Ostatak je nas: 'D. Dio' (donji dio trenerke), 'S.'/'T.' (svijetlo/tamno).
 *
 * PAZI sto se dodaje ovdje: 'Classic', 'Smart', 'Lifting' i 'High Tops' su
 * kod nas NAZIVI MODELA, ne opisi. Kad su bili na ovom popisu, ti proizvodi
 * su ostajali bez ijednog tokena imena pa se nisu mogli poklopiti.
 */
const SUM = new Set(['gorilla', 'wear', 'oversized', 'zip', 'zipped', 'crop',
  'cropped', 'old', 'school', 'the', 'and', 'sleeveless', 'hooded', 'seamless',
  'performance', 'hybrid', 'pro', 'neck', 'v', 'sl', 'long', 'sleeve',
  'sports', 'sport', 'track', 'za', 'boks', 'd', 'g', 'dio', 's', 't',
  'svjetlo', 'svijetlo', 'tamno', 'trenerka', 'trenerke'])

const bezKvacica = (s) => String(s).normalize('NFD')
  .replace(/[̀-ͯ]/g, '').replace(/đ/g, 'dj')

/**
 * Trenerka se kod nas prodaje u dva dijela: 'D. Dio' je donji (hlace),
 * 'G. Dio' gornji (jakna ili dukserica). Bez ovoga se 'Trenerka G. Dio
 * Wenden' poklopio s njihovim 'Wenden Track Pants' — donjim dijelom.
 * Za gornji dio se dopustaju oba tipa jer ga zovu i jakna i dukserica.
 */
function dioTrenerke(tekst) {
  if (/\btrenerk/i.test(tekst)) {
    if (/\bd\.?\s*dio\b/i.test(tekst)) return ['pants']
    if (/\bg\.?\s*dio\b/i.test(tekst)) return ['jacket', 'hoodie']
  }
  return null
}

export function razlozi(s) {
  const izTrenerke = dioTrenerke(String(s))
  const t = bezKvacica(s).toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ').trim().split(/\s+/)
    .filter((x) => x && !SUM.has(x))

  const boje = [], vrste = [], model = []
  for (const x of t) {
    const b = bojaOd(x)
    if (b) { boje.push(b); continue }
    const o = odjecaOd(x)
    if (o) { vrste.push(o); continue }
    model.push(x)
  }
  return { boje: new Set(boje), vrste: izTrenerke ?? vrste, model: new Set(model) }
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
    // Boduje se koliko je NASEG modela pronadjeno, ne omjer prema njihovom
    // skupu. Njihovi naslovi nose opisne dodatke koje mi nemamo; kaznjavanje
    // po max() je odbijalo tocna poklapanja poput 'Elmira' → 'Elmira V-Neck'.
    const ocjena = (modela / q.model.size) * 0.6
      + (q.boje.size ? bojaPogodak / q.boje.size : 1) * 0.4
    if (ocjena > najOcjena) { najOcjena = ocjena; naj = k }
  }
  return najOcjena >= 0.6
    ? { url: naj.slika, ocjena: najOcjena, naslov: naj.naslov }
    : null
}
