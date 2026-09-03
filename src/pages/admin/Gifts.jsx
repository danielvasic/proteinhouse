import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Pencil, Trash2, Gift, Save, Upload, RefreshCw } from 'lucide-react'
import { supabase, getProductImageUrl, uploadProductImage } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Switch } from '../../components/ui/switch'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { fmtKM } from '../../lib/price'

export const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']
export const SHOE_SIZES     = ['38', '39', '40', '41', '42', '43', '44', '45', '46', '47']
const NO_SIZE_KEY = '_'

function sizeKeysFor(type) {
  if (type === 'shoes')  return SHOE_SIZES
  if (type === 'none')   return [NO_SIZE_KEY]
  return CLOTHING_SIZES
}

const EMPTY_CAMPAIGN = {
  name: '', headline: '', subtitle: '', min_order_total: 200,
  allow_mystery: true, mystery_label: 'Mystery Gift', mystery_description: '',
  is_active: true, starts_at: '', ends_at: '', sort_order: 0,
}

const EMPTY_GIFT = {
  brand: '', title: '', description: '', image_path: '', image_url: '',
  size_type: 'clothing', stock_by_size: {}, mystery_eligible: true,
  is_active: true, sort_order: 0,
}

function totalStock(gift) {
  return Object.values(gift.stock_by_size ?? {}).reduce((s, n) => s + (Number(n) || 0), 0)
}

