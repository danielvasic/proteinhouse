import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, FloppyDisk } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import styles from './AdminForm.module.css'

const EMPTY = {
  title: '', slug: '', excerpt: '', content: '',
  cover_url: '', author: 'ProteinHouse Tim', published: false,
}

function slugify(str) {
  return str.toLowerCase()
    .replace(/[čć]/g, 'c').replace(/[šđ]/g, (m) => m === 'š' ? 's' : 'd')
    .replace(/ž/g, 'z').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function BlogEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'novi'

  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(!isNew)

  useEffect(() => {
    if (isNew) return
    supabase.from('blog_posts').select('*').eq('id', id).single().then(({ data }) => {
      if (data) setForm(data)
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = {
        ...form,
        published_at: form.published && !form.published_at ? new Date().toISOString() : form.published_at,
      }
      if (isNew) {
        const { error: err } = await supabase.from('blog_posts').insert(payload)
        if (err) throw err
      } else {
        const { error: err } = await supabase.from('blog_posts').update(payload).eq('id', id)
        if (err) throw err
      }
      navigate('/admin/blog')
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
        <Link to="/admin/blog" className={styles.back}><ArrowLeft size={16} /> Nazad</Link>
        <h1 className={styles.heading}>{isNew ? 'Novi blog post' : 'Uredi post'}</h1>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <form className={styles.form} onSubmit={handleSubmit}>
        <Field label="Naslov *">
          <input className={styles.input} value={form.title} onChange={set('title')} required placeholder="Naslov posta" />
        </Field>

        <div className={styles.grid2}>
          <Field label="Slug (URL) *">
            <input className={styles.input} value={form.slug} onChange={set('slug')} required placeholder="naslov-posta" />
          </Field>
          <Field label="Autor">
            <input className={styles.input} value={form.author} onChange={set('author')} placeholder="Ime autora" />
          </Field>
        </div>

        <Field label="URL naslovne slike">
          <input className={styles.input} value={form.cover_url} onChange={set('cover_url')} placeholder="https://..." />
          {form.cover_url && (
            <img src={form.cover_url} alt="" className={styles.imgPreview} onError={(e) => e.target.style.display='none'} />
          )}
        </Field>

        <Field label="Kratki opis (excerpt)">
          <textarea
            className={`${styles.input} ${styles.textarea}`}
            value={form.excerpt} onChange={set('excerpt')}
            rows={2} placeholder="Kratki opis koji se prikazuje na listi…"
          />
        </Field>

        <Field label="Sadržaj (Markdown ili HTML)">
          <textarea
            className={`${styles.input} ${styles.textarea}`}
            value={form.content} onChange={set('content')}
            rows={14} placeholder="Pišite sadržaj posta ovdje…"
            style={{ fontFamily: 'monospace', fontSize: 13 }}
          />
        </Field>

        <label className={styles.checkLabel}>
          <input type="checkbox" checked={form.published} onChange={set('published')} />
          Objavi (vidljivo na blogu)
        </label>

        <div className={styles.actions}>
          <Link to="/admin/blog" className={styles.cancelBtn}>Otkaži</Link>
          <button type="submit" className={styles.saveBtn} disabled={saving}>
            <FloppyDisk size={16} weight="fill" />
            {saving ? 'Snimanje…' : 'Snimi post'}
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
