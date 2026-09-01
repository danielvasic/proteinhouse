import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, Search, Package, Upload, CheckCircle2, XCircle, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'
import { supabase, getProductThumbUrl, uploadProductImage } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Switch } from '../../components/ui/switch'
import { cn } from '../../lib/utils'
import { Card, CardContent } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'

function BatchUploader({ onDone }) {
  const [open,     setOpen]     = useState(false)
  const [results,  setResults]  = useState([])  // [{name, status, url, matched}]
  const [running,  setRunning]  = useState(false)
  const fileRef = useRef(null)

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setRunning(true)
    setResults(files.map((f) => ({ name: f.name, status: 'waiting' })))

    // Load all product slugs once
    const { data: prods } = await supabase.from('products').select('id, slug')
    const slugMap = Object.fromEntries((prods ?? []).map((p) => [p.slug, p.id]))

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setResults((r) => r.map((x, idx) => idx === i ? { ...x, status: 'uploading' } : x))

      const { path, error } = await uploadProductImage(file, file.name.replace(/\.[^.]+$/, ''))
      if (error) {
        setResults((r) => r.map((x, idx) => idx === i ? { ...x, status: 'error', error: error.message } : x))
        continue
      }

      const { data } = supabase.storage.from('product-images').getPublicUrl(path)
      const url = data.publicUrl

      // Try to match slug from filename (strip extension, then try substrings)
      const nameStem = file.name.replace(/\.[^.]+$/, '').toLowerCase()
      const matchedId = slugMap[nameStem] ??
        Object.entries(slugMap).find(([slug]) => nameStem.includes(slug) || slug.includes(nameStem))?.[1]

      if (matchedId) {
        await supabase.from('products').update({ image_path: path, image_url: '' }).eq('id', matchedId)
        setResults((r) => r.map((x, idx) => idx === i ? { ...x, status: 'ok', url, matched: true } : x))
      } else {
        setResults((r) => r.map((x, idx) => idx === i ? { ...x, status: 'ok', url, matched: false } : x))
      }
    }

    setRunning(false)
    e.target.value = ''
    onDone()
  }

  const done  = results.filter((r) => r.status === 'ok').length
  const total = results.length

  return (
    <Card className="border-dashed border-emerald-200 bg-emerald-50/40">
      <CardContent className="p-4">
        <button
          type="button"
          className="flex items-center justify-between w-full text-left"
          onClick={() => setOpen((o) => !o)}
        >
          <div className="flex items-center gap-2">
            <Upload size={16} className="text-emerald-600" />
            <span className="text-sm font-semibold text-emerald-800">Batch upload slika proizvoda</span>
            {total > 0 && !running && (
              <Badge variant="emerald" className="text-xs">{done}/{total} uploadovano</Badge>
            )}
          </div>
          {open ? <ChevronUp size={16} className="text-emerald-600" /> : <ChevronDown size={16} className="text-emerald-600" />}
        </button>

        {open && (
          <div className="mt-4 space-y-3">
            <p className="text-xs text-emerald-700">
              Odaberi više slika odjednom. Ako ime fajla odgovara slug-u proizvoda (npr. <code className="bg-white px-1 rounded">on-gold-standard-whey-908g.jpg</code>), slika se automatski dodjeljuje proizvodu.
            </p>

            <div>
              <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileRef.current?.click()}
                disabled={running}
                className="flex items-center gap-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              >
                {running
                  ? <><RefreshCw size={13} className="animate-spin" /> Uploaduje se…</>
                  : <><Upload size={13} /> Odaberi slike</>
                }
              </Button>
            </div>

            {results.length > 0 && (
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {results.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs py-1 border-b border-emerald-100 last:border-0">
                    {r.status === 'waiting'   && <div className="h-3 w-3 rounded-full bg-gray-300 shrink-0" />}
                    {r.status === 'uploading' && <RefreshCw size={12} className="animate-spin text-blue-500 shrink-0" />}
                    {r.status === 'ok'        && <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />}
                    {r.status === 'error'     && <XCircle size={13} className="text-red-500 shrink-0" />}
                    <span className="flex-1 truncate text-gray-700">{r.name}</span>
                    {r.status === 'ok' && (
                      <span className={`shrink-0 font-medium ${r.matched ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {r.matched ? 'Dodijeljeno ✓' : 'Uploadovano (ručno dodijeli)'}
                      </span>
                    )}
                    {r.status === 'error' && <span className="text-red-500 shrink-0">{r.error}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const PO_STRANICI = 50

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [upit, setUpit]       = useState('')   // pretraga nakon odgode
  const [stranica, setStranica] = useState(0)
  const [ukupno, setUkupno]   = useState(0)
  // 'sve' | 'objavljeni' | 'nacrti'
  const [status, setStatus]   = useState('sve')
  const [brojaci, setBrojaci] = useState({ objavljeni: 0, nacrti: 0 })

  // Pretraga ceka da prestanes tipkati — inace bi svaki znak bio upit na
  // bazu preko cijelog kataloga.
  useEffect(() => {
    const t = setTimeout(() => { setUpit(search.trim()); setStranica(0) }, 300)
    return () => clearTimeout(t)
  }, [search])

  const load = async () => {
    setLoading(true)
    // Paginacija je na SERVERU, ne u pregledniku. Ranije se citalo sve
    // odjednom bez ogranicenja — a Supabase REST rezuje na 1000 redova, pa
    // su zadnji proizvodi jednostavno nedostajali iz popisa.
    let q = supabase
      .from('products')
      .select('id, brand, title, internal_title, price, old_price, category, is_active, badge, image_url, image_path, images',
        { count: 'exact' })

    if (status === 'objavljeni') q = q.eq('is_active', true)
    if (status === 'nacrti')     q = q.eq('is_active', false)

    // I pretraga ide na server — inace bi trazila samo po trenutnoj stranici.
    if (upit) {
      const uzorak = `%${upit.replace(/[%,]/g, ' ')}%`
      q = q.or([
        `brand.ilike.${uzorak}`,
        `title.ilike.${uzorak}`,
        `internal_title.ilike.${uzorak}`,
        `category.ilike.${uzorak}`,
      ].join(','))
    }

    const od = stranica * PO_STRANICI
    const { data, count } = await q
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .range(od, od + PO_STRANICI - 1)

    setProducts(data ?? [])
    setUkupno(count ?? 0)
    setLoading(false)
  }

  useEffect(() => { load() }, [upit, stranica, status])   // eslint-disable-line react-hooks/exhaustive-deps

  const zadnjaStranica = Math.max(0, Math.ceil(ukupno / PO_STRANICI) - 1)

  // Brojaci po statusu se citaju zasebno: `ukupno` prati trenutni filter, pa
  // bi inace u pogledu "Nacrti" pisalo da objavljenih nema nijedan.
  useEffect(() => {
    async function prebroji() {
      const [{ count: obj }, { count: nac }] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', false),
      ])
      setBrojaci({ objavljeni: obj ?? 0, nacrti: nac ?? 0 })
    }
    prebroji().catch(() => {})
  }, [products])

  const toggleActive = async (id, current) => {
    await supabase.from('products').update({ is_active: !current }).eq('id', id)
    setProducts((ps) => ps.map((p) => p.id === id ? { ...p, is_active: !current } : p))
  }

  const handleDelete = async (id, title) => {
    if (!confirm(`Obrisati "${title}"?`)) return
    await supabase.from('products').delete().eq('id', id)
    setProducts((ps) => ps.filter((p) => p.id !== id))
    setUkupno((n) => Math.max(0, n - 1))
  }

  // Pretraga i stranicenje su na serveru; ovo je samo ono sto je stiglo.
  const filtered = products

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Proizvodi</h2>
          <p className="text-sm text-muted-foreground">
            {upit ? `${ukupno} po pretrazi` : `${ukupno} ukupno`}
            {ukupno > PO_STRANICI && ` · stranica ${stranica + 1}/${zadnjaStranica + 1}`}
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/proizvodi/novi" className="flex items-center gap-2">
            <Plus size={16} /> Novi proizvod
          </Link>
        </Button>
      </div>

      <BatchUploader onDone={load} />

      {/* Filter po statusu — od 1043 proizvoda objavljeno je 18, pa je bez
          ovoga prva stranica uvijek same nacrti i izgleda kao da nista nije
          aktivno. */}
      <div className="flex flex-wrap items-center gap-1.5">
        {[
          ['sve',        'Sve',        brojaci.objavljeni + brojaci.nacrti],
          ['objavljeni', 'Objavljeni', brojaci.objavljeni],
          ['nacrti',     'Nacrti',     brojaci.nacrti],
        ].map(([kljuc, oznaka, n]) => (
          <button
            key={kljuc}
            onClick={() => { setStatus(kljuc); setStranica(0) }}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
              status === kljuc
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400',
            )}
          >
            {oznaka} <span className="opacity-60">{n}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Pretraži proizvode…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-7 w-7 rounded-full border-4 border-gray-200 border-t-emerald-500 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Slika</TableHead>
                  <TableHead>Naziv</TableHead>
                  <TableHead>Kategorija</TableHead>
                  <TableHead>Cijena</TableHead>
                  <TableHead>Aktivan</TableHead>
                  <TableHead className="text-right">Akcije</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <div className="flex flex-col items-center py-12 text-muted-foreground">
                        <Package size={36} className="mb-3 opacity-30" />
                        <p className="text-sm">Nema proizvoda.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        {(p.images?.length || p.image_path || p.image_url)
                          ? <img src={getProductThumbUrl(p)} alt="" className="w-12 h-12 rounded-lg object-cover border" onError={(e) => { e.target.style.display='none' }} />
                          : <div className="w-12 h-12 rounded-lg border bg-gray-100 flex items-center justify-center text-gray-400 text-xs">?</div>
                        }
                      </TableCell>
                      <TableCell>
                        <p className="text-xs text-muted-foreground font-medium">{p.brand}</p>
                        <p className="font-semibold text-sm leading-tight mt-0.5">{p.title}</p>
                        {p.internal_title && <p className="text-[11px] text-muted-foreground font-mono mt-0.5">ERP: {p.internal_title}</p>}
                        {p.badge && <Badge variant="warning" className="mt-1 text-[10px]">{p.badge}</Badge>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">{p.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className={`font-bold text-sm ${p.old_price ? 'text-emerald-600' : 'text-gray-900'}`}>
                            {Number(p.price).toFixed(2)} KM
                          </span>
                          {p.old_price && (
                            <span className="text-xs text-muted-foreground line-through">
                              {Number(p.old_price).toFixed(2)} KM
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Switch
                            checked={p.is_active}
                            onCheckedChange={() => toggleActive(p.id, p.is_active)}
                          />
                          {/* Rijec uz prekidac: sam prekidac se na popisu od
                              50 redova tesko cita, pogotovo kad su svi isti. */}
                          <span className={cn(
                            'text-[11px] font-medium',
                            p.is_active ? 'text-emerald-600' : 'text-gray-400',
                          )}>
                            {p.is_active ? 'Objavljen' : 'Nacrt'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/admin/proizvodi/${p.id}`}>
                              <Pencil size={15} />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(p.id, p.title)}
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}

          {ukupno > PO_STRANICI && (
            <div className="flex items-center justify-between gap-4 pt-4 mt-2 border-t">
              <p className="text-xs text-muted-foreground">
                {stranica * PO_STRANICI + 1}–{Math.min((stranica + 1) * PO_STRANICI, ukupno)} od {ukupno}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={stranica === 0 || loading}
                  onClick={() => setStranica((n) => Math.max(0, n - 1))}>
                  Prethodna
                </Button>
                <Button variant="outline" size="sm" disabled={stranica >= zadnjaStranica || loading}
                  onClick={() => setStranica((n) => Math.min(zadnjaStranica, n + 1))}>
                  Sljedeća
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
