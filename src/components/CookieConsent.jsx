import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CaretDown, CaretUp } from '@phosphor-icons/react'
import { getConsent, setConsent, initAnalytics } from '../lib/analytics'

/**
 * Consent traka na dnu ekrana — dva dugmeta (Prihvati / Odbij),
 * expand za više informacija. Minimalna distrakcija.
 */
export default function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [more,    setMore]    = useState(false)

  useEffect(() => {
    initAnalytics()
    if (!getConsent()) setVisible(true)
  }, [])

  if (!visible) return null

  const decide = (value) => {
    setConsent(value)
    setVisible(false)
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-[90] bg-white border-t-2 border-[#0F2952] shadow-[0_-8px_32px_-8px_rgba(10,31,66,0.25)]"
      style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}
      role="dialog"
      aria-label="Postavke kolačića"
    >
      <div className="container py-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <p className="text-[12px] text-gray-600 leading-snug m-0 flex-1">
            Koristimo kolačiće za bolje iskustvo kupovine i analitiku.{' '}
            <button
              className="inline-flex items-center gap-0.5 text-[#0F2952] font-semibold underline underline-offset-2 bg-transparent border-0 p-0 cursor-pointer"
              onClick={() => setMore((m) => !m)}
            >
              Više informacija {more ? <CaretUp size={10} /> : <CaretDown size={10} />}
            </button>
          </p>
          <div className="flex gap-2 shrink-0">
            <button
              className="flex-1 sm:flex-none px-5 py-2.5 border border-gray-300 text-gray-500 bg-transparent text-[11px] font-bold tracking-[0.1em] uppercase hover:border-gray-400 transition-colors cursor-pointer"
              onClick={() => decide('declined')}
            >
              Odbij
            </button>
            <button
              className="flex-1 sm:flex-none px-6 py-2.5 bg-[#0F2952] text-white border-0 text-[11px] font-bold tracking-[0.1em] uppercase hover:bg-[#0A1F42] transition-colors cursor-pointer"
              onClick={() => decide('accepted')}
            >
              Prihvati
            </button>
          </div>
        </div>

        {more && (
          <div className="mt-3 pt-3 border-t border-gray-100 text-[11px] text-gray-500 leading-relaxed">
            <p className="m-0 mb-1.5">
              <strong className="text-[#0F2952]">Neophodni kolačići</strong> — korpa, sesija i sigurnost. Uvijek aktivni.
            </p>
            <p className="m-0 mb-1.5">
              <strong className="text-[#0F2952]">Analitički kolačići</strong> (Google Analytics) — anonimna statistika posjeta
              koja nam pomaže da poboljšamo shop. Aktiviraju se samo ako prihvatite.
            </p>
            <p className="m-0">
              Detalji u našim <Link to="/kolacici" className="text-[#0F2952] underline">pravilima kolačića</Link>.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
