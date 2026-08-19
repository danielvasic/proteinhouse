/**
 * Prebacivanje ERP slika u naš storage — svakih 15 minuta po 40 slika,
 * dok red ne presuši (onda je no-op). Vidi runImageSync za detalje.
 * Env: SUPABASE_SERVICE_ROLE_KEY.
 */
import { runImageSync } from '../../src/server/erpSync.js'

export default async () => {
  try {
    const r = await runImageSync({ limit: 40 })
    if (r.uploaded || r.failed) console.log('erp-images:', JSON.stringify(r))
    return new Response(JSON.stringify(r), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('erp-images:', err)
    return new Response(String(err.message || err), { status: 500 })
  }
}

export const config = { schedule: '*/15 * * * *' }
