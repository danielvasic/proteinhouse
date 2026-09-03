import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, Save, RefreshCw, Newspaper } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Switch } from '../../components/ui/switch'
import { Card, CardContent } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { fmtDatum } from '../../lib/date'

const EMPTY = { title: '', content: '', excerpt: '', published: true }

function NewsForm({ item, onSave, onCancel }) {
  const [form, setForm] = useState(item || EMPTY)
  const [saving, setSaving] = useState(false)

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (item?.id) {
        await supabase.from('news').update({ ...form, updated_at: new Date().toISOString() }).eq('id', item.id)
      } else {
        await supabase.from('news').insert({ ...form, published_at: new Date().toISOString() })
      }
      onSave()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="border border-gray-200 bg-white p-6 rounded-lg space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-gray-900">{item?.id ? 'Uredi vijest' : 'Nova vijest'}</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 cursor-pointer bg-transparent border-0">
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label>Naslov *</Label>
          <Input value={form.title} onChange={set('title')} placeholder="Naslov vijesti…" required />
        </div>
        <div className="space-y-1.5">
          <Label>Kratki opis (excerpt)</Label>
          <Input value={form.excerpt} onChange={set('excerpt')} placeholder="Kratki opis za listu…" />
        </div>
        <div className="space-y-1.5">
          <Label>Sadržaj</Label>
          <Textarea value={form.content} onChange={set('content')} placeholder="Tekst vijesti…" rows={5} />
        </div>
        <div className="flex items-center gap-3">
          <Switch
            checked={form.published}
            onCheckedChange={(v) => setForm((f) => ({ ...f, published: v }))}
          />
          <Label>Objavljena</Label>
        </div>
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>Odustani</Button>
          <Button type="submit" disabled={saving} className="flex items-center gap-2">
            {saving ? <><RefreshCw size={13} className="animate-spin" /> Snimanje…</> : <><Save size={13} /> {item?.id ? 'Snimi izmjene' : 'Kreiraj vijest'}</>}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default function NewsAdmin() {
  const [news, setNews] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)   // null | 'new' | {item}
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    const { data, error: err } = await supabase
      .from('news')
      .select('*')
      .order('published_at', { ascending: false })

    if (err) {
      // Table might not exist yet
      setError('Tabela "news" još ne postoji u bazi. Pokrenite SQL migraciju.')
      setNews([])
    } else {
      setNews(data ?? [])
      setError('')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id, title) => {
    if (!confirm(`Obrisati "${title}"?`)) return
    await supabase.from('news').delete().eq('id', id)
    setNews((n) => n.filter((x) => x.id !== id))
  }

  const togglePublished = async (id, current) => {
    await supabase.from('news').update({ published: !current }).eq('id', id)
    setNews((n) => n.map((x) => x.id === id ? { ...x, published: !current } : x))
  }

  const onSaved = () => {
    setEditing(null)
    load()
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Newspaper size={20} className="text-muted-foreground" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Vijesti / Novosti</h2>
            <p className="text-sm text-muted-foreground">{news.length} vijesti</p>
          </div>
        </div>
        {!editing && (
          <Button onClick={() => setEditing('new')} className="flex items-center gap-2">
            <Plus size={16} /> Nova vijest
          </Button>
        )}
      </div>

      {error && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 text-sm">
          ⚠ {error}
          <div className="mt-2 font-mono text-xs bg-amber-100 p-2 rounded">
            {`create table news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  excerpt text,
  content text,
  published boolean default true,
  published_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);`}
          </div>
        </div>
      )}

      {/* New/Edit form */}
      {editing === 'new' && (
        <NewsForm onSave={onSaved} onCancel={() => setEditing(null)} />
      )}
      {editing && editing !== 'new' && (
        <NewsForm item={editing} onSave={onSaved} onCancel={() => setEditing(null)} />
      )}

      {/* List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-7 w-7 rounded-full border-4 border-gray-200 border-t-primary animate-spin" />
            </div>
          ) : news.length === 0 && !error ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Newspaper size={36} className="mb-3 opacity-30" />
              <p className="text-sm">Nema vijesti. Kreirajte prvu.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {news.map((item) => (
                <div key={item.id} className="flex items-start gap-4 px-5 py-4 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-sm text-gray-900 truncate">{item.title}</p>
                      <Badge variant={item.published ? 'emerald' : 'secondary'} className="shrink-0">
                        {item.published ? 'Objavljena' : 'Skica'}
                      </Badge>
                    </div>
                    {item.excerpt && <p className="text-xs text-muted-foreground truncate">{item.excerpt}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      {fmtDatum(item.published_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Switch
                      checked={item.published}
                      onCheckedChange={() => togglePublished(item.id, item.published)}
                    />
                    <Button variant="ghost" size="icon" onClick={() => setEditing(item)}>
                      <Pencil size={15} />
                    </Button>
                    <Button
                      variant="ghost" size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(item.id, item.title)}
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
