import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

// Supabase client — works with Supabase Cloud (cloud.supabase.com) or self-hosted EC2.
// Set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY in Netlify → Site config → Env vars.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
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
