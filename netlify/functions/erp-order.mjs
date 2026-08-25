/**
 * Push jedne narudžbe u ERP — poziva ga checkout odmah nakon upisa u Supabase.
 *
 * Namjerno bez autentifikacije: prima samo order_number postojeće narudžbe,
 * idempotentan je (već poslana se preskače), a ne vraća ništa osim ishoda —
 * zloupotreba se svodi na ponovni pokušaj slanja vlastite narudžbe. Ako prvi
 * poziv propadne (mreža, ERP nedostupan), satna metla uz erp-sync je pokupi.
 *
 * Env: SUPABASE_SERVICE_ROLE_KEY, ERP_API_BASE (opcionalno).
 */
import { pushOrderByNumber } from '../../src/server/erpOrders.js'

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })
  try {
    const { order_number: orderNumber } = await req.json()
    if (!orderNumber || typeof orderNumber !== 'string') {
      return new Response('order_number nedostaje', { status: 400 })
    }
    const r = await pushOrderByNumber(orderNumber)
    console.log('erp-order:', orderNumber, JSON.stringify(r))
    return new Response(JSON.stringify(r), {
      status: r.ok || r.skipped ? 200 : 502,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('erp-order:', err)
    return new Response(String(err.message || err), { status: 500 })
  }
}
