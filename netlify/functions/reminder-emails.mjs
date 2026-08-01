/**
 * Podsjetnik za obnovu zaliha — jednom dnevno.
 *
 * Kupcu koji je prije 25 dana naručio šaljemo email s kupon kodom za sljedeću
 * kupovinu. Svaka narudžba se obradi tačno jednom (orders.reminder_sent_at).
 *
 * Logika je u src/server/reminders.js; ovdje je samo raspored.
 * Za ručnu provjeru koristi /api/reminder-test (admin) — Netlify scheduled
 * funkcije se u produkciji ne mogu pozvati preko HTTP-a.
 *
 * Env varijable (Netlify → Site config → Environment variables):
 *   SUPABASE_SERVICE_ROLE_KEY   — obavezno, čita narudžbe mimo RLS-a
 *   RESEND_API_KEY              — obavezno
 *   RESEND_FROM                 — npr. "ProteinHouse <info@proteinhouse.ba>"
 *   REMINDER_COUPON             — opciono, default POPUST5
 *   SITE_URL                    — opciono, default https://proteinhouse.ba
 */
import { runReminders } from '../../src/server/reminders.js'

export default async () => {
  try {
    const r = await runReminders()
    console.log(`reminder-emails: obrađeno ${r.processed}, poslano ${r.sent}, neuspjelo ${r.failed}`)
    return new Response(JSON.stringify(r), { headers: { 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('reminder-emails:', err)
    return new Response(err.message, { status: err.code === 'NOT_CONFIGURED' ? 501 : 500 })
  }
}

export const config = { schedule: '@daily' }
