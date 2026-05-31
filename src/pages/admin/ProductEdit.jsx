import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save, Plus, X, Upload, Image as ImageIcon, RefreshCw } from 'lucide-react'
import { supabase, getProductImageUrl, uploadProductImage } from '../../lib/supabase'
import { categories } from '../../data/catalog'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Switch } from '../../components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'

const EMPTY = {
  brand: '', title: '', slug: '', price: '', old_price: '',
  description: '', category: 'proteini', image_url: '', image_path: '',
  badge: '', is_active: true, flavors: [], sizes: [], sort_order: 0,
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

/** Reusable tag-list editor for flavors and sizes */
function TagEditor({ label, hint, placeholder, value, onChange }) {
  const [input, setInput] = useState('')

  const add = () => {
    const v = input.trim()
    if (!v || value.includes(v)) return
    onChange([...value, v])
    setInput('')
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder={placeholder}
          className="flex-1"
        />
        <Button type="button" variant="outline" size="icon" onClick={add}>
          <Plus size={14} />
        </Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((v) => (
            <span key={v} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-sm font-medium">
              {v}
              <button
                type="button"
                onClick={() => onChange(value.filter((x) => x !== v))}
                className="text-gray-400 hover:text-gray-700 cursor-pointer bg-transparent border-0 p-0"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

export default function ProductEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isNew = id === 'novi'
  const fileRef = useRef(null)

  const [form,      setForm]      = useState(EMPTY)
  const [saving,    setSaving]    = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(!isNew)

  useEffect(() => {
    if (isNew) return
    supabase.from('products').select('*').eq('id', id).single().then(({ data }) => {
      if (data) setForm({
        ...EMPTY,
        ...data,
        old_price:  data.old_price  ?? '',
        flavors:    data.flavors    ?? [],
        sizes:      data.sizes      ?? [],
        image_path: data.image_path ?? '',
        image_url:  data.image_url  ?? '',
      })
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

  /** Upload file to Supabase Storage */
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    const { path, error: uploadErr } = await uploadProductImage(file, form.slug || 'product')
    if (uploadErr) {
      setError(`Upload greška: ${uploadErr.message}`)
    } else {
      setForm((f) => ({ ...f, image_path: path, image_url: '' }))
    }
    setUploading(false)
    e.target.value = ''
  }

  const clearImage = () => setForm((f) => ({ ...f, image_path: '', image_url: '' }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = {
        ...form,
        price:      parseFloat(form.price),
        old_price:  form.old_price ? parseFloat(form.old_price) : null,
        sort_order: parseInt(form.sort_order) || 0,
        updated_at: new Date().toISOString(),
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

  // Resolve preview URL
  const previewUrl = form.image_path
    ? getProductImageUrl({ image_path: form.image_path })
    : form.image_url || ''

  if (loading) {
    return <div className="flex items-center justify-center py-16"><div className="h-7 w-7 rounded-full border-4 border-gray-200 border-t-primary animate-spin" /></div>
  }

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/proizvodi"><ArrowLeft size={18} /></Link>
        </Button>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{isNew ? 'Novi proizvod' : 'Uredi proizvod'}</h2>
          {!isNew && <p className="text-sm text-muted-foreground">ID: {id}</p>}
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── Osnovno ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Osnovno</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Brend *">
              <Input value={form.brand} onChange={set('brand')} required placeholder="npr. OPTIMUM NUTRITION" />
            </Field>
            <Field label="Naziv *">
              <Input value={form.title} onChange={set('title')} required placeholder="npr. Gold Standard Whey 2kg" />
            </Field>
            <Field label="Slug (URL) *" hint="Auto-generisan iz naziva">
              <Input value={form.slug} onChange={set('slug')} required placeholder="gold-standard-whey-2kg" />
            </Field>
            <Field label="Kategorija *">
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.slug} value={c.slug}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </CardContent>
        </Card>

        {/* ── Cijene ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Cijene i prikaz</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Cijena (KM) *">
              <Input type="number" step="0.01" min="0" value={form.price} onChange={set('price')} required placeholder="0.00" />
            </Field>
            <Field label="Stara cijena (KM)" hint="Ostavite prazno ako nema popusta">
              <Input type="number" step="0.01" min="0" value={form.old_price} onChange={set('old_price')} placeholder="0.00" />
            </Field>
            <Field label="Badge" hint="npr. -30%, NOVO, TOP">
              <Input value={form.badge} onChange={set('badge')} placeholder="-30% ili NOVO" />
            </Field>
            <Field label="Redosljed prikaza">
              <Input type="number" value={form.sort_order} onChange={set('sort_order')} />
            </Field>
          </CardContent>
        </Card>

        {/* ── Slika ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Slika proizvoda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 items-start">
              {/* Preview */}
              <div className="w-28 h-28 border-2 border-dashed border-gray-200 flex items-center justify-center bg-gray-50 shrink-0 overflow-hidden">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                ) : (
                  <ImageIcon size={28} className="text-gray-300" />
                )}
              </div>

              <div className="flex-1 space-y-3">
                {/* Upload dugme */}
                <div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="flex items-center gap-2"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading
                      ? <><RefreshCw size={14} className="animate-spin" /> Uploaduje se…</>
                      : <><Upload size={14} /> Učitaj sliku</>
                    }
                  </Button>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    JPG, PNG ili WebP · max 5MB · čuva se u Supabase Storage
                  </p>
                </div>

                {/* Ili URL alternativa */}
                <Field label="Ili unesi URL slike" hint="Koristi se samo ako nije uploadovana slika">
                  <div className="flex gap-2">
                    <Input
                      value={form.image_url}
                      onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value, image_path: '' }))}
                      placeholder="https://..."
                      disabled={!!form.image_path}
                    />
                    {previewUrl && (
                      <Button type="button" variant="ghost" size="icon" onClick={clearImage} title="Ukloni sliku">
                        <X size={15} />
                      </Button>
                    )}
                  </div>
                </Field>

                {form.image_path && (
                  <p className="text-xs text-muted-foreground font-mono bg-gray-50 px-2 py-1 border rounded truncate">
                    📦 Storage: {form.image_path}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Opis ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Opis</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea value={form.description} onChange={set('description')} rows={4} placeholder="Kratak opis proizvoda…" />
          </CardContent>
        </Card>

        {/* ── Okusi + Težine ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Varijante</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Okusi</p>
              <TagEditor
                value={form.flavors}
                onChange={(v) => setForm((f) => ({ ...f, flavors: v }))}
                placeholder="npr. Chocolate Fudge, Vanilla…"
                hint="Enter za dodavanje"
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700">Težine / Veličine</p>
              <TagEditor
                value={form.sizes}
                onChange={(v) => setForm((f) => ({ ...f, sizes: v }))}
                placeholder="npr. 500g, 1kg, 2kg, 5kg…"
                hint="Enter za dodavanje"
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Status ── */}
        <Card>
          <CardContent className="py-4 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Aktivan</p>
              <p className="text-xs text-muted-foreground">Vidljiv na shopu kupcima</p>
            </div>
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          <Button variant="outline" asChild>
            <Link to="/admin/proizvodi">Otkaži</Link>
          </Button>
          <Button type="submit" disabled={saving || uploading} className="flex items-center gap-2">
            <Save size={15} />
            {saving ? 'Snimanje…' : 'Snimi proizvod'}
          </Button>
        </div>

      </form>
    </div>
  )
}
