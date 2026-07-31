import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Ticket, Save } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Switch } from '../../components/ui/switch'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog'

const EMPTY = {
  code: '', description: '',
  discount_percent: '', discount_amount: '', free_shipping: false,
  min_order: '', max_uses: '', once_per_email: false,
  is_active: true, starts_at: '', ends_at: '',
}

export default function Coupons() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('coupons').select('*').order('created_at', { ascending: false })
    setCoupons(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openNew  = () => { setEditItem(null); setForm(EMPTY); setError(''); setDialogOpen(true) }
  const openEdit = (item) => {
    setEditItem(item)
    setForm({
      ...EMPTY, ...item,
      discount_percent: item.discount_percent ?? '',
      discount_amount:  item.discount_amount  ?? '',
      min_order:        item.min_order        ?? '',
      max_uses:         item.max_uses         ?? '',
      description:      item.description       ?? '',
      starts_at: item.starts_at?.split('T')[0] ?? '',
      ends_at:   item.ends_at?.split('T')[0]   ?? '',
    })
    setError('')
    setDialogOpen(true)
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSave = async () => {
    setError('')
    if (!form.code.trim()) { setError('Kod je obavezan.'); return }
    setSaving(true)
    try {
      const payload = {
        code:             form.code.trim().toUpperCase(),
        description:      form.description || null,
        discount_percent: form.discount_percent ? parseInt(form.discount_percent) : null,
        discount_amount:  form.discount_amount  ? parseFloat(form.discount_amount) : null,
        free_shipping:    form.free_shipping,
        min_order:        form.min_order ? parseFloat(form.min_order) : 0,
        max_uses:         form.max_uses  ? parseInt(form.max_uses) : null,
        once_per_email:   form.once_per_email,
        is_active:        form.is_active,
        starts_at:        form.starts_at ? new Date(form.starts_at).toISOString() : null,
        ends_at:          form.ends_at   ? new Date(form.ends_at).toISOString()   : null,
      }
      const { error: err } = editItem
        ? await supabase.from('coupons').update(payload).eq('id', editItem.id)
        : await supabase.from('coupons').insert(payload)
      if (err) throw err
      setDialogOpen(false)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id, code) => {
    if (!confirm(`Obrisati kupon "${code}"?`)) return
    await supabase.from('coupons').delete().eq('id', id)
    setCoupons((cs) => cs.filter((c) => c.id !== id))
  }

  const toggleActive = async (id, current) => {
    await supabase.from('coupons').update({ is_active: !current }).eq('id', id)
    setCoupons((cs) => cs.map((c) => c.id === id ? { ...c, is_active: !current } : c))
  }

  const discountLabel = (c) =>
    c.discount_percent ? `−${c.discount_percent}%`
    : c.discount_amount ? `−${Number(c.discount_amount).toFixed(2)} KM`
    : c.free_shipping   ? 'Besplatna dostava'
    : '—'

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Kuponi</h2>
          <p className="text-sm text-muted-foreground">{coupons.length} kupona · kupac ih unosi na checkoutu</p>
        </div>
        <Button onClick={openNew} className="flex items-center gap-2">
          <Plus size={16} /> Novi kupon
        </Button>
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
                  <TableHead>Kod</TableHead>
                  <TableHead>Popust</TableHead>
                  <TableHead>Uslovi</TableHead>
                  <TableHead>Iskorišten</TableHead>
                  <TableHead>Trajanje</TableHead>
                  <TableHead>Aktivan</TableHead>
                  <TableHead className="text-right">Akcije</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coupons.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div className="flex flex-col items-center py-12 text-muted-foreground">
                        <Ticket size={36} className="mb-3 opacity-30" />
                        <p className="text-sm">Nema kupona. Kreirajte prvi.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : coupons.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell>
                      <code className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono font-bold">{c.code}</code>
                      {c.description && <p className="text-xs text-muted-foreground mt-1">{c.description}</p>}
                    </TableCell>
                    <TableCell><Badge variant="emerald">{discountLabel(c)}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {Number(c.min_order) > 0 && <p>Min. {Number(c.min_order).toFixed(2)} KM</p>}
                      {c.once_per_email && <p>1× po kupcu</p>}
                      {c.free_shipping && c.discount_percent && <p>+ besplatna dostava</p>}
                    </TableCell>
                    <TableCell className="text-xs">
                      {c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ''}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {c.starts_at && <p>Od: {new Date(c.starts_at).toLocaleDateString('bs')}</p>}
                      {c.ends_at   && <p>Do: {new Date(c.ends_at).toLocaleDateString('bs')}</p>}
                      {!c.starts_at && !c.ends_at && '—'}
                    </TableCell>
                    <TableCell>
                      <Switch checked={c.is_active} onCheckedChange={() => toggleActive(c.id, c.is_active)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil size={15} /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(c.id, c.code)}>
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Uredi kupon' : 'Novi kupon'}</DialogTitle>
          </DialogHeader>

          {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">{error}</div>}

          <div className="grid grid-cols-2 gap-3 py-2">
            <div className="space-y-1.5 col-span-2">
              <Label>Kod *</Label>
              <Input value={form.code} onChange={set('code')} placeholder="POPUST5" className="uppercase font-mono" />
            </div>
            <div className="space-y-1.5 col-span-2">
              <Label>Opis (vidi ga kupac kad primijeni kupon)</Label>
              <Input value={form.description} onChange={set('description')} placeholder="Dodatnih 5% popusta na sljedeću kupovinu" />
            </div>
            <div className="space-y-1.5">
              <Label>Popust (%)</Label>
              <Input type="number" min="0" max="100" value={form.discount_percent} onChange={set('discount_percent')} placeholder="5" />
            </div>
            <div className="space-y-1.5">
              <Label>ili fiksni iznos (KM)</Label>
              <Input type="number" step="0.01" value={form.discount_amount} onChange={set('discount_amount')} placeholder="10.00" />
            </div>
            <div className="space-y-1.5">
              <Label>Minimalna narudžba (KM)</Label>
              <Input type="number" step="0.01" value={form.min_order} onChange={set('min_order')} placeholder="0" />
            </div>
            <div className="space-y-1.5">
              <Label>Max. broj korištenja</Label>
              <Input type="number" value={form.max_uses} onChange={set('max_uses')} placeholder="neograničeno" />
            </div>
            <div className="space-y-1.5">
              <Label>Važi od</Label>
              <Input type="date" value={form.starts_at} onChange={set('starts_at')} />
            </div>
            <div className="space-y-1.5">
              <Label>Važi do</Label>
              <Input type="date" value={form.ends_at} onChange={set('ends_at')} />
            </div>

            <div className="col-span-2 flex items-center justify-between border-t pt-3">
              <div>
                <p className="text-sm font-medium">Besplatna dostava</p>
                <p className="text-xs text-muted-foreground">Ukida cijenu dostave bez obzira na iznos</p>
              </div>
              <Switch checked={form.free_shipping} onCheckedChange={(v) => setForm((f) => ({ ...f, free_shipping: v }))} />
            </div>
            <div className="col-span-2 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Jednom po kupcu</p>
                <p className="text-xs text-muted-foreground">Ista email adresa ga može iskoristiti samo jednom</p>
              </div>
              <Switch checked={form.once_per_email} onCheckedChange={(v) => setForm((f) => ({ ...f, once_per_email: v }))} />
            </div>
            <div className="col-span-2 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Aktivan</p>
                <p className="text-xs text-muted-foreground">Kupci ga mogu primijeniti na checkoutu</p>
              </div>
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Otkaži</Button>
            <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
              <Save size={14} />
              {saving ? 'Snimanje…' : 'Snimi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
