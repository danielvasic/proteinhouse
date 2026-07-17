import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, X } from '@phosphor-icons/react'
import { useCart } from '../store/CartContext'
import { fmtKM } from '../data/catalog'

const FREE_SHIPPING_THRESHOLD = 100

export default function CartDrawer() {
  const navigate = useNavigate()
  const { items, drawerOpen, totalPrice, closeDrawer, removeItem } = useCart()

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = drawerOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [drawerOpen])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = (e) => { if (e.key === 'Escape') closeDrawer() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [closeDrawer])

  const nudge = FREE_SHIPPING_THRESHOLD - totalPrice

  return (
    <>
      {/* Scrim */}
      <div
        className={`fixed inset-0 bg-[#0A1F42]/40 z-[89] backdrop-blur-[2px] transition-opacity duration-200 ${drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 bottom-0 w-[380px] max-w-[92vw] bg-white z-[90] flex flex-col shadow-2xl transition-transform duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
        aria-label="Korpa"
        role="dialog"
        aria-modal="true"
        style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-[11px] font-bold tracking-[0.16em] uppercase text-[#0F2952]">
            Korpa · {items.length} {items.length === 1 ? 'artikal' : 'artikala'}
          </h2>
          <button
            className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-[#0F2952] hover:bg-gray-100 transition-colors duration-150 cursor-pointer bg-transparent border-0"
            onClick={closeDrawer}
            aria-label="Zatvori korpu"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center py-16 px-6">
              <ShoppingCart size={44} color="#D1D5DB" weight="thin" />
              <div>
                <p className="text-[13px] font-semibold text-[#0F2952] mb-1">Korpa je prazna</p>
                <p className="text-[12px] text-gray-400">Dodajte proizvode iz naše ponude</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {items.map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="flex gap-3 p-4 relative">
                  <div className="w-16 h-16 border border-gray-200 bg-gray-50 shrink-0 overflow-hidden">
                    <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 pr-5">
                    <p className="text-[10px] font-bold tracking-[0.12em] uppercase text-gray-400 mb-0.5">{item.brand}</p>
                    <p className="text-[12px] font-semibold text-[#0F2952] leading-snug line-clamp-2 mb-2">{item.title}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">{item.qty} × {fmtKM(item.price)}</span>
                      <span className="text-[13px] font-bold text-[#0F2952]">{fmtKM(item.price * item.qty)}</span>
                    </div>
                  </div>
                  <button
                    className="absolute top-3 right-3 w-5 h-5 flex items-center justify-center text-gray-300 hover:text-gray-600 transition-colors duration-150 cursor-pointer bg-transparent border-0"
                    onClick={() => removeItem(idx)}
                    aria-label={`Ukloni ${item.title}`}
                  >
                    <X size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-5 flex flex-col gap-3">
          {/* Shipping nudge */}
          {nudge > 0 && items.length > 0 && (
            <div className="flex items-center justify-between py-2.5 px-3.5 border border-gray-200 bg-gray-50">
              <span className="text-[11px] text-gray-500">
                Još <strong className="text-[#0F2952] font-bold">{fmtKM(nudge)}</strong> do besplatne dostave
              </span>
              <div className="w-24 h-1 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#0F2952] rounded-full transition-all duration-300"
                  style={{ width: `${Math.min((totalPrice / FREE_SHIPPING_THRESHOLD) * 100, 100)}%` }}
                />
              </div>
            </div>
          )}

          {/* Total */}
          <div className="flex items-center justify-between py-1">
            <span className="text-[11px] font-bold tracking-[0.12em] uppercase text-gray-400">Ukupno</span>
            <span className="text-xl font-bold text-[#0F2952]" style={{ fontFamily: 'Oswald, Impact, system-ui, sans-serif' }}>
              {fmtKM(totalPrice)}
            </span>
          </div>

          <button
            className="w-full py-4 bg-[#0F2952] text-white text-[11px] font-bold tracking-[0.12em] uppercase hover:bg-[#0A1F42] disabled:bg-gray-200 disabled:text-gray-400 transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed"
            disabled={items.length === 0}
            onClick={() => { closeDrawer(); navigate('/checkout') }}
          >
            Nastavi do plaćanja
          </button>
          <button
            className="w-full py-3 border border-gray-300 text-[#0F2952] text-[11px] font-bold tracking-[0.1em] uppercase hover:border-gray-400 transition-colors duration-150 cursor-pointer bg-transparent"
            onClick={closeDrawer}
          >
            Nastavi kupovinu
          </button>
        </div>
      </aside>
    </>
  )
}
