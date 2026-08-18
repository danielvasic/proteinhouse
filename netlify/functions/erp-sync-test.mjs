/**
 * Ručno pokretanje ERP sinhronizacije — samo za admina.
 *
 * Postoji jer se Netlify scheduled funkcija (erp-sync) u produkciji ne može
 * pozvati preko HTTP-a, pa bi se inače na provjeru čekao puni sat.
 *
 *   POST /api/erp-sync-test
 *   Authorization: Bearer <admin JWT>
 *   { "dryRun": true, "createLimit": 50 }
 *
 *   dryRun      — samo prebroji šta bi se promijenilo, bez pisanja
 *   createLimit — koliko novih nacrta smije nastati u ovom prolazu
 */
import { verifyAdmin } from '../../src/server/supabaseAdmin.js'
import { runErpSync } from '../../src/server/erpSync.js'

export default async (req) => {
  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

  if (req.method !== 'POST') return json({ error: 'Koristi POST.' }, 405)

  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!(await verifyAdmin(token))) return json({ error: 'Samo za administratore.' }, 401)

  let body = {}
  try { body = await req.json() } catch { /* prazno tijelo je uredu */ }

  try {
    const result = await runErpSync({
      triggerSource: 'manual',
      dryRun: body.dryRun === true,
      createLimit: Number.isFinite(body.createLimit) ? Math.max(0, body.createLimit) : 200,
    })
    return json(result)
  } catch (err) {
    console.error('erp-sync-test:', err)
    return json({ error: String(err.message || err) }, err.code === 'NOT_CONFIGURED' ? 501 : 500)
  }
}
