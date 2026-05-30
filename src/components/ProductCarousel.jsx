import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import ProductCard from './ProductCard'
import styles from './ProductCarousel.module.css'

const PER_PAGE = 4

export default function ProductCarousel({ title, eyebrow, products, categorySlug }) {
  const navigate = useNavigate()
  const [page, setPage] = useState(0)

  const pages = useMemo(() => {
    const out = []
    for (let i = 0; i < products.length; i += PER_PAGE) {
      out.push(products.slice(i, i + PER_PAGE))
    }
    return out
  }, [products])

  const total = pages.length

  const go = (dir) => setPage((p) => (p + dir + total) % total)

  return (
    <section className={styles.section}>
      <div className="container">
        {/* Header */}
        <div className={styles.header}>
          <div>
            {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
            <h2 className={styles.title}>{title}</h2>
          </div>
          <div className={styles.controls}>
            <button
              className={styles.arrow}
              onClick={() => go(-1)}
              disabled={total <= 1}
              aria-label="Prethodno"
            >
              <CaretLeft size={18} weight="bold" />
            </button>
            <button
              className={styles.arrow}
              onClick={() => go(1)}
              disabled={total <= 1}
              aria-label="Sljedeće"
            >
              <CaretRight size={18} weight="bold" />
            </button>
            {categorySlug && (
              <button
                className={styles.seeAll}
                onClick={() => navigate(`/kategorija/${categorySlug}`)}
              >
                POGLEDAJ SVE →
              </button>
            )}
          </div>
        </div>

        {/* Carousel track */}
        <div className={styles.trackWrap}>
          <div
            className={styles.track}
            style={{
              width: `${total * 100}%`,
              transform: `translateX(-${page * (100 / total)}%)`,
            }}
          >
            {pages.map((slice, i) => (
              <div
                key={i}
                className={styles.page}
                style={{ width: `${100 / total}%` }}
              >
                {slice.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        {total > 1 && (
          <div className={styles.dots} role="tablist" aria-label="Stranice">
            {pages.map((_, i) => (
              <button
                key={i}
                className={`${styles.dot} ${i === page ? styles.dotActive : ''}`}
                onClick={() => setPage(i)}
                aria-label={`Stranica ${i + 1}`}
                aria-selected={i === page}
                role="tab"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
