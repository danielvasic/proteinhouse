import { useEffect, useState, useMemo } from 'react'
import { Save, RefreshCw, GripVertical, X, Search, LayoutDashboard } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { products as allProducts } from '../../data/catalog'

// Two carousel sections on the homepage
const SECTIONS = [
  {
    key: 'new_arrivals',
    label: 'Najnoviji proizvodi',
    defaultTitle: 'NAJNOVIJI PROIZVODI',
    defaultEyebrow: 'Tek pristigli',
    defaultIds: ['p1', 'p2', 'p3', 'p4', 'p5', 'p6', 'p7', 'p8'],
    defaultSlug: 'proteini',
  },
  {
    key: 'bestsellers',
    label: 'Najprodavaniji proizvodi',
    defaultTitle: 'NAJPRODAVANIJI PROIZVODI',
    defaultEyebrow: 'Top proizvodi ove sedmice',
    defaultIds: ['p3', 'p4', 'p5', 'p6', 'p7', 'p8', 'p9', 'p10'],
    defaultSlug: 'akcija',
  },
]

function ProductRow({ product, onRemove }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 border border-gray-200 bg-white group">
      <GripVertical size={14} className="text-gray-300 shrink-0 cursor-grab" />
      <img src={product.img} alt={product.title} className="w-10 h-10 object-cover border border-gray-100 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{product.brand}</p>
        <p className="text-sm font-semibold text-gray-800 truncate">{product.title}</p>
      </div>
      <span className="text-sm font-bold text-gray-700 shrink-0">{product.price} KM</span>
      <button
        className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors duration-150 cursor-pointer bg-transparent border-0 shrink-0"
        onClick={() => onRemove(product.id)}
        aria-label="Ukloni"
      >
        <X size={14} />
      </button>
    </div>
  )
}

function SectionEditor({ section }) {
  const [config, setConfig] = useState({
    title: section.defaultTitle,
    eyebrow: section.defaultEyebrow,
    categorySlug: section.defaultSlug,
    productIds: section.defaultIds,
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('site_content')
        .select('key, value')
        .in('key', [
          `carousel_${section.key}_title`,
          `carousel_${section.key}_eyebrow`,
          `carousel_${section.key}_slug`,
          `carousel_${section.key}_ids`,
        ])

      if (data?.length) {
        const map = Object.fromEntries(data.map((r) => [r.key, r.value]))
        setConfig({
          title:        map[`carousel_${section.key}_title`]?.text      ?? section.defaultTitle,
          eyebrow:      map[`carousel_${section.key}_eyebrow`]?.text    ?? section.defaultEyebrow,
          categorySlug: map[`carousel_${section.key}_slug`]?.text       ?? section.defaultSlug,
          productIds:   map[`carousel_${section.key}_ids`]?.ids         ?? section.defaultIds,
        })
      }
      setLoading(false)
    }
    load()
  }, [section.key])

  const selectedProducts = useMemo(
    () => config.productIds.map((id) => allProducts.find((p) => p.id === id)).filter(Boolean),
    [config.productIds]
  )

  const availableProducts = useMemo(() => {
    const sel = new Set(config.productIds)
    return allProducts.filter(
      (p) => !sel.has(p.id) &&
        (p.title.toLowerCase().includes(search.toLowerCase()) ||
         p.brand.toLowerCase().includes(search.toLowerCase()))
    )
  }, [config.productIds, search])

  const addProduct = (id) => {
    if (config.productIds.length >= 12) return
    setConfig((c) => ({ ...c, productIds: [...c.productIds, id] }))
    setSaved(false)
  }

  const removeProduct = (id) => {
    setConfig((c) => ({ ...c, productIds: c.productIds.filter((x) => x !== id) }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const upserts = [
        { key: `carousel_${section.key}_title`,  value: { text: config.title } },
        { key: `carousel_${section.key}_eyebrow`, value: { text: config.eyebrow } },
        { key: `carousel_${section.key}_slug`,   value: { text: config.categorySlug } },
        { key: `carousel_${section.key}_ids`,    value: { ids: config.productIds } },
      ].map((r) => ({ ...r, updated_at: new Date().toISOString() }))

      await supabase.from('site_content').upsert(upserts, { onConflict: 'key' })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="py-8 text-center text-sm text-muted-foreground">Učitavanje…</div>

  return (
    <div className="space-y-5">
      {/* Section config */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Konfiguracija sekcije</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label>Naslov sekcije</Label>
            <Input value={config.title} onChange={(e) => setConfig((c) => ({ ...c, title: e.target.value }))} placeholder="NAJNOVIJI PROIZVODI" />
          </div>
          <div className="space-y-1.5">
            <Label>Eyebrow tekst</Label>
            <Input value={config.eyebrow} onChange={(e) => setConfig((c) => ({ ...c, eyebrow: e.target.value }))} placeholder="Tek pristigli" />
          </div>
          <div className="space-y-1.5">
            <Label>Link kategorije (slug)</Label>
            <Input value={config.categorySlug} onChange={(e) => setConfig((c) => ({ ...c, categorySlug: e.target.value }))} placeholder="proteini" />
          </div>
        </CardContent>
      </Card>

      {/* Selected products */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Odabrani proizvodi ({selectedProducts.length}/12)</CardTitle>
              <CardDescription>Prikazuju se u carouselu na početnoj stranici.</CardDescription>
            </div>
            <Button onClick={handleSave} disabled={saving} size="sm" className="flex items-center gap-2">
              {saving ? <><RefreshCw size={13} className="animate-spin" /> Snimanje…</> : saved ? '✓ Snimljeno!' : <><Save size={13} /> Snimi</>}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {selectedProducts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nema odabranih proizvoda. Dodajte ih iz liste ispod.</p>
          ) : (
            selectedProducts.map((p) => (
              <ProductRow key={p.id} product={p} onRemove={removeProduct} />
            ))
          )}
        </CardContent>
      </Card>

      {/* Product picker */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Dodaj proizvode</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Pretraži po nazivu ili brendu…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="max-h-[300px] overflow-y-auto space-y-1 pr-1">
            {availableProducts.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nema dostupnih proizvoda.</p>
            )}
            {availableProducts.map((p) => (
              <button
                key={p.id}
                className="w-full flex items-center gap-3 px-3 py-2.5 border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 cursor-pointer text-left"
                onClick={() => addProduct(p.id)}
              >
                <img src={p.img} alt={p.title} className="w-10 h-10 object-cover border border-gray-100 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{p.brand}</p>
                  <p className="text-sm font-semibold text-gray-800 truncate">{p.title}</p>
                </div>
                <span className="text-sm font-bold text-gray-700 shrink-0">{p.price} KM</span>
                <span className="text-xs text-primary font-bold px-2 py-1 border border-primary/30 shrink-0">+ Dodaj</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function FeaturedSections() {
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center gap-3">
        <LayoutDashboard size={20} className="text-muted-foreground" />
        <div>
          <h2 className="text-xl font-bold text-gray-900">Istaknuti sadržaj</h2>
          <p className="text-sm text-muted-foreground">Upravljajte proizvodima koji se prikazuju u carousel sekcijama na početnoj stranici.</p>
        </div>
      </div>

      <Tabs defaultValue="new_arrivals">
        <TabsList>
          {SECTIONS.map((s) => (
            <TabsTrigger key={s.key} value={s.key}>{s.label}</TabsTrigger>
          ))}
        </TabsList>
        {SECTIONS.map((s) => (
          <TabsContent key={s.key} value={s.key} className="mt-4">
            <SectionEditor section={s} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
