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

const NAV_ITEMS = [
  { key: 'shop',     label: 'SHOP',    hasMenu: true, to: '/' },
  { key: 'sportovi', label: 'SPORTOVI',              to: '/kategorija/performanse' },
  { key: 'ciljevi',  label: 'CILJEVI',               to: '/kategorija/kontrola' },
  { key: 'blog',     label: 'BLOG',                  to: '/blog' },
  { key: 'o-nama',   label: 'O NAMA',                to: '/o-nama' },
  { key: 'kontakt',  label: 'KONTAKT', right: true,  to: '/kontakt' },
]

const MOBILE_ICONS = { shop: Storefront, sportovi: Barbell, ciljevi: Target, blog: Newspaper, 'o-nama': Info, kontakt: MapPin }

export default function Header() {
  const navigate = useNavigate()
  const location = useLocation()
  const { totalItems, openDrawer } = useCart()
  const [shopOpen, setShopOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchVal, setSearchVal] = useState('')
  const closeTimer = useRef(null)

  useEffect(() => { setMobileOpen(false) }, [location.pathname])
  useEffect(() => () => clearTimeout(closeTimer.current), [])

  const openMenu = () => { clearTimeout(closeTimer.current); setShopOpen(true) }
  const scheduleClose = () => { closeTimer.current = setTimeout(() => setShopOpen(false), 120) }

  const iconBtnCls = 'relative flex items-center justify-center w-10 h-10 rounded-lg text-[#0F2952] hover:bg-gray-100 hover:text-[#2563EB] transition-colors duration-150 border-0 bg-transparent cursor-pointer'

  return (
    <header className="sticky top-0 z-50" style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}>

      {/* ── Utility strip ── */}
      <div className="bg-[#0A1F42] text-white hidden md:block">
        <div className="container">
          <div className="flex items-center gap-5 py-[7px] text-[11px] tracking-[0.06em]">
            <span className="flex items-center gap-1.5"><Phone size={12} weight="fill" /> +387 33 545 000</span>
            <span className="flex items-center gap-1.5"><Envelope size={12} weight="fill" /> info@proteinhouse.ba</span>
            <span className="ml-auto flex items-center gap-1.5"><Clock size={12} weight="fill" /> PON–PET 9–17 · SUB 9–14</span>
            <span className="flex items-center gap-1.5 font-bold text-[#60A5FA]">
              <Truck size={12} weight="fill" /> BESPLATNA DOSTAVA &gt; 100 KM
            </span>
          </div>
        </div>
      </div>

      {/* ── Main bar ── */}
      <div className="bg-white border-b border-gray-200">
        <div className="container">
          <div className="flex items-center gap-5 py-3 md:py-4">
            <Logo size="md" onClick={() => navigate('/')} />

            <form
              className="flex-1 max-w-[460px] hidden sm:flex items-center gap-2 h-10 px-3.5 bg-gray-50 border border-gray-200 rounded focus-within:border-[#0F2952] focus-within:shadow-[0_0_0_3px_rgba(15,41,82,0.1)] transition-all duration-150"
              onSubmit={(e) => {
                e.preventDefault()
                if (searchVal.trim()) navigate(`/pretraga?q=${encodeURIComponent(searchVal)}`)
              }}
            >
              <MagnifyingGlass size={15} className="text-gray-400 shrink-0" />
              <input
                className="bg-transparent flex-1 outline-none text-sm text-gray-900 placeholder:text-gray-400"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Pretraži proizvode, brendove…"
                aria-label="Pretraga"
              />
            </form>

            <div className="ml-auto flex items-center gap-0.5">
              <Link to="/nalog" className={`${iconBtnCls} hidden md:flex`} aria-label="Nalog">
                <User size={20} />
              </Link>
              <button className={`${iconBtnCls} hidden md:flex`} aria-label="Wishlist">
                <Heart size={20} />
              </button>
              <button className={iconBtnCls} aria-label="Korpa" onClick={openDrawer}>
                <ShoppingBag size={20} />
                {totalItems > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-[#2563EB] text-white text-[10px] font-bold flex items-center justify-center">
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
        </div>
      </div>

      {/* ── Primary nav ── */}
      <nav className="bg-[#0F2952] relative">
        <div className="container flex items-stretch overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NAV_ITEMS.map((n) => (
            <button
              key={n.key}
              className={`flex items-center gap-1.5 px-[18px] py-3 md:py-[13px] text-white text-[11px] md:text-xs font-bold tracking-[0.08em] uppercase cursor-pointer whitespace-nowrap border-b-2 border-transparent hover:border-[#2563EB] hover:bg-white/5 transition-all duration-150 bg-transparent ${n.right ? 'ml-auto' : ''}`}
              onMouseEnter={n.hasMenu ? openMenu : undefined}
              onMouseLeave={n.hasMenu ? scheduleClose : undefined}
              onClick={() => navigate(n.to)}
            >
              {n.label}
              {n.hasMenu && <CaretDown size={10} weight="bold" className="opacity-70" />}
            </button>
          ))}
        </div>

        {/* ── Mega menu ── */}
        <div
          className={`absolute top-full left-0 right-0 bg-white border-t-[3px] border-[#2563EB] shadow-[0_14px_28px_-10px_rgba(15,41,82,0.20)] transition-all duration-200 z-40 ${shopOpen ? 'opacity-100 translate-y-0 pointer-events-auto' : 'opacity-0 -translate-y-2 pointer-events-none'}`}
          onMouseEnter={openMenu}
          onMouseLeave={scheduleClose}
          aria-hidden={!shopOpen}
        >
          <div className="container grid grid-cols-4 xl:grid-cols-8 gap-5 py-7">
            {categories.map((c) => {
              const Icon = CAT_ICONS[c.slug] || Tag
              return (
                <div key={c.slug}>
                  <button
                    className={`flex items-center gap-1.5 w-full text-left pb-2 mb-2.5 border-b border-gray-200 font-bold text-[13px] tracking-[0.06em] uppercase bg-transparent border-x-0 border-t-0 cursor-pointer transition-colors duration-150 ${c.accent ? 'text-[#2563EB]' : 'text-[#0F2952] hover:text-[#2563EB]'}`}
                    style={{ fontFamily: 'Oswald, Impact, sans-serif' }}
                    onClick={() => { navigate(`/kategorija/${c.slug}`); setShopOpen(false) }}
                  >
                    <Icon size={14} weight="bold" /> {c.label}
                  </button>
                  {c.subs?.length > 0 && (
                    <ul className="flex flex-col gap-1.5 p-0 m-0 list-none">
                      {c.subs.map((s) => (
                        <li
                          key={s}
                          className="text-[11px] text-gray-600 cursor-pointer py-0.5 hover:text-[#2563EB] transition-colors duration-150"
                          onClick={() => { navigate(`/kategorija/${c.slug}`); setShopOpen(false) }}
                          role="button" tabIndex={0}
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

          <div className="bg-gray-50 border-t border-gray-200">
            <div className="container flex items-center gap-2.5 py-3 flex-wrap">
              <span className="text-[11px] font-bold tracking-[0.14em] uppercase text-gray-500">BRZI PREČAC:</span>
              {[
                { label: 'AKCIJA −70%', to: '/kategorija/akcija', Icon: Tag },
                { label: 'NOVO', to: '/kategorija/proteini', Icon: Lightning },
                { label: 'NAJPRODAVANIJE', to: '/kategorija/akcija', Icon: null },
              ].map(({ label, to, Icon }) => (
                <button
                  key={label}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded text-[11px] font-bold tracking-[0.08em] uppercase text-[#0F2952] hover:bg-[#0F2952] hover:border-[#0F2952] hover:text-white transition-all duration-150 cursor-pointer"
                  onClick={() => { navigate(to); setShopOpen(false) }}
                >
                  {Icon && <Icon size={13} />} {label}
                </button>
              ))}
              <button
                className="ml-auto flex items-center gap-1.5 px-3 py-1.5 bg-[#2563EB] border border-[#2563EB] rounded text-[11px] font-bold tracking-[0.08em] uppercase text-white hover:bg-[#1D4ED8] transition-all duration-150 cursor-pointer"
                onClick={() => { navigate('/'); setShopOpen(false) }}
              >
                <Storefront size={13} /> POGLEDAJ SVE PROIZVODE →
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-[#0F172A]/50 z-[79] md:hidden"
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
                className="flex items-center gap-3 px-5 py-3.5 bg-transparent border-0 border-b border-gray-100 font-bold text-[13px] tracking-[0.08em] uppercase text-[#0F2952] cursor-pointer text-left hover:bg-gray-50 transition-colors"
                onClick={() => { navigate(n.to); setMobileOpen(false) }}
              >
                {Icon && <Icon size={18} />} {n.label}
                <CaretRight size={13} className="ml-auto opacity-40" />
              </button>
            )
          })}

          <div className="h-1.5 bg-gray-50 border-y border-gray-200 my-1" />
          <p className="px-5 pt-3 pb-1.5 text-[10px] font-bold tracking-[0.14em] uppercase text-gray-400 m-0">KATEGORIJE</p>

          {categories.map((c) => {
            const Icon = CAT_ICONS[c.slug] || Tag
            return (
              <button
                key={c.slug}
                className={`flex items-center gap-2.5 px-5 py-2.5 bg-transparent border-0 border-b border-gray-100 font-semibold text-xs tracking-[0.04em] uppercase cursor-pointer text-left hover:bg-gray-50 transition-colors ${c.accent ? 'text-[#2563EB]' : 'text-gray-700'}`}
                onClick={() => { navigate(`/kategorija/${c.slug}`); setMobileOpen(false) }}
              >
                <Icon size={15} /> {c.label}
              </button>
            )
          })}

          <div className="h-1.5 bg-gray-50 border-y border-gray-200 my-1" />

          <button
            className="flex items-center gap-3 px-5 py-3.5 bg-transparent border-0 font-bold text-[13px] tracking-[0.08em] uppercase text-[#2563EB] cursor-pointer text-left hover:bg-gray-50 transition-colors"
            onClick={() => { navigate('/nalog'); setMobileOpen(false) }}
          >
            <User size={18} /> PRIJAVA / REGISTRACIJA
          </button>
        </div>
      </div>

      <style>{`@keyframes fadeIn { from { opacity:0 } to { opacity:1 } }`}</style>
    </header>
  )
}
