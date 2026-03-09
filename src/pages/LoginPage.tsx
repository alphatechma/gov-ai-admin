import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import api from '@/lib/api'
import { Loader2, Shield } from 'lucide-react'
import type { LoginResponse } from '@/types'
import { UserRole } from '@/types'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigate = useNavigate()

  const login = useMutation({
    mutationFn: () => api.post<LoginResponse>('/auth/login', { email, password }).then((r) => r.data),
    onSuccess: (data) => {
      if (data.user.role !== UserRole.SUPER_ADMIN) {
        setError('Acesso restrito a Super Admins.')
        return
      }
      setAuth(data.user, data.accessToken, data.refreshToken)
      navigate('/')
    },
    onError: () => setError('Credenciais inválidas.'),
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-bold">GoverneAI Admin</h1>
          <p className="text-sm text-muted-foreground">Painel administrativo</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-center text-xl">Entrar</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); setError(''); login.mutate() }} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">E-mail</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Senha</label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={login.isPending}>
                {login.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Entrar
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
