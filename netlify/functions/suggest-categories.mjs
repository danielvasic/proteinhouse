/**
 * AI prijedlog kategorija — samo admin (Admin → Proizvodi → uredi →
 * "Dodatne kategorije" → AI predloži). Vraća slugove iz poslane liste.
 */
import { verifyAdmin } from '../../src/server/supabaseAdmin.js'
import { suggestCategoriesAI } from '../../src/server/bedrock.js'

export default async (req) => {
  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

  if (req.method !== 'POST') return json({ error: 'Koristi POST.' }, 405)
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!(await verifyAdmin(token))) return json({ error: 'Samo za administratore.' }, 401)

  try {
    const slugs = await suggestCategoriesAI(await req.json())
    return json({ slugs })
  } catch (err) {
    console.error('suggest-categories:', err)
    const status = err.code === 'BAD_INPUT' ? 400 : err.code === 'NOT_CONFIGURED' ? 501 : 500
    return json({ error: err.message }, status)
  }
}
