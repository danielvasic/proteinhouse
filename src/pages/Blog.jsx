import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { ArrowRight } from '@phosphor-icons/react'

const POSTS = [
  {
    id: 1,
    slug: 'kako-odabrati-pravi-protein',
    title: 'Kako odabrati pravi protein za vaše ciljeve?',
    excerpt: 'Whey, kazein, veganski protein — koji je pravi za vas? Objašnjavamo razlike i pomažemo vam da napravite pravi izbor.',
    category: 'Savjeti',
    date: '15. maj 2026',
    readTime: '5 min',
    img: 'https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=800&q=80&auto=format&fit=crop',
  },
  {
    id: 2,
    slug: 'kreatin-vodic',
    title: 'Kompletan vodič za kreatin: sve što trebate znati',
    excerpt: 'Kreatin monohidrat, HCl, bufor — razlikujemo vrste i objašnjavamo kako pravilno koristiti ovaj suplement.',
    category: 'Suplementi',
    date: '8. maj 2026',
    readTime: '8 min',
    img: 'https://images.unsplash.com/photo-1610725664285-7c57e6eeac3f?w=800&q=80&auto=format&fit=crop',
  },
  {
    id: 3,
    slug: 'prehrana-za-masu',
    title: 'Prehrana za povećanje mišićne mase',
    excerpt: 'Kalorijski suficit, makronutrijenti i timing obroka — kako optimizirati prehranu za maksimalan rast mišića.',
    category: 'Prehrana',
    date: '2. maj 2026',
    readTime: '6 min',
    img: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80&auto=format&fit=crop',
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

      <main style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}>

        {/* ── Page header ── */}
        <section className="border-b border-gray-200 bg-white">
          <div className="container py-10 md:py-14">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-10 bg-gray-300" />
              <span className="text-[10px] font-bold tracking-[0.22em] uppercase text-gray-400">Savjeti i vijesti</span>
            </div>
            <h1
              className="text-4xl md:text-5xl font-bold text-[#0F2952] uppercase"
              style={{ fontFamily: 'Oswald, Impact, system-ui, sans-serif' }}
            >
              Blog
            </h1>
          </div>
        </section>

        {/* ── Posts ── */}
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-gray-200">
              {POSTS.map((post) => (
                <article key={post.id} className="bg-white flex flex-col group">

                  {/* Image */}
                  <div className="relative overflow-hidden" style={{ paddingBottom: '60%' }}>
                    <img
                      src={post.img}
                      alt={post.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <span className="absolute top-4 left-4 px-2.5 py-1 border border-white/60 text-white text-[10px] font-bold tracking-[0.14em] uppercase bg-[#0F2952]/60 backdrop-blur-sm">
                      {post.category}
                    </span>
                  </div>

                  {/* Body */}
                  <div className="flex flex-col flex-1 p-6">
                    <p className="text-[11px] text-gray-400 mb-3">
                      {post.date} · {post.readTime} čitanja
                    </p>
                    <h2
                      className="text-[18px] font-bold text-[#0F2952] leading-snug mb-3 uppercase"
                      style={{ fontFamily: 'Oswald, Impact, system-ui, sans-serif' }}
                    >
                      {post.title}
                    </h2>
                    <p className="text-[13px] text-gray-500 leading-relaxed mb-6 flex-1">{post.excerpt}</p>
                    <Link
                      to={`/blog/${post.slug}`}
                      className="flex items-center gap-2 text-[11px] font-bold tracking-[0.1em] uppercase text-[#0F2952] border-b border-[#0F2952] pb-px w-fit hover:opacity-60 transition-opacity duration-150"
                    >
                      Pročitaj više <ArrowRight size={12} weight="bold" />
                    </Link>
                  </div>

                </article>
              ))}
            </div>
          </div>
        </section>

      </main>
    </>
  )
}
