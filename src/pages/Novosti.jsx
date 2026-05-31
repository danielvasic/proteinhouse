import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../lib/supabase'

// Static fallback news in case table doesn't exist yet
const FALLBACK_NEWS = [
  {
    id: '1',
    title: 'Novo: Gold Standard Whey 2026 formula',
    excerpt: 'Optimum Nutrition uvodi poboljšanu formulu s 25g proteina po porciji i boljim ukusima.',
    published_at: '2026-05-20T09:00:00Z',
    published: true,
  },
  {
    id: '2',
    title: 'Besplatna dostava produžena do kraja maja',
    excerpt: 'Za sve narudžbe iznad 80 KM do 31. maja dostava je besplatna — bez izuzetaka.',
    published_at: '2026-05-10T09:00:00Z',
    published: true,
  },
  {
    id: '3',
    title: 'Nova prodavnica u Banja Luci otvorena!',
    excerpt: 'Ponosni smo što najavimo otvaranje treće ProteinHouse prodavnice na lokaciji Kralja Petra I 5.',
    published_at: '2026-04-28T09:00:00Z',
    published: true,
  },
]

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('bs', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function Novosti() {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('news')
        .select('id, title, excerpt, content, published_at')
        .eq('published', true)
        .order('published_at', { ascending: false })

      if (error || !data?.length) {
        setNews(FALLBACK_NEWS)
      } else {
        setNews(data)
      }
      setLoading(false)
    }
    load()
  }, [])

  return (
    <>
      <Helmet>
        <title>Vijesti — ProteinHouse</title>
        <meta name="description" content="Najnovije vijesti i novosti iz ProteinHouse — novi proizvodi, akcije, otvaranja prodavnica." />
        <link rel="canonical" href="https://proteinhouse.ba/novosti" />
      </Helmet>

      <main style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}>

        {/* ── Page header ── */}
        <section className="border-b border-gray-200 bg-white">
          <div className="container py-10 md:py-14">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-10 bg-gray-300" />
              <span className="text-[10px] font-bold tracking-[0.22em] uppercase text-gray-400">Šta se dešava</span>
            </div>
            <h1
              className="text-4xl md:text-5xl font-bold text-[#0F2952] uppercase"
              style={{ fontFamily: 'Oswald, Impact, system-ui, sans-serif' }}
            >
              Vijesti
            </h1>
          </div>
        </section>

        {/* ── News list ── */}
        <section className="py-12 bg-gray-50 min-h-[400px]">
          <div className="container max-w-[760px]">
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-[#0F2952] animate-spin" />
              </div>
            ) : (
              <div className="flex flex-col gap-px bg-gray-200">
                {news.map((item) => (
                  <div key={item.id} className="bg-white p-7 md:p-8">
                    <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-gray-400 mb-3">
                      {formatDate(item.published_at)}
                    </p>
                    <h2
                      className="text-xl font-bold text-[#0F2952] uppercase leading-snug mb-3"
                      style={{ fontFamily: 'Oswald, Impact, system-ui, sans-serif' }}
                    >
                      {item.title}
                    </h2>
                    {item.excerpt && (
                      <p className="text-[13px] text-gray-500 leading-relaxed">
                        {item.excerpt}
                      </p>
                    )}
                    {item.content && item.content !== item.excerpt && (
                      <p className="text-[13px] text-gray-600 leading-relaxed mt-3 whitespace-pre-line">
                        {item.content}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

      </main>
    </>
  )
}
