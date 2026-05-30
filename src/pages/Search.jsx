import { useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { MagnifyingGlass, House } from '@phosphor-icons/react'
import ProductCard from '../components/ProductCard'
import { products } from '../data/catalog'
import styles from './Search.module.css'

function searchProducts(query) {
  if (!query || query.trim().length < 2) return []
  const q = query.toLowerCase().trim()
  return products.filter(
    (p) =>
      p.title.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
  )
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const q = searchParams.get('q') || ''
  const results = useMemo(() => searchProducts(q), [q])

  const handleSubmit = (e) => {
    e.preventDefault()
    const val = e.target.elements.q.value.trim()
    if (val) setSearchParams({ q: val })
  }

  const resultWord = results.length === 1 ? 'rezultat' : 'rezultata'

  return (
    <>
      <Helmet>
        <title>{q ? `"${q}" — Pretraga` : 'Pretraga'} — ProteinHouse</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>

      <main className={styles.main}>
        <div className="container">
          {/* Breadcrumb */}
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link to="/" className={styles.breadLink}>
              <House size={13} weight="fill" /> POČETNA
            </Link>
            <span className={styles.breadSep}>/</span>
            <span className={styles.breadCurrent}>PRETRAGA</span>
          </nav>

          <h1 className={styles.heading}>PRETRAGA</h1>

          {/* Search bar */}
          <form className={styles.searchForm} onSubmit={handleSubmit}>
            <div className={styles.searchWrap}>
              <MagnifyingGlass size={20} className={styles.searchIcon} color="var(--ph-gray-500)" />
              <input
                name="q"
                defaultValue={q}
                key={q}
                className={styles.searchInput}
                placeholder="Pretraži proizvode, brendove…"
                aria-label="Pretraga"
                autoFocus
              />
              <button type="submit" className={styles.searchBtn}>PRETRAŽI</button>
            </div>
          </form>

          {/* Result count */}
          {q && (
            <p className={styles.resultCount}>
              {results.length > 0
                ? `${results.length} ${resultWord} za „${q}"`
                : `Nema rezultata za „${q}"`}
            </p>
          )}

          {/* Results grid */}
          {results.length > 0 ? (
            <div className={styles.grid}>
              {results.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : q ? (
            <div className={styles.empty}>
              <MagnifyingGlass size={52} color="var(--ph-gray-300)" weight="light" />
              <p className={styles.emptyTitle}>Nema rezultata</p>
              <p className={styles.emptyText}>
                Pokušajte s drugačijim pojmom ili pretražite naše kategorije.
              </p>
              <Link to="/" className={styles.emptyLink}>← Nazad na početnu</Link>
            </div>
          ) : (
            <div className={styles.empty}>
              <p className={styles.emptyText}>Unesite pojam za pretragu iznad.</p>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
