import { useNavigate } from 'react-router-dom'
import { ArrowRight } from '@phosphor-icons/react'
import { useSiteContent } from '../hooks/useSiteContent'
import { useParallax } from '../lib/useParallax'
import BrandIcon from './BrandIcon'
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

/** Brend ikona po cilju — po redoslijedu, s pokrićem po nazivu ako se pločice preslože. */
const ICON_BY_INDEX = ['vaga', 'bicep', 'energija-ciklus', 'suplement-imunitet']
const ICON_BY_LABEL = {
  'mršavljenje':       'vaga',
  'mršanje':           'vaga',
  'izgradnja mišića':  'bicep',
  'energija i fokus':  'energija-ciklus',
  'zdravlje':          'suplement-imunitet',
  'imunitet':          'suplement-imunitet',
}

function GoalTile({ item, image, icon, onClick }) {
  // Parallax ide na vanjski sloj, a zoom/hover na unutrašnji — inline transform
  // iz hooka bi inače pregazio Tailwindov scale.
  const parallaxRef = useParallax(0.12)

  return (
    <button
      className="group relative aspect-[3/4] md:aspect-auto md:h-[380px] xl:h-[420px] overflow-hidden border-0 p-0 cursor-pointer bg-[#1e272e]"
      onClick={onClick}
      aria-label={item.label}
    >
      {/* Sloj je namjerno viši od pločice da pomak ne otkrije rubove */}
      <div ref={parallaxRef} className="absolute -inset-y-[12%] inset-x-0 will-change-transform">
        <div
          className="absolute inset-0 bg-cover bg-center scale-110 transition-transform duration-500 group-hover:scale-100"
          style={{ backgroundImage: `url('${image}')` }}
        />
      </div>

      <div className="absolute inset-0 bg-[#1e272e]/35 transition-colors duration-300 group-hover:bg-[#1e272e]/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#1e272e]/90 via-[#1e272e]/20 to-transparent" />

      {/* Brend ikona u bijelom kvadratu — čitljiva i na svijetlim fotografijama */}
      <span className="absolute top-4 left-4 md:top-5 md:left-5 w-9 h-9 bg-white flex items-center justify-center">
        <BrandIcon name={icon} size={22} />
      </span>

      <span className="absolute bottom-4 left-4 right-4 md:bottom-5 md:left-5 md:right-5 flex items-end justify-between gap-2 text-left">
        <span
          className="text-white text-[17px] md:text-[21px] font-bold uppercase tracking-[0.02em] leading-tight transition-transform duration-300 group-hover:-translate-y-1"
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
        <div className="flex items-center gap-3 mb-1.5">
          <span className="h-[2px] w-10 bg-[#00cec9]" />
          <p className="text-[10px] font-bold tracking-[0.22em] uppercase text-white/50 m-0">Pronađi svoje</p>
        </div>
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
          <GoalTile
            key={item.label}
            item={item}
            image={item.image || data[`goals_img_${i + 1}`] || DEFAULTS[`goals_img_${i + 1}`]}
            icon={item.icon || ICON_BY_LABEL[item.label.toLowerCase()] || ICON_BY_INDEX[i]}
            onClick={() => navigate(item.to)}
          />
        ))}
      </div>
    </section>
  )
}
