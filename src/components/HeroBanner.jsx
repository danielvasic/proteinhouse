import { useEffect, useRef, useState } from 'react'
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

const SLIDE_MS  = 6500
const MAX_SLIDES = 3

export default function HeroBanner() {
  const navigate = useNavigate()
  const [banners, setBanners] = useState(null) // null = loading
  const [index,   setIndex]   = useState(0)
  const timer = useRef(null)

  useEffect(() => {
    // Lazy import to keep SSR clean
    import('../lib/supabase').then(({ supabase }) => {
      supabase
        .from('hero_banners')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(MAX_SLIDES)
        .then(({ data }) => setBanners(data?.length ? data : [FALLBACK]))
        .catch(() => setBanners([FALLBACK]))
    })
  }, [])

  const slides = banners || [FALLBACK]
  const count  = slides.length

  useEffect(() => {
    if (count < 2) return undefined
    timer.current = setInterval(() => setIndex((i) => (i + 1) % count), SLIDE_MS)
    return () => clearInterval(timer.current)
  }, [count])

  const goTo = (i) => {
    clearInterval(timer.current)
    setIndex(i)
  }

  const b = slides[index % count]
  const titleLines = (b.title_lines || FALLBACK.title_lines).split('/')

  return (
    <section
      className="relative flex items-center bg-cover bg-center bg-no-repeat overflow-hidden min-h-[46vh] max-h-[50vh] md:max-h-none md:min-h-[440px] lg:min-h-[520px] transition-[background-image] duration-300"
      style={{
        backgroundImage: b.image_url
          ? `linear-gradient(105deg, rgba(10,31,66,0.95) 0%, rgba(10,31,66,0.70) 52%, rgba(10,31,66,0.18) 100%), url('${b.image_url}')`
          : 'linear-gradient(135deg, #0A1F42 0%, #0F2952 60%, #1F4399 100%)',
      }}
    >
      <div className="container w-full">
        <div key={index} className="max-w-[620px] py-8 md:py-16" style={{ animation: 'heroFade 400ms ease' }}>

          {/* Eyebrow */}
          {b.eyebrow && (
            <div className="hidden md:flex items-center gap-3 mb-7">
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
            className="text-[34px] md:text-6xl lg:text-[64px] font-bold text-white uppercase leading-[0.95] tracking-[-0.02em] mb-4 md:mb-7"
            style={{ fontFamily: 'Oswald, Impact, system-ui, sans-serif' }}
          >
            {titleLines.map((line, i) => (
              <span key={i}>{line}{i < titleLines.length - 1 && <br />}</span>
            ))}
          </h1>

          {/* Body */}
          {b.subtitle && (
            <p
              className="text-[13px] md:text-[15px] text-white/65 leading-relaxed mb-5 md:mb-8 max-w-[440px]"
              style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}
            >
              {b.subtitle}
            </p>
          )}

          {/* CTAs */}
          <div className="flex flex-wrap gap-3">
            {b.cta_primary_text && (
              <button
                className="flex items-center gap-2.5 px-6 md:px-8 py-3 md:py-3.5 bg-white text-[#0F2952] text-[11px] md:text-[12px] font-bold tracking-[0.1em] uppercase hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
                style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}
                onClick={() => navigate(b.cta_primary_link || '/kategorija/akcija')}
              >
                <Tag size={15} weight="fill" /> {b.cta_primary_text}
              </button>
            )}
            {b.cta_secondary_text && (
              <button
                className="flex items-center gap-2 px-6 md:px-8 py-3 md:py-3.5 border border-white/35 text-white text-[11px] md:text-[12px] font-bold tracking-[0.1em] uppercase hover:border-white/70 hover:bg-white/10 transition-all duration-150 cursor-pointer"
                style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}
                onClick={() => navigate(b.cta_secondary_link || '/kategorija/proteini')}
              >
                {b.cta_secondary_text} <ArrowRight size={14} weight="bold" />
              </button>
            )}
          </div>

          {/* Stats — samo desktop, mobilni banner mora biti kratak */}
          <div className="hidden md:flex gap-8 mt-10 pt-8 border-t border-white/12">
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

      {/* Slide dots */}
      {count > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`h-1.5 border-0 cursor-pointer transition-all duration-200 ${i === index ? 'w-7 bg-white' : 'w-1.5 bg-white/40 hover:bg-white/70'}`}
              onClick={() => goTo(i)}
              aria-label={`Slajd ${i + 1}`}
            />
          ))}
        </div>
      )}

      <style>{`@keyframes heroFade { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }`}</style>
    </section>
  )
}
