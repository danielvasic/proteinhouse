import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Envelope, LockKey, User as UserIcon, ShieldCheck, Package, SignOut, UserCircle, GoogleLogo } from '@phosphor-icons/react'
import { supabase } from '../lib/supabase'

const isAdminUser = (u) => u?.user_metadata?.role === 'admin'

const inputCls = 'w-full border border-gray-300 pl-10 pr-4 py-3.5 text-[13px] text-[#0A0E17] placeholder:text-gray-400 focus:outline-none focus:border-[#0145F2] transition-colors duration-150 bg-white'

function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-bold tracking-[0.16em] uppercase text-gray-500">{label}</label>
      {children}
    </div>
  )
}

function InputWrap({ Icon, children }) {
  return (
    <div className="relative">
      <Icon size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
      {children}
    </div>
  )
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const isRegister = location.pathname === '/nalog/registracija'

  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', remember: false })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState(null)   // prijavljeni korisnik → profil umjesto forme

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  // Prepoznaj postojeću sesiju (i promjene stanja) — stranica postaje "Moj nalog"
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null))
    return () => subscription.unsubscribe()
  }, [])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
      if (authError) throw authError
      // Admin ide pravo u administraciju, običan korisnik na svoj nalog
      navigate(isAdminUser(data.user) ? '/admin' : '/nalog')
    } catch (err) {
      setError(err.message || 'Greška pri prijavi. Pokušajte ponovo.')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    setError('')
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/nalog` },
      })
      if (authError) throw authError
      // Browser se preusmjerava na Google — nema šta dalje raditi ovdje
    } catch (err) {
      setError(err.message || 'Greška pri prijavi preko Google-a.')
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) { setError('Šifre se ne podudaraju.'); return }
    setLoading(true)
    try {
      const { error: authError } = await supabase.auth.signUp({
        email: form.email, password: form.password,
        options: { data: { full_name: form.name } },
      })
      if (authError) throw authError
      navigate('/nalog')
    } catch (err) {
      setError(err.message || 'Greška pri registraciji. Pokušajte ponovo.')
    } finally {
      setLoading(false)
    }
  }

  // ── Prijavljen: "Moj nalog" umjesto login forme ──
  if (user && !isRegister) {
    const admin = isAdminUser(user)
    const displayName = user.user_metadata?.full_name || user.email
    return (
      <>
        <Helmet><title>Moj nalog — ProteinHouse</title></Helmet>
        <main
          className="min-h-[calc(100vh-220px)] bg-white flex items-center justify-center py-16 px-4"
          style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          <div className="w-full max-w-[440px]">
            <div className="mb-8 text-center">
              <UserCircle size={52} weight="duotone" className="text-[#0145F2] mx-auto mb-3" />
              <h1 className="text-3xl font-bold text-[#0A0E17] uppercase" style={{ fontFamily: "'Exo 2', system-ui, sans-serif" }}>
                Moj nalog
              </h1>
              <p className="text-[13px] text-gray-500 mt-2">
                Prijavljeni ste kao <strong className="text-[#0A0E17]">{displayName}</strong>
              </p>
            </div>

            <div className="bg-white border border-gray-200 p-6 space-y-3">
              {admin && (
                <button
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#0145F2] text-white border-0 text-[11px] font-bold tracking-[0.12em] uppercase hover:bg-[#0136C4] transition-colors cursor-pointer"
                  onClick={() => navigate('/admin')}
                >
                  <ShieldCheck size={15} weight="fill" /> Administracija
                </button>
              )}
              <button
                className="w-full flex items-center justify-center gap-2 py-3.5 border border-[#0145F2] text-[#0145F2] bg-transparent text-[11px] font-bold tracking-[0.12em] uppercase hover:bg-[#0145F2] hover:text-white transition-all cursor-pointer"
                onClick={() => navigate('/pracenje')}
              >
                <Package size={15} /> Praćenje pošiljke
              </button>
              <button
                className="w-full flex items-center justify-center gap-2 py-3.5 border border-gray-300 text-gray-500 bg-transparent text-[11px] font-bold tracking-[0.12em] uppercase hover:border-gray-400 transition-colors cursor-pointer"
                onClick={handleSignOut}
              >
                <SignOut size={15} /> Odjava
              </button>
            </div>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Helmet>
        <title>{isRegister ? 'Registracija' : 'Prijava'} — ProteinHouse</title>
        <meta name="description" content={isRegister ? 'Kreirajte ProteinHouse nalog.' : 'Prijavite se na vaš ProteinHouse nalog.'} />
        <link rel="canonical" href={`https://proteinhouse.ba${isRegister ? '/nalog/registracija' : '/nalog'}`} />
      </Helmet>

      <main
        className="min-h-[calc(100vh-220px)] bg-[#F2F4F7] flex items-center justify-center py-16 px-4"
        style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
      >
        <div className="w-full max-w-[440px]">

          {/* Header */}
          <div className="mb-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="h-px w-8 bg-gray-300" />
              <span className="text-[10px] font-bold tracking-[0.22em] uppercase text-gray-400">
                {isRegister ? 'Novi nalog' : 'Dobrodošli nazad'}
              </span>
              <div className="h-px w-8 bg-gray-300" />
            </div>
            <h1
              className="text-3xl font-bold text-[#0A0E17] uppercase"
              style={{ fontFamily: "'Exo 2', system-ui, sans-serif" }}
            >
              {isRegister ? 'Registracija' : 'Prijava'}
            </h1>
            <p className="text-[13px] text-gray-500 mt-2">
              {isRegister
                ? 'Kreirajte nalog i sakupljajte bodove lojalnosti.'
                : 'Prijavite se da pratite narudžbe i sakupite bodove.'}
            </p>
          </div>

          {/* Card */}
          <div className="bg-white border border-gray-200 p-8">

            {error && (
              <div className="border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-[12px] mb-5">
                {error}
              </div>
            )}

            {isRegister ? (
              <form className="flex flex-col gap-4" onSubmit={handleRegister}>
                <Field label="Ime i prezime">
                  <InputWrap Icon={UserIcon}>
                    <input className={inputCls} type="text" placeholder="Vaše ime i prezime" autoComplete="name" value={form.name} onChange={set('name')} required />
                  </InputWrap>
                </Field>
                <Field label="Email adresa">
                  <InputWrap Icon={Envelope}>
                    <input className={inputCls} type="email" placeholder="vas@email.com" autoComplete="email" value={form.email} onChange={set('email')} required />
                  </InputWrap>
                </Field>
                <Field label="Šifra">
                  <InputWrap Icon={LockKey}>
                    <input className={inputCls} type="password" placeholder="Min. 8 znakova" autoComplete="new-password" value={form.password} onChange={set('password')} required minLength={8} />
                  </InputWrap>
                </Field>
                <Field label="Potvrdi šifru">
                  <InputWrap Icon={LockKey}>
                    <input className={inputCls} type="password" placeholder="••••••••" autoComplete="new-password" value={form.confirmPassword} onChange={set('confirmPassword')} required />
                  </InputWrap>
                </Field>
                <button type="submit" disabled={loading} className="mt-2 w-full py-4 bg-[#0145F2] text-white text-[11px] font-bold tracking-[0.14em] uppercase hover:bg-[#0136C4] disabled:opacity-50 transition-colors duration-150 cursor-pointer border-0">
                  {loading ? 'Kreiranje naloga…' : 'Kreiraj nalog'}
                </button>
              </form>
            ) : (
              <form className="flex flex-col gap-4" onSubmit={handleLogin}>
                <Field label="Email adresa">
                  <InputWrap Icon={Envelope}>
                    <input className={inputCls} type="email" placeholder="vas@email.com" autoComplete="email" value={form.email} onChange={set('email')} required />
                  </InputWrap>
                </Field>
                <Field label="Šifra">
                  <InputWrap Icon={LockKey}>
                    <input className={inputCls} type="password" placeholder="••••••••" autoComplete="current-password" value={form.password} onChange={set('password')} required />
                  </InputWrap>
                </Field>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-[12px] text-gray-600 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-[#0145F2]" checked={form.remember} onChange={(e) => setForm((f) => ({ ...f, remember: e.target.checked }))} />
                    Zapamti me
                  </label>
                  <Link to="/nalog/zaboravljena-sifra" className="text-[12px] text-gray-500 hover:text-[#0145F2] transition-colors">
                    Zaboravljena šifra?
                  </Link>
                </div>
                <button type="submit" disabled={loading} className="mt-2 w-full py-4 bg-[#0145F2] text-white text-[11px] font-bold tracking-[0.14em] uppercase hover:bg-[#0136C4] disabled:opacity-50 transition-colors duration-150 cursor-pointer border-0">
                  {loading ? 'Prijavljivanje…' : 'Prijavi se'}
                </button>
              </form>
            )}

            {/* Divider */}
            <div className="flex items-center gap-4 my-6">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-[11px] text-gray-400">ili</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            {/* Google SSO — isti tok za prijavu i registraciju (Supabase kreira nalog ako ne postoji) */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 border border-gray-300 text-[#0A0E17] bg-white text-[12px] font-bold uppercase tracking-[0.06em] hover:border-gray-400 hover:bg-gray-50 transition-all duration-150 cursor-pointer mb-6"
            >
              <GoogleLogo size={17} weight="bold" /> Nastavi preko Google-a
            </button>

            {isRegister ? (
              <Link to="/nalog" className="block w-full text-center py-3.5 border border-[#0145F2] text-[#0A0E17] text-[11px] font-bold tracking-[0.12em] uppercase hover:bg-[#0145F2] hover:text-white transition-all duration-150">
                Imam nalog — Prijavi se
              </Link>
            ) : (
              <Link to="/nalog/registracija" className="block w-full text-center py-3.5 border border-[#0145F2] text-[#0A0E17] text-[11px] font-bold tracking-[0.12em] uppercase hover:bg-[#0145F2] hover:text-white transition-all duration-150">
                Kreiraj nalog
              </Link>
            )}

          </div>
        </div>
      </main>
    </>
  )
}
