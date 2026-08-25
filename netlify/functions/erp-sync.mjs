/**
 * Sinhronizacija s ERP-om — svaki sat.
 *
 * Ova funkcija je samo raspored: okine erp-sync-background i odmah završi.
 * Scheduled funkcije imaju limit od 30 sekundi, a sync na novom API-ju
 * (ogledalo ~2600 artikala + stanje skladišta + backfill nacrta) traje duže,
 * pa pravi posao živi u background funkciji s limitom od 15 minuta.
 *
 * Za ručnu provjeru koristi /api/erp-sync-test (admin) — Netlify scheduled
 * funkcije se u produkciji ne mogu pozvati preko HTTP-a.
 */
export default async () => {
  const base = process.env.URL || 'http://localhost:8888'
  try {
    // Background funkcija vrati 202 čim primi zahtjev; posao teče dalje bez nas.
    const res = await fetch(`${base}/.netlify/functions/erp-sync-background`, { method: 'POST' })
    console.log('erp-sync: background okinut,', res.status)
    return new Response(JSON.stringify({ triggered: true, status: res.status }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('erp-sync: okidanje nije uspjelo:', err)
    return new Response(String(err.message || err), { status: 500 })
  }
}

export const config = { schedule: '@hourly' }
