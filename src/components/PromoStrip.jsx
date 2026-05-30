import { Truck, ShieldCheck, Star, Gift } from '@phosphor-icons/react'
import styles from './PromoStrip.module.css'

const ITEMS = [
  { Icon: Truck, title: 'Besplatna dostava', sub: 'Za pošiljke preko 100 KM' },
  { Icon: ShieldCheck, title: '100% sigurna kupovina', sub: 'SSL · originalni proizvodi' },
  { Icon: Star, title: 'Bodovi lojalnosti', sub: 'Za svaku kupovinu' },
  { Icon: Gift, title: 'Pokloni za kupovinu', sub: 'Odaberi pri narudžbi' },
]

export default function PromoStrip() {
  return (
    <section className={styles.strip}>
      <div className={`container ${styles.grid}`}>
        {ITEMS.map(({ Icon, title, sub }) => (
          <div key={title} className={styles.item}>
            <div className={styles.iconWrap}>
              <Icon size={26} weight="duotone" color="var(--ph-navy-700)" />
            </div>
            <div>
              <p className={styles.title}>{title}</p>
              <p className={styles.sub}>{sub}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
