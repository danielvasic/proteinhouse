import { useEffect, useRef, useState } from 'react'
import { Plus, Pencil, Trash2, Image, Save, X, RefreshCw, Star, StarOff, Upload } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Switch } from '../../components/ui/switch'
import { Card, CardContent } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'

const EMPTY = {
  eyebrow: '', title_lines: '', subtitle: '',
  cta_primary_text: '', cta_primary_link: '/kategorija/akcija', cta_style: 'plavi',
  cta_secondary_text: '', cta_secondary_link: '/kategorija/proteini',
  image_url: '', sort_order: 0, is_active: false,
  price_text: '', old_price_text: '', usp_lines: '', fg_image_url: '',
}

function Field({ label, hint, children }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}

function BannerForm({ item, onSave, onCancel }) {
  const [form,      setForm]      = useState(item || EMPTY)
  const [saving,    setSaving]    = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error,     setError]     = useState('')
  const fileRef = useRef(null)
  const fgFileRef = useRef(null)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleUpload = (field) => async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const ext  = file.name.split('.').pop().toLowerCase()
    const path = `hero-${Date.now()}.${ext}`
    const { error: uploadErr } = await supabase.storage
      .from('product-images')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (uploadErr) {
      setError(`Upload error: ${uploadErr.message}`)
    } else {
      const { data } = supabase.storage.from('product-images').getPublicUrl(path)
      setForm((f) => ({ ...f, [field]: data.publicUrl }))
    }
    setUploading(false)
    e.target.value = ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = { ...form, sort_order: parseInt(form.sort_order) || 0, updated_at: new Date().toISOString() }
      if (item?.id) {
        const { error: err } = await supabase.from('hero_banners').update(payload).eq('id', item.id)
        if (err) throw err
      } else {
        const { error: err } = await supabase.from('hero_banners').insert(payload)
        if (err) throw err
      }
      onSave()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border border-gray-200 rounded-xl bg-white p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-gray-900">{item?.id ? 'Uredi baner' : 'Novi hero baner'}</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-0"><X size={18} /></button>
      </div>

      {error && <div className="rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Eyebrow tekst" hint="Mala linija iznad naslova">
            <Input value={form.eyebrow} onChange={set('eyebrow')} placeholder="Black Friday 2026" />
          </Field>
          <Field label="Redosljed">
            <Input type="number" value={form.sort_order} onChange={set('sort_order')} />
          </Field>
        </div>

        <Field label="Naslov (/ za novi red)" hint="Primjer: Naruči za/**150+ KM.**/Gorilla Wear **poklon** je tvoj. — tekst između ** dobija plavu podlogu">
          <Input value={form.title_lines} onChange={set('title_lines')} placeholder="Snaga u/svakoj/mjerici" required />
        </Field>

        <Field label="Podnaslov">
          <Textarea value={form.subtitle} onChange={set('subtitle')} rows={2}
            placeholder="Do −70% na izabrane proteinske formule. Besplatna dostava na sve narudžbe preko 100 KM." />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Cijena (opciono)" hint="Veliki cjenovni blok, npr. za istaknutu akciju topsellera">
            <Input value={form.price_text ?? ''} onChange={set('price_text')} placeholder="189,95 KM" />
          </Field>
          <Field label="Stara cijena (opciono)" hint="Prikazuje se precrtana pored cijene">
            <Input value={form.old_price_text ?? ''} onChange={set('old_price_text')} placeholder="209,00 KM" />
          </Field>
        </div>

        <Field label="USP stavke (opciono)" hint="Jedan red = jedna stavka s ikonom. Ikona se bira sama: dostava → kamion, poklon → poklon, ušteda → oznaka.">
          <Textarea value={form.usp_lines ?? ''} onChange={set('usp_lines')} rows={2}
            placeholder={'Uštedi 19,05 KM i ostvari besplatnu dostavu.\nOvom kupnjom odmah otključavaš i Gorilla Wear poklon.'} />
        </Field>

        <Field label="Slika proizvoda (opciono)" hint="Prikazuje se u DESNOJ TREĆINI banera — tekst lijevo ostaje čitljiv preko gradijenta. PNG s prozirnom pozadinom najbolje radi.">
          <div className="flex gap-3 items-start">
            {form.fg_image_url && (
              <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200 shrink-0 bg-gray-900">
                <img src={form.fg_image_url} alt="" className="w-full h-full object-contain" onError={(e) => e.target.style.display='none'} />
              </div>
            )}
            <div className="flex-1 space-y-2">
              <Input value={form.fg_image_url ?? ''} onChange={set('fg_image_url')} placeholder="https://... ili uploaduj ispod" />
              <div className="flex gap-2">
                <input ref={fgFileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload('fg_image_url')} />
                <Button type="button" variant="outline" size="sm" onClick={() => fgFileRef.current?.click()} disabled={uploading} className="flex items-center gap-1.5">
                  {uploading ? <><RefreshCw size={12} className="animate-spin" /> Uploaduje…</> : <><Upload size={12} /> Upload slike</>}
                </Button>
              </div>
            </div>
          </div>
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Primarno dugme — tekst">
            <Input value={form.cta_primary_text} onChange={set('cta_primary_text')} placeholder="Pogledaj akcije" />
          </Field>
          <Field label="Primarno dugme — link">
            <Input value={form.cta_primary_link} onChange={set('cta_primary_link')} placeholder="/kategorija/akcija" />
          </Field>
          <Field label="Primarno dugme — boja" hint="Plava je standard. Crvenu koristimo samo za izuzetno važne akcije — ako je sve crveno, ništa nije važno.">
            <div className="flex gap-2">
              {[['plavi', 'Plava', '#0145f2'], ['crveni', 'Crvena', '#ff4103']].map(([val, label, hex]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, cta_style: val }))}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium cursor-pointer transition-colors ${
                    (form.cta_style ?? 'plavi') === val ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="w-3.5 h-3.5 rounded-full inline-block" style={{ background: hex }} />
                  {label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="Sekundarno dugme — tekst">
            <Input value={form.cta_secondary_text} onChange={set('cta_secondary_text')} placeholder="Svi proteini" />
          </Field>
          <Field label="Sekundarno dugme — link">
            <Input value={form.cta_secondary_link} onChange={set('cta_secondary_link')} placeholder="/kategorija/proteini" />
          </Field>
        </div>

        <Field label="Pozadinska slika">
          <div className="flex gap-3 items-start">
            {form.image_url && (
              <div className="w-24 h-16 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                <img src={form.image_url} alt="" className="w-full h-full object-cover" onError={(e) => e.target.style.display='none'} />
              </div>
            )}
            <div className="flex-1 space-y-2">
              <Input value={form.image_url} onChange={set('image_url')} placeholder="https://... ili uploaduj ispod" />
              <div className="flex gap-2">
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleUpload('image_url')} />
                <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="flex items-center gap-1.5">
                  {uploading ? <><RefreshCw size={12} className="animate-spin" /> Uploaduje…</> : <><Upload size={12} /> Upload slike</>}
                </Button>
              </div>
            </div>
          </div>
        </Field>

        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
            <span className="text-sm font-medium">{form.is_active ? 'Aktivan' : 'Neaktivan'}</span>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>Otkaži</Button>
            <Button type="submit" disabled={saving || uploading} className="flex items-center gap-2">
              {saving ? <><RefreshCw size={13} className="animate-spin" /> Snimanje…</> : <><Save size={13} /> Snimi</>}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default function HeroBanners() {
  const [banners,  setBanners]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [editing,  setEditing]  = useState(null)   // null | 'new' | {item}
  const [error,    setError]    = useState('')

  const load = async () => {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('hero_banners')
      .select('*')
      .order('sort_order', { ascending: true })
    if (err) setError('Tabela "hero_banners" ne postoji. Pokrenite SQL migraciju.')
    else { setBanners(data ?? []); setError('') }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id, title) => {
    if (!confirm(`Obrisati baner "${title}"?`)) return
    await supabase.from('hero_banners').delete().eq('id', id)
    setBanners((b) => b.filter((x) => x.id !== id))
  }

  const setActive = async (id) => {
    // Deactivate all, then activate this one
    await supabase.from('hero_banners').update({ is_active: false }).neq('id', '__none__')
    await supabase.from('hero_banners').update({ is_active: true }).eq('id', id)
    setBanners((b) => b.map((x) => ({ ...x, is_active: x.id === id })))
  }

  const toggleActive = async (id, current) => {
    await supabase.from('hero_banners').update({ is_active: !current }).eq('id', id)
    setBanners((b) => b.map((x) => x.id === id ? { ...x, is_active: !current } : x))
  }

  const onSaved = () => { setEditing(null); load() }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Image size={20} className="text-muted-foreground" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Hero baneri</h2>
            <p className="text-sm text-muted-foreground">Upravljajte hero sekcijom početne stranice. Samo jedan može biti aktivan.</p>
          </div>
        </div>
        {!editing && (
          <Button onClick={() => setEditing('new')} className="flex items-center gap-2 shrink-0">
            <Plus size={16} /> Novi baner
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 text-sm space-y-2">
          <p>⚠ {error}</p>
          <pre className="text-xs bg-amber-100 p-2 rounded whitespace-pre-wrap">{`create table hero_banners (
  id uuid primary key default gen_random_uuid(),
  eyebrow text, title_lines text not null,
  subtitle text,
  cta_primary_text text, cta_primary_link text,
  cta_secondary_text text, cta_secondary_link text,
  image_url text, is_active boolean default false,
  sort_order integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table hero_banners enable row level security;
create policy "Admin full" on hero_banners using (is_admin());
create policy "Public read" on hero_banners for select using (true);`}</pre>
        </div>
      )}

      {editing === 'new'  && <BannerForm onSave={onSaved} onCancel={() => setEditing(null)} />}
      {editing && editing !== 'new' && <BannerForm item={editing} onSave={onSaved} onCancel={() => setEditing(null)} />}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-7 w-7 rounded-full border-4 border-gray-200 border-t-primary animate-spin" />
            </div>
          ) : banners.length === 0 && !error ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Image size={36} className="mb-3 opacity-30" />
              <p className="text-sm">Nema hero banera. Kreirajte prvi.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {banners.map((b) => (
                <div key={b.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                  {/* Preview */}
                  <div className="w-20 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0">
                    {b.image_url
                      ? <img src={b.image_url} alt="" className="w-full h-full object-cover" onError={(e) => e.target.style.display='none'} />
                      : <div className="w-full h-full flex items-center justify-center text-gray-300"><Image size={16} /></div>}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-sm text-gray-900 truncate">
                        {b.title_lines?.replace(/\//g, ' ')}
                      </p>
                      {b.is_active && <Badge variant="emerald">Aktivan</Badge>}
                    </div>
                    {b.eyebrow && <p className="text-xs text-muted-foreground">{b.eyebrow}</p>}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost" size="sm"
                      className={`flex items-center gap-1.5 text-xs ${b.is_active ? 'text-amber-600' : 'text-muted-foreground'}`}
                      onClick={() => b.is_active ? toggleActive(b.id, true) : setActive(b.id)}
                      title={b.is_active ? 'Deaktiviraj' : 'Postavi kao aktivan'}
                    >
                      {b.is_active ? <Star size={14} className="fill-amber-400 text-amber-400" /> : <StarOff size={14} />}
                      {b.is_active ? 'Aktivan' : 'Aktiviraj'}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setEditing(b)}><Pencil size={15} /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(b.id, b.title_lines)}>
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
