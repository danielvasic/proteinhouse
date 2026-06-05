import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, MapPin, Save, X, RefreshCw } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Switch } from '../../components/ui/switch'
import { Card, CardContent } from '../../components/ui/card'

const EMPTY = {
  city: '', address: '', phone: '', email: '',
  working_hours: '', map_url: '', sort_order: 0, is_active: true,
}

function StoreForm({ item, onSave, onCancel }) {
  const [form,   setForm]   = useState(item || EMPTY)
  const [saving, setSaving] = useState(false)
  const [error,  setError]  = useState('')

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.city.trim() || !form.address.trim()) {
      setError('Grad i adresa su obavezni.')
      return
    }
    setSaving(true)
    setError('')
    try {
      const payload = { ...form, sort_order: parseInt(form.sort_order) || 0, updated_at: new Date().toISOString() }
      if (item?.id) {
        const { error: err } = await supabase.from('stores').update(payload).eq('id', item.id)
        if (err) throw err
      } else {
        const { error: err } = await supabase.from('stores').insert(payload)
        if (err) throw err
      }
      onSave()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const f = (label, key, placeholder, type = 'text') => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input type={type} value={form[key] || ''} onChange={set(key)} placeholder={placeholder} />
    </div>
  )

  return (
    <div className="border border-gray-200 rounded-xl bg-white p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900">{item?.id ? 'Uredi poslovnicu' : 'Nova poslovnica'}</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-0">
          <X size={18} />
        </button>
      </div>

      {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {f('Grad *', 'city', 'npr. Mostar')}
          {f('Redosljed', 'sort_order', '0', 'number')}
        </div>
        {f('Adresa *', 'address', 'npr. Bulevar narodne revolucije 23')}
        <div className="grid grid-cols-2 gap-4">
          {f('Telefon', 'phone', '+387 36 xxx xxx')}
          {f('Email', 'email', 'mostar@proteinhouse.ba', 'email')}
        </div>
        {f('Radno vrijeme', 'working_hours', 'PON–PET 9–17 · SUB 9–14')}
        {f('Google Maps link', 'map_url', 'https://maps.google.com/...')}

        <div className="flex items-center gap-3 pt-2">
          <Switch
            checked={form.is_active}
            onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))}
          />
          <Label>{form.is_active ? 'Aktivna' : 'Neaktivna'}</Label>
        </div>

        <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onCancel}>Otkaži</Button>
          <Button type="submit" disabled={saving} className="flex items-center gap-2">
            {saving
              ? <><RefreshCw size={13} className="animate-spin" /> Snimanje…</>
              : <><Save size={13} /> Snimi</>}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default function Stores() {
  const [stores,  setStores]  = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)  // null | 'new' | {item}
  const [error,   setError]   = useState('')

  const load = async () => {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('stores')
      .select('*')
      .order('sort_order', { ascending: true })
    if (err) setError('Tabela "stores" ne postoji. Pokrenite SQL migraciju.')
    else { setStores(data ?? []); setError('') }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id, city) => {
    if (!confirm(`Obrisati poslovnicu "${city}"?`)) return
    await supabase.from('stores').delete().eq('id', id)
    setStores((s) => s.filter((x) => x.id !== id))
  }

  const toggleActive = async (id, current) => {
    await supabase.from('stores').update({ is_active: !current }).eq('id', id)
    setStores((s) => s.map((x) => x.id === id ? { ...x, is_active: !current } : x))
  }

  const onSaved = () => { setEditing(null); load() }

  return (
    <div className="space-y-5 animate-fade-in max-w-2xl">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <MapPin size={20} className="text-muted-foreground" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Poslovnice</h2>
            <p className="text-sm text-muted-foreground">
              Fizičke lokacije koje se prikazuju na stranicama O nama i Kontakt
            </p>
          </div>
        </div>
        {!editing && (
          <Button onClick={() => setEditing('new')} className="flex items-center gap-2 shrink-0">
            <Plus size={16} /> Nova poslovnica
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 text-sm space-y-2">
          <p>⚠ {error}</p>
          <pre className="text-xs bg-amber-100 p-2 rounded whitespace-pre-wrap">{`create table stores (
  id uuid primary key default gen_random_uuid(),
  city text not null,
  address text not null,
  phone text,
  email text,
  working_hours text,
  map_url text,
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table stores enable row level security;
create policy "Public read stores" on stores for select using (true);
create policy "Admin full stores" on stores using (is_admin());`}</pre>
        </div>
      )}

      {editing === 'new' && <StoreForm onSave={onSaved} onCancel={() => setEditing(null)} />}
      {editing && editing !== 'new' && (
        <StoreForm item={editing} onSave={onSaved} onCancel={() => setEditing(null)} />
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-7 w-7 rounded-full border-4 border-gray-200 border-t-primary animate-spin" />
            </div>
          ) : stores.length === 0 && !error ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <MapPin size={36} className="mb-3 opacity-30" />
              <p className="text-sm">Nema poslovnica. Dodajte prvu.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {stores.map((s) => (
                <div
                  key={s.id}
                  className={`flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors ${!s.is_active ? 'opacity-50' : ''}`}
                >
                  <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin size={15} className="text-gray-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900">{s.city}</p>
                    <p className="text-[12px] text-gray-600 mt-0.5">{s.address}</p>
                    {s.working_hours && (
                      <p className="text-[11px] text-gray-400 mt-1">{s.working_hours}</p>
                    )}
                    {(s.phone || s.email) && (
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {[s.phone, s.email].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Switch
                      checked={s.is_active}
                      onCheckedChange={() => toggleActive(s.id, s.is_active)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => setEditing(s)}>
                      <Pencil size={15} />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(s.id, s.city)}
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
