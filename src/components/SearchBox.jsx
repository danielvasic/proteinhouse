import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MagnifyingGlass, TrendUp, Tag, ArrowRight } from '@phosphor-icons/react'
import { useAllProducts, rankBestsellers } from '../hooks/useProducts'
import { useCategories } from '../hooks/useCategories'
import { fmtKM } from '../data/catalog'

const FONT = 'Montserrat, Inter, system-ui, sans-serif'

/**
 * Search s trenutnim prijedlozima (Bulk/Ostrovit stil):
 *  - klik na polje bez kucanja → popularni (bestseller) proizvodi
 *  - kucanje → max 3 proizvoda + do 2 kategorije s ukupnim brojem pogodaka
 */
export default function SearchBox({ autoFocus = false, onNavigate }) {
  const navigate = useNavigate()
  const { products }   = useAllProducts()
  const { categories } = useCategories()
  const [query, setQuery] = useState('')
  const [open,  setOpen]  = useState(false)
  const rootRef = useRef(null)

  useEffect(() => {
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const q = query.trim().toLowerCase()

  const popular = useMemo(() => rankBestsellers(products, 5), [products])

  const matches = useMemo(() => {
    if (q.length < 2) return []
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    )
  }, [products, q])

  // Kategorije pogođenih proizvoda, s brojem — max 2 (Bulk stil)
  const catSuggestions = useMemo(() => {
    if (q.length < 2 || matches.length === 0) return []
    const counts = {}
    matches.forEach((p) => { counts[p.cat] = (counts[p.cat] || 0) + 1 })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([slug, count]) => ({
        slug,
        count,
        label: categories.find((c) => c.slug === slug)?.label || slug,
      }))
  }, [matches, categories, q])

  const go = (to) => {
    setOpen(false)
    onNavigate?.()
    navigate(to)
  }

  const submit = (e) => {
    e.preventDefault()
    if (query.trim()) go(`/pretraga?q=${encodeURIComponent(query.trim())}`)
  }

  const showTyped   = q.length >= 2
  const typedTop3   = matches.slice(0, 3)
  const showPopular = !showTyped && popular.length > 0

  const ProductRow = ({ p }) => (
    <button
      type="button"
      className="flex items-center gap-3 w-full px-3.5 py-2.5 bg-transparent border-0 cursor-pointer text-left hover:bg-gray-50 transition-colors"
      onClick={() => go(`/proizvod/${p.slug}`)}
    >
      <div className="w-10 h-10 bg-white border border-gray-100 shrink-0 overflow-hidden flex items-center justify-center">
        {p.img && <img src={p.img} alt="" className="w-full h-full object-contain" loading="lazy" width={40} height={40} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-gray-400 m-0">{p.brand}</p>
        <p className="text-[12px] font-semibold text-[#0F2952] m-0 truncate">{p.title}</p>
      </div>
      <span className="text-[12px] font-bold text-[#0F2952] shrink-0">{fmtKM(p.price)}</span>
    </button>
  )

  return (
    <div ref={rootRef} className="relative flex-1 max-w-full sm:max-w-[460px]" style={{ fontFamily: FONT }}>
      <form
        className="flex items-center gap-2 h-10 px-3.5 bg-gray-50 border border-gray-200 focus-within:border-[#0F2952] focus-within:bg-white transition-all duration-150"
        onSubmit={submit}
      >
        <MagnifyingGlass size={15} className="text-gray-400 shrink-0" />
        <input
          className="bg-transparent flex-1 outline-none text-sm text-gray-900 placeholder:text-gray-400 min-w-0"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="Pretraži proizvode, brendove…"
          aria-label="Pretraga"
          autoFocus={autoFocus}
        />
      </form>

      {open && (showPopular || showTyped) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 shadow-[0_16px_32px_-12px_rgba(10,31,66,0.25)] z-[60] max-h-[70vh] overflow-y-auto">

          {showPopular && (
            <>
              <p className="flex items-center gap-1.5 px-3.5 pt-3 pb-1.5 m-0 text-[10px] font-bold tracking-[0.16em] uppercase text-gray-400">
                <TrendUp size={12} /> Najtraženije
              </p>
              {popular.map((p) => <ProductRow key={p.id} p={p} />)}
            </>
          )}

          {showTyped && typedTop3.length === 0 && (
            <p className="px-3.5 py-4 m-0 text-[12px] text-gray-400">Nema rezultata za „{query.trim()}“.</p>
          )}

          {showTyped && typedTop3.length > 0 && (
            <>
              {typedTop3.map((p) => <ProductRow key={p.id} p={p} />)}

              {catSuggestions.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 px-3.5 py-2.5 border-t border-gray-100">
                  {catSuggestions.map((c) => (
                    <button
                      key={c.slug}
                      type="button"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 border border-gray-200 text-[10px] font-bold tracking-[0.08em] uppercase text-[#0F2952] hover:bg-[#0F2952] hover:text-white hover:border-[#0F2952] transition-all cursor-pointer"
                      onClick={() => go(`/kategorija/${c.slug}`)}
                    >
                      <Tag size={11} /> {c.label} <span className="opacity-60">({c.count})</span>
                    </button>
                  ))}
                </div>
              )}

              <button
                type="button"
                className="flex items-center justify-center gap-1.5 w-full px-3.5 py-3 bg-gray-50 border-0 border-t border-gray-200 text-[11px] font-bold tracking-[0.1em] uppercase text-[#0F2952] cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => go(`/pretraga?q=${encodeURIComponent(query.trim())}`)}
              >
                Svi rezultati ({matches.length}) <ArrowRight size={12} weight="bold" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
