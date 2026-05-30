import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Package, FileText, ShoppingCart, TrendingUp, ArrowRight, Users, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'

const STATUS_VARIANT = {
  'nova':       { variant: 'info',      icon: Clock },
  'potvrđena':  { variant: 'warning',   icon: CheckCircle2 },
  'isporučena': { variant: 'emerald',   icon: CheckCircle2 },
  'otkazana':   { variant: 'destructive', icon: AlertCircle },
}

function StatCard({ icon: Icon, label, value, sublabel, to, accent }) {
  return (
    <Link to={to}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer group">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${accent}`}>
              <Icon size={20} className="text-white" />
            </div>
            <ArrowRight size={16} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
          <p className="text-sm font-medium text-gray-600 mt-0.5">{label}</p>
          {sublabel && <p className="text-xs text-muted-foreground mt-1">{sublabel}</p>}
        </CardContent>
      </Card>
    </Link>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState({ products: null, posts: null, orders: null, revenue: null, users: null })
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [
          { count: products },
          { count: posts },
          { count: orders },
          { data: orderData },
        ] = await Promise.all([
          supabase.from('products').select('*', { count: 'exact', head: true }),
          supabase.from('blog_posts').select('*', { count: 'exact', head: true }),
          supabase.from('orders').select('*', { count: 'exact', head: true }),
          supabase.from('orders')
            .select('total, status, customer_name, created_at, order_number, id')
            .order('created_at', { ascending: false })
            .limit(8),
        ])
        const revenue = orderData?.reduce((s, o) => s + Number(o.total), 0) ?? 0
        setStats({ products, posts, orders, revenue })
        setRecent(orderData ?? [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="h-8 w-8 rounded-full border-4 border-gray-200 border-t-emerald-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">Dobrodošli natrag 👋</h2>
        <p className="text-sm text-muted-foreground mt-1">Evo pregleda vaše radnje danas.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package}    label="Proizvodi"      value={stats.products}   to="/admin/proizvodi" accent="bg-blue-500" />
        <StatCard icon={FileText}   label="Blog postovi"   value={stats.posts}      to="/admin/blog"      accent="bg-violet-500" />
        <StatCard icon={ShoppingCart} label="Narudžbe"     value={stats.orders}     to="/admin/narudzbe"  accent="bg-amber-500" />
        <StatCard
          icon={TrendingUp}
          label="Ukupno prihoda"
          value={stats.revenue !== null ? stats.revenue.toFixed(2) + ' KM' : '—'}
          to="/admin/narudzbe"
          accent="bg-emerald-500"
        />
      </div>

      {/* Recent orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Posljednje narudžbe</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/narudzbe" className="flex items-center gap-1 text-xs">
              Sve narudžbe <ArrowRight size={12} />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <ShoppingCart size={36} className="mb-3 opacity-30" />
              <p className="text-sm">Nema narudžbi još.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Broj narudžbe</TableHead>
                  <TableHead>Kupac</TableHead>
                  <TableHead>Iznos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Datum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recent.map((o) => {
                  const { variant } = STATUS_VARIANT[o.status] ?? { variant: 'secondary' }
                  return (
                    <TableRow key={o.order_number}>
                      <TableCell className="font-mono text-xs font-medium">{o.order_number}</TableCell>
                      <TableCell className="font-medium">{o.customer_name}</TableCell>
                      <TableCell>{Number(o.total).toFixed(2)} KM</TableCell>
                      <TableCell>
                        <Badge variant={variant}>{o.status}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {new Date(o.created_at).toLocaleDateString('bs')}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Novi proizvod', to: '/admin/proizvodi/novi', icon: Package, color: 'text-blue-600' },
          { label: 'Novi blog post', to: '/admin/blog/novi',    icon: FileText, color: 'text-violet-600' },
          { label: 'Nova ponuda',   to: '/admin/ponude',        icon: TrendingUp, color: 'text-emerald-600' },
          { label: 'Korisnici',     to: '/admin/korisnici',     icon: Users,    color: 'text-amber-600' },
        ].map(({ label, to, icon: Icon, color }) => (
          <Button key={to} variant="outline" className="h-auto py-3 flex-col gap-2 font-medium" asChild>
            <Link to={to}>
              <Icon size={18} className={color} />
              <span className="text-xs">{label}</span>
            </Link>
          </Button>
        ))}
      </div>
    </div>
  )
}
