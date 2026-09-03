import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { ArrowRight } from '@phosphor-icons/react'
import { supabase } from '../lib/supabase'
import { BODY, DISPLAY } from '../lib/typography'
import { fmtDatumDugi } from '../lib/date'

function formatDate(iso) {
  if (!iso) return ''
  return fmtDatumDugi(iso)
}

export default function Blog() {
  const [posts,   setPosts]   = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('blog_posts')
      .select('id, slug, title, excerpt, cover_url, author, published_at, created_at')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .then(({ data, error }) => {
        if (!error && data) setPosts(data)
        setLoading(false)
      })
  }, [])

  return (
    <>
      <Helmet>
        <title>Blog — ProteinHouse</title>
        <meta name="description" content="Savjeti o suplementima, prehrani i treningu od ProteinHouse stručnjaka." />
        <link rel="canonical" href="https://proteinhouse.ba/blog" />
      </Helmet>

      <main style={BODY}>

        {/* ── Page header ── */}
        <section className="border-b border-gray-200 bg-white">
          <div className="container py-10 md:py-14">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-10 bg-gray-300" />
              <span className="text-[10px] font-bold tracking-[0.22em] text-gray-400">Savjeti i vijesti</span>
            </div>
            <h1
              className="text-4xl md:text-5xl font-bold text-[#1e272e] uppercase"
              style={DISPLAY}
            >
              Blog
            </h1>
          </div>
        </section>

        {/* ── Posts ── */}
        <section className="py-12 md:py-16 bg-[#edf1f5] min-h-[400px]">
          <div className="container">
            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-[#0145F2] animate-spin" />
              </div>
            ) : posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
                <p className="text-[15px] font-bold text-[#1e272e]" style={DISPLAY}>
                  Nema objavljenih postova
                </p>
                <p className="text-[13px] text-gray-400">Uskoro dolaze novi sadržaji.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
                {posts.map((post) => (
                  <article key={post.id} className="bg-white border border-gray-200 flex flex-col group hover:shadow-md transition-shadow duration-200">

                    {/* Image */}
                    <div className="relative overflow-hidden bg-gray-100" style={{ paddingBottom: '60%' }}>
                      {post.cover_url ? (
                        <img
                          src={post.cover_url}
                          alt={post.title}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-300 text-sm">
                          Nema slike
                        </div>
                      )}
                    </div>

                    {/* Body */}
                    <div className="flex flex-col flex-1 p-6">
                      <p className="text-[11px] text-gray-400 mb-3">
                        {formatDate(post.published_at || post.created_at)}
                        {post.author && <> · {post.author}</>}
                      </p>
                      <h2
                        className="text-[18px] font-bold text-[#1e272e] leading-snug mb-3"
                        style={DISPLAY}
                      >
                        {post.title}
                      </h2>
                      {post.excerpt && (
                        <p className="text-[13px] text-gray-500 leading-relaxed mb-6 flex-1">{post.excerpt}</p>
                      )}
                      <Link
                        to={`/blog/${post.slug}`}
                        className="flex items-center gap-2 text-[11px] font-bold tracking-[0.1em] text-[#1e272e] border-b border-[#0145F2] pb-px w-fit hover:opacity-60 transition-opacity duration-150"
                      >
                        Pročitaj više <ArrowRight size={12} weight="bold" />
                      </Link>
                    </div>

                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

      </main>
    </>
  )
}
