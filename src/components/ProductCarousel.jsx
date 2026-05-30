import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import ProductCard from './ProductCard'

const PER_PAGE = 4

export default function ProductCarousel({ title, eyebrow, products, categorySlug }) {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)

  const pages = useMemo(() => {
    const out = []
    for (let i = 0; i < products.length; i += PER_PAGE) {
      out.push(products.slice(i, i + PER_PAGE))
    }
    return out
  }, [products])

  const total = pages.length
  const go = (dir) => setPage((p) => (p + dir + total) % total)

  const arrowCls = 'w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-[#0F2952] hover:bg-[#0F2952] hover:text-white hover:border-[#0F2952] transition-all duration-150 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer'

  return (
    <section className="py-10 md:py-12" style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}>
      <div className="container">
        {/* Header */}
        <div className="flex items-end justify-between mb-6 gap-4">
          <div>
            {eyebrow && (
              <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-[#2563EB] mb-1">
                {eyebrow}
              </p>
            )}
            <h2
              className="text-2xl md:text-3xl font-bold text-[#0F2952] leading-tight"
              style={{ fontFamily: 'Oswald, Impact, system-ui, sans-serif' }}
            >
              {title}
            </h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button className={arrowCls} onClick={() => go(-1)} disabled={total <= 1} aria-label="Prethodno">
              <CaretLeft size={18} weight="bold" />
            </button>
            <button className={arrowCls} onClick={() => go(1)} disabled={total <= 1} aria-label="Sljedeće">
              <CaretRight size={18} weight="bold" />
            </button>
            {categorySlug && (
              <button
                className="hidden sm:flex items-center gap-1 px-4 py-2 border border-[#0F2952] text-[#0F2952] hover:bg-[#0F2952] hover:text-white text-[11px] font-bold tracking-[0.1em] uppercase rounded-lg transition-all duration-150 cursor-pointer"
                onClick={() => navigate(`/kategorija/${categorySlug}`)}
              >
                POGLEDAJ SVE →
              </button>
            )}
          </div>
        </div>

        {/* Carousel track */}
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
            style={{
              width: `${total * 100}%`,
              transform: `translateX(-${page * (100 / total)}%)`,
            }}
          >
            {pages.map((slice, i) => (
              <div
                key={i}
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
                style={{ width: `${100 / total}%` }}
              >
                {slice.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        {total > 1 && (
          <div className="flex justify-center gap-1.5 mt-6" role="tablist" aria-label="Stranice">
            {pages.map((_, i) => (
              <button
                key={i}
                className={`h-1.5 rounded-full transition-all duration-200 cursor-pointer border-0 ${i === page ? 'w-6 bg-[#2563EB]' : 'w-1.5 bg-gray-300 hover:bg-gray-400'}`}
                onClick={() => setPage(i)}
                aria-label={`Stranica ${i + 1}`}
                aria-selected={i === page}
                role="tab"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
