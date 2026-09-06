/**
 * Viber Business Messages preko BulkGatea.
 *
 * Viber NIJE SMS: poruka na proizvoljan broj ne postoji. Dva su legalna puta —
 * chatbot (od 2024. €100/mj i pise samo pretplacenima) i Business Messages
 * preko ovlastenog agregatora, gdje kupac ne mora nista instalirati ni
 * kliknuti. Ovdje je drugi put, kroz BulkGate: promotivna poruka u BiH
 * €0,01, bez mjesecne pretplate (prepaid kredit).
 *
 * Promotivne poruke traze IZRICITU privolu i dokaz o njoj — kod nas je to
 * kvacica na checkoutu (orders.viber_consent_at/_text, tekst je konstanta u
 * kreiraj_narudzbu). Bez privole se ne salje, tacka; agregator za spam
 * naplacuje penale.
 *
 * Endpoint je PROMOTIVNI namjerno: BulkGate transakcijski API izricito
 * zabranjuje marketinski sadrzaj, a podsjetnik s kuponom to jest.
 *
 * Bez env kljuceva sve radi u dry-run modu (posaljiViber vrati skipped),
 * isto kao Resend za email.
 *
 * Env: BULKGATE_APPLICATION_ID, BULKGATE_APPLICATION_TOKEN,
 *      BULKGATE_VIBER_SENDER (registrovani sender, ~14 dana odobrenja),
 *      BULKGATE_ENDPOINT (opcionalno, default promotivni v2).
 */

const ENDPOINT = process.env.BULKGATE_ENDPOINT
  || 'https://portal.bulkgate.com/api/2.0/advanced/promotional'

export function viberKonfigurisan() {
  return Boolean(
    process.env.BULKGATE_APPLICATION_ID &&
    process.env.BULKGATE_APPLICATION_TOKEN &&
    process.env.BULKGATE_VIBER_SENDER,
  )
}

/**
 * Broj iz checkouta ("+387 61 234-567", "061 234 567", "00387…") u oblik koji
 * BulkGate trazi: medjunarodni bez plusa, "38761234567". Vraca null za sve sto
 * nije BiH mobilni — sender je registrovan za BiH, a fiksni brojevi nemaju
 * Viber.
 */
export function normalizujBrojBiH(raw) {
  let n = String(raw ?? '').replace(/\D/g, '')
  if (!n) return null
  if (n.startsWith('00387')) n = n.slice(2)
  else if (n.startsWith('0') && !n.startsWith('00')) n = '387' + n.slice(1)
  if (!n.startsWith('387')) return null
  const lokalni = n.slice(3)
  if (!/^6\d{7,8}$/.test(lokalni)) return null
  return n
}

/**
 * @param {{ to: string, text: string, button?: {caption: string, url: string}, image?: string, tag?: string }} p
 * @returns {Promise<{ok: true, message_id: string|null, status: string|null} | {ok: false, skipped: string}>}
 */
export async function posaljiViber({ to, text, button, image, tag }) {
  const number = normalizujBrojBiH(to)
  if (!number) return { ok: false, skipped: 'nije BiH mobilni broj' }
  if (!viberKonfigurisan()) return { ok: false, skipped: 'BulkGate nije konfigurisan' }

  const body = {
    application_id:    process.env.BULKGATE_APPLICATION_ID,
    application_token: process.env.BULKGATE_APPLICATION_TOKEN,
    number: [number],
    country: 'ba',
    text,
    duplicates_check: 'on',
    ...(tag && { tag }),
    channel: {
      viber: {
        sender: process.env.BULKGATE_VIBER_SENDER,
        text,
        // Koliko dugo agregator pokusava dostaviti prije nego odustane. Bez
        // SMS fallbacka namjerno: kupac je pristao na Viber, ne na SMS, a
        // fallback bi se i naplacivao.
        expiration: 3600,
        ...(button && { button: { caption: button.caption, url: button.url } }),
        ...(image  && { image: { url: image, zoom: true } }),
      },
    },
  }

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok || json?.error) {
    throw new Error(`BulkGate ${res.status}: ${json?.error || json?.type || 'nepoznata greska'}`)
  }
  const r = json?.data?.response?.[0]
  return { ok: true, message_id: r?.message_id ?? null, status: r?.status ?? null }
}
