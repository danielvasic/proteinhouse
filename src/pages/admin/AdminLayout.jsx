import { useEffect, useState } from 'react'
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Package, FileText, ShoppingCart, Users, Tag,
  Percent, LayoutTemplate, Image, LogOut, Menu, X, ChevronRight,
  Bell, Settings, ExternalLink,
} from 'lucide-react'
import { useAdmin } from '../../store/AdminContext'
import { Button } from '../../components/ui/button'
import { Separator } from '../../components/ui/separator'
import { cn } from '../../lib/utils'

const NAV = [
  { label: 'Dashboard',   to: '/admin',             icon: LayoutDashboard, exact: true },
  { label: 'Proizvodi',   to: '/admin/proizvodi',   icon: Package },
  { label: 'Blog',        to: '/admin/blog',        icon: FileText },
  { label: 'Narudžbe',    to: '/admin/narudzbe',    icon: ShoppingCart },
  { label: 'Korisnici',   to: '/admin/korisnici',   icon: Users },
  { label: 'Kategorije',  to: '/admin/kategorije',  icon: Tag },
  { label: 'Ponude',      to: '/admin/ponude',      icon: Percent },
  { label: 'Baneri',      to: '/admin/baneri',      icon: Image },
  { label: 'Sadržaj',     to: '/admin/sadrzaj',     icon: LayoutTemplate },
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
    '/admin/baneri': 'Baneri',
    '/admin/sadrzaj': 'Sadržaj stranice',
    '/admin/postavke': 'Postavke',
  }
  const base = Object.entries(map)
    .filter(([k]) => k !== '/admin')
    .find(([k]) => location.pathname.startsWith(k))?.[1]
    ?? (location.pathname === '/admin' ? 'Dashboard' : 'Admin')
  return <h1 className="text-base font-semibold text-gray-900">{base}</h1>
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="h-10 w-10 rounded-full border-4 border-gray-200 border-t-emerald-500 animate-spin" />
      </div>
    )
  }

  const initial = admin?.email?.[0]?.toUpperCase() ?? 'A'

  return (
    <div className="min-h-screen flex bg-gray-50" style={{ fontFamily: 'Montserrat, Inter, system-ui, sans-serif' }}>
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
        style={{ background: '#0F2952', color: '#c9d8f0' }}
      >
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 px-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <img src="/logo.svg" alt="PH" className="h-8 w-8 rounded-full shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-sm tracking-widest" style={{ fontFamily: 'Oswald, Impact, sans-serif' }}>
              PROTEIN<span className="font-light">HOUSE</span>
            </p>
            <p className="text-[11px]" style={{ color: 'rgba(201,216,240,0.5)' }}>Admin panel</p>
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
          {NAV.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all group',
                    isActive
                      ? 'text-white'
                      : 'hover:text-white'
                  )
                }
                style={({ isActive }) => isActive
                  ? { background: 'rgba(16,185,129,0.15)', color: '#34d399' }
                  : { color: 'rgba(201,216,240,0.7)' }
                }
              >
                <Icon size={16} className="shrink-0" />
                <span>{item.label}</span>
                <ChevronRight size={12} className="ml-auto opacity-0 group-hover:opacity-40 transition-opacity" />
              </NavLink>
            )
          })}

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
              isActive ? 'text-white' : ''
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
            style={{ background: '#0F2952' }}>
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
