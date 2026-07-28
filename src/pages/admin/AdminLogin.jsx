import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'
import { GoogleLogo } from '@phosphor-icons/react'
import { useAdmin } from '../../store/AdminContext'
import { supabase } from '../../lib/supabase'
import Logo from '../../components/Logo'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card'

export default function AdminLogin() {
  const { signIn, admin } = useAdmin()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (admin) { navigate('/admin'); return null }

  const handleGoogleLogin = async () => {
    setError('')
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/admin` },
      })
      if (authError) throw authError
      // Browser se preusmjerava na Google — nakon povratka AdminContext
      // provjerava role='admin' u metapodacima; ako korisnik nije admin,
      // signIn ga izbacuje (vidi AdminContext.signIn / isAdminUser).
    } catch (err) {
      setError(err.message || 'Greška pri prijavi preko Google-a.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(form.email, form.password)
      navigate('/admin')
    } catch (err) {
      setError(err.message || 'Greška pri prijavi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0A0E17 0%, #101A30 45%, #0145F2 100%)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      {/* Mozaik pattern — razbija ujednačenu plavu podlogu (isti brand pattern kao ostatak sajta) */}
      <div className="absolute inset-0 ph-pattern opacity-[0.06] pointer-events-none" />

      <div className="relative w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 text-center">
          <Logo size="md" onDark />
          <div>
            <p className="text-sm text-blue-200/70 mt-1">Admin panel</p>
          </div>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-600" />
              Prijava
            </CardTitle>
            <CardDescription>Unesite vaše admin podatke.</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email adresa</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@proteinhouse.ba"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Šifra</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  required
                />
              </div>
              <Button type="submit" className="w-full mt-2 bg-[#0145F2] hover:bg-[#0136C4] text-white" disabled={loading}>
                {loading ? 'Prijavljivanje…' : 'Prijavi se'}
              </Button>
            </form>

            <div className="flex items-center gap-3 my-5">
              <div className="h-px flex-1 bg-gray-200" />
              <span className="text-xs text-muted-foreground">ili</span>
              <div className="h-px flex-1 bg-gray-200" />
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center gap-2.5"
              onClick={handleGoogleLogin}
            >
              <GoogleLogo size={16} weight="bold" /> Nastavi preko Google-a
            </Button>
            <p className="text-[11px] text-muted-foreground text-center mt-2">
              Samo nalozi s admin ulogom imaju pristup panelu.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
