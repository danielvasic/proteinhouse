import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MagnifyingGlass, X, ArrowRight } from '@phosphor-icons/react'
import { useAllProducts, rankBestsellers, hasAnyStock } from '../hooks/useProducts'
import { useCategories } from '../hooks/useCategories'
import { fmtKM } from '../data/catalog'

const FONT = 'Montserrat, Inter, system-ui, sans-serif'

function useIsMobile() {
  const [mobile, setMobile] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const update = () => setMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])
  return mobile
}

/** Prijedlozi: bez kucanja popularni proizvodi + top kategorije,
 *  s kucanjem pogođeni proizvodi + kategorije pogodaka s brojem. */
function useSuggestions(query) {
  const { products: all } = useAllProducts()
  const { categories }    = useCategories()
  const q     = query.trim().toLowerCase()
  const typed = q.length >= 2

  // Prijedlozi nude samo ono što ima na stanju
  const products = useMemo(() => all.filter(hasAnyStock), [all])

  const matches = useMemo(() => {
    if (!typed) return []
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q))
    )
  }, [products, q, typed])

  const rows = useMemo(
    () => (typed ? matches.slice(0, 5) : rankBestsellers(products, 6)),
    [typed, matches, products]
  )

  // Chips (Bulk stil): kucanje → kategorije pogodaka (max 2); bez kucanja → top 3 kategorije
  const chips = useMemo(() => {
    const pool = typed ? matches : products
    if (pool.length === 0) return []
    const counts = {}
    pool.forEach((p) => { counts[p.cat] = (counts[p.cat] || 0) + 1 })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, typed ? 2 : 3)
      .map(([slug, count]) => ({
        slug,
        count,
        label: (categories.find((c) => c.slug === slug)?.label || slug).toLowerCase(),
      }))
  }, [typed, matches, products, categories])

  return { typed, matches, rows, chips }
}

function ProductRow({ p, onGo }) {
  const subtitle = [p.flavors?.[0], p.sizes?.[0]].filter(Boolean).join(' ') || p.brand
  return (
    <button
      type="button"
      className="flex items-center gap-3.5 w-full px-4 py-3 bg-transparent border-0 cursor-pointer text-left hover:bg-gray-50 transition-colors"
      onClick={() => onGo(`/proizvod/${p.slug}`)}
    >
      <div className="w-14 h-14 bg-white border border-gray-200 rounded-lg shrink-0 overflow-hidden flex items-center justify-center">
        {p.img && <img src={p.img} alt="" className="w-full h-full object-contain p-1" loading="lazy" width={56} height={56} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold text-gray-900 m-0 truncate leading-snug">{p.title}</p>
        <p className="text-[12px] text-gray-500 m-0 mt-0.5 truncate">{subtitle}</p>
        <p className="m-0 mt-1 flex items-baseline gap-2">
          {p.old && <span className="text-[12px] text-gray-400 line-through">{fmtKM(p.old)}</span>}
          <span className={`text-[14px] font-bold ${p.old ? 'text-[#E02020]' : 'text-[#0F2952]'}`}>{fmtKM(p.price)}</span>
        </p>
      </div>
    </button>
  )
}

function Chips({ chips, onGo }) {
  if (chips.length === 0) return null
  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-gray-100">
      {chips.map((c) => (
        <button
          key={c.slug}
          type="button"
          className="px-3.5 py-2 bg-gray-100 rounded-full border-0 text-[13px] text-gray-800 cursor-pointer hover:bg-gray-200 transition-colors"
          onClick={() => onGo(`/kategorija/${c.slug}`)}
        >
          {c.label} <span className="text-gray-500 italic">({c.count})</span>
        </button>
      ))}
    </div>
  )
}

function SuggestionList({ typed, matches, rows, chips, query, onGo }) {
  return (
    <>
      <Chips chips={chips} onGo={onGo} />

      <div className="flex-1 min-h-0 overflow-y-auto">
        {typed && rows.length === 0 && (
          <p className="px-4 py-5 m-0 text-[13px] text-gray-400">Nema rezultata za „{query.trim()}“.</p>
        )}
        {rows.map((p) => <ProductRow key={p.id} p={p} onGo={onGo} />)}
      </div>

      {typed && matches.length > 0 && (
        <button
          type="button"
          className="flex items-center justify-center gap-1.5 w-full px-4 py-3.5 bg-gray-50 border-0 border-t border-gray-200 text-[11px] font-bold tracking-[0.1em] uppercase text-[#0F2952] cursor-pointer hover:bg-gray-100 transition-colors"
          onClick={() => onGo(`/pretraga?q=${encodeURIComponent(query.trim())}`)}
        >
          Svi rezultati ({matches.length}) <ArrowRight size={12} weight="bold" />
        </button>
      )}
    </>
  )
}

