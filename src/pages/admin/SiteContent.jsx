import { useEffect, useState } from 'react'
import { Save, RefreshCw, LayoutTemplate, Info } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'

// Predefined editable content sections
const SECTIONS = {
  hero: {
    label: 'Hero baner',
    fields: [
      { key: 'hero_eyebrow',      label: 'Eyebrow tekst',           type: 'text',     placeholder: 'Black Friday 2026' },
      { key: 'hero_title',        label: 'Naslov (redovi odvojeni /)', type: 'text',   placeholder: 'Snaga u/svakoj/mjerici' },
      { key: 'hero_subtitle',     label: 'Podnaslov',                type: 'textarea', placeholder: 'Do −70% na izabrane proteinske formule…' },
      { key: 'hero_cta_primary',  label: 'Primarno dugme — tekst',  type: 'text',     placeholder: 'Pogledaj akcije' },
      { key: 'hero_cta_primary_link', label: 'Primarno dugme — link', type: 'text',   placeholder: '/kategorija/akcija' },
      { key: 'hero_cta_secondary', label: 'Sekundarno dugme — tekst', type: 'text',   placeholder: 'Svi proteini' },
      { key: 'hero_image_url',    label: 'URL pozadinske slike',     type: 'text',     placeholder: 'https://images.unsplash.com/…' },
    ],
  },
  promo: {
    label: 'Promo traka',
    fields: [
      { key: 'promo_1_title', label: 'Stavka 1 — Naslov', type: 'text', placeholder: 'Besplatna dostava' },
      { key: 'promo_1_sub',   label: 'Stavka 1 — Opis',   type: 'text', placeholder: 'Za narudžbe preko 100 KM' },
      { key: 'promo_2_title', label: 'Stavka 2 — Naslov', type: 'text', placeholder: '100% sigurna kupovina' },
      { key: 'promo_2_sub',   label: 'Stavka 2 — Opis',   type: 'text', placeholder: 'SSL · originalni proizvodi' },
      { key: 'promo_3_title', label: 'Stavka 3 — Naslov', type: 'text', placeholder: 'Bodovi lojalnosti' },
      { key: 'promo_3_sub',   label: 'Stavka 3 — Opis',   type: 'text', placeholder: 'Za svaku kupovinu' },
      { key: 'promo_4_title', label: 'Stavka 4 — Naslov', type: 'text', placeholder: 'Poklon na izbor' },
      { key: 'promo_4_sub',   label: 'Stavka 4 — Opis',   type: 'text', placeholder: 'Pri svakoj narudžbi' },
    ],
  },
  oNama: {
    label: 'O nama stranica',
    fields: [
      { key: 'about_hero_image', label: 'Hero slika (URL iz Storage-a)', type: 'text', placeholder: 'https://...supabase.../storage/...' },
      { key: 'about_intro',      label: 'Uvodni tekst',                   type: 'textarea', placeholder: 'ProteinHouse je osnovan…' },
      { key: 'about_stat_1_value', label: 'Stat 1 — Vrijednost', type: 'text', placeholder: '10+' },
      { key: 'about_stat_1_label', label: 'Stat 1 — Opis',      type: 'text', placeholder: 'Godina iskustva' },
      { key: 'about_stat_2_value', label: 'Stat 2 — Vrijednost', type: 'text', placeholder: '50.000+' },
      { key: 'about_stat_2_label', label: 'Stat 2 — Opis',      type: 'text', placeholder: 'Zadovoljnih kupaca' },
      { key: 'about_stat_3_value', label: 'Stat 3 — Vrijednost', type: 'text', placeholder: '2.000+' },
      { key: 'about_stat_3_label', label: 'Stat 3 — Opis',      type: 'text', placeholder: 'Proizvoda u ponudi' },
      { key: 'about_stat_4_value', label: 'Stat 4 — Vrijednost', type: 'text', placeholder: '80+' },
      { key: 'about_stat_4_label', label: 'Stat 4 — Opis',      type: 'text', placeholder: 'Brendova' },
    ],
  },
  contact: {
    label: 'Kontakt & radno vrijeme',
    fields: [
      { key: 'contact_phone',    label: 'Broj telefona',    type: 'text', placeholder: '+387 33 545 000 · +387 62 077 044' },
      { key: 'contact_email',    label: 'Email adresa',     type: 'text', placeholder: 'info@proteinhouse.ba' },
      { key: 'contact_address',  label: 'Adresa (Sarajevo)', type: 'text', placeholder: 'Maršala Tita 28, 71000 Sarajevo' },
      { key: 'contact_hours',    label: 'Radno vrijeme',    type: 'text', placeholder: 'PON–PET 9:00–17:00 · SUB 9:00–14:00' },
      { key: 'store_sarajevo_addr',   label: 'Sarajevo — adresa',    type: 'text', placeholder: 'Maršala Tita 28' },
      { key: 'store_sarajevo_hours',  label: 'Sarajevo — radno vr.', type: 'text', placeholder: 'PON–PET 9–17 · SUB 9–14' },
      { key: 'store_mostar_addr',     label: 'Mostar — adresa',      type: 'text', placeholder: 'Bulevar 12' },
      { key: 'store_mostar_hours',    label: 'Mostar — radno vr.',   type: 'text', placeholder: 'PON–PET 9–17 · SUB 9–13' },
      { key: 'store_bl_addr',         label: 'Banja Luka — adresa',  type: 'text', placeholder: 'Kralja Petra I 5' },
      { key: 'store_bl_hours',        label: 'Banja Luka — radno vr.', type: 'text', placeholder: 'PON–PET 9–17 · SUB 9–14' },
    ],
  },
  footer: {
    label: 'Footer',
    fields: [
      { key: 'footer_about',    label: 'O nama (kratki opis)',  type: 'textarea', placeholder: 'Online protein i suplement shop u BiH…' },
      { key: 'footer_phone',    label: 'Telefon u footeru',     type: 'text',     placeholder: '+387 33 545 000' },
      { key: 'footer_email',    label: 'Email u footeru',       type: 'text',     placeholder: 'info@proteinhouse.ba' },
      { key: 'footer_shipping', label: 'Tekst besplatne dostave', type: 'text',   placeholder: 'BESPLATNA DOSTAVA > 100 KM' },
      { key: 'footer_copyright', label: 'Copyright tekst',     type: 'text',     placeholder: 'ProteinHouse d.o.o. Sva prava zadržana.' },
    ],
  },
  seo: {
    label: 'SEO & Meta',
    fields: [
      { key: 'site_title',       label: 'Naziv sajta',        type: 'text',     placeholder: 'ProteinHouse' },
      { key: 'meta_description', label: 'Meta opis (početna)', type: 'textarea', placeholder: 'Kupujte proteine…' },
      { key: 'og_image',         label: 'OG slika URL',       type: 'text',     placeholder: 'https://proteinhouse.ba/og-image.jpg' },
    ],
  },
}

