import { useNavigate } from 'react-router-dom'
import { Scales, Barbell, Drop, Lightning, Sparkle, Leaf, Tag } from '@phosphor-icons/react'
import { useSiteContent } from '../hooks/useSiteContent'

// Standardne ikonice po pojmu (placeholder dok se ne kupi Adobe Stock gym set)
const ICONS = {
  'mršanje':          Scales,
  'izgradnja mišića': Barbell,
  'whey':             Drop,
  'kreatin':          Lightning,
  'izolat':           Sparkle,
  'vitamini':         Leaf,
}

const DEFAULTS = {
  quick_categories: {
    items: [
      { label: 'Mršanje',          to: '/kategorija/kontrola' },
      { label: 'Izgradnja mišića', to: '/kategorija/proteini' },
      { label: 'Whey',             to: '/pretraga?q=whey' },
      { label: 'Kreatin',          to: '/pretraga?q=kreatin' },
      { label: 'Izolat',           to: '/pretraga?q=izolat' },
      { label: 'Vitamini',         to: '/kategorija/vitamini' },
    ],
  },
}

/** Horizontalni scroll bar kategorija ispod hero banera (Bulk stil). */
export default function QuickCategories() {
  const navigate = useNavigate()
  const { data } = useSiteContent(['quick_categories'], DEFAULTS)
  const items = (data.quick_categories?.items ?? DEFAULTS.quick_categories.items)
    .filter((i) => i?.label && i?.to)

  if (items.length === 0) return null

  return (
    <section className="bg-white border-b border-gray-200" style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}>
      <div className="container">
        <div className="flex gap-2 py-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((item) => {
            const Icon = ICONS[item.label.toLowerCase()] || Tag
            return (
              <button
                key={item.label}
                className="shrink-0 flex items-center gap-2 px-4 py-2 border border-gray-300 bg-white text-[11px] font-bold tracking-[0.08em] uppercase text-[#0F2952] hover:bg-[#0F2952] hover:border-[#0F2952] hover:text-white transition-all duration-150 cursor-pointer whitespace-nowrap"
                onClick={() => navigate(item.to)}
              >
                <Icon size={14} weight="duotone" /> {item.label}
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
