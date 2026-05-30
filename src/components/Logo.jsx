import styles from './Logo.module.css'

const SIZES = { sm: 22, md: 32, lg: 42, xl: 58 }

export default function Logo({ onDark = false, size = 'md', onClick, className = '' }) {
  const px = SIZES[size] || 32

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
