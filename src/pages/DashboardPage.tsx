import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, Puzzle, CreditCard } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Visão geral da plataforma</p>
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
    </div>
  )
}
