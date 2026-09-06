/**
 * Podsjetnik za obnovu zaliha — logika odvojena od načina pokretanja.
 *
 * Pokreću je dvije funkcije:
 *   netlify/functions/reminder-emails.mjs  — po rasporedu, jednom dnevno
 *   netlify/functions/reminder-test.mjs    — ručno, samo admin (za testiranje)
 *
 * Netlify scheduled funkcije se u produkciji ne mogu pozvati preko HTTP-a,
 * pa bi bez odvojenog test ulaza jedini način provjere bio čekati 25 dana.
 */
import { serviceClient } from './supabaseAdmin.js'
import { posaljiViber, viberKonfigurisan, normalizujBrojBiH } from './viber.js'

export const DEFAULT_DAYS = 25

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))

function emailHtml({ name, coupon, siteUrl, days, proizvod }) {
  const firstName = esc((name || '').trim().split(' ')[0] || 'zdravo')
  // Naslov po proizvodu iz narudzbe ("Tvoj Gold Whey je pri kraju?") — generican
  // tek kad narudzba nema stavki.
  const naslov = proizvod ? `${firstName}, tvoj ${esc(proizvod)} je pri kraju?` : `${firstName}, jesu li ti zalihe pri kraju?`
  return `
<div style="font-family:Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;color:#1e272e">
  <div style="background:#0145f2;padding:24px;text-align:center">
    <span style="color:#fff;font-weight:900;letter-spacing:.08em;font-size:18px">PROTEINHOUSE</span>
  </div>
  <div style="padding:32px 24px">
    <h1 style="font-size:20px;margin:0 0 16px;font-style:italic;text-transform:uppercase">${naslov}</h1>
    <p style="font-size:14px;line-height:1.6;color:#4b5563;margin:0 0 24px">
      Prošlo je oko ${days} dana od tvoje zadnje narudžbe. Obnovi zalihe i iskoristi kupon
      <strong>${esc(coupon)}</strong> — dodatnih 5% popusta na sljedeću kupnju.
    </p>
    <div style="border:2px dashed #ff4103;padding:16px;text-align:center;margin-bottom:24px">
      <p style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#6b7280;margin:0 0 6px">Tvoj kupon</p>
      <p style="font-size:24px;font-weight:800;letter-spacing:.1em;margin:0;color:#ff4103">${coupon}</p>
    </div>
    <a href="${siteUrl}" style="display:block;background:#ff4103;color:#fff;text-decoration:none;text-align:center;padding:16px;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">
      Obnovi zalihe
    </a>
    <p style="font-size:12px;color:#9ca3af;margin:24px 0 0">
      Kod unosiš na checkoutu, u polje "Kupon".
    </p>
  </div>
</div>`.trim()
}

/** Najvrjednija stavka narudzbe — nosi naslov poruke ("Tvoj Gold Whey je pri kraju?"). */
function glavniProizvod(order) {
  const glavna = (Array.isArray(order.items) ? order.items : [])
    .slice().sort((a, b) => Number(b.price) * Number(b.qty || 1) - Number(a.price) * Number(a.qty || 1))[0]
  return glavna ? [glavna.brand, glavna.title].filter(Boolean).join(' ') : null
}

async function sendEmail({ to, subject, html }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: process.env.RESEND_FROM, to: [to], subject, html }),
  })
  if (!res.ok) throw new Error(`Resend ${res.status}: ${await res.text()}`)
}

/**
 * @param {{days?: number, dryRun?: boolean, onlyEmail?: string}} opts
 *   days      — koliko stara narudžba mora biti (default 25); manji broj za test
 *   dryRun    — samo nabroji koga bi pogodilo, bez slanja i bez upisa
 *   onlyEmail — ograniči email na jednu adresu (test na sebi)
 *   onlyPhone — ograniči Viber na jedan broj (test na sebi)
 * @returns {Promise<{processed:number, sent:number, failed:number, recipients:string[]}>}
 */
