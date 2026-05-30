import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save, Plus, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
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
  description: '', category: 'proteini', image_url: '',
  badge: '', is_active: true, flavors: [], sort_order: 0,
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

  if (loading) {
    return <div className="flex items-center justify-center py-16"><div className="h-7 w-7 rounded-full border-4 border-gray-200 border-t-emerald-500 animate-spin" /></div>
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
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Osnovno</CardTitle></CardHeader>
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

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Cijene i prikaz</CardTitle></CardHeader>
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

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Slika i opis</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Field label="URL slike">
              <Input value={form.image_url} onChange={set('image_url')} placeholder="https://..." />
              {form.image_url && (
                <img src={form.image_url} alt="" className="mt-2 h-24 w-24 rounded-lg object-cover border" onError={(e) => { e.target.style.display = 'none' }} />
              )}
            </Field>
            <Field label="Opis">
              <Textarea value={form.description} onChange={set('description')} rows={4} placeholder="Kratak opis proizvoda…" />
            </Field>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Okusi / varijante</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={flavorInput}
                onChange={(e) => setFlavorInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFlavor() } }}
                placeholder="Dodaj okus, Enter za potvrdu"
                className="flex-1"
              />
              <Button type="button" variant="outline" size="icon" onClick={addFlavor}>
                <Plus size={14} />
              </Button>
            </div>
            {form.flavors.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.flavors.map((f) => (
                  <span key={f} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-sm font-medium">
                    {f}
                    <button type="button" onClick={() => removeFlavor(f)} className="text-gray-400 hover:text-gray-600">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

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
          <Button type="submit" disabled={saving} className="flex items-center gap-2">
            <Save size={15} />
            {saving ? 'Snimanje…' : 'Snimi proizvod'}
          </Button>
        </div>
      </form>
    </div>
  )
}
