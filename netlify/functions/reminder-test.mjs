/**
 * Ručno pokretanje podsjetnika — samo za admina, radi testiranja.
 *
 * Postoji jer se Netlify scheduled funkcija (reminder-emails) u produkciji ne
 * može pozvati preko HTTP-a, pa bi jedini način provjere bio čekati 25 dana.
 *
 *   POST /api/reminder-test
 *   Authorization: Bearer <admin JWT>
 *   { "days": 0, "dryRun": true, "onlyEmail": "ja@primjer.com" }
 *
 *   days      — koliko stara narudžba mora biti (0 = sve narudžbe)
 *   dryRun    — samo nabroji kome bi otišlo, bez slanja i bez upisa
 *   onlyEmail — pošalji samo na jednu adresu (test na sebi)
 */
import { verifyAdmin } from '../../src/server/supabaseAdmin.js'
import { runReminders } from '../../src/server/reminders.js'

export default async (req) => {
  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

  if (req.method !== 'POST') return json({ error: 'Koristi POST.' }, 405)

  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!(await verifyAdmin(token))) return json({ error: 'Samo za administratore.' }, 401)

  let body = {}
  try { body = await req.json() } catch { /* prazno tijelo je uredu */ }

  try {
    const result = await runReminders({
      days:      Number.isFinite(body.days) ? Math.max(0, body.days) : undefined,
      dryRun:    body.dryRun === true,
      onlyEmail: body.onlyEmail || null,
    })
    return json(result)
  } catch (err) {
    console.error('reminder-test:', err)
    return json({ error: err.message }, err.code === 'NOT_CONFIGURED' ? 501 : 500)
  }
}
