import { Link } from 'react-router-dom'
import { ArrowRight } from '@phosphor-icons/react'
import ProductCard from './ProductCard'

/**
 * Sekcija proizvoda u gridu: 2 pokraj 2 na mobilnom (2+2), max 4 proizvoda.
 */
export default function ProductGrid({ title, eyebrow, products, categorySlug, max = 4 }) {
  const items = products.slice(0, max)
  if (items.length === 0) return null

  return (
    <section className="py-10 md:py-14 bg-gray-50" style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}>
      <div className="container">
        <div className="flex items-end justify-between gap-4 mb-6 md:mb-8">
          <div>
            {eyebrow && (
              <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-gray-400 mb-1.5 m-0">{eyebrow}</p>
            )}
            <h2
              className="text-2xl md:text-3xl font-bold text-[#0F2952] uppercase m-0"
              style={{ fontFamily: 'Oswald, Impact, system-ui, sans-serif' }}
            >
              {title}
            </h2>
          </div>
          {categorySlug && (
            <Link
              to={`/kategorija/${categorySlug}`}
              className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold tracking-[0.1em] uppercase text-[#0F2952] hover:opacity-70 transition-opacity whitespace-nowrap"
            >
              Pogledaj sve <ArrowRight size={12} weight="bold" />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 md:gap-5">
          {items.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>

        {categorySlug && (
          <Link
            to={`/kategorija/${categorySlug}`}
            className="sm:hidden flex items-center justify-center gap-1.5 mt-4 py-3 border border-[#0F2952] text-[11px] font-bold tracking-[0.1em] uppercase text-[#0F2952]"
          >
            Pogledaj sve <ArrowRight size={12} weight="bold" />
          </Link>
        )}
      </div>
    </section>
  )
}
