import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Envelope, LockKey, ShieldCheck } from '@phosphor-icons/react'
import { useAdmin } from '../../store/AdminContext'
import styles from './AdminLogin.module.css'

export default function AdminLogin() {
  const { signIn, admin } = useAdmin()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Already logged in
  if (admin) { navigate('/admin'); return null }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(form.email, form.password)
      navigate('/admin')
    } catch (err) {
      setError(err.message || 'Greška pri prijavi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.icon}><ShieldCheck size={32} weight="duotone" /></div>
        <h1 className={styles.title}>Admin pristup</h1>
        <p className={styles.sub}>ProteinHouse upravljačka ploča</p>

        {error && <div className={styles.error}>{error}</div>}

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.field}>
            <div className={styles.inputWrap}>
              <Envelope size={16} className={styles.icon2} />
              <input
                type="email" className={styles.input} placeholder="Email adresa"
                autoComplete="email" value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className={styles.field}>
            <div className={styles.inputWrap}>
              <LockKey size={16} className={styles.icon2} />
              <input
                type="password" className={styles.input} placeholder="Šifra"
                autoComplete="current-password" value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                required
              />
            </div>
          </div>
          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? 'Prijavljivanje…' : 'PRIJAVI SE'}
          </button>
        </form>
      </div>
    </div>
  )
}
