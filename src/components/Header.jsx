import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Phone, Envelope, Clock, Truck, MagnifyingGlass, User, Heart,
  ShoppingBag, Storefront, Barbell, Target, Newspaper, Info, MapPin,
  CaretDown, CaretRight, Flask, Lightning, Leaf, Scales, BowlFood,
  Stack, Tag, List, X,
} from '@phosphor-icons/react'
import Logo from './Logo'
import { useCart } from '../store/CartContext'
import { categories } from '../data/catalog'
import styles from './Header.module.css'

const CAT_ICONS = {
  proteini:   Flask,
  performanse: Lightning,
  vitamini:   Leaf,
  kontrola:   Scales,
  hrana:      BowlFood,
  oprema:     Barbell,
  gaineri:    Stack,
  akcija:     Tag,
}

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const { totalItems, openDrawer } = useCart()
  const [shopOpen, setShopOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchVal, setSearchVal] = useState('')
  const closeTimer = useRef(null)

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const openMenu = () => {
    clearTimeout(closeTimer.current)
    setShopOpen(true)
  }
  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setShopOpen(false), 120)
  }

  useEffect(() => () => clearTimeout(closeTimer.current), [])

  const navItems = [
    { key: 'shop', icon: Storefront, label: 'SHOP', hasMenu: true, to: '/' },
    { key: 'sportovi', icon: Barbell, label: 'SPORTOVI', to: '/kategorija/performanse' },
    { key: 'ciljevi', icon: Target, label: 'CILJEVI', to: '/kategorija/kontrola' },
    { key: 'blog', icon: Newspaper, label: 'BLOG', to: '/blog' },
    { key: 'o-nama', icon: Info, label: 'O NAMA', to: '/o-nama' },
  ]

  return (
    <header className={styles.header}>
      {/* ── Utility strip ── */}
      <div className={styles.utility}>
        <div className={`container ${styles.utilityInner}`}>
          <span className={styles.utilityItem}>
            <Phone size={13} weight="fill" /> +387 33 545 000
          </span>
          <span className={styles.utilityItem}>
            <Envelope size={13} weight="fill" /> info@proteinhouse.ba
          </span>
          <span className={`${styles.utilityItem} ${styles.utilityRight}`}>
            <Clock size={13} weight="fill" /> PON–PET 9–17 · SUB 9–14
          </span>
          <span className={`${styles.utilityItem} ${styles.utilityAccent}`}>
            <Truck size={13} weight="fill" /> BESPLATNA DOSTAVA &gt; 100 KM
          </span>
        </div>
      </div>

      {/* ── Main bar ── */}
      <div className={styles.mainBar}>
        <div className={`container ${styles.mainBarInner}`}>
          <Logo size="md" onClick={() => navigate('/')} />

          <form
            className={styles.searchForm}
            onSubmit={(e) => {
              e.preventDefault()
              if (searchVal.trim()) navigate(`/pretraga?q=${encodeURIComponent(searchVal)}`)
            }}
          >
            <MagnifyingGlass size={16} color="var(--ph-gray-600)" />
            <input
              className={styles.searchInput}
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Pretraži proizvode, brendove…"
              aria-label="Pretraga"
            />
          </form>

          <div className={styles.iconGroup}>
            <Link to="/nalog" className={`${styles.iconBtn} ${styles.hideOnMobile}`} aria-label="Nalog">
              <User size={22} />
            </Link>
            <button className={`${styles.iconBtn} ${styles.hideOnMobile}`} aria-label="Wishlist">
              <Heart size={22} />
            </button>
            <button
              className={styles.iconBtn}
              aria-label="Korpa"
              onClick={openDrawer}
              style={{ position: 'relative' }}
            >
              <ShoppingBag size={22} />
              {totalItems > 0 && (
                <span className={styles.cartBadge}>{totalItems}</span>
              )}
            </button>
            {/* Hamburger — mobile only */}
            <button
              className={`${styles.iconBtn} ${styles.hamburger}`}
              aria-label={mobileOpen ? 'Zatvori meni' : 'Otvori meni'}
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <X size={22} weight="bold" /> : <List size={22} weight="bold" />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Primary nav ── */}
      <nav className={styles.nav}>
        <div className={`container ${styles.navInner}`}>
          {navItems.map((n) => {
            const Icon = n.icon
            return (
              <span
                key={n.key}
                className={styles.navLink}
                onMouseEnter={n.hasMenu ? openMenu : undefined}
                onMouseLeave={n.hasMenu ? scheduleClose : undefined}
                onClick={() => navigate(n.to)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && navigate(n.to)}
              >
                <Icon size={18} weight="regular" /> {n.label}
                {n.hasMenu && <CaretDown size={12} weight="bold" style={{ marginLeft: 2, opacity: 0.8 }} />}
              </span>
            )
          })}

          <span
            className={`${styles.navLink} ${styles.navRight}`}
            onClick={() => navigate('/kontakt')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && navigate('/kontakt')}
          >
            <MapPin size={18} weight="regular" /> KONTAKT
          </span>
        </div>

        {/* ── Mega menu ── */}
        <div
          className={`${styles.megaMenu} ${shopOpen ? styles.megaOpen : ''}`}
          onMouseEnter={openMenu}
          onMouseLeave={scheduleClose}
          aria-hidden={!shopOpen}
        >
          <div className={`container ${styles.megaGrid}`}>
            {categories.map((c) => {
              const Icon = CAT_ICONS[c.slug] || Tag
              return (
                <div key={c.slug}>
                  <button
                    className={`${styles.megaHeader} ${c.accent ? styles.megaAccent : ''}`}
                    onClick={() => { navigate(`/kategorija/${c.slug}`); setShopOpen(false) }}
                  >
                    <Icon size={16} weight="bold" /> {c.label}
                  </button>
                  {c.subs && c.subs.length > 0 && (
                    <ul className={styles.megaSubs}>
                      {c.subs.map((s) => (
                        <li
                          key={s}
                          className={styles.megaSub}
                          onClick={() => { navigate(`/kategorija/${c.slug}`); setShopOpen(false) }}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && navigate(`/kategorija/${c.slug}`)}
                        >
                          {s}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>

          <div className={styles.megaFooter}>
            <div className={`container ${styles.megaFooterInner}`}>
              <span className={styles.megaFooterLabel}>BRZI PREČAC:</span>
              <button className={styles.megaPill} onClick={() => { navigate('/kategorija/akcija'); setShopOpen(false) }}>
                <Tag size={14} /> AKCIJA −70%
              </button>
              <button className={styles.megaPill} onClick={() => { navigate('/kategorija/proteini'); setShopOpen(false) }}>
                <Lightning size={14} /> NOVO
              </button>
              <button className={styles.megaPill} onClick={() => { navigate('/kategorija/akcija'); setShopOpen(false) }}>
                NAJPRODAVANIJE
              </button>
              <button className={`${styles.megaPill} ${styles.megaPillRight}`} onClick={() => { navigate('/'); setShopOpen(false) }}>
                <Storefront size={14} /> POGLEDAJ SVE PROIZVODE →
              </button>
            </div>
          </div>
        </div>
      </nav>
      {/* ── Mobile nav drawer ── */}
      {mobileOpen && (
        <div
          className={styles.mobileScrim}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
      <div className={`${styles.mobileDrawer} ${mobileOpen ? styles.mobileDrawerOpen : ''}`}>
        <div className={styles.mobileDrawerInner}>
          {/* Nav items */}
          {navItems.map((n) => {
            const Icon = n.icon
            return (
              <button
                key={n.key}
                className={styles.mobileNavItem}
                onClick={() => { navigate(n.to); setMobileOpen(false) }}
              >
                <Icon size={20} /> {n.label}
                <CaretRight size={14} className={styles.mobileChevron} />
              </button>
            )
          })}
          <button
            className={styles.mobileNavItem}
            onClick={() => { navigate('/kontakt'); setMobileOpen(false) }}
          >
            <MapPin size={20} /> KONTAKT
            <CaretRight size={14} className={styles.mobileChevron} />
          </button>

          <div className={styles.mobileDivider} />

          {/* Categories */}
          <p className={styles.mobileSectionLabel}>KATEGORIJE</p>
          {categories.map((c) => {
            const Icon = CAT_ICONS[c.slug] || Tag
            return (
              <button
                key={c.slug}
                className={`${styles.mobileNavItem} ${styles.mobileCatItem} ${c.accent ? styles.mobileAccent : ''}`}
                onClick={() => { navigate(`/kategorija/${c.slug}`); setMobileOpen(false) }}
              >
                <Icon size={16} /> {c.label}
              </button>
            )
          })}

          <div className={styles.mobileDivider} />

          {/* Auth */}
          <button
            className={`${styles.mobileNavItem} ${styles.mobileAuthBtn}`}
            onClick={() => { navigate('/nalog'); setMobileOpen(false) }}
          >
            <User size={20} /> PRIJAVA / REGISTRACIJA
          </button>
        </div>
      </div>
    </header>
  )
}
