import { useNavigate } from 'react-router-dom'
import styles from './CategoryStrip.module.css'

const BANNERS = [
  {
    tag: 'NOVO',
    title: 'NAJNOVIJE',
    sub: 'Tek pristigli proizvodi',
    img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=900&q=80&auto=format&fit=crop',
    slug: 'proteini',
  },
  {
    tag: 'OUTLET',
    title: 'DO −70%',
    sub: 'Posljednje količine',
    img: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=900&q=80&auto=format&fit=crop',
    slug: 'akcija',
  },
  {
    tag: 'AKCIJA',
    title: 'BLACK FRIDAY',
    sub: 'Cijela sedmica popusta',
    img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=900&q=80&auto=format&fit=crop',
    slug: 'akcija',
  },
]

export default function CategoryStrip() {
  const navigate = useNavigate()

  return (
    <section className={styles.section}>
      <div className={`container ${styles.grid}`}>
        {BANNERS.map((b) => (
          <div
            key={b.tag}
            className={styles.banner}
            style={{
              backgroundImage: `linear-gradient(180deg, rgba(15,41,82,0.45) 0%, rgba(15,41,82,0.78) 100%), url('${b.img}')`,
            }}
            onClick={() => navigate(`/kategorija/${b.slug}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate(`/kategorija/${b.slug}`)}
          >
            <span className={styles.tag}>{b.tag}</span>
            <div>
              <h3 className={styles.title}>{b.title}</h3>
              <p className={styles.sub}>{b.sub}</p>
            </div>
            <button className={styles.cta}>POGLEDAJ</button>
          </div>
        ))}
      </div>
    </section>
  )
}
