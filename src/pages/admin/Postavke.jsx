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
  seo: {
    label: 'SEO & Meta',
    fields: [
      { key: 'site_title',       label: 'Naziv sajta',         type: 'text',     placeholder: 'ProteinHouse' },
      { key: 'meta_description', label: 'Meta opis (početna)',  type: 'textarea', placeholder: 'Kupujte proteine…' },
      { key: 'og_image',         label: 'OG slika URL',        type: 'text',     placeholder: 'https://proteinhouse.ba/og-image.jpg' },
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
