import { useEffect } from 'react'
import { ShoppingBag, X } from '@phosphor-icons/react'
import { useCart } from '../store/CartContext'
import { fmtKM } from '../data/catalog'
import styles from './CartDrawer.module.css'

const FREE_SHIPPING_THRESHOLD = 100

export default function CartDrawer() {
  const { items, drawerOpen, totalPrice, closeDrawer, removeItem } = useCart()

  // Lock body scroll when open
  useEffect(() => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  // Close on Escape
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = (e) => { if (e.key === 'Escape') closeDrawer() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [closeDrawer])

  const nudge = FREE_SHIPPING_THRESHOLD - totalPrice

  return (
    <>
      {/* Scrim */}
      <div
        className={`${styles.scrim} ${drawerOpen ? styles.scrimOpen : ''}`}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`${styles.drawer} ${drawerOpen ? styles.drawerOpen : ''}`}
        aria-label="Korpa"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className={styles.drawerHeader}>
          <h2 className={styles.drawerTitle}>KORPA · {items.length}</h2>
          <button className={styles.closeBtn} onClick={closeDrawer} aria-label="Zatvori korpu">
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Items */}
        <div className={styles.itemsWrap}>
          {items.length === 0 ? (
            <div className={styles.empty}>
              <ShoppingBag size={48} color="var(--ph-gray-300)" />
              <p>Vaša korpa je trenutno prazna</p>
            </div>
          ) : (
            items.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className={styles.lineItem}>
                <div className={styles.thumb}>
                  <img src={item.img} alt={item.title} />
                </div>
                <div className={styles.lineInfo}>
                  <p className={styles.lineBrand}>{item.brand}</p>
                  <p className={styles.lineTitle}>{item.title}</p>
                  <div className={styles.lineBottom}>
                    <span className={styles.lineQtyPrice}>
                      {item.qty} × {fmtKM(item.price)}
                    </span>
                    <span className={styles.lineTotal}>
                      {fmtKM(item.price * item.qty)}
                    </span>
                  </div>
                </div>
                <button
                  className={styles.removeBtn}
                  onClick={() => removeItem(idx)}
                  aria-label={`Ukloni ${item.title}`}
                >
                  <X size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className={styles.drawerFooter}>
          <div className={styles.totalRow}>
            <span className={styles.totalLabel}>UKUPNO</span>
            <span className={styles.totalPrice}>{fmtKM(totalPrice)}</span>
          </div>

          {nudge > 0 && items.length > 0 && (
            <div className={styles.nudge}>
              Još <strong>{fmtKM(nudge)}</strong> do besplatne dostave!
            </div>
          )}

          <button
            className={styles.checkoutBtn}
            disabled={items.length === 0}
          >
            Nastavi do plaćanja
          </button>
          <button className={styles.continueBtn} onClick={closeDrawer}>
            Nastavi kupovinu
          </button>
        </div>
      </aside>
    </>
  )
}
