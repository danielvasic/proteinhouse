/**
 * Server-side provjera admin naloga (Supabase JWT) — koristi je i Netlify
 * funkcija (generate-description.mjs) i lokalni Express dev server (server.js).
 *
 * Node.js 20 (Netlify Lambda runtime) nema nativni WebSocket, a Supabase
 * klijent pri konstrukciji pokušava podići Realtime konekciju i puca
 * ("Node.js 20 detected without native WebSocket support") — isti problem
 * je vec rijesen za SSR u src/lib/supabase.js. Ovdje nam Realtime uopce ne
 * treba (samo auth.getUser), pa no-op transport potpuno izbjegava taj kod.
 */
import { createClient } from '@supabase/supabase-js'

class NoopWebSocket {
  static CONNECTING = 0; static OPEN = 1; static CLOSING = 2; static CLOSED = 3
  constructor() { this.readyState = 3 }
  close() {}  send() {}
  addEventListener() {}  removeEventListener() {}
}

/**
 * Klijent sa service_role ključem — zaobilazi RLS. Koristi ga SAMO pozadinski
 * posao bez prijavljenog korisnika (npr. scheduled funkcija za podsjetnike).
 * Ključ nikad ne smije doći do frontenda.
 */
export function serviceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) {
    throw Object.assign(new Error('Nedostaje SUPABASE_SERVICE_ROLE_KEY.'), { code: 'NOT_CONFIGURED' })
  }
  return createClient(process.env.VITE_SUPABASE_URL, key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    realtime: { transport: NoopWebSocket },
  })
}

/** Vraća korisnika ako je JWT valjan i ima role='admin' u metapodacima, inače null. */
export async function verifyAdmin(token) {
  if (!token) return null
  const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
    realtime: { transport: NoopWebSocket },
  })
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data?.user) return null
  return data.user.user_metadata?.role === 'admin' ? data.user : null
}
