import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Tag, Save, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Badge } from '../../components/ui/badge'
import { Switch } from '../../components/ui/switch'
import { Card, CardContent } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog'

const EMPTY = { slug: '', label: '', description: '', image_url: '', sort_order: 0, is_active: true, accent: false }

function slugify(str) {
  return str.toLowerCase()
    .replace(/[čć]/g, 'c').replace(/[šđ]/g, (m) => m === 'š' ? 's' : 'd')
    .replace(/ž/g, 'z').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function Categories() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editItem, setEditItem] = useState(null) // null = new
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    const { data } = await supabase.from('categories').select('*').order('sort_order').order('label')
    setCategories(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openNew = () => { setEditItem(null); setForm(EMPTY); setError(''); setDialogOpen(true) }
  const openEdit = (cat) => { setEditItem(cat); setForm({ ...cat }); setError(''); setDialogOpen(true) }

  const set = (key) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => {
      const next = { ...f, [key]: val }
      if (key === 'label' && !editItem) next.slug = slugify(val)
      return next
    })
  }

  const handleSave = async () => {
    setError('')
    setSaving(true)
    try {
      const payload = { ...form, sort_order: parseInt(form.sort_order) || 0 }
      if (editItem) {
        const { error: err } = await supabase.from('categories').update(payload).eq('id', editItem.id)
        if (err) throw err
      } else {
        const { error: err } = await supabase.from('categories').insert(payload)
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

  const handleDelete = async (id, label) => {
    if (!confirm(`Obrisati kategoriju "${label}"?`)) return
    await supabase.from('categories').delete().eq('id', id)
    setCategories((cs) => cs.filter((c) => c.id !== id))
  }

  const toggleActive = async (id, current) => {
    await supabase.from('categories').update({ is_active: !current }).eq('id', id)
    setCategories((cs) => cs.map((c) => c.id === id ? { ...c, is_active: !current } : c))
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Kategorije</h2>
          <p className="text-sm text-muted-foreground">{categories.length} kategorija</p>
        </div>
        <Button onClick={openNew} className="flex items-center gap-2">
          <Plus size={16} /> Nova kategorija
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
                  <TableHead>Kategorija</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Redosljed</TableHead>
                  <TableHead>Aktivan</TableHead>
                  <TableHead className="text-right">Akcije</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <div className="flex flex-col items-center py-12 text-muted-foreground">
                        <Tag size={36} className="mb-3 opacity-30" />
                        <p className="text-sm">Nema kategorija. Kreirajte prvu.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  categories.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {c.image_url
                            ? <img src={c.image_url} alt="" className="w-9 h-9 rounded-lg object-cover border shrink-0" />
                            : <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 shrink-0"><Tag size={14} /></div>
                          }
                          <div>
                            <p className="font-semibold text-sm">{c.label}</p>
                            {c.description && <p className="text-xs text-muted-foreground truncate max-w-48">{c.description}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{c.slug}</TableCell>
                      <TableCell className="text-sm">{c.sort_order}</TableCell>
                      <TableCell>
                        <Switch checked={c.is_active} onCheckedChange={() => toggleActive(c.id, c.is_active)} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil size={15} /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(c.id, c.label)}>
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

      {/* Create / edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Uredi kategoriju' : 'Nova kategorija'}</DialogTitle>
          </DialogHeader>

          {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-2 text-sm">{error}</div>}

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Naziv *</Label>
              <Input value={form.label} onChange={set('label')} placeholder="npr. Proteini" required />
            </div>
            <div className="space-y-1.5">
              <Label>Slug (URL) *</Label>
              <Input value={form.slug} onChange={set('slug')} placeholder="proteini" required />
            </div>
            <div className="space-y-1.5">
              <Label>Opis</Label>
              <Input value={form.description || ''} onChange={set('description')} placeholder="Kratki opis kategorije" />
            </div>
            <div className="space-y-1.5">
              <Label>URL slike</Label>
              <Input value={form.image_url || ''} onChange={set('image_url')} placeholder="https://..." />
            </div>
            <div className="space-y-1.5">
              <Label>Redosljed prikaza</Label>
              <Input type="number" value={form.sort_order} onChange={set('sort_order')} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Aktivan</p>
                <p className="text-xs text-muted-foreground">Vidljivo na shopu</p>
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
