import { useNavigate } from 'react-router-dom'
import { Tag, ArrowRight } from '@phosphor-icons/react'

const HERO_IMAGE = 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1920&q=85&auto=format&fit=crop'

const STATS = [
  { value: '500+', label: 'Proizvoda' },
  { value: '50+',  label: 'Brendova' },
  { value: '10k+', label: 'Kupaca' },
]

export default function HeroBanner() {
  const navigate = useNavigate()

  return (
    <section
      className="relative min-h-[600px] lg:min-h-[680px] flex items-center bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(105deg, rgba(10,31,66,0.95) 0%, rgba(10,31,66,0.70) 52%, rgba(10,31,66,0.18) 100%), url('${HERO_IMAGE}')`,
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
              Black Friday 2026
            </span>
          </div>

          {/* Headline */}
          <h1
            className="text-5xl md:text-6xl lg:text-[72px] font-bold text-white uppercase leading-[0.95] tracking-[-0.02em] mb-7"
            style={{ fontFamily: 'Oswald, Impact, system-ui, sans-serif' }}
          >
            Snaga u<br />svakoj<br />mjerici
          </h1>

          {/* Body */}
          <p
            className="text-[15px] text-white/65 leading-relaxed mb-8 max-w-[440px]"
            style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}
          >
            Do <strong className="text-white font-extrabold">−70%</strong> na izabrane
            proteinske formule. Besplatna dostava na sve narudžbe preko 100 KM.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-3">
            <button
              className="flex items-center gap-2.5 px-8 py-3.5 bg-white text-[#0F2952] text-[12px] font-bold tracking-[0.1em] uppercase hover:bg-gray-100 transition-colors duration-150 cursor-pointer"
              style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}
              onClick={() => navigate('/kategorija/akcija')}
            >
              <Tag size={15} weight="fill" /> Pogledaj akcije
            </button>
            <button
              className="flex items-center gap-2 px-8 py-3.5 border border-white/35 text-white text-[12px] font-bold tracking-[0.1em] uppercase hover:border-white/70 hover:bg-white/8 transition-all duration-150 cursor-pointer"
              style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}
              onClick={() => navigate('/kategorija/proteini')}
            >
              Svi proteini <ArrowRight size={14} weight="bold" />
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