export async function runReminders({ days = DEFAULT_DAYS, dryRun = false, onlyEmail = null, onlyPhone = null } = {}) {
  // Dva nezavisna kanala: email (Resend) i Viber (BulkGate). Svaki radi ako je
  // konfigurisan; greska je tek kad nije nijedan.
  const emailOk = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM)
  const viberOk = viberKonfigurisan()
  if (!dryRun && !emailOk && !viberOk) {
    throw Object.assign(new Error('Nedostaje RESEND_API_KEY/RESEND_FROM (email) ili BULKGATE_* (Viber).'), { code: 'NOT_CONFIGURED' })
  }

  const coupon  = process.env.REMINDER_COUPON || 'POPUST5'
  const siteUrl = process.env.SITE_URL || 'https://proteinhouse.ba'
  const cutoff  = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const supabase = serviceClient()
  let query = supabase
    .from('orders')
    .select('id, customer_name, customer_email, items')
    .is('reminder_sent_at', null)
    .lte('created_at', cutoff)
    .neq('status', 'otkazana')
    .not('customer_email', 'is', null)
    .limit(200)
  if (onlyEmail) query = query.ilike('customer_email', onlyEmail)

  let orders = []
  if (emailOk || dryRun) {
    const { data, error } = await query
    if (error) throw error
    orders = data ?? []
  }

  // Jedan podsjetnik po kupcu po ciklusu — kupac s više narudžbi ne dobija spam.
  const seen = new Set()
  let sent = 0, failed = 0

  for (const order of orders ?? []) {
    const email = order.customer_email?.trim().toLowerCase()
    if (!email) continue

    if (!seen.has(email)) {
      if (dryRun) {
        seen.add(email)
        continue
      }
      const proizvod = glavniProizvod(order)
      try {
        await sendEmail({
          to: email,
          subject: proizvod ? `Tvoj ${proizvod} je pri kraju? Evo 5% popusta` : 'Jesu li ti zalihe pri kraju? Evo 5% popusta',
          html: emailHtml({ name: order.customer_name, coupon, siteUrl, days, proizvod }),
        })
        seen.add(email)
        sent++
      } catch (err) {
        console.error(`reminder: slanje na ${email} nije uspjelo —`, err.message)
        failed++
        continue  // ostavi reminder_sent_at prazan da se pokuša sutra
      }
    }
    if (!dryRun) {
      await supabase.from('orders').update({ reminder_sent_at: new Date().toISOString() }).eq('id', order.id)
    }
  }

  // ── Viber ────────────────────────────────────────────────────────────────
  // Samo narudzbe s privolom (kvacica na checkoutu), bez odjave (STOP) i bez
  // vec poslanog podsjetnika. Jedna poruka po broju po ciklusu.
  const viber = { configured: viberOk, processed: 0, sent: 0, failed: 0, skipped: 0, recipients: [] }
  if (viberOk || dryRun) {
    const { data: vOrders, error: vErr } = await supabase
      .from('orders')
      .select('id, customer_name, customer_phone, items')
      .not('viber_consent_at', 'is', null)
      .is('viber_opt_out_at', null)
      .is('reminder_viber_sent_at', null)
      .lte('created_at', cutoff)
      .neq('status', 'otkazana')
      .not('customer_phone', 'is', null)
      .limit(200)
    if (vErr) throw vErr

    const zeljeni = onlyPhone ? normalizujBrojBiH(onlyPhone) : null
    const vSeen = new Set()
    const oznaci = (id) => dryRun ? Promise.resolve() :
      supabase.from('orders').update({ reminder_viber_sent_at: new Date().toISOString() }).eq('id', id)

    for (const order of vOrders ?? []) {
      const broj = normalizujBrojBiH(order.customer_phone)
      if (zeljeni && broj !== zeljeni) continue
      viber.processed++
      if (!broj || vSeen.has(broj)) {
        // Fiksni/strani broj nikad nece dobiti Viber, a duplikat je vec
        // dobio — oznaci da se ne pokusava svaki dan iznova.
        viber.skipped++
        await oznaci(order.id)
        continue
      }
      if (dryRun) { vSeen.add(broj); continue }

      const ime = (order.customer_name || '').trim().split(' ')[0]
      const proizvod = glavniProizvod(order) || 'proizvod'
      const text =
        `${ime ? `${ime}, tvoj` : 'Tvoj'} ${proizvod} je pri kraju? ` +
        `Obnovi zalihe uz kupon ${coupon} — dodatnih 5% popusta na sljedeću kupnju. ` +
        `Odjava: odgovori STOP.`
      try {
        const r = await posaljiViber({ to: broj, text, button: { caption: 'Obnovi zalihe', url: siteUrl }, tag: 'podsjetnik-25' })
        if (r.ok) { vSeen.add(broj); viber.sent++ } else { viber.skipped++ }
        await oznaci(order.id)
      } catch (err) {
        console.error(`reminder viber: slanje na ${broj} nije uspjelo —`, err.message)
        viber.failed++   // reminder_viber_sent_at ostaje prazan — pokusaj sutra
      }
    }
    viber.recipients = [...vSeen]
  }

  return { processed: orders.length, sent, failed, recipients: [...seen], email: { configured: emailOk }, viber }
}
