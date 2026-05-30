import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, PencilSimple, Trash, MagnifyingGlass } from '@phosphor-icons/react'
import { supabase } from '../../lib/supabase'
import styles from './AdminTable.module.css'

export default function AdminBlog() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const load = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('blog_posts')
      .select('id, title, slug, author, published, published_at, created_at')
      .order('created_at', { ascending: false })
    setPosts(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const togglePublished = async (id, current) => {
    const update = { published: !current, published_at: !current ? new Date().toISOString() : null }
    await supabase.from('blog_posts').update(update).eq('id', id)
    setPosts((ps) => ps.map((p) => p.id === id ? { ...p, ...update } : p))
  }

  const handleDelete = async (id, title) => {
    if (!confirm(`Obrisati "${title}"?`)) return
    await supabase.from('blog_posts').delete().eq('id', id)
    setPosts((ps) => ps.filter((p) => p.id !== id))
  }

  const filtered = posts.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <h1 className={styles.heading}>Blog</h1>
        <Link to="/admin/blog/novi" className={styles.addBtn}>
          <Plus size={16} weight="bold" /> Novi post
        </Link>
      </div>

      <div className={styles.searchWrap}>
        <MagnifyingGlass size={16} className={styles.searchIcon} />
        <input className={styles.search} placeholder="Pretraži postove…"
          value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? <div className={styles.spinner} /> : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Naslov</th>
                <th>Autor</th>
                <th>Status</th>
                <th>Datum</th>
                <th>Akcije</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>
                    <p className={styles.name}>{p.title}</p>
                    <p className={styles.brand}>/blog/{p.slug}</p>
                  </td>
                  <td>{p.author}</td>
                  <td>
                    <button
                      className={`${styles.badge} ${p.published ? styles.badge_true : styles.badge_false}`}
                      style={{ border: 0, cursor: 'pointer' }}
                      onClick={() => togglePublished(p.id, p.published)}
                    >
                      {p.published ? 'Objavljeno' : 'Draft'}
                    </button>
                  </td>
                  <td>{new Date(p.created_at).toLocaleDateString('bs')}</td>
                  <td>
                    <div className={styles.actions}>
                      <Link to={`/admin/blog/${p.id}`} className={styles.editBtn}>
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
                <tr><td colSpan={5} className={styles.empty}>Nema blog postova.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
