import { useEffect, useMemo, useState } from 'react'
import { Plus } from '@phosphor-icons/react'
import { supabase } from '../lib/supabase'
import { norm } from '../hooks/useProducts'
import { useCart } from '../store/CartContext'
import { fmtKM } from '../lib/price'

/**
 * "One-Click Add-on" — jeftini logični dodaci za ono što je već u korpi.
 * Add-oni se vežu za proizvod u administraciji (products.addons), a ovdje se
 * skupe iz svih stavki korpe, izbace oni koji su već dodani, i ponude u jednom kliku.
 */
export default function CartAddons() {
  const { items, addItem } = useCart()
  const [products, setProducts] = useState([])

  // productId → promo cijena (ili null za redovnu)
  const wanted = useMemo(() => {
    const map = new Map()
    for (const item of items) {
      for (const a of item.addons ?? []) {
        if (!map.has(a.product_id)) map.set(a.product_id, a.price ?? null)
      }
    }
    for (const item of items) map.delete(item.id)
    return map
  }, [items])

  const ids = useMemo(() => [...wanted.keys()].sort().join(','), [wanted])

  useEffect(() => {
    if (!ids) { setProducts([]); return }
    let cancelled = false
    supabase
      .from('products')
      .select('*')
      .in('id', ids.split(','))
      .eq('is_active', true)
      .then(({ data, error }) => {
        if (!cancelled && !error && data) setProducts(data.map(norm))
      })
    return () => { cancelled = true }
  }, [ids])

  const offers = products
    .map((p) => ({ product: p, price: wanted.get(p.id) ?? p.price }))
    .filter((o) => o.price != null)

  if (offers.length === 0) return null

  return (
    <div className="border-t border-gray-100 px-4 py-4 bg-[#edf1f5]">
      <p className="text-[10px] font-bold tracking-[0.14em] text-gray-400 mb-3">
        Dodaj uz narudžbu
      </p>
      <div className="space-y-2">
        {offers.map(({ product, price }) => (
          <button
            key={product.id}
            type="button"
            onClick={() => addItem({
              ...product,
              price,
              selectedFlavor: product.flavors[0] ?? null,
              selectedSize:   product.sizes[0]   ?? null,
            })}
            className="w-full flex items-center gap-3 bg-white border border-gray-200 hover:border-[#0145F2] p-2 text-left transition-colors duration-150 cursor-pointer group"
          >
            <div className="w-11 h-11 bg-white shrink-0 overflow-hidden">
              <img src={product.img} alt="" className="w-full h-full object-contain" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-[#1e272e] leading-tight line-clamp-1">
                {product.brand} {product.title}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Dodaj za samo <strong className="text-[#0145F2] font-bold">{fmtKM(price)}</strong>
                {price < product.price && (
                  <span className="text-gray-400 line-through ml-1.5 font-normal">{fmtKM(product.price)}</span>
                )}
              </p>
            </div>
            <span className="w-7 h-7 shrink-0 flex items-center justify-center bg-[#edf1f5] text-[#0145F2] group-hover:bg-[#0145F2] group-hover:text-white transition-colors">
              <Plus size={14} weight="bold" />
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}
