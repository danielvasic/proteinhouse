import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star } from '@phosphor-icons/react'
import { useCart } from '../store/CartContext'
import { fmtKM } from '../data/catalog'
import { hasAnyStock } from '../hooks/useProducts'

const TAG_LABELS = { bestseller: 'BEST BUY', new: 'NOVO', gainer: 'GAINER' }

function stickerTilt(id) {
  const seed = String(id)
    .split('')
    .reduce((s, c) => s + c.charCodeAt(0), 0)
  return ((seed % 11) - 5) - 4
}

export default function ProductCard({ product }) {
  const navigate = useNavigate()
  const { addItem } = useCart()
  const [hover, setHover] = useState(false)

  const { id, slug, brand, title, price, old, img, badge, rating, reviews, tags = [] } = product
  const isDiscount   = badge && badge.startsWith('-')
  const tilt         = useMemo(() => stickerTilt(id), [id])
  const inStock      = hasAnyStock(product)
  const tagChip      = tags.map((t) => TAG_LABELS[t] || t.toUpperCase()).find((t) => t !== badge)

  return (
    <article
      className={`relative bg-white border border-gray-200 overflow-hidden cursor-pointer flex flex-col group transition-all duration-200 ${hover ? 'shadow-[0_12px_32px_-8px_rgba(15,41,82,0.14)] border-gray-300' : ''}`}
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
          <div className="w-[50px] h-[50px] rounded-full bg-[#0F2952] flex items-center justify-center border border-white/20">
            <span className="text-white text-[11px] font-extrabold tracking-tight text-center leading-tight">{badge}</span>
          </div>
        </div>
      )}

      {/* NOVO tag */}
      {badge && !isDiscount && (
        <div
          className="absolute top-3 left-3 z-10 px-2 py-0.5 border border-[#0F2952] text-[#0F2952] text-[10px] font-bold tracking-[0.1em] uppercase bg-white"
          style={{ transform: `rotate(${tilt * 0.5}deg)` }}
        >
          {badge}
        </div>
      )}

      {/* Tag chip (bestseller, new, gainer…) */}
      {tagChip && (
        <div className={`absolute left-3 z-10 px-2 py-0.5 bg-[#0F2952] text-white text-[9px] font-bold tracking-[0.1em] uppercase ${badge ? 'top-[68px]' : 'top-3'}`}>
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
      <div className="relative bg-white overflow-hidden" style={{ paddingBottom: '72%' }}>
        <img
          src={img}
          alt={title}
          className={`absolute inset-0 w-full h-full object-contain p-3 transition-transform duration-500 ${hover ? 'scale-105' : 'scale-100'}`}
          loading="lazy"
          width={300}
          height={216}
        />
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4">
        <p
          className="text-[10px] font-bold tracking-[0.14em] uppercase text-gray-400 mb-1"
          style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}
        >
          {brand}
        </p>
        <p
          className="text-[13px] font-semibold text-[#0F2952] leading-snug line-clamp-2 mb-2"
          style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}
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
                color={i < Math.round(rating) ? '#0F2952' : '#D1D5DB'}
              />
            ))}
            <span className="text-[10px] text-gray-400 ml-0.5">({reviews})</span>
          </div>
        )}

        <div className="mt-auto">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-base font-extrabold text-[#0F2952]">{fmtKM(price)}</span>
            {old && (
              <span className="text-xs text-gray-400 line-through font-normal">{fmtKM(old)}</span>
            )}
          </div>
          <button
            className={`w-full py-2.5 text-[11px] font-bold tracking-[0.1em] uppercase transition-all duration-150 ${
              inStock
                ? 'border border-[#0F2952] text-[#0F2952] bg-transparent hover:bg-[#0F2952] hover:text-white cursor-pointer'
                : 'border border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
            }`}
            onClick={(e) => { e.stopPropagation(); if (inStock) addItem(product) }}
            aria-label={`Dodaj ${title} u korpu`}
            disabled={!inStock}
            style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}
          >
            {inStock ? 'Dodaj u korpu' : 'Nema na stanju'}
          </button>
        </div>
      </div>
    </article>
  )
}
