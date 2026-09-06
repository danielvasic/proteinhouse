import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Star } from '@phosphor-icons/react'
import { useCart } from '../store/CartContext'
import { discountChipClass } from '../data/catalog'
import { fmtKM } from '../lib/price'
import { hasAnyStock, getVariantStock, getVariantImageSrc, getVariantPrice, getVariantOldPrice, getSizeOptions, getFlavorOptions, getDefaultVariant } from '../hooks/useProducts'
import { BODY } from '../lib/typography'

// Color coding po tipu (Notion: "Labels/Tagovi — Color coding"):
// bestseller = Electric Blue, novo = Cyan Neon, ostalo = Night Black;
// popust ostaje Vulcan Orange (sticker ispod).
const TAG_LABELS = { bestseller: 'Bestseller', new: 'Novo', gainer: 'Gainer' }
const TAG_COLORS = {
  Bestseller: 'bg-[#0145F2] text-white',
  Novo:       'bg-[#00cec9] text-[#1e272e]',
}
const TAG_DEFAULT_COLOR = 'bg-[#1e272e] text-white'

/** Kompaktan select za varijante na kartici (okus / gramaža) */
function VariantSelect({ label, options, value, onChange }) {
  if (!options || options.length === 0) return null
  return (
    <select
      className="flex-1 min-w-0 h-9 px-2 border border-gray-200 bg-[#edf1f5] text-[11px] font-semibold text-[#1e272e] cursor-pointer focus:outline-none focus:border-[#0145F2] transition-colors"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      aria-label={label}
      style={BODY}
    >
      {options.map(({ value: opt, disabled }) => (
        <option key={opt} value={opt} disabled={disabled}>
          {disabled ? `${opt} — nema` : opt}
        </option>
      ))}
    </select>
  )
}

