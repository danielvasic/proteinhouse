import { useEffect, useRef, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  Star, Truck, ShieldCheck, Heart, Minus, Plus,
  ShoppingCart, House, CaretRight,
} from '@phosphor-icons/react'
import { useCart } from '../store/CartContext'
import { getCategoryBySlug, fmtKM } from '../data/catalog'
import { useProduct, getVariantStock } from '../hooks/useProducts'
import ReviewSection from '../components/ReviewSection'

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`Ocjena ${rating} od 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          weight={i < Math.floor(rating) ? 'fill' : 'regular'}
          color={i < Math.floor(rating) ? '#0F2952' : '#D1D5DB'}
        />
      ))}
    </div>
  )
}

function VariantSelector({ label, options, value, onChange }) {
  if (!options?.length) return null
  return (
    <div className="mb-6">
      <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-gray-400 mb-3">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            className={`px-3 py-2 text-[11px] font-bold tracking-[0.06em] border transition-all duration-150 cursor-pointer ${
              opt === value
                ? 'border-[#0F2952] bg-[#0F2952] text-white'
                : 'border-gray-300 text-gray-600 bg-transparent hover:border-[#0F2952] hover:text-[#0F2952]'
            }`}
            onClick={() => onChange(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Product() {
  const { slug } = useParams()
  const { addItem } = useCart()
  const { product, loading } = useProduct(slug)

  const [qty,    setQty]    = useState(1)
  const [flavor, setFlavor] = useState(null)
  const [size,   setSize]   = useState(null)

  // Floating "kupi" traka — prati te dok skrolaš (Ostrovit stil)
  const buyRef = useRef(null)
  const [floatBar, setFloatBar] = useState(false)
  useEffect(() => {
    if (!buyRef.current || typeof IntersectionObserver === 'undefined') return undefined
    const obs = new IntersectionObserver(
      ([entry]) => setFloatBar(!entry.isIntersecting && entry.boundingClientRect.top < 0),
      { threshold: 0 }
    )
    obs.observe(buyRef.current)
    return () => obs.disconnect()
  }, [product])

  // Set defaults when product loads
  if (product && flavor === null && product.flavors?.length) setFlavor(product.flavors[0])
  if (product && size   === null && product.sizes?.length)   setSize(product.sizes[0])

  // Compute current variant stock
  const currentStock = product ? getVariantStock(product, flavor, size) : 0
  const outOfStock   = currentStock === 0
  const lowStock     = currentStock > 0 && currentStock <= 5

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24" style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}>
        <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-[#0F2952] animate-spin" />
      </div>
    )
  }

  if (!product) {
    return (
      <div className="container py-24 text-center" style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}>
        <h1 className="text-2xl font-bold text-[#0F2952] mb-4" style={{ fontFamily: 'Oswald, Impact, system-ui, sans-serif' }}>
          Proizvod nije pronađen
        </h1>
        <Link to="/" className="text-[13px] text-gray-500 underline hover:text-[#0F2952]">← Nazad na početnu</Link>
      </div>
    )
  }

  const category   = getCategoryBySlug(product.cat)
  const isDiscount = product.badge?.startsWith('-')

  const handleAdd = () => {
    const item = { ...product, selectedFlavor: flavor, selectedSize: size }
    for (let i = 0; i < qty; i++) addItem(item)
  }

  return (
    <>
      <Helmet>
        <title>{product.brand} {product.title} — ProteinHouse</title>
        <meta name="description" content={`Kupite ${product.title} od ${product.brand} na ProteinHouse. ${product.description}`} />
        <link rel="canonical" href={`https://proteinhouse.ba/proizvod/${slug}`} />
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org/', '@type': 'Product',
          name: product.title, brand: { '@type': 'Brand', name: product.brand },
          description: product.description, image: product.img,
          offers: { '@type': 'Offer', price: product.price, priceCurrency: 'BAM', availability: 'https://schema.org/InStock' },
          ...(product.rating && { aggregateRating: { '@type': 'AggregateRating', ratingValue: product.rating, reviewCount: product.reviews } }),
        })}</script>
      </Helmet>

      <main style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}>

        {/* ── Breadcrumb ── */}
        <div className="border-b border-gray-200 bg-white">
          <div className="container py-6">
            <nav className="flex items-center gap-2 text-[11px] text-gray-400" aria-label="Breadcrumb">
              <Link to="/" className="flex items-center gap-1 hover:text-[#0F2952] transition-colors">
                <House size={12} weight="fill" /> Početna
              </Link>
              <CaretRight size={11} className="opacity-40" />
              <Link to={`/kategorija/${product.cat}`} className="hover:text-[#0F2952] transition-colors">
                {category?.label || product.cat}
              </Link>
              <CaretRight size={11} className="opacity-40" />
              <span className="text-[#0F2952] font-semibold truncate max-w-[200px]">{product.brand}</span>
            </nav>
          </div>
        </div>

        {/* ── Product layout ── */}
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-200">

              {/* Image */}
              <div className="relative bg-white flex items-center justify-center p-10 md:p-14">
                {isDiscount && (
                  <div className="absolute top-5 left-5 w-[52px] h-[52px] rounded-full bg-[#0F2952] flex items-center justify-center">
                    <span className="text-white text-[11px] font-extrabold text-center leading-tight">{product.badge}</span>
                  </div>
                )}
                {product.img ? (
                  <img
                    src={product.img}
                    alt={product.title}
                    className="w-full max-w-[400px] object-contain"
                    width={600}
                    height={540}
                  />
                ) : (
                  <div className="w-full max-w-[400px] aspect-square bg-gray-100 flex items-center justify-center text-gray-300 text-sm">
                    Nema slike
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="bg-white p-8 md:p-12 flex flex-col">

                <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-gray-400 mb-2">{product.brand}</p>
                <h1
                  className="text-2xl md:text-3xl font-bold text-[#0F2952] uppercase leading-tight mb-4"
                  style={{ fontFamily: 'Oswald, Impact, system-ui, sans-serif' }}
                >
                  {product.title}
                </h1>

                {product.rating && (
                  <div className="flex items-center gap-2.5 mb-5 pb-5 border-b border-gray-100">
                    <StarRating rating={product.rating} />
                    <span className="text-[12px] text-gray-400">({product.reviews} recenzija)</span>
                  </div>
                )}

                {/* Price */}
                <div className="flex items-baseline gap-3 mb-4">
                  <span className="text-3xl font-bold text-[#0F2952]" style={{ fontFamily: 'Oswald, Impact, system-ui, sans-serif' }}>
                    {fmtKM(product.price)}
                  </span>
                  {product.old && (
                    <span className="text-base text-gray-400 line-through font-normal">{fmtKM(product.old)}</span>
                  )}
                </div>

                {/* Stock */}
                <div className="flex items-center gap-2 mb-5 pb-5 border-b border-gray-100">
                  {outOfStock ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-red-500">Nema na stanju</span>
                    </>
                  ) : lowStock ? (
                    <>
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-amber-600">
                        Malo na stanju · još {currentStock} kom
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-gray-500">
                        Na stanju · Isporuka 1–3 dana
                      </span>
                    </>
                  )}
                </div>

                {/* Description */}
                <p className="text-[13px] text-gray-500 leading-relaxed mb-5">{product.description}</p>

                {/* Sizes selector */}
                <VariantSelector
                  label="Težina / Veličina"
                  options={product.sizes}
                  value={size}
                  onChange={setSize}
                />

                {/* Flavors selector */}
                <VariantSelector
                  label="Okus"
                  options={product.flavors}
                  value={flavor}
                  onChange={setFlavor}
                />

                {/* Qty + Add to cart */}
                <div className="flex gap-3 mb-6" ref={buyRef}>
                  <div className={`flex items-center border ${outOfStock ? 'border-gray-200 opacity-40' : 'border-gray-300'}`}>
                    <button
                      className="w-10 h-12 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-[#0F2952] transition-colors cursor-pointer bg-transparent border-0 disabled:cursor-not-allowed"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      disabled={outOfStock}
                      aria-label="Smanji količinu"
                    >
                      <Minus size={14} weight="bold" />
                    </button>
                    <span className="w-10 text-center text-[13px] font-bold text-[#0F2952]">{qty}</span>
                    <button
                      className="w-10 h-12 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-[#0F2952] transition-colors cursor-pointer bg-transparent border-0 disabled:cursor-not-allowed"
                      onClick={() => setQty((q) => Math.min(currentStock || 99, q + 1))}
                      disabled={outOfStock}
                      aria-label="Povećaj količinu"
                    >
                      <Plus size={14} weight="bold" />
                    </button>
                  </div>

                  <button
                    className={`flex-1 flex items-center justify-center gap-2.5 py-3 text-[11px] font-bold tracking-[0.1em] uppercase transition-colors duration-150 border-0 ${
                      outOfStock
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-[#0F2952] text-white hover:bg-[#0A1F42] cursor-pointer'
                    }`}
                    onClick={handleAdd}
                    disabled={outOfStock}
                  >
                    <ShoppingCart size={16} weight="fill" />
                    {outOfStock ? 'Nema na stanju' : 'Dodaj u korpu'}
                  </button>

                  <button
                    className="w-12 h-12 flex items-center justify-center border border-gray-300 text-gray-400 hover:border-[#0F2952] hover:text-[#0F2952] transition-all duration-150 cursor-pointer bg-transparent"
                    aria-label="Dodaj na wishlist"
                  >
                    <Heart size={18} />
                  </button>
                </div>

                {/* Trust badges */}
                <div className="grid grid-cols-2 gap-px bg-gray-200 mt-auto">
                  {[
                    { Icon: Truck,       title: 'Besplatna dostava', sub: 'Preko 100 KM' },
                    { Icon: ShieldCheck, title: 'Sigurna kupovina',  sub: 'SSL + originalni' },
                  ].map(({ Icon, title, sub }) => (
                    <div key={title} className="flex items-center gap-3 bg-gray-50 px-4 py-3">
                      <Icon size={18} weight="duotone" color="#0F2952" className="shrink-0 opacity-70" />
                      <div>
                        <p className="text-[11px] font-bold text-[#0F2952]">{title}</p>
                        <p className="text-[10px] text-gray-400">{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          </div>
        </section>

        {/* ── Detaljan opis — tabovi (Ostrovit stil) ── */}
        <DescriptionTabs product={product} />

        {/* ── Recenzije — samo verificirani kupci ── */}
        <ReviewSection product={product} />

        {/* ── Floating kupi traka ── */}
        <div
          className={`fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-8px_24px_-8px_rgba(10,31,66,0.18)] transition-transform duration-200 ${floatBar ? 'translate-y-0' : 'translate-y-full'}`}
          aria-hidden={!floatBar}
        >
          <div className="container flex items-center gap-3 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-[#0F2952] truncate m-0">{product.brand} · {product.title}</p>
              <p className="text-[15px] font-bold text-[#0F2952] m-0" style={{ fontFamily: 'Oswald, Impact, system-ui, sans-serif' }}>
                {fmtKM(product.price)}
                {product.old && <span className="text-[11px] text-gray-400 line-through font-normal ml-2" style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}>{fmtKM(product.old)}</span>}
              </p>
            </div>
            <button
              className={`shrink-0 flex items-center gap-2 px-6 py-3 text-[11px] font-bold tracking-[0.1em] uppercase border-0 ${
                outOfStock ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#0F2952] text-white hover:bg-[#0A1F42] cursor-pointer'
              }`}
              onClick={handleAdd}
              disabled={outOfStock}
            >
              <ShoppingCart size={15} weight="fill" />
              {outOfStock ? 'Nema na stanju' : 'Dodaj u korpu'}
            </button>
          </div>
        </div>

      </main>
    </>
  )
}

/** Tabovi: Opis / Način upotrebe / Sastav / Nutritivne vrijednosti */
function DescriptionTabs({ product }) {
  const tabs = [
    { key: 'opis',      label: 'Opis',                    content: product.description },
    { key: 'upotreba',  label: 'Način upotrebe',          content: product.usage },
    { key: 'sastav',    label: 'Sastav',                  content: product.composition },
    { key: 'nutritivne',label: 'Nutritivne vrijednosti',  content: product.nutrition },
  ].filter((t) => t.content)
  const [active, setActive] = useState(tabs[0]?.key)

  if (tabs.length === 0) return null
  const current = tabs.find((t) => t.key === active) || tabs[0]

  return (
    <section className="py-12 bg-white border-t border-gray-200" style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}>
      <div className="container max-w-[860px]">
        <div className="flex border-b border-gray-200 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`shrink-0 px-5 py-3 text-[11px] font-bold tracking-[0.1em] uppercase bg-transparent border-0 border-b-2 cursor-pointer transition-colors whitespace-nowrap ${
                t.key === current.key
                  ? 'border-[#0F2952] text-[#0F2952]'
                  : 'border-transparent text-gray-400 hover:text-[#0F2952]'
              }`}
              onClick={() => setActive(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="pt-6 text-[13px] text-gray-600 leading-relaxed whitespace-pre-line">
          {current.content}
        </div>
      </div>
    </section>
  )
}
