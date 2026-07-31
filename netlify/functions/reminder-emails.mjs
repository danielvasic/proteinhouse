/**
 * Podsjetnik za obnovu zaliha — jednom dnevno.
 *
 * Kupcu koji je prije 25 dana naručio šaljemo email s kupon kodom za sljedeću
 * kupovinu. Svaka narudžba se obradi tačno jednom (orders.reminder_sent_at).
 *
 * Env varijable (Netlify → Site config → Environment variables):
 *   SUPABASE_SERVICE_ROLE_KEY   — obavezno, čita narudžbe mimo RLS-a
 *   RESEND_API_KEY              — obavezno
 *   RESEND_FROM                 — npr. "ProteinHouse <info@proteinhouse.ba>"
 *   REMINDER_COUPON             — opciono, default POPUST5
 *   SITE_URL                    — opciono, default https://proteinhouse.ba
 */
import { serviceClient } from '../../src/server/supabaseAdmin.js'

const DAYS = 25

function emailHtml({ name, coupon, siteUrl }) {
  const firstName = (name || '').trim().split(' ')[0] || 'zdravo'
  return `
<div style="font-family:Inter,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;color:#0A0E17">
  <div style="background:#0145F2;padding:24px;text-align:center">
    <span style="color:#fff;font-weight:900;letter-spacing:.08em;font-size:18px">PROTEINHOUSE</span>
  </div>
  <div style="padding:32px 24px">
    <h1 style="font-size:20px;margin:0 0 16px">${firstName}, jesu li ti zalihe pri kraju?</h1>
    <p style="font-size:14px;line-height:1.6;color:#4b5563;margin:0 0 24px">
      Prošlo je oko ${DAYS} dana od tvoje zadnje narudžbe. Obnovi zalihe i iskoristi
      dodatni popust na sljedeću kupovinu.
    </p>
    <div style="border:2px dashed #0145F2;padding:16px;text-align:center;margin-bottom:24px">
      <p style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#6b7280;margin:0 0 6px">Tvoj kupon</p>
      <p style="font-size:24px;font-weight:800;letter-spacing:.1em;margin:0;color:#0145F2">${coupon}</p>
    </div>
    <a href="${siteUrl}" style="display:block;background:#0145F2;color:#fff;text-decoration:none;text-align:center;padding:16px;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase">
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

export default async () => {
  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM) {
    console.error('reminder-emails: nedostaje RESEND_API_KEY ili RESEND_FROM — preskačem.')
    return new Response('not configured', { status: 501 })
  }

  const coupon  = process.env.REMINDER_COUPON || 'POPUST5'
  const siteUrl = process.env.SITE_URL || 'https://proteinhouse.ba'
  const cutoff  = new Date(Date.now() - DAYS * 24 * 60 * 60 * 1000).toISOString()

  const supabase = serviceClient()
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, customer_name, customer_email')
    .is('reminder_sent_at', null)
    .lte('created_at', cutoff)
    .neq('status', 'otkazana')
    .not('customer_email', 'is', null)
    .limit(200)

  if (error) {
    console.error('reminder-emails: greška pri čitanju narudžbi', error)
    return new Response(error.message, { status: 500 })
  }

  // Jedan podsjetnik po kupcu po ciklusu — kupac s više narudžbi ne dobija spam.
  const seen = new Set()
  let sent = 0, failed = 0

  for (const order of orders ?? []) {
    const email = order.customer_email?.trim().toLowerCase()
    if (!email) continue

    if (!seen.has(email)) {
      try {
        await sendEmail({
          to: email,
          subject: 'Jesu li ti zalihe pri kraju? Evo 5% popusta',
          html: emailHtml({ name: order.customer_name, coupon, siteUrl }),
        })
        seen.add(email)
        sent++
      } catch (err) {
        console.error(`reminder-emails: slanje na ${email} nije uspjelo —`, err.message)
        failed++
        continue  // ostavi reminder_sent_at prazan da se pokuša sutra
      }
    }
    await supabase.from('orders').update({ reminder_sent_at: new Date().toISOString() }).eq('id', order.id)
  }

  console.log(`reminder-emails: obrađeno ${orders?.length ?? 0}, poslano ${sent}, neuspjelo ${failed}`)
  return new Response(JSON.stringify({ processed: orders?.length ?? 0, sent, failed }), {
    headers: { 'Content-Type': 'application/json' },
  })
}

export const config = { schedule: '@daily' }
