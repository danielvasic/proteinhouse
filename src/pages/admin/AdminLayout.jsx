import { useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  Gauge, Package, Newspaper, ShoppingCart,
  SignOut, House, ArrowLeft,
} from '@phosphor-icons/react'
import { useAdmin } from '../../store/AdminContext'
import styles from './AdminLayout.module.css'

const NAV = [
  { to: '/admin',            icon: Gauge,       label: 'Dashboard',  end: true },
  { to: '/admin/proizvodi',  icon: Package,     label: 'Proizvodi'  },
  { to: '/admin/blog',       icon: Newspaper,   label: 'Blog'       },
  { to: '/admin/narudzbe',   icon: ShoppingCart,label: 'Narudžbe'   },
]

export default function AdminLayout() {
  const { admin, loading, signOut } = useAdmin()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && !admin) navigate('/admin/prijava', { replace: true })
  }, [admin, loading, navigate])

  if (loading || !admin) {
    return (
      <div className={styles.loadWrap}>
        <div className={styles.spinner} />
      </div>
    )
  }

  return (
    <div className={styles.shell}>
      {/* ── Sidebar ── */}
      <aside className={styles.sidebar}>
        <div className={styles.sideTop}>
          <div className={styles.brand}>
            <span className={styles.brandP}>P</span>
            <span className={styles.brandH}>Admin</span>
          </div>
          <nav className={styles.nav}>
            {NAV.map(({ to, icon: Icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.navActive : ''}`
                }
              >
                <Icon size={18} weight="duotone" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className={styles.sideBottom}>
          <a href="/" target="_blank" rel="noopener" className={styles.navItem}>
            <House size={18} weight="duotone" /> Posjeti shop
          </a>
          <button className={`${styles.navItem} ${styles.signOut}`} onClick={signOut}>
            <SignOut size={18} /> Odjava
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
