import { useEffect, useState } from 'react'
import { Search, Users as UsersIcon, Shield, ShieldOff, Mail } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent } from '../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table'
import { fmtDatum } from '../../lib/date'

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        // admin_list_users je security definer RPC (supabase/admin_korisnici.sql) —
        // radi s anon kljucem, iznutra provjerava da je pozivalac admin
        const { data, error: err } = await supabase.rpc('admin_list_users')
        if (err) {
          setError(err.message.includes('admin_list_users')
            ? 'Pokrenite supabase/admin_korisnici.sql u Supabase SQL editoru da aktivirate prikaz korisnika.'
            : err.message)
          setLoading(false)
          return
        }
        // Normaliziraj u oblik koji render očekuje (user_metadata.role)
        setUsers((data ?? []).map((u) => ({
          ...u,
          user_metadata: { role: u.role, full_name: u.full_name },
        })))
      } catch (e) {
        setError(e.message || 'Greška pri učitavanju korisnika.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const toggleAdmin = async (userId, isAdmin) => {
    const { error: err } = await supabase.rpc('admin_set_role', {
      p_user_id: userId,
      p_admin:   !isAdmin,
    })
    if (err) {
      setError(err.message)
      return
    }
    setUsers((us) => us.map((u) =>
      u.id === userId
        ? { ...u, user_metadata: { ...u.user_metadata, role: isAdmin ? null : 'admin' } }
        : u
    ))
  }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    return !q || u.email?.toLowerCase().includes(q)
  })

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Korisnici</h2>
          <p className="text-sm text-muted-foreground">{users.length} registrovanih</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 text-sm">
          <p className="font-medium mb-1">Ograničen pristup</p>
          <p>{error}</p>
        </div>
      )}

      <div className="relative max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input className="pl-9" placeholder="Pretraži email…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-7 w-7 rounded-full border-4 border-gray-200 border-t-emerald-500 animate-spin" />
            </div>
          ) : filtered.length === 0 && !error ? (
            <div className="flex flex-col items-center py-16 text-muted-foreground">
              <UsersIcon size={36} className="mb-3 opacity-30" />
              <p className="text-sm">Nema registrovanih korisnika.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Uloga</TableHead>
                  <TableHead>Registrovan</TableHead>
                  <TableHead>Zadnja prijava</TableHead>
                  <TableHead className="text-right">Akcije</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => {
                  const isAdmin = u.user_metadata?.role === 'admin'
                  return (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                            {u.email?.[0]?.toUpperCase() ?? '?'}
                          </div>
                          <span className="text-sm font-medium">{u.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isAdmin
                          ? <Badge variant="emerald" className="flex w-fit items-center gap-1"><Shield size={10} /> Admin</Badge>
                          : <Badge variant="secondary">Korisnik</Badge>
                        }
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {fmtDatum(u.created_at)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {fmtDatum(u.last_sign_in_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`text-xs gap-1.5 ${isAdmin ? 'text-destructive hover:text-destructive' : 'text-emerald-600 hover:text-emerald-700'}`}
                          onClick={() => toggleAdmin(u.id, isAdmin)}
                        >
                          {isAdmin ? <><ShieldOff size={13} /> Ukloni admin</> : <><Shield size={13} /> Postavi admin</>}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
