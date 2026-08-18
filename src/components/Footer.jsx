import { useState } from 'react'
import { Link } from 'react-router-dom'
import { InstagramLogo, FacebookLogo, YoutubeLogo, TiktokLogo, Phone, Envelope, MapPin, Clock, CaretDown } from '@phosphor-icons/react'
import Logo from './Logo'
import { useSiteContent } from '../hooks/useSiteContent'
import { BODY } from '../lib/typography'

/** Kolona linkova — na mobilnom collapsable (accordion), na desktopu uvijek otvorena */
function FooterColumn({ col }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="col-span-2 md:col-span-1 border-b border-white/10 md:border-0 pb-4 md:pb-0">
      <button
        type="button"
        className="w-full flex items-center justify-between bg-transparent border-0 p-0 cursor-pointer md:cursor-default text-left"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <h4 className="text-[10px] font-bold tracking-[0.2em] text-white/35 m-0 md:mb-5">
          {col.heading}
        </h4>
        <CaretDown
          size={14}
          className={`md:hidden text-white/40 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      <ul className={`${open ? 'flex' : 'hidden'} md:flex flex-col gap-3 list-none p-0 m-0 mt-4 md:mt-0`}>
        {(col.links ?? []).map((l, li) => (
          <li key={l.label || li}>
            {l.to?.startsWith('http') ? (
              <a href={l.to} target="_blank" rel="noopener noreferrer"
                 className="text-[13px] text-white/55 hover:text-white transition-colors duration-150">
                {l.label}
              </a>
            ) : (
              <Link to={l.to || '/'} className="text-[13px] text-white/55 hover:text-white transition-colors duration-150">
                {l.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

// Icon map for social networks (key must match .network in DB)
const SOCIAL_ICONS = {
  instagram: InstagramLogo,
  facebook:  FacebookLogo,
  youtube:   YoutubeLogo,
  tiktok:    TiktokLogo,
}

// ── Fallback defaults (used when DB has no data yet) ──
const DEFAULT_COLUMNS = {
  columns: [
    {
      heading: 'Informacije',
      links: [
        { label: 'O nama',               to: '/o-nama' },
        { label: 'Kontakt',              to: '/kontakt' },
        { label: 'Blog',                 to: '/blog' },
        { label: 'Politika privatnosti', to: '/privatnost' },
        { label: 'Politika povrata',     to: '/povrat' },
      ],
    },
    {
      heading: 'Nalog',
      links: [
        { label: 'Prijava',       to: '/nalog' },
        { label: 'Registracija',  to: '/nalog/registracija' },
        { label: 'Moje narudžbe', to: '/nalog/narudzbe' },
      ],
    },
    {
      heading: 'Prodavnica',
      links: [
        { label: 'Praćenje pošiljke', to: '/pracenje' },
        { label: 'Dostava',           to: '/dostava' },
        { label: 'Kako kupiti',       to: '/kako-kupiti' },
        { label: 'Novosti i akcije',  to: '/novosti' },
      ],
    },
  ],
}

const DEFAULT_SOCIAL = {
  links: [
    { network: 'instagram', href: 'https://instagram.com' },
    { network: 'facebook',  href: 'https://facebook.com' },
    { network: 'youtube',   href: 'https://youtube.com' },
    { network: 'tiktok',    href: 'https://tiktok.com' },
  ],
}

const FOOTER_KEYS     = [
  'footer_columns', 'footer_social', 'footer_description', 'footer_bottom_text',
  'contact_phone', 'contact_email', 'contact_hours', 'contact_address',
]
const FOOTER_DEFAULTS = {
  footer_columns:     DEFAULT_COLUMNS,
  footer_social:      DEFAULT_SOCIAL,
  footer_description: 'Potpora za vaš fitness cilj i kvalitetni suplementi za svaki korak vašeg aktivnog života.',
  footer_bottom_text: '✓ PLAĆANJE POUZEĆEM',
  contact_phone:      '065/091-094',
  contact_email:      'podrska@proteinhouse.ba',
  contact_hours:      'PON–SUB 9:00–21:00',
  contact_address:    'Kardinala Stepinca bb (Mepas Mall), Mostar',
}

// Dynamic md: grid class based on number of columns (brand col + link cols)
const MD_GRID = ['', '', 'md:grid-cols-2', 'md:grid-cols-3', 'md:grid-cols-4', 'md:grid-cols-5']

export default function Footer() {
  const { data } = useSiteContent(FOOTER_KEYS, FOOTER_DEFAULTS)

  const cols        = data.footer_columns?.columns  ?? DEFAULT_COLUMNS.columns
  const socialLinks = data.footer_social?.links      ?? DEFAULT_SOCIAL.links
  const description = data.footer_description        ?? FOOTER_DEFAULTS.footer_description
  const bottomText  = data.footer_bottom_text        ?? FOOTER_DEFAULTS.footer_bottom_text

  // Total grid cols = 1 (brand) + link columns, capped at 5
  const numCols    = Math.max(2, Math.min(5, 1 + cols.length))
  const mdGridCls  = MD_GRID[numCols] ?? 'md:grid-cols-4'

  return (
    <footer
      className="bg-[#1e272e] text-white"
      style={BODY}
    >
      <div className="container">
        <div className={`grid grid-cols-2 ${mdGridCls} gap-x-10 gap-y-6 md:gap-y-10 py-10 md:py-16`}>

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Logo onDark size="md" />
            {description && (
              <p className="mt-5 text-[13px] text-white/50 leading-relaxed">
                {description}
              </p>
            )}

            {/* Kontakt info */}
            <ul className="flex flex-col gap-2.5 mt-6 list-none p-0 m-0 text-[13px] text-white/55">
              {data.contact_phone && (
                <li className="flex items-center gap-2.5">
                  <Phone size={15} weight="duotone" className="shrink-0 text-white/40" />
                  <a href={`tel:${String(data.contact_phone).replace(/[^\d+]/g, '')}`} className="hover:text-white transition-colors">{data.contact_phone}</a>
                </li>
              )}
              {data.contact_email && (
                <li className="flex items-center gap-2.5">
                  <Envelope size={15} weight="duotone" className="shrink-0 text-white/40" />
                  <a href={`mailto:${data.contact_email}`} className="hover:text-white transition-colors">{data.contact_email}</a>
                </li>
              )}
              {data.contact_address && (
                <li className="flex items-start gap-2.5">
                  <MapPin size={15} weight="duotone" className="shrink-0 text-white/40 mt-0.5" />
                  <span>{data.contact_address}</span>
                </li>
              )}
              {data.contact_hours && (
                <li className="flex items-center gap-2.5">
                  <Clock size={15} weight="duotone" className="shrink-0 text-white/40" />
                  <span>{data.contact_hours}</span>
                </li>
              )}
            </ul>
            {socialLinks.length > 0 && (
              <div className="flex gap-2 mt-5">
                {socialLinks.map(({ network, href, label }) => {
                  const Icon = SOCIAL_ICONS[network?.toLowerCase()]
                  const displayLabel = label || (network ? network.charAt(0).toUpperCase() + network.slice(1) : 'Link')
                  return (
                    <a
                      key={network || href}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-9 h-9 flex items-center justify-center border border-white/15 text-white/50 hover:border-white/50 hover:text-white transition-all duration-150"
                      aria-label={displayLabel}
                    >
                      {Icon
                        ? <Icon size={17} weight="fill" />
                        : <span className="text-[10px] font-bold">{(network || '?').slice(0, 2)}</span>
                      }
                    </a>
                  )
                })}
              </div>
            )}
          </div>

          {/* Link columns — na mobilnom accordion */}
          {cols.map((col, ci) => <FooterColumn key={col.heading || ci} col={col} />)}

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/8">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-2 py-5 pb-8">
          <span className="text-[11px] text-white/30">
            © {new Date().getFullYear()} ProteinHouse d.o.o. Sva prava zadržana.
          </span>
          {bottomText && (
            <span className="text-[11px] font-bold tracking-[0.1em] text-white/40">
              {bottomText}
            </span>
          )}
        </div>
      </div>
    </footer>
  )
}
