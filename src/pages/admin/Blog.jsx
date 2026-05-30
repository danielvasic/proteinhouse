import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, Search, FileText } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Switch } from '../../components/ui/switch'
import { Card, CardContent } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'

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
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Blog</h2>
          <p className="text-sm text-muted-foreground">{posts.length} postova</p>
        </div>
        <Button asChild>
          <Link to="/admin/blog/novi" className="flex items-center gap-2">
            <Plus size={16} /> Novi post
          </Link>
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Pretraži postove…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-7 w-7 rounded-full border-4 border-gray-200 border-t-emerald-500 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Naslov</TableHead>
                  <TableHead>Autor</TableHead>
                  <TableHead>Objavljen</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead className="text-right">Akcije</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <div className="flex flex-col items-center py-12 text-muted-foreground">
                        <FileText size={36} className="mb-3 opacity-30" />
                        <p className="text-sm">Nema blog postova.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <p className="font-semibold text-sm">{p.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">/blog/{p.slug}</p>
                    </TableCell>
                    <TableCell className="text-sm">{p.author}</TableCell>
                    <TableCell>
                      <Switch
                        checked={p.published}
                        onCheckedChange={() => togglePublished(p.id, p.published)}
                      />
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString('bs')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/admin/blog/${p.id}`}><Pencil size={15} /></Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(p.id, p.title)}>
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
