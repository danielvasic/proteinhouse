import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { House, CaretRight, Check, Truck, ShieldCheck, UserCircle, LockKey, Envelope, Gift, Ticket } from '@phosphor-icons/react'
import { useCart } from '../store/CartContext'
import { fmtKM } from '../data/catalog'
import { supabase } from '../lib/supabase'
import { trackEvent } from '../lib/analytics'
import { zaNarudzbu } from '../lib/atribucija'
import { calcShipping } from '../lib/shipping'
import GiftPicker from '../components/GiftPicker'
import BrandIcon from '../components/BrandIcon'
import { BODY, DISPLAY } from '../lib/typography'

const STEPS = ['Dostava', 'Pregled', 'Potvrda']

const EMPTY_FORM = {
  firstName: '', lastName: '', email: '', phone: '',
  address: '', city: '', zip: '', notes: '',
}

function inputCls(error) {
  return `w-full border ${error ? 'border-red-400' : 'border-gray-300'} px-4 py-3 text-[13px] text-[#1e272e] placeholder:text-gray-400 focus:outline-none focus:border-[#0145F2] transition-colors duration-150 bg-white`
}

function StepIndicator({ current }) {
  return (
    <div className="flex items-center gap-0 mb-10">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center">
          <div className={`flex items-center gap-2 px-1 ${i <= current ? 'text-[#1e272e]' : 'text-gray-400'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-colors ${
              i < current  ? 'bg-[#0145F2] border-[#0145F2] text-white' :
              i === current ? 'border-[#0145F2] text-[#1e272e] bg-white' :
              'border-gray-300 text-gray-400 bg-white'
            }`}>
              {i < current ? <Check size={12} weight="bold" /> : i + 1}
            </div>
            <span className="text-[11px] font-bold tracking-[0.1em] hidden sm:inline">{label}</span>
          </div>
          {i < STEPS.length - 1 && <div className={`h-px w-8 md:w-16 ${i < current ? 'bg-[#0145F2]' : 'bg-gray-200'}`} />}
        </div>
      ))}
    </div>
  )
}

