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
import { serviceClient } from '../../src/server/supabaseAdmin.js'

export default async (req) => {
  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })
  try {
    const { order_number: orderNumber } = await req.json()
    if (!orderNumber || typeof orderNumber !== 'string') {
      return new Response('order_number nedostaje', { status: 400 })
    }
    // IP i user-agent za kasnije server-side slanje konverzija (Meta CAPI ih
    // traži za spajanje događaja). Preglednik ih ne zna pouzdano — IP uopće,
    // a UA se da lažirati — pa se čitaju ovdje, iz samog zahtjeva. Dopunjuje
    // se samo ako narudžba već ima atribuciju: bez privole je nema, pa se
    // onda ništa i ne bilježi.
    await dopuniAtribuciju(req, orderNumber).catch((e) =>
      console.warn('erp-order: atribucija nije dopunjena:', e.message))

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

async function dopuniAtribuciju(req, orderNumber) {
  const ip = req.headers.get('x-nf-client-connection-ip')
    || (req.headers.get('x-forwarded-for') || '').split(',')[0].trim()
  const ua = req.headers.get('user-agent')
  if (!ip && !ua) return

  const supabase = serviceClient()
  const { data } = await supabase
    .from('orders').select('id, atribucija').eq('order_number', orderNumber).single()
  if (!data?.atribucija) return   // nema privole → nema atribucije → ne diramo

  await supabase.from('orders')
    .update({ atribucija: { ...data.atribucija, ...(ip && { ip }), ...(ua && { ua }) } })
    .eq('id', data.id)
}
