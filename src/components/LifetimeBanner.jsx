import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Percent } from '@phosphor-icons/react'
import { useSiteContent } from '../hooks/useSiteContent'
import { BODY } from '../lib/typography'

const HIDE_KEY = 'ph_lifetime_banner_hidden'

const KEYS = ['lifetime_banner_text', 'lifetime_banner_sub', 'lifetime_banner_link']
const DEFAULTS = {
  lifetime_banner_text: '−10% na prvu narudžbu',
  lifetime_banner_sub:  'Kod: PRVIH10',
  lifetime_banner_link: '/kategorija/akcija',
}

/** Lifetime banner — stalno dostupan popust, floating chip u uglu ekrana. */
export default function LifetimeBanner() {
  const navigate = useNavigate()
  const { data } = useSiteContent(KEYS, DEFAULTS)
  const banner = {
    text: data.lifetime_banner_text,
    sub:  data.lifetime_banner_sub,
    link: data.lifetime_banner_link,
  }
  const [hidden, setHidden] = useState(true)

  useEffect(() => {
    try { setHidden(sessionStorage.getItem(HIDE_KEY) === '1') } catch { setHidden(false) }
  }, [])

  if (hidden || !banner.text) return null

  const dismiss = (e) => {
    e.stopPropagation()
    setHidden(true)
    try { sessionStorage.setItem(HIDE_KEY, '1') } catch { /* ignore */ }
  }

  return (
    <button
      // Vulcan Orange — brand book tu boju drži za popuste, a ovo je trajni popust
      className="fixed bottom-4 left-4 z-[85] flex items-center gap-2.5 pl-3 pr-8 py-2.5 bg-[#ff4103] text-white border border-white/15 shadow-[0_8px_24px_-6px_rgba(30,39,46,0.5)] cursor-pointer hover:bg-[#e03903] transition-colors text-left"
      style={BODY}
      onClick={() => navigate(banner.link || '/kategorija/akcija')}
      aria-label={banner.text}
    >
      <span className="flex items-center justify-center w-8 h-8 bg-white/10 shrink-0">
        <Percent size={15} weight="bold" />
      </span>
      <span>
        <span className="block text-[11px] font-bold tracking-[0.08em] leading-tight">{banner.text}</span>
        {banner.sub && <span className="block text-[10px] text-white/55 leading-tight mt-0.5">{banner.sub}</span>}
      </span>
      <span
        className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center text-white/50 hover:text-white transition-colors"
        onClick={dismiss}
        role="button"
        tabIndex={0}
        aria-label="Sakrij"
        onKeyDown={(e) => e.key === 'Enter' && dismiss(e)}
      >
        <X size={11} weight="bold" />
      </span>
    </button>
  )
}
