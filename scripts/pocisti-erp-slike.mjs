/**
 * scripts/pocisti-erp-slike.mjs
 *
 * Brise nereferencirane slike iz foldera erp/ u bucketu product-images.
 *
 * ── Zasto ────────────────────────────────────────────────────────────────
 * Sync skida ERP slike pod 'erp/...'. Kad admin proizvodu poslije postavi
 * svoju sliku, ERP kopija ostane u storageu bez ijedne reference. Od kad ime
 * fajla nosi hash sadrzaja (vidi runImageSync), svaka promjena slike u ERP-u
 * uz to ostavlja i prethodnu verziju.
 *
 * ── Sta NE dira ──────────────────────────────────────────────────────────
 * Iskljucivo folder erp/. Sve ostalo u bucketu ostaje netaknuto — tamo zive
 * rucne slike proizvoda ('<slug>-<timestamp>.<ext>'), About fotografije
 * (about/, referencirane iz site_content), hero baneri i hd/ galerija.
 * Provjereno na produkciji: nijedna tabela osim products.image_path ne
 * referencira erp/ putanje, ali skripta svejedno racuna reference iz vise
 * izvora umjesto da se oslanja na tu provjeru.
 *
 * ── Upotreba ─────────────────────────────────────────────────────────────
 *   node scripts/pocisti-erp-slike.mjs              # samo pregled, ne brise
 *   node scripts/pocisti-erp-slike.mjs --primijeni  # stvarno brise
 *
 * Idempotentna je — pusti je ponovo kad god zelis, npr. par sati nakon
 * deploya kad sync prebaci slike na imena s hashom.
 *
 * Trazi .env.local s VITE_SUPABASE_URL i SUPABASE_SERVICE_KEY (service role —
 * anon kljuc nema pravo brisanja u storageu).
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PRIMIJENI = process.argv.includes('--primijeni')
const KANTA = 'product-images'
const FOLDER = 'erp'

/**
 * Gdje sve trazimo .env.local.
 *
 * Kad se radi u git worktreeu, .env.local ne postoji pored skripte — gitignore
 * ga drzi samo u glavnom checkoutu. Worktree u .git ima pokazivac oblika
 * "gitdir: /put/do/glavnog/.git/worktrees/<ime>", pa iz njega izvucemo korijen
 * glavnog checkouta i pogledamo i tamo.
 */
function kandidatiZaEnv() {
  const korijen = resolve(__dirname, '..')
  const puts = [resolve(korijen, '.env.local'), resolve(process.cwd(), '.env.local')]

  try {
    const gitPut = resolve(korijen, '.git')
    if (existsSync(gitPut)) {
      const sadrzaj = readFileSync(gitPut, 'utf8')
      const m = sadrzaj.match(/^gitdir:\s*(.+?)[\r\n]*$/)
      if (m) {
        const i = m[1].indexOf('/.git/worktrees/')
        if (i > 0) puts.push(resolve(m[1].slice(0, i), '.env.local'))
      }
    }
  } catch { /* .git je obican direktorij — nismo u worktreeu */ }

  return [...new Set(puts)]
}

function ucitajEnv() {
  const env = {}
  for (const put of kandidatiZaEnv()) {
    if (!existsSync(put)) continue
    for (const red of readFileSync(put, 'utf8').split('\n')) {
      const m = red.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/)
      if (m && env[m[1]] === undefined) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  }
  return { ...env, ...process.env }
}

const env = ucitajEnv()
const url = env.VITE_SUPABASE_URL
const key = env.SUPABASE_SERVICE_KEY || env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
  console.error('Nedostaje VITE_SUPABASE_URL ili SUPABASE_SERVICE_KEY (service role).')
  console.error('Trazio sam .env.local ovdje:')
  for (const put of kandidatiZaEnv()) console.error(`  ${existsSync(put) ? '[ima]  ' : '[nema] '}${put}`)
  process.exit(1)
}

/**
 * Uloga iz kljuca. Sa anon kljucem RLS sakrije vecinu proizvoda, referenci
 * ostane sacica, a razlika postane "obrisi skoro sve" — pa to hvatamo prije
 * nego se ista dogodi, a ne tek sigurnosnom kocnicom nize.
 */
