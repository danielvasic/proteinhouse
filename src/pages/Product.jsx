import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  Star, Truck, ShieldCheck, Heart, Minus, Plus,
  ShoppingBag, House, CaretRight,
} from '@phosphor-icons/react'
import { useCart } from '../store/CartContext'
import { getProductBySlug, getCategoryBySlug, fmtKM } from '../data/catalog'

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

export default function Product() {
  const { slug } = useParams()
  const { addItem } = useCart()

  const product = getProductBySlug(slug)
  const [qty, setQty]       = useState(1)
  const [flavor, setFlavor] = useState(product?.flavors?.[0] || '')

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

  const handleAdd = () => { for (let i = 0; i < qty; i++) addItem(product) }

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
          aggregateRating: { '@type': 'AggregateRating', ratingValue: product.rating, reviewCount: product.reviews },
        })}</script>
      </Helmet>

      <main style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}>

        {/* ── Breadcrumb ── */}
        <div className="border-b border-gray-200 bg-white">
          <div className="container py-4">
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
        <section className="py-10 md:py-14 bg-gray-50">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-gray-200">

              {/* Image panel */}
              <div className="relative bg-white flex items-center justify-center p-10 md:p-14">
                {isDiscount && (
                  <div className="absolute top-5 left-5 w-[52px] h-[52px] rounded-full bg-[#0F2952] flex items-center justify-center">
                    <span className="text-white text-[11px] font-extrabold text-center leading-tight">{product.badge}</span>
                  </div>
                )}
                <img
                  src={product.img}
                  alt={product.title}
                  className="w-full max-w-[400px] object-contain"
                  width={600}
                  height={540}
                />
              </div>

              {/* Info panel */}
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
                  <div className="w-2 h-2 rounded-full bg-[#0F2952]" />
                  <span className="text-[11px] font-bold tracking-[0.1em] uppercase text-gray-500">Na stanju · Isporuka 1–3 dana</span>
                </div>

                {/* Description */}
                <p className="text-[13px] text-gray-500 leading-relaxed mb-6">{product.description}</p>

                {/* Flavor selector */}
                {product.flavors?.length > 0 && (
                  <div className="mb-6">
                    <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-gray-400 mb-3">Okus</p>
                    <div className="flex flex-wrap gap-2">
                      {product.flavors.map((f) => (
                        <button
                          key={f}
                          className={`px-3 py-2 text-[11px] font-bold tracking-[0.06em] border transition-all duration-150 cursor-pointer ${
                            f === flavor
                              ? 'border-[#0F2952] bg-[#0F2952] text-white'
                              : 'border-gray-300 text-gray-600 bg-transparent hover:border-[#0F2952] hover:text-[#0F2952]'
                          }`}
                          onClick={() => setFlavor(f)}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Qty + Add to cart */}
                <div className="flex gap-3 mb-6">
                  <div className="flex items-center border border-gray-300">
                    <button
                      className="w-10 h-12 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-[#0F2952] transition-colors cursor-pointer bg-transparent border-0"
                      onClick={() => setQty((q) => Math.max(1, q - 1))}
                      aria-label="Smanji količinu"
                    >
                      <Minus size={14} weight="bold" />
                    </button>
                    <span className="w-10 text-center text-[13px] font-bold text-[#0F2952]">{qty}</span>
                    <button
                      className="w-10 h-12 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-[#0F2952] transition-colors cursor-pointer bg-transparent border-0"
                      onClick={() => setQty((q) => q + 1)}
                      aria-label="Povećaj količinu"
                    >
                      <Plus size={14} weight="bold" />
                    </button>
                  </div>

                  <button
                    className="flex-1 flex items-center justify-center gap-2.5 py-3 bg-[#0F2952] text-white text-[11px] font-bold tracking-[0.1em] uppercase hover:bg-[#0A1F42] transition-colors duration-150 cursor-pointer border-0"
                    onClick={handleAdd}
                  >
                    <ShoppingBag size={16} weight="fill" /> Dodaj u korpu
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
                    { Icon: Truck,        title: 'Besplatna dostava', sub: 'Preko 100 KM' },
                    { Icon: ShieldCheck,  title: 'Sigurna kupovina',  sub: 'SSL + originalni' },
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

      </main>
    </>
  )
}
