import { Helmet } from 'react-helmet-async'
import { ShieldCheck, Truck, Star, Users, MapPin, Clock } from '@phosphor-icons/react'
import { useSiteContent } from '../hooks/useSiteContent'

const STATS = [
  { label: 'Godina iskustva', value: '10+' },
  { label: 'Zadovoljnih kupaca', value: '50.000+' },
  { label: 'Proizvoda u ponudi', value: '2.000+' },
  { label: 'Brendova', value: '80+' },
]

const VALUES = [
  { Icon: ShieldCheck, title: 'Originalnost', desc: 'Svi naši proizvodi su 100% originalni s certifikatima proizvođača i garantiranom autentičnošću.' },
  { Icon: Truck,       title: 'Brza dostava', desc: 'Isporuka unutar 1–3 radna dana na cijelu teritoriju Bosne i Hercegovine.' },
  { Icon: Star,        title: 'Lojalnost',    desc: 'Za svaku kupovinu sakupljate bodove i ostvarujete dodatne popuste na buduće narudžbe.' },
  { Icon: Users,       title: 'Stručnost',    desc: 'Naš tim čine certificirani nutricionisti i fitness treneri koji vam pomažu pri odabiru.' },
]


// Hero slika se konfigurira u admin /sadrzaj → O nama
// Polje: about_hero_image (URL iz Supabase Storage)

export default function About() {
  const { data } = useSiteContent(
    ['about_hero_image', 'store_sarajevo_addr', 'store_sarajevo_hours',
     'store_mostar_addr', 'store_mostar_hours', 'store_bl_addr', 'store_bl_hours'],
    {}
  )

  const STORES = [
    { city: 'Sarajevo',   addr: data.store_sarajevo_addr || 'Maršala Tita 28', hours: data.store_sarajevo_hours || 'PON–PET 9–17 · SUB 9–14' },
    { city: 'Mostar',     addr: data.store_mostar_addr   || 'Bulevar 12',       hours: data.store_mostar_hours   || 'PON–PET 9–17 · SUB 9–13' },
    { city: 'Banja Luka', addr: data.store_bl_addr       || 'Kralja Petra I 5', hours: data.store_bl_hours       || 'PON–PET 9–17 · SUB 9–14' },
  ]

  return (
    <>
      <Helmet>
        <title>O nama — ProteinHouse</title>
        <meta name="description" content="Saznajte više o ProteinHouse — vodećem online prodavaonici proteina i suplementa u Bosni i Hercegovini." />
        <link rel="canonical" href="https://proteinhouse.ba/o-nama" />
      </Helmet>

      <main style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}>

        {/* ── Hero ── */}
        <section
          className="relative flex items-end min-h-[340px] md:min-h-[420px] bg-cover bg-center"
          style={{
            backgroundImage: data.about_hero_image
              ? `linear-gradient(105deg, rgba(10,31,66,0.94) 0%, rgba(10,31,66,0.60) 60%, rgba(10,31,66,0.20) 100%), url('${data.about_hero_image}')`
              : 'linear-gradient(135deg, #0A1F42 0%, #0F2952 60%, #1F4399 100%)',
          }}
        >
          <div className="container pb-12 md:pb-16">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px w-10 bg-white/35" />
              <span className="text-[11px] font-bold tracking-[0.22em] uppercase text-white/55">Naša priča</span>
            </div>
            <h1
              className="text-4xl md:text-5xl font-bold text-white uppercase leading-tight"
              style={{ fontFamily: 'Oswald, Impact, system-ui, sans-serif' }}
            >
              O nama
            </h1>
          </div>
        </section>

        {/* ── Intro ── */}
        <section className="py-14 md:py-16 border-b border-gray-200">
          <div className="container max-w-[720px]">
            <p className="text-[15px] text-gray-600 leading-[1.8]">
              ProteinHouse je osnovan s jednim ciljem — omogućiti svim sportašima i fitness entuzijastima
              u Bosni i Hercegovini pristup originalnim, kvalitetnim suplementima po fer cijenama.
              Od <strong className="text-[#0F2952] font-bold">2015. godine</strong> gradimo povjerenje
              jednom narudžbom u isto vrijeme.
            </p>
          </div>
        </section>

        {/* ── Stats ── */}
        <section className="bg-[#0F2952] py-12 md:py-16">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/10">
              {STATS.map((s) => (
                <div key={s.label} className="bg-[#0F2952] flex flex-col items-center justify-center py-10 px-6 text-center">
                  <span
                    className="text-4xl md:text-5xl font-bold text-white leading-none mb-2"
                    style={{ fontFamily: 'Oswald, Impact, system-ui, sans-serif' }}
                  >
                    {s.value}
                  </span>
                  <span className="text-[11px] font-bold tracking-[0.14em] uppercase text-white/45">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Values ── */}
        <section className="py-14 md:py-20 border-b border-gray-200">
          <div className="container">
            <div className="flex items-center gap-4 mb-10">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-[10px] font-bold tracking-[0.22em] uppercase text-gray-400">Naše vrijednosti</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-px bg-gray-200">
              {VALUES.map(({ Icon, title, desc }) => (
                <div key={title} className="bg-white p-8">
                  <Icon size={26} weight="duotone" color="#0F2952" className="mb-5 opacity-70" />
                  <h3
                    className="text-[15px] font-bold text-[#0F2952] mb-3 uppercase"
                    style={{ fontFamily: 'Oswald, Impact, system-ui, sans-serif' }}
                  >
                    {title}
                  </h3>
                  <p className="text-[13px] text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Stores ── */}
        <section className="py-14 md:py-20 bg-gray-50">
          <div className="container">
            <div className="flex items-center gap-4 mb-10">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-[10px] font-bold tracking-[0.22em] uppercase text-gray-400">Naše prodavnice</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-gray-200">
              {STORES.map((s) => (
                <div key={s.city} className="bg-white p-8">
                  <h3
                    className="text-xl font-bold text-[#0F2952] mb-4 uppercase"
                    style={{ fontFamily: 'Oswald, Impact, system-ui, sans-serif' }}
                  >
                    {s.city}
                  </h3>
                  <div className="flex items-start gap-2.5 mb-2.5">
                    <MapPin size={14} weight="fill" className="text-gray-400 mt-0.5 shrink-0" />
                    <span className="text-[13px] text-gray-600">{s.addr}</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <Clock size={14} weight="fill" className="text-gray-400 mt-0.5 shrink-0" />
                    <span className="text-[13px] text-gray-600">{s.hours}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>
    </>
  )
}
