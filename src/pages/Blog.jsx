import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import styles from './Blog.module.css'

const POSTS = [
  {
    id: 1,
    slug: 'kako-odabrati-pravi-protein',
    title: 'Kako odabrati pravi protein za vaše ciljeve?',
    excerpt: 'Whey, kazein, veganski protein — koji je pravi za vas? Objašnjavamo razlike i pomažemo vam da napravite pravi izbor.',
    category: 'Savjeti',
    date: '15. maj 2026',
    readTime: '5 min',
    img: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=600&q=80&auto=format&fit=crop',
  },
  {
    id: 2,
    slug: 'kreatin-vodic',
    title: 'Kompletan vodič za kreatin: sve što trebate znati',
    excerpt: 'Kreatin monohidrat, HCl, bufor — razlikujemo vrste i objašnjavamo kako pravilno koristiti ovaj suplement.',
    category: 'Suplementi',
    date: '8. maj 2026',
    readTime: '8 min',
    img: 'https://images.unsplash.com/photo-1610725664285-7c57e6eeac3f?w=600&q=80&auto=format&fit=crop',
  },
  {
    id: 3,
    slug: 'prehrana-za-masu',
    title: 'Prehrana za povećanje mišićne mase',
    excerpt: 'Kalorijski suficit, makronutrijenti i timing obroka — kako optimizirati prehranu za maksimalan rast mišića.',
    category: 'Prehrana',
    date: '2. maj 2026',
    readTime: '6 min',
    img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80&auto=format&fit=crop',
  },
]

export default function Blog() {
  return (
    <>
      <Helmet>
        <title>Blog — ProteinHouse</title>
        <meta name="description" content="Savjeti o suplementima, prehrani i treningu od ProteinHouse stručnjaka." />
        <link rel="canonical" href="https://proteinhouse.ba/blog" />
      </Helmet>

      <main className={styles.main}>
        <div className="container">
          <div className={styles.pageHeader}>
            <p className={styles.eyebrow}>SAVJETI I VIJESTI</p>
            <h1 className={styles.heading}>BLOG</h1>
          </div>

          <div className={styles.grid}>
            {POSTS.map((post) => (
              <article key={post.id} className={styles.card}>
                <div className={styles.imgWrap}>
                  <img src={post.img} alt={post.title} className={styles.img} loading="lazy" />
                  <span className={styles.category}>{post.category}</span>
                </div>
                <div className={styles.body}>
                  <div className={styles.meta}>
                    <span>{post.date}</span>
                    <span>·</span>
                    <span>{post.readTime} čitanja</span>
                  </div>
                  <h2 className={styles.title}>{post.title}</h2>
                  <p className={styles.excerpt}>{post.excerpt}</p>
                  <Link to={`/blog/${post.slug}`} className={styles.readMore}>
                    Pročitaj više →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