export default function Gifts() {
  const [campaigns, setCampaigns] = useState([])
  const [gifts,     setGifts]     = useState([])
  const [activeId,  setActiveId]  = useState(null)
  const [loading,   setLoading]   = useState(true)

  const [campDialog, setCampDialog] = useState(false)
  const [campEdit,   setCampEdit]   = useState(null)
  const [campForm,   setCampForm]   = useState(EMPTY_CAMPAIGN)

  const [giftDialog, setGiftDialog] = useState(false)
  const [giftEdit,   setGiftEdit]   = useState(null)
  const [giftForm,   setGiftForm]   = useState(EMPTY_GIFT)
  const [uploading,  setUploading]  = useState(false)

  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')
  const fileRef = useRef(null)

  const loadCampaigns = async () => {
    const { data } = await supabase.from('gift_campaigns').select('*').order('sort_order').order('created_at', { ascending: false })
    setCampaigns(data ?? [])
    setActiveId((cur) => cur ?? data?.[0]?.id ?? null)
    setLoading(false)
  }

  const loadGifts = async (campaignId) => {
    if (!campaignId) { setGifts([]); return }
    const { data } = await supabase.from('gift_products').select('*').eq('campaign_id', campaignId).order('sort_order').order('created_at')
    setGifts(data ?? [])
  }

  useEffect(() => { loadCampaigns() }, [])
  useEffect(() => { loadGifts(activeId) }, [activeId])

  const activeCampaign = useMemo(() => campaigns.find((c) => c.id === activeId) ?? null, [campaigns, activeId])

  // ── Kampanje ──────────────────────────────────────────────────────────────
  const openNewCamp  = () => { setCampEdit(null); setCampForm(EMPTY_CAMPAIGN); setError(''); setCampDialog(true) }
  const openEditCamp = (c) => {
    setCampEdit(c)
    setCampForm({
      ...EMPTY_CAMPAIGN, ...c,
      headline: c.headline ?? '', subtitle: c.subtitle ?? '', mystery_description: c.mystery_description ?? '',
      starts_at: c.starts_at?.split('T')[0] ?? '', ends_at: c.ends_at?.split('T')[0] ?? '',
    })
    setError(''); setCampDialog(true)
  }

  const saveCampaign = async () => {
    setError('')
    if (!campForm.name.trim()) { setError('Naziv kampanje je obavezan.'); return }
    setSaving(true)
    try {
      const payload = {
        name: campForm.name.trim(),
        headline: campForm.headline || null,
        subtitle: campForm.subtitle || null,
        min_order_total: parseFloat(campForm.min_order_total) || 0,
        allow_mystery: campForm.allow_mystery,
        mystery_label: campForm.mystery_label || 'Mystery Gift',
        mystery_description: campForm.mystery_description || null,
        is_active: campForm.is_active,
        sort_order: parseInt(campForm.sort_order) || 0,
        starts_at: campForm.starts_at ? new Date(campForm.starts_at).toISOString() : null,
        ends_at:   campForm.ends_at   ? new Date(campForm.ends_at).toISOString()   : null,
      }
      const { error: err } = campEdit
        ? await supabase.from('gift_campaigns').update(payload).eq('id', campEdit.id)
        : await supabase.from('gift_campaigns').insert(payload)
      if (err) throw err
      setCampDialog(false)
      loadCampaigns()
    } catch (err) { setError(err.message) } finally { setSaving(false) }
  }

  const deleteCampaign = async (c) => {
    if (!confirm(`Obrisati kampanju "${c.name}" i sve njene poklone?`)) return
    await supabase.from('gift_campaigns').delete().eq('id', c.id)
    setActiveId(null)
    loadCampaigns()
  }

  // ── Poklon artikli ────────────────────────────────────────────────────────
  const openNewGift  = () => { setGiftEdit(null); setGiftForm(EMPTY_GIFT); setError(''); setGiftDialog(true) }
  const openEditGift = (g) => {
    setGiftEdit(g)
    setGiftForm({
      ...EMPTY_GIFT, ...g,
      brand: g.brand ?? '', description: g.description ?? '',
      image_path: g.image_path ?? '', image_url: g.image_url ?? '',
      stock_by_size: g.stock_by_size ?? {},
    })
    setError(''); setGiftDialog(true)
  }

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const { path, error: err } = await uploadProductImage(file, `poklon-${Date.now()}`)
    if (err) setError(err.message)
    else setGiftForm((f) => ({ ...f, image_path: path, image_url: '' }))
    setUploading(false)
    e.target.value = ''
  }

  const setStock = (size, qty) =>
    setGiftForm((f) => ({ ...f, stock_by_size: { ...f.stock_by_size, [size]: Math.max(0, parseInt(qty) || 0) } }))

  const saveGift = async () => {
    setError('')
    if (!giftForm.title.trim()) { setError('Naziv poklona je obavezan.'); return }
    setSaving(true)
    try {
      // Zadrži samo veličine koje pripadaju izabranom tipu i imaju stanje > 0
      const allowed = sizeKeysFor(giftForm.size_type)
      const stock = Object.fromEntries(
        allowed.map((s) => [s, Number(giftForm.stock_by_size[s]) || 0]).filter(([, n]) => n > 0)
      )
      const payload = {
        campaign_id: activeId,
        brand: giftForm.brand || null,
        title: giftForm.title.trim(),
        description: giftForm.description || null,
        image_path: giftForm.image_path || null,
        image_url:  giftForm.image_url  || null,
        size_type: giftForm.size_type,
        stock_by_size: stock,
        mystery_eligible: giftForm.mystery_eligible,
        is_active: giftForm.is_active,
        sort_order: parseInt(giftForm.sort_order) || 0,
      }
      const { error: err } = giftEdit
        ? await supabase.from('gift_products').update(payload).eq('id', giftEdit.id)
        : await supabase.from('gift_products').insert(payload)
      if (err) throw err
      setGiftDialog(false)
      loadGifts(activeId)
    } catch (err) { setError(err.message) } finally { setSaving(false) }
  }

  const deleteGift = async (g) => {
    if (!confirm(`Obrisati poklon "${g.title}"?`)) return
    await supabase.from('gift_products').delete().eq('id', g.id)
    setGifts((gs) => gs.filter((x) => x.id !== g.id))
  }

  if (loading) {
    return <div className="flex items-center justify-center py-16"><div className="h-7 w-7 rounded-full border-4 border-gray-200 border-t-emerald-500 animate-spin" /></div>
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Gratis pokloni</h2>
          <p className="text-sm text-muted-foreground">Kupac bira poklon u korpi kad pređe prag narudžbe</p>
        </div>
        <Button onClick={openNewCamp} className="flex items-center gap-2"><Plus size={16} /> Nova kampanja</Button>
      </div>

      {campaigns.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center py-16 text-muted-foreground">
          <Gift size={36} className="mb-3 opacity-30" />
          <p className="text-sm">Nema kampanja. Kreirajte prvu da biste dodavali poklone.</p>
        </CardContent></Card>
      ) : (
        <>
          {/* Izbor kampanje */}
          <div className="flex flex-wrap gap-2">
            {campaigns.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors cursor-pointer ${
                  c.id === activeId ? 'border-primary bg-primary/5 text-primary' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {c.name}
                {!c.is_active && <span className="ml-2 text-xs text-muted-foreground">(neaktivna)</span>}
              </button>
            ))}
          </div>

          {activeCampaign && (
            <Card>
              <CardHeader className="pb-3 flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle className="text-base">{activeCampaign.headline || activeCampaign.name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Prag: <strong>{fmtKM(activeCampaign.min_order_total)}</strong>
                    {activeCampaign.allow_mystery && ` · ${activeCampaign.mystery_label} uključen`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => openEditCamp(activeCampaign)}><Pencil size={15} /></Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => deleteCampaign(activeCampaign)}>
                    <Trash2 size={15} />
                  </Button>
                </div>
              </CardHeader>
            </Card>
          )}

          {/* Poklon artikli */}
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">{gifts.length} poklon artikala</p>
            <Button variant="outline" size="sm" onClick={openNewGift} className="flex items-center gap-2">
              <Plus size={15} /> Dodaj poklon
            </Button>
          </div>

          <Card><CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Slika</TableHead>
                  <TableHead>Artikal</TableHead>
                  <TableHead>Veličine na stanju</TableHead>
                  <TableHead>Ukupno</TableHead>
                  <TableHead>Mystery</TableHead>
                  <TableHead className="text-right">Akcije</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gifts.length === 0 ? (
                  <TableRow><TableCell colSpan={6}>
                    <div className="flex flex-col items-center py-12 text-muted-foreground">
                      <Gift size={36} className="mb-3 opacity-30" />
                      <p className="text-sm">Nema poklona u ovoj kampanji.</p>
                    </div>
                  </TableCell></TableRow>
                ) : gifts.map((g) => (
                  <TableRow key={g.id} className={g.is_active ? '' : 'opacity-50'}>
                    <TableCell>
                      {(g.image_path || g.image_url)
                        ? <img src={getProductImageUrl(g)} alt="" className="w-12 h-12 rounded-lg object-cover border" />
                        : <div className="w-12 h-12 rounded-lg border bg-gray-100 flex items-center justify-center text-gray-400"><Gift size={16} /></div>}
                    </TableCell>
                    <TableCell>
                      {g.brand && <p className="text-xs text-muted-foreground font-medium">{g.brand}</p>}
                      <p className="font-semibold text-sm">{g.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {g.size_type === 'shoes' ? 'Obuća' : g.size_type === 'none' ? 'Bez veličine' : 'Odjeća'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(g.stock_by_size ?? {}).filter(([, n]) => n > 0).map(([s, n]) => (
                          <Badge key={s} variant="secondary" className="text-[10px]">
                            {s === NO_SIZE_KEY ? 'kom' : s}: {n}
                          </Badge>
                        ))}
                        {totalStock(g) === 0 && <span className="text-xs text-amber-600">Rasprodano</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm font-semibold">{totalStock(g)}</TableCell>
                    <TableCell>{g.mystery_eligible ? <Badge variant="emerald">Da</Badge> : <span className="text-xs text-muted-foreground">Ne</span>}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditGift(g)}><Pencil size={15} /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => deleteGift(g)}><Trash2 size={15} /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </>
      )}

      {/* ── Dialog: kampanja ── */}
      <Dialog open={campDialog} onOpenChange={setCampDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{campEdit ? 'Uredi kampanju' : 'Nova kampanja'}</DialogTitle></DialogHeader>
          {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">{error}</div>}

          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="space-y-1.5 col-span-2">
              <Label>Interni naziv *</Label>
              <Input value={campForm.name} onChange={(e) => setCampForm((f) => ({ ...f, name: e.target.value }))} placeholder="Gorilla Wear poklon" />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Naslov koji vidi kupac</Label>
              <Input value={campForm.headline} onChange={(e) => setCampForm((f) => ({ ...f, headline: e.target.value }))} placeholder="Odaberi svoj besplatni Gorilla Wear poklon" />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Podnaslov</Label>
              <Input value={campForm.subtitle} onChange={(e) => setCampForm((f) => ({ ...f, subtitle: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Prag narudžbe (KM)</Label>
              <Input type="number" step="0.01" value={campForm.min_order_total} onChange={(e) => setCampForm((f) => ({ ...f, min_order_total: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Redoslijed</Label>
              <Input type="number" value={campForm.sort_order} onChange={(e) => setCampForm((f) => ({ ...f, sort_order: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Važi od</Label>
              <Input type="date" value={campForm.starts_at} onChange={(e) => setCampForm((f) => ({ ...f, starts_at: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Važi do</Label>
              <Input type="date" value={campForm.ends_at} onChange={(e) => setCampForm((f) => ({ ...f, ends_at: e.target.value }))} />
            </div>

            <div className="col-span-2 flex items-center justify-between border-t pt-3">
              <div>
                <p className="text-sm font-medium">Ponudi Mystery Gift</p>
                <p className="text-xs text-muted-foreground">Kupac prepušta izbor vama, samo označi veličinu</p>
              </div>
              <Switch checked={campForm.allow_mystery} onCheckedChange={(v) => setCampForm((f) => ({ ...f, allow_mystery: v }))} />
            </div>
            {campForm.allow_mystery && (
              <>
                <div className="space-y-1.5 col-span-2">
                  <Label>Naziv Mystery opcije</Label>
                  <Input value={campForm.mystery_label} onChange={(e) => setCampForm((f) => ({ ...f, mystery_label: e.target.value }))} />
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label>Opis Mystery opcije</Label>
                  <Textarea rows={2} value={campForm.mystery_description} onChange={(e) => setCampForm((f) => ({ ...f, mystery_description: e.target.value }))} />
                </div>
              </>
            )}
            <div className="col-span-2 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Aktivna</p>
                <p className="text-xs text-muted-foreground">Prikazuje se kupcima u korpi</p>
              </div>
              <Switch checked={campForm.is_active} onCheckedChange={(v) => setCampForm((f) => ({ ...f, is_active: v }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCampDialog(false)}>Otkaži</Button>
            <Button onClick={saveCampaign} disabled={saving} className="flex items-center gap-2">
              <Save size={14} />{saving ? 'Snimanje…' : 'Snimi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Dialog: poklon artikal ── */}
      <Dialog open={giftDialog} onOpenChange={setGiftDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{giftEdit ? 'Uredi poklon' : 'Novi poklon'}</DialogTitle></DialogHeader>
          {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">{error}</div>}

          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="space-y-1.5">
              <Label>Brend</Label>
              <Input value={giftForm.brand} onChange={(e) => setGiftForm((f) => ({ ...f, brand: e.target.value }))} placeholder="Gorilla Wear" />
            </div>
            <div className="space-y-1.5">
              <Label>Naziv *</Label>
              <Input value={giftForm.title} onChange={(e) => setGiftForm((f) => ({ ...f, title: e.target.value }))} placeholder="Classic Tank Top" />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Opis</Label>
              <Textarea rows={2} value={giftForm.description} onChange={(e) => setGiftForm((f) => ({ ...f, description: e.target.value }))} />
            </div>

            <div className="space-y-1.5 col-span-2">
              <Label>Slika</Label>
              <div className="flex items-center gap-3">
                {(giftForm.image_path || giftForm.image_url) && (
                  <img src={getProductImageUrl(giftForm)} alt="" className="w-16 h-16 rounded-lg object-cover border" />
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
                <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()} className="flex items-center gap-2">
                  {uploading ? <><RefreshCw size={13} className="animate-spin" /> Uploaduje…</> : <><Upload size={13} /> Odaberi sliku</>}
                </Button>
              </div>
            </div>

            <div className="space-y-1.5 col-span-2">
              <Label>Tip veličine</Label>
              <Select value={giftForm.size_type} onValueChange={(v) => setGiftForm((f) => ({ ...f, size_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="clothing">Odjeća (S, M, L…)</SelectItem>
                  <SelectItem value="shoes">Obuća (40, 41, 42…)</SelectItem>
                  <SelectItem value="none">Bez veličine (šejker, bidon…)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2">
              <Label>Stanje po veličini</Label>
              <div className="grid grid-cols-4 gap-2">
                {sizeKeysFor(giftForm.size_type).map((s) => (
                  <div key={s} className="space-y-1">
                    <p className="text-[11px] font-semibold text-muted-foreground text-center">{s === NO_SIZE_KEY ? 'kom' : s}</p>
                    <Input
                      type="number" min="0" className="h-9 text-center"
                      value={giftForm.stock_by_size[s] ?? ''}
                      onChange={(e) => setStock(s, e.target.value)}
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">Veličine sa stanjem 0 se kupcu uopće ne prikazuju.</p>
            </div>

            <div className="col-span-2 flex items-center justify-between border-t pt-3">
              <div>
                <p className="text-sm font-medium">Može ući u Mystery Gift</p>
                <p className="text-xs text-muted-foreground">Ako kupac prepusti izbor vama</p>
              </div>
              <Switch checked={giftForm.mystery_eligible} onCheckedChange={(v) => setGiftForm((f) => ({ ...f, mystery_eligible: v }))} />
            </div>
            <div className="col-span-2 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Aktivan</p>
                <p className="text-xs text-muted-foreground">Vidljiv kupcima u izboru poklona</p>
              </div>
              <Switch checked={giftForm.is_active} onCheckedChange={(v) => setGiftForm((f) => ({ ...f, is_active: v }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setGiftDialog(false)}>Otkaži</Button>
            <Button onClick={saveGift} disabled={saving || uploading} className="flex items-center gap-2">
              <Save size={14} />{saving ? 'Snimanje…' : 'Snimi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
