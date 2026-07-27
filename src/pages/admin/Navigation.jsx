import { useEffect, useState } from 'react'
import { Save, RefreshCw, Plus, Trash2, ChevronUp, ChevronDown, Navigation as NavIcon, ExternalLink } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Switch } from '../../components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'

const DEFAULT_ITEMS = [
  { key: 'shop',     label: 'SHOP',     to: '/',                          hasMenu: true,  right: false, active: true },
  { key: 'sportovi', label: 'SPORTOVI', to: '/kategorija/performanse',    hasMenu: false, right: false, active: true },
  { key: 'ciljevi',  label: 'CILJEVI',  to: '/kategorija/kontrola',       hasMenu: false, right: false, active: true },
  { key: 'blog',     label: 'BLOG',     to: '/blog',                      hasMenu: false, right: false, active: true },
  { key: 'o-nama',   label: 'O NAMA',   to: '/o-nama',                    hasMenu: false, right: false, active: true },
  { key: 'kontakt',  label: 'KONTAKT',  to: '/kontakt',                   hasMenu: false, right: true,  active: true },
]

function genKey() {
  return Math.random().toString(36).slice(2, 8)
}

export default function Navigation() {
  const [items,   setItems]   = useState(DEFAULT_ITEMS)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [saved,   setSaved]   = useState(false)

  useEffect(() => {
    supabase
      .from('site_content')
      .select('value')
      .eq('key', 'nav_items')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value?.items?.length) setItems(data.value.items)
        setLoading(false)
      })
  }, [])

  const update = (idx, field, value) =>
    setItems((prev) => prev.map((item, i) => i === idx ? { ...item, [field]: value } : item))

  const moveUp   = (idx) => { if (idx === 0) return; const a = [...items]; [a[idx-1], a[idx]] = [a[idx], a[idx-1]]; setItems(a) }
  const moveDown = (idx) => { if (idx === items.length - 1) return; const a = [...items]; [a[idx], a[idx+1]] = [a[idx+1], a[idx]]; setItems(a) }
  const remove   = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx))

  const addItem = () => setItems((prev) => [
    ...prev,
    { key: genKey(), label: 'NOVA STRANICA', to: '/', hasMenu: false, right: false, active: true }
  ])

  const handleSave = async () => {
    setSaving(true)
    await supabase.from('site_content').upsert(
      { key: 'nav_items', value: { items }, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (loading) {
    return <div className="flex items-center justify-center py-16"><div className="h-7 w-7 rounded-full border-4 border-gray-200 border-t-primary animate-spin" /></div>
  }

  return (
    <div className="space-y-5 animate-fade-in max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <NavIcon size={20} className="text-muted-foreground" />
          <div>
            <h2 className="text-xl font-bold text-gray-900">Navigacija</h2>
            <p className="text-sm text-muted-foreground">Upravljajte stavkama u glavnom meniju. Promjene se odmah primjenjuju.</p>
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2 shrink-0">
          {saving  ? <><RefreshCw size={14} className="animate-spin" /> Snimanje…</>
          : saved  ? '✓ Snimljeno!'
          : <><Save size={14} /> Snimi navigaciju</>}
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Stavke menija</CardTitle>
          <CardDescription>Drag/up-down za redosljed · Svaka stavka može biti lijevno ili desno poravnana</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 p-4">
          {items.map((item, idx) => (
            <div
              key={item.key}
              className={`flex items-center gap-3 px-4 py-3 border rounded-lg transition-colors ${item.active ? 'border-gray-200 bg-white' : 'border-gray-100 bg-[#F2F4F7] opacity-60'}`}
            >
              {/* Order controls */}
              <div className="flex flex-col gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => moveUp(idx)}
                  disabled={idx === 0}
                  className="w-5 h-5 flex items-center justify-center text-gray-300 hover:text-gray-600 disabled:opacity-20 cursor-pointer bg-transparent border-0 p-0"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(idx)}
                  disabled={idx === items.length - 1}
                  className="w-5 h-5 flex items-center justify-center text-gray-300 hover:text-gray-600 disabled:opacity-20 cursor-pointer bg-transparent border-0 p-0"
                >
                  <ChevronDown size={14} />
                </button>
              </div>

              {/* Label */}
              <Input
                value={item.label}
                onChange={(e) => update(idx, 'label', e.target.value)}
                className="w-36 h-8 text-xs font-bold uppercase"
                placeholder="NAZIV"
              />

              {/* URL */}
              <div className="flex items-center gap-1.5 flex-1">
                <ExternalLink size={13} className="text-muted-foreground shrink-0" />
                <Input
                  value={item.to}
                  onChange={(e) => update(idx, 'to', e.target.value)}
                  className="h-8 text-xs font-mono"
                  placeholder="/stranica"
                />
              </div>

              {/* Toggles */}
              <div className="flex items-center gap-4 shrink-0 text-xs text-muted-foreground">
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <Switch
                    checked={Boolean(item.hasMenu)}
                    onCheckedChange={(v) => update(idx, 'hasMenu', v)}
                    className="scale-75"
                  />
                  Dropdown
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <Switch
                    checked={Boolean(item.right)}
                    onCheckedChange={(v) => update(idx, 'right', v)}
                    className="scale-75"
                  />
                  Desno
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <Switch
                    checked={Boolean(item.active)}
                    onCheckedChange={(v) => update(idx, 'active', v)}
                    className="scale-75"
                  />
                  Vidljivo
                </label>
              </div>

              {/* Delete */}
              <button
                type="button"
                onClick={() => remove(idx)}
                className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer bg-transparent border-0 shrink-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addItem}
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 text-sm text-muted-foreground hover:border-gray-300 hover:text-gray-700 transition-colors rounded-lg cursor-pointer bg-transparent"
          >
            <Plus size={15} /> Dodaj stavku menija
          </button>
        </CardContent>
      </Card>

      {/* Live preview strip */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center bg-[#0145F2] px-4 py-3 rounded gap-1 flex-wrap">
            {items.filter(i => i.active && !i.right).map((item) => (
              <span
                key={item.key}
                className="px-3 py-1.5 text-white/80 text-[11px] font-bold tracking-[0.1em] uppercase border-b-2 border-transparent"
              >
                {item.label} {item.hasMenu && '▾'}
              </span>
            ))}
            <div className="ml-auto flex items-center gap-1">
              {items.filter(i => i.active && i.right).map((item) => (
                <span
                  key={item.key}
                  className="px-3 py-1.5 text-white/80 text-[11px] font-bold tracking-[0.1em] uppercase"
                >
                  {item.label}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
