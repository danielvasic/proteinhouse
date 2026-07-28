// AI generator opisa proizvoda (Netlify Function) — poziva Bedrock (src/server/bedrock.js).
// Zastićeno: samo prijavljeni admin (provjera preko Supabase JWT-a iz Authorization headera).
import { verifyAdmin } from '../../src/server/supabaseAdmin.js'
import { generateProductCopy } from '../../src/server/bedrock.js'

export const handler = async (event) => {
  const headers = { 'Content-Type': 'application/json' }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const token = (event.headers?.authorization || event.headers?.Authorization)?.replace(/^Bearer\s+/i, '')
  const admin = await verifyAdmin(token)
  if (!admin) {
    return { statusCode: 401, headers, body: JSON.stringify({ error: 'Neautorizovano.' }) }
  }

  try {
    const input = JSON.parse(event.body || '{}')
    const result = await generateProductCopy(input)
    return { statusCode: 200, headers, body: JSON.stringify(result) }
  } catch (err) {
    const statusCode = err.code === 'BAD_INPUT' ? 400 : err.code === 'NOT_CONFIGURED' ? 501 : 500
    return { statusCode, headers, body: JSON.stringify({ error: err.message || 'Greška pri generisanju opisa.' }) }
  }
}
