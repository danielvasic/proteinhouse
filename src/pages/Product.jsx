import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import {
  Star, Truck, ShieldCheck, Heart, Minus, Plus,
  ShoppingBag, House, CaretRight,
} from '@phosphor-icons/react'
import { useCart } from '../store/CartContext'
import { getProductBySlug, getCategoryBySlug, fmtKM } from '../data/catalog'
import styles from './Product.module.css'

function StarRating({ rating }) {
  return (
    <div className={styles.stars} aria-label={`Ocjena ${rating} od 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={15}
          weight={i < Math.floor(rating) ? 'fill' : 'regular'}
          color={i < Math.floor(rating) ? 'var(--ph-coral-500)' : 'var(--ph-gray-300)'}
        />
      ))}
    </div>
  )
}

export default function Product() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()

  const product = getProductBySlug(slug)
  const [qty, setQty] = useState(1)
  const [flavor, setFlavor] = useState(product?.flavors?.[0] || '')

  if (!product) {
    return (
      <div className={styles.notFound}>
        <h1>Proizvod nije pronađen</h1>
        <Link to="/" className={styles.backLink}>← Nazad na početnu</Link>
      </div>
    )
  }

  const category = getCategoryBySlug(product.cat)
  const isDiscount = product.badge?.startsWith('-')
  const isDeep = isDiscount && parseFloat(product.badge) <= -50

  const handleAdd = () => {
    for (let i = 0; i < qty; i++) {
      addItem(product)
    }
  }

  return (
    <>
      <Helmet>
        <title>{product.brand} {product.title} — ProteinHouse</title>
        <meta
          name="description"
          content={`Kupite ${product.title} od ${product.brand} na ProteinHouse. ${product.description}`}
        />
        <link rel="canonical" href={`https://proteinhouse.ba/proizvod/${slug}`} />
        {/* Structured data */}
        <script type="application/ld+json">{JSON.stringify({
          '@context': 'https://schema.org/',
          '@type': 'Product',
          name: product.title,
          brand: { '@type': 'Brand', name: product.brand },
          description: product.description,
          image: product.img,
          offers: {
            '@type': 'Offer',
            price: product.price,
            priceCurrency: 'BAM',
            availability: 'https://schema.org/InStock',
          },
          aggregateRating: {
            '@type': 'AggregateRating',
            ratingValue: product.rating,
            reviewCount: product.reviews,
          },
        })}</script>
      </Helmet>

      <main className={styles.main}>
        <div className="container">
          {/* Breadcrumb */}
          <nav className={styles.breadcrumb} aria-label="Breadcrumb">
            <Link to="/" className={styles.breadLink}><House size={12} weight="fill" /> Početna</Link>
            <CaretRight size={12} />
            <Link to={`/kategorija/${product.cat}`} className={styles.breadLink}>
              {category?.label || product.cat}
            </Link>
            <CaretRight size={12} />
            <span className={styles.breadCurrent}>{product.brand}</span>
          </nav>

          {/* 2-column layout */}
          <div className={styles.grid}>
            {/* Image panel */}
            <div className={styles.imagePanel}>
              {isDiscount && (
                <div className={`${styles.imageBadge} ${isDeep ? styles.badgeDeep : styles.badgeCoral}`}>
                  {product.badge}
                </div>
              )}
              <img
                src={product.img}
                alt={product.title}
                className={styles.productImg}
                width={600}
                height={540}
              />
            </div>

            {/* Info panel */}
            <div className={styles.info}>
              <p className={styles.brand}>{product.brand}</p>
              <h1 className={styles.title}>{product.title}</h1>

              {product.rating && (
                <div className={styles.ratingRow}>
                  <StarRating rating={product.rating} />
                  <span className={styles.reviewCount}>
                    ({product.reviews} recenzija)
                  </span>
                </div>
              )}

              {/* Price */}
              <div className={styles.priceRow}>
                <span className={`${styles.price} ${product.old ? styles.priceSale : ''}`}>
                  {fmtKM(product.price)}
                </span>
                {product.old && (
                  <span className={styles.oldPrice}>{fmtKM(product.old)}</span>
                )}
              </div>

              {/* Stock badge */}
              <div className={styles.stock}>
                <span className={styles.stockDot} />
                NA STANJU · ISPORUKA 1–3 DANA
              </div>

              {/* Description */}
              <p className={styles.description}>{product.description}</p>

              {/* Flavor selector */}
              {product.flavors && product.flavors.length > 0 && (
                <div className={styles.flavors}>
                  <p className={styles.flavorsLabel}>OKUS</p>
                  <div className={styles.flavorsGrid}>
                    {product.flavors.map((f) => (
                      <button
                        key={f}
                        className={`${styles.flavorBtn} ${f === flavor ? styles.flavorActive : ''}`}
                        onClick={() => setFlavor(f)}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Qty + Add to cart */}
              <div className={styles.addRow}>
                <div className={styles.qty}>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    aria-label="Smanji količinu"
                  >
                    <Minus size={16} weight="bold" />
                  </button>
                  <span className={styles.qtyVal}>{qty}</span>
                  <button
                    className={styles.qtyBtn}
                    onClick={() => setQty((q) => q + 1)}
                    aria-label="Povećaj količinu"
                  >
                    <Plus size={16} weight="bold" />
                  </button>
                </div>

                <button className={styles.addBtn} onClick={handleAdd}>
                  <ShoppingBag size={18} weight="fill" /> Dodaj u korpu
                </button>

                <button className={styles.wishBtn} aria-label="Dodaj na wishlist">
                  <Heart size={20} />
                </button>
              </div>

              {/* Trust badges */}
              <div className={styles.trust}>
                <div className={styles.trustItem}>
                  <Truck size={20} weight="duotone" color="var(--ph-navy-700)" />
                  <div>
                    <strong>Besplatna dostava</strong>
                    <br />Preko 100 KM
                  </div>
                </div>
                <div className={styles.trustItem}>
                  <ShieldCheck size={20} weight="duotone" color="var(--ph-navy-700)" />
                  <div>
                    <strong>Sigurna kupovina</strong>
                    <br />SSL + originalni
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
