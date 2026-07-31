import { useNavigate } from 'react-router-dom'
import { useSiteContent } from '../hooks/useSiteContent'
import { BODY, DISPLAY } from '../lib/typography'

const DEFAULTS = {
  goals_items: {
    items: [
      { label: 'Mršavljenje',      to: '/kategorija/mrsavljenje' },
      { label: 'Izgradnja mišića', to: '/kategorija/proteini' },
      { label: 'Energija i fokus', to: '/kategorija/pre-workout' },
      { label: 'Zdravlje',         to: '/kategorija/vitamini' },
    ],
  },
  // Slavenove ilustracije ciljeva (public/goals/, optimizovane) —
  // zamjenjive u Admin → Sadržaj → Kupovina po ciljevima
  goals_img_1: '/goals/mrsavljenje.jpg',
  goals_img_2: '/goals/izgradnja-misica.jpg',
  goals_img_3: '/goals/energija.jpg',
  goals_img_4: '/goals/zdravlje.jpg',
}

/**
 * „Kupovina po ciljevima“ — naslov iznad, pa 4 velike foto-pločice
 * od ruba do ruba ekrana (bez razmaka), naslov cilja preko slike.
 */
export default function GoalsSection() {
  const navigate = useNavigate()
  const { data } = useSiteContent(
    ['goals_items', 'goals_img_1', 'goals_img_2', 'goals_img_3', 'goals_img_4'],
    DEFAULTS
  )
  const items = (data.goals_items?.items ?? DEFAULTS.goals_items.items)
    .filter((i) => i?.label && i?.to)
    .slice(0, 4)

  if (items.length === 0) return null

  return (
    <section className="bg-[#1e272e]" style={BODY}>
      {/* Naslov iznad pločica */}
      <div className="container py-7 md:py-9">
        <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-white/50 mb-1.5 m-0">Pronađi svoje</p>
        <h2
          className="text-2xl md:text-3xl font-bold text-white uppercase m-0"
          style={DISPLAY}
        >
          Kupovina po ciljevima
        </h2>
      </div>

      {/* Pločice — full-bleed, bez razmaka: 2×2 na mobilnom, 4 u redu na desktopu */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-0 w-full">
        {items.map((item, i) => (
          <button
            key={item.label}
            className="group relative aspect-[3/4] md:aspect-auto md:h-[380px] xl:h-[420px] overflow-hidden border-0 p-0 cursor-pointer bg-[#1e272e]"
            onClick={() => navigate(item.to)}
            aria-label={item.label}
          >
            {/* Slika: default zatamnjena i lagano zumirana → na hover se posvijetli i odzumira */}
            <div
              className="absolute inset-0 bg-cover bg-center scale-110 transition-transform duration-500 group-hover:scale-100"
              style={{ backgroundImage: `url('${item.image || data[`goals_img_${i + 1}`] || DEFAULTS[`goals_img_${i + 1}`]}')` }}
            />
            <div className="absolute inset-0 bg-[#1e272e]/30 transition-colors duration-300 group-hover:bg-[#1e272e]/5" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1e272e]/85 via-[#1e272e]/15 to-transparent" />
            <span
              className="absolute bottom-4 left-4 md:bottom-5 md:left-5 text-white text-[17px] md:text-[21px] font-bold uppercase tracking-[0.02em] text-left leading-tight"
              style={DISPLAY}
            >
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}
