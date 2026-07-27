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
    <section className="py-12 bg-gray-50 border-b border-gray-200">
      <div className="container">
        <div className="flex items-center gap-4 mb-7">
          <div className="h-px flex-1 bg-gray-200" />
          <p
            className="text-[10px] font-bold tracking-[0.22em] uppercase text-gray-400"
            style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}
          >
            Naši brendovi
          </p>
          <div className="h-px flex-1 bg-gray-200" />
        </div>
        <div
          className="grid items-center gap-8"
          style={{ gridTemplateColumns: `repeat(${Math.min(brands.length, 8)}, 1fr)` }}
        >
          {brands.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-center opacity-40 hover:opacity-80 transition-opacity duration-200"
              title={b.name}
            >
              {b.logo_url ? (
                <img
                  src={b.logo_url}
                  alt={b.name}
                  className="max-h-10 w-auto object-contain grayscale"
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
