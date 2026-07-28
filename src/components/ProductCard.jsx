import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star } from '@phosphor-icons/react'
import { useCart } from '../store/CartContext'
import { fmtKM } from '../data/catalog'
import { hasAnyStock, getVariantStock } from '../hooks/useProducts'

const TAG_LABELS = { bestseller: 'BESTSELLER', new: 'NOVO', gainer: 'GAINER' }

/** Kompaktan select za varijante na kartici (okus / gramaža) */
function VariantSelect({ label, options, value, onChange }) {
  if (!options || options.length === 0) return null
  return (
    <select
      className="flex-1 min-w-0 h-9 px-2 border border-gray-200 bg-[#F2F4F7] text-[11px] font-semibold text-[#0A0E17] cursor-pointer focus:outline-none focus:border-[#0145F2] transition-colors"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      aria-label={label}
      style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
    >
      {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
    </select>
  )
}

function stickerTilt(id) {
  const seed = String(id)
    .split('')
    .reduce((s, c) => s + c.charCodeAt(0), 0)
  return ((seed % 11) - 5) - 4
}

export default function ProductCard({ product, bestseller = false }) {
  const navigate = useNavigate()
  const { addItem } = useCart()
  const [hover, setHover] = useState(false)

  const { id, slug, brand, title, price, old, img, badge, rating, reviews, tags = [], flavors = [], sizes = [] } = product
  const isDiscount   = badge && badge.startsWith('-')
  const tilt         = useMemo(() => stickerTilt(id), [id])
  const inStock      = hasAnyStock(product)
  const tagChip      = (bestseller && !tags.includes('bestseller'))
    ? TAG_LABELS.bestseller
    : tags.map((t) => TAG_LABELS[t] || t.toUpperCase()).find((t) => t !== badge)

  // Izbor okusa/gramaže direktno na kartici — default prva opcija
  const [flavor, setFlavor] = useState(flavors[0] ?? null)
  const [size,   setSize]   = useState(sizes[0] ?? null)
  const hasVariants   = flavors.length > 0 || sizes.length > 0
  const variantStock  = hasVariants ? getVariantStock(product, flavor, size) : (product.stock ?? 0)
  const canAdd        = inStock && (!hasVariants || variantStock > 0)

  return (
    <article
      className={`relative bg-white overflow-hidden cursor-pointer flex flex-col group transition-all duration-200 ${hover ? 'shadow-[0_12px_32px_-8px_rgba(15,41,82,0.16)]' : ''}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => navigate(`/proizvod/${slug}`)}
    >
      {/* Discount sticker */}
      {isDiscount && (
        <div
          className="absolute top-3 left-3 z-10"
          style={{ transform: `rotate(${tilt}deg)` }}
          aria-hidden="true"
        >
          <div className="w-[50px] h-[50px] rounded-full bg-[#0145F2] flex items-center justify-center border border-white/20">
            <span className="text-white text-[11px] font-extrabold tracking-tight text-center leading-tight">{badge}</span>
          </div>
        </div>
      )}

      {/* NOVO tag */}
      {badge && !isDiscount && (
        <div
          className="absolute top-3 left-3 z-10 px-2 py-0.5 border border-[#0145F2] text-[#0A0E17] text-[10px] font-bold tracking-[0.1em] uppercase bg-white"
          style={{ transform: `rotate(${tilt * 0.5}deg)` }}
        >
          {badge}
        </div>
      )}

      {/* Tag chip (bestseller, new, gainer…) */}
      {tagChip && (
        <div className={`absolute left-3 z-10 px-2 py-0.5 bg-[#0145F2] text-white text-[9px] font-bold tracking-[0.1em] uppercase ${badge ? 'top-[68px]' : 'top-3'}`}>
          {tagChip}
        </div>
      )}

      {/* Out of stock overlay */}
      {!inStock && (
        <div className="absolute top-3 right-3 z-10 px-2 py-0.5 bg-gray-800/80 text-white text-[10px] font-bold tracking-[0.1em] uppercase">
          Nema na stanju
        </div>
      )}

      {/* Image — bijela, čista podloga (Elit stil) */}
      <div className="relative bg-white overflow-hidden" style={{ paddingBottom: '78%' }}>
        <img
          src={img}
          alt={title}
          className={`absolute inset-0 w-full h-full object-contain p-5 transition-transform duration-500 ${hover ? 'scale-105' : 'scale-100'}`}
          loading="lazy"
          width={300}
          height={234}
        />
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 md:p-5 pt-3">
        <p
          className="text-[10px] font-bold tracking-[0.14em] uppercase text-gray-400 mb-1"
          style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          {brand}
        </p>
        <p
          className="text-[13px] font-semibold text-[#0A0E17] leading-snug line-clamp-2 mb-2"
          style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          {title}
        </p>

        {/* Zvjezdice — samo verificirane recenzije kupaca */}
        {reviews > 0 && rating > 0 && (
          <div className="flex items-center gap-1 mb-2" aria-label={`Ocjena ${rating} od 5`}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={11}
                weight={i < Math.round(rating) ? 'fill' : 'regular'}
                color={i < Math.round(rating) ? '#0145F2' : '#D1D5DB'}
              />
            ))}
            <span className="text-[10px] text-gray-400 ml-0.5">({reviews})</span>
          </div>
        )}

        <div className="mt-auto">
          {/* Varijante — odmah na kartici */}
          {hasVariants && (
            <div className="flex gap-2 mb-3" onClick={(e) => e.stopPropagation()}>
              <VariantSelect label="Okus"    options={flavors} value={flavor} onChange={setFlavor} />
              <VariantSelect label="Gramaža" options={sizes}   value={size}   onChange={setSize} />
            </div>
          )}

          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-[17px] font-extrabold text-[#0A0E17]">{fmtKM(price)}</span>
            {old && (
              <span className="text-xs text-gray-400 line-through font-normal">{fmtKM(old)}</span>
            )}
          </div>
          <button
            className={`w-full py-3 text-[11px] font-bold tracking-[0.1em] uppercase transition-all duration-150 ${
              canAdd
                ? 'border border-[#0145F2] text-[#0A0E17] bg-transparent hover:bg-[#0145F2] hover:text-white cursor-pointer'
                : 'border border-gray-200 text-gray-400 bg-[#F2F4F7] cursor-not-allowed'
            }`}
            onClick={(e) => { e.stopPropagation(); if (canAdd) addItem({ ...product, selectedFlavor: flavor, selectedSize: size }) }}
            aria-label={`Dodaj ${title} u korpu`}
            disabled={!canAdd}
            style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
          >
            {canAdd ? 'Dodaj u korpu' : 'Nema na stanju'}
          </button>
        </div>
      </div>
    </article>
  )
}
