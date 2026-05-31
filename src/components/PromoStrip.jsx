import { Truck, ShieldCheck, Star, Gift } from '@phosphor-icons/react'
import { useSiteContent } from '../hooks/useSiteContent'

const ICONS = [Truck, ShieldCheck, Star, Gift]

// Keys stored in site_content table (editable via admin /sadrzaj)
const KEYS = [
  'promo_1_title', 'promo_1_sub',
  'promo_2_title', 'promo_2_sub',
  'promo_3_title', 'promo_3_sub',
  'promo_4_title', 'promo_4_sub',
]

const DEFAULTS = {
  promo_1_title: 'Besplatna dostava',    promo_1_sub: 'Za narudžbe preko 100 KM',
  promo_2_title: '100% sigurna kupovina', promo_2_sub: 'SSL · originalni proizvodi',
  promo_3_title: 'Bodovi lojalnosti',    promo_3_sub: 'Za svaku kupovinu',
  promo_4_title: 'Poklon na izbor',      promo_4_sub: 'Pri svakoj narudžbi',
}

export default function PromoStrip() {
  const { data } = useSiteContent(KEYS, DEFAULTS)

  const items = [1, 2, 3, 4].map((n, i) => ({
    Icon:  ICONS[i],
    title: data[`promo_${n}_title`] || '',
    sub:   data[`promo_${n}_sub`]   || '',
  })).filter((item) => item.title)

  if (!items.length) return null

  return (
    <section className="border-y border-gray-200 bg-white">
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-200">
          {items.map(({ Icon, title, sub }) => (
            <div
              key={title}
              className="flex items-center gap-3.5 py-4 px-4 md:px-6 first:pl-0 last:pr-0"
            >
              <Icon size={20} weight="duotone" color="#0F2952" className="shrink-0 opacity-75" />
              <div>
                <p
                  className="text-[12px] font-bold text-[#0F2952] leading-tight"
                  style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}
                >
                  {title}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
