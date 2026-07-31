/**
 * Zvanični logo (Brand Guidelines 2026 — Friday 13 Marketing).
 *
 * Ranije je logo bio rekonstruisan CSS-om (Archivo Black + bijela traka), jer
 * nismo imali original. Sada koristimo dizajnerove SVG-ove sa slovima u
 * krivuljama, pa ne zavisi od webfonta i uvijek je identičan.
 *
 *   variant="wordmark" (default) — puni horizontalni logo (Header, Footer, Admin)
 *   variant="icon"               — kvadratna verzija (favicon mark)
 */

/** Visina wordmarka u px; širina prati omjer 300×115 iz originala. */
const SIZES = { sm: 34, md: 44, lg: 58, xl: 76 }
const ICON_SIZES = { sm: 40, md: 64, lg: 96, xl: 140 }

export default function Logo({
  onDark = false,
  size = 'md',
  onClick,
  className = '',
  variant = 'wordmark',
}) {
  const isIcon = variant === 'icon'
  const h = isIcon ? (ICON_SIZES[size] || 64) : (SIZES[size] || 44)
  const w = isIcon ? h : Math.round(h * (300 / 115))

  return (
    <img
      src={isIcon ? '/brand/logo-square.svg' : '/brand/logo-full.svg'}
      alt="ProteinHouse"
      width={w}
      height={h}
      className={className}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      style={{
        display: 'block',
        width: w,
        height: h,
        cursor: onClick ? 'pointer' : 'default',
        // Logo je plavi pravougaonik — na plavoj podlozi (admin sidebar) bi se
        // stopio, pa mu dodajemo bijeli rub kao u brand booku.
        ...(onDark ? { boxShadow: '0 0 0 2px #ffffff' } : null),
      }}
    />
  )
}
