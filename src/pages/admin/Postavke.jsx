import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
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
    opis: 'Sve za Meta i Google oglase. Vrijedi od sljedećeg učitavanja stranice — nije potreban novi deploy.',
    fields: [
      { key: 'mjerenje_meta_domain', label: 'Meta — verifikacija domene', type: 'text',
        placeholder: 'a1b2c3d4e5f6g7h8i9',
        pomoc: 'PRVI KORAK za Meta oglase. U Business Manageru → Brand Safety → Domains dodaj proteinhouse.ba i izaberi "Meta-tag verification". Zalijepi ovdje SAMO vrijednost iz content="…", ne cijeli tag. Snimi, pa u Meti klikni Verify — tag je odmah u izvoru stranice.' },
      { key: 'mjerenje_google_verify', label: 'Google — verifikacija vlasništva', type: 'text',
        placeholder: 'abcdefgh12345678',
        pomoc: 'Za Merchant Center i Search Console. Izaberi "HTML tag" način i zalijepi samo vrijednost iz content="…".' },
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
      { key: 'mjerenje_erp_status_konverzije', label: 'ERP status koji znači potvrđenu narudžbu', type: 'text',
        placeholder: '3', pomoc: 'Server-side kupovina se šalje tek kad narudžba u ERP-u dođe u ovaj status. Zadano 3 (Odobrena). Može više, odvojeno zarezom — npr. "2,3". Statusi: 1 Kreiranje, 2 Na čekanju, 3 Odobrena, 4 Otkazana, 5 Odbijena. Plaćanje je pouzećem, pa slanje prerano znači da reklame uče na narudžbama koje nisu preuzete.' },
      { key: 'meta_capi_token', label: 'Meta Conversions API — token', type: 'password', tajna: true,
        placeholder: 'EAAG…', pomoc: 'TAJNA. Bez njega nema server-side slanja Meti. Čuva se odvojeno od ostalih postavki i nikad ne izlazi na stranicu.' },
      { key: 'ga4_api_secret', label: 'GA4 Measurement Protocol — api_secret', type: 'password', tajna: true,
        placeholder: 'abc123…', pomoc: 'TAJNA. GA4 → Admin → Data Streams → Measurement Protocol API secrets. Bez njega nema server-side slanja Googleu.' },
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

/**
 * Kontrolna lista za pustanje oglasa.
 *
 * Postoji jer se do sada nije vidjelo NISTA: administrator upise kljuceve i
 * nema povratne informacije radi li mjerenje. Ovdje se odmah vidi sto je
 * postavljeno, koliko je konverzija stvarno poslano i gdje je zapelo.
 *
 * Redoslijed nije slucajan — to je redoslijed kojim se oglasi pustaju.
 * Verifikacija domene je prva jer bez nje Meta ne da pokrenuti kampanju.
 */
function StanjeMjerenja({ content }) {
  const [broj, setBroj] = useState(null)

  useEffect(() => {
    async function ucitaj() {
      const [{ count: aktivnih }, { count: poslanih }, { count: greski }, { count: ceka }] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('orders').select('id', { count: 'exact', head: true }).not('konverzija_poslana_at', 'is', null),
        supabase.from('orders').select('id', { count: 'exact', head: true }).not('konverzija_greska', 'is', null),
        supabase.from('orders').select('id', { count: 'exact', head: true })
          .is('konverzija_poslana_at', null).not('erp_order_id', 'is', null),
      ])
      setBroj({ aktivnih, poslanih, greski, ceka })
    }
    ucitaj().catch(() => setBroj({}))
  }, [])

  const ima = (k) => Boolean(content[k]?.trim())
  const koraci = [
    { ok: ima('mjerenje_meta_domain'), naslov: 'Meta: domena verificirana',
      ako: 'Bez ovoga Meta ne da pokrenuti kampanju koja vodi na proteinhouse.ba.' },
    { ok: ima('mjerenje_google_verify'), naslov: 'Google: vlasništvo potvrđeno',
      ako: 'Merchant Center bez ovoga ne prihvata feed.' },
    { ok: ima('mjerenje_meta_pixel_id'), naslov: 'Meta Pixel radi na stranici',
      ako: 'Upiši Pixel ID. Učitava se tek nakon što posjetitelj prihvati kolačiće.' },
    { ok: ima('mjerenje_gtm_id'), naslov: 'Google Tag Manager radi',
      ako: 'Upiši GTM container ID.' },
    { ok: ima('meta_capi_token'), naslov: 'Meta CAPI (slanje sa servera)',
      ako: 'Bez tokena kroz preglednik prođe samo 60-80% kupovina.' },
    { ok: ima('mjerenje_ga4_id') && ima('ga4_api_secret'), naslov: 'GA4 slanje sa servera',
      ako: 'Treba i Measurement ID i api_secret.' },
  ]
  const gotovo = koraci.filter((k) => k.ok).length

  return (
    <Card className="mb-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Spremnost za oglase — {gotovo}/{koraci.length}</CardTitle>
        <CardDescription>Redoslijed kojim se oglasi puštaju. Sve se podešava ispod.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {koraci.map((k) => (
          <div key={k.naslov} className="flex gap-2.5 items-start text-sm">
            <span className={k.ok ? 'text-emerald-600' : 'text-amber-500'}>{k.ok ? '✓' : '○'}</span>
            <div>
              <span className={k.ok ? 'text-gray-900' : 'text-gray-700 font-medium'}>{k.naslov}</span>
              {!k.ok && <p className="text-[11px] text-muted-foreground">{k.ako}</p>}
            </div>
          </div>
        ))}

        <div className="pt-3 mt-1 border-t grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
          <Brojka oznaka="proizvoda u feedu" v={broj?.aktivnih} />
          <Brojka oznaka="konverzija poslano" v={broj?.poslanih} />
          <Brojka oznaka="čeka odobrenje ERP-a" v={broj?.ceka} />
          <Brojka oznaka="s greškom" v={broj?.greski} upozorenje={broj?.greski > 0} />
        </div>
        <p className="text-[11px] text-muted-foreground pt-1">
          Feed za Merchant Center i Meta katalog:{' '}
          <a href="/feed.xml" target="_blank" rel="noreferrer" className="underline">/feed.xml</a>
          {' · '}Server šalje kupovinu tek kad je ERP odobri, ne odmah po narudžbi.
        </p>
      </CardContent>
    </Card>
  )
}

