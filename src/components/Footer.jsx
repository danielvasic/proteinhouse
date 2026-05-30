import { Link } from 'react-router-dom'
import { InstagramLogo, FacebookLogo, YoutubeLogo, TiktokLogo } from '@phosphor-icons/react'
import Logo from './Logo'

const COLS = [
  {
    heading: 'INFORMACIJE',
    links: [
      { label: 'O nama', to: '/o-nama' },
      { label: 'Kontakt', to: '/kontakt' },
      { label: 'Politika privatnosti', to: '/privatnost' },
      { label: 'Politika povrata', to: '/povrat' },
      { label: 'Pravila kolačića', to: '/kolacici' },
    ],
  },
  {
    heading: 'NALOG',
    links: [
      { label: 'Prijava', to: '/nalog' },
      { label: 'Registracija', to: '/nalog/registracija' },
      { label: 'Moje narudžbe', to: '/nalog/narudzbe' },
      { label: 'Bodovi lojalnosti', to: '/nalog/bodovi' },
      { label: 'Wishlist', to: '/wishlist' },
    ],
  },
  {
    heading: 'PRODAVNICA',
    links: [
      { label: 'Kako kupiti', to: '/kako-kupiti' },
      { label: 'Dostava', to: '/dostava' },
      { label: 'Dodatni popust', to: '/popust' },
      { label: 'Pronađi prodavnicu', to: '/prodavnice' },
      { label: 'Pokloni', to: '/pokloni' },
    ],
  },
]

const SOCIAL = [
  { Icon: InstagramLogo, label: 'Instagram', href: 'https://instagram.com' },
  { Icon: FacebookLogo, label: 'Facebook', href: 'https://facebook.com' },
  { Icon: YoutubeLogo, label: 'YouTube', href: 'https://youtube.com' },
  { Icon: TiktokLogo, label: 'TikTok', href: 'https://tiktok.com' },
]

export default function Footer() {
  return (
    <footer className="bg-[#0A1F42] text-white" style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}>
      <div className="container">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 md:py-14">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Logo onDark size="md" />
            <p className="mt-4 text-[13px] text-white/60 leading-relaxed">
              Vaš najbolji online protein i suplement shop u BiH. Originalni proizvodi,
              brza dostava i bodovi lojalnosti uz svaku kupovinu.
            </p>
            <div className="flex gap-2 mt-5">
              {SOCIAL.map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10 hover:bg-[#2563EB] text-white/70 hover:text-white transition-colors duration-150"
                  aria-label={label}
                >
                  <Icon size={18} weight="fill" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {COLS.map((col) => (
            <div key={col.heading}>
              <h4
                className="text-[11px] font-bold tracking-[0.14em] uppercase text-white/40 mb-4"
                style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}
              >
                {col.heading}
              </h4>
              <ul className="flex flex-col gap-2.5 list-none p-0 m-0">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      to={l.to}
                      className="text-[13px] text-white/65 hover:text-white transition-colors duration-150"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-2 py-4">
          <span className="text-[11px] text-white/40">
            © {new Date().getFullYear()} ProteinHouse. Sva prava zadržana.
          </span>
          <span className="text-[11px] font-bold tracking-[0.08em] text-[#60A5FA]">
            ✓ PLAĆANJE POUZEĆEM
          </span>
        </div>
      </div>
    </footer>
  )
}
