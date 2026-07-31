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

export const DEFAULT_DAYS = 25

function emailHtml({ name, coupon, siteUrl, days }) {
  const firstName = (name || '').trim().split(' ')[0] || 'zdravo'
  return `
<div style="font-family:Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;color:#1e272e">
  <div style="background:#0145f2;padding:24px;text-align:center">
    <span style="color:#fff;font-weight:900;letter-spacing:.08em;font-size:18px">PROTEINHOUSE</span>
  </div>
  <div style="padding:32px 24px">
    <h1 style="font-size:20px;margin:0 0 16px;font-style:italic;text-transform:uppercase">${firstName}, jesu li ti zalihe pri kraju?</h1>
    <p style="font-size:14px;line-height:1.6;color:#4b5563;margin:0 0 24px">
      Prošlo je oko ${days} dana od tvoje zadnje narudžbe. Obnovi zalihe i iskoristi
      dodatni popust na sljedeću kupovinu.
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
 *   onlyEmail — ograniči na jednu adresu (test na sebi)
 * @returns {Promise<{processed:number, sent:number, failed:number, recipients:string[]}>}
 */
export async function runReminders({ days = DEFAULT_DAYS, dryRun = false, onlyEmail = null } = {}) {
  if (!dryRun && (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM)) {
    throw Object.assign(new Error('Nedostaje RESEND_API_KEY ili RESEND_FROM.'), { code: 'NOT_CONFIGURED' })
  }

  const coupon  = process.env.REMINDER_COUPON || 'POPUST5'
  const siteUrl = process.env.SITE_URL || 'https://proteinhouse.ba'
  const cutoff  = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

  const supabase = serviceClient()
  let query = supabase
    .from('orders')
    .select('id, customer_name, customer_email')
    .is('reminder_sent_at', null)
    .lte('created_at', cutoff)
    .neq('status', 'otkazana')
    .not('customer_email', 'is', null)
    .limit(200)
  if (onlyEmail) query = query.ilike('customer_email', onlyEmail)

  const { data: orders, error } = await query
  if (error) throw error

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
      try {
        await sendEmail({
          to: email,
          subject: 'Jesu li ti zalihe pri kraju? Evo 5% popusta',
          html: emailHtml({ name: order.customer_name, coupon, siteUrl, days }),
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

  return { processed: orders?.length ?? 0, sent, failed, recipients: [...seen] }
}
