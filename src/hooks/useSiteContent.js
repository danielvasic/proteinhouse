/**
 * useSiteContent — fetches keys from the site_content table.
 * Returns a { data, loading } object.
 * Falls back to `defaults` if Supabase is unavailable or key is missing.
 */
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useSiteContent(keys, defaults = {}) {
  const [data, setData] = useState(defaults)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const { data: rows, error } = await supabase
          .from('site_content')
          .select('key, value')
          .in('key', keys)

        if (!cancelled && !error && rows?.length) {
          const map = { ...defaults }
          rows.forEach((r) => {
            if (r.value?.text !== undefined) map[r.key] = r.value.text
            else if (r.value?.ids !== undefined) map[r.key] = r.value.ids
            else map[r.key] = r.value
          })
          setData(map)
        }
      } catch {
        // Network error — keep defaults
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys.join(',')])

  return { data, loading }
}
