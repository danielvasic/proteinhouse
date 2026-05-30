import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, FloppyDisk, Plus, X } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { categories } from '../../data/catalog'
import styles from './AdminForm.module.css'

const EMPTY = {
  brand: '', title: '', slug: '', price: '', old_price: '',
  description: '', category: 'proteini', image_url: '',
  badge: '', is_active: true, flavors: [], sort_order: 0,
}

function slugify(str) {
  return str.toLowerCase()
    .replace(/[čć]/g, 'c').replace(/[šđ]/g, (m) => m === 'š' ? 's' : 'd')
    .replace(/ž/g, 'z').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function ProductEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'novi'

  const [form, setForm] = useState(EMPTY)
  const [flavorInput, setFlavorInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(!isNew)

  useEffect(() => {
    if (isNew) return
    supabase.from('products').select('*').eq('id', id).single().then(({ data }) => {
      if (data) setForm({ ...data, old_price: data.old_price ?? '' })
      setLoading(false)
    })
  }, [id, isNew])

  const set = (key) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => {
      const next = { ...f, [key]: val }
      if (key === 'title' && isNew) next.slug = slugify(val)
      return next
    })
  }

  const addFlavor = () => {
    const v = flavorInput.trim()
    if (!v || form.flavors.includes(v)) return
    setForm((f) => ({ ...f, flavors: [...f.flavors, v] }))
    setFlavorInput('')
  }

  const removeFlavor = (f) => setForm((p) => ({ ...p, flavors: p.flavors.filter((x) => x !== f) }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = {
        ...form,
        price: parseFloat(form.price),
        old_price: form.old_price ? parseFloat(form.old_price) : null,
        sort_order: parseInt(form.sort_order) || 0,
      }
      if (isNew) {
        const { error: err } = await supabase.from('products').insert(payload)
        if (err) throw err
      } else {
        const { error: err } = await supabase.from('products').update(payload).eq('id', id)
        if (err) throw err
      }
      navigate('/admin/proizvodi')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className={styles.loading}><div className={styles.spinner} /></div>

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <Link to="/admin/proizvodi" className={styles.back}><ArrowLeft size={16} /> Nazad</Link>
        <h1 className={styles.heading}>{isNew ? 'Novi proizvod' : 'Uredi proizvod'}</h1>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.grid2}>
          <Field label="Brend *">
            <input className={styles.input} value={form.brand} onChange={set('brand')} required placeholder="npr. OPTIMUM NUTRITION" />
          </Field>
          <Field label="Naziv *">
            <input className={styles.input} value={form.title} onChange={set('title')} required placeholder="npr. Gold Standard Whey 2kg" />
          </Field>
        </div>

        <div className={styles.grid2}>
          <Field label="Slug (URL) *">
            <input className={styles.input} value={form.slug} onChange={set('slug')} required placeholder="gold-standard-whey-2kg" />
          </Field>
          <Field label="Kategorija *">
            <select className={styles.input} value={form.category} onChange={set('category')}>
              {categories.map((c) => (
                <option key={c.slug} value={c.slug}>{c.label}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className={styles.grid2}>
          <Field label="Cijena (KM) *">
            <input className={styles.input} type="number" step="0.01" min="0" value={form.price} onChange={set('price')} required placeholder="0.00" />
          </Field>
          <Field label="Stara cijena (KM) — opciono">
            <input className={styles.input} type="number" step="0.01" min="0" value={form.old_price} onChange={set('old_price')} placeholder="0.00" />
          </Field>
        </div>

        <Field label="URL slike">
          <input className={styles.input} value={form.image_url} onChange={set('image_url')} placeholder="https://..." />
          {form.image_url && (
            <img src={form.image_url} alt="" className={styles.imgPreview} onError={(e) => e.target.style.display='none'} />
          )}
        </Field>

        <Field label="Opis">
          <textarea className={`${styles.input} ${styles.textarea}`} value={form.description} onChange={set('description')} rows={4} placeholder="Kratak opis proizvoda…" />
        </Field>

        <div className={styles.grid2}>
          <Field label="Badge (npr. -30%, NOVO)">
            <input className={styles.input} value={form.badge} onChange={set('badge')} placeholder="-30% ili NOVO" />
          </Field>
          <Field label="Redosljed prikaza">
            <input className={styles.input} type="number" value={form.sort_order} onChange={set('sort_order')} />
          </Field>
        </div>

        <Field label="Okusi / varijante">
          <div className={styles.flavorRow}>
            <input
              className={styles.input}
              value={flavorInput}
              onChange={(e) => setFlavorInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFlavor() } }}
              placeholder="Dodaj okus, Enter za potvrdu"
            />
            <button type="button" className={styles.addFlavor} onClick={addFlavor}><Plus size={14} /></button>
          </div>
          <div className={styles.flavors}>
            {form.flavors.map((f) => (
              <span key={f} className={styles.flavorTag}>
                {f}
                <button type="button" onClick={() => removeFlavor(f)}><X size={11} /></button>
              </span>
            ))}
          </div>
        </Field>

        <label className={styles.checkLabel}>
          <input type="checkbox" checked={form.is_active} onChange={set('is_active')} />
          Aktivan (vidljiv na shopu)
        </label>

        <div className={styles.actions}>
          <Link to="/admin/proizvodi" className={styles.cancelBtn}>Otkaži</Link>
          <button type="submit" className={styles.saveBtn} disabled={saving}>
            <FloppyDisk size={16} weight="fill" />
            {saving ? 'Snimanje…' : 'Snimi proizvod'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>{label}</label>
      {children}
    </div>
  )
}