export default function ProductCard({ product, bestseller = false }) {
  const navigate = useNavigate()
  const { addItem } = useCart()
  const [hover, setHover] = useState(false)

  const { slug, brand, title, price, badge, rating, reviews, tags = [], flavors = [], sizes = [] } = product
  const isDiscount   = badge && badge.startsWith('-')
  const inStock      = hasAnyStock(product)
  const tagChip      = (bestseller && !tags.includes('bestseller'))
    ? TAG_LABELS.bestseller
    : tags.map((t) => TAG_LABELS[t] || (t[0].toUpperCase() + t.slice(1))).find((t) => t !== badge)

  // Pocetni izbor je prva kombinacija koja se moze kupiti, ne prva po redu.
  const [flavor, setFlavor] = useState(() => getDefaultVariant(product).flavor)
  const [size,   setSize]   = useState(() => getDefaultVariant(product).size)
  const hasVariants   = flavors.length > 0 || sizes.length > 0

  // Sve gramaže ostaju u popisu, nedostupne su onemogucene — vidi
  // getSizeOptions. Ako izabrana gramaža nema stanja uz novi okus, padamo na
  // prvu koja ima; inace bi kupac ostao na rasprodanoj kombinaciji. Izbor se
  // izvodi, ne upisuje u state, pa se vraca cim se vrati na okus koji ga ima.
  const okusOpcije    = getFlavorOptions(product)
  const gramazaOpcije = getSizeOptions(product, flavor)
  const gramaza       = (
    gramazaOpcije.find((o) => o.value === size && !o.disabled) ??
    gramazaOpcije.find((o) => !o.disabled) ??
    gramazaOpcije.find((o) => o.value === size) ??
    gramazaOpcije[0]
  )?.value ?? null
  const variantStock  = hasVariants ? getVariantStock(product, flavor, gramaza) : (product.stock ?? 0)
  const canAdd        = inStock && (!hasVariants || variantStock > 0)
  const cijenaVarijante = getVariantPrice(product, flavor, gramaza)
  const old             = getVariantOldPrice(product, flavor, gramaza)
  // Ako galerija ima sliku vezanu za izabrani okus/gramažu, prikaži nju umjesto cover slike
  const displayImg    = useMemo(() => getVariantImageSrc(product, flavor, gramaza), [product, flavor, gramaza])

  return (
    <article
      className={`relative bg-white overflow-hidden cursor-pointer flex flex-col group transition-all duration-200 ${hover ? 'shadow-[0_12px_32px_-8px_rgba(15,41,82,0.16)]' : ''}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => navigate(`/proizvod/${slug}`)}
    >
      {/* Popust — horizontalni chip u stilu bestseller taga, samo uži i s većim
          fontom. Bez naginjanja: nakrivljeni kvadrat je djelovao nekonzistentno
          ("zašto je jedan normalan, a drugi tiltan") i zauzimao previše prostora. */}
      {isDiscount && (
        <div className={`absolute top-3 left-3 z-10 px-2 py-1 ${discountChipClass(badge)} text-[12px] font-extrabold italic leading-none`} aria-hidden="true">
          {badge}
        </div>
      )}

      {/* NOVO tag */}
      {badge && !isDiscount && (
        <div className="absolute top-3 left-3 z-10 px-2 py-0.5 bg-[#00cec9] text-[#1e272e] text-[10px] font-bold tracking-[0.1em]">
          {badge}
        </div>
      )}

      {/* Tag chip (bestseller, new, gainer…) */}
      {tagChip && (
        <div className={`absolute left-3 z-10 px-2 py-0.5 ${TAG_COLORS[tagChip] ?? TAG_DEFAULT_COLOR} text-[9px] font-bold tracking-[0.1em] ${badge ? 'top-[42px]' : 'top-3'}`}>
          {tagChip}
        </div>
      )}

      {/* Out of stock overlay */}
      {!inStock && (
        <div className="absolute top-3 right-3 z-10 px-2 py-0.5 bg-gray-800/80 text-white text-[10px] font-bold tracking-[0.1em]">
          Nema na stanju
        </div>
      )}

      {/* Image — bijela, čista podloga (Elit stil) */}
      <div className="relative bg-white overflow-hidden" style={{ paddingBottom: '78%' }}>
        <img
          src={displayImg}
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
          className="text-[10px] font-bold tracking-[0.14em] text-gray-400 mb-1"
          style={BODY}
        >
          {brand}
        </p>
        <p
          className="text-[13px] font-semibold text-[#1e272e] leading-snug line-clamp-2 mb-2"
          style={BODY}
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
              <VariantSelect label="Okus"    options={okusOpcije}    value={flavor}  onChange={setFlavor} />
              <VariantSelect label="Gramaža" options={gramazaOpcije} value={gramaza} onChange={setSize} />
            </div>
          )}

          {/* Cijena prati izbor u kartici — bez toga bi Gold Whey od 30 g i
              od 2270 g pokazivali istu cifru. */}
          <div className="flex items-baseline gap-2 mb-3">
            {/* Snižena cijena ide u Vulcan Orange — brand book tu boju drži za popuste */}
            <span className={`text-[19px] font-extrabold ${old ? 'text-[#ff4103]' : 'text-[#1e272e]'}`}>{fmtKM(cijenaVarijante)}</span>
            {old && (
              <span className="text-xs text-gray-400 line-through font-normal">{fmtKM(old)}</span>
            )}
          </div>
          <button
            className={`w-full py-3 text-[11px] font-bold tracking-[0.1em] transition-all duration-150 ${
              canAdd
                ? 'ph-cta cursor-pointer'
                : 'border border-gray-200 text-gray-400 bg-[#edf1f5] cursor-not-allowed'
            }`}
            onClick={(e) => { e.stopPropagation(); if (canAdd) addItem({ ...product, price: cijenaVarijante, selectedFlavor: flavor, selectedSize: gramaza }) }}
            aria-label={`Dodaj ${title} u korpu`}
            disabled={!canAdd}
            style={BODY}
          >
            {canAdd ? 'Dodaj u korpu' : 'Nema na stanju'}
          </button>
        </div>
      </div>
    </article>
  )
}
