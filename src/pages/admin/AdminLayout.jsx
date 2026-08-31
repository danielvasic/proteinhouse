import { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Package, FileText, ShoppingCart, Users, Tag,
  Percent, LayoutTemplate, Image, LogOut, Menu, X, ChevronRight,
  Bell, Settings, ExternalLink, Star, Newspaper, Navigation, MapPin, Columns,
  Ticket, Gift, ChevronDown, Megaphone,
} from 'lucide-react'
import { useAdmin } from '../../store/AdminContext'
import Logo from '../../components/Logo'
import { Button } from '../../components/ui/button'
import { Separator } from '../../components/ui/separator'
import { cn } from '../../lib/utils'
import { BODY } from '../../lib/typography'

/**
 * Izbornik u grupama.
 *
 * Sedamnaest stavki u jednom nizu se nije dalo pregledati — trazenje je bilo
 * citanje cijelog popisa. Grupe prate posao: sto se gleda svaki dan (prodaja),
 * sto se uredjuje povremeno (katalog, marketing), sto se postavi jednom
 * (izgled sajta).
 *
 * Otvorena je samo grupa u kojoj se trenutno nalazis; ostale su sklopljene.
 * Dashboard je izvan grupa jer je polazna tocka.
 */
const GRUPE = [
  {
    naslov: 'Prodaja',
    ikona: ShoppingCart,
    stavke: [
      { label: 'Narudžbe',   to: '/admin/narudzbe',   icon: ShoppingCart },
      { label: 'Korisnici',  to: '/admin/korisnici',  icon: Users },
    ],
  },
  {
    naslov: 'Katalog',
    ikona: Package,
    stavke: [
      { label: 'Proizvodi',  to: '/admin/proizvodi',  icon: Package },
      { label: 'Kategorije', to: '/admin/kategorije', icon: Tag },
      { label: 'Brendovi',   to: '/admin/brendovi',   icon: Tag },
    ],
  },
  {
    naslov: 'Akcije i pokloni',
    ikona: Percent,
    stavke: [
      { label: 'Ponude',     to: '/admin/ponude',     icon: Percent },
      { label: 'Kuponi',     to: '/admin/kuponi',     icon: Ticket },
      { label: 'Pokloni',    to: '/admin/pokloni',    icon: Gift },
    ],
  },
  {
    naslov: 'Sadržaj',
    ikona: LayoutTemplate,
    stavke: [
      { label: 'Baneri',     to: '/admin/baneri',     icon: Image },
      { label: 'Istaknuti',  to: '/admin/istaknuti',  icon: Star },
      { label: 'Vijesti',    to: '/admin/vijesti',    icon: Newspaper },
      { label: 'Blog',       to: '/admin/blog',       icon: FileText },
      { label: 'Sadržaj',    to: '/admin/sadrzaj',    icon: LayoutTemplate },
    ],
  },
  {
    naslov: 'Izgled sajta',
    ikona: Navigation,
    stavke: [
      { label: 'Navigacija', to: '/admin/navigacija', icon: Navigation },
      { label: 'Footer',     to: '/admin/footer',     icon: Columns },
      { label: 'Poslovnice', to: '/admin/poslovnice', icon: MapPin },
    ],
  },
]

function PageTitle() {
  const location = useLocation()
  const map = {
    '/admin': 'Dashboard',
    '/admin/proizvodi': 'Proizvodi',
    '/admin/blog': 'Blog',
    '/admin/narudzbe': 'Narudžbe',
    '/admin/korisnici': 'Korisnici',
    '/admin/kategorije': 'Kategorije',
    '/admin/ponude': 'Ponude',
    '/admin/kuponi': 'Kuponi',
    '/admin/pokloni': 'Gratis pokloni',
    '/admin/hero-baneri': 'Baneri',
    '/admin/baneri': 'Baneri',
    '/admin/istaknuti':  'Istaknuti sadržaj',
    '/admin/vijesti':    'Vijesti',
    '/admin/navigacija': 'Navigacija',
    '/admin/footer':     'Footer',
    '/admin/sadrzaj':    'Sadržaj stranice',
    '/admin/postavke':   'Postavke',
  }
  const base = Object.entries(map)
    .filter(([k]) => k !== '/admin')
    .find(([k]) => location.pathname.startsWith(k))?.[1]
    ?? (location.pathname === '/admin' ? 'Dashboard' : 'Admin')
  return <h1 className="text-base font-semibold text-gray-900">{base}</h1>
}

/** Jedna stavka izbornika. */
function Stavka({ to, label, icon: Icon, exact, uvuceno, aktivnaKad }) {
  const location = useLocation()
  // NavLink gleda samo putanju. Dvije stavke vode na /admin/postavke i
  // razlikuju se po ?tab=, pa bi bez ovoga obje bile oznacene kao aktivne.
  // Samo stavke koje dijele putanju dobiju vlastiti uvjet; ostale se
  // oslanjaju na NavLink, inace bi ih svaki query parametar (npr. ?page=2)
  // pogresno oznacio kao neaktivne.
  const stanje = (isActive) => (aktivnaKad ? aktivnaKad(location) : isActive)

  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) => cn(
        'flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-all group',
        uvuceno ? 'pl-9 pr-3' : 'px-3',
        stanje(isActive) ? 'text-white' : 'hover:text-white',
      )}
      style={({ isActive }) => stanje(isActive)
        ? { background: 'rgba(16,185,129,0.15)', color: '#34d399' }
        : { color: 'rgba(201,216,240,0.7)' }}
    >
      <Icon size={16} className="shrink-0" />
      <span>{label}</span>
      <ChevronRight size={12} className="ml-auto opacity-0 group-hover:opacity-40 transition-opacity" />
    </NavLink>
  )
}

