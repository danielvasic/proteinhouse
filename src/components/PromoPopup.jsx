import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Tag } from '@phosphor-icons/react'
import { supabase } from '../lib/supabase'
import { BODY, DISPLAY } from '../lib/typography'

const SEEN_KEY  = 'ph_promo_popup_seen'
const DELAY_MS  = 12000   // iskače nakon ~12 sekundi

/**
 * Popup banner za akcije — uzima najnoviju aktivnu promociju iz admin
 * panela (promotions tabela), prikazuje se jednom po sesiji.
 */
export default function PromoPopup() {
  const navigate = useNavigate()
  const [promo, setPromo] = useState(null)
  const [open,  setOpen]  = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SEEN_KEY)) return
    } catch { return }

    let timer
    supabase
      .from('promotions')
      .select('id, title, subtitle, badge, description, image_url, link, promo_code, discount_percent')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error || !data) return
        setPromo(data)
        timer = setTimeout(() => {
          setOpen(true)
          try { sessionStorage.setItem(SEEN_KEY, '1') } catch { /* ignore */ }
        }, DELAY_MS)
      })
    return () => clearTimeout(timer)
  }, [])

  if (!open || !promo) return null

  const close = () => setOpen(false)

  return (
    <div
      className="fixed inset-0 z-[95] flex items-center justify-center p-5"
      style={BODY}
      role="dialog"
      aria-modal="true"
      aria-label={promo.title}
    >
      <div className="absolute inset-0 bg-[#1e272e]/60" onClick={close} style={{ animation: 'fadeIn 200ms ease' }} />

      <div
        className="relative w-full max-w-[420px] bg-white shadow-2xl overflow-hidden"
        style={{ animation: 'popupIn 260ms cubic-bezier(0.34, 1.3, 0.64, 1)' }}
      >
        <button
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center bg-white/90 border-0 text-[#1e272e] cursor-pointer hover:bg-white transition-colors"
          onClick={close}
          aria-label="Zatvori"
        >
          <X size={16} weight="bold" />
        </button>

        {promo.image_url && (
          <div
            className="h-[160px] bg-cover bg-center"
            style={{ backgroundImage: `url('${promo.image_url}')` }}
          />
        )}

        <div className="p-6 text-center">
          {(promo.badge || promo.discount_percent) && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 mb-3 bg-[#0145F2] text-white text-[10px] font-bold tracking-[0.14em] uppercase">
              <Tag size={11} weight="fill" /> {promo.badge || `−${promo.discount_percent}%`}
            </span>
          )}
          <h3
            className="text-2xl font-bold text-[#1e272e] uppercase leading-tight mb-2"
            style={DISPLAY}
          >
            {promo.title}
          </h3>
          {(promo.subtitle || promo.description) && (
            <p className="text-[13px] text-gray-500 leading-relaxed mb-4">{promo.subtitle || promo.description}</p>
          )}
          {promo.promo_code && (
            <p className="mb-4 text-[12px] text-gray-500">
              Kod: <strong className="px-2 py-1 bg-gray-100 border border-dashed border-gray-300 text-[#1e272e] font-mono tracking-wider">{promo.promo_code}</strong>
            </p>
          )}
          <button
            className="w-full py-3.5 bg-[#0145F2] text-white border-0 text-[11px] font-bold tracking-[0.12em] uppercase hover:bg-[#0136C4] transition-colors cursor-pointer"
            onClick={() => { close(); navigate(promo.link || '/kategorija/akcija') }}
          >
            Iskoristi ponudu →
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes popupIn { from { opacity: 0; transform: scale(0.92) translateY(16px) } to { opacity: 1; transform: none } }
      `}</style>
    </div>
  )
}
