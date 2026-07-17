import { useNavigate } from 'react-router-dom'
import { ArrowRight, Scales, Barbell, Lightning, Heartbeat } from '@phosphor-icons/react'
import { useSiteContent } from '../hooks/useSiteContent'

const ICONS = [Scales, Barbell, Lightning, Heartbeat]

const DEFAULTS = {
  goals_items: {
    items: [
      { label: 'Mršanje',          sub: 'Sagorijevanje i kontrola težine', to: '/kategorija/kontrola' },
      { label: 'Izgradnja mišića', sub: 'Proteini, kreatin i gaineri',     to: '/kategorija/proteini' },
      { label: 'Energija i fokus', sub: 'Pre-workout i stimulansi',        to: '/kategorija/performanse' },
      { label: 'Zdravlje',         sub: 'Vitamini, minerali i omega',      to: '/kategorija/vitamini' },
    ],
  },
}

/** „Kupovina po ciljevima“ — sekcija između proizvoda da razbije monotoniju. */
export default function GoalsSection() {
  const navigate = useNavigate()
  const { data } = useSiteContent(['goals_items'], DEFAULTS)
  const items = (data.goals_items?.items ?? DEFAULTS.goals_items.items)
    .filter((i) => i?.label && i?.to)

  if (items.length === 0) return null

  return (
    <section className="py-10 md:py-14 bg-[#0A1F42]" style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}>
      <div className="container">
        <div className="flex items-end justify-between mb-6 md:mb-8">
          <div>
            <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-white/40 mb-1.5 m-0">Pronađi svoje</p>
            <h2
              className="text-2xl md:text-3xl font-bold text-white uppercase m-0"
              style={{ fontFamily: 'Oswald, Impact, system-ui, sans-serif' }}
            >
              Kupovina po ciljevima
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {items.map((item, i) => {
            const Icon = ICONS[i % ICONS.length]
            return (
              <button
                key={item.label}
                className="group flex flex-col items-start gap-3 p-5 md:p-6 bg-white/[0.06] border border-white/10 text-left cursor-pointer hover:bg-white hover:border-white transition-all duration-200"
                onClick={() => navigate(item.to)}
              >
                <Icon size={26} weight="duotone" className="text-white/70 group-hover:text-[#0F2952] transition-colors" />
                <div>
                  <p className="text-[13px] md:text-[14px] font-bold text-white group-hover:text-[#0F2952] uppercase tracking-[0.04em] m-0 transition-colors">
                    {item.label}
                  </p>
                  {item.sub && (
                    <p className="text-[11px] text-white/45 group-hover:text-gray-500 mt-1 m-0 leading-snug transition-colors">
                      {item.sub}
                    </p>
                  )}
                </div>
                <span className="flex items-center gap-1.5 mt-auto text-[10px] font-bold tracking-[0.12em] uppercase text-white/40 group-hover:text-[#0F2952] transition-colors">
                  Istraži <ArrowRight size={11} weight="bold" />
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </section>
  )
}
