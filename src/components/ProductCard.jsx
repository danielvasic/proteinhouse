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
  const tilt = useMemo(() => stickerTilt(id), [id])

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

      {/* Image */}
      <div className="relative bg-gray-50 overflow-hidden" style={{ paddingBottom: '72%' }}>
        <img
          src={img}
          alt={title}
          className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ${hover ? 'scale-105' : 'scale-100'}`}
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
          className="text-[13px] font-semibold text-[#0F2952] leading-snug line-clamp-2 mb-3"
          style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}
        >
          {title}
        </p>

        <div className="mt-auto">
          <div className="flex items-baseline gap-2 mb-3">
            <span className="text-base font-extrabold text-[#0F2952]">{fmtKM(price)}</span>
            {old && (
              <span className="text-xs text-gray-400 line-through font-normal">{fmtKM(old)}</span>
            )}
          </div>
          <button
            className="w-full py-2.5 border border-[#0F2952] text-[#0F2952] text-[11px] font-bold tracking-[0.1em] uppercase bg-transparent hover:bg-[#0F2952] hover:text-white transition-all duration-150 cursor-pointer"
            onClick={(e) => { e.stopPropagation(); addItem(product) }}
            aria-label={`Dodaj ${title} u korpu`}
            style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}
          >
            Dodaj u korpu
          </button>
        </div>
      </div>
    </article>
  )
}