function Brojka({ oznaka, v, upozorenje }) {
  return (
    <div>
      <p className={`text-xl font-bold ${upozorenje ? 'text-red-600' : 'text-gray-900'}`}>
        {v ?? '—'}
      </p>
      <p className="text-[10px] text-muted-foreground leading-tight">{oznaka}</p>
    </div>
  )
}

export default function Postavke() {
  // Tab je u URL-u (?tab=mjerenje) da se na njega moze poslati link. Bez
  // toga se do postavki za oglase dolazilo samo klikom kroz Postavke, a to
  // je stranica koja se otvara svaki dan dok kampanje traju.
  const [params, setParams] = useSearchParams()
  const tab = SECTIONS[params.get('tab')] ? params.get('tab') : 'contact'

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

      <Tabs value={tab} onValueChange={(v) => setParams(v === 'contact' ? {} : { tab: v })}>
        <TabsList className="flex flex-wrap h-auto gap-1 p-1">
          {Object.entries(SECTIONS).map(([key, { label }]) => (
            <TabsTrigger key={key} value={key} className="text-xs">{label}</TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(SECTIONS).map(([sectionKey, section]) => (
          <TabsContent key={sectionKey} value={sectionKey} className="mt-4">
            {sectionKey === 'mjerenje' && <StanjeMjerenja content={content} />}
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
