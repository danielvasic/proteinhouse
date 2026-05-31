/**
 * useCategories — fetches categories from Supabase.
 * Falls back to static catalog if table is empty.
 */
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { categories as staticCategories } from '../data/catalog'

export function useCategories() {
  const [categories, setCategories] = useState(staticCategories)
  const [loading,    setLoading]    = useState(true)

  useEffect(() => {
    supabase
      .from('categories')
      .select('slug, label, subs, accent, sort_order')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data?.length > 0) {
          setCategories(data.map((c) => ({
            slug:  c.slug,
            label: c.label,
            subs:  Array.isArray(c.subs) ? c.subs : [],
            accent: Boolean(c.accent),
          })))
        }
        setLoading(false)
      })
  }, [])

  return { categories, loading }
}
