import { useNavigate } from 'react-router-dom'
import { Lightning, Tag } from '@phosphor-icons/react'
import styles from './HeroBanner.module.css'

const HERO_IMAGE = 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1920&q=85&auto=format&fit=crop'

export default function HeroBanner() {
  const navigate = useNavigate()

  return (
    <section
      className={styles.hero}
      style={{
        backgroundImage: `linear-gradient(90deg, rgba(11,35,88,0.74) 0%, rgba(11,35,88,0.40) 55%, rgba(11,35,88,0.05) 100%), url('${HERO_IMAGE}')`,
      }}
    >
      <div className={`container ${styles.content}`}>
        <div className={styles.inner}>
          <p className={styles.eyebrow}>
            <Lightning size={16} weight="fill" /> BLACK FRIDAY 2026
          </p>
          <h1 className={styles.headline}>SNAGA U SVAKOJ MJERICI</h1>
          <p className={styles.body}>
            Do <strong className={styles.saleHighlight}>−70%</strong> na izabrane
            proteinske formule. Besplatna dostava na sve narudžbe preko 100 KM.
          </p>
          <div className={styles.ctas}>
            <button
              className={`${styles.btn} ${styles.btnCoral}`}
              onClick={() => navigate('/kategorija/akcija')}
            >
              <Tag size={18} weight="fill" /> Pogledaj akcije
            </button>
            <button
              className={`${styles.btn} ${styles.btnOutline}`}
              onClick={() => navigate('/kategorija/proteini')}
            >
              Svi proteini
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
