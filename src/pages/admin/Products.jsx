import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, PencilSimple, Trash, MagnifyingGlass, ToggleLeft, ToggleRight } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import styles from './AdminTable.module.css'

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('products')
      .select('id, brand, title, price, old_price, category, is_active, badge, image_url')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
    setProducts(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const toggleActive = async (id, current) => {
    await supabase.from('products').update({ is_active: !current }).eq('id', id)
    setProducts((ps) => ps.map((p) => p.id === id ? { ...p, is_active: !current } : p))
  }

  const handleDelete = async (id, title) => {
    if (!confirm(`Obrisati "${title}"?`)) return
    await supabase.from('products').delete().eq('id', id)
    setProducts((ps) => ps.filter((p) => p.id !== id))
  }

  const filtered = products.filter((p) =>
    `${p.brand} ${p.title}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <h1 className={styles.heading}>Proizvodi</h1>
        <Link to="/admin/proizvodi/novi" className={styles.addBtn}>
          <Plus size={16} weight="bold" /> Novi proizvod
        </Link>
      </div>

      <div className={styles.searchWrap}>
        <MagnifyingGlass size={16} className={styles.searchIcon} />
        <input
          className={styles.search}
          placeholder="Pretraži proizvode…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className={styles.spinner} />
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Slika</th>
                <th>Naziv</th>
                <th>Kategorija</th>
                <th>Cijena</th>
                <th>Status</th>
                <th>Akcije</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    {p.image_url
                      ? <img src={p.image_url} alt="" className={styles.thumb} />
                      : <div className={styles.noImg}>?</div>}
                  </td>
                  <td>
                    <p className={styles.brand}>{p.brand}</p>
                    <p className={styles.name}>{p.title}</p>
                  </td>
                  <td><span className={styles.cat}>{p.category}</span></td>
                  <td>
                    <span className={p.old_price ? styles.salePrice : styles.price}>
                      {Number(p.price).toFixed(2)} KM
                    </span>
                    {p.old_price && (
                      <span className={styles.oldPrice}>{Number(p.old_price).toFixed(2)} KM</span>
                    )}
                  </td>
                  <td>
                    <button
                      className={styles.toggleBtn}
                      onClick={() => toggleActive(p.id, p.is_active)}
                      title={p.is_active ? 'Deaktiviraj' : 'Aktiviraj'}
                    >
                      {p.is_active
                        ? <ToggleRight size={26} weight="fill" color="#16A34A" />
                        : <ToggleLeft  size={26} weight="fill" color="#94A3B8" />}
                    </button>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <Link to={`/admin/proizvodi/${p.id}`} className={styles.editBtn}>
                        <PencilSimple size={15} />
                      </Link>
                      <button className={styles.deleteBtn} onClick={() => handleDelete(p.id, p.title)}>
                        <Trash size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className={styles.empty}>Nema proizvoda.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
