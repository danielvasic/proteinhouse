import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from '@phosphor-icons/react'
import { supabase } from '../lib/supabase'
import { BODY, DISPLAY } from '../lib/typography'

export default function CategoryStrip() {
  const navigate = useNavigate()
  const [banners,  setBanners]  = useState([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    supabase
      .from('banners')
      .select('id, title, subtitle, cta_text, cta_link, image_url, tag')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(3)
      .then(({ data, error }) => {
        if (!error && data) setBanners(data)
        setLoading(false)
      })
  }, [])

  // Hide section entirely if no banners in DB
  if (loading || banners.length === 0) return null

  return (
    <section className="py-12 bg-white border-b border-gray-200">
      <div className="container">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-px flex-1 bg-gray-200" />
          <span
            className="text-[10px] font-bold tracking-[0.22em] text-gray-400"
            style={BODY}
          >
            Istraži kolekcije
          </span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {banners.map((b) => (
            <div
              key={b.id}
              className="relative flex flex-col justify-end min-h-[260px] md:min-h-[300px] overflow-hidden cursor-pointer group bg-cover bg-center"
              style={{
                backgroundImage: b.image_url
                  ? `linear-gradient(180deg, rgba(10,14,23,0.20) 0%, rgba(10,14,23,0.88) 100%), url('${b.image_url}')`
                  : 'linear-gradient(180deg, #1a2f5a 0%, #1e272e 100%)',
              }}
              onClick={() => b.cta_link && navigate(b.cta_link)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && b.cta_link && navigate(b.cta_link)}
            >
              {b.tag && (
                <span
                  className="absolute top-4 left-4 px-2.5 py-1 border border-white/50 text-white text-[10px] font-bold tracking-[0.14em]"
                  style={BODY}
                >
                  {b.tag}
                </span>
              )}

              <div className="p-5 transition-transform duration-300 group-hover:-translate-y-1">
                <h3
                  className="text-2xl md:text-3xl font-bold text-white leading-tight mb-1"
                  style={DISPLAY}
                >
                  {b.title}
                </h3>
                {b.subtitle && (
                  <p className="text-white/60 text-[12px] mb-4">{b.subtitle}</p>
                )}
                {b.cta_text && (
                  <div className="flex items-center gap-2 text-white text-[11px] font-bold tracking-[0.12em] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {b.cta_text} <ArrowRight size={12} weight="bold" />
                  </div>
                )}
              </div>

              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
