import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tag, ArrowRight } from '@phosphor-icons/react'

const FALLBACK = {
  eyebrow:            'ProteinHouse',
  title_lines:        'Proteini i/suplementi/za pobjednike',
  subtitle:           'Originalni proizvodi. Brza dostava. Bodovi lojalnosti.',
  cta_primary_text:   'Pogledaj ponudu',
  cta_primary_link:   '/kategorija/proteini',
  cta_secondary_text: '',
  cta_secondary_link: '',
  image_url:          '',   // Bez slike dok admin ne uploaduje
}

const STATS = [
  { value: '500+', label: 'Proizvoda' },
  { value: '50+',  label: 'Brendova' },
  { value: '10k+', label: 'Kupaca' },
]

export default function HeroBanner() {
  const navigate = useNavigate()
  const [banner, setBanner] = useState(null) // null = loading, object = resolved

  useEffect(() => {
    // Lazy import to keep SSR clean
    import('../lib/supabase').then(({ supabase }) => {
      supabase
        .from('hero_banners')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(1)
        .maybeSingle()
        .then(({ data }) => {
          setBanner(data || FALLBACK)
        })
        .catch(() => setBanner(FALLBACK))
    })
  }, [])

  const b = banner || FALLBACK
  const titleLines = (b.title_lines || FALLBACK.title_lines).split('/')

  return (
    <section
      className="relative min-h-[600px] lg:min-h-[680px] flex items-center bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{
        backgroundImage: b.image_url
          ? `linear-gradient(105deg, rgba(10,31,66,0.95) 0%, rgba(10,31,66,0.70) 52%, rgba(10,31,66,0.18) 100%), url('${b.image_url}')`
          : 'linear-gradient(135deg, #0A1F42 0%, #0F2952 60%, #1F4399 100%)',
      }}
    >
      <div className="container w-full">
        <div className="max-w-[620px] py-20 md:py-24">

          {/* Eyebrow */}
          {b.eyebrow && (
            <div className="flex items-center gap-3 mb-7">
              <div className="h-px w-10 bg-white/35" />
              <span
                className="text-[11px] font-bold tracking-[0.22em] uppercase text-white/55"
                style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}
              >
                {b.eyebrow}
              </span>
            </div>
          )}

          {/* Headline */}
          <h1
            className="text-5xl md:text-6xl lg:text-[72px] font-bold text-white uppercase leading-[0.95] tracking-[-0.02em] mb-7"
            style={{ fontFamily: 'Oswald, Impact, system-ui, sans-serif' }}
          >
            {titleLines.map((line, i) => (
              <span key={i}>{line}{i < titleLines.length - 1 && <br />}</span>
            ))}
          </h1>

          {/* Body */}
          {b.subtitle && (
            <p
              className="text-[15px] text-white/65 leading-relaxed mb-8 max-w-[440px]"
              style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}
            >
              {b.subtitle}
            </p>
          )}

          {/* CTAs */}
          <div className="flex flex-wrap gap-3">
            {b.cta_primary_text && (
              <button
                className="flex items-center gap-2.5 px-8 py-3.5 bg-white text-[#0F2952] text-[12px] font-bold tracking-[0.1em] uppercase hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
                style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}
                onClick={() => navigate(b.cta_primary_link || '/kategorija/akcija')}
              >
                <Tag size={15} weight="fill" /> {b.cta_primary_text}
              </button>
            )}
            {b.cta_secondary_text && (
              <button
                className="flex items-center gap-2 px-8 py-3.5 border border-white/35 text-white text-[12px] font-bold tracking-[0.1em] uppercase hover:border-white/70 hover:bg-white/10 transition-all duration-150 cursor-pointer"
                style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}
                onClick={() => navigate(b.cta_secondary_link || '/kategorija/proteini')}
              >
                {b.cta_secondary_text} <ArrowRight size={14} weight="bold" />
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-8 mt-10 pt-8 border-t border-white/12">
            {STATS.map(({ value, label }) => (
              <div key={label}>
                <p
                  className="text-[26px] font-bold text-white leading-none"
                  style={{ fontFamily: 'Oswald, Impact, system-ui, sans-serif' }}
                >
                  {value}
                </p>
                <p
                  className="text-[10px] font-bold tracking-[0.14em] uppercase text-white/45 mt-1"
                  style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}
                >
                  {label}
                </p>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  )
}
