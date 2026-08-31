/**
 * Server-side slanje kupovine Meti i Googleu.
 *
 * Zašto uopće, kad klijent već šalje purchase: preglednici blokiraju
 * third-party skripte, blokatori reklama ih ruše, a iOS reže trajanje
 * kolačića. Kroz klijent prođe grubo 60-80% kupovina. Server-side pošalje
 * svaku, pa platforme optimiziraju po potpunoj slici.
 *
 * ── Deduplikacija ─────────────────────────────────────────────────────────
 * Isti event_id (broj narudžbe) ide i s klijenta i s servera. Meta i Google
 * tada zadrže jedan događaj. Bez toga bi se svaka kupovina brojala dvaput i
 * ROAS bi izgledao dvostruko bolji nego što jest.
 *
 * ── Kada ──────────────────────────────────────────────────────────────────
 * Klijentski purchase puca odmah na potvrdi. Ovaj puca tek kad ERP narudžbu
 * odobri: plaćanje je pouzećem i dio narudžbi propadne na vratima, pa bi
 * optimizacija po nepotvrđenima trošila budžet na ljude koji ne preuzimaju.
 */
import { createHash } from 'node:crypto'

const META_VERZIJA = 'v21.0'

/**
 * Meta traži osobne podatke hashirane SHA-256, i to nad normaliziranim
 * oblikom — inače se ne poklope s onim što ima u svojoj bazi.
 */
export function hash(v) {
  if (!v) return null
  return createHash('sha256').update(String(v).trim().toLowerCase()).digest('hex')
}

/**
 * Telefon mora biti samo znamenke s pozivnim brojem, bez plusa i razmaka.
 * Domaći brojevi stižu kao "061 234 567" ili "+387 61 234 567"; oba moraju
 * završiti kao 38761234567, inače Meta ne prepoznaje istu osobu.
 */
export function normalizirajTelefon(t) {
  if (!t) return null
  let d = String(t).replace(/\D/g, '')
  if (d.startsWith('00')) d = d.slice(2)
  if (d.startsWith('0'))  d = '387' + d.slice(1)   // domaći zapis
  if (!d.startsWith('387') && d.length <= 9) d = '387' + d
  return d.length >= 11 ? d : null
}

/** Pošalji Purchase na Meta Conversions API. */
export async function posaljiMeti({ pixelId, token, testCode, narudzba }) {
  if (!pixelId || !token) return { preskoceno: 'nema Pixel ID ili token' }

  const a = narudzba.atribucija ?? {}
  const stavke = narudzba.items ?? []

  const user_data = {
    em: [hash(narudzba.customer_email)].filter(Boolean),
    ph: [hash(normalizirajTelefon(narudzba.customer_phone))].filter(Boolean),
    // Grad i država pomažu spajanju kad email ne postoji.
    ct: [hash(narudzba.shipping_city)].filter(Boolean),
    country: [hash('ba')],
  }
  if (a.fbc) user_data.fbc = a.fbc
  if (a.fbp) user_data.fbp = a.fbp
  if (a.ip)  user_data.client_ip_address = a.ip
  if (a.ua)  user_data.client_user_agent = a.ua

  const dogadjaj = {
    event_name:  'Purchase',
    event_time:  Math.floor(new Date(narudzba.created_at).getTime() / 1000),
    // Isti id kao klijentski događaj — po ovome Meta prepoznaje duplikat.
    event_id:    narudzba.order_number,
    action_source: 'website',
    event_source_url: a.landing || undefined,
    user_data,
    custom_data: {
      currency: 'BAM',
      value:    Number(narudzba.total),
      content_type: 'product',
      content_ids:  stavke.map((s) => s.id),
      contents: stavke.map((s) => ({
        id: s.id, quantity: s.qty, item_price: Number(s.price),
      })),
      order_id: narudzba.order_number,
    },
  }

  const tijelo = { data: [dogadjaj] }
  if (testCode) tijelo.test_event_code = testCode

  const res = await fetch(
    `https://graph.facebook.com/${META_VERZIJA}/${pixelId}/events?access_token=${encodeURIComponent(token)}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tijelo) },
  )
  const tekst = await res.text()
  if (!res.ok) throw new Error(`Meta CAPI ${res.status}: ${tekst.slice(0, 300)}`)
  return JSON.parse(tekst || '{}')
}

/**
 * Pošalji purchase u GA4 kroz Measurement Protocol.
 *
 * Namjerno GA4, a ne Google Ads API: offline uvoz konverzija kroz Ads API
 * traži OAuth, developer token i odobrenje računa. GA4 konverzija se uvozi u
 * Google Ads jednim klikom u sučelju i daje isti rezultat uz djelić posla.
 * Ako Friday 13 kasnije zatraži pravi offline uvoz po gclid-u, to je zaseban
 * zahvat i treba im pristup Google Ads računu.
 */
export async function posaljiGoogleu({ measurementId, apiSecret, narudzba }) {
  if (!measurementId || !apiSecret) return { preskoceno: 'nema GA4 ID ili api_secret' }

  const a = narudzba.atribucija ?? {}
  // Bez pravog client_id-a GA4 bi ovo pripisao novom korisniku. Rezerva je
  // izvedena iz broja narudžbe da barem bude stabilna, a ne nasumična.
  const client_id = a.ga_client
    || `${parseInt(narudzba.order_number.replace(/\D/g, '').slice(-9) || '1', 10)}.${Math.floor(new Date(narudzba.created_at).getTime() / 1000)}`

  const tijelo = {
    client_id,
    // Bez ovoga GA4 zabilježi događaj u trenutku primitka, ne narudžbe.
    timestamp_micros: new Date(narudzba.created_at).getTime() * 1000,
    non_personalized_ads: false,
    events: [{
      name: 'purchase',
      params: {
        transaction_id: narudzba.order_number,
        value:    Number(narudzba.total),
        currency: 'BAM',
        shipping: Number(narudzba.shipping_cost ?? 0),
        items: (narudzba.items ?? []).map((s) => ({
          item_id:    s.id,
          item_name:  s.title,
          item_brand: s.brand,
          price:      Number(s.price),
          quantity:   s.qty,
        })),
      },
    }],
  }

  const res = await fetch(
    `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(tijelo) },
  )
  // Measurement Protocol vraća 204 bez tijela i NE javlja greške u sadržaju —
  // pogrešan measurement_id prolazi kao uspjeh. Provjera ide kroz DebugView.
  if (!res.ok) throw new Error(`GA4 MP ${res.status}`)
  return { ok: true, client_id }
}
