import { useEffect, useState } from 'react'
import {
  Save, RefreshCw, Plus, Trash2, ChevronUp, ChevronDown,
  ExternalLink, Link as LinkIcon,
} from 'lucide-react'
import { InstagramLogo, FacebookLogo, YoutubeLogo, TiktokLogo } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'

// ─── Defaults ───────────────────────────────────────────────────────────────
const DEFAULT_COLUMNS = [
  {
    heading: 'INFORMACIJE',
    links: [
      { label: 'O nama',               to: '/o-nama' },
      { label: 'Kontakt',              to: '/kontakt' },
      { label: 'Politika privatnosti', to: '/privatnost' },
      { label: 'Politika povrata',     to: '/povrat' },
      { label: 'Pravila kolačića',     to: '/kolacici' },
    ],
  },
  {
    heading: 'NALOG',
    links: [
      { label: 'Prijava',           to: '/nalog' },
      { label: 'Registracija',      to: '/nalog/registracija' },
      { label: 'Moje narudžbe',     to: '/nalog/narudzbe' },
      { label: 'Bodovi lojalnosti', to: '/nalog/bodovi' },
      { label: 'Wishlist',          to: '/wishlist' },
    ],
  },
  {
    heading: 'PRODAVNICA',
    links: [
      { label: 'Kako kupiti',        to: '/kako-kupiti' },
      { label: 'Dostava',            to: '/dostava' },
      { label: 'Dodatni popust',     to: '/popust' },
      { label: 'Pronađi prodavnicu', to: '/prodavnice' },
      { label: 'Pokloni',            to: '/pokloni' },
    ],
  },
]

const DEFAULT_SOCIAL = [
  { network: 'instagram', href: 'https://instagram.com' },
  { network: 'facebook',  href: 'https://facebook.com' },
  { network: 'youtube',   href: 'https://youtube.com' },
  { network: 'tiktok',    href: 'https://tiktok.com' },
]

const NETWORK_LABELS = {
  instagram: 'Instagram',
  facebook:  'Facebook',
  youtube:   'YouTube',
  tiktok:    'TikTok',
}

