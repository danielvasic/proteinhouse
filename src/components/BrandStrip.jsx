import { brands } from '../data/catalog'
import styles from './BrandStrip.module.css'

export default function BrandStrip() {
  return (
    <section className={styles.section}>
      <div className="container">
        <p className={styles.label}>NAŠI BRENDOVI</p>
        <div className={styles.grid} style={{ gridTemplateColumns: `repeat(${brands.length}, 1fr)` }}>
          {brands.map((b) => (
            <div key={b.name} className={styles.logoWrap} title={b.name}>
              <img
                src={b.src}
                alt={b.name}
                className={styles.logo}
                loading="lazy"
                width={100}
                height={48}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
