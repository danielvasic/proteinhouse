import { useNavigate } from 'react-router-dom'
import { Lightning, Tag } from '@phosphor-icons/react'

const HERO_IMAGE = 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1920&q=85&auto=format&fit=crop'

export default function HeroBanner() {
  const navigate = useNavigate()

  return (
    <section
      className="relative min-h-[480px] md:min-h-[560px] flex items-center bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `linear-gradient(90deg, rgba(11,35,88,0.84) 0%, rgba(11,35,88,0.50) 55%, rgba(11,35,88,0.08) 100%), url('${HERO_IMAGE}')`,
      }}
    >
      <div className="container w-full">
        <div className="max-w-[560px] py-16 md:py-20">
          <p className="flex items-center gap-2 text-[#60A5FA] text-xs font-bold tracking-[0.14em] uppercase mb-4" style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}>
            <Lightning size={16} weight="fill" /> BLACK FRIDAY 2026
          </p>
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-[1.05] tracking-[-0.02em] mb-5 uppercase"
            style={{ fontFamily: 'Oswald, Impact, system-ui, sans-serif' }}
          >
            SNAGA U SVAKOJ MJERICI
          </h1>
          <p className="text-base md:text-lg text-white/85 leading-relaxed mb-8" style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}>
            Do{' '}
            <strong className="text-[#60A5FA] font-extrabold text-xl">−70%</strong>{' '}
            na izabrane proteinske formule. Besplatna dostava na sve narudžbe preko 100 KM.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              className="flex items-center gap-2 px-7 py-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-sm font-bold tracking-[0.08em] uppercase rounded transition-colors duration-150 cursor-pointer"
              style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}
              onClick={() => navigate('/kategorija/akcija')}
            >
              <Tag size={18} weight="fill" /> Pogledaj akcije
            </button>
            <button
              className="flex items-center gap-2 px-7 py-3.5 bg-transparent border-2 border-white/60 hover:border-white text-white text-sm font-bold tracking-[0.08em] uppercase rounded transition-colors duration-150 cursor-pointer"
              style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}
              onClick={() => navigate('/kategorija/proteini')}
            >
              Svi proteini
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
