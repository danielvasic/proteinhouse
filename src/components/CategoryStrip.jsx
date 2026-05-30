import { useNavigate } from 'react-router-dom'

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
    <section className="py-8 md:py-10 bg-gray-50">
      <div className="container">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {BANNERS.map((b) => (
            <div
              key={b.tag}
              className="relative flex flex-col justify-end min-h-[220px] md:min-h-[260px] rounded-xl overflow-hidden cursor-pointer group bg-cover bg-center"
              style={{
                backgroundImage: `linear-gradient(180deg, rgba(15,41,82,0.35) 0%, rgba(15,41,82,0.82) 100%), url('${b.img}')`,
              }}
              onClick={() => navigate(`/kategorija/${b.slug}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/kategorija/${b.slug}`)}
            >
              <span className="absolute top-4 left-4 px-2.5 py-1 bg-[#2563EB] text-white text-[10px] font-bold tracking-[0.12em] uppercase rounded">
                {b.tag}
              </span>
              <div className="p-5">
                <h3
                  className="text-2xl font-bold text-white leading-tight mb-1"
                  style={{ fontFamily: 'Oswald, Impact, system-ui, sans-serif' }}
                >
                  {b.title}
                </h3>
                <p className="text-white/70 text-xs mb-3">{b.sub}</p>
                <button className="px-4 py-2 bg-white/15 hover:bg-white/25 border border-white/30 text-white text-[11px] font-bold tracking-[0.1em] uppercase rounded transition-colors duration-150">
                  POGLEDAJ
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
