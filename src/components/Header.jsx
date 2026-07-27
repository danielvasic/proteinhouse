import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Phone, Envelope, Clock, Truck, User, Heart,
  ShoppingCart, Storefront, Barbell, Target, Newspaper, Info, MapPin,
  CaretDown, CaretRight, Flask, Lightning, Leaf, Scales, BowlFood,
  Stack, Tag, List, X,
} from '@phosphor-icons/react'
import Logo from './Logo'
import NewsBar from './NewsBar'
import SearchBox from './SearchBox'
import { useCart } from '../store/CartContext'
import { useCategories } from '../hooks/useCategories'
import { useSiteContent } from '../hooks/useSiteContent'

const CAT_ICONS = {
  proteini:    Flask,
  performanse: Lightning,
  vitamini:    Leaf,
  kontrola:    Scales,
  hrana:       BowlFood,
  oprema:      Barbell,
  gaineri:     Stack,
  akcija:      Tag,
}

// Fallback icons for mobile nav by key
const MOBILE_ICONS = { shop: Storefront, sportovi: Barbell, ciljevi: Target, blog: Newspaper, 'o-nama': Info, kontakt: MapPin }

// Default nav items — overridden by DB values from site_content
const DEFAULT_NAV = [
  { key: 'shop',     label: 'SHOP',     to: '/',                         hasMenu: true,  right: false, active: true },
  { key: 'sportovi', label: 'SPORTOVI', to: '/kategorija/performanse',   hasMenu: false, right: false, active: true },
  { key: 'ciljevi',  label: 'CILJEVI',  to: '/kategorija/kontrola',      hasMenu: false, right: false, active: true },
  { key: 'blog',     label: 'BLOG',     to: '/blog',                     hasMenu: false, right: false, active: true },
  { key: 'o-nama',   label: 'O NAMA',   to: '/o-nama',                   hasMenu: false, right: false, active: true },
  { key: 'kontakt',  label: 'KONTAKT',  to: '/kontakt',                  hasMenu: false, right: true,  active: true },
]

