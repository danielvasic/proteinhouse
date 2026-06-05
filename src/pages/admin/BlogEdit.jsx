import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import ImageUpload from '../../components/admin/ImageUpload'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Switch } from '../../components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'

const EMPTY = {
  title: '', slug: '', excerpt: '', content: '',
  cover_url: '', author: 'ProteinHouse Tim', published: false,
}

function slugify(str) {
  return str.toLowerCase()
    .replace(/[čć]/g, 'c').replace(/[šđ]/g, (m) => m === 'š' ? 's' : 'd')
    .replace(/ž/g, 'z').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function Field({ label, children, hint }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
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

  if (loading) {
    return <div className="flex items-center justify-center py-16"><div className="h-7 w-7 rounded-full border-4 border-gray-200 border-t-emerald-500 animate-spin" /></div>
  }

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/blog"><ArrowLeft size={18} /></Link>
        </Button>
        <h2 className="text-xl font-bold text-gray-900">{isNew ? 'Novi blog post' : 'Uredi post'}</h2>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Osnovno</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="Naslov *">
              <Input value={form.title} onChange={set('title')} required placeholder="Naslov posta" />
            </Field>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Slug (URL) *" hint="Auto-generisan iz naslova">
                <Input value={form.slug} onChange={set('slug')} required placeholder="naslov-posta" />
              </Field>
              <Field label="Autor">
                <Input value={form.author} onChange={set('author')} placeholder="Ime autora" />
              </Field>
            </div>
            <Field label="Naslovna slika">
              <ImageUpload
                value={form.cover_url}
                onChange={(url) => setForm((f) => ({ ...f, cover_url: url }))}
                folder="blog"
                previewH="h-36"
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Sadržaj</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="Kratki opis (excerpt)">
              <Textarea value={form.excerpt} onChange={set('excerpt')} rows={2} placeholder="Kratki opis koji se prikazuje na listi…" />
            </Field>
            <Field label="Sadržaj (Markdown ili HTML)">
              <Textarea
                value={form.content} onChange={set('content')}
                rows={16} placeholder="Pišite sadržaj posta ovdje…"
                className="font-mono text-[13px]"
              />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Objavi</p>
              <p className="text-xs text-muted-foreground">Vidljivo na blogu</p>
            </div>
            <Switch checked={form.published} onCheckedChange={(v) => setForm((f) => ({ ...f, published: v }))} />
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" asChild><Link to="/admin/blog">Otkaži</Link></Button>
          <Button type="submit" disabled={saving} className="flex items-center gap-2">
            <Save size={15} />
            {saving ? 'Snimanje…' : 'Snimi post'}
          </Button>
        </div>
      </form>
    </div>
  )
}
