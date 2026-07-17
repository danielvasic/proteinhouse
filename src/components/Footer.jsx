import { Link } from 'react-router-dom'
import { InstagramLogo, FacebookLogo, YoutubeLogo, TiktokLogo } from '@phosphor-icons/react'
import Logo from './Logo'
import { useSiteContent } from '../hooks/useSiteContent'

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
      heading: 'INFORMACIJE',
      links: [
        { label: 'O nama',               to: '/o-nama' },
        { label: 'Kontakt',              to: '/kontakt' },
        { label: 'Politika privatnosti', to: '/privatnost' },
        { label: 'Politika povrata',     to: '/povrat' },
        { label: 'Pravila kolačića',     to: '/kolacici' },
      ],
    },
    {
      heading: 'NALOG',
      links: [
        { label: 'Prijava',           to: '/nalog' },
        { label: 'Registracija',      to: '/nalog/registracija' },
        { label: 'Moje narudžbe',     to: '/nalog/narudzbe' },
        { label: 'Bodovi lojalnosti', to: '/nalog/bodovi' },
        { label: 'Wishlist',          to: '/wishlist' },
      ],
    },
    {
      heading: 'PRODAVNICA',
      links: [
        { label: 'Praćenje pošiljke',  to: '/pracenje' },
        { label: 'Kako kupiti',        to: '/kako-kupiti' },
        { label: 'Dostava',            to: '/dostava' },
        { label: 'Dodatni popust',     to: '/popust' },
        { label: 'Pronađi prodavnicu', to: '/prodavnice' },
        { label: 'Pokloni',            to: '/pokloni' },
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

const FOOTER_KEYS     = ['footer_columns', 'footer_social', 'footer_description', 'footer_bottom_text']
const FOOTER_DEFAULTS = {
  footer_columns:     DEFAULT_COLUMNS,
  footer_social:      DEFAULT_SOCIAL,
  footer_description: 'Online protein i suplement shop u BiH. Originalni proizvodi, brza dostava, bodovi lojalnosti uz svaku kupovinu.',
  footer_bottom_text: '✓ PLAĆANJE POUZEĆEM',
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
      className="bg-[#0A1F42] text-white"
      style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}
    >
      <div className="container">
        <div className={`grid grid-cols-2 ${mdGridCls} gap-8 py-14 md:py-16`}>

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Logo onDark size="md" />
            {description && (
              <p className="mt-5 text-[13px] text-white/50 leading-relaxed">
                {description}
              </p>
            )}
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
                        : <span className="text-[10px] font-bold uppercase">{(network || '?').slice(0, 2)}</span>
                      }
                    </a>
                  )
                })}
              </div>
            )}
          </div>

          {/* Link columns */}
          {cols.map((col, ci) => (
            <div key={col.heading || ci}>
              {col.heading && (
                <h4 className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/35 mb-5">
                  {col.heading}
                </h4>
              )}
              <ul className="flex flex-col gap-3 list-none p-0 m-0">
                {(col.links ?? []).map((l, li) => (
                  <li key={l.label || li}>
                    {l.to?.startsWith('http') ? (
                      <a
                        href={l.to}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13px] text-white/55 hover:text-white transition-colors duration-150"
                      >
                        {l.label}
                      </a>
                    ) : (
                      <Link
                        to={l.to || '/'}
                        className="text-[13px] text-white/55 hover:text-white transition-colors duration-150"
                      >
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/8">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-2 py-5 pb-8 md:pb-10">
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
