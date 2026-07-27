import { useEffect, useState } from 'react'
import { useSiteContent } from '../hooks/useSiteContent'

const DEFAULT_MESSAGES = [
  'BESPLATNA DOSTAVA ZA NARUDŽBE PREKO 100 KM',
  '100% SIGURNA KUPOVINA',
  'KUPI WHEY OD 150 KM → GORILLA CIPELE (250 KM) BESPLATNO',
]

const ROTATE_MS = 8000

/** Iz site_content: string (jedna poruka po redu) ili {items:[…]} */
function parseMessages(value) {
  if (typeof value === 'string') return value.split('\n')
  if (Array.isArray(value?.items)) return value.items
  if (Array.isArray(value)) return value
  return DEFAULT_MESSAGES
}

/** Crni news bar na samom vrhu — rotira 3–4 poruke (Bulk stil). */
export default function NewsBar() {
  const { data } = useSiteContent(['news_bar_messages'], { news_bar_messages: DEFAULT_MESSAGES })
  const messages = parseMessages(data.news_bar_messages)
    .map((m) => (typeof m === 'string' ? m.trim() : ''))
    .filter(Boolean)
  const [index,   setIndex]   = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    if (messages.length < 2) return undefined
    const timer = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setIndex((i) => (i + 1) % messages.length)
        setVisible(true)
      }, 250)
    }, ROTATE_MS)
    return () => clearInterval(timer)
  }, [messages.length])

  if (messages.length === 0) return null

  return (
    <div className="bg-black text-white" role="status" aria-live="polite">
      <div className="container">
        <p
          className={`py-2 m-0 text-center text-[10px] md:text-[11px] font-bold tracking-[0.14em] uppercase transition-opacity duration-250 ${visible ? 'opacity-100' : 'opacity-0'}`}
          style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          {messages[index % messages.length]}
        </p>
      </div>
    </div>
  )
}
