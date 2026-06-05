import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Image, Save, GripVertical } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Switch } from '../../components/ui/switch'
import { Card, CardContent } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog'

const EMPTY = {
  title: '', subtitle: '', cta_text: '', cta_link: '',
  image_url: '', is_active: true, sort_order: 0,
}

export default function Banners() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('banners').select('*').order('sort_order').order('created_at', { ascending: false })
    setBanners(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openNew = () => { setEditItem(null); setForm(EMPTY); setError(''); setDialogOpen(true) }
  const openEdit = (item) => { setEditItem(item); setForm({ ...item }); setError(''); setDialogOpen(true) }

  const set = (key) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [key]: val }))
  }

  const handleSave = async () => {
    setError('')
    setSaving(true)
    try {
      const payload = { ...form, sort_order: parseInt(form.sort_order) || 0 }
      if (editItem) {
        const { error: err } = await supabase.from('banners').update(payload).eq('id', editItem.id)
        if (err) throw err
      } else {
        const { error: err } = await supabase.from('banners').insert(payload)
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
    if (!confirm(`Obrisati baner "${title}"?`)) return
    await supabase.from('banners').delete().eq('id', id)
    setBanners((bs) => bs.filter((b) => b.id !== id))
  }

  const toggleActive = async (id, current) => {
    await supabase.from('banners').update({ is_active: !current }).eq('id', id)
    setBanners((bs) => bs.map((b) => b.id === id ? { ...b, is_active: !current } : b))
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Baneri</h2>
          <p className="text-sm text-muted-foreground">Promotivni baneri i oglasi (bočni paneli, kampanje)</p>
        </div>
        <Button onClick={openNew} className="flex items-center gap-2">
          <Plus size={16} /> Novi baner
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
                  <TableHead className="w-8"></TableHead>
                  <TableHead>Baner</TableHead>
                  <TableHead>CTA dugme</TableHead>
                  <TableHead>Redosljed</TableHead>
                  <TableHead>Aktivan</TableHead>
                  <TableHead className="text-right">Akcije</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {banners.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <div className="flex flex-col items-center py-12 text-muted-foreground">
                        <Image size={36} className="mb-3 opacity-30" />
                        <p className="text-sm">Nema banera. Kreirajte prvi.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : banners.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <GripVertical size={14} className="text-gray-300" />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {b.image_url
                          ? <img src={b.image_url} alt="" className="w-16 h-10 rounded-lg object-cover border shrink-0" />
                          : <div className="w-16 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 shrink-0"><Image size={14} /></div>
                        }
                        <div>
                          <p className="font-semibold text-sm">{b.title}</p>
                          {b.subtitle && <p className="text-xs text-muted-foreground truncate max-w-48">{b.subtitle}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {b.cta_text
                        ? <><span className="font-medium">{b.cta_text}</span> <span className="text-muted-foreground text-xs">→ {b.cta_link}</span></>
                        : <span className="text-muted-foreground text-xs">—</span>
                      }
                    </TableCell>
                    <TableCell className="text-sm">{b.sort_order}</TableCell>
                    <TableCell>
                      <Switch checked={b.is_active} onCheckedChange={() => toggleActive(b.id, b.is_active)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(b)}><Pencil size={15} /></Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(b.id, b.title)}>
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Uredi baner' : 'Novi baner'}</DialogTitle>
          </DialogHeader>

          {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">{error}</div>}

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Naslov *</Label>
              <Input value={form.title} onChange={set('title')} placeholder="Do −50% na sve suplemente!" required />
            </div>
            <div className="space-y-1.5">
              <Label>Podnaslov</Label>
              <Input value={form.subtitle || ''} onChange={set('subtitle')} placeholder="Iskoristite ljetnu akciju" />
            </div>
            <div className="space-y-1.5">
              <Label>URL pozadinske slike *</Label>
              <Input value={form.image_url || ''} onChange={set('image_url')} placeholder="https://..." />
              {form.image_url && (
                <img src={form.image_url} alt="" className="mt-2 h-24 w-full rounded-lg object-cover border" onError={(e) => { e.target.style.display = 'none' }} />
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Tekst dugmeta</Label>
                <Input value={form.cta_text || ''} onChange={set('cta_text')} placeholder="Kupi sada" />
              </div>
              <div className="space-y-1.5">
                <Label>Link dugmeta</Label>
                <Input value={form.cta_link || ''} onChange={set('cta_link')} placeholder="/kategorija/akcija" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Redosljed</Label>
              <Input type="number" value={form.sort_order} onChange={set('sort_order')} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Aktivan</p>
                <p className="text-xs text-muted-foreground">Prikazuje se na shopu</p>
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