const NETWORK_ICONS = {
  instagram: InstagramLogo,
  facebook:  FacebookLogo,
  youtube:   YoutubeLogo,
  tiktok:    TiktokLogo,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function move(arr, idx, dir) {
  const a = [...arr]
  const swapIdx = idx + dir
  if (swapIdx < 0 || swapIdx >= a.length) return a
  ;[a[idx], a[swapIdx]] = [a[swapIdx], a[idx]]
  return a
}

// ─── Sub-component: column editor ─────────────────────────────────────────
function ColumnEditor({ col, colIdx, totalCols, onChange, onMoveUp, onMoveDown, onDelete }) {
  const updateHeading = (v) => onChange({ ...col, heading: v })

  const updateLink = (li, field, v) =>
    onChange({ ...col, links: col.links.map((l, i) => i === li ? { ...l, [field]: v } : l) })

  const addLink = () =>
    onChange({ ...col, links: [...col.links, { label: 'Nova stranica', to: '/' }] })

  const removeLink = (li) =>
    onChange({ ...col, links: col.links.filter((_, i) => i !== li) })

  const moveLinkUp   = (li) => onChange({ ...col, links: move(col.links, li, -1) })
  const moveLinkDown = (li) => onChange({ ...col, links: move(col.links, li,  1) })

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          {/* Column order controls */}
          <div className="flex flex-col gap-0.5 shrink-0">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={colIdx === 0}
              className="w-5 h-5 flex items-center justify-center text-gray-300 hover:text-gray-600 disabled:opacity-20 cursor-pointer bg-transparent border-0 p-0"
            >
              <ChevronUp size={14} />
            </button>
            <button
              type="button"
              onClick={onMoveDown}
              disabled={colIdx === totalCols - 1}
              className="w-5 h-5 flex items-center justify-center text-gray-300 hover:text-gray-600 disabled:opacity-20 cursor-pointer bg-transparent border-0 p-0"
            >
              <ChevronDown size={14} />
            </button>
          </div>

          <div className="flex-1">
            <CardTitle className="text-sm mb-1">Kolona {colIdx + 1}</CardTitle>
            <Input
              value={col.heading}
              onChange={(e) => updateHeading(e.target.value)}
              className="h-8 text-xs font-bold uppercase tracking-widest"
              placeholder="NASLOV KOLONE"
            />
          </div>

          <button
            type="button"
            onClick={onDelete}
            className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer bg-transparent border-0 shrink-0"
            title="Obriši kolonu"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </CardHeader>

      <CardContent className="pt-0 space-y-2">
        {col.links.map((link, li) => (
          <div key={li} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-100">
            {/* Link order controls */}
            <div className="flex flex-col gap-0.5 shrink-0">
              <button
                type="button"
                onClick={() => moveLinkUp(li)}
                disabled={li === 0}
                className="w-4 h-4 flex items-center justify-center text-gray-300 hover:text-gray-600 disabled:opacity-20 cursor-pointer bg-transparent border-0 p-0"
              >
                <ChevronUp size={12} />
              </button>
              <button
                type="button"
                onClick={() => moveLinkDown(li)}
                disabled={li === col.links.length - 1}
                className="w-4 h-4 flex items-center justify-center text-gray-300 hover:text-gray-600 disabled:opacity-20 cursor-pointer bg-transparent border-0 p-0"
              >
                <ChevronDown size={12} />
              </button>
            </div>

            {/* Label */}
            <Input
              value={link.label}
              onChange={(e) => updateLink(li, 'label', e.target.value)}
              className="h-8 text-xs w-40 shrink-0"
              placeholder="Naziv linka"
            />

            {/* URL */}
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <ExternalLink size={12} className="text-muted-foreground shrink-0" />
              <Input
                value={link.to}
                onChange={(e) => updateLink(li, 'to', e.target.value)}
                className="h-8 text-xs font-mono"
                placeholder="/stranica ili https://..."
              />
            </div>

            {/* Delete link */}
            <button
              type="button"
              onClick={() => removeLink(li)}
              className="w-6 h-6 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer bg-transparent border-0 shrink-0"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addLink}
          className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-200 text-xs text-muted-foreground hover:border-gray-300 hover:text-gray-700 transition-colors rounded-lg cursor-pointer bg-transparent"
        >
          <Plus size={13} /> Dodaj link
        </button>
      </CardContent>
    </Card>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function FooterAdmin() {
  const [columns,     setColumns]     = useState(DEFAULT_COLUMNS)
  const [social,      setSocial]      = useState(DEFAULT_SOCIAL)
  const [description, setDescription] = useState('Online protein i suplement shop u BiH. Originalni proizvodi, brza dostava, bodovi lojalnosti uz svaku kupovinu.')
  const [bottomText,  setBottomText]  = useState('✓ PLAĆANJE POUZEĆEM')
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)
  const [saved,       setSaved]       = useState(false)

  // Load from DB
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('site_content')
        .select('key, value')
        .in('key', ['footer_columns', 'footer_social', 'footer_description', 'footer_bottom_text'])

      if (data) {
        const map = {}
        data.forEach((r) => { map[r.key] = r.value })

        if (map.footer_columns?.columns?.length)   setColumns(map.footer_columns.columns)
        if (map.footer_social?.links?.length)       setSocial(map.footer_social.links)
        if (map.footer_description?.text !== undefined) setDescription(map.footer_description.text)
        if (map.footer_bottom_text?.text !== undefined) setBottomText(map.footer_bottom_text.text)
      }
      setLoading(false)
    }
    load()
  }, [])

  // Save all
  const handleSave = async () => {
    setSaving(true)
    const upserts = [
      { key: 'footer_columns',     value: { columns },                         updated_at: new Date().toISOString() },
      { key: 'footer_social',      value: { links: social },                   updated_at: new Date().toISOString() },
      { key: 'footer_description', value: { text: description },               updated_at: new Date().toISOString() },
      { key: 'footer_bottom_text', value: { text: bottomText },                updated_at: new Date().toISOString() },
    ]
    await supabase.from('site_content').upsert(upserts, { onConflict: 'key' })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  // Column ops
  const updateColumn = (idx, col) => setColumns((prev) => prev.map((c, i) => i === idx ? col : c))
  const addColumn    = () => setColumns((prev) => [...prev, { heading: 'NOVA KOLONA', links: [] }])
  const removeColumn = (idx) => setColumns((prev) => prev.filter((_, i) => i !== idx))
  const moveColumnUp   = (idx) => setColumns((prev) => move(prev, idx, -1))
  const moveColumnDown = (idx) => setColumns((prev) => move(prev, idx,  1))

  // Social ops
  const updateSocial = (idx, field, v) =>
    setSocial((prev) => prev.map((s, i) => i === idx ? { ...s, [field]: v } : s))
  const addSocial    = () => setSocial((prev) => [...prev, { network: '', href: 'https://' }])
  const removeSocial = (idx) => setSocial((prev) => prev.filter((_, i) => i !== idx))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-7 w-7 rounded-full border-4 border-gray-200 border-t-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Footer</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Uređujte kolone linkova, društvene mreže i tekst u footeru stranice.
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2 shrink-0">
          {saving ? <><RefreshCw size={14} className="animate-spin" /> Snimanje…</>
          : saved  ? '✓ Snimljeno!'
          : <><Save size={14} /> Snimi footer</>}
        </Button>
      </div>

      {/* ── Description ────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Opis (ispod loga)</CardTitle>
          <CardDescription>Kratki tekst koji se prikazuje ispod logoa u footeru.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Online protein i suplement shop u BiH…"
            rows={3}
          />
        </CardContent>
      </Card>

      {/* ── Link columns ────────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Kolone linkova</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Svaka kolona ima naslov i listu linkova. Možete dodati URL-ove internih ili vanjskih stranica.</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {columns.map((col, idx) => (
            <ColumnEditor
              key={idx}
              col={col}
              colIdx={idx}
              totalCols={columns.length}
              onChange={(updated) => updateColumn(idx, updated)}
              onMoveUp={() => moveColumnUp(idx)}
              onMoveDown={() => moveColumnDown(idx)}
              onDelete={() => removeColumn(idx)}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={addColumn}
          className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-200 text-sm text-muted-foreground hover:border-gray-300 hover:text-gray-700 transition-colors rounded-lg cursor-pointer bg-transparent"
        >
          <Plus size={15} /> Dodaj kolonu
        </button>
      </div>

      {/* ── Social links ────────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Društvene mreže</CardTitle>
          <CardDescription>Ikona se automatski bira prema nazvu mreže (instagram, facebook, youtube, tiktok). Za ostale se prikazuju inicijali.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {social.map((item, idx) => {
            const netLower  = item.network?.toLowerCase()
            const NetIcon   = NETWORK_ICONS[netLower]
            const netLabel  = NETWORK_LABELS[netLower] || item.network || 'Mreža'
            return (
              <div key={idx} className="flex items-center gap-3">
                {/* Icon preview */}
                <div className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded text-gray-400 shrink-0">
                  {NetIcon
                    ? <NetIcon size={16} />
                    : <span className="text-[10px] font-bold uppercase">{(item.network || '?').slice(0, 2)}</span>
                  }
                </div>

                {/* Network name */}
                <Input
                  value={item.network}
                  onChange={(e) => updateSocial(idx, 'network', e.target.value)}
                  className="h-8 text-xs w-28 shrink-0"
                  placeholder="instagram"
                />

                {/* URL */}
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <LinkIcon size={12} className="text-muted-foreground shrink-0" />
                  <Input
                    value={item.href}
                    onChange={(e) => updateSocial(idx, 'href', e.target.value)}
                    className="h-8 text-xs font-mono"
                    placeholder="https://instagram.com/proteinhouse"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => removeSocial(idx)}
                  className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer bg-transparent border-0 shrink-0"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            )
          })}

          <button
            type="button"
            onClick={addSocial}
            className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-200 text-xs text-muted-foreground hover:border-gray-300 hover:text-gray-700 transition-colors rounded-lg cursor-pointer bg-transparent mt-2"
          >
            <Plus size={13} /> Dodaj mrežu
          </button>
        </CardContent>
      </Card>

      {/* ── Bottom strip text ──────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Tekst u dnu (copyright bar)</CardTitle>
          <CardDescription>Prikazuje se desno u dnu stranice pored copyright teksta.</CardDescription>
        </CardHeader>
        <CardContent>
          <Input
            value={bottomText}
            onChange={(e) => setBottomText(e.target.value)}
            placeholder="✓ PLAĆANJE POUZEĆEM"
          />
        </CardContent>
      </Card>

      {/* ── Live preview ──────────────────────────────────────────────── */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Preview footera</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-hidden rounded-b-lg">
          <div className="bg-[#0A1F42] text-white px-6 py-8 text-[12px]">
            <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${Math.min(4, 1 + columns.length)}, minmax(0, 1fr))` }}>
              {/* Brand col */}
              <div>
                <div className="text-white font-extrabold text-base tracking-widest" style={{ fontFamily: 'Oswald, sans-serif' }}>
                  PROTEIN<span className="font-light">HOUSE</span>
                </div>
                <p className="mt-2 text-white/40 text-[11px] leading-relaxed line-clamp-3">{description}</p>
                <div className="flex gap-1.5 mt-3">
                  {social.slice(0, 4).map((s, i) => (
                    <div key={i} className="w-7 h-7 border border-white/20 flex items-center justify-center text-white/40 text-[9px] font-bold">
                      {(s.network || '?').slice(0, 2).toUpperCase()}
                    </div>
                  ))}
                </div>
              </div>

              {/* Link cols */}
              {columns.slice(0, 3).map((col, ci) => (
                <div key={ci}>
                  <p className="text-[9px] font-bold tracking-[0.2em] uppercase text-white/30 mb-3">{col.heading}</p>
                  <ul className="space-y-1.5 list-none p-0 m-0">
                    {col.links.slice(0, 5).map((l, li) => (
                      <li key={li} className="text-[11px] text-white/45">{l.label}</li>
                    ))}
                    {col.links.length > 5 && (
                      <li className="text-[10px] text-white/25">+{col.links.length - 5} više…</li>
                    )}
                  </ul>
                </div>
              ))}
            </div>

            {/* Bottom bar preview */}
            <div className="mt-6 pt-4 border-t border-white/10 flex justify-between items-center">
              <span className="text-[10px] text-white/25">© {new Date().getFullYear()} ProteinHouse d.o.o.</span>
              <span className="text-[10px] font-bold text-white/35 tracking-widest">{bottomText}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save button at bottom too */}
      <div className="flex justify-end pb-4">
        <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
          {saving ? <><RefreshCw size={14} className="animate-spin" /> Snimanje…</>
          : saved  ? '✓ Snimljeno!'
          : <><Save size={14} /> Snimi footer</>}
        </Button>
      </div>
    </div>
  )
}
