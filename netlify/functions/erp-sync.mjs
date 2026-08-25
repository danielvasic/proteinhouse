/**
 * Sinhronizacija s ERP-om — svaki sat.
 *
 * Povlači sve artikle iz proteinhouse-api.work u erp_articles (sirovo ogledalo)
 * i osvježava cijene u katalogu. Novi artikli ulaze kao neaktivni nacrti.
 *
 * Logika je u src/server/erpSync.js; ovdje je samo raspored.
 * Za ručnu provjeru koristi /api/erp-sync-test (admin) — Netlify scheduled
 * funkcije se u produkciji ne mogu pozvati preko HTTP-a.
 *
 * Env: SUPABASE_SERVICE_ROLE_KEY (piše mimo RLS-a).
 */
import { runErpSync } from '../../src/server/erpSync.js'
import { pushPendingOrders } from '../../src/server/erpOrders.js'

export default async () => {
  try {
    // Prvi backfill je ~800 novih grupa; raspoređuje se kroz nekoliko prolaza
    // da funkcija ne padne na timeoutu. U ustaljenom radu ostaje blizu nule.
    const r = await runErpSync({ triggerSource: 'schedule', createLimit: 200 })
    // Metla za narudžbe koje checkout nije uspio odmah poslati (mreža, ERP
    // nedostupan) — pad metle ne smije oboriti sync koji je već prošao.
    try {
      r.orders = await pushPendingOrders({ limit: 20 })
    } catch (err) {
      r.orders = { error: String(err.message || err) }
    }
    console.log('erp-sync:', JSON.stringify(r))
    return new Response(JSON.stringify(r), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('erp-sync:', err)
    return new Response(String(err.message || err), { status: err.code === 'NOT_CONFIGURED' ? 501 : 500 })
  }
}

export const config = { schedule: '@hourly' }
