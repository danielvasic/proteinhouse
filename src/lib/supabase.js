import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

// Detect SSR (Node.js) vs browser
const isServer = typeof window === 'undefined'

// Node.js 20 has no native WebSocket — Supabase Realtime crashes at init time.
// On the server we don't use Realtime subscriptions, so we pass a no-op stub
// as the transport to satisfy the constructor check without opening a socket.
class _NoopWebSocket {
  static CONNECTING = 0; static OPEN = 1; static CLOSING = 2; static CLOSED = 3
  constructor() { this.readyState = 3 }
  close() {}  send() {}
  addEventListener() {}  removeEventListener() {}
}

// Supabase client — works with Supabase Cloud or self-hosted.
// Set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY in Netlify → Site config → Env vars.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: !isServer,
    persistSession:   !isServer,
    detectSessionInUrl: !isServer,
  },
  // On server: provide stub transport so Realtime doesn't throw
  ...(isServer && { realtime: { transport: _NoopWebSocket } }),
})

// ------------------------------------------------
// Product helpers (replace catalog.js once live)
// ------------------------------------------------

export async function fetchProducts({ category, limit = 50 } = {}) {
  let query = supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (category && category !== 'sve') {
    if (category === 'akcija') {
      query = query.not('old_price', 'is', null)
    } else {
      query = query.eq('category', category)
    }
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function fetchProductBySlug(slug) {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) throw error
  return data
}

export async function fetchCategories() {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })

  if (error) throw error
  return data
}
