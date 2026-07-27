import { useEffect, useState } from 'react'
import { Star, SealCheck } from '@phosphor-icons/react'
import { supabase } from '../lib/supabase'

function Stars({ value, size = 13 }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          weight={i < Math.round(value) ? 'fill' : 'regular'}
          color={i < Math.round(value) ? '#0145F2' : '#D1D5DB'}
        />
      ))}
    </div>
  )
}

const EMPTY_FORM = { orderNumber: '', email: '', name: '', rating: 5, comment: '' }

/**
 * Recenzije — mogu ih ostaviti samo kupci koji su proizvod kupili online,
 * najranije 15 dana nakon kupovine. Verifikacija: broj narudžbe + email
 * (submit_review RPC provjerava narudžbu, proizvod u njoj i starost).
 */
export default function ReviewSection({ product }) {
  const [reviews,  setReviews]  = useState([])
  const [formOpen, setFormOpen] = useState(false)
  const [form,     setForm]     = useState(EMPTY_FORM)
  const [sending,  setSending]  = useState(false)
  const [result,   setResult]   = useState(null) // { ok, error }

  useEffect(() => {
    supabase
      .from('product_reviews')
      .select('id, customer_name, rating, comment, created_at')
      .eq('product_id', product.id)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => { if (!error && data) setReviews(data) })
  }, [product.id])

  const submit = async (e) => {
    e.preventDefault()
    setSending(true)
    setResult(null)
    try {
      const { data, error } = await supabase.rpc('submit_review', {
        p_order_number: form.orderNumber,
        p_email:        form.email,
        p_product_id:   product.id,
        p_name:         form.name,
        p_rating:       form.rating,
        p_comment:      form.comment,
      })
      if (error) throw error
      if (data?.ok) {
        setResult({ ok: true })
        setForm(EMPTY_FORM)
        setFormOpen(false)
        const { data: fresh } = await supabase
          .from('product_reviews')
          .select('id, customer_name, rating, comment, created_at')
          .eq('product_id', product.id)
          .eq('is_approved', true)
          .order('created_at', { ascending: false })
        if (fresh) setReviews(fresh)
      } else {
        setResult({ ok: false, error: data?.error || 'Recenzija nije prihvaćena.' })
      }
    } catch (err) {
      setResult({ ok: false, error: err.message || 'Greška pri slanju recenzije.' })
    } finally {
      setSending(false)
    }
  }

  const inputCls = 'w-full border border-gray-300 px-3.5 py-2.5 text-[13px] text-[#0A0E17] placeholder:text-gray-400 focus:outline-none focus:border-[#0145F2] transition-colors bg-white'

  return (
    <section className="py-12 bg-white border-t border-gray-200" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="container max-w-[860px]">
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h2
              className="text-xl md:text-2xl font-bold text-[#0A0E17] uppercase m-0"
              style={{ fontFamily: "'Exo 2', system-ui, sans-serif" }}
            >
              Recenzije kupaca
            </h2>
            {product.rating > 0 && reviews.length > 0 && (
              <div className="flex items-center gap-2 mt-1.5">
                <Stars value={product.rating} />
                <span className="text-[12px] text-gray-400">{product.rating} · {reviews.length} recenzija</span>
              </div>
            )}
          </div>
          <button
            className="px-5 py-2.5 border border-[#0145F2] text-[#0A0E17] bg-transparent text-[11px] font-bold tracking-[0.1em] uppercase hover:bg-[#0145F2] hover:text-white transition-all cursor-pointer"
            onClick={() => { setFormOpen((o) => !o); setResult(null) }}
          >
            {formOpen ? 'Zatvori' : 'Ocijeni proizvod'}
          </button>
        </div>

        <p className="flex items-center gap-2 text-[11px] text-gray-400 mb-6">
          <SealCheck size={14} weight="fill" className="text-[#0A0E17] shrink-0" />
          Recenziju mogu ostaviti samo kupci koji su ovaj proizvod kupili online, najranije 15 dana nakon kupovine.
        </p>

        {result && (
          <div className={`px-4 py-3 mb-5 text-[13px] border ${result.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'}`}>
            {result.ok ? 'Hvala! Vaša recenzija je objavljena.' : result.error}
          </div>
        )}

        {formOpen && (
          <form onSubmit={submit} className="border border-gray-200 bg-[#F2F4F7] p-5 md:p-6 mb-8 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-[0.14em] uppercase text-gray-500">Broj narudžbe *</label>
                <input className={inputCls} required value={form.orderNumber} onChange={(e) => setForm((f) => ({ ...f, orderNumber: e.target.value }))} placeholder="npr. PH-2607-4821" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-[0.14em] uppercase text-gray-500">Email iz narudžbe *</label>
                <input className={inputCls} required type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="vas@email.com" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-[0.14em] uppercase text-gray-500">Vaše ime</label>
                <input className={inputCls} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Ime (prikazuje se uz recenziju)" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold tracking-[0.14em] uppercase text-gray-500">Ocjena *</label>
                <div className="flex items-center gap-1 py-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      className="bg-transparent border-0 p-0.5 cursor-pointer"
                      onClick={() => setForm((f) => ({ ...f, rating: i + 1 }))}
                      aria-label={`${i + 1} od 5`}
                    >
                      <Star size={22} weight={i < form.rating ? 'fill' : 'regular'} color={i < form.rating ? '#0145F2' : '#D1D5DB'} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold tracking-[0.14em] uppercase text-gray-500">Komentar</label>
              <textarea className={`${inputCls} resize-none`} rows={3} value={form.comment} onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))} placeholder="Kako vam se sviđa proizvod?" />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="px-8 py-3 bg-[#0145F2] text-white text-[11px] font-bold tracking-[0.12em] uppercase hover:bg-[#0136C4] disabled:opacity-50 transition-colors cursor-pointer border-0"
            >
              {sending ? 'Šalje se…' : 'Objavi recenziju'}
            </button>
          </form>
        )}

        {reviews.length === 0 ? (
          <p className="text-[13px] text-gray-400 py-6 text-center border border-dashed border-gray-200">
            Još nema recenzija za ovaj proizvod.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {reviews.map((r) => (
              <div key={r.id} className="py-5">
                <div className="flex items-center gap-2.5 mb-1.5 flex-wrap">
                  <Stars value={r.rating} size={12} />
                  <span className="text-[13px] font-bold text-[#0A0E17]">{r.customer_name}</span>
                  <span className="flex items-center gap-1 text-[10px] font-bold tracking-[0.08em] uppercase text-emerald-600">
                    <SealCheck size={12} weight="fill" /> Verificirana kupovina
                  </span>
                  <span className="text-[11px] text-gray-400 ml-auto">
                    {new Date(r.created_at).toLocaleDateString('bs-BA')}
                  </span>
                </div>
                {r.comment && <p className="text-[13px] text-gray-600 leading-relaxed m-0">{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
