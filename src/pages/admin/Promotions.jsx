import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Percent, Save, Calendar } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Switch } from '../../components/ui/switch'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog'
import { fmtDatum } from '../../lib/date'

const EMPTY = {
  title: '', subtitle: '', badge: '', image_url: '', link: '',
  sort_order: 0, is_active: true,
  starts_at: '', ends_at: '',
  discount_percent: '', promo_code: '', description: '',
}

export default function Promotions() {
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('promotions').select('*').order('sort_order').order('created_at', { ascending: false })
    setPromos(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openNew = () => { setEditItem(null); setForm(EMPTY); setError(''); setDialogOpen(true) }
  const openEdit = (item) => { setEditItem(item); setForm({ ...item, starts_at: item.starts_at?.split('T')[0] ?? '', ends_at: item.ends_at?.split('T')[0] ?? '' }); setError(''); setDialogOpen(true) }

  const set = (key) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [key]: val }))
  }

  const handleSave = async () => {
    setError('')
    setSaving(true)
    try {
      const payload = {
        ...form,
        sort_order: parseInt(form.sort_order) || 0,
        discount_percent: form.discount_percent ? parseInt(form.discount_percent) : null,
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
        ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null,
      }
      if (editItem) {
        const { error: err } = await supabase.from('promotions').update(payload).eq('id', editItem.id)
        if (err) throw err
      } else {
        const { error: err } = await supabase.from('promotions').insert(payload)
        if (err) throw err
      }
      setDialogOpen(false)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id, title) => {
    if (!confirm(`Obrisati ponudu "${title}"?`)) return
    await supabase.from('promotions').delete().eq('id', id)
    setPromos((ps) => ps.filter((p) => p.id !== id))
  }

  const toggleActive = async (id, current) => {
    await supabase.from('promotions').update({ is_active: !current }).eq('id', id)
    setPromos((ps) => ps.map((p) => p.id === id ? { ...p, is_active: !current } : p))
  }

  const isExpired = (p) => p.ends_at && new Date(p.ends_at) < new Date()
  const isScheduled = (p) => p.starts_at && new Date(p.starts_at) > new Date()

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Ponude & Promocije</h2>
          <p className="text-sm text-muted-foreground">{promos.length} ponuda</p>
        </div>
        <Button onClick={openNew} className="flex items-center gap-2">
          <Plus size={16} /> Nova ponuda
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
                  <TableHead>Ponuda</TableHead>
                  <TableHead>Kod</TableHead>
                  <TableHead>Popust</TableHead>
                  <TableHead>Trajanje</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Aktivan</TableHead>
                  <TableHead className="text-right">Akcije</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promos.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div className="flex flex-col items-center py-12 text-muted-foreground">
                        <Percent size={36} className="mb-3 opacity-30" />
                        <p className="text-sm">Nema aktivnih ponuda. Kreirajte prvu.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  promos.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {p.image_url
                            ? <img src={p.image_url} alt="" className="w-10 h-10 rounded-lg object-cover border shrink-0" />
                            : <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0"><Percent size={16} /></div>
                          }
                          <div>
                            <p className="font-semibold text-sm">{p.title}</p>
                            {p.subtitle && <p className="text-xs text-muted-foreground">{p.subtitle}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {p.promo_code
                          ? <code className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono font-bold">{p.promo_code}</code>
                          : <span className="text-muted-foreground text-xs">—</span>
                        }
                      </TableCell>
                      <TableCell>
                        {p.discount_percent
                          ? <Badge variant="emerald">−{p.discount_percent}%</Badge>
                          : <span className="text-muted-foreground text-xs">—</span>
                        }
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {p.starts_at && <p>Od: {fmtDatum(p.starts_at)}</p>}
                        {p.ends_at && <p>Do: {fmtDatum(p.ends_at)}</p>}
                        {!p.starts_at && !p.ends_at && '—'}
                      </TableCell>
                      <TableCell>
                        {isExpired(p)
                          ? <Badge variant="secondary">Istekla</Badge>
                          : isScheduled(p)
                            ? <Badge variant="info">Zakazana</Badge>
                            : p.is_active
                              ? <Badge variant="emerald">Aktivna</Badge>
                              : <Badge variant="secondary">Neaktivna</Badge>
                        }
                      </TableCell>
                      <TableCell>
                        <Switch checked={p.is_active} onCheckedChange={() => toggleActive(p.id, p.is_active)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(p)}><Pencil size={15} /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(p.id, p.title)}>
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
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Uredi ponudu' : 'Nova ponuda'}</DialogTitle>
          </DialogHeader>

          {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">{error}</div>}

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label>Naziv ponude *</Label>
                <Input value={form.title} onChange={set('title')} placeholder="npr. Ljetna rasprodaja" required />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Podnaslov</Label>
                <Input value={form.subtitle || ''} onChange={set('subtitle')} placeholder="Do -50% na sve whey proteine" />
              </div>
              <div className="space-y-1.5">
                <Label>Promo kod</Label>
                <Input value={form.promo_code || ''} onChange={set('promo_code')} placeholder="LJETO2026" className="uppercase" />
              </div>
              <div className="space-y-1.5">
                <Label>Popust (%)</Label>
                <Input type="number" min="0" max="100" value={form.discount_percent || ''} onChange={set('discount_percent')} placeholder="30" />
              </div>
              <div className="space-y-1.5">
                <Label>Važi od</Label>
                <Input type="date" value={form.starts_at} onChange={set('starts_at')} />
              </div>
              <div className="space-y-1.5">
                <Label>Važi do</Label>
                <Input type="date" value={form.ends_at} onChange={set('ends_at')} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>URL slike</Label>
                <Input value={form.image_url || ''} onChange={set('image_url')} placeholder="https://..." />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Link (klik vodi na)</Label>
                <Input value={form.link || ''} onChange={set('link')} placeholder="/kategorija/proteini" />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Opis</Label>
                <Textarea value={form.description || ''} onChange={set('description')} rows={3} placeholder="Kratki opis ponude…" />
              </div>
              <div className="col-span-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Aktivna</p>
                  <p className="text-xs text-muted-foreground">Vidljivo kupcima</p>
                </div>
                <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
              </div>
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
