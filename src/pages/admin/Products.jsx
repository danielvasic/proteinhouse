import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Pencil, Trash2, Search, Package } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Switch } from '../../components/ui/switch'
import { Card, CardContent } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'

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
    `${p.brand} ${p.title} ${p.category}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Proizvodi</h2>
          <p className="text-sm text-muted-foreground">{products.length} ukupno</p>
        </div>
        <Button asChild>
          <Link to="/admin/proizvodi/novi" className="flex items-center gap-2">
            <Plus size={16} /> Novi proizvod
          </Link>
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Pretraži proizvode…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
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
                  <TableHead className="w-16">Slika</TableHead>
                  <TableHead>Naziv</TableHead>
                  <TableHead>Kategorija</TableHead>
                  <TableHead>Cijena</TableHead>
                  <TableHead>Aktivan</TableHead>
                  <TableHead className="text-right">Akcije</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <div className="flex flex-col items-center py-12 text-muted-foreground">
                        <Package size={36} className="mb-3 opacity-30" />
                        <p className="text-sm">Nema proizvoda.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        {p.image_url
                          ? <img src={p.image_url} alt="" className="w-12 h-12 rounded-lg object-cover border" />
                          : <div className="w-12 h-12 rounded-lg border bg-gray-100 flex items-center justify-center text-gray-400 text-xs">?</div>
                        }
                      </TableCell>
                      <TableCell>
                        <p className="text-xs text-muted-foreground font-medium">{p.brand}</p>
                        <p className="font-semibold text-sm leading-tight mt-0.5">{p.title}</p>
                        {p.badge && <Badge variant="warning" className="mt-1 text-[10px]">{p.badge}</Badge>}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">{p.category}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className={`font-bold text-sm ${p.old_price ? 'text-emerald-600' : 'text-gray-900'}`}>
                            {Number(p.price).toFixed(2)} KM
                          </span>
                          {p.old_price && (
                            <span className="text-xs text-muted-foreground line-through">
                              {Number(p.old_price).toFixed(2)} KM
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={p.is_active}
                          onCheckedChange={() => toggleActive(p.id, p.is_active)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link to={`/admin/proizvodi/${p.id}`}>
                              <Pencil size={15} />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(p.id, p.title)}
                          >
                            <Trash2 size={15} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
