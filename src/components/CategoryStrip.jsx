import { useNavigate } from 'react-router-dom'
import { ArrowRight } from '@phosphor-icons/react'

const BANNERS = [
  {
    tag: 'NOVO',
    title: 'NAJNOVIJE',
    sub: 'Tek pristigli proizvodi',
    img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=900&q=80&auto=format&fit=crop',
    slug: 'proteini',
  },
  {
    tag: 'OUTLET',
    title: 'DO −70%',
    sub: 'Posljednje količine',
    img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=900&q=80&auto=format&fit=crop',
    slug: 'akcija',
  },
  {
    tag: 'AKCIJA',
    title: 'BLACK FRIDAY',
    sub: 'Cijela sedmica popusta',
    img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&q=80&auto=format&fit=crop',
    slug: 'akcija',
  },
]

export default function CategoryStrip() {
  const navigate = useNavigate()

  return (
    <section className="py-10 bg-white border-b border-gray-200">
      <div className="container">

        {/* Section label */}
        <div className="flex items-center gap-4 mb-6">
          <div className="h-px flex-1 bg-gray-200" />
          <span
            className="text-[10px] font-bold tracking-[0.22em] uppercase text-gray-400"
            style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}
          >
            Istraži kolekcije
          </span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {BANNERS.map((b) => (
            <div
              key={b.tag}
              className="relative flex flex-col justify-end min-h-[260px] md:min-h-[300px] overflow-hidden cursor-pointer group bg-cover bg-center"
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(10,31,66,0.20) 0%, rgba(10,31,66,0.88) 100%), url('${b.img}')`,
              }}
              onClick={() => navigate(`/kategorija/${b.slug}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/kategorija/${b.slug}`)}
            >
              {/* Tag */}
              <span
                className="absolute top-4 left-4 px-2.5 py-1 border border-white/50 text-white text-[10px] font-bold tracking-[0.14em] uppercase"
                style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}
              >
                {b.tag}
              </span>

              {/* Content */}
              <div className="p-5 pb-5 transition-transform duration-300 group-hover:-translate-y-1">
                <h3
                  className="text-2xl md:text-3xl font-bold text-white leading-tight mb-1 uppercase"
                  style={{ fontFamily: 'Oswald, Impact, system-ui, sans-serif' }}
                >
                  {b.title}
                </h3>
                <p className="text-white/60 text-[12px] mb-4">{b.sub}</p>
                <div className="flex items-center gap-2 text-white text-[11px] font-bold tracking-[0.12em] uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  POGLEDAJ <ArrowRight size={12} weight="bold" />
                </div>
              </div>

              {/* Bottom line */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