/**
 * Sklopiva grupa. Otvara se sama kad je unutra trenutna stranica — inace bi
 * nakon svakog osvjezavanja trebalo ponovo kliknuti da se vidi gdje si.
 * Rucno otvaranje ima prednost nad tim dok se ne promijeni stranica.
 */
function Grupa({ grupa, putanja }) {
  const sadrziAktivnu = grupa.stavke.some((x) => putanja.startsWith(x.to))
  const [rucno, setRucno] = useState(null)
  useEffect(() => { setRucno(null) }, [putanja])
  const otvorena = rucno ?? sadrziAktivnu
  const Ikona = grupa.ikona

  return (
    <div>
      <button
        type="button"
        onClick={() => setRucno(!otvorena)}
        className="flex items-center gap-3 w-full rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-white"
        style={{ color: otvorena ? 'rgba(255,255,255,0.85)' : 'rgba(201,216,240,0.55)' }}
        aria-expanded={otvorena}
      >
        <Ikona size={16} className="shrink-0" />
        <span>{grupa.naslov}</span>
        <ChevronDown
          size={13}
          className="ml-auto transition-transform duration-200"
          style={{ transform: otvorena ? 'none' : 'rotate(-90deg)', opacity: 0.5 }}
        />
      </button>
      {otvorena && (
        <div className="space-y-0.5 mt-0.5 mb-1">
          {grupa.stavke.map((x) => <Stavka key={x.to} {...x} uvuceno />)}
        </div>
      )}
    </div>
  )
}

export default function AdminLayout() {
  const { admin, loading, signOut } = useAdmin()
  const navigate = useNavigate()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && !admin) navigate('/admin/prijava', { replace: true })
  }, [admin, loading, navigate])

  useEffect(() => { setSidebarOpen(false) }, [location.pathname])

  if (loading || !admin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#edf1f5]">
        <div className="h-10 w-10 rounded-full border-4 border-gray-200 border-t-emerald-500 animate-spin" />
      </div>
    )
  }

  const initial = admin?.email?.[0]?.toUpperCase() ?? 'A'

  return (
    <div className="min-h-screen flex bg-[#edf1f5]" style={BODY}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 flex flex-col transition-transform duration-300 lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        style={{ background: '#0145F2', color: '#c9d8f0' }}
      >
        {/* Brand — novi box logo s bijelim rubom (plava podloga sidebara) */}
        <div className="flex h-20 items-center gap-3 px-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <Logo size="sm" onDark />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold tracking-[0.08em] uppercase" style={{ color: 'rgba(201,216,240,0.6)' }}>Admin panel</p>
          </div>
          <button
            className="lg:hidden text-white/50 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          <Stavka to="/admin" label="Dashboard" icon={LayoutDashboard} exact />
          <Stavka
            to="/admin/postavke?tab=seo"
            label="SEO i oglasi"
            icon={Megaphone}
            aktivnaKad={(l) => l.pathname === '/admin/postavke' && l.search.includes('tab=seo')}
          />

          {GRUPE.map((g) => (
            <Grupa key={g.naslov} grupa={g} putanja={location.pathname} />
          ))}

          <Separator className="my-3" style={{ background: 'rgba(255,255,255,0.08)' }} />

          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-white"
            style={{ color: 'rgba(201,216,240,0.5)' }}
          >
            <ExternalLink size={16} />
            <span>Otvori shop</span>
          </a>
          <NavLink
            to="/admin/postavke"
            className={({ isActive }) => cn(
              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-white',
              // Ne oznacavaj kao aktivno kad si na tabu mjerenja — tamo je
              // aktivna stavka "SEO i oglasi" gore.
              isActive && !location.search.includes('tab=seo') ? 'text-white' : ''
            )}
            style={{ color: 'rgba(201,216,240,0.5)' }}
          >
            <Settings size={16} />
            <span>Postavke</span>
          </NavLink>
        </nav>

        {/* User */}
        <div className="p-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
              style={{ background: 'rgba(16,185,129,0.25)', color: '#34d399' }}>
              {initial}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">{admin?.email}</p>
              <p className="text-[10px]" style={{ color: 'rgba(201,216,240,0.4)' }}>Administrator</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 w-full rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-white"
            style={{ color: 'rgba(201,216,240,0.5)' }}
          >
            <LogOut size={14} />
            Odjava
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="h-16 flex items-center gap-4 border-b bg-white px-6 sticky top-0 z-30 shadow-sm">
          <button
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div className="flex-1">
            <PageTitle />
          </div>
          <Button variant="ghost" size="icon" className="text-gray-400">
            <Bell size={18} />
          </Button>
          <div className="h-8 w-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
            style={{ background: '#0145F2' }}>
            {initial}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
