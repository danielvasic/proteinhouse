import { useEffect, useState } from 'react'
import { Search, ChevronDown, ChevronUp, ShoppingCart, MapPin, Phone, Mail, StickyNote } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { cn } from '../../lib/utils'
import { fmtKM } from '../../lib/price'
import { fmtDatum } from '../../lib/date'

// Statusi praćenja pošiljke: nova (zaprimljena) → u_obradi → poslano → isporučena
const STATUSES = ['nova', 'u_obradi', 'poslano', 'isporučena', 'otkazana']

const STATUS_BADGE = {
  'nova':       'info',
  'u_obradi':   'warning',
  'poslano':    'secondary',
  'isporučena': 'emerald',
  'otkazana':   'destructive',
}

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
    const matchSearch = !search ||
      o.order_number.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      (o.customer_phone || '').includes(search)
    return matchStatus && matchSearch
  })

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = orders.filter((o) => o.status === s).length
    return acc
  }, {})

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Narudžbe</h2>
          <p className="text-sm text-muted-foreground">{orders.length} ukupno</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Broj / kupac / telefon…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['sve', ...STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize',
                filterStatus === s
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {s} {s !== 'sve' && <span className="ml-1 opacity-60">({counts[s] ?? 0})</span>}
            </button>
          ))}
        </div>
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
                  <TableHead>Narudžba</TableHead>
                  <TableHead>Kupac</TableHead>
                  <TableHead>Grad</TableHead>
                  <TableHead>Iznos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Datum</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <div className="flex flex-col items-center py-12 text-muted-foreground">
                        <ShoppingCart size={36} className="mb-3 opacity-30" />
                        <p className="text-sm">Nema narudžbi.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((o) => (
                    <>
                      <TableRow
                        key={o.id}
                        className={cn(expanded === o.id && 'bg-gray-50')}
                      >
                        <TableCell className="font-mono text-xs font-semibold">{o.order_number}</TableCell>
                        <TableCell>
                          <p className="font-medium text-sm">{o.customer_name}</p>
                          {o.customer_phone && <p className="text-xs text-muted-foreground">{o.customer_phone}</p>}
                        </TableCell>
                        <TableCell className="text-sm">{o.shipping_city || '—'}</TableCell>
                        <TableCell className="font-bold text-sm">{fmtKM(o.total)}</TableCell>
                        <TableCell>
                          <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v)}>
                            <SelectTrigger className="h-7 text-xs w-32">
                              <SelectValue>
                                <Badge variant={STATUS_BADGE[o.status] ?? 'secondary'} className="text-[11px]">
                                  {o.status}
                                </Badge>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {STATUSES.map((s) => (
                                <SelectItem key={s} value={s}>
                                  <Badge variant={STATUS_BADGE[s] ?? 'secondary'} className="text-[11px]">{s}</Badge>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {fmtDatum(o.created_at)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost" size="icon"
                            onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                          >
                            {expanded === o.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </Button>
                        </TableCell>
                      </TableRow>

                      {/* Expanded detail */}
                      {expanded === o.id && (
                        <TableRow key={o.id + '_exp'} className="bg-gray-50 hover:bg-gray-50">
                          <TableCell colSpan={7} className="p-0">
                            <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                              {/* Items */}
                              <div className="p-5 space-y-2">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Stavke narudžbe</p>
                                {(o.items || []).map((item, i) => (
                                  <div key={i} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-700">{item.brand} {item.title}</span>
                                    <div className="flex items-center gap-3 shrink-0 ml-4">
                                      <span className="text-muted-foreground">× {item.qty}</span>
                                      <span className="font-semibold">{fmtKM(item.price * item.qty)}</span>
                                    </div>
                                  </div>
                                ))}
                                <div className="flex justify-between font-bold text-sm pt-2 border-t mt-2">
                                  <span>Ukupno</span>
                                  <span>{fmtKM(o.total)}</span>
                                </div>
                              </div>
                              {/* Shipping */}
                              <div className="p-5 space-y-1.5">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Podaci dostave</p>
                                <div className="flex items-start gap-2 text-sm text-gray-700">
                                  <span className="font-medium">{o.customer_name}</span>
                                </div>
                                {o.customer_email && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Mail size={12} /> {o.customer_email}
                                  </div>
                                )}
                                {o.customer_phone && (
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Phone size={12} /> {o.customer_phone}
                                  </div>
                                )}
                                {(o.shipping_address || o.shipping_city) && (
                                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <MapPin size={12} className="mt-0.5 shrink-0" />
                                    <span>{[o.shipping_address, o.shipping_city].filter(Boolean).join(', ')}</span>
                                  </div>
                                )}
                                {o.notes && (
                                  <div className="flex items-start gap-2 text-sm text-muted-foreground mt-2 pt-2 border-t">
                                    <StickyNote size={12} className="mt-0.5 shrink-0" /> {o.notes}
                                  </div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
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
