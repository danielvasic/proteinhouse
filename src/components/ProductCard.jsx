import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../store/CartContext'
import { fmtKM } from '../data/catalog'
import styles from './ProductCard.module.css'

function stickerTilt(id) {
  const seed = String(id)
    .split('')
    .reduce((s, c) => s + c.charCodeAt(0), 0)
  return ((seed % 11) - 5) - 4 // ~-9° to +1°
}

export default function ProductCard({ product }) {
  const navigate = useNavigate()
  const { addItem } = useCart()
  const [hover, setHover] = useState(false)

  const { id, slug, brand, title, price, old, img, badge } = product
  const isDiscount = badge && badge.startsWith('-')
  const isDeep = isDiscount && parseFloat(badge) <= -50
  const tilt = useMemo(() => stickerTilt(id), [id])

  return (
    <article
      className={`${styles.card} ${hover ? styles.hover : ''}`}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={() => navigate(`/proizvod/${slug}`)}
    >
      {/* Sticker disc — discount */}
      {isDiscount && (
        <div
          className={styles.stickerWrap}
          style={{ transform: `rotate(${tilt}deg)` }}
          aria-hidden="true"
        >
          <div className={`${styles.stickerDisc} ${isDeep ? styles.stickerDeep : styles.stickerCoral}`}>
            <div className={styles.stickerSheen} />
            <span className={styles.stickerText}>{badge}</span>
          </div>
        </div>
      )}

      {/* NOVO rectangular tag */}
      {badge && !isDiscount && (
        <div
          className={styles.novoTag}
          style={{ transform: `rotate(${tilt * 0.5}deg)` }}
          aria-label={badge}
        >
          {badge}
        </div>
      )}

      {/* Image */}
      <div className={styles.imageWrap}>
        <img
          src={img}
          alt={title}
          className={styles.img}
          loading="lazy"
          width={300}
          height={200}
        />
      </div>

      {/* Body */}
      <div className={styles.body}>
        <p className={styles.brand}>{brand}</p>
        <p className={styles.title}>{title}</p>
        <div className={styles.priceRow}>
          <span className={`${styles.price} ${old ? styles.priceSale : ''}`}>
            {fmtKM(price)}
          </span>
          {old && (
            <span className={styles.oldPrice}>{fmtKM(old)}</span>
          )}
        </div>
        <button
          className={styles.addBtn}
          onClick={(e) => { e.stopPropagation(); addItem(product) }}
          aria-label={`Dodaj ${title} u korpu`}
        >
          Dodaj u korpu
        </button>
      </div>
    </article>
  )
}
