/**
 * Atribucija — odakle je posjetitelj došao.
 *
 * Google Ads dodaje ?gclid=… na odredišni URL (uz uključen auto-tagging),
 * Meta dodaje ?fbclid=…. Te šifre su jedini pouzdan način da se kasnija
 * kupovina veže za konkretan klik na reklamu; UTM oznake su korisne nama i
 * GA4, ali platforme se oslanjaju na svoje šifre.
 *
 * Šifra stigne SAMO na prvoj stranici koju posjetitelj otvori. Ako je tu ne
 * uhvatimo, izgubljena je — kupac do korpe dođe kroz nekoliko klikova, a URL
 * se odavno promijenio. Zato se hvata pri svakom učitavanju i pamti.
 *
 * ── Privola ──────────────────────────────────────────────────────────────
 * Ovo su podaci za praćenje. Dok posjetitelj ne prihvati kolačiće, drže se
 * SAMO u sessionStorage — traju koliko i tab i ne prate ga kroz vrijeme.
 * Tek na prihvat se prepisuju u kolačić od 90 dana. Ako odbije, ostaje na
 * sesiji i ništa se ne šalje dalje.
 *
 * Zašto uopće čuvati bez privole: posjetitelj koji odbije kolačiće i dalje
 * može naručiti, a nama za ispravan rad narudžbe atribucija ne treba — pa se
 * u tom slučaju uz narudžbu i ne pošalje.
 */
const SESIJA_KLJUC  = 'ph_atribucija'
const KOLACIC       = 'ph_atr'
const DANA          = 90

/** Ključevi koje uopće hvatamo. Isti popis postoji i u SQL funkciji. */
const POLJA = [
  'gclid', 'fbclid',
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term',
]

function citajKolacic(ime) {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(new RegExp('(?:^|; )' + ime + '=([^;]*)'))
  return m ? decodeURIComponent(m[1]) : null
}

function pisiKolacic(ime, vrijednost, dana) {
  if (typeof document === 'undefined') return
  const istek = new Date(Date.now() + dana * 864e5).toUTCString()
  // SameSite=Lax: kolačić preživi dolazak s Google/Meta reklame (to je
  // navigacija najviše razine), a ne šalje se uz zahtjeve trećih strana.
  document.cookie = `${ime}=${encodeURIComponent(vrijednost)}; expires=${istek}; path=/; SameSite=Lax`
}

function citajSesiju() {
  try { return JSON.parse(sessionStorage.getItem(SESIJA_KLJUC) || '{}') } catch { return {} }
}

function pisiSesiju(obj) {
  try { sessionStorage.setItem(SESIJA_KLJUC, JSON.stringify(obj)) } catch { /* private mode */ }
}

/**
 * Meta očekuje klik u obliku fb.<poddomena>.<vrijeme>.<fbclid>, ne goli
 * fbclid. Poddomena je 1 za domenu drugog nivoa (proteinhouse.ba).
 */
function uFbc(fbclid, kad) {
  return `fb.1.${kad}.${fbclid}`
}

/**
 * Uhvati ono što je stiglo u URL-u. Zove se pri svakom učitavanju stranice.
 * Postojeće vrijednosti se NE gaze praznima — posjetitelj koji je došao s
 * reklame pa otvorio još pet stranica bez parametara mora zadržati prvu.
 */
export function zabiljeziDolazak() {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  const stara  = getAtribucija()
  const nova   = { ...stara }
  let promjena = false

  for (const polje of POLJA) {
    const v = params.get(polje)
    if (v) { nova[polje] = v; promjena = true }
  }

  if (params.get('fbclid')) {
    nova.fbc = uFbc(params.get('fbclid'), Date.now())
    promjena = true
  }
  if (!nova.landing && promjena) {
    nova.landing = window.location.origin + window.location.pathname
  }

  if (!promjena) return
  pisiSesiju(nova)
  // U kolačić samo ako je privola već data; inače čeka promoviraj().
  if (jePrivola()) pisiKolacic(KOLACIC, JSON.stringify(nova), DANA)
}

function jePrivola() {
  try { return localStorage.getItem('ph_cookie_consent') === 'accepted' } catch { return false }
}

/**
 * Prepiši ono što je skupljeno u sesiji u trajni kolačić. Zove se u trenutku
 * kad posjetitelj prihvati kolačiće.
 */
export function promoviraj() {
  const a = getAtribucija()
  if (Object.keys(a).length) pisiKolacic(KOLACIC, JSON.stringify(a), DANA)
}

/** Sve što znamo o dolasku. Kolačić ima prednost jer preživi više posjeta. */
export function getAtribucija() {
  if (typeof window === 'undefined') return {}
  let izKolacica = {}
  try { izKolacica = JSON.parse(citajKolacic(KOLACIC) || '{}') } catch { /* pokvaren kolačić */ }
  return { ...citajSesiju(), ...izKolacica }
}

/**
 * Oblik koji ide uz narudžbu. Bez privole se ne šalje ništa — atribucija
 * narudžbi nije potrebna, a slanje bi značilo praćenje bez pristanka.
 *
 * _fbp postavlja sam Meta Pixel kad se učita; čitamo ga jer ga Meta traži uz
 * server-side događaje za bolje spajanje.
 */
export function zaNarudzbu() {
  if (!jePrivola()) return null
  const a = getAtribucija()
  const fbp = citajKolacic('_fbp')
  if (fbp) a.fbp = fbp
  // Pixel je mogao postaviti svoj _fbc točnije nego mi (npr. klik na drugoj
  // stranici u istoj sesiji) — ako postoji, njegov ima prednost.
  const fbc = citajKolacic('_fbc')
  if (fbc) a.fbc = fbc
  return Object.keys(a).length ? a : null
}
