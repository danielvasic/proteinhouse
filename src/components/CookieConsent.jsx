import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CaretDown, CaretUp } from '@phosphor-icons/react'
import { getConsent, setConsent, initAnalytics } from '../lib/analytics'
import { zabiljeziDolazak, promoviraj } from '../lib/atribucija'
import { BODY } from '../lib/typography'

/**
 * Consent traka na dnu ekrana — dva dugmeta (Prihvati / Odbij),
 * expand za više informacija. Minimalna distrakcija.
 */
export default function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [more,    setMore]    = useState(false)

  useEffect(() => {
    // Klik ID s reklame stigne samo na prvoj otvorenoj stranici — hvata se
    // prije nego posjetitelj išta odluči, ali do privole ostaje u sesiji.
    zabiljeziDolazak()
    initAnalytics()
    if (!getConsent()) setVisible(true)
  }, [])

  if (!visible) return null

  const decide = (value) => {
    setConsent(value)
    // Na prihvat ono što je skupljeno u sesiji prelazi u kolačić od 90 dana,
    // pa atribucija preživi i ako se kupac vrati sutra.
    if (value === 'accepted') promoviraj()
    setVisible(false)
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[90] bg-white border-t-2 border-[#0145F2] shadow-[0_-8px_32px_-8px_rgba(10,14,23,0.25)]"
      style={BODY}
      role="dialog"
      aria-label="Postavke kolačića"
    >
      <div
        className="container py-5"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 20px)' }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <p className="text-[13px] text-gray-600 leading-relaxed m-0 flex-1">
            Koristimo kolačiće za bolje iskustvo kupovine i analitiku.{' '}
            <button
              className="inline-flex items-center gap-0.5 text-[#1e272e] font-semibold underline underline-offset-2 bg-transparent border-0 p-0 cursor-pointer"
              onClick={() => setMore((m) => !m)}
            >
              Više informacija {more ? <CaretUp size={10} /> : <CaretDown size={10} />}
            </button>
          </p>
          <div className="flex gap-3 shrink-0">
            <button
              className="flex-1 sm:flex-none px-6 py-3 border border-gray-300 text-gray-500 bg-transparent text-[11px] font-bold tracking-[0.1em] hover:border-gray-400 transition-colors cursor-pointer"
              onClick={() => decide('declined')}
            >
              Odbij
            </button>
            <button
              className="flex-1 sm:flex-none px-7 py-3 bg-[#0145F2] text-white border-0 text-[11px] font-bold tracking-[0.1em] hover:bg-[#0136C4] transition-colors cursor-pointer"
              onClick={() => decide('accepted')}
            >
              Prihvati
            </button>
          </div>
        </div>

        {more && (
          <div className="mt-3 pt-3 border-t border-gray-100 text-[11px] text-gray-500 leading-relaxed">
            <p className="m-0 mb-1.5">
              <strong className="text-[#1e272e]">Neophodni kolačići</strong> — korpa, sesija i sigurnost. Uvijek aktivni.
            </p>
            <p className="m-0 mb-1.5">
              <strong className="text-[#1e272e]">Analitički kolačići</strong> (Google Analytics) — anonimna statistika posjeta
              koja nam pomaže da poboljšamo shop. Aktiviraju se samo ako prihvatite.
            </p>
            <p className="m-0">
              Detalji u našim <Link to="/kolacici" className="text-[#1e272e] underline">pravilima kolačića</Link>.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
