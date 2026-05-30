import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { categories } from '../data/catalog'
import styles from './CategorySidebar.module.css'

const BRANDS = ['Optimum Nutrition', 'Ostrovit', 'BSN', 'MuscleTech', 'AllNutrition', 'Scitec']

export default function CategorySidebar({ activeSlug, onPriceFilter }) {
  const navigate = useNavigate()
  const [priceMax, setPriceMax] = useState(300)
  const [selectedBrands, setSelectedBrands] = useState([])

  const toggleBrand = (b) =>
    setSelectedBrands((prev) =>
      prev.includes(b) ? prev.filter((x) => x !== b) : [...prev, b]
    )

  return (
    <aside className={styles.sidebar}>
      {/* Categories */}
      <div className={styles.box}>
        <h3 className={styles.boxTitle}>KATEGORIJE</h3>
        <ul className={styles.catList}>
          {categories.map((c) => (
            <li
              key={c.slug}
              className={`${styles.catItem} ${c.slug === activeSlug ? styles.catActive : ''}`}
              onClick={() => navigate(`/kategorija/${c.slug}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/kategorija/${c.slug}`)}
            >
              {c.label}
            </li>
          ))}
        </ul>
      </div>

      {/* Price filter */}
      <div className={styles.box}>
        <h3 className={styles.boxTitle}>FILTER PO CIJENI</h3>
        <input
          type="range"
          min={0}
          max={300}
          value={priceMax}
          onChange={(e) => setPriceMax(Number(e.target.value))}
          className={styles.slider}
          aria-label="Maksimalna cijena"
        />
        <div className={styles.priceLabels}>
          <span>0 KM</span>
          <span className={styles.priceMax}>{priceMax} KM</span>
        </div>
        <button
          className={styles.applyBtn}
          onClick={() => onPriceFilter?.(priceMax)}
        >
          PRIMIJENI
        </button>
      </div>

      {/* Brands */}
      <div className={styles.box}>
        <h3 className={styles.boxTitle}>BRENDOVI</h3>
        <ul className={styles.brandList}>
          {BRANDS.map((b) => (
            <li key={b} className={styles.brandItem}>
              <label className={styles.brandLabel}>
                <input
                  type="checkbox"
                  checked={selectedBrands.includes(b)}
                  onChange={() => toggleBrand(b)}
                  className={styles.checkbox}
                />
                {b}
              </label>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