export default function SiteContent() {
  const [content, setContent] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState({})
  const [saved, setSaved] = useState({})

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('site_content').select('key, value')
      const map = {}
      ;(data ?? []).forEach((r) => { map[r.key] = r.value?.text ?? r.value ?? '' })
      setContent(map)
      setLoading(false)
    }
    load()
  }, [])

  const handleSaveSection = async (sectionKey) => {
    setSaving((s) => ({ ...s, [sectionKey]: true }))
    try {
      const section = SECTIONS[sectionKey]
      const upserts = section.fields.map((f) => ({
        key: f.key,
        value: { text: content[f.key] ?? '' },
        updated_at: new Date().toISOString(),
      }))
      await supabase.from('site_content').upsert(upserts, { onConflict: 'key' })
      setSaved((s) => ({ ...s, [sectionKey]: true }))
      setTimeout(() => setSaved((s) => ({ ...s, [sectionKey]: false })), 2500)
    } finally {
      setSaving((s) => ({ ...s, [sectionKey]: false }))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-7 w-7 rounded-full border-4 border-gray-200 border-t-emerald-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Sadržaj stranice</h2>
        <p className="text-sm text-muted-foreground">Uređujte tekstove, naslove i opise na svim stranicama.</p>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 text-sm flex gap-2">
        <Info size={16} className="shrink-0 mt-0.5" />
        <p>Izmjene ovdje se snimaju u bazu. Stranica mora biti ažurirana da ih pokupi (ili koristite SSR s live Supabase podacima).</p>
      </div>

      <Tabs defaultValue="hero">
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          {Object.entries(SECTIONS).map(([key, { label }]) => (
            <TabsTrigger key={key} value={key} className="text-xs">{label}</TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(SECTIONS).map(([sectionKey, section]) => (
          <TabsContent key={sectionKey} value={sectionKey} className="mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{section.label}</CardTitle>
                <CardDescription>Izmjene se automatski čuvaju po sekciji.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {section.fields.map((field) => (
                  <div key={field.key} className="space-y-1.5">
                    <Label>{field.label}</Label>
                    {field.type === 'textarea' ? (
                      <Textarea
                        value={content[field.key] ?? ''}
                        onChange={(e) => setContent((c) => ({ ...c, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        rows={3}
                      />
                    ) : (
                      <Input
                        value={content[field.key] ?? ''}
                        onChange={(e) => setContent((c) => ({ ...c, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                      />
                    )}
                  </div>
                ))}

                <div className="flex items-center justify-end pt-2">
                  <Button
                    onClick={() => handleSaveSection(sectionKey)}
                    disabled={!!saving[sectionKey]}
                    variant={saved[sectionKey] ? 'emerald' : 'default'}
                    className="flex items-center gap-2"
                  >
                    {saving[sectionKey]
                      ? <><RefreshCw size={14} className="animate-spin" /> Snimanje…</>
                      : saved[sectionKey]
                        ? '✓ Snimljeno!'
                        : <><Save size={14} /> Snimi sekciju</>
                    }
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
