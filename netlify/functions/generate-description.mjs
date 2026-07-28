// AI generator opisa proizvoda (Netlify Function) — poziva Bedrock (src/server/bedrock.js).
// Zastićeno: samo prijavljeni admin (provjera preko Supabase JWT-a iz Authorization headera).
import { createClient } from '@supabase/supabase-js'
import { generateProductCopy } from '../../src/server/bedrock.js'

const SUPABASE_URL      = process.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

async function requireAdmin(authHeader) {
  const token = authHeader?.replace(/^Bearer\s+/i, '')
  if (!token) return null
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) return null
  return data.user.user_metadata?.role === 'admin' ? data.user : null
}

export const handler = async (event) => {
  const headers = { 'Content-Type': 'application/json' }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  const admin = await requireAdmin(event.headers?.authorization || event.headers?.Authorization)
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