function ulogaKljuca(k) {
  if (k.startsWith('sb_secret_')) return 'service_role'
  if (k.startsWith('sb_publishable_')) return 'anon'
  try { return JSON.parse(Buffer.from(k.split('.')[1], 'base64url').toString()).role ?? null }
  catch { return null }
}

const uloga = ulogaKljuca(key)
if (uloga && uloga !== 'service_role') {
  console.error(`Kljuc ima ulogu "${uloga}", a treba service_role.`)
  console.error('Sa anon kljucem RLS sakrije proizvode, pa bi skripta zive slike proglasila siročadima.')
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { persistSession: false } })

/** Sve datoteke u erp/ — storage.list vraca najvise 1000 po pozivu. */
async function sveDatoteke() {
  const out = []
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await supabase.storage.from(KANTA)
      .list(FOLDER, { limit: 1000, offset, sortBy: { column: 'name', order: 'asc' } })
    if (error) throw error
    out.push(...(data ?? []).filter((d) => d.id).map((d) => `${FOLDER}/${d.name}`))
    if (!data || data.length < 1000) break
  }
  return out
}

/** Sve erp/ putanje na koje bilo sta pokazuje. */
async function referencirano() {
  const ref = new Set()
  const dodaj = (v) => {
    if (typeof v !== 'string' || !v) return
    const bez = v.split('?')[0]
    const i = bez.indexOf(`/${KANTA}/`)
    const ime = i >= 0 ? bez.slice(i + KANTA.length + 2) : bez
    if (ime.startsWith(`${FOLDER}/`)) ref.add(ime)
  }

  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from('products')
      .select('image_path, image_url, images').range(from, from + 999)
    if (error) throw error
    for (const p of data ?? []) {
      dodaj(p.image_path); dodaj(p.image_url)
      if (Array.isArray(p.images)) for (const i of p.images) { dodaj(i?.path); dodaj(i?.url) }
    }
    if (!data || data.length < 1000) break
  }

  const { data: pokloni } = await supabase.from('gift_products').select('image_path, image_url')
  for (const g of pokloni ?? []) { dodaj(g.image_path); dodaj(g.image_url) }

  return ref
}

const [datoteke, ref] = await Promise.all([sveDatoteke(), referencirano()])

// Sigurnosna kocnica i za slucaj da uloga prodje a politika svejedno suzi
// citanje. U zdravom stanju je referencirana otprilike polovina datoteka;
// ispod 10% je znak da referenci nedostaje, a ne da su slike nepotrebne.
if (datoteke.length > 50 && ref.size < datoteke.length * 0.1) {
  console.error(`Prekid: ${datoteke.length} datoteka a samo ${ref.size} referenci — premalo da bi bilo tacno.`)
  console.error('Provjeri da kljuc stvarno vidi tabelu products (RLS).')
  process.exit(1)
}

const sirocad = datoteke.filter((d) => !ref.has(d))
console.log(`U erp/: ${datoteke.length} datoteka, referencirano ${ref.size}, siroce ${sirocad.length}.`)
if (!sirocad.length) { console.log('Nema sta da se brise.'); process.exit(0) }

console.log('\nPrimjeri:')
for (const s of sirocad.slice(0, 8)) console.log('  ' + s)
if (sirocad.length > 8) console.log(`  … i jos ${sirocad.length - 8}`)

if (!PRIMIJENI) {
  console.log('\nPregled — nista nije obrisano. Pokreni s --primijeni da se stvarno obrise.')
  process.exit(0)
}

let obrisano = 0
for (let i = 0; i < sirocad.length; i += 100) {
  const dio = sirocad.slice(i, i + 100)
  const { error } = await supabase.storage.from(KANTA).remove(dio)
  if (error) { console.error('Greska pri brisanju:', error.message); process.exit(1) }
  obrisano += dio.length
  console.log(`  obrisano ${obrisano}/${sirocad.length}`)
}
console.log(`\nGotovo — obrisano ${obrisano} datoteka.`)
