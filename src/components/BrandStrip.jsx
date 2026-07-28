import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function BrandStrip() {
  const [brands,  setBrands]  = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('brands')
      .select('id, name, logo_url')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (!error && data) setBrands(data)
        setLoading(false)
      })
  }, [])

  // Sakrij sekciju dok nema brendova u bazi
  if (loading || brands.length === 0) return null

  return (
    <section className="py-12 bg-white border-b border-gray-200">
      <div className="container">
        <div className="flex items-center gap-4 mb-7">
          <div className="h-px flex-1 bg-gray-200" />
          <p
            className="text-[10px] font-bold tracking-[0.22em] uppercase text-gray-400"
            style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
          >
            Naši brendovi
          </p>
          <div className="h-px flex-1 bg-gray-200" />
        </div>
        {/* Fiksna visina kutije + object-contain = svi logotipi vizuelno ujednačeni,
            bez obzira na omjer fajla; responsive broj kolona umjesto stisnutih 8 */}
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-x-6 gap-y-9 items-center">
          {brands.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-center h-12 md:h-14 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-200"
              title={b.name}
            >
              {b.logo_url ? (
                <img
                  src={b.logo_url}
                  alt={b.name}
                  className="h-full w-full max-w-[150px] object-contain"
                  loading="lazy"
                />
              ) : (
                <span className="text-[12px] font-bold text-gray-400 uppercase tracking-wider">{b.name}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
