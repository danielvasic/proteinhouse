import { useState } from 'react'

/**
 * Zvanična brend ikona iz Brand Guidelines 2026 (stranica "Ikonografija").
 *
 * Ikone su dvobojne (Electric Blue + Vulcan Orange) i imaju svoju boju, pa se
 * prikazuju kao <img> i NE prebojavaju se CSS-om — to je namjerno.
 *
 * Ako fajl još nije stigao od dizajnera, komponenta tiho vrati `fallback`
 * (obično postojeća Phosphor ikona). Zato se BrandIcon može ugraditi odmah:
 * čim se SVG ubaci u public/brand/icons/, ikona se sama zamijeni, bez
 * ijedne izmjene u kodu.
 *
 *   <BrandIcon name="dostava" size={18} fallback={<Truck size={18} />} />
 */
export default function BrandIcon({ name, size = 20, alt = '', className = '', fallback = null }) {
  const [failed, setFailed] = useState(false)

  if (!name || failed) return fallback

  return (
    <img
      src={`/brand/icons/${name}.svg`}
      alt={alt}
      width={size}
      height={size}
      className={className}
      onError={() => setFailed(true)}
      style={{ width: size, height: size, display: 'block', flexShrink: 0 }}
    />
  )
}
