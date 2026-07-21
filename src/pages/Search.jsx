import { useSearchParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { MagnifyingGlass, House, CaretRight } from '@phosphor-icons/react'
import ProductCard from '../components/ProductCard'
import { useSearchProducts } from '../hooks/useProducts'

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const q       = searchParams.get('q') || ''
  const results = useSearchProducts(q)

  const handleSubmit = (e) => {
    e.preventDefault()
    const val = e.target.elements.q.value.trim()
    if (val) setSearchParams({ q: val })
  }

  return (
    <>
      <Helmet>
        <title>{q ? `"${q}" — Pretraga` : 'Pretraga'} — ProteinHouse</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <main style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}>

        {/* ── Header ── */}
        <section className="border-b border-gray-200 bg-white">
          <div className="container py-10 md:py-12">
            <nav className="flex items-center gap-2 text-[11px] text-gray-400 mb-6" aria-label="Breadcrumb">
              <Link to="/" className="flex items-center gap-1 hover:text-[#0F2952] transition-colors">
                <House size={12} weight="fill" /> Početna
              </Link>
              <CaretRight size={11} className="opacity-40" />
              <span className="text-[#0F2952] font-semibold">Pretraga</span>
            </nav>

            <h1
              className="text-3xl md:text-4xl font-bold text-[#0F2952] uppercase mb-6"
              style={{ fontFamily: 'Oswald, Impact, system-ui, sans-serif' }}
            >
              Pretraga
            </h1>

            {/* Search bar */}
            <form onSubmit={handleSubmit} className="max-w-[600px]">
              <div className="flex border border-gray-300 focus-within:border-[#0F2952] transition-colors duration-150">
                <div className="flex items-center pl-4">
                  <MagnifyingGlass size={18} className="text-gray-400" />
                </div>
                <input
                  name="q"
                  defaultValue={q}
                  key={q}
                  className="flex-1 px-4 py-3.5 text-[14px] text-[#0F2952] placeholder:text-gray-400 focus:outline-none bg-transparent"
                  placeholder="Pretraži proizvode, brendove…"
                  aria-label="Pretraga"
                  autoFocus
                />
                <button
                  type="submit"
                  className="px-6 py-3.5 bg-[#0F2952] text-white text-[11px] font-bold tracking-[0.1em] uppercase hover:bg-[#0A1F42] transition-colors duration-150 cursor-pointer border-0 shrink-0"
                >
                  Pretraži
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* ── Results ── */}
        <section className="py-10 bg-gray-50 min-h-[400px]">
          <div className="container">

            {q && (
              <p className="text-[12px] text-gray-500 mb-6">
                {results.length > 0
                  ? <><strong className="text-[#0F2952]">{results.length}</strong> {results.length === 1 ? 'rezultat' : 'rezultata'} za „{q}"</>
                  : <>Nema rezultata za „{q}"</>}
              </p>
            )}

            {results.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
                {results.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : q ? (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                <MagnifyingGlass size={48} color="#D1D5DB" weight="thin" />
                <div>
                  <p className="text-[15px] font-bold text-[#0F2952] mb-1" style={{ fontFamily: 'Oswald, Impact, system-ui, sans-serif' }}>
                    Nema rezultata
                  </p>
                  <p className="text-[13px] text-gray-400">Pokušajte s drugačijim pojmom ili pretražite naše kategorije.</p>
                </div>
                <Link
                  to="/"
                  className="mt-2 px-6 py-3 border border-[#0F2952] text-[#0F2952] text-[11px] font-bold tracking-[0.1em] uppercase hover:bg-[#0F2952] hover:text-white transition-all duration-150"
                >
                  ← Nazad na početnu
                </Link>
              </div>
            ) : (
              <div className="flex items-center justify-center py-16">
                <p className="text-[13px] text-gray-400">Unesite pojam za pretragu iznad.</p>
              </div>
            )}

          </div>
        </section>

      </main>
    </>
  )
}
