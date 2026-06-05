import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { House, CaretRight, Check, Truck, ShieldCheck, UserCircle, LockKey, Envelope } from '@phosphor-icons/react'
import { useCart } from '../store/CartContext'
import { fmtKM } from '../data/catalog'
import { supabase } from '../lib/supabase'

const STEPS = ['Dostava', 'Pregled', 'Potvrda']

const EMPTY_FORM = {
  firstName: '', lastName: '', email: '', phone: '',
  address: '', city: '', zip: '', notes: '',
}

function genOrderNumber() {
  const now  = new Date()
  const yy   = String(now.getFullYear()).slice(-2)
  const mm   = String(now.getMonth() + 1).padStart(2, '0')
  const rand = Math.floor(Math.random() * 9000 + 1000)
  return `PH-${yy}${mm}-${rand}`
}

function inputCls(error) {
  return `w-full border ${error ? 'border-red-400' : 'border-gray-300'} px-4 py-3 text-[13px] text-[#0F2952] placeholder:text-gray-400 focus:outline-none focus:border-[#0F2952] transition-colors duration-150 bg-white`
}

function StepIndicator({ current }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center">
          <div className={`flex items-center gap-2 px-1 ${i <= current ? 'text-[#0F2952]' : 'text-gray-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-colors ${
              i < current  ? 'bg-[#0F2952] border-[#0F2952] text-white' :
              i === current ? 'border-[#0F2952] text-[#0F2952] bg-white' :
              'border-gray-300 text-gray-400 bg-white'
            }`}>
              {i < current ? <Check size={12} weight="bold" /> : i + 1}
            </div>
            <span className="text-[11px] font-bold tracking-[0.1em] uppercase hidden sm:inline">{label}</span>
          </div>
          {i < STEPS.length - 1 && <div className={`h-px w-8 md:w-16 ${i < current ? 'bg-[#0F2952]' : 'bg-gray-200'}`} />}
        </div>
      ))}
    </div>
  )
}

function OrderSummary({ items, totalPrice }) {
  const shipping = totalPrice >= 100 ? 0 : 7
  return (
    <div className="border border-gray-200 bg-white p-6 space-y-4">
      <h3 className="text-[11px] font-bold tracking-[0.16em] uppercase text-gray-500">Pregled narudžbe</h3>
      <div className="divide-y divide-gray-100">
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-3 py-3">
            <div className="w-12 h-12 border border-gray-200 bg-gray-50 shrink-0 overflow-hidden">
              <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-gray-400 font-bold uppercase tracking-wide">{item.brand}</p>
              <p className="text-[12px] font-semibold text-[#0F2952] leading-tight truncate">{item.title}</p>
              {item.selectedSize   && <p className="text-[10px] text-gray-400">{item.selectedSize}</p>}
              {item.selectedFlavor && <p className="text-[10px] text-gray-400">{item.selectedFlavor}</p>}
            </div>
            <div className="text-right shrink-0">
              <p className="text-[12px] font-bold text-[#0F2952]">{fmtKM(item.price * item.qty)}</p>
              <p className="text-[10px] text-gray-400">{item.qty} × {fmtKM(item.price)}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="pt-2 space-y-1.5 border-t border-gray-200">
        <div className="flex justify-between text-[12px] text-gray-500">
          <span>Međuzbir</span><span>{fmtKM(totalPrice)}</span>
        </div>
        <div className="flex justify-between text-[12px] text-gray-500">
          <span>Dostava</span>
          <span>{shipping === 0 ? <span className="text-[#0F2952] font-semibold">BESPLATNO</span> : fmtKM(shipping)}</span>
        </div>
        <div className="flex justify-between text-[15px] font-bold text-[#0F2952] pt-2 border-t border-gray-200">
          <span>UKUPNO</span><span>{fmtKM(totalPrice + shipping)}</span>
        </div>
      </div>
    </div>
  )
}

