import styles from './Logo.module.css'

const SIZES = { sm: 22, md: 32, lg: 42, xl: 58 }

/**
 * Logo variants:
 *   variant="wordmark" (default) — horizontal text logo, used in Header/Footer
 *   variant="icon"               — circular SVG logo, used standalone
 */
export default function Logo({
  onDark = false,
  size = 'md',
  onClick,
  className = '',
  variant = 'wordmark',
}) {
  const px = SIZES[size] || 32

  if (variant === 'icon') {
    const iconPx = { sm: 40, md: 64, lg: 96, xl: 140 }[size] || 64
    return (
      <img
        src="/logo.svg"
        alt="ProteinHouse"
        width={iconPx}
        height={iconPx}
        className={className}
        style={{ cursor: onClick ? 'pointer' : 'default', display: 'block' }}
        onClick={onClick}
      />
    )
  }

  return (
    <span
      onClick={onClick}
      className={`${styles.logo} ${onDark ? styles.onDark : ''} ${className}`}
      style={{ fontSize: px }}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      <b className={styles.protein}>PROTEIN</b>
      <span className={styles.house}>HOUSE</span>
    </span>
  )
}