function OrderSummary({ items, totalPrice, coupon, gift }) {
  const discount = coupon?.discount ?? 0
  const shipping = calcShipping(totalPrice - discount, coupon?.free_shipping)
  return (
    <div className="border border-gray-200 bg-white p-6 space-y-4">
      <h3 className="text-[11px] font-bold tracking-[0.16em] text-gray-500">Pregled narudžbe</h3>
      <div className="divide-y divide-gray-100">
        {items.map((item, idx) => (
          <div key={idx} className="flex gap-3 py-3">
            <div className="w-12 h-12 border border-gray-200 bg-[#edf1f5] shrink-0 overflow-hidden">
              <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-gray-400 font-bold tracking-wide">{item.brand}</p>
              <p className="text-[12px] font-semibold text-[#1e272e] leading-tight truncate">{item.title}</p>
              {item.selectedSize   && <p className="text-[10px] text-gray-400">{item.selectedSize}</p>}
              {item.selectedFlavor && <p className="text-[10px] text-gray-400">{item.selectedFlavor}</p>}
            </div>
            <div className="text-right shrink-0">
              <p className="text-[12px] font-bold text-[#1e272e]">{fmtKM(item.price * item.qty)}</p>
              <p className="text-[10px] text-gray-400">{item.qty} × {fmtKM(item.price)}</p>
            </div>
          </div>
        ))}
      </div>
      {gift && (
        <div className="flex gap-3 py-3 border-t border-gray-100 items-center">
          <div className="w-12 h-12 border border-[#0145F2]/30 bg-[#edf1f5] shrink-0 flex items-center justify-center">
            <Gift size={18} weight="duotone" className="text-[#0145F2]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-[#0145F2] font-bold tracking-wide">Poklon</p>
            <p className="text-[12px] font-semibold text-[#1e272e] leading-tight truncate">{gift.title}</p>
            {gift.size && <p className="text-[10px] text-gray-400">Veličina {gift.size}</p>}
          </div>
          <p className="text-[12px] font-bold text-[#0145F2] shrink-0">GRATIS</p>
        </div>
      )}
      <div className="pt-2 space-y-1.5 border-t border-gray-200">
        <div className="flex justify-between text-[12px] text-gray-500">
          <span>Međuzbir</span><span>{fmtKM(totalPrice)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-[12px] text-[#0145F2] font-semibold">
            <span>Kupon {coupon.code}</span><span>−{fmtKM(discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-[12px] text-gray-500">
          <span>Dostava</span>
          <span>{shipping === 0 ? <span className="text-[#1e272e] font-semibold">BESPLATNO</span> : fmtKM(shipping)}</span>
        </div>
        <div className="flex justify-between text-[15px] font-bold text-[#1e272e] pt-2 border-t border-gray-200">
          <span>UKUPNO</span><span>{fmtKM(totalPrice - discount + shipping)}</span>
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
  // Snapshot za ekran potvrde — korpa se isprazni prije nego se on prikaže
  const [placed,    setPlaced]    = useState(null)

  // Kupon i gratis poklon
  const [couponInput, setCouponInput] = useState('')
  const [coupon,      setCoupon]      = useState(null)   // { code, discount, free_shipping, description }
  const [couponError, setCouponError] = useState('')
  const [couponBusy,  setCouponBusy]  = useState(false)
  const [gift,        setGift]        = useState(null)

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

  const discount = coupon?.discount ?? 0
  const shipping = calcShipping(totalPrice - discount, coupon?.free_shipping)
  const total    = totalPrice - discount + shipping

  const applyCoupon = async () => {
    const code = couponInput.trim()
    if (!code) return
    setCouponBusy(true)
    setCouponError('')
    try {
      const { data, error } = await supabase.rpc('validate_coupon', {
        p_code: code, p_subtotal: totalPrice, p_email: form.email || null,
      })
      if (error) throw error
      if (!data?.valid) { setCoupon(null); setCouponError(data?.reason || 'Kupon nije valjan.'); return }
      setCoupon({ ...data, discount: Number(data.discount) })
      setCouponInput('')
    } catch (err) {
      console.error('validate_coupon:', err)
      setCouponError('Trenutno ne možemo provjeriti kupon. Pokušajte ponovo.')
    } finally {
      setCouponBusy(false)
    }
  }

  if (items.length === 0 && step < 2) {
    return (
      <main className="container py-20 text-center" style={BODY}>
        <p className="text-[15px] text-gray-500 mb-4">Vaša korpa je prazna.</p>
        <Link to="/" className="inline-block px-6 py-3 border border-[#0145F2] text-[#1e272e] text-[11px] font-bold tracking-[0.1em] hover:bg-[#0145F2] hover:text-white transition-all">
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
      // Narudžbu kreira server (RPC kreiraj_narudzbu), ne preglednik. Šalju se
      // SAMO proizvodi i količine — cijenu, popust, poštarinu i valjanost
      // poklona računa baza iz vlastitih podataka. Ranije je preglednik sam
      // upisivao red s cijenama koje je sam poslao, pa je svatko mogao
      // naručiti robu za 0 KM.
      const { data, error } = await supabase.rpc('kreiraj_narudzbu', {
        p_customer_name:    `${form.firstName} ${form.lastName}`,
        p_customer_email:   form.email,
        p_customer_phone:   form.phone,
        p_shipping_address: form.address,
        p_shipping_city:    form.city,
        p_shipping_zip:     form.zip,
        p_notes:            form.notes,
        p_payment_method:   'pouzece',
        p_items: items.map((i) => ({
          id: i.id, qty: i.qty,
          selectedSize: i.selectedSize, selectedFlavor: i.selectedFlavor,
        })),
        p_coupon_code: coupon?.code ?? null,
        p_gift:        gift ?? null,
        // Klik ID-evi s reklame; null ako posjetitelj nije prihvatio kolačiće.
        p_atribucija:  zaNarudzbu(),
      })
      if (error) throw error

      // Iznosi iz odgovora, ne oni izračunati u pregledniku — ako se razilaze
      // (istekao kupon, promijenjena cijena), kupac i mjerenje vide ono što
      // je stvarno naplaćeno.
      const orderNumber   = data.order_number
      const stvarniUkupno = Number(data.total)

      // Proslijedi narudžbu ERP-u u pozadini — kupac ne čeka, a ako poziv
      // propadne, satna metla uz erp-sync je pokupi (orders.erp_order_id).
      fetch('/api/erp-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_number: orderNumber }),
      }).catch(() => {})
      trackEvent('purchase', {
        ecommerce: {
          transaction_id: orderNumber,
          currency: 'BAM',
          value: stvarniUkupno,
          shipping: Number(data.shipping),
          items: items.map((i) => ({ item_id: i.id, item_name: i.title, item_brand: i.brand, price: i.price, quantity: i.qty })),
        },
      })
      setOrderNum(orderNumber)
      setPlaced({ total: stvarniUkupno, gift: data.gift ?? null })
      clearCart?.()
      setStep(2)
    } catch (err) {
      alert(`Greška: ${err.message}`)
    } finally {
      setSubmitting(false)
    }
  }

  const F = 'Inter, system-ui, sans-serif'

  return (
    <>
      <Helmet>
        <title>Checkout — ProteinHouse</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <main style={{ fontFamily: F }}>
        {/* Breadcrumb */}
        <div className="border-b border-gray-200 bg-white">
          <div className="container py-6">
            <nav className="flex items-center gap-2 text-[11px] text-gray-400">
              <Link to="/" className="flex items-center gap-1 hover:text-[#0145F2] transition-colors"><House size={12} weight="fill" /> Početna</Link>
              <CaretRight size={11} className="opacity-40" />
              <span className="text-[#1e272e] font-semibold">Narudžba</span>
            </nav>
          </div>
        </div>

        <section className="py-12 bg-white min-h-[60vh]">
          <div className="container max-w-[1000px]">
            <StepIndicator current={step} />

            {/* ── Step 0: Delivery ── */}
            {step === 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
                <form onSubmit={handleDelivery} className="space-y-4">

                  {/* ── Login prompt ── */}
                  {user ? (
                    <div className="flex items-center gap-3 bg-white border border-[#0145F2]/20 px-5 py-3.5">
                      <UserCircle size={20} weight="duotone" className="text-[#1e272e] shrink-0" />
                      <p className="text-[12px] text-gray-600 flex-1">
                        Prijavljeni ste kao <strong className="text-[#1e272e]">{user.email}</strong>
                      </p>
                    </div>
                  ) : !loginOpen ? (
                    <div className="flex items-center justify-between bg-white border border-[#0145F2]/20 px-5 py-3.5 gap-4">
                      <p className="text-[12px] text-gray-600">
                        Imate nalog?{' '}
                        <button
                          type="button"
                          onClick={() => setLoginOpen(true)}
                          className="text-[#1e272e] font-bold underline underline-offset-2 hover:no-underline cursor-pointer bg-transparent border-0 p-0"
                        >
                          Prijavite se za brži checkout
                        </button>
                      </p>
                      <Link
                        to="/nalog/registracija"
                        className="text-[11px] text-gray-400 hover:text-[#0145F2] transition-colors shrink-0"
                      >
                        Kreiraj nalog →
                      </Link>
                    </div>
                  ) : (
                    <div className="bg-white border border-[#0145F2]/20 p-5 space-y-3">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-[11px] font-bold tracking-[0.16em] text-gray-500">Prijava</h3>
                        <button
                          type="button"
                          onClick={() => { setLoginOpen(false); setLoginError('') }}
                          className="text-[11px] text-gray-400 hover:text-[#0145F2] cursor-pointer bg-transparent border-0 p-0"
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
                          <label className="text-[10px] font-bold tracking-[0.14em] text-gray-500">Email</label>
                          <div className="relative">
                            <Envelope size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="email"
                              className="w-full border border-gray-300 pl-8 pr-3 py-2.5 text-[13px] text-[#1e272e] placeholder:text-gray-400 focus:outline-none focus:border-[#0145F2] transition-colors bg-white"
                              placeholder="vas@email.com"
                              value={loginData.email}
                              onChange={(e) => setLoginData((d) => ({ ...d, email: e.target.value }))}
                              required
                              autoComplete="email"
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold tracking-[0.14em] text-gray-500">Šifra</label>
                          <div className="relative">
                            <LockKey size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                              type="password"
                              className="w-full border border-gray-300 pl-8 pr-3 py-2.5 text-[13px] text-[#1e272e] placeholder:text-gray-400 focus:outline-none focus:border-[#0145F2] transition-colors bg-white"
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
                          className="py-2.5 px-5 bg-[#0145F2] text-white text-[11px] font-bold tracking-[0.1em] hover:bg-[#0136C4] disabled:opacity-50 transition-colors cursor-pointer border-0 whitespace-nowrap"
                        >
                          {loginLoading ? 'Prijavljivanje…' : 'Prijavi se'}
                        </button>
                      </div>

                      <p className="text-[11px] text-gray-400 pt-1">
                        Nemate nalog?{' '}
                        <Link to="/nalog/registracija" className="text-[#1e272e] underline hover:no-underline">
                          Registrujte se
                        </Link>
                      </p>
                    </div>
                  )}
                  <div className="bg-white border border-gray-200 p-6 space-y-4">
                    <h2 className="text-[11px] font-bold tracking-[0.16em] text-gray-500">Podaci za dostavu</h2>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold tracking-[0.14em] text-gray-500">Ime *</label>
                        <input className={inputCls(errors.firstName)} value={form.firstName} onChange={set('firstName')} placeholder="Ime" />
                        {errors.firstName && <p className="text-red-500 text-[11px]">{errors.firstName}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold tracking-[0.14em] text-gray-500">Prezime *</label>
                        <input className={inputCls(errors.lastName)} value={form.lastName} onChange={set('lastName')} placeholder="Prezime" />
                        {errors.lastName && <p className="text-red-500 text-[11px]">{errors.lastName}</p>}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold tracking-[0.14em] text-gray-500">Email *</label>
                      <input className={inputCls(errors.email)} type="email" value={form.email} onChange={set('email')} placeholder="vas@email.com" />
                      {errors.email && <p className="text-red-500 text-[11px]">{errors.email}</p>}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold tracking-[0.14em] text-gray-500">Telefon *</label>
                      <input className={inputCls(errors.phone)} value={form.phone} onChange={set('phone')} placeholder="+387 6x xxx xxx" />
                      {errors.phone && <p className="text-red-500 text-[11px]">{errors.phone}</p>}
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 p-6 space-y-4">
                    <h2 className="text-[11px] font-bold tracking-[0.16em] text-gray-500">Adresa isporuke</h2>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold tracking-[0.14em] text-gray-500">Ulica i broj *</label>
                      <input className={inputCls(errors.address)} value={form.address} onChange={set('address')} placeholder="npr. Maršala Tita 28" />
                      {errors.address && <p className="text-red-500 text-[11px]">{errors.address}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold tracking-[0.14em] text-gray-500">Grad *</label>
                        <input className={inputCls(errors.city)} value={form.city} onChange={set('city')} placeholder="Sarajevo" />
                        {errors.city && <p className="text-red-500 text-[11px]">{errors.city}</p>}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold tracking-[0.14em] text-gray-500">Poštanski broj</label>
                        <input className={inputCls()} value={form.zip} onChange={set('zip')} placeholder="71000" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold tracking-[0.14em] text-gray-500">Napomena (opciono)</label>
                      <textarea className={`${inputCls()} resize-none`} rows={3} value={form.notes} onChange={set('notes')} placeholder="Npr. kat, interfon, posebna uputstva za dostavu…" />
                    </div>
                  </div>

                  <button type="submit" className="ph-cta w-full py-4 text-[11px] font-bold tracking-[0.14em] transition-colors cursor-pointer">
                    Nastavi na pregled →
                  </button>
                </form>
                <OrderSummary items={items} totalPrice={totalPrice} coupon={coupon} gift={gift} />
              </div>
            )}

            {/* ── Step 1: Review ── */}
            {step === 1 && (
              <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
                <div className="space-y-4">
                  <div className="bg-white border border-gray-200 p-6 space-y-3">
                    <h2 className="text-[11px] font-bold tracking-[0.16em] text-gray-500">Podaci za dostavu</h2>
                    <div className="grid grid-cols-2 gap-2 text-[13px]">
                      <div><p className="text-gray-400 text-[10px] tracking-wide mb-0.5">Ime</p><p className="font-semibold text-[#1e272e]">{form.firstName} {form.lastName}</p></div>
                      <div><p className="text-gray-400 text-[10px] tracking-wide mb-0.5">Telefon</p><p className="font-semibold text-[#1e272e]">{form.phone}</p></div>
                      <div><p className="text-gray-400 text-[10px] tracking-wide mb-0.5">Email</p><p className="font-semibold text-[#1e272e]">{form.email}</p></div>
                      <div><p className="text-gray-400 text-[10px] tracking-wide mb-0.5">Adresa</p><p className="font-semibold text-[#1e272e]">{form.address}, {form.city} {form.zip}</p></div>
                    </div>
                    <button onClick={() => setStep(0)} className="text-[11px] text-gray-500 underline hover:text-[#0145F2] cursor-pointer bg-transparent border-0 p-0">Izmijeni podatke</button>
                  </div>

                  {/* Gratis poklon */}
                  <GiftPicker subtotal={totalPrice} value={gift} onChange={setGift} />

                  {/* Kupon */}
                  <div className="bg-white border border-gray-200 p-6 space-y-3">
                    <h2 className="text-[11px] font-bold tracking-[0.16em] text-gray-500">Kupon</h2>
                    {coupon ? (
                      <div className="flex items-center gap-3 border border-[#0145F2]/30 bg-[#edf1f5] px-4 py-3">
                        <BrandIcon name="popust" size={20}
                          fallback={<Ticket size={18} weight="duotone" className="text-[#0145F2] shrink-0" />} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-bold text-[#1e272e]">{coupon.code}</p>
                          {coupon.description && <p className="text-[11px] text-gray-500">{coupon.description}</p>}
                        </div>
                        <span className="text-[12px] font-bold text-[#0145F2] shrink-0">−{fmtKM(discount)}</span>
                        <button
                          type="button"
                          onClick={() => { setCoupon(null); setCouponError('') }}
                          className="text-[11px] text-gray-400 hover:text-[#0145F2] underline cursor-pointer bg-transparent border-0 p-0 shrink-0"
                        >
                          Ukloni
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex gap-2">
                          <input
                            className={`${inputCls(couponError)} uppercase`}
                            value={couponInput}
                            onChange={(e) => { setCouponInput(e.target.value); setCouponError('') }}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon() } }}
                            placeholder="Unesi kod kupona"
                          />
                          <button
                            type="button"
                            onClick={applyCoupon}
                            disabled={couponBusy || !couponInput.trim()}
                            className="px-6 border border-[#0145F2] text-[#1e272e] text-[11px] font-bold tracking-[0.1em] hover:bg-[#0145F2] hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-[#1e272e] transition-colors cursor-pointer bg-transparent whitespace-nowrap"
                          >
                            {couponBusy ? '…' : 'Primijeni'}
                          </button>
                        </div>
                        {couponError && <p className="text-red-500 text-[11px]">{couponError}</p>}
                      </>
                    )}
                  </div>

                  <div className="bg-white border border-gray-200 p-6 space-y-4">
                    <h2 className="text-[11px] font-bold tracking-[0.16em] text-gray-500">Način plaćanja</h2>
                    <div className="flex items-start gap-3 p-4 border-2 border-[#0145F2] bg-[#edf1f5]">
                      <div className="w-4 h-4 rounded-full border-2 border-[#0145F2] flex items-center justify-center mt-0.5 shrink-0">
                        <div className="w-2 h-2 rounded-full bg-[#0145F2]" />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-[#1e272e]">Plaćanje pouzećem</p>
                        <p className="text-[12px] text-gray-500 mt-0.5">Platite gotovinom kuriru pri preuzimanju paketa.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 p-4 bg-white border border-gray-200">
                    <div className="flex items-center gap-2.5 text-[12px] text-gray-600">
                      <BrandIcon name="paket" size={18}
                        fallback={<Truck size={16} weight="duotone" className="text-[#1e272e] shrink-0" />} />
                      Isporuka 1–3 radna dana
                    </div>
                    <div className="flex items-center gap-2.5 text-[12px] text-gray-600">
                      <BrandIcon name="paket-potvrda" size={18}
                        fallback={<ShieldCheck size={16} weight="duotone" className="text-[#1e272e] shrink-0" />} />
                      Originalni proizvodi
                    </div>
                  </div>

                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="ph-cta w-full py-4 text-[11px] font-bold tracking-[0.14em] transition-colors cursor-pointer"
                  >
                    {submitting ? 'Obrađuje se…' : '✓ Potvrdi narudžbu'}
                  </button>
                </div>
                <OrderSummary items={items} totalPrice={totalPrice} coupon={coupon} gift={gift} />
              </div>
            )}

            {/* ── Step 2: Confirmation ── */}
            {step === 2 && (
              <div className="max-w-[560px] mx-auto text-center py-8">
                <div className="w-16 h-16 rounded-full bg-[#0145F2] flex items-center justify-center mx-auto mb-6">
                  <Check size={28} weight="bold" color="white" />
                </div>
                <h1
                  className="text-3xl font-bold text-[#1e272e] mb-3"
                  style={DISPLAY}
                >
                  Hvala na narudžbi!
                </h1>
                <p className="text-[13px] text-gray-500 leading-relaxed mb-2">
                  Vaša narudžba <strong className="text-[#1e272e]">{orderNum}</strong> je primljena.
                </p>
                <p className="text-[13px] text-gray-500 mb-8">
                  Potvrdu ćemo poslati na <strong>{form.email}</strong>. Isporuka 1–3 radna dana.
                </p>
                <div className="border border-gray-200 bg-white p-6 text-left mb-6 space-y-2">
                  <p className="text-[10px] font-bold tracking-[0.16em] text-gray-400 mb-3">Detalji narudžbe</p>
                  <div className="flex justify-between text-[13px]"><span className="text-gray-500">Broj narudžbe</span><span className="font-bold text-[#1e272e]">{orderNum}</span></div>
                  <div className="flex justify-between text-[13px]"><span className="text-gray-500">Dostava na</span><span className="font-semibold">{form.address}, {form.city}</span></div>
                  {placed?.gift && (
                    <div className="flex justify-between text-[13px]">
                      <span className="text-gray-500">Poklon</span>
                      <span className="font-semibold text-[#0145F2]">
                        {placed.gift.title}{placed.gift.size ? ` · ${placed.gift.size}` : ''}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-[13px]"><span className="text-gray-500">Ukupno</span><span className="font-bold text-[#1e272e]">{fmtKM(placed?.total ?? 0)}</span></div>
                  <div className="flex justify-between text-[13px]"><span className="text-gray-500">Plaćanje</span><span>Pouzećem</span></div>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link
                    to={`/pracenje?narudzba=${encodeURIComponent(orderNum)}`}
                    className="inline-block px-8 py-4 border border-[#0145F2] text-[#1e272e] text-[11px] font-bold tracking-[0.14em] hover:bg-[#0145F2] hover:text-white transition-colors"
                  >
                    Prati pošiljku
                  </Link>
                  <Link
                    to="/"
                    className="inline-block px-8 py-4 bg-[#0145F2] text-white text-[11px] font-bold tracking-[0.14em] hover:bg-[#0136C4] transition-colors"
                  >
                    Nastavi kupovinu →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </>
  )
}