const UTILITY_KEYS    = ['contact_phone', 'contact_email', 'contact_hours', 'footer_shipping']
const UTILITY_DEFAULT = {
  contact_phone:    '065/091-094',
  contact_email:    'podrska@proteinhouse.ba',
  contact_hours:    'PON–SUB 9:00–21:00',
  footer_shipping:  'BESPLATNA DOSTAVA > 100 KM',
}

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const { totalItems, openDrawer } = useCart()
  const [shopOpen,   setShopOpen]   = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const closeTimer = useRef(null)

  // Dynamic data from DB
  const { categories }     = useCategories()
  const { data: utility }  = useSiteContent(UTILITY_KEYS, UTILITY_DEFAULT)
  const { data: navData }  = useSiteContent(['nav_items'], { nav_items: null })
  const NAV_ITEMS = (navData.nav_items?.items ?? DEFAULT_NAV).filter(n => n.active !== false)

  useEffect(() => { setMobileOpen(false) }, [location.pathname])
  useEffect(() => () => clearTimeout(closeTimer.current), [])

  const openMenu = () => { clearTimeout(closeTimer.current); setShopOpen(true) }
  const scheduleClose = () => { closeTimer.current = setTimeout(() => setShopOpen(false), 120) }

  const iconBtnCls = 'relative flex items-center justify-center w-10 h-10 text-[#0A0E17] hover:bg-gray-100 transition-colors duration-150 border-0 bg-transparent cursor-pointer'

  return (
    <header className="sticky top-0 z-50" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* ── News bar (rotirajuće poruke) ── */}
      <NewsBar />

      {/* ── Utility strip ── */}
      <div className="bg-[#0A0E17] text-white hidden md:block">
        <div className="container">
          <div className="flex items-center gap-5 py-[7px] text-[11px] tracking-[0.06em] text-white/60">
            {utility.contact_phone  && <span className="flex items-center gap-1.5"><Phone    size={11} weight="fill" /> {utility.contact_phone}</span>}
            {utility.contact_email  && <span className="flex items-center gap-1.5"><Envelope size={11} weight="fill" /> {utility.contact_email}</span>}
            {utility.contact_hours  && <span className="ml-auto flex items-center gap-1.5"><Clock size={11} weight="fill" /> {utility.contact_hours}</span>}
            {utility.footer_shipping && <span className="flex items-center gap-1.5 font-bold text-white/90"><Truck size={11} weight="fill" /> {utility.footer_shipping}</span>}
          </div>
        </div>
      </div>

      {/* ── Main bar ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="container">
          <div className="flex items-center gap-5 py-3 md:py-4">
            <Logo size="md" onClick={() => navigate('/')} />

            <div className="flex-1 hidden sm:flex">
              <SearchBox />
            </div>

            <div className="ml-auto flex items-center gap-0.5">
              <Link to="/nalog" className={`${iconBtnCls} hidden md:flex`} aria-label="Nalog">
                <User size={20} />
              </Link>
              <button className={`${iconBtnCls} hidden md:flex`} aria-label="Wishlist">
                <Heart size={20} />
              </button>
              <button className={iconBtnCls} aria-label="Korpa" onClick={openDrawer}>
                <ShoppingCart size={20} />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-[#0145F2] text-white text-[9px] font-bold flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
              <button
                className={`${iconBtnCls} md:hidden`}
                aria-label={mobileOpen ? 'Zatvori' : 'Meni'}
                onClick={() => setMobileOpen((o) => !o)}
              >
                {mobileOpen ? <X size={20} weight="bold" /> : <List size={20} weight="bold" />}
              </button>
            </div>
          </div>

          {/* ── Mobile search (uvijek vidljiv, odmah nudi prijedloge) ── */}
          <div className="sm:hidden pb-3">
            <SearchBox />
          </div>
        </div>
      </div>

      {/* ── Primary nav ── */}
      <nav className="bg-[#0145F2] relative">
        <div className="container flex items-stretch overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NAV_ITEMS.map((n) => (
            <button
              key={n.key}
              className={`flex items-center gap-1.5 px-[18px] py-3 md:py-[13px] text-white/75 hover:text-white text-[11px] md:text-xs font-bold tracking-[0.1em] uppercase cursor-pointer whitespace-nowrap border-b-2 border-transparent hover:border-white/60 hover:bg-white/5 transition-all duration-150 bg-transparent ${n.right ? 'ml-auto' : ''}`}
              onMouseEnter={n.hasMenu ? openMenu : undefined}
              onMouseLeave={n.hasMenu ? scheduleClose : undefined}
              onClick={() => navigate(n.to)}
            >
              {n.label}
              {n.hasMenu && <CaretDown size={10} weight="bold" className="opacity-60" />}
            </button>
          ))}
        </div>

        {/* ── Mega menu ── */}
        <div
          className={`absolute top-full left-0 right-0 bg-white border-t-2 border-[#0A0E17] shadow-[0_16px_32px_-12px_rgba(10,14,23,0.22)] transition-all duration-200 z-40 overflow-y-auto max-h-[80vh] ${shopOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'}`}
          onMouseEnter={openMenu}
          onMouseLeave={scheduleClose}
          aria-hidden={!shopOpen}
        >
          <div className="mx-auto w-full max-w-[1280px] px-8 md:px-10 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-x-7 gap-y-5 py-5">
            {categories.map((c) => {
              const Icon = CAT_ICONS[c.slug] || Tag
              const subs = c.subs?.slice(0, 5) ?? []
              return (
                <div key={c.slug}>
                  <button
                    className="flex items-center gap-1.5 w-full text-left pb-2 mb-2.5 border-b border-gray-200 font-bold text-[12px] tracking-[0.05em] uppercase bg-transparent border-x-0 border-t-0 cursor-pointer transition-colors duration-150 text-[#0A0E17] hover:text-[#0A0E17]"
                    style={{ fontFamily: 'Oswald, Impact, sans-serif' }}
                    onClick={() => { navigate(`/kategorija/${c.slug}`); setShopOpen(false) }}
                  >
                    <Icon size={12} weight="bold" /> {c.label}
                  </button>
                  {subs.length > 0 && (
                    <ul className="flex flex-col gap-1.5 p-0 m-0 list-none">
                      {subs.map((s) => (
                        <li
                          key={s}
                          className="text-[11.5px] text-gray-500 cursor-pointer hover:text-[#0145F2] transition-colors duration-150 leading-snug"
                          onClick={() => { navigate(`/kategorija/${c.slug}`); setShopOpen(false) }}
                          role="button" tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && navigate(`/kategorija/${c.slug}`)}
                        >
                          {s}
                        </li>
                      ))}
                      {c.subs.length > 5 && (
                        <li
                          className="text-[11px] font-semibold text-[#0A0E17] cursor-pointer hover:underline leading-snug"
                          onClick={() => { navigate(`/kategorija/${c.slug}`); setShopOpen(false) }}
                          role="button" tabIndex={0}
                          onKeyDown={(e) => e.key === 'Enter' && navigate(`/kategorija/${c.slug}`)}
                        >
                          Sve →
                        </li>
                      )}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>

          <div className="bg-[#F2F4F7] border-t border-gray-200">
            <div className="mx-auto w-full max-w-[1280px] px-8 md:px-10 flex items-center gap-2.5 py-3 flex-wrap">
              <span className="text-[10px] font-bold tracking-[0.16em] uppercase text-gray-400">BRZI PREČAC:</span>
              {[
                { label: 'AKCIJA −70%', to: '/kategorija/akcija', Icon: Tag },
                { label: 'NOVO', to: '/kategorija/proteini', Icon: Lightning },
                { label: 'BESTSELLERI', to: '/kategorija/akcija', Icon: null },
              ].map(({ label, to, Icon }) => (
                <button
                  key={label}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-[10px] font-bold tracking-[0.1em] uppercase text-[#0A0E17] hover:bg-[#0145F2] hover:border-[#0145F2] hover:text-white transition-all duration-150 cursor-pointer"
                  onClick={() => { navigate(to); setShopOpen(false) }}
                >
                  {Icon && <Icon size={12} />} {label}
                </button>
              ))}
              <button
                className="ml-auto flex items-center gap-1.5 px-4 py-1.5 border border-[#0145F2] text-[10px] font-bold tracking-[0.1em] uppercase text-[#0A0E17] hover:bg-[#0145F2] hover:text-white transition-all duration-150 cursor-pointer bg-transparent"
                onClick={() => { navigate('/'); setShopOpen(false) }}
              >
                <Storefront size={12} /> POGLEDAJ SVE PROIZVODE →
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-[#0A0E17]/50 z-[79] md:hidden"
          style={{ animation: 'fadeIn 180ms ease' }}
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Mobile drawer ── */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-[300px] max-w-[85vw] bg-white z-[80] flex flex-col shadow-xl overflow-y-auto transition-transform duration-[260ms] ease-[cubic-bezier(0.4,0,0.2,1)] ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex flex-col py-4 pb-8">
          {NAV_ITEMS.map((n) => {
            const Icon = MOBILE_ICONS[n.key]
            return (
              <button
                key={n.key}
                className="flex items-center gap-3 px-5 py-3.5 bg-transparent border-0 border-b border-gray-100 font-bold text-[12px] tracking-[0.1em] uppercase text-[#0A0E17] cursor-pointer text-left hover:bg-[#F2F4F7] transition-colors"
                onClick={() => { navigate(n.to); setMobileOpen(false) }}
              >
                {Icon && <Icon size={17} className="text-gray-400" />} {n.label}
                <CaretRight size={12} className="ml-auto text-gray-300" />
              </button>
            )
          })}

          <div className="h-px bg-gray-200 my-3 mx-5" />
          <p className="px-5 pb-1.5 text-[10px] font-bold tracking-[0.18em] uppercase text-gray-400 m-0">Kategorije</p>

          {categories.map((c) => {
            const Icon = CAT_ICONS[c.slug] || Tag
            return (
              <button
                key={c.slug}
                className="flex items-center gap-2.5 px-5 py-2.5 bg-transparent border-0 border-b border-gray-100 font-semibold text-xs tracking-[0.04em] uppercase cursor-pointer text-left hover:bg-[#F2F4F7] transition-colors text-gray-600"
                onClick={() => { navigate(`/kategorija/${c.slug}`); setMobileOpen(false) }}
              >
                <Icon size={14} className="text-gray-400" /> {c.label}
              </button>
            )
          })}

          <div className="h-px bg-gray-200 my-3 mx-5" />

          <button
            className="flex items-center gap-3 px-5 py-3.5 bg-transparent border-0 font-bold text-[12px] tracking-[0.1em] uppercase text-[#0A0E17] cursor-pointer text-left hover:bg-[#F2F4F7] transition-colors"
            onClick={() => { navigate('/nalog'); setMobileOpen(false) }}
          >
            <User size={17} className="text-gray-400" /> PRIJAVA / REGISTRACIJA
          </button>
        </div>
      </div>

      <style>{`@keyframes fadeIn { from { opacity:0 } to { opacity:1 } }`}</style>
    </header>
  )
}
