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
import { posaljiKonverzije } from '../../src/server/konverzijeMetla.js'

export default async () => {
  try {
    const r = await runErpSync({ triggerSource: 'schedule', createLimit: 200 })
    try {
      r.orders = await pushPendingOrders({ limit: 20 })
    } catch (err) {
      r.orders = { error: String(err.message || err) }
    }
    // Server-side konverzije idu POSLIJE guranja narudžbi: narudžba koja je
    // upravo dobila erp_order_id treba biti u ERP-u prije nego joj tražimo
    // status. ERP nema webhook, pa je ovo jedini način da saznamo da je Vico
    // narudžbu odobrio.
    try {
      r.konverzije = await posaljiKonverzije()
    } catch (err) {
      r.konverzije = { error: String(err.message || err) }
    }
    console.log('erp-sync-background:', JSON.stringify(r))
    return new Response(JSON.stringify(r), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('erp-sync-background:', err)
    return new Response(String(err.message || err), { status: 500 })
  }
}
