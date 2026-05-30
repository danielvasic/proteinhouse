import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../store/CartContext'
import { fmtKM } from '../data/catalog'

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

  const { id, slug, brand, title, price, old, img, badge } = product
  const isDiscount = badge && badge.startsWith('-')
  const isDeep = isDiscount && parseFloat(badge) <= -50
  const tilt = useMemo(() => stickerTilt(id), [id])

  return (
    <article
      className={`relative bg-white rounded-xl border border-gray-200 overflow-hidden cursor-pointer flex flex-col transition-all duration-200 ${hover ? 'shadow-[0_8px_24px_-6px_rgba(15,41,82,0.18)] -translate-y-0.5' : 'shadow-sm'}`}
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
          <div className={`relative w-[52px] h-[52px] rounded-full flex items-center justify-center overflow-hidden ${isDeep ? 'bg-[#0F2952]' : 'bg-[#2563EB]'}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full" />
            <span className="relative text-white text-[11px] font-extrabold tracking-tight leading-none text-center">{badge}</span>
          </div>
        </div>
      )}

      {/* NOVO tag */}
      {badge && !isDiscount && (
        <div
          className="absolute top-3 left-3 z-10 px-2 py-0.5 bg-[#0F2952] text-white text-[10px] font-bold tracking-[0.1em] uppercase rounded"
          style={{ transform: `rotate(${tilt * 0.5}deg)` }}
          aria-label={badge}
        >
          {badge}
        </div>
      )}

      {/* Image */}
      <div className="relative bg-gray-50 overflow-hidden" style={{ paddingBottom: '66.67%' }}>
        <img
          src={img}
          alt={title}
          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-300 ${hover ? 'scale-105' : 'scale-100'}`}
          loading="lazy"
          width={300}
          height={200}
        />
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-1.5">
        <p className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#2563EB]">{brand}</p>
        <p className="text-[13px] font-semibold text-[#0F2952] leading-snug line-clamp-2">{title}</p>
        <div className="flex items-baseline gap-2 mt-auto pt-2">
          <span className={`text-base font-extrabold ${old ? 'text-[#2563EB]' : 'text-[#0F2952]'}`}>
            {fmtKM(price)}
          </span>
          {old && (
            <span className="text-xs text-gray-400 line-through">{fmtKM(old)}</span>
          )}
        </div>
        <button
          className="mt-2 w-full py-2.5 bg-[#0F2952] hover:bg-[#2563EB] text-white text-[11px] font-bold tracking-[0.08em] uppercase rounded transition-colors duration-150 cursor-pointer"
          onClick={(e) => { e.stopPropagation(); addItem(product) }}
          aria-label={`Dodaj ${title} u korpu`}
        >
          Dodaj u korpu
        </button>
      </div>
    </article>
  )
}
