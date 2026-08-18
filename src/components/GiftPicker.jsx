import { useEffect, useMemo, useState } from 'react'
import { Gift, Check, Sparkle } from '@phosphor-icons/react'
import { supabase, getProductImageUrl } from '../lib/supabase'

const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']
const SHOE_SIZES     = ['38', '39', '40', '41', '42', '43', '44', '45', '46', '47']
const NO_SIZE_KEY    = '_'

/**
 * Izbor gratis poklona kad narudžba pređe prag kampanje.
 *
 * Kupac prvo označi svoje veličine (majica / obuća), pa mu se prikazuju SAMO
 * artikli koji su stvarno na stanju u tim veličinama — da ne izabere model
 * koji mu se sviđa i tek onda vidi da nema njegovog broja. Alternativa je
 * Mystery Gift: mi biramo artikal, u veličini koju je označio.
 *
 * onChange dobija null ili { gift_product_id, title, size, size_type, mystery,
 * clothing_size, shoe_size, campaign_id }.
 */
export default function GiftPicker({ subtotal, value, onChange }) {
  const [campaign, setCampaign] = useState(null)
  const [gifts,    setGifts]    = useState([])
  const [clothing, setClothing] = useState(value?.clothing_size ?? '')
  const [shoes,    setShoes]    = useState(value?.shoe_size ?? '')

  useEffect(() => {
    supabase
      .from('gift_campaigns')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .then(async ({ data }) => {
        const now = Date.now()
        const live = (data ?? []).find((c) =>
          (!c.starts_at || new Date(c.starts_at).getTime() <= now) &&
          (!c.ends_at   || new Date(c.ends_at).getTime()   >= now)
        )
        if (!live) return
        setCampaign(live)
        const { data: items } = await supabase
          .from('gift_products').select('*')
          .eq('campaign_id', live.id).eq('is_active', true)
          .order('sort_order')
        setGifts(items ?? [])
      })
  }, [])

  const eligible = campaign && subtotal >= Number(campaign.min_order_total)

  // Kad kupac padne ispod praga, poklon se automatski poništava
  useEffect(() => {
    if (!eligible && value) onChange(null)
  }, [eligible]) // eslint-disable-line react-hooks/exhaustive-deps

  /** Veličine koje se uopće nude — samo one gdje bar jedan artikal ima zalihu */
  const offered = useMemo(() => {
    const c = new Set(), s = new Set()
    for (const g of gifts) {
      for (const [size, qty] of Object.entries(g.stock_by_size ?? {})) {
        if (!(qty > 0)) continue
        if (g.size_type === 'clothing') c.add(size)
        if (g.size_type === 'shoes')    s.add(size)
      }
    }
    return {
      clothing: CLOTHING_SIZES.filter((x) => c.has(x)),
      shoes:    SHOE_SIZES.filter((x) => s.has(x)),
    }
  }, [gifts])

  /** Artikli dostupni u odabranim veličinama */
  const available = useMemo(() => gifts
    .map((g) => {
      const size = g.size_type === 'clothing' ? clothing
                 : g.size_type === 'shoes'    ? shoes
                 : NO_SIZE_KEY
      if (!size) return null
      return (g.stock_by_size?.[size] ?? 0) > 0 ? { gift: g, size } : null
    })
    .filter(Boolean), [gifts, clothing, shoes])

  if (!campaign || gifts.length === 0) return null

  const missing = Number(campaign.min_order_total) - subtotal

  if (!eligible) {
    return (
      <div className="border border-dashed border-[#0145F2]/40 bg-[#edf1f5] p-5 flex items-center gap-3">
        <Gift size={22} weight="duotone" className="text-[#0145F2] shrink-0" />
        <p className="text-[12px] text-gray-600">
          Još <strong className="text-[#1e272e]">{missing.toFixed(2)} KM</strong> do besplatnog poklona
          {campaign.headline ? ` — ${campaign.headline.toLowerCase()}` : ''}.
        </p>
      </div>
    )
  }

  const pick = (patch) => onChange({
    campaign_id: campaign.id,
    clothing_size: clothing || null,
    shoe_size: shoes || null,
    ...patch,
  })

  const isSelected = (giftId) => value?.gift_product_id === giftId
  const mysterySelected = value?.mystery === true

  return (
    <div className="border-2 border-[#0145F2] bg-white p-6 space-y-5">
      <div className="flex items-start gap-3">
        <Gift size={22} weight="duotone" className="text-[#0145F2] shrink-0 mt-0.5" />
        <div>
          <h3 className="text-[13px] font-bold text-[#1e272e] tracking-wide">
            {campaign.headline || 'Odaberi svoj besplatni poklon'}
          </h3>
          {campaign.subtitle && <p className="text-[12px] text-gray-500 mt-1">{campaign.subtitle}</p>}
        </div>
      </div>

      {/* 1. Veličine */}
      <div className="space-y-3">
        {offered.clothing.length > 0 && (
          <div>
            <p className="text-[10px] font-bold tracking-[0.14em] text-gray-500 mb-2">Veličina odjeće</p>
            <div className="flex flex-wrap gap-2">
              {offered.clothing.map((s) => (
                <button
                  key={s} type="button"
                  onClick={() => { setClothing(s === clothing ? '' : s); onChange(null) }}
                  className={`min-w-[46px] px-3 py-2 text-[12px] font-bold border transition-colors cursor-pointer ${
                    clothing === s ? 'border-[#0145F2] bg-[#0145F2] text-white' : 'border-gray-300 text-[#1e272e] hover:border-[#0145F2]'
                  }`}
                >{s}</button>
              ))}
            </div>
          </div>
        )}
        {offered.shoes.length > 0 && (
          <div>
            <p className="text-[10px] font-bold tracking-[0.14em] text-gray-500 mb-2">Broj obuće</p>
            <div className="flex flex-wrap gap-2">
              {offered.shoes.map((s) => (
                <button
                  key={s} type="button"
                  onClick={() => { setShoes(s === shoes ? '' : s); onChange(null) }}
                  className={`min-w-[46px] px-3 py-2 text-[12px] font-bold border transition-colors cursor-pointer ${
                    shoes === s ? 'border-[#0145F2] bg-[#0145F2] text-white' : 'border-gray-300 text-[#1e272e] hover:border-[#0145F2]'
                  }`}
                >{s}</button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Artikli u toj veličini */}
      {!clothing && !shoes ? (
        <p className="text-[12px] text-gray-400">Označi svoju veličinu da vidiš koji su pokloni dostupni.</p>
      ) : available.length === 0 ? (
        <p className="text-[12px] text-amber-600">
          Nažalost trenutno nemamo poklon u toj veličini. Probaj drugu veličinu ili odaberi {campaign.mystery_label}.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {available.map(({ gift, size }) => (
            <button
              key={gift.id} type="button"
              onClick={() => pick({
                gift_product_id: gift.id,
                title: `${gift.brand ? gift.brand + ' ' : ''}${gift.title}`,
                size, size_type: gift.size_type, mystery: false,
              })}
              className={`relative border p-2 text-left transition-colors cursor-pointer ${
                isSelected(gift.id) ? 'border-[#0145F2] ring-1 ring-[#0145F2]' : 'border-gray-200 hover:border-[#0145F2]'
              }`}
            >
              {isSelected(gift.id) && (
                <span className="absolute top-1.5 right-1.5 w-5 h-5 bg-[#0145F2] flex items-center justify-center">
                  <Check size={12} weight="bold" color="white" />
                </span>
              )}
              <div className="aspect-square bg-[#edf1f5] mb-2 overflow-hidden">
                {(gift.image_path || gift.image_url)
                  ? <img src={getProductImageUrl(gift)} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center"><Gift size={24} className="text-gray-300" /></div>}
              </div>
              {gift.brand && <p className="text-[9px] font-bold tracking-[0.1em] text-gray-400">{gift.brand}</p>}
              <p className="text-[11px] font-semibold text-[#1e272e] leading-tight line-clamp-2">{gift.title}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Veličina {size === NO_SIZE_KEY ? '—' : size}</p>
            </button>
          ))}
        </div>
      )}

      {/* 3. Mystery Gift */}
      {campaign.allow_mystery && (
        <button
          type="button"
          disabled={!clothing && !shoes}
          onClick={() => pick({ gift_product_id: null, title: campaign.mystery_label, size: null, size_type: null, mystery: true })}
          className={`w-full flex items-center gap-3 border p-4 text-left transition-colors ${
            mysterySelected ? 'border-[#0145F2] ring-1 ring-[#0145F2] bg-[#edf1f5]' : 'border-gray-200 hover:border-[#0145F2]'
          } disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer`}
        >
          <Sparkle size={20} weight="duotone" className="text-[#0145F2] shrink-0" />
          <div className="flex-1">
            <p className="text-[12px] font-bold text-[#1e272e]">{campaign.mystery_label}</p>
            <p className="text-[11px] text-gray-500">
              {campaign.mystery_description || 'Prepusti izbor nama — poslat ćemo ti iznenađenje u tvojoj veličini.'}
            </p>
          </div>
          {mysterySelected && (
            <span className="w-5 h-5 bg-[#0145F2] flex items-center justify-center shrink-0">
              <Check size={12} weight="bold" color="white" />
            </span>
          )}
        </button>
      )}

      {value && (
        <div className="flex items-center justify-between border-t border-gray-200 pt-3">
          <p className="text-[12px] text-gray-600">
            Odabrani poklon: <strong className="text-[#1e272e]">{value.title}</strong>
            {value.size && ` · ${value.size}`}
          </p>
          <button
            type="button" onClick={() => onChange(null)}
            className="text-[11px] text-gray-400 hover:text-[#0145F2] underline cursor-pointer bg-transparent border-0 p-0"
          >
            Poništi
          </button>
        </div>
      )}
    </div>
  )
}