/**
 * Search s trenutnim prijedlozima (Bulk stil).
 * Mobilni: fullscreen overlay — input gore, tagovi, proizvodi, X na dnu.
 * Desktop: dropdown ispod input polja.
 */
export default function SearchBox({ onNavigate }) {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [query, setQuery] = useState('')
  const [open,  setOpen]  = useState(false)
  const rootRef  = useRef(null)
  const inputRef = useRef(null)

  const { typed, matches, rows, chips } = useSuggestions(query)

  // Desktop: zatvori na klik izvan
  useEffect(() => {
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  // Mobilni overlay: zaključaj scroll + autofocus
  useEffect(() => {
    if (!(isMobile && open)) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const t = setTimeout(() => inputRef.current?.focus(), 60)
    return () => { document.body.style.overflow = prev; clearTimeout(t) }
  }, [isMobile, open])

  const close = () => { setOpen(false); setQuery('') }

  const go = (to) => {
    close()
    onNavigate?.()
    navigate(to)
  }

  const submit = (e) => {
    e.preventDefault()
    if (query.trim()) go(`/pretraga?q=${encodeURIComponent(query.trim())}`)
  }

  const hasContent = rows.length > 0 || chips.length > 0 || typed

  /* ── Mobilni: trigger + fullscreen overlay ── */
  if (isMobile) {
    return (
      <div style={{ fontFamily: FONT }} className="flex-1">
        <button
          type="button"
          className="flex items-center gap-2 w-full h-10 px-3.5 bg-gray-50 border border-gray-200 text-left cursor-pointer"
          onClick={() => setOpen(true)}
          aria-label="Otvori pretragu"
        >
          <MagnifyingGlass size={15} className="text-gray-400 shrink-0" />
          <span className="text-sm text-gray-400">Pretraži proizvode, brendove…</span>
        </button>

        {open && (
          <div className="fixed inset-0 z-[100] bg-black/60 flex flex-col p-3 pt-4" style={{ fontFamily: FONT }}>
            <div className="bg-white rounded-2xl flex flex-col min-h-0 max-h-[82vh] overflow-hidden shadow-2xl">
              <form className="flex items-center gap-2.5 px-4 py-3.5 border-b border-gray-100" onSubmit={submit}>
                <MagnifyingGlass size={18} className="text-gray-500 shrink-0" />
                <input
                  ref={inputRef}
                  className="bg-transparent flex-1 outline-none border-0 text-[16px] text-gray-900 placeholder:text-gray-400 min-w-0"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Pretraži…"
                  aria-label="Pretraga"
                />
                {query && (
                  <button type="button" className="bg-transparent border-0 p-1 text-gray-400 cursor-pointer" onClick={() => setQuery('')} aria-label="Obriši">
                    <X size={15} weight="bold" />
                  </button>
                )}
              </form>

              <SuggestionList typed={typed} matches={matches} rows={rows} chips={chips} query={query} onGo={go} />
            </div>

            <button
              type="button"
              className="mx-auto mt-5 w-14 h-14 rounded-full bg-white border-0 flex items-center justify-center shadow-xl cursor-pointer shrink-0"
              onClick={close}
              aria-label="Zatvori pretragu"
            >
              <X size={22} weight="bold" className="text-gray-900" />
            </button>
          </div>
        )}
      </div>
    )
  }

  /* ── Desktop: input + dropdown ── */
  return (
    <div ref={rootRef} className="relative flex-1 max-w-[460px]" style={{ fontFamily: FONT }}>
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
        />
      </form>

      {open && hasContent && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-[0_16px_32px_-12px_rgba(10,31,66,0.25)] z-[60] flex flex-col max-h-[70vh] overflow-hidden">
          <SuggestionList typed={typed} matches={matches} rows={rows} chips={chips} query={query} onGo={go} />
        </div>
      )}
    </div>
  )
}
