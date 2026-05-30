import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, Newspaper, ShoppingCart, CurrencyCircleDollar, ArrowRight } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import styles from './Dashboard.module.css'

function StatCard({ icon: Icon, label, value, color, to }) {
  return (
    <Link to={to} className={styles.stat}>
      <div className={styles.statIcon} style={{ background: color + '18', color }}>
        <Icon size={24} weight="duotone" />
      </div>
      <div>
        <p className={styles.statLabel}>{label}</p>
        <p className={styles.statValue}>{value ?? '—'}</p>
      </div>
      <ArrowRight size={16} className={styles.statArrow} />
    </Link>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState({ products: null, posts: null, orders: null, revenue: null })
  const [recent, setRecent] = useState([])

  useEffect(() => {
    async function load() {
      const [
        { count: products },
        { count: posts },
        { count: orders },
        { data: orderData },
      ] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('blog_posts').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('total, status, customer_name, created_at, order_number')
          .order('created_at', { ascending: false }).limit(5),
      ])
      const revenue = orderData?.reduce((s, o) => s + Number(o.total), 0) ?? 0
      setStats({ products, posts, orders, revenue })
      setRecent(orderData ?? [])
    }
    load()
  }, [])

  const fmt = (n) => n !== null ? n.toLocaleString('bs') : '—'

  return (
    <div className={styles.page}>
      <h1 className={styles.heading}>Dashboard</h1>

      <div className={styles.grid}>
        <StatCard icon={Package}              label="Proizvodi"   value={fmt(stats.products)} color="#3B82F6" to="/admin/proizvodi" />
        <StatCard icon={Newspaper}            label="Blog postovi" value={fmt(stats.posts)}    color="#8B5CF6" to="/admin/blog" />
        <StatCard icon={ShoppingCart}         label="Narudžbe"    value={fmt(stats.orders)}   color="#F59E0B" to="/admin/narudzbe" />
        <StatCard icon={CurrencyCircleDollar} label="Ukupno prihoda" value={stats.revenue !== null ? stats.revenue.toFixed(2) + ' KM' : '—'} color="#10B981" to="/admin/narudzbe" />
      </div>

      <div className={styles.recentWrap}>
        <h2 className={styles.sectionTitle}>Posljednje narudžbe</h2>
        {recent.length === 0 ? (
          <p className={styles.empty}>Nema narudžbi još.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Broj</th>
                <th>Kupac</th>
                <th>Iznos</th>
                <th>Status</th>
                <th>Datum</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((o) => (
                <tr key={o.order_number}>
                  <td className={styles.mono}>{o.order_number}</td>
                  <td>{o.customer_name}</td>
                  <td>{Number(o.total).toFixed(2)} KM</td>
                  <td><span className={`${styles.badge} ${styles['badge_' + o.status]}`}>{o.status}</span></td>
                  <td>{new Date(o.created_at).toLocaleDateString('bs')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
