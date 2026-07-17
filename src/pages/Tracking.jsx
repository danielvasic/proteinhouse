import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { House, CaretRight, Check, Package, Gear, Truck, XCircle, MagnifyingGlass } from '@phosphor-icons/react'
import { supabase } from '../lib/supabase'
import { fmtKM } from '../data/catalog'

// Koraci praćenja: Zaprimljena → U obradi → Poslano → Isporučena
const STEPS = [
  { key: 'nova',       label: 'Zaprimljena narudžba', Icon: Package },
  { key: 'u_obradi',   label: 'U obradi',             Icon: Gear },
  { key: 'poslano',    label: 'Poslano',              Icon: Truck },
  { key: 'isporučena', label: 'Isporučena',           Icon: Check },
]

export default function Tracking() {
  const [params] = useSearchParams()
  const [orderNumber, setOrderNumber] = useState(params.get('narudzba') || '')
  const [email,       setEmail]       = useState('')
  const [order,       setOrder]       = useState(null)
  const [notFound,    setNotFound]    = useState(false)
  const [loading,     setLoading]     = useState(false)

  const search = async (e) => {
    e.preventDefault()
    setLoading(true)
    setNotFound(false)
    setOrder(null)
    try {
      const { data, error } = await supabase.rpc('track_order', {
        p_order_number: orderNumber,
        p_email:        email,
      })
      if (error) throw error
      if (data) setOrder(data)
      else setNotFound(true)
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  const stepIndex = order ? STEPS.findIndex((s) => s.key === order.status) : -1
  const cancelled = order?.status === 'otkazana'

  const inputCls = 'w-full border border-gray-300 px-4 py-3 text-[13px] text-[#0F2952] placeholder:text-gray-400 focus:outline-none focus:border-[#0F2952] transition-colors bg-white'

  return (
    <>
      <Helmet>
        <title>Praćenje pošiljke — ProteinHouse</title>
        <meta name="description" content="Pratite status svoje ProteinHouse narudžbe — od zaprimanja do isporuke." />
      </Helmet>

      <main style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}>
        <div className="border-b border-gray-200 bg-white">
          <div className="container py-4">
            <nav className="flex items-center gap-2 text-[11px] text-gray-400" aria-label="Breadcrumb">
              <Link to="/" className="flex items-center gap-1 hover:text-[#0F2952] transition-colors">
                <House size={12} weight="fill" /> Početna
              </Link>
              <CaretRight size={11} className="opacity-40" />
              <span className="text-[#0F2952] font-semibold">Praćenje pošiljke</span>
            </nav>
          </div>
        </div>

        <section className="py-12 bg-gray-50 min-h-[60vh]">
          <div className="container max-w-[640px]">
            <h1
              className="text-3xl font-bold text-[#0F2952] uppercase mb-2"
              style={{ fontFamily: 'Oswald, Impact, system-ui, sans-serif' }}
            >
              Praćenje pošiljke
            </h1>
            <p className="text-[13px] text-gray-500 mb-8">
              Unesite broj narudžbe (iz email potvrde) i email kojim ste naručili.
            </p>

            <form onSubmit={search} className="bg-white border border-gray-200 p-6 space-y-4 mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-[0.14em] uppercase text-gray-500">Broj narudžbe</label>
                  <input className={inputCls} required value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} placeholder="npr. PH-2607-4821" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-[0.14em] uppercase text-gray-500">Email</label>
                  <input className={inputCls} required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vas@email.com" />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#0F2952] text-white text-[11px] font-bold tracking-[0.12em] uppercase hover:bg-[#0A1F42] disabled:opacity-50 transition-colors cursor-pointer border-0"
              >
                <MagnifyingGlass size={14} weight="bold" />
                {loading ? 'Tražim…' : 'Provjeri status'}
              </button>
            </form>

            {notFound && (
              <div className="border border-red-200 bg-red-50 text-red-700 px-5 py-4 text-[13px]">
                Narudžba nije pronađena. Provjerite broj narudžbe i email adresu.
              </div>
            )}

            {order && (
              <div className="bg-white border border-gray-200 p-6 md:p-8">
                <div className="flex items-center justify-between flex-wrap gap-2 mb-8">
                  <div>
                    <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-gray-400 m-0">Narudžba</p>
                    <p className="text-[16px] font-bold text-[#0F2952] m-0">{order.order_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-gray-400 m-0">Ukupno</p>
                    <p className="text-[16px] font-bold text-[#0F2952] m-0">{fmtKM(Number(order.total))}</p>
                  </div>
                </div>

                {cancelled ? (
                  <div className="flex items-center gap-3 border border-red-200 bg-red-50 px-5 py-4">
                    <XCircle size={22} weight="fill" className="text-red-500 shrink-0" />
                    <p className="text-[13px] text-red-700 m-0 font-semibold">Ova narudžba je otkazana.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-0">
                    {STEPS.map(({ key, label, Icon }, i) => {
                      const done    = i <= stepIndex
                      const current = i === stepIndex
                      return (
                        <div key={key} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 shrink-0 transition-colors ${
                              done ? 'bg-[#0F2952] border-[#0F2952] text-white' : 'bg-white border-gray-200 text-gray-300'
                            }`}>
                              {done && !current ? <Check size={15} weight="bold" /> : <Icon size={15} weight={done ? 'fill' : 'regular'} />}
                            </div>
                            {i < STEPS.length - 1 && (
                              <div className={`w-0.5 flex-1 min-h-[28px] ${i < stepIndex ? 'bg-[#0F2952]' : 'bg-gray-200'}`} />
                            )}
                          </div>
                          <div className="pb-6">
                            <p className={`text-[13px] font-bold m-0 ${done ? 'text-[#0F2952]' : 'text-gray-400'}`}>{label}</p>
                            {current && (
                              <p className="text-[11px] text-gray-400 mt-0.5 m-0">
                                Ažurirano: {new Date(order.updated_at).toLocaleDateString('bs-BA')}
                              </p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {Array.isArray(order.items) && order.items.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-gray-100">
                    <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-gray-400 mb-3">Artikli</p>
                    <div className="space-y-2">
                      {order.items.map((it, i) => (
                        <div key={i} className="flex justify-between gap-3 text-[12px]">
                          <span className="text-gray-600 min-w-0 truncate">{it.qty} × {it.brand} {it.title}</span>
                          <span className="font-semibold text-[#0F2952] shrink-0">{fmtKM(it.price * it.qty)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  )
}
