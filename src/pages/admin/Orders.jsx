import { useEffect, useState } from 'react'
import { MagnifyingGlass, CaretDown } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import styles from './AdminTable.module.css'
import oStyles from './Orders.module.css'

const STATUSES = ['nova', 'potvrđena', 'isporučena', 'otkazana']

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('sve')
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    supabase.from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .then(({ data }) => { setOrders(data ?? []); setLoading(false) })
  }, [])

  const updateStatus = async (id, status) => {
    await supabase.from('orders').update({ status }).eq('id', id)
    setOrders((os) => os.map((o) => o.id === id ? { ...o, status } : o))
  }

  const filtered = orders.filter((o) => {
    const matchStatus = filterStatus === 'sve' || o.status === filterStatus
    const matchSearch = search === '' ||
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      (o.customer_phone || '').includes(search)
    return matchStatus && matchSearch
  })

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <h1 className={styles.heading}>Narudžbe</h1>
      </div>

      {/* Filters */}
      <div className={oStyles.filters}>
        <div className={styles.searchWrap} style={{ maxWidth: 300, marginBottom: 0 }}>
          <MagnifyingGlass size={16} className={styles.searchIcon} />
          <input className={styles.search} placeholder="Pretraži broj / kupac / telefon…"
            value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className={oStyles.statusFilters}>
          {['sve', ...STATUSES].map((s) => (
            <button
              key={s}
              className={`${oStyles.filterBtn} ${filterStatus === s ? oStyles.filterActive : ''}`}
              onClick={() => setFilterStatus(s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? <div className={styles.spinner} /> : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Broj</th>
                <th>Kupac</th>
                <th>Grad</th>
                <th>Ukupno</th>
                <th>Status</th>
                <th>Datum</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <>
                  <tr key={o.id} className={expanded === o.id ? oStyles.expandedRow : ''}>
                    <td className={styles.mono}>{o.order_number}</td>
                    <td>
                      <p className={styles.name}>{o.customer_name}</p>
                      {o.customer_phone && <p className={styles.brand}>{o.customer_phone}</p>}
                    </td>
                    <td>{o.shipping_city || '—'}</td>
                    <td><strong>{Number(o.total).toFixed(2)} KM</strong></td>
                    <td>
                      <select
                        className={oStyles.statusSelect}
                        value={o.status}
                        onChange={(e) => updateStatus(o.id, e.target.value)}
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td>{new Date(o.created_at).toLocaleDateString('bs')}</td>
                    <td>
                      <button
                        className={oStyles.expandBtn}
                        onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                      >
                        <CaretDown
                          size={14}
                          weight="bold"
                          style={{ transform: expanded === o.id ? 'rotate(180deg)' : 'none', transition: '0.2s' }}
                        />
                      </button>
                    </td>
                  </tr>

                  {/* Expanded items */}
                  {expanded === o.id && (
                    <tr key={o.id + '_exp'}>
                      <td colSpan={7} className={oStyles.expandedCell}>
                        <div className={oStyles.detail}>
                          <div className={oStyles.detailLeft}>
                            <p className={oStyles.detailTitle}>Stavke narudžbe</p>
                            {(o.items || []).map((item, i) => (
                              <div key={i} className={oStyles.item}>
                                <span className={oStyles.itemName}>{item.brand} {item.title}</span>
                                <span className={oStyles.itemQty}>× {item.qty}</span>
                                <span className={oStyles.itemPrice}>{(item.price * item.qty).toFixed(2)} KM</span>
                              </div>
                            ))}
                            <div className={oStyles.totalRow}>
                              <span>Ukupno</span>
                              <span>{Number(o.total).toFixed(2)} KM</span>
                            </div>
                          </div>
                          <div className={oStyles.detailRight}>
                            <p className={oStyles.detailTitle}>Dostava</p>
                            <p>{o.customer_name}</p>
                            {o.customer_email && <p>{o.customer_email}</p>}
                            {o.customer_phone && <p>{o.customer_phone}</p>}
                            {o.shipping_address && <p>{o.shipping_address}</p>}
                            {o.shipping_city && <p>{o.shipping_city}</p>}
                            {o.notes && <><p className={oStyles.detailTitle} style={{marginTop:12}}>Napomena</p><p>{o.notes}</p></>}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className={styles.empty}>Nema narudžbi.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
