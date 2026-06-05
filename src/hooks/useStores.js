import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export function useStores() {
  const [stores,  setStores]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('stores')
      .select('id, city, address, phone, email, working_hours, map_url')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setStores(data)
        setLoading(false)
      })
  }, [])

  return { stores, loading }
}
