/**
 * scripts/podigni-slike.mjs
 *
 * Zamjenjuje slabe slike proizvoda boljima.
 *
 * ── Zašto ────────────────────────────────────────────────────────────────
 * ERP servira slike u 255 px i mi ih vjerno kopiramo u storage. Na stranici
 * se prikazuju na 400-600 px, a na retina ekranu treba dvostruko — pa
 * izgledaju mutno. Istovremeno `image_url` kod dosta proizvoda pokazuje na
 * fotografiju od 800-2500 px s brendove stranice, a prikaz daje prednost
 * spremljenoj slici. Od dvije koje imamo, pokazivali smo lošiju.
 *
 * Ovo skine ono iz image_url, provjeri je li stvarno bolje od spremljenog,
 * smanji na razumnu veličinu i zamijeni.
 *
 * ── Usput rjesava i hotlink ──────────────────────────────────────────────
 * Dio slika visi na cdn.shopify.com — tudjoj trgovini. Ako je maknu, nase
 * slike puknu bez upozorenja. Kopijom u nas storage to nestaje.
 *
 * ── Upotreba ─────────────────────────────────────────────────────────────
 *   node scripts/podigni-slike.mjs                 # samo pregled, ne dira nista
 *   node scripts/podigni-slike.mjs --primijeni     # stvarno upisuje
 *   node scripts/podigni-slike.mjs --samo-objavljene
 *   node scripts/podigni-slike.mjs --limit 50
 *
 * Trazi .env.local s VITE_SUPABASE_URL i SUPABASE_SERVICE_KEY
 * (service role — potreban je za upis u storage i products).
 */
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import { ucitajKatalog as ovKatalogUcitaj, pronadji as ovPronadji, slikaSaStranice } from './lib/ostrovit.mjs'
import { ucitajKatalog as bfKatalogUcitaj, nadjiSliku as bfNadjiSliku, VENDORI as BF_BRENDOVI } from './lib/bodyandfit.mjs'
import { ucitajKatalog as gwKatalogUcitaj, nadjiSliku as gwNadjiSliku } from './lib/gorillawear.mjs'
import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Iznad ovoga nema smisla ići: najveći prikaz na stranici je ~600 px, pa
// 1200 pokriva i retina ekrane. Veće samo usporava učitavanje.
const CILJ_PX     = 1200
// Ispod ovoga se ne isplati mijenjati — ako je izvor jedva veći od onoga što
// već imamo, dobitak je nevidljiv a zapis se bespotrebno mijenja.
const MIN_DOBITAK = 1.5
const KVALITETA   = 88

const args        = process.argv.slice(2)
const primijeni   = args.includes('--primijeni')
const samoObjavljene = args.includes('--samo-objavljene')
const limit       = Number(args[args.indexOf('--limit') + 1]) || 500

