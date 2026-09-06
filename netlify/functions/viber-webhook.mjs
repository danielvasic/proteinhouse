/**
 * Webhook za BulkGate — isti URL prima izvjestaje o dostavi i ODGOVORE kupaca.
 *
 *   POST /api/viber-webhook?token=<BULKGATE_WEBHOOK_TOKEN>
 *
 * BulkGate ne potpisuje zahtjeve, pa je token u URL-u jedina zastita; upisuje
 * se u BulkGate Portal → Modules & APIs → Webhook, zajedno s ovim URL-om.
 *
 * Sta radimo: odgovor STOP/ODJAVA (status "10" = incoming) gasi Viber privolu
 * na SVIM narudzbama tog broja (viber_opt_out_at) — Viber trazi da odjava
 * vrijedi odmah i trajno. Izvjestaje o dostavi samo brojimo u log.
 *
 * Env: BULKGATE_WEBHOOK_TOKEN, SUPABASE_SERVICE_ROLE_KEY.
 */
import { serviceClient } from '../../src/server/supabaseAdmin.js'
import { normalizujBrojBiH } from '../../src/server/viber.js'

const ODJAVA = /^\s*(stop|odjava|odjavi|odjavite|unsubscribe)\b/i

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  const token = new URL(req.url).searchParams.get('token')
  if (!process.env.BULKGATE_WEBHOOK_TOKEN || token !== process.env.BULKGATE_WEBHOOK_TOKEN) {
    return new Response('Forbidden', { status: 403 })
  }

  let payload
  try { payload = await req.json() } catch { return new Response('Bad JSON', { status: 400 }) }
  const stavke = Array.isArray(payload) ? payload : [payload]

  try {
    const odjave = stavke.filter((s) => String(s?.status) === '10' && ODJAVA.test(String(s?.message ?? '')))
    let odjavljeno = 0
    if (odjave.length) {
      const brojevi = new Set(odjave.map((s) => normalizujBrojBiH(s.from)).filter(Boolean))
      const supabase = serviceClient()
      // Telefon u narudzbi je slobodan tekst, pa se poklapanje radi ovdje,
      // normalizovano — privola je rijetka pa je skup malen.
      const { data, error } = await supabase
        .from('orders').select('id, customer_phone')
        .not('viber_consent_at', 'is', null).is('viber_opt_out_at', null)
      if (error) throw error
      const ids = (data ?? []).filter((o) => brojevi.has(normalizujBrojBiH(o.customer_phone))).map((o) => o.id)
      if (ids.length) {
        const { error: e2 } = await supabase.from('orders')
          .update({ viber_opt_out_at: new Date().toISOString() }).in('id', ids)
        if (e2) throw e2
        odjavljeno = ids.length
      }
    }
    const nedostavljeno = stavke.filter((s) => String(s?.status) === '3').length
    console.log('viber-webhook:', JSON.stringify({ primljeno: stavke.length, odjava: odjave.length, narudzbi_odjavljeno: odjavljeno, nedostavljeno }))
    return new Response(JSON.stringify({ ok: true, odjavljeno }), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('viber-webhook:', err)
    return new Response(String(err.message || err), { status: 500 })
  }
}
