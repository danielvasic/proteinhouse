import { useEffect, useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../lib/supabase'
import { BODY, DISPLAY } from '../lib/typography'

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('bs', { day: 'numeric', month: 'long', year: 'numeric' })
}

export default function Novosti() {
  const [news,    setNews]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(false)

  useEffect(() => {
    supabase
      .from('news')
      .select('id, title, excerpt, content, published_at')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (err) setError(true)
        else setNews(data ?? [])
        setLoading(false)
      })
  }, [])

  return (
    <>
      <Helmet>
        <title>Vijesti — ProteinHouse</title>
        <meta name="description" content="Najnovije vijesti i novosti iz ProteinHouse — novi proizvodi, akcije, otvaranja prodavnica." />
        <link rel="canonical" href="https://proteinhouse.ba/novosti" />
      </Helmet>

      <main style={BODY}>

        <section className="border-b border-gray-200 bg-white">
          <div className="container py-10 md:py-14">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-10 bg-gray-300" />
              <span className="text-[10px] font-bold tracking-[0.22em] text-gray-400">Šta se dešava</span>
            </div>
            <h1
              className="text-4xl md:text-5xl font-bold text-[#1e272e] uppercase"
              style={DISPLAY}
            >
              Vijesti
            </h1>
          </div>
        </section>

        <section className="py-12 bg-[#edf1f5] min-h-[400px]">
          <div className="container max-w-[760px]">
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-[#0145F2] animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center py-16">
                <p className="text-[13px] text-gray-400">Nije moguće učitati vijesti.</p>
              </div>
            ) : news.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-[15px] font-bold text-[#1e272e] mb-2" style={DISPLAY}>
                  Nema vijesti
                </p>
                <p className="text-[13px] text-gray-400">Uskoro dolaze novosti.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {news.map((item) => (
                  <div key={item.id} className="bg-white border border-gray-200 p-7 md:p-8">
                    <p className="text-[10px] font-bold tracking-[0.16em] text-gray-400 mb-3">
                      {formatDate(item.published_at)}
                    </p>
                    <h2
                      className="text-xl font-bold text-[#1e272e] leading-snug mb-3"
                      style={DISPLAY}
                    >
                      {item.title}
                    </h2>
                    {item.excerpt && (
                      <p className="text-[13px] text-gray-500 leading-relaxed">{item.excerpt}</p>
                    )}
                    {item.content && item.content !== item.excerpt && (
                      <p className="text-[13px] text-gray-600 leading-relaxed mt-3 whitespace-pre-line">{item.content}</p>
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
