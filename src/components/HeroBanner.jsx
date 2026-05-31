import { useNavigate } from 'react-router-dom'
import { Tag, ArrowRight } from '@phosphor-icons/react'
import { useSiteContent } from '../hooks/useSiteContent'

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1920&q=85&auto=format&fit=crop'

const CONTENT_KEYS = [
  'hero_eyebrow', 'hero_title', 'hero_subtitle',
  'hero_cta_primary', 'hero_cta_primary_link', 'hero_cta_secondary', 'hero_image_url',
]

const DEFAULTS = {
  hero_eyebrow:       'Black Friday 2026',
  hero_title:         'Snaga u/svakoj/mjerici',
  hero_subtitle:      'Do −70% na izabrane proteinske formule. Besplatna dostava na sve narudžbe preko 100 KM.',
  hero_cta_primary:   'Pogledaj akcije',
  hero_cta_primary_link: '/kategorija/akcija',
  hero_cta_secondary: 'Svi proteini',
  hero_image_url:     DEFAULT_IMAGE,
}

const STATS = [
  { value: '500+', label: 'Proizvoda' },
  { value: '50+',  label: 'Brendova' },
  { value: '10k+', label: 'Kupaca' },
]

export default function HeroBanner() {
  const navigate = useNavigate()
  const { data } = useSiteContent(CONTENT_KEYS, DEFAULTS)

  // Title supports "/" as line break separator
  const titleLines = (data.hero_title || DEFAULTS.hero_title).split('/')

  return (
    <section
      className="relative min-h-[600px] lg:min-h-[680px] flex items-center bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(105deg, rgba(10,31,66,0.95) 0%, rgba(10,31,66,0.70) 52%, rgba(10,31,66,0.18) 100%), url('${data.hero_image_url || DEFAULT_IMAGE}')`,
      }}
    >
      <div className="container w-full">
        <div className="max-w-[620px] py-20 md:py-24">

          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-7">
            <div className="h-px w-10 bg-white/35" />
            <span
              className="text-[11px] font-bold tracking-[0.22em] uppercase text-white/55"
              style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}
            >
              {data.hero_eyebrow}
            </span>
          </div>

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
          <p
            className="text-[15px] text-white/65 leading-relaxed mb-8 max-w-[440px]"
            style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}
            dangerouslySetInnerHTML={{ __html: (data.hero_subtitle || DEFAULTS.hero_subtitle).replace('−70%', '<strong class="text-white font-extrabold">−70%</strong>') }}
          />

          {/* CTAs */}
          <div className="flex flex-wrap gap-3">
            <button
              className="flex items-center gap-2.5 px-8 py-3.5 bg-white text-[#0F2952] text-[12px] font-bold tracking-[0.1em] uppercase hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
              style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}
              onClick={() => navigate(data.hero_cta_primary_link || '/kategorija/akcija')}
            >
              <Tag size={15} weight="fill" /> {data.hero_cta_primary}
            </button>
            <button
              className="flex items-center gap-2 px-8 py-3.5 border border-white/35 text-white text-[12px] font-bold tracking-[0.1em] uppercase hover:border-white/70 hover:bg-white/8 transition-all duration-150 cursor-pointer"
              style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}
              onClick={() => navigate('/kategorija/proteini')}
            >
              {data.hero_cta_secondary} <ArrowRight size={14} weight="bold" />
            </button>
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
