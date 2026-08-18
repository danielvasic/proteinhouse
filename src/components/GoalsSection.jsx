import { useNavigate } from 'react-router-dom'
import { ArrowRight } from '@phosphor-icons/react'
import { useSiteContent } from '../hooks/useSiteContent'
import { useParallax } from '../lib/useParallax'
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
  // Na sve četiri fotografije lik stoji desno od sredine, a pločice su uske i
  // visoke pa "center" odreže upravo njega. Ovo vraća lik u kadar.
  goals_focus_1: '85% 50%',
  goals_focus_2: '100% 50%',
  goals_focus_3: '100% 50%',
  goals_focus_4: '100% 50%',
}

/**
 * Koliko piksela smije parallax pomjeriti sloj. Zoom (scale-110 → 105 na hover)
 * ostavlja bar 2,5% viška sa svake strane; na najnižoj pločici (mobilni, ~250px)
 * to je oko 6px, pa je toliko i granica.
 */
const PARALLAX_PX = 6

/**
 * Fokus kadra po pločici. Pločice su uske i visoke pa bg-cover reže po širini —
 * ako je subjekt na fotografiji izmaknut, "center" ga izbaci iz kadra.
 * Podesivo u Admin → Sadržaj → Kupovina po ciljevima (npr. "30% 50%", "top").
 */
const DEFAULT_FOCUS = 'center'

function GoalTile({ item, image, focus, onClick }) {
  // Parallax ide na vanjski sloj, a zoom/hover na unutrašnji — inline transform
  // iz hooka bi inače pregazio Tailwindov scale.
  //
  // Sloj je NAMJERNO tačno velik kao pločica: kad je bio viši (-inset-y),
  // bg-cover je sliku skalirao da pokrije veću visinu pa ju je jače rezao po
  // širini i subjekti su bježali iz kadra. Višak za pomak daje zoom (scale),
  // a pomak je ograničen na PARALLAX_PX da nikad ne otkrije rub.
  const parallaxRef = useParallax(0.12, PARALLAX_PX)

  return (
    <button
      className="group relative aspect-[3/4] md:aspect-auto md:h-[380px] xl:h-[420px] overflow-hidden border-0 p-0 cursor-pointer bg-[#1e272e]"
      onClick={onClick}
      aria-label={item.label}
    >
      <div ref={parallaxRef} className="absolute inset-0 will-change-transform">
        <div
          className="absolute inset-0 bg-cover scale-110 transition-transform duration-500 group-hover:scale-105"
          style={{ backgroundImage: `url('${image}')`, backgroundPosition: focus }}
        />
      </div>

      <div className="absolute inset-0 bg-[#1e272e]/35 transition-colors duration-300 group-hover:bg-[#1e272e]/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#1e272e]/90 via-[#1e272e]/20 to-transparent" />

      <span className="absolute bottom-4 left-4 right-4 md:bottom-5 md:left-5 md:right-5 flex items-end justify-between gap-2 text-left">
        <span
          className="text-white text-[17px] md:text-[21px] font-bold tracking-[0.02em] leading-tight transition-transform duration-300 group-hover:-translate-y-1"
          style={DISPLAY}
        >
          {item.label}
        </span>
        <ArrowRight
          size={18}
          weight="bold"
          className="text-white shrink-0 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0"
        />
      </span>

      {/* Cyan Neon crta koja izleti na hover — brand book je drži za suptilne akcente */}
      <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#00cec9] scale-x-0 origin-left transition-transform duration-300 group-hover:scale-x-100" />
    </button>
  )
}

/**
 * „Kupovina po ciljevima“ — naslov iznad, pa 4 velike foto-pločice
 * od ruba do ruba ekrana (bez razmaka), naslov cilja preko slike.
 */
export default function GoalsSection() {
  const navigate = useNavigate()
  const { data } = useSiteContent(
    ['goals_items', 'goals_img_1', 'goals_img_2', 'goals_img_3', 'goals_img_4',
     'goals_focus_1', 'goals_focus_2', 'goals_focus_3', 'goals_focus_4'],
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
        <div className="flex items-center gap-3 mb-1.5">
          <span className="h-[2px] w-10 bg-[#00cec9]" />
          <p className="text-[10px] font-bold tracking-[0.22em] text-white/50 m-0">Pronađi svoje</p>
        </div>
        <h2
          className="text-2xl md:text-3xl font-bold text-white m-0 uppercase"
          style={DISPLAY}
        >
          Kupovina po ciljevima
        </h2>
      </div>

      {/* Pločice — full-bleed, bez razmaka: 2×2 na mobilnom, 4 u redu na desktopu */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-0 w-full">
        {items.map((item, i) => (
          <GoalTile
            key={item.label}
            item={item}
            image={item.image || data[`goals_img_${i + 1}`] || DEFAULTS[`goals_img_${i + 1}`]}
            focus={item.focus || data[`goals_focus_${i + 1}`] || DEFAULT_FOCUS}
            onClick={() => navigate(item.to)}
          />
        ))}
      </div>
    </section>
  )
}
