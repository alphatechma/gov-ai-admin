import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, Puzzle, CreditCard, LogOut, Loader2, AlertTriangle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Tenant, User, Plan, SystemModule } from '@/types'

function StatCard({ label, value, icon: Icon, isLoading }: { label: string; value: number; icon: React.ElementType; isLoading: boolean }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
          <Icon className="h-6 w-6 text-foreground" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          {isLoading ? <Skeleton className="h-8 w-16" /> : <p className="text-3xl font-bold">{value}</p>}
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardPage() {
  const tenants = useQuery({ queryKey: ['tenants'], queryFn: () => api.get<Tenant[]>('/tenants').then((r) => r.data) })
  const users = useQuery({ queryKey: ['users'], queryFn: () => api.get<User[]>('/users').then((r) => r.data) })
  const plans = useQuery({ queryKey: ['plans'], queryFn: () => api.get<Plan[]>('/plans').then((r) => r.data) })
  const modules = useQuery({ queryKey: ['system-modules'], queryFn: () => api.get<SystemModule[]>('/modules/system').then((r) => r.data) })

  const loading = tenants.isLoading || users.isLoading || plans.isLoading || modules.isLoading

  const [kickDialogOpen, setKickDialogOpen] = useState(false)
  const [kickResult, setKickResult] = useState<{ affected: number } | null>(null)

  const kickAllMutation = useMutation({
    mutationFn: () =>
      api
        .post<{ affected: number; sessionsValidAfter: string }>('/auth/sessions/kick-all')
        .then((r) => r.data),
    onSuccess: (data) => {
      setKickResult({ affected: data.affected })
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Visão geral da plataforma</p>
        </div>
        <Button
          variant="destructive"
          onClick={() => {
            setKickResult(null)
            setKickDialogOpen(true)
          }}
        >
          <LogOut className="h-4 w-4" />
          Derrubar Sessões
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Tenants" value={tenants.data?.length ?? 0} icon={Building2} isLoading={loading} />
        <StatCard label="Usuários" value={users.data?.length ?? 0} icon={Users} isLoading={loading} />
        <StatCard label="Planos" value={plans.data?.length ?? 0} icon={CreditCard} isLoading={loading} />
        <StatCard label="Módulos" value={modules.data?.length ?? 0} icon={Puzzle} isLoading={loading} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-lg">Tenants Recentes</CardTitle></CardHeader>
          <CardContent>
            {tenants.data?.slice(0, 5).map((t) => (
              <div key={t.id} className="flex items-center justify-between border-b py-3 last:border-0">
                <div>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.politicalProfile} — {t.state}</p>
                </div>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${t.active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {t.active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            )) ?? <p className="text-sm text-muted-foreground">Nenhum tenant</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Últimos Usuários</CardTitle></CardHeader>
          <CardContent>
            {users.data?.slice(0, 5).map((u) => (
              <div key={u.id} className="flex items-center justify-between border-b py-3 last:border-0">
                <div>
                  <p className="text-sm font-medium">{u.name}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                </div>
                <span className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-xs font-medium">{u.role}</span>
              </div>
            )) ?? <p className="text-sm text-muted-foreground">Nenhum usuário</p>}
          </CardContent>
        </Card>
      </div>

      <Dialog
        open={kickDialogOpen}
        onOpenChange={(open) => {
          setKickDialogOpen(open)
          if (!open) {
            setKickResult(null)
            kickAllMutation.reset()
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Derrubar todas as sessões
            </DialogTitle>
            <DialogDescription>
              Todos os usuários da plataforma serão deslogados e precisarão fazer login
              novamente. Use esta ação após subir uma nova versão para garantir que as
              mudanças sejam aplicadas imediatamente.
            </DialogDescription>
          </DialogHeader>

          {kickResult ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              <p className="font-medium">Sessões derrubadas com sucesso</p>
              <p className="text-green-700">
                <strong>{kickResult.affected}</strong>{' '}
                {kickResult.affected === 1 ? 'usuário foi' : 'usuários foram'} deslogado
                {kickResult.affected === 1 ? '' : 's'}. Sua sessão foi preservada.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-medium">Esta ação é imediata e irreversível</p>
              <p className="text-amber-700">
                Sua sessão atual será preservada, mas todos os outros usuários serão
                forçados a fazer login novamente.
              </p>
            </div>
          )}

          <DialogFooter>
            {kickResult ? (
              <Button variant="outline" onClick={() => setKickDialogOpen(false)}>
                Fechar
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setKickDialogOpen(false)}
                  disabled={kickAllMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => kickAllMutation.mutate()}
                  disabled={kickAllMutation.isPending}
                >
                  {kickAllMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Derrubando...
                    </>
                  ) : (
                    <>
                      <LogOut className="h-4 w-4" />
                      Confirmar
                    </>
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
