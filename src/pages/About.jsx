import { Helmet } from 'react-helmet-async'
import { ShieldCheck, Truck, Star, Users, MapPin, Clock, Phone, Envelope } from '@phosphor-icons/react'
import { useSiteContent } from '../hooks/useSiteContent'
import { useStores } from '../hooks/useStores'

const VALUES = [
  { Icon: ShieldCheck, title: 'Originalnost', desc: 'Svi naši proizvodi su 100% originalni s certifikatima proizvođača i garantiranom autentičnošću.' },
  { Icon: Truck,       title: 'Brza dostava', desc: 'Isporuka unutar 1–3 radna dana na cijelu teritoriju Bosne i Hercegovine.' },
  { Icon: Star,        title: 'Lojalnost',    desc: 'Za svaku kupovinu sakupljate bodove i ostvarujete dodatne popuste na buduće narudžbe.' },
  { Icon: Users,       title: 'Stručnost',    desc: 'Naš tim čine certificirani nutricionisti i fitness treneri koji vam pomažu pri odabiru.' },
]

const STAT_KEYS = [
  'about_stat_1_value', 'about_stat_1_label',
  'about_stat_2_value', 'about_stat_2_label',
  'about_stat_3_value', 'about_stat_3_label',
  'about_stat_4_value', 'about_stat_4_label',
]
const STAT_DEFAULTS = {
  about_stat_1_value: '10+',      about_stat_1_label: 'Godina iskustva',
  about_stat_2_value: '50.000+',  about_stat_2_label: 'Zadovoljnih kupaca',
  about_stat_3_value: '2.000+',   about_stat_3_label: 'Proizvoda u ponudi',
  about_stat_4_value: '80+',      about_stat_4_label: 'Brendova',
}

export default function About() {
  const { data }           = useSiteContent(['about_hero_image', 'about_intro', ...STAT_KEYS], STAT_DEFAULTS)
  const { stores, loading: storesLoading } = useStores()

  const stats = [1, 2, 3, 4].map((n) => ({
    value: data[`about_stat_${n}_value`] || '',
    label: data[`about_stat_${n}_label`] || '',
  })).filter((s) => s.value)

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
            <p className="text-[15px] text-gray-600 leading-[1.8] whitespace-pre-line">
              {data.about_intro || 'ProteinHouse je osnovan s jednim ciljem — omogućiti svim sportašima i fitness entuzijastima u Bosni i Hercegovini pristup originalnim, kvalitetnim suplementima po fer cijenama.'}
            </p>
          </div>
        </section>

        {/* ── Stats (samo ako postoje u bazi) ── */}
        {stats.length > 0 && (
          <section className="bg-[#0F2952] py-12 md:py-16">
            <div className="container">
              <div
                className="grid gap-px bg-white/10"
                style={{ gridTemplateColumns: `repeat(${Math.min(stats.length, 4)}, 1fr)` }}
              >
                {stats.map((s) => (
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
        )}

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

        {/* ── Poslovnice (samo ako postoje u bazi) ── */}
        {!storesLoading && stores.length > 0 && (
          <section className="py-14 md:py-20 bg-gray-50">
            <div className="container">
              <div className="flex items-center gap-4 mb-10">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-[10px] font-bold tracking-[0.22em] uppercase text-gray-400">
                  {stores.length === 1 ? 'Naša poslovnica' : 'Naše poslovnice'}
                </span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>
              <div
                className="grid gap-px bg-gray-200"
                style={{ gridTemplateColumns: `repeat(${Math.min(stores.length, 3)}, 1fr)` }}
              >
                {stores.map((s) => (
                  <div key={s.id} className="bg-white p-8">
                    <h3
                      className="text-xl font-bold text-[#0F2952] mb-5 uppercase"
                      style={{ fontFamily: 'Oswald, Impact, system-ui, sans-serif' }}
                    >
                      {s.city}
                    </h3>
                    <div className="flex flex-col gap-3">
                      {s.address && (
                        <div className="flex items-start gap-2.5">
                          <MapPin size={14} weight="fill" className="text-gray-400 mt-0.5 shrink-0" />
                          <span className="text-[13px] text-gray-600">{s.address}</span>
                        </div>
                      )}
                      {s.working_hours && (
                        <div className="flex items-start gap-2.5">
                          <Clock size={14} weight="fill" className="text-gray-400 mt-0.5 shrink-0" />
                          <span className="text-[13px] text-gray-600">{s.working_hours}</span>
                        </div>
                      )}
                      {s.phone && (
                        <div className="flex items-start gap-2.5">
                          <Phone size={14} weight="fill" className="text-gray-400 mt-0.5 shrink-0" />
                          <span className="text-[13px] text-gray-600">{s.phone}</span>
                        </div>
                      )}
                      {s.email && (
                        <div className="flex items-start gap-2.5">
                          <Envelope size={14} weight="fill" className="text-gray-400 mt-0.5 shrink-0" />
                          <span className="text-[13px] text-gray-600">{s.email}</span>
                        </div>
                      )}
                      {s.map_url && (
                        <a
                          href={s.map_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-[0.1em] uppercase text-[#0F2952] border-b border-[#0F2952] pb-px w-fit hover:opacity-60 transition-opacity mt-1"
                        >
                          <MapPin size={11} /> Prikaži na mapi
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

      </main>
    </>
  )
}