export default function Checkout() {
  const navigate = useNavigate()
  const { items, totalPrice, clearCart } = useCart()
  const [step,      setStep]      = useState(0)
  const [form,      setForm]      = useState(EMPTY_FORM)
  const [errors,    setErrors]    = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [orderNum,  setOrderNum]  = useState('')

  // Auth state
  const [user,          setUser]          = useState(null)
  const [loginOpen,     setLoginOpen]     = useState(false)
  const [loginData,     setLoginData]     = useState({ email: '', password: '' })
  const [loginError,    setLoginError]    = useState('')
  const [loginLoading,  setLoginLoading]  = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) prefillFromUser(session.user)
    })
  }, [])

  const prefillFromUser = (u) => {
    setUser(u)
    const meta = u.user_metadata || {}
    const nameParts = (meta.full_name || '').trim().split(' ')
    setForm((f) => ({
      ...f,
      firstName: nameParts[0]                   || f.firstName,
      lastName:  nameParts.slice(1).join(' ')   || f.lastName,
      email:     u.email                        || f.email,
    }))
  }

  const handleCheckoutLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email, password: loginData.password,
      })
      if (error) throw error
      prefillFromUser(data.user)
      setLoginOpen(false)
      setLoginData({ email: '', password: '' })
    } catch (err) {
      setLoginError(err.message || 'Greška pri prijavi.')
    } finally {
      setLoginLoading(false)
    }
  }

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    if (errors[key]) setErrors((e) => ({ ...e, [key]: '' }))
  }

  const shipping = totalPrice >= 100 ? 0 : 7
  const total    = totalPrice + shipping

  if (items.length === 0 && step < 2) {
    return (
      <main className="container py-20 text-center" style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}>
        <p className="text-[15px] text-gray-500 mb-4">Vaša korpa je prazna.</p>
        <Link to="/" className="inline-block px-6 py-3 border border-[#0F2952] text-[#0F2952] text-[11px] font-bold tracking-[0.1em] uppercase hover:bg-[#0F2952] hover:text-white transition-all">
          Nastavi kupovinu
        </Link>
      </main>
    )
  }

  // ── Step 0: Delivery form ────────────────────────────────────────────────
  const validate = () => {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'Obavezno'
    if (!form.lastName.trim())  e.lastName  = 'Obavezno'
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Unesite ispravnu email adresu'
    if (!form.phone.trim())     e.phone   = 'Obavezno'
    if (!form.address.trim())   e.address = 'Obavezno'
    if (!form.city.trim())      e.city    = 'Obavezno'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleDelivery = (e) => {
    e.preventDefault()
    if (validate()) setStep(1)
  }

  // ── Step 1: Review & submit ──────────────────────────────────────────────
  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const orderNumber = genOrderNumber()
      const payload = {
        order_number:     orderNumber,
        customer_name:    `${form.firstName} ${form.lastName}`,
        customer_email:   form.email,
        customer_phone:   form.phone,
        shipping_address: form.address,
        shipping_city:    form.city,
        shipping_zip:     form.zip,
        notes:            form.notes,
        items:            items.map((i) => ({
          id: i.id, brand: i.brand, title: i.title,
          price: i.price, qty: i.qty,
          selectedSize: i.selectedSize, selectedFlavor: i.selectedFlavor,
        })),
        total:   total,
        status:  'nova',
      }
      const { error } = await supabase.from('orders').insert(payload)
      if (error) throw error
      setOrderNum(orderNumber)
      clearCart?.()
      setStep(2)
    } catch (err) {
      alert(`Greška: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const F = 'Montserrat, Inter, system-ui, sans-serif'

  return (
    <>
      <Helmet>
        <title>Checkout — ProteinHouse</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <main style={{ fontFamily: F }}>
        {/* Breadcrumb */}
        <div className="border-b border-gray-200 bg-white">
          <div className="container py-4">
            <nav className="flex items-center gap-2 text-[11px] text-gray-400">
              <Link to="/" className="flex items-center gap-1 hover:text-[#0F2952] transition-colors"><House size={12} weight="fill" /> Početna</Link>
              <CaretRight size={11} className="opacity-40" />
              <span className="text-[#0F2952] font-semibold">Narudžba</span>
            </nav>
          </div>
        </div>

        <section className="py-10 bg-gray-50 min-h-[60vh]">
          <div className="container max-w-[1000px]">
            <StepIndicator current={step} />

            {/* ── Step 0: Delivery ── */}
            {step === 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
                <form onSubmit={handleDelivery} className="space-y-4">

                  {/* ── Login prompt ── */}
                  {user ? (
                    <div className="flex items-center gap-3 bg-white border border-[#0F2952]/20 px-5 py-3.5">
                      <UserCircle size={20} weight="duotone" className="text-[#0F2952] shrink-0" />
                      <p className="text-[12px] text-gray-600 flex-1">
                        Prijavljeni ste kao <strong className="text-[#0F2952]">{user.email}</strong>
                      </p>
                    </div>
                  ) : !loginOpen ? (
                    <div className="flex items-center justify-between bg-white border border-[#0F2952]/20 px-5 py-3.5 gap-4">
                      <p className="text-[12px] text-gray-600">
                        Imate nalog?{' '}
                        <button
                          type="button"
                          onClick={() => setLoginOpen(true)}
                          className="text-[#0F2952] font-bold underline underline-offset-2 hover:no-underline cursor-pointer bg-transparent border-0 p-0"
                        >
                          Prijavite se za brži checkout
                        </button>
                      </p>
                      <Link
                        to="/nalog/registracija"
                        className="text-[11px] text-gray-400 hover:text-[#0F2952] transition-colors shrink-0"
                      >
                        Kreiraj nalog →
                      </Link>
                    </div>
                  ) : (
                    <div className="bg-white border border-[#0F2952]/20 p-5 space-y-3">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-[11px] font-bold tracking-[0.16em] uppercase text-gray-500">Prijava</h3>
                        <button
                          type="button"
                          onClick={() => { setLoginOpen(false); setLoginError('') }}
                          className="text-[11px] text-gray-400 hover:text-[#0F2952] cursor-pointer bg-transparent border-0 p-0"
                        >
                          Nastavi kao gost →
                        </button>
                      </div>

                      {loginError && (
                        <div className="border border-red-200 bg-red-50 text-red-700 px-4 py-2.5 text-[12px]">
                          {loginError}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold tracking-[0.14em] uppercase text-gray-500">Email</label>
                          <div className="relative">
                            <Envelope size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="email"
                              className="w-full border border-gray-300 pl-8 pr-3 py-2.5 text-[13px] text-[#0F2952] placeholder:text-gray-400 focus:outline-none focus:border-[#0F2952] transition-colors bg-white"
                              placeholder="vas@email.com"
                              value={loginData.email}
                              onChange={(e) => setLoginData((d) => ({ ...d, email: e.target.value }))}
                              required
                              autoComplete="email"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold tracking-[0.14em] uppercase text-gray-500">Šifra</label>
                          <div className="relative">
                            <LockKey size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="password"
                              className="w-full border border-gray-300 pl-8 pr-3 py-2.5 text-[13px] text-[#0F2952] placeholder:text-gray-400 focus:outline-none focus:border-[#0F2952] transition-colors bg-white"
                              placeholder="••••••••"
                              value={loginData.password}
                              onChange={(e) => setLoginData((d) => ({ ...d, password: e.target.value }))}
                              required
                              autoComplete="current-password"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleCheckoutLogin}
                          disabled={loginLoading}
                          className="py-2.5 px-5 bg-[#0F2952] text-white text-[11px] font-bold tracking-[0.1em] uppercase hover:bg-[#0A1F42] disabled:opacity-50 transition-colors cursor-pointer border-0 whitespace-nowrap"
                        >
                          {loginLoading ? 'Prijavljivanje…' : 'Prijavi se'}
                        </button>
                      </div>

                      <p className="text-[11px] text-gray-400 pt-1">
                        Nemate nalog?{' '}
                        <Link to="/nalog/registracija" className="text-[#0F2952] underline hover:no-underline">
                          Registrujte se
                        </Link>
                      </p>
                    </div>
                  )}
                  <div className="bg-white border border-gray-200 p-6 space-y-4">
                    <h2 className="text-[11px] font-bold tracking-[0.16em] uppercase text-gray-500">Podaci za dostavu</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold tracking-[0.14em] uppercase text-gray-500">Ime *</label>
                        <input className={inputCls(errors.firstName)} value={form.firstName} onChange={set('firstName')} placeholder="Ime" />
                        {errors.firstName && <p className="text-red-500 text-[11px]">{errors.firstName}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold tracking-[0.14em] uppercase text-gray-500">Prezime *</label>
                        <input className={inputCls(errors.lastName)} value={form.lastName} onChange={set('lastName')} placeholder="Prezime" />
                        {errors.lastName && <p className="text-red-500 text-[11px]">{errors.lastName}</p>}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold tracking-[0.14em] uppercase text-gray-500">Email *</label>
                      <input className={inputCls(errors.email)} type="email" value={form.email} onChange={set('email')} placeholder="vas@email.com" />
                      {errors.email && <p className="text-red-500 text-[11px]">{errors.email}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold tracking-[0.14em] uppercase text-gray-500">Telefon *</label>
                      <input className={inputCls(errors.phone)} value={form.phone} onChange={set('phone')} placeholder="+387 6x xxx xxx" />
                      {errors.phone && <p className="text-red-500 text-[11px]">{errors.phone}</p>}
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 p-6 space-y-4">
                    <h2 className="text-[11px] font-bold tracking-[0.16em] uppercase text-gray-500">Adresa isporuke</h2>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold tracking-[0.14em] uppercase text-gray-500">Ulica i broj *</label>
                      <input className={inputCls(errors.address)} value={form.address} onChange={set('address')} placeholder="npr. Maršala Tita 28" />
                      {errors.address && <p className="text-red-500 text-[11px]">{errors.address}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold tracking-[0.14em] uppercase text-gray-500">Grad *</label>
                        <input className={inputCls(errors.city)} value={form.city} onChange={set('city')} placeholder="Sarajevo" />
                        {errors.city && <p className="text-red-500 text-[11px]">{errors.city}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold tracking-[0.14em] uppercase text-gray-500">Poštanski broj</label>
                        <input className={inputCls()} value={form.zip} onChange={set('zip')} placeholder="71000" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold tracking-[0.14em] uppercase text-gray-500">Napomena (opciono)</label>
                      <textarea className={`${inputCls()} resize-none`} rows={3} value={form.notes} onChange={set('notes')} placeholder="Npr. kat, interfon, posebna uputstva za dostavu…" />
                    </div>
                  </div>

                  <button type="submit" className="w-full py-4 bg-[#0F2952] text-white text-[11px] font-bold tracking-[0.14em] uppercase hover:bg-[#0A1F42] transition-colors cursor-pointer border-0">
                    Nastavi na pregled →
                  </button>
                </form>
                <OrderSummary items={items} totalPrice={totalPrice} />
              </div>
            )}

            {/* ── Step 1: Review ── */}
            {step === 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
                <div className="space-y-4">
                  <div className="bg-white border border-gray-200 p-6 space-y-3">
                    <h2 className="text-[11px] font-bold tracking-[0.16em] uppercase text-gray-500">Podaci za dostavu</h2>
                    <div className="grid grid-cols-2 gap-2 text-[13px]">
                      <div><p className="text-gray-400 text-[10px] uppercase tracking-wide mb-0.5">Ime</p><p className="font-semibold text-[#0F2952]">{form.firstName} {form.lastName}</p></div>
                      <div><p className="text-gray-400 text-[10px] uppercase tracking-wide mb-0.5">Telefon</p><p className="font-semibold text-[#0F2952]">{form.phone}</p></div>
                      <div><p className="text-gray-400 text-[10px] uppercase tracking-wide mb-0.5">Email</p><p className="font-semibold text-[#0F2952]">{form.email}</p></div>
                      <div><p className="text-gray-400 text-[10px] uppercase tracking-wide mb-0.5">Adresa</p><p className="font-semibold text-[#0F2952]">{form.address}, {form.city} {form.zip}</p></div>
                    </div>
                    <button onClick={() => setStep(0)} className="text-[11px] text-gray-500 underline hover:text-[#0F2952] cursor-pointer bg-transparent border-0 p-0">Izmijeni podatke</button>
                  </div>

                  <div className="bg-white border border-gray-200 p-6 space-y-4">
                    <h2 className="text-[11px] font-bold tracking-[0.16em] uppercase text-gray-500">Način plaćanja</h2>
                    <div className="flex items-start gap-3 p-4 border-2 border-[#0F2952] bg-gray-50">
                      <div className="w-4 h-4 rounded-full border-2 border-[#0F2952] flex items-center justify-center mt-0.5 shrink-0">
                        <div className="w-2 h-2 rounded-full bg-[#0F2952]" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-[#0F2952]">Plaćanje pouzećem</p>
                        <p className="text-[12px] text-gray-500 mt-0.5">Platite gotovinom kuriru pri preuzimanju paketa.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-4 bg-white border border-gray-200">
                    <div className="flex items-center gap-2.5 text-[12px] text-gray-600">
                      <Truck size={16} weight="duotone" className="text-[#0F2952] shrink-0" />
                      Isporuka 1–3 radna dana
                    </div>
                    <div className="flex items-center gap-2.5 text-[12px] text-gray-600">
                      <ShieldCheck size={16} weight="duotone" className="text-[#0F2952] shrink-0" />
                      Originalni proizvodi
                    </div>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="w-full py-4 bg-[#0F2952] text-white text-[11px] font-bold tracking-[0.14em] uppercase hover:bg-[#0A1F42] disabled:bg-gray-300 transition-colors cursor-pointer border-0"
                  >
                    {submitting ? 'Obrađuje se…' : '✓ Potvrdi narudžbu'}
                  </button>
                </div>
                <OrderSummary items={items} totalPrice={totalPrice} />
              </div>
            )}

            {/* ── Step 2: Confirmation ── */}
            {step === 2 && (
              <div className="max-w-[560px] mx-auto text-center py-8">
                <div className="w-16 h-16 rounded-full bg-[#0F2952] flex items-center justify-center mx-auto mb-6">
                  <Check size={28} weight="bold" color="white" />
                </div>
                <h1
                  className="text-3xl font-bold text-[#0F2952] uppercase mb-3"
                  style={{ fontFamily: 'Oswald, Impact, system-ui, sans-serif' }}
                >
                  Hvala na narudžbi!
                </h1>
                <p className="text-[13px] text-gray-500 leading-relaxed mb-2">
                  Vaša narudžba <strong className="text-[#0F2952]">{orderNum}</strong> je primljena.
                </p>
                <p className="text-[13px] text-gray-500 mb-8">
                  Potvrdu ćemo poslati na <strong>{form.email}</strong>. Isporuka 1–3 radna dana.
                </p>
                <div className="border border-gray-200 bg-white p-6 text-left mb-6 space-y-2">
                  <p className="text-[10px] font-bold tracking-[0.16em] uppercase text-gray-400 mb-3">Detalji narudžbe</p>
                  <div className="flex justify-between text-[13px]"><span className="text-gray-500">Broj narudžbe</span><span className="font-bold text-[#0F2952]">{orderNum}</span></div>
                  <div className="flex justify-between text-[13px]"><span className="text-gray-500">Dostava na</span><span className="font-semibold">{form.address}, {form.city}</span></div>
                  <div className="flex justify-between text-[13px]"><span className="text-gray-500">Ukupno</span><span className="font-bold text-[#0F2952]">{fmtKM(total)}</span></div>
                  <div className="flex justify-between text-[13px]"><span className="text-gray-500">Plaćanje</span><span>Pouzećem</span></div>
                </div>
                <Link
                  to="/"
                  className="inline-block px-8 py-4 bg-[#0F2952] text-white text-[11px] font-bold tracking-[0.14em] uppercase hover:bg-[#0A1F42] transition-colors"
                >
                  Nastavi kupovinu →
                </Link>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  )
}
