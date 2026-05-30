import { useEffect } from 'react'
import { ShoppingBag, X } from '@phosphor-icons/react'
import { useCart } from '../store/CartContext'
import { fmtKM } from '../data/catalog'

const FREE_SHIPPING_THRESHOLD = 100

export default function CartDrawer() {
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
        className={`fixed inset-0 bg-[#0F172A]/50 z-[89] transition-opacity duration-200 ${drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 bottom-0 w-[380px] max-w-[92vw] bg-white z-[90] flex flex-col shadow-xl transition-transform duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
        aria-label="Korpa"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-sm font-bold tracking-[0.1em] uppercase text-[#0F2952]" style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}>
            KORPA · {items.length}
          </h2>
          <button
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-[#0F2952] transition-colors duration-150 cursor-pointer bg-transparent border-0"
            onClick={closeDrawer}
            aria-label="Zatvori korpu"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-16">
              <ShoppingBag size={48} color="#D1D5DB" />
              <p className="text-sm text-gray-400">Vaša korpa je trenutno prazna</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {items.map((item, idx) => (
                <div key={`${item.id}-${idx}`} className="flex gap-3 p-3 bg-gray-50 rounded-xl relative">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-white border border-gray-200 shrink-0">
                    <img src={item.img} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <p className="text-[10px] font-bold tracking-[0.1em] uppercase text-[#2563EB] mb-0.5">{item.brand}</p>
                    <p className="text-[12px] font-semibold text-[#0F2952] leading-snug line-clamp-2">{item.title}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[11px] text-gray-500">{item.qty} × {fmtKM(item.price)}</span>
                      <span className="text-sm font-bold text-[#0F2952]">{fmtKM(item.price * item.qty)}</span>
                    </div>
                  </div>
                  <button
                    className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-200 hover:text-gray-700 transition-colors duration-150 cursor-pointer bg-transparent border-0"
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
        <div className="border-t border-gray-200 px-5 py-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold tracking-[0.1em] uppercase text-gray-500">UKUPNO</span>
            <span className="text-xl font-extrabold text-[#0F2952]">{fmtKM(totalPrice)}</span>
          </div>

          {nudge > 0 && items.length > 0 && (
            <div className="text-[11px] text-center py-2 px-3 bg-[#DBEAFE] text-[#1D4ED8] rounded-lg font-medium">
              Još <strong>{fmtKM(nudge)}</strong> do besplatne dostave!
            </div>
          )}

          <button
            className="w-full py-3.5 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:bg-gray-200 disabled:text-gray-400 text-white text-sm font-bold tracking-[0.08em] uppercase rounded-xl transition-colors duration-150 cursor-pointer disabled:cursor-not-allowed"
            disabled={items.length === 0}
          >
            Nastavi do plaćanja
          </button>
          <button
            className="w-full py-2.5 bg-transparent border border-gray-200 hover:border-gray-300 text-[#0F2952] text-xs font-bold tracking-[0.08em] uppercase rounded-xl transition-colors duration-150 cursor-pointer"
            onClick={closeDrawer}
          >
            Nastavi kupovinu
          </button>
        </div>
      </aside>
    </>
  )
}
