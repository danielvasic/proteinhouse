/**
 * Poklapanje nasih naziva proizvoda s tudjim katalogom.
 *
 * Koriste ga svi izvori fotografija (ostrovit.com, bodyandfit.com). Pravila
 * su izvedena iz stvarnih promasaja koje su testovi otkrili — svaki komentar
 * ispod opisuje gresku koja se stvarno dogodila.
 */
const SINONIM = {
  tablets: 'tab', tablet: 'tab', tabs: 'tab', tab: 'tab',
  capsules: 'cap', capsule: 'cap', caps: 'cap', cap: 'cap',
  gram: 'g', grams: 'g', g: 'g', kg: 'kg', ml: 'ml', l: 'l', mg: 'mg',
  // Pakiranje po broju porcija: nas ERP pise '30 serv', drugi 'servings'.
  serv: 'serv', servings: 'serv', serving: 'serv', portions: 'serv',
  softgels: 'cap', softgel: 'cap', packs: 'pack', pack: 'pack',
}
// Rijeci koje ne razlikuju proizvode — u slugu su svuda ili nigdje.
const SUVISNO = new Set(['ostrovit', 'vege', 'vega', 'r', 'the', 'and', 'plus'])
const JEDINICE = new Set(['g', 'kg', 'ml', 'l', 'tab', 'cap', 'mg', 'serv', 'pack'])
const OKUSI = new Set([
  'orange', 'lemon', 'cherry', 'peach', 'natural', 'chocolate', 'vanilla',
  'strawberry', 'raspberry', 'mango', 'coconut', 'almond', 'banana', 'apple',
])

/** Razlozi naziv na ime proizvoda i gramazu. */
export function razlozi(s) {
  const t = String(s ?? '').toLowerCase()
    .replace(/&/g, ' ')
    .replace(/(\d)\s*([a-z]+)/g, '$1 $2')   // '300g' → '300 g', '5htp' → '5 htp'
    .replace(/([a-z])(\d)/g, '$1 $2')       // 'b100' → 'b 100'
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

/**
 * Razlika od jednog slova. Postoji jer nasi nazivi dolaze iz ERP-a i znaju
 * biti pogresno napisani — 'Citruline' umjesto 'Citrulline'. Ogranicena na
 * duze rijeci: na kratkima bi 'zinc'/'zink' bilo u redu, ali i 'b6'/'b12'
 * ne bi, a takve razlike su bitne.
 */
function blizu(a, b) {
  if (a === b) return true
  if (a.length < 6 || b.length < 6 || Math.abs(a.length - b.length) > 1) return false
  let i = 0, j = 0, razlika = 0
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue }
    if (++razlika > 1) return false
    if (a.length > b.length) i++
    else if (b.length > a.length) j++
    else { i++; j++ }
  }
  return razlika + (a.length - i) + (b.length - j) <= 1
}

/** Podskup u bilo kojem smjeru; prazno s bilo koje strane ne blokira. */
function mjereSlazu(a, b) {
  if (!a.length || !b.length) return true
  const A = new Set(a), B = new Set(b)
  return [...A].every((x) => B.has(x)) || [...B].every((x) => A.has(x))
}

function poklapaSe(skup, token) {
  if (skup.has(token)) return true
  for (const x of skup) if (blizu(x, token)) return true
  return false
}

/**
 * Nadji proizvod u njihovom katalogu.
 * @returns {{url, slug, ocjena}|null} — null kad nije siguran
 */
/**
 * @param {object} opt
 * @param {string[]} opt.izbaci  rijeci koje treba maknuti iz OBA naziva —
 *        obicno ime brenda, koje njihov naslov nosi a nas ne (brend nam je
 *        zasebna kolona). Bez toga 'Whey' i 'Mutant Whey' daju 0.50.
 */
export function pronadji(katalog, naslov, velicina = '', prag = 0.7, opt = {}) {
  const izbaci = new Set((opt.izbaci ?? []).flatMap((x) => razlozi(x).ime))
  const q = razlozi(`${naslov} ${velicina}`)
  for (const x of izbaci) q.ime.delete(x)
  if (!q.ime.size) return null

  let naj = null, najOcjena = 0
  for (const k of katalog) {
    // Gramaza i doza su FILTER, ne bod — kriva znaci krivu robu na slici.
    // Trazi se podskup u bilo kojem smjeru: njihov naslov cesto ne nosi
    // gramazu (ona je varijanta), a nas je nosi. Ali kad OBA imaju dozu,
    // ona se mora poklopiti — 'Alpha Lipoic Acid 300 Mg' i '600 Mg' su
    // razliciti proizvodi, oba u pakiranju od 60 kapsula.
    if (!mjereSlazu(q.mjere, k.mjere)) continue
    if (!k.ime.size) continue

    const kime = new Set([...k.ime].filter((x) => !izbaci.has(x)))
    if (!kime.size) continue

    let pogodaka = 0
    for (const x of q.ime) if (poklapaSe(kime, x)) pogodaka++
    // Tezinski: vaznije je da je NASE ime pronadjeno nego da se njihovo
    // potrosi. Njihovi naslovi nose opisne dodatke ('Gold Standard 100%
    // Whey Protein' za nas 'Gold Whey'), ali cetvrtina tezine na njihovoj
    // pokrivenosti sprjecava da kratko ime pokupi bilo sto duze.
    let obrnuto = 0
    for (const x of kime) if (poklapaSe(q.ime, x)) obrnuto++
    const ocjena = (pogodaka / q.ime.size) * 0.75 + (obrnuto / kime.size) * 0.25
    if (ocjena > najOcjena) { najOcjena = ocjena; naj = k }
  }
  return najOcjena >= prag ? { ...naj, ocjena: najOcjena } : null
}

