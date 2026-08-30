import { useEffect, useState } from 'react'
import { Save, RefreshCw, Settings, Info } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Textarea } from '../../components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'

const SECTIONS = {
  contact: {
    label: 'Kontakt',
    fields: [
      { key: 'contact_phone',   label: 'Telefon',                        type: 'text',     placeholder: '+387 36 xxx xxx' },
      { key: 'contact_email',   label: 'Email adresa',                   type: 'text',     placeholder: 'info@proteinhouse.ba' },
      { key: 'contact_hours',   label: 'Radno vrijeme',                  type: 'text',     placeholder: 'PON–SUB 9:00–21:00' },
      { key: 'contact_address', label: 'Adresa (footer)',                type: 'text',     placeholder: 'Kardinala Stepinca bb (Mepas Mall), Mostar' },
      { key: 'footer_shipping', label: 'Tekst dostave (header i footer)', type: 'text',     placeholder: 'BESPLATNA DOSTAVA > 100 KM' },
    ],
  },
  footer: {
    label: 'Footer',
    fields: [
      { key: 'footer_about',     label: 'O nama (kratki opis)',     type: 'textarea', placeholder: 'Online protein i suplement shop u BiH…' },
      { key: 'footer_phone',     label: 'Telefon u footeru',        type: 'text',     placeholder: '+387 33 545 000' },
      { key: 'footer_email',     label: 'Email u footeru',          type: 'text',     placeholder: 'info@proteinhouse.ba' },
      { key: 'footer_copyright', label: 'Copyright tekst',          type: 'text',     placeholder: 'ProteinHouse d.o.o. Sva prava zadržana.' },
    ],
  },
  mjerenje: {
    label: 'Mjerenje',
    opis: 'ID-evi za Google i Meta. Vrijede od sljedećeg učitavanja stranice — nije potreban novi deploy.',
    fields: [
      { key: 'mjerenje_gtm_id', label: 'Google Tag Manager — ID kontejnera', type: 'text',
        placeholder: 'GTM-XXXXXXX', pomoc: 'Radi odmah čim ga upišeš. Učitava se tek nakon što posjetitelj prihvati kolačiće.' },
      { key: 'mjerenje_meta_pixel_id', label: 'Meta Pixel — ID', type: 'text',
        placeholder: '1234567890', pomoc: 'Radi odmah. Upiši ga OVDJE samo ako Pixel nije već postavljen unutar GTM kontejnera — inače bi se svaki događaj brojao dvaput.' },
      { key: 'mjerenje_ga4_id', label: 'Google Analytics 4 — Measurement ID', type: 'text',
        placeholder: 'G-XXXXXXXXXX', pomoc: 'Spremljeno za kasnije. GA4 se obično vodi kroz GTM, pa ovo popuni samo ako ti Friday 13 kaže.' },
      { key: 'mjerenje_google_ads_id', label: 'Google Ads — Conversion ID', type: 'text',
        placeholder: 'AW-123456789', pomoc: 'Spremljeno za kasnije — koristit će ga server-side slanje konverzija.' },
      { key: 'mjerenje_google_ads_label', label: 'Google Ads — Conversion Label', type: 'text',
        placeholder: 'AbC-D_efG', pomoc: 'Spremljeno za kasnije.' },
      { key: 'meta_capi_token', label: 'Meta Conversions API — token', type: 'password', tajna: true,
        placeholder: 'EAAG…', pomoc: 'TAJNA. Spremljeno za kasnije, kad napravimo server-side slanje. Čuva se odvojeno od ostalih postavki i nikad ne izlazi na stranicu.' },
      { key: 'meta_test_event_code', label: 'Meta — Test Event Code', type: 'password', tajna: true,
        placeholder: 'TEST12345', pomoc: 'TAJNA. Samo za testiranje u Meta Events Manageru, obriši kad završiš.' },
    ],
  },
  seo: {
    label: 'SEO & Meta',
    fields: [
      { key: 'site_title',       label: 'Naziv sajta',         type: 'text',     placeholder: 'ProteinHouse' },
      { key: 'meta_description', label: 'Meta opis (početna)',  type: 'textarea', placeholder: 'Kupujte proteine…' },
      { key: 'og_image',         label: 'OG slika URL',        type: 'text',     placeholder: 'https://proteinhouse.ba/og-image.png' },
    ],
  },
}

export default function Postavke() {
  const [content, setContent] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState({})
  const [saved, setSaved] = useState({})

  useEffect(() => {
    async function load() {
      // Tajne su u zasebnoj tablici koju smije čitati samo admin; ako upit
      // padne (npr. sesija istekla), ostale postavke se svejedno prikažu.
      const [{ data }, { data: tajne }] = await Promise.all([
        supabase.from('site_content').select('key, value'),
        supabase.from('ad_secrets').select('key, value'),
      ])
      const map = {}
      ;(data ?? []).forEach((r) => { map[r.key] = r.value?.text ?? r.value ?? '' })
      ;(tajne ?? []).forEach((r) => { map[r.key] = r.value ?? '' })
      setContent(map)
      setLoading(false)
    }
    load()
  }, [])

  const handleSaveSection = async (sectionKey) => {
    setSaving((s) => ({ ...s, [sectionKey]: true }))
    try {
      const section = SECTIONS[sectionKey]
      const sada = new Date().toISOString()
      // Tajne u ad_secrets (samo admin čita), sve ostalo u site_content koji
      // je javno čitljiv jer ga SSR treba za prikaz stranice.
      const javna = section.fields.filter((f) => !f.tajna)
      const tajna = section.fields.filter((f) => f.tajna)

      if (javna.length) {
        await supabase.from('site_content').upsert(
          javna.map((f) => ({ key: f.key, value: { text: content[f.key] ?? '' }, updated_at: sada })),
          { onConflict: 'key' },
        )
      }
      if (tajna.length) {
        await supabase.from('ad_secrets').upsert(
          tajna.map((f) => ({ key: f.key, value: content[f.key] ?? '', updated_at: sada })),
          { onConflict: 'key' },
        )
      }
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
      <div className="flex items-center gap-3">
        <Settings size={20} className="text-muted-foreground" />
        <div>
          <h2 className="text-xl font-bold text-gray-900">Postavke</h2>
          <p className="text-sm text-muted-foreground">Kontakt informacije, footer i SEO podešavanja.</p>
        </div>
      </div>

      <div className="rounded-lg bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 text-sm flex gap-2">
        <Info size={16} className="shrink-0 mt-0.5" />
        <p>Izmjene se odmah snimaju u bazu i prikazuju na sajtu.</p>
      </div>

      <Tabs defaultValue="contact">
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
                <CardDescription>{section.opis ?? 'Izmjene se automatski čuvaju po sekciji.'}</CardDescription>
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
                        type={field.type === 'password' ? 'password' : 'text'}
                        autoComplete={field.type === 'password' ? 'new-password' : undefined}
                        value={content[field.key] ?? ''}
                        onChange={(e) => setContent((c) => ({ ...c, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                      />
                    )}
                    {field.pomoc && (
                      <p className={`text-[11px] leading-relaxed ${field.tajna ? 'text-amber-700' : 'text-muted-foreground'}`}>
                        {field.pomoc}
                      </p>
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
