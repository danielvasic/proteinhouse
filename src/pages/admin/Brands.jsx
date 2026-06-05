import { useEffect, useRef, useState } from 'react'
import { Plus, Pencil, Trash2, Upload, RefreshCw, Save, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Switch } from '../../components/ui/switch'
import { Card, CardContent } from '../../components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog'

const EMPTY = { name: '', logo_url: '', sort_order: 0, is_active: true }

export default function Brands() {
  const [brands,    setBrands]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [dialog,    setDialog]    = useState(false)
  const [editItem,  setEditItem]  = useState(null)
  const [form,      setForm]      = useState(EMPTY)
  const [saving,    setSaving]    = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState('')
  const fileRef = useRef(null)

  const load = async () => {
    setLoading(true)
    const { data, error: err } = await supabase.from('brands').select('*').order('sort_order')
    if (err) setError('Tabela "brands" ne postoji. Pokrenite SQL migraciju.')
    else { setBrands(data ?? []); setError('') }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openNew  = () => { setEditItem(null); setForm(EMPTY); setDialog(true) }
  const openEdit = (b)  => { setEditItem(b); setForm({ ...b }); setDialog(true) }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext  = file.name.split('.').pop().toLowerCase()
    const path = `brand-${form.name.toLowerCase().replace(/\s+/g, '-') || Date.now()}-${Date.now()}.${ext}`
    const { error: uploadErr } = await supabase.storage
      .from('product-images')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (uploadErr) {
      setError(`Upload error: ${uploadErr.message}`)
    } else {
      const { data } = supabase.storage.from('product-images').getPublicUrl(path)
      setForm((f) => ({ ...f, logo_url: data.publicUrl }))
    }
    setUploading(false)
    e.target.value = ''
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = { ...form, sort_order: parseInt(form.sort_order) || 0 }
      if (editItem?.id) {
        const { error: err } = await supabase.from('brands').update(payload).eq('id', editItem.id)
        if (err) throw err
      } else {
        const { error: err } = await supabase.from('brands').insert(payload)
        if (err) throw err
      }
      setDialog(false)
      load()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id, name) => {
    if (!confirm(`Obrisati brend "${name}"?`)) return
    await supabase.from('brands').delete().eq('id', id)
    setBrands((b) => b.filter((x) => x.id !== id))
  }

  const toggleActive = async (id, current) => {
    await supabase.from('brands').update({ is_active: !current }).eq('id', id)
    setBrands((b) => b.map((x) => x.id === id ? { ...x, is_active: !current } : x))
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Brendovi</h2>
          <p className="text-sm text-muted-foreground">Logotipi brendova koji se prikazuju na početnoj stranici</p>
        </div>
        <Button onClick={openNew} className="flex items-center gap-2">
          <Plus size={16} /> Novi brend
        </Button>
      </div>

      {error && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 text-sm space-y-2">
          <p>⚠ {error}</p>
          <pre className="text-xs bg-amber-100 p-2 rounded">{`create table brands (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);
alter table brands enable row level security;
create policy "Public read brands" on brands for select using (true);
create policy "Admin full brands" on brands using (is_admin());`}</pre>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-7 w-7 rounded-full border-4 border-gray-200 border-t-primary animate-spin" />
            </div>
          ) : brands.length === 0 && !error ? (
            <div className="flex flex-col items-center py-16 text-muted-foreground">
              <p className="text-sm">Nema brendova. Dodajte prvi.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {brands.map((b) => (
                <div key={b.id} className={`flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors ${!b.is_active ? 'opacity-50' : ''}`}>
                  <div className="w-16 h-10 bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0 overflow-hidden">
                    {b.logo_url
                      ? <img src={b.logo_url} alt={b.name} className="max-h-8 w-auto object-contain grayscale" onError={(e) => e.target.style.display='none'} />
                      : <span className="text-[10px] text-gray-400 font-bold uppercase">{b.name.slice(0, 3)}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900">{b.name}</p>
                    {b.logo_url && <p className="text-xs text-muted-foreground truncate max-w-[300px]">{b.logo_url}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Switch checked={b.is_active} onCheckedChange={() => toggleActive(b.id, b.is_active)} />
                    <Button variant="ghost" size="icon" onClick={() => openEdit(b)}><Pencil size={15} /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => handleDelete(b.id, b.name)}>
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? 'Uredi brend' : 'Novi brend'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Naziv brenda *</Label>
              <Input value={form.name} onChange={set('name')} placeholder="npr. Optimum Nutrition" required />
            </div>
            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="flex gap-3 items-start">
                {form.logo_url && (
                  <div className="w-16 h-10 border border-gray-200 bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden">
                    <img src={form.logo_url} alt="" className="max-h-8 w-auto object-contain" onError={(e) => e.target.style.display='none'} />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <Input value={form.logo_url} onChange={set('logo_url')} placeholder="URL iz Storage-a" />
                  <div className="flex gap-2">
                    <input ref={fileRef} type="file" accept="image/*,.svg" className="hidden" onChange={handleUpload} />
                    <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="flex items-center gap-1.5">
                      {uploading ? <><RefreshCw size={12} className="animate-spin" /> Upload…</> : <><Upload size={12} /> Upload logotipa</>}
                    </Button>
                    {form.logo_url && <Button type="button" variant="ghost" size="icon" onClick={() => setForm(f => ({...f, logo_url: ''}))}><X size={14} /></Button>}
                  </div>
                  <p className="text-xs text-muted-foreground">PNG, SVG ili WebP — preporučeno bijelo/transparentno</p>
                </div>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Redosljed</Label>
              <Input type="number" value={form.sort_order} onChange={set('sort_order')} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm(f => ({...f, is_active: v}))} />
              <Label>Vidljiv na sajtu</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Otkaži</Button>
            <Button onClick={handleSave} disabled={saving || uploading} className="flex items-center gap-2">
              {saving ? <><RefreshCw size={13} className="animate-spin" /> Snimanje…</> : <><Save size={14} /> Snimi</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
