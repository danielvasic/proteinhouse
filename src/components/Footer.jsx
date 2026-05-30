import { Link } from 'react-router-dom'
import { InstagramLogo, FacebookLogo, YoutubeLogo, TiktokLogo } from '@phosphor-icons/react'
import Logo from './Logo'
import styles from './Footer.module.css'

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
    <footer className={styles.footer}>
      <div className={`container ${styles.grid}`}>
        {/* Brand column */}
        <div>
          <Logo onDark size="md" />
          <p className={styles.blurb}>
            Vaš najbolji online protein i suplement shop u BiH. Originalni proizvodi,
            brza dostava i bodovi lojalnosti uz svaku kupovinu.
          </p>
          <div className={styles.social}>
            {SOCIAL.map(({ Icon, label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialBtn}
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
            <h4 className={styles.colHeading}>{col.heading}</h4>
            <ul className={styles.colList}>
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className={styles.colLink}>{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className={styles.bottomBar}>
        <div className={`container ${styles.bottomInner}`}>
          <span className={styles.copyright}>
            © {new Date().getFullYear()} ProteinHouse. Sva prava zadržana.
          </span>
          <div className={styles.payments}>
            <span className={styles.cod}>✓ PLAĆANJE POUZEĆEM</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
