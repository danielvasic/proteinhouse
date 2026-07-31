import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Save, Plus, X, Upload, RefreshCw, Sparkles, Loader2, ArrowUp, ArrowDown } from 'lucide-react'
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
  images: [], // [{path?, url?, variant: null|okus|gramaza|"okus|gramaza"}]
  badge: '', is_active: true, flavors: [], sizes: [], sort_order: 0,
  stock: 0, stock_variants: {},
  internal_title: '', tags: [],
  usage_instructions: '', composition: '', nutrition_info: '',
  hero_stats: [],
  addons: [], // [{ product_id, price }] — one-click dodaci u korpi
}

const DESCRIPTION_FIELDS = ['description', 'usage_instructions', 'composition', 'nutrition_info']

function slugify(str) {
  return str.toLowerCase()
    .replace(/[čć]/g, 'c').replace(/[šđ]/g, (m) => m === 'š' ? 's' : 'd')
    .replace(/ž/g, 'z').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function Field({ label, children, hint, right }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        {right}
      </div>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

/** Mala "AI generiši/regeneriši" ikonica uz label polja opisa */
function AiFieldButton({ busy, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || busy}
      title="Generiši preko AI-a (Claude Sonnet)"
      className="flex items-center gap-1 text-[11px] font-medium text-violet-600 hover:text-violet-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer bg-transparent border-0 p-0"
    >
      {busy ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
      {busy ? 'Generiše…' : 'AI'}
    </button>
  )
}

/**
 * Add-on proizvodi — "Dodaj ON shaker za samo 10,00 KM" u korpi.
 * Prazna cijena znači redovna cijena tog proizvoda.
 */
function AddonEditor({ selfId, value, onChange }) {
  const [catalog, setCatalog] = useState([])

  useEffect(() => {
    supabase.from('products').select('id, brand, title, price').eq('is_active', true).order('brand')
      .then(({ data }) => setCatalog(data ?? []))
  }, [])

  const byId  = Object.fromEntries(catalog.map((p) => [p.id, p]))
  const taken = new Set(value.map((a) => a.product_id))
  const free  = catalog.filter((p) => p.id !== selfId && !taken.has(p.id))

  const update = (idx, patch) => onChange(value.map((a, i) => i === idx ? { ...a, ...patch } : a))

  return (
    <div className="space-y-3">
      {value.map((addon, idx) => {
        const p = byId[addon.product_id]
        return (
          <div key={addon.product_id} className="flex items-center gap-3 rounded-lg border p-2.5">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {p ? `${p.brand} ${p.title}` : 'Proizvod je obrisan ili neaktivan'}
              </p>
              {p && <p className="text-xs text-muted-foreground">Redovna: {Number(p.price).toFixed(2)} KM</p>}
            </div>
            <Input
              className="w-28"
              type="number"
              step="0.01"
              placeholder="Promo KM"
              value={addon.price ?? ''}
              onChange={(e) => update(idx, { price: e.target.value === '' ? null : parseFloat(e.target.value) })}
            />
            <Button type="button" variant="ghost" size="icon"
              onClick={() => onChange(value.filter((_, i) => i !== idx))}>
              <X size={15} />
            </Button>
          </div>
        )
      })}

      <Select value="" onValueChange={(v) => onChange([...value, { product_id: v, price: null }])}>
        <SelectTrigger className="w-full"><SelectValue placeholder="+ Dodaj add-on proizvod…" /></SelectTrigger>
        <SelectContent>
          {free.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.brand} {p.title} — {Number(p.price).toFixed(2)} KM
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
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

/** Stock editor — generated from flavors × sizes combinations */
function StockTable({ flavors, sizes, stockVariants, stock, onChangeVariants, onChangeStock }) {
  const hasVariants = flavors.length > 0 || sizes.length > 0

  const combinations = useMemo(() => {
    if (flavors.length && sizes.length)
      return flavors.flatMap((f) => sizes.map((s) => ({ key: `${f}|${s}`, label: `${f} · ${s}` })))
    if (flavors.length) return flavors.map((f) => ({ key: f, label: f }))
    if (sizes.length)   return sizes.map((s)   => ({ key: s, label: s }))
    return []
  }, [flavors, sizes])

  const getEntry = (key) => stockVariants[key] || { qty: 0, sku: '' }

  const update = (key, field, value) =>
    onChangeVariants({
      ...stockVariants,
      [key]: { ...getEntry(key), [field]: field === 'qty' ? (parseInt(value) || 0) : value },
    })

  if (!hasVariants) {
    return (
      <div className="space-y-1.5">
        <Label>Ukupno na lageru (kom)</Label>
        <div className="flex items-center gap-3">
          <Input
            type="number" min="0" value={stock}
            onChange={(e) => onChangeStock(parseInt(e.target.value) || 0)}
            className="max-w-[120px]"
          />
          <span className={`text-xs font-semibold ${stock > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {stock > 0 ? `${stock} kom na stanju` : 'Nema na stanju'}
          </span>
        </div>
      </div>
    )
  }

  if (combinations.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">
        Stanje na lageru po varijantama
        <span className="ml-2 text-xs text-muted-foreground font-normal">
          ({combinations.length} {combinations.length === 1 ? 'varijanta' : 'varijanti'})
        </span>
      </p>
      <div className="border border-gray-200 overflow-hidden rounded-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500">Varijanta</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 w-36">Stanje (kom)</th>
              <th className="px-3 py-2 text-left text-[10px] font-bold uppercase tracking-wider text-gray-500 w-48">SKU / ERP šifra</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {combinations.map(({ key, label }) => {
              const entry = getEntry(key)
              return (
                <tr key={key} className={entry.qty === 0 ? 'bg-red-50/50' : ''}>
                  <td className="px-3 py-2 text-sm font-medium text-gray-700">{label}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number" min="0" value={entry.qty}
                        onChange={(e) => update(key, 'qty', e.target.value)}
                        className="w-20 h-8 text-sm"
                      />
                      {entry.qty === 0 && (
                        <span className="text-[10px] text-red-500 font-bold whitespace-nowrap">NEMA</span>
                      )}
                      {entry.qty > 0 && entry.qty <= 5 && (
                        <span className="text-[10px] text-amber-600 font-bold whitespace-nowrap">MALO</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={entry.sku}
                      onChange={(e) => update(key, 'sku', e.target.value)}
                      placeholder="npr. ON-GSW-CH-1KG"
                      className="h-8 text-xs font-mono"
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">
        SKU šifra se koristi za sinhronizaciju sa ERP sustavom.
        Redovi označeni crveno nemaju zaliha.
      </p>
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
  // null = ništa u toku; 'all' = generiše sva polja; ili konkretan field key
  const [generating, setGenerating] = useState(null)
  const [aiError,    setAiError]    = useState('')

  useEffect(() => {
    if (isNew) return
    supabase.from('products').select('*').eq('id', id).single().then(({ data }) => {
      if (data) setForm({
        ...EMPTY,
        ...data,
        old_price:      data.old_price      ?? '',
        flavors:        data.flavors        ?? [],
        sizes:          data.sizes          ?? [],
        image_path:     data.image_path     ?? '',
        image_url:      data.image_url      ?? '',
        // Ako galerija jos ne postoji, prikazi postojecu jednostruku sliku kao
        // prvu stavku — cisto za UX (na Sacuvaj ce se to trajno upisati u images).
        images: Array.isArray(data.images) && data.images.length
          ? data.images
          : (data.image_path || data.image_url)
            ? [{ path: data.image_path || undefined, url: data.image_path ? undefined : data.image_url, variant: null }]
            : [],
        stock:          data.stock          ?? 0,
        stock_variants: data.stock_variants ?? {},
        internal_title:     data.internal_title     ?? '',
        tags:               data.tags               ?? [],
        usage_instructions: data.usage_instructions ?? '',
        composition:        data.composition        ?? '',
        nutrition_info:     data.nutrition_info     ?? '',
        hero_stats:         Array.isArray(data.hero_stats) ? data.hero_stats : [],
        addons:             Array.isArray(data.addons)     ? data.addons     : [],
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

  /**
   * AI generator opisa (Claude Sonnet preko AWS Bedrocka, /api/generate-description).
   * singleField = null → glavno dugme: generiše SAMO prazna polja (ne dira ono što je već upisano).
   * singleField = 'x'  → ikonica uz jedno polje: uvijek (re)generiše baš to polje.
   */
  const generateCopy = async (singleField = null) => {
    if (!form.brand.trim() || !form.title.trim()) {
      setAiError('Unesite brend i naziv proizvoda prije generisanja opisa.')
      return
    }
    const fields = singleField
      ? [singleField]
      : DESCRIPTION_FIELDS.filter((k) => !form[k]?.trim())
    if (fields.length === 0) {
      setAiError('Sva polja su već popunjena — obriši polje pa klikni AI da ga regenerišeš.')
      return
    }
    setAiError('')
    setGenerating(singleField || 'all')
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/generate-description', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          brand: form.brand, title: form.title, category: form.category,
          existing: {
            description: form.description, usage_instructions: form.usage_instructions,
            composition: form.composition, nutrition_info: form.nutrition_info,
          },
          fields,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Greška pri generisanju opisa.')
      setForm((f) => ({ ...f, ...data }))
    } catch (err) {
      setAiError(err.message || 'Greška pri generisanju opisa.')
    } finally {
      setGenerating(null)
    }
  }

  /** Upload i dodaj novu sliku u galeriju (products.images) */
  const handleGalleryUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    const { path, error: uploadErr } = await uploadProductImage(file, form.slug || 'product')
    if (uploadErr) {
      setError(`Upload greška: ${uploadErr.message}`)
    } else {
      setForm((f) => ({ ...f, images: [...f.images, { path, variant: null }] }))
    }
    setUploading(false)
    e.target.value = ''
  }

  const removeGalleryImage = (idx) =>
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }))

  const moveGalleryImage = (idx, dir) =>
    setForm((f) => {
      const to = idx + dir
      if (to < 0 || to >= f.images.length) return f
      const next = [...f.images]
      ;[next[idx], next[to]] = [next[to], next[idx]]
      return { ...f, images: next }
    })

  const setGalleryVariant = (idx, variant) =>
    setForm((f) => {
      const next = [...f.images]
      next[idx] = { ...next[idx], variant: variant || null }
      return { ...f, images: next }
    })

  /** Sve moguce oznake varijanti za tagovanje slike: pojedinacni okusi i gramaze */
  const variantOptions = useMemo(
    () => [...(form.flavors || []), ...(form.sizes || [])],
    [form.flavors, form.sizes]
  )

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
        hero_stats: (form.hero_stats || []).filter((s) => s?.value?.trim()),
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
            <Field label="Naziv (za kupce) *" hint="Prikazuje se na shopu — piši puno ime brenda (Optimum Nutrition, ne ON)">
              <Input value={form.title} onChange={set('title')} required placeholder="npr. Gold Standard Whey 2kg" />
            </Field>
            <Field label="Interni naziv (ERP)" hint="Za lakše praćenje u sistemu — kupci ga ne vide">
              <Input value={form.internal_title} onChange={set('internal_title')} placeholder="npr. ON GSW 2KG CHOC" />
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
            <div className="md:col-span-2 flex items-center justify-between border rounded-lg px-4 py-3 bg-gray-50">
              <div>
                <p className="font-medium text-sm">⭐ Bestseller</p>
                <p className="text-xs text-muted-foreground">
                  Ručno gurni proizvod među bestsellere na početnoj (inače se rangira automatski po prodaji)
                </p>
              </div>
              <Switch
                checked={form.tags.includes('bestseller')}
                onCheckedChange={(v) => setForm((f) => ({
                  ...f,
                  tags: v ? [...new Set([...f.tags, 'bestseller'])] : f.tags.filter((t) => t !== 'bestseller'),
                }))}
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <p className="text-sm font-medium text-gray-700">Tagovi</p>
              <TagEditor
                value={form.tags}
                onChange={(v) => setForm((f) => ({ ...f, tags: v }))}
                placeholder="npr. new, gainer, best buy…"
                hint="Enter za dodavanje — prikazuju se kao oznake na kartici proizvoda"
              />
            </div>
          </CardContent>
        </Card>

        {/* ── Galerija slika ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Galerija slika</CardTitle>
            <p className="text-xs text-muted-foreground font-normal mt-1">
              Prva slika je naslovna (cover). Svaku sliku možeš vezati za okus ili gramažu — prikaže se
              automatski kad kupac izabere tu varijantu na stranici proizvoda.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {form.images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {form.images.map((entry, idx) => (
                  <div key={idx} className="border rounded-lg overflow-hidden bg-white">
                    <div className="relative aspect-square bg-gray-50">
                      <img
                        src={getProductImageUrl({ image_path: entry.path, image_url: entry.url })}
                        alt=""
                        className="w-full h-full object-contain p-2"
                        onError={(e) => { e.target.style.display = 'none' }}
                      />
                      {idx === 0 && (
                        <span className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">
                          COVER
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(idx)}
                        className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center bg-white/90 hover:bg-white border rounded-full cursor-pointer"
                        title="Ukloni sliku"
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <div className="p-2 space-y-1.5">
                      <Select value={entry.variant ?? '__none__'} onValueChange={(v) => setGalleryVariant(idx, v === '__none__' ? null : v)}>
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue placeholder="Opšta slika" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">Opšta (bez varijante)</SelectItem>
                          {variantOptions.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer bg-transparent border-0"
                          onClick={() => moveGalleryImage(idx, -1)}
                          disabled={idx === 0}
                          title="Pomjeri lijevo/gore"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          className="p-1 text-gray-400 hover:text-gray-700 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer bg-transparent border-0"
                          onClick={() => moveGalleryImage(idx, 1)}
                          disabled={idx === form.images.length - 1}
                          title="Pomjeri desno/dole"
                        >
                          <ArrowDown size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleGalleryUpload}
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
                  : <><Upload size={14} /> Dodaj sliku</>
                }
              </Button>
              <p className="text-xs text-muted-foreground mt-1.5">
                JPG, PNG ili WebP · max 5MB · čuva se u Supabase Storage
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ── Hero sekcija (plava kartica uz sliku) ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Hero sekcija</CardTitle>
            <p className="text-xs text-muted-foreground font-normal mt-1">
              Do 3 najrelevantnije brojke uz sliku proizvoda (npr. 60 · kapsula · po pakovanju). Prazna vrijednost = slot se ne prikazuje.
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="grid grid-cols-[80px_1fr_1fr] gap-3">
                <Input
                  placeholder={['60', '30', '2'][i]}
                  value={form.hero_stats?.[i]?.value ?? ''}
                  onChange={(e) => setForm((f) => {
                    const hs = [...(f.hero_stats || [])]
                    hs[i] = { ...hs[i], value: e.target.value }
                    return { ...f, hero_stats: hs }
                  })}
                />
                <Input
                  placeholder={['kapsula', 'porcija', 'kapsule'][i]}
                  value={form.hero_stats?.[i]?.label ?? ''}
                  onChange={(e) => setForm((f) => {
                    const hs = [...(f.hero_stats || [])]
                    hs[i] = { ...hs[i], label: e.target.value }
                    return { ...f, hero_stats: hs }
                  })}
                />
                <Input
                  placeholder={['po pakovanju', 'po pakovanju', '1 porcija = 2 kapsule'][i]}
                  value={form.hero_stats?.[i]?.sub ?? ''}
                  onChange={(e) => setForm((f) => {
                    const hs = [...(f.hero_stats || [])]
                    hs[i] = { ...hs[i], sub: e.target.value }
                    return { ...f, hero_stats: hs }
                  })}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* ── Opis (tabovi na stranici proizvoda) ── */}
        <Card>
          <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Opis proizvoda</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Popunjava samo prazna polja — za regenerisanje jednog polja klikni AI pored njega.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5 shrink-0"
              disabled={generating !== null || (!form.brand.trim() || !form.title.trim())}
              onClick={() => generateCopy(null)}
            >
              {generating === 'all' ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} className="text-violet-600" />}
              {generating === 'all' ? 'Generiše…' : 'AI generiši opis'}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiError && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 text-xs">{aiError}</div>
            )}
            <Field
              label="Opis"
              right={<AiFieldButton busy={generating === 'description'} disabled={generating !== null} onClick={() => generateCopy('description')} />}
            >
              <Textarea value={form.description} onChange={set('description')} rows={4} placeholder="Kratak opis proizvoda…" />
            </Field>
            <Field
              label="Način upotrebe"
              hint="Prikazuje se kao poseban tab (Ostrovit stil)"
              right={<AiFieldButton busy={generating === 'usage_instructions'} disabled={generating !== null} onClick={() => generateCopy('usage_instructions')} />}
            >
              <Textarea value={form.usage_instructions} onChange={set('usage_instructions')} rows={3} placeholder="npr. Pomiješajte 1 mjericu (30g) s 250ml vode…" />
            </Field>
            <Field
              label="Sastav"
              right={<AiFieldButton busy={generating === 'composition'} disabled={generating !== null} onClick={() => generateCopy('composition')} />}
            >
              <Textarea value={form.composition} onChange={set('composition')} rows={3} placeholder="Sastojci proizvoda…" />
            </Field>
            <Field
              label="Nutritivne vrijednosti"
              right={<AiFieldButton busy={generating === 'nutrition_info'} disabled={generating !== null} onClick={() => generateCopy('nutrition_info')} />}
            >
              <Textarea value={form.nutrition_info} onChange={set('nutrition_info')} rows={4} placeholder="Na 100g / po porciji…" />
            </Field>
          </CardContent>
        </Card>

        {/* ── Varijante + Stanje ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Varijante i stanje na lageru</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            </div>
            <StockTable
              flavors={form.flavors}
              sizes={form.sizes}
              stockVariants={form.stock_variants}
              stock={form.stock}
              onChangeVariants={(sv) => setForm((f) => ({ ...f, stock_variants: sv }))}
              onChangeStock={(s) => setForm((f) => ({ ...f, stock: s }))}
            />
          </CardContent>
        </Card>

        {/* ── One-click add-oni ── */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Add-on proizvodi u korpi</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Kad kupac ubaci ovaj proizvod u korpu, ponudit ćemo mu ove artikle na jedan klik.
              Ostavi cijenu praznu da se koristi redovna.
            </p>
          </CardHeader>
          <CardContent>
            <AddonEditor
              selfId={isNew ? null : id}
              value={form.addons}
              onChange={(v) => setForm((f) => ({ ...f, addons: v }))}
            />
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
