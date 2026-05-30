import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Envelope, LockKey, User as UserIcon } from '@phosphor-icons/react'
import { supabase } from '../lib/supabase'
import styles from './Login.module.css'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const isRegister = location.pathname === '/nalog/registracija'

  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '', remember: false,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })
      if (authError) throw authError
      navigate('/')
    } catch (err) {
      setError(err.message || 'Greška pri prijavi. Pokušajte ponovo.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirmPassword) {
      setError('Šifre se ne podudaraju.')
      return
    }
    setLoading(true)
    try {
      const { error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.name } },
      })
      if (authError) throw authError
      navigate('/')
    } catch (err) {
      setError(err.message || 'Greška pri registraciji. Pokušajte ponovo.')
    } finally {
      setLoading(false)
    }
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  return (
    <>
      <Helmet>
        <title>{isRegister ? 'Registracija' : 'Prijava'} — ProteinHouse</title>
        <meta
          name="description"
          content={isRegister
            ? 'Kreirajte ProteinHouse nalog i sakupljajte bodove lojalnosti.'
            : 'Prijavite se na vaš ProteinHouse nalog.'}
        />
        <link rel="canonical" href={`https://proteinhouse.ba${isRegister ? '/nalog/registracija' : '/nalog'}`} />
      </Helmet>

      <main className={styles.main}>
        <div className={styles.card}>
          <h1 className={styles.title}>{isRegister ? 'REGISTRACIJA' : 'PRIJAVA'}</h1>
          <p className={styles.sub}>
            {isRegister
              ? 'Kreirajte nalog i sakupljajte bodove lojalnosti uz svaku kupovinu.'
              : 'Prijavite se da pratite narudžbe i sakupite bodove lojalnosti.'}
          </p>

          {error && <div className={styles.error}>{error}</div>}

          {isRegister ? (
            /* ── Registration form ── */
            <form className={styles.form} onSubmit={handleRegister}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="reg-name">Ime i prezime</label>
                <div className={styles.inputWrap}>
                  <UserIcon size={16} className={styles.inputIcon} />
                  <input
                    id="reg-name"
                    type="text"
                    className={styles.input}
                    placeholder="Vaše ime i prezime"
                    autoComplete="name"
                    value={form.name}
                    onChange={set('name')}
                    required
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="reg-email">Email adresa</label>
                <div className={styles.inputWrap}>
                  <Envelope size={16} className={styles.inputIcon} />
                  <input
                    id="reg-email"
                    type="email"
                    className={styles.input}
                    placeholder="vas@email.com"
                    autoComplete="email"
                    value={form.email}
                    onChange={set('email')}
                    required
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="reg-password">Šifra</label>
                <div className={styles.inputWrap}>
                  <LockKey size={16} className={styles.inputIcon} />
                  <input
                    id="reg-password"
                    type="password"
                    className={styles.input}
                    placeholder="Min. 8 znakova"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={set('password')}
                    required
                    minLength={8}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="confirm-password">Potvrdi šifru</label>
                <div className={styles.inputWrap}>
                  <LockKey size={16} className={styles.inputIcon} />
                  <input
                    id="confirm-password"
                    type="password"
                    className={styles.input}
                    placeholder="••••••••"
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={set('confirmPassword')}
                    required
                  />
                </div>
              </div>

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'Kreiranje naloga…' : 'KREIRAJ NALOG'}
              </button>
            </form>
          ) : (
            /* ── Login form ── */
            <form className={styles.form} onSubmit={handleLogin}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="email">Email adresa</label>
                <div className={styles.inputWrap}>
                  <Envelope size={16} className={styles.inputIcon} />
                  <input
                    id="email"
                    type="email"
                    className={styles.input}
                    placeholder="vas@email.com"
                    autoComplete="email"
                    value={form.email}
                    onChange={set('email')}
                    required
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label className={styles.label} htmlFor="password">Šifra</label>
                <div className={styles.inputWrap}>
                  <LockKey size={16} className={styles.inputIcon} />
                  <input
                    id="password"
                    type="password"
                    className={styles.input}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    value={form.password}
                    onChange={set('password')}
                    required
                  />
                </div>
              </div>

              <label className={styles.rememberLabel}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={form.remember}
                  onChange={(e) => setForm((f) => ({ ...f, remember: e.target.checked }))}
                />
                Zapamti me
              </label>

              <button type="submit" className={styles.submitBtn} disabled={loading}>
                {loading ? 'Prijavljivanje…' : 'PRIJAVI SE'}
              </button>

              <Link to="/nalog/zaboravljena-sifra" className={styles.forgotLink}>
                Zaboravljena šifra?
              </Link>
            </form>
          )}

          <div className={styles.divider}>
            <span>ili</span>
          </div>

          {isRegister ? (
            <Link to="/nalog" className={styles.registerBtn}>
              IMAM NALOG — PRIJAVI SE
            </Link>
          ) : (
            <Link to="/nalog/registracija" className={styles.registerBtn}>
              KREIRAJ NALOG
            </Link>
          )}
        </div>
      </main>
    </>
  )
}