// Ucitavanje .env.local je najbolji trud, ne uvjet — modul se mora dati
// uvesti (npr. iz testa) bez da obori proces. Nedostatak kljuceva se javlja
// u main(), gdje stvarno smeta.
function ucitajEnv() {
  try {
    readFileSync(resolve(__dirname, '../.env.local'), 'utf-8').split('\n').forEach((red) => {
      const m = red.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^['"]|['"]$/g, '')
    })
  } catch { /* nema ga — mozda su varijable vec u okruzenju */ }
}
ucitajEnv()

const url = process.env.VITE_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

const KANTA = 'product-images'
const javniUrl = (put) => `${url}/storage/v1/object/public/${KANTA}/${put}`

/**
 * Sto je bolji izvor. Proizvodjaceva stranica je i pravno cistija i
 * stabilnija od tudjeg Shopify CDN-a, koji nam slike moze maknuti bilo kad.
 */
function ocijeniIzvor(u) {
  if (!u) return 0
  if (/weberp-api\.com/i.test(u))  return 1   // ERP, uvijek 255 px
  if (/cdn\.shopify\.com/i.test(u)) return 2  // tudja trgovina
  return 3                                     // brendova stranica
}

async function dimenzije(buf) {
  try {
    const m = await sharp(buf).metadata()
    return { w: m.width ?? 0, h: m.height ?? 0 }
  } catch { return { w: 0, h: 0 } }
}

async function skini(u) {
  const res = await fetch(u, {
    redirect: 'follow',
    // Neki brendovi odbijaju zahtjeve bez preglednickog User-Agenta.
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ProteinHouse/1.0)' },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

/**
 * Je li image_url upotrebljiv. weberp-api.com je od 31.08.2026. ugasen —
 * domena je aktivna ali servira GoDaddy parking stranicu, pa adrese koje
 * pokazuju tamo vise ne vode ni do cega.
 */
function upotrebljivUrl(u) {
  if (!u || !u.trim()) return false
  if (/weberp-api\.com/i.test(u)) return false
  return true
}

/** Odakle uzeti fotografiju za ovaj proizvod. */
async function nadjiIzvor(p, katalozi) {
  if (upotrebljivUrl(p.image_url)) return { url: p.image_url, odakle: 'image_url' }
  const vel = Array.isArray(p.sizes) && p.sizes.length ? p.sizes[0] : ''

  if (p.brand === 'OstroVit' && katalozi.ov) {
    const m = ovPronadji(katalozi.ov, p.title, vel)
    if (m) {
      const img = await slikaSaStranice(m.url)
      if (img) return { url: img, odakle: `ostrovit.com (${m.ocjena.toFixed(2)})` }
    }
  }
  if (BF_BRENDOVI[p.brand] && katalozi.bf) {
    const m = bfNadjiSliku(katalozi.bf, p.brand, p.title, vel)
    if (m?.url) return { url: m.url, odakle: `bodyandfit.com (${m.ocjena.toFixed(2)}) — ${m.naslov}` }
  }
  if (p.brand === 'Gorilla Wear' && katalozi.gw) {
    const m = gwNadjiSliku(katalozi.gw, p.title)
    if (m?.url) return { url: m.url, odakle: `urbangymwear (${m.ocjena.toFixed(2)}) — ${m.naslov}` }
  }
  return { url: null, odakle: null }
}

async function main() {
  if (!url || !key) {
    console.error('Nedostaje VITE_SUPABASE_URL ili SUPABASE_SERVICE_KEY.')
    console.error('Stavi ih u .env.local (service_role kljuc je u Supabase → Project Settings → API).')
    process.exit(1)
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } })

  let q = supabase
    .from('products')
    .select('id, slug, brand, title, sizes, image_path, image_url, is_active')
    .order('is_active', { ascending: false })
    .limit(limit)
  if (samoObjavljene) q = q.eq('is_active', true)

  const { data: proizvodi, error } = await q
  if (error) throw error

  // Tudji katalozi se dohvacaju samo ako ih stvarno trebamo.
  const treba = (uvjet) => proizvodi.some((p) => uvjet(p) && !upotrebljivUrl(p.image_url))

  let ovKatalog = null
  if (treba((p) => p.brand === 'OstroVit')) {
    process.stdout.write('ucitavam katalog ostrovit.com… ')
    ovKatalog = await ovKatalogUcitaj()
    console.log(`${ovKatalog.length} proizvoda`)
  }
  let bfKatalog = null
  if (treba((p) => BF_BRENDOVI[p.brand])) {
    process.stdout.write('ucitavam katalog bodyandfit.com… ')
    bfKatalog = await bfKatalogUcitaj()
    console.log(`${bfKatalog.length} proizvoda`)
  }
  let gwKatalog = null
  if (treba((p) => p.brand === 'Gorilla Wear')) {
    process.stdout.write('ucitavam Gorilla Wear katalog… ')
    gwKatalog = await gwKatalogUcitaj()
    console.log(`${gwKatalog.length} proizvoda`)
  }
  console.log()

  console.log(`${primijeni ? 'PRIMJENJUJEM' : 'PREGLED (nista se ne upisuje)'} — ${proizvodi.length} proizvoda\n`)

  const stat = { podignuto: 0, preskoceno: 0, palo: 0 }
  const promjene = []

  for (const p of proizvodi) {
    const ime = `${p.brand ?? ''} ${p.title}`.trim().slice(0, 42)
    try {
      const { url: izvorUrl, odakle } = await nadjiIzvor(p, { ov: ovKatalog, bf: bfKatalog, gw: gwKatalog })
      if (!izvorUrl) {
        stat.preskoceno++
        console.log(`  -  ${ime.padEnd(44)} nema izvora`)
        continue
      }
      const noviBuf = await skini(izvorUrl)
      const novo = await dimenzije(noviBuf)
      if (!novo.w) throw new Error('nije slika')

      // Koliko je ono sto vec imamo
      let staro = { w: 0, h: 0 }
      if (p.image_path) {
        try { staro = await dimenzije(await skini(javniUrl(p.image_path))) } catch { /* nema je */ }
      }

      const dobitak = staro.w ? novo.w / staro.w : Infinity
      if (dobitak < MIN_DOBITAK) {
        stat.preskoceno++
        console.log(`  =  ${ime.padEnd(44)} ${staro.w}px, izvor ${novo.w}px — nije vrijedno`)
        continue
      }

      // Smanji samo ako je vece od cilja; nikad ne povecavaj.
      //
      // WebP za sve, iz dva razloga. Prvo, sluzbene fotografije su gotovo
      // uvijek PNG s prozirnom pozadinom, a JPEG prozirnost ne poznaje i
      // pretvara je u CRNO — proizvod bi zavrsio na crnom pravokutniku usred
      // bijele kartice. Drugo, PNG koji cuva prozirnost je ili ogroman
      // (1 MB) ili svodi na 256 boja, sto raspadne metalik i gradijente.
      // WebP cuva alfu, ne kvantizira i upola je manji od PNG-a s paletom.
      // Google Merchant Center ga prima, kao i svi preglednici od 2020.
      const obradjen = await sharp(noviBuf)
        .resize({ width: CILJ_PX, height: CILJ_PX, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: KVALITETA })
        .toBuffer()
      const konacne = await dimenzije(obradjen)

      const put = `hd/${p.slug}.webp`
      promjene.push({
        ime, slug: p.slug, aktivan: p.is_active,
        staro: staro.w, novo: konacne.w, izvor: ocijeniIzvor(izvorUrl),
        put, izvorUrl, odakle,
        staraSlika: p.image_path ? javniUrl(p.image_path) : null,
        // data: URI da se pregled moze otvoriti prije nego je ista uploadano
        novaSlika: `data:image/webp;base64,${obradjen.toString('base64')}`,
      })

      if (primijeni) {
        const { error: upErr } = await supabase.storage
          .from(KANTA).upload(put, obradjen, { contentType: 'image/webp', upsert: true })
        if (upErr) throw upErr
        const { error: dbErr } = await supabase.from('products')
          .update({ image_path: put }).eq('id', p.id)
        if (dbErr) throw dbErr
      }

      stat.podignuto++
      const oznaka = p.is_active ? '*' : ' '
      console.log(`  ${oznaka} ${ime.padEnd(44)} ${String(staro.w || '—').padStart(4)}px → ${konacne.w}px  (${Math.round(obradjen.length / 1024)} kB)`)
    } catch (err) {
      stat.palo++
      console.log(`  !  ${ime.padEnd(44)} ${err.message}`)
    }
  }

  console.log(`\npodignuto ${stat.podignuto}  preskoceno ${stat.preskoceno}  palo ${stat.palo}`)
  console.log('* = objavljen proizvod')

  const sShopifyja = promjene.filter((x) => x.izvor === 2).length
  if (sShopifyja) {
    console.log(`\n${sShopifyja} slika je dosla s tudjeg Shopify CDN-a. Sada su u nasem`)
    console.log('storageu, pa vise ne mogu puknuti ako ih ta trgovina makne.')
  }
  if (promjene.length) {
    const put = resolve(__dirname, '../pregled-slika.html')
    writeFileSync(put, pregledHtml(promjene))
    console.log(`\nVizualni pregled: ${put}`)
    console.log('OTVORI GA PRIJE PRIMJENE. Skinuta slika zna biti drugo pakiranje')
    console.log('nego sto prodajemo (npr. vreca od 5 LB umjesto kutije od 908 g).')
  }
  if (!primijeni && promjene.length) {
    console.log('\nNista nije upisano. Za stvarnu izmjenu: node scripts/podigni-slike.mjs --primijeni')
  }
}

/**
 * Stranica za pregled prije primjene.
 *
 * Postoji zbog konkretne zamke: image_url je nekad pokupljen priblizno i
 * pokazuje na DRUGO pakiranje istog proizvoda. Rezolucija je bolja, ali bi
 * kupac vidio krivu ambalazu. To se ne da provjeriti programski — mora
 * covjek pogledati.
 */
export function pregledHtml(promjene) {
  const red = (x) => `
    <div class="par${x.aktivan ? ' aktivan' : ''}">
      <div class="ime">${x.ime}${x.aktivan ? ' <span class=objavljen>OBJAVLJEN</span>' : ''}</div>
      <div class="slike">
        <figure>
          <img src="${x.staraSlika ?? ''}" alt="">
          <figcaption>sada — ${x.staro || 'nema slike'}${x.staro ? 'px' : ''}</figcaption>
        </figure>
        <div class="strelica">&rarr;</div>
        <figure>
          <img src="${x.novaSlika}" alt="">
          <figcaption class="novo">nakon — ${x.novo}px</figcaption>
        </figure>
      </div>
      <div class="izvor">${x.odakle ?? ''} &middot; ${String(x.izvorUrl).slice(0, 88)}</div>
    </div>`

  return `<!doctype html><meta charset="utf-8"><title>Pregled slika</title>
<style>
  body{font:14px/1.5 system-ui,sans-serif;background:#eef1f5;margin:0;padding:24px;color:#1e272e}
  h1{font-size:20px;margin:0 0 4px}
  .upozorenje{background:#fff3cd;border-left:4px solid #e0a800;padding:12px 16px;margin:16px 0;max-width:900px}
  .par{background:#fff;border:1px solid #dde3ea;padding:16px;margin-bottom:14px;max-width:900px}
  .par.aktivan{border-left:4px solid #0145F2}
  .ime{font-weight:700;margin-bottom:10px}
  .objavljen{font-size:11px;background:#0145F2;color:#fff;padding:2px 6px;vertical-align:2px}
  .slike{display:flex;align-items:center;gap:18px}
  figure{margin:0;text-align:center}
  img{max-width:230px;max-height:230px;background:#fff;border:1px solid #e6e9ee;display:block}
  figcaption{font-size:12px;color:#7a8794;margin-top:6px}
  figcaption.novo{color:#0a7d32;font-weight:600}
  .strelica{font-size:26px;color:#b6c0cc}
  .izvor{font-size:11px;color:#98a3b0;margin-top:10px;word-break:break-all}
</style>
<h1>Pregled zamjene slika — ${promjene.length} proizvoda</h1>
<div class="upozorenje">
  <b>Provjeri da je na desnoj slici isto pakiranje kao na lijevoj.</b><br>
  Slika je pokupljena po nazivu proizvoda, pa zna biti druga gramaza ili
  ambalaza (npr. vreca od 5 LB umjesto kutije od 908 g). Rezolucija je bolja,
  ali bi kupac vidio krivi proizvod. Sto ne valja — preskoci i stavi rucno
  kroz admin.
</div>
${promjene.map(red).join('')}`
}

// Pokreni samo kad se skripta zove izravno — da se pregledHtml moze testirati.
if (process.argv[1] && process.argv[1].endsWith('podigni-slike.mjs')) {
  main().catch((e) => { console.error(e); process.exit(1) })
}
