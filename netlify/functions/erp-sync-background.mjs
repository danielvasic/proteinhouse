/**
 * Stvarni ERP sync posao — background funkcija (sufiks -background daje
 * 15 minuta umjesto 30 sekundi koje imaju scheduled funkcije).
 *
 * Prelazak na novi WebShopRobMat API je posao učinio većim od tog limita:
 * ogledalo je naraslo na ~2600 artikala, dodan je dohvat stanja skladišta
 * (6 stranica) i backfill nacrta za nove šifre — pa je scheduled funkcija
 * umirala na pola posla bez zapisanog kraja (erp_sync_runs s ok=null).
 * Raspored je ostao u erp-sync.mjs, koji samo okine ovu funkciju.
 *
 * Env: SUPABASE_SERVICE_ROLE_KEY, ERP_API_BASE (opcionalno).
 */
import { runErpSync } from '../../src/server/erpSync.js'
import { pushPendingOrders } from '../../src/server/erpOrders.js'

export default async () => {
  try {
    const r = await runErpSync({ triggerSource: 'schedule', createLimit: 200 })
    try {
      r.orders = await pushPendingOrders({ limit: 20 })
    } catch (err) {
      r.orders = { error: String(err.message || err) }
    }
    console.log('erp-sync-background:', JSON.stringify(r))
    return new Response(JSON.stringify(r), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('erp-sync-background:', err)
    return new Response(String(err.message || err), { status: 500 })
  }
}
