import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { House } from '@phosphor-icons/react'
import CategorySidebar from '../components/CategorySidebar'
import ProductCard from '../components/ProductCard'
import { getCategoryBySlug, getProductsByCategory } from '../data/catalog'
import styles from './Category.module.css'

const SORT_OPTIONS = [
  { value: 'newest', label: 'Najnovije' },
  { value: 'price_asc', label: 'Cijena: rastuće' },
  { value: 'price_desc', label: 'Cijena: opadajuće' },
  { value: 'popular', label: 'Popularnost' },
]

function sortProducts(products, sort) {
  const arr = [...products]
  switch (sort) {
    case 'price_asc': return arr.sort((a, b) => a.price - b.price)
    case 'price_desc': return arr.sort((a, b) => b.price - a.price)
    case 'popular': return arr.sort((a, b) => (b.reviews || 0) - (a.reviews || 0))
    default: return arr
  }
}

export default function Category() {
  const { slug } = useParams()
  const [sort, setSort] = useState('newest')
  const [maxPrice, setMaxPrice] = useState(300)

  const category = getCategoryBySlug(slug)
  const allProducts = getProductsByCategory(slug)
  const filtered = allProducts.filter((p) => p.price <= maxPrice)
  const sorted = sortProducts(filtered, sort)

  const pageTitle = category?.label || slug?.toUpperCase() || 'KATEGORIJA'
  const metaDesc = `Kupujte ${pageTitle.toLowerCase()} online na ProteinHouse. ${filtered.length} proizvoda u ponudi.`

  return (
    <>
      <Helmet>
        <title>{pageTitle} — ProteinHouse</title>
        <meta name="description" content={metaDesc} />
        <link rel="canonical" href={`https://proteinhouse.ba/kategorija/${slug}`} />
      </Helmet>

      <main className={styles.main}>
        <div className="container">
          {/* Breadcrumb */}
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link to="/" className={styles.breadLink}>
              <House size={13} weight="fill" /> POČETNA
            </Link>
            <span className={styles.breadSep}>/</span>
            <span className={styles.breadCurrent}>{pageTitle}</span>
          </nav>

          {/* Page heading */}
          <h1 className={styles.heading}>{pageTitle}</h1>
          <p className={styles.count}>{filtered.length} {filtered.length === 1 ? 'proizvod' : 'proizvoda'}</p>

          {/* Layout */}
          <div className={styles.layout}>
            <CategorySidebar activeSlug={slug} onPriceFilter={setMaxPrice} />

            <div className={styles.content}>
              {/* Sort bar */}
              <div className={styles.sortBar}>
                <span className={styles.sortLabel}>
                  Prikazano <strong>{sorted.length}</strong> od {allProducts.length} proizvoda
                </span>
                <select
                  className={styles.sortSelect}
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  aria-label="Sortiranje"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      Sortiraj: {o.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product grid */}
              {sorted.length > 0 ? (
                <div className={styles.grid}>
                  {sorted.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              ) : (
                <div className={styles.empty}>
                  <p>Nema proizvoda koji odgovaraju filterima.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
