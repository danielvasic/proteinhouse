import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { House, CaretRight } from '@phosphor-icons/react'
import CategorySidebar from '../components/CategorySidebar'
import ProductCard from '../components/ProductCard'
import { getCategoryBySlug, getProductsByCategory } from '../data/catalog'

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Najnovije' },
  { value: 'price_asc',  label: 'Cijena: rastuće' },
  { value: 'price_desc', label: 'Cijena: opadajuće' },
  { value: 'popular',    label: 'Popularnost' },
]

function sortProducts(products, sort) {
  const arr = [...products]
  switch (sort) {
    case 'price_asc':  return arr.sort((a, b) => a.price - b.price)
    case 'price_desc': return arr.sort((a, b) => b.price - a.price)
    case 'popular':    return arr.sort((a, b) => (b.reviews || 0) - (a.reviews || 0))
    default:           return arr
  }
}

export default function Category() {
  const { slug } = useParams()
  const [sort, setSort] = useState('newest')
  const [maxPrice, setMaxPrice] = useState(300)

  const category    = getCategoryBySlug(slug)
  const allProducts = getProductsByCategory(slug)
  const filtered    = allProducts.filter((p) => p.price <= maxPrice)
  const sorted      = sortProducts(filtered, sort)

  const pageTitle = category?.label || slug?.toUpperCase() || 'KATEGORIJA'
  const metaDesc  = `Kupujte ${pageTitle.toLowerCase()} online na ProteinHouse. ${filtered.length} proizvoda u ponudi.`

  return (
    <>
      <Helmet>
        <title>{pageTitle} — ProteinHouse</title>
        <meta name="description" content={metaDesc} />
        <link rel="canonical" href={`https://proteinhouse.ba/kategorija/${slug}`} />
      </Helmet>

      <main style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}>

        {/* ── Page header ── */}
        <section className="border-b border-gray-200 bg-white">
          <div className="container py-8 md:py-10">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-[11px] text-gray-400 mb-5" aria-label="Breadcrumb">
              <Link to="/" className="flex items-center gap-1 hover:text-[#0F2952] transition-colors">
                <House size={12} weight="fill" /> Početna
              </Link>
              <CaretRight size={11} className="opacity-40" />
              <span className="text-[#0F2952] font-semibold">{pageTitle}</span>
            </nav>

            <h1
              className="text-3xl md:text-4xl font-bold text-[#0F2952] uppercase"
              style={{ fontFamily: 'Oswald, Impact, system-ui, sans-serif' }}
            >
              {pageTitle}
            </h1>
            <p className="text-[12px] text-gray-400 mt-1">{filtered.length} {filtered.length === 1 ? 'proizvod' : 'proizvoda'}</p>
          </div>
        </section>

        {/* ── Content ── */}
        <section className="py-10 bg-gray-50">
          <div className="container">
            <div className="flex gap-8 items-start">

              {/* Sidebar */}
              <div className="hidden md:block w-[220px] shrink-0">
                <CategorySidebar activeSlug={slug} onPriceFilter={setMaxPrice} />
              </div>

              {/* Main */}
              <div className="flex-1 min-w-0">

                {/* Sort bar */}
                <div className="flex items-center justify-between mb-5 py-3 border-b border-gray-200">
                  <span className="text-[12px] text-gray-500">
                    Prikazano <strong className="text-[#0F2952]">{sorted.length}</strong> od {allProducts.length} proizvoda
                  </span>
                  <select
                    className="border border-gray-300 px-3 py-2 text-[12px] text-[#0F2952] focus:outline-none focus:border-[#0F2952] bg-white cursor-pointer"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    aria-label="Sortiranje"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>Sortiraj: {o.label}</option>
                    ))}
                  </select>
                </div>

                {/* Grid */}
                {sorted.length > 0 ? (
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-px bg-gray-200">
                    {sorted.map((p) => (
                      <div key={p.id} className="bg-white">
                        <ProductCard product={p} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <p className="text-[14px] text-gray-400">Nema proizvoda koji odgovaraju filterima.</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        </section>

      </main>
    </>
  )
}
