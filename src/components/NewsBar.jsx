import { useEffect, useState } from 'react'
import { useSiteContent } from '../hooks/useSiteContent'
import { BODY } from '../lib/typography'

const DEFAULT_MESSAGES = [
  '100% sigurna kupovina',
  'Besplatna dostava za narudžbe preko 149 KM',
  // Vico: prag potrošnje, ne "kupi whey" — korpa 150+ KM → GW artikal gratis
  'Korpa 150+ KM → Gorilla Wear artikal po izboru gratis',
]

const ROTATE_MS = 8000
// Odlazeća poruka blijedi FADE_MS, dolazeća kreće tek nakon FADE_DELAY —
// bez toga su obje na pola tranzicije istovremeno poluvidljive i slova se
// na uskom ekranu umrse jedno preko drugog.
const FADE_MS    = 500
const FADE_DELAY = 450

/** Iz site_content: string (jedna poruka po redu) ili {items:[…]} */
function parseMessages(value) {
  if (typeof value === 'string') return value.split('\n')
  if (Array.isArray(value?.items)) return value.items
  if (Array.isArray(value)) return value
  return DEFAULT_MESSAGES
}

/**
 * Crni news bar na samom vrhu — rotira 3–4 poruke (Bulk stil).
 *
 * Tranzicija: poruke su naslagane u isti grid-red; odlazeća izblijedi, a
 * dolazeća se pojavi s malim zakašnjenjem — pa se tekstovi nikad ne
 * preklapaju čitljivo, a nema ni tvrdog reza (Notion: "treba biti
 * suptilnije"). Bez pomjeranja — samo fade.
 */
export default function NewsBar() {
  const { data } = useSiteContent(['news_bar_messages'], { news_bar_messages: DEFAULT_MESSAGES })
  const messages = parseMessages(data.news_bar_messages)
    .map((m) => (typeof m === 'string' ? m.trim() : ''))
    .filter(Boolean)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (messages.length < 2) return undefined
    const timer = setInterval(() => setIndex((i) => (i + 1) % messages.length), ROTATE_MS)
    return () => clearInterval(timer)
  }, [messages.length])

  if (messages.length === 0) return null

  const current = index % messages.length

  return (
    <div className="bg-black text-white overflow-hidden" role="status" aria-live="polite">
      {/* Sve poruke naslagane u isti grid-red; aktivna je vidljiva, ostale
          prozirne. Visina prati najvišu poruku pa se bar ne trza kad se
          duga i kratka poruka smjenjuju. */}
      <div className="container grid">
        {messages.map((msg, i) => (
          <p
            key={i}
            className={`[grid-area:1/1] py-2 m-0 text-center text-[11px] md:text-[12px] font-bold tracking-[0.14em] transition-opacity ease-in-out ${i === current ? 'opacity-100' : 'opacity-0'}`}
            style={{
              ...BODY,
              transitionDuration: `${FADE_MS}ms`,
              transitionDelay: i === current ? `${FADE_DELAY}ms` : '0ms',
            }}
            aria-hidden={i === current ? undefined : true}
          >
            {msg}
          </p>
        ))}
      </div>
    </div>
  )
}
