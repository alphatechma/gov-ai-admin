import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, Pencil, Trash2, Shield, Puzzle, Users, Lock } from 'lucide-react'
import { PROFILE_LABELS, ROLE_LABELS } from '@/types'
import type { Tenant, AvailableModule, User } from '@/types'
import { formatDate } from '@/lib/utils'

const CATEGORY_LABELS: Record<string, string> = {
  CORE: 'Core',
  GESTAO: 'Gestão',
  ELEITORAL: 'Eleitoral',
  LEGISLATIVO: 'Legislativo',
  COMUNICACAO: 'Comunicação',
  FINANCEIRO: 'Financeiro',
  GABINETE: 'Gabinete',
  POLITICO: 'Político',
  INTELIGENCIA: 'Inteligência',
}

const CATEGORY_COLORS: Record<string, string> = {
  CORE: 'bg-gray-100 text-gray-700',
  GESTAO: 'bg-blue-100 text-blue-700',
  ELEITORAL: 'bg-green-100 text-green-700',
  LEGISLATIVO: 'bg-purple-100 text-purple-700',
  COMUNICACAO: 'bg-pink-100 text-pink-700',
  FINANCEIRO: 'bg-amber-100 text-amber-700',
  GABINETE: 'bg-cyan-100 text-cyan-700',
  POLITICO: 'bg-emerald-100 text-emerald-700',
  INTELIGENCIA: 'bg-indigo-100 text-indigo-700',
}

export function TenantDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const tenant = useQuery({
    queryKey: ['tenant', id],
    queryFn: () => api.get<Tenant>(`/tenants/${id}`).then((r) => r.data),
  })

  const availableModules = useQuery({
    queryKey: ['tenant-modules-available', id],
    queryFn: () => api.get<AvailableModule[]>(`/modules/tenant/${id}/available`).then((r) => r.data),
    enabled: !!id,
  })

  const tenantUsers = useQuery({
    queryKey: ['tenant-users', id],
    queryFn: () => api.get<User[]>(`/users?tenantId=${id}`).then((r) => r.data),
    enabled: !!id,
  })

  const toggleModule = useMutation({
    mutationFn: ({ moduleKey, enabled }: { moduleKey: string; enabled: boolean }) =>
      api.post(`/modules/tenant/${id}/toggle`, { moduleKey, enabled }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant-modules-available', id] })
      qc.invalidateQueries({ queryKey: ['tenant', id] })
    },
  })

  const deleteTenant = useMutation({
    mutationFn: () => api.delete(`/tenants/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tenants'] }); navigate('/tenants') },
  })

  if (tenant.isLoading) return <div className="space-y-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>

  const t = tenant.data
  if (!t) return <p>Tenant não encontrado.</p>

  // Group modules by category
  const modulesByCategory = (availableModules.data ?? []).reduce<Record<string, AvailableModule[]>>((acc, m) => {
    const cat = m.category || 'OUTROS'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(m)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/tenants')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{t.name}</h1>
            <Badge variant={t.active ? 'success' : 'destructive'}>{t.active ? 'Ativo' : 'Inativo'}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {PROFILE_LABELS[t.politicalProfile]} — {t.state}{t.city ? ` / ${t.city}` : ''} {t.party ? `• ${t.party}` : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to={`/tenants/${id}/edit`}><Pencil className="h-4 w-4" />Editar</Link>
          </Button>
          <Button
            variant="destructive"
            onClick={() => { if (confirm('Tem certeza que deseja excluir este tenant?')) deleteTenant.mutate() }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="info">
        <TabsList>
          <TabsTrigger value="info"><Shield className="h-4 w-4 mr-1" />Informações</TabsTrigger>
          <TabsTrigger value="modules"><Puzzle className="h-4 w-4 mr-1" />Módulos</TabsTrigger>
          <TabsTrigger value="users"><Users className="h-4 w-4 mr-1" />Usuários</TabsTrigger>
        </TabsList>

        {/* INFO TAB */}
        <TabsContent value="info">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Slug</CardTitle></CardHeader>
              <CardContent><p className="font-mono text-sm">{t.slug}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Plano</CardTitle></CardHeader>
              <CardContent><p className="text-sm font-medium">{t.plan?.name ?? 'Sem plano'}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Criado em</CardTitle></CardHeader>
              <CardContent><p className="text-sm">{formatDate(t.createdAt)}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Módulos Ativos</CardTitle></CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{(availableModules.data ?? []).filter((m) => m.enabled).length}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Usuários</CardTitle></CardHeader>
              <CardContent><p className="text-2xl font-bold">{tenantUsers.data?.length ?? 0}</p></CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* MODULES TAB */}
        <TabsContent value="modules" className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Ative ou desative módulos para este tenant. Módulos core não podem ser desativados.
          </p>

          {availableModules.isLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : (
            Object.entries(modulesByCategory).map(([category, mods]) => (
              <div key={category}>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[category] ?? 'bg-muted'}`}>
                    {CATEGORY_LABELS[category] ?? category}
                  </span>
                  <span className="text-muted-foreground">({mods.length})</span>
                </h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {mods.map((m) => (
                    <Card key={m.key} className={m.enabled ? 'border-primary/30' : ''}>
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{m.name}</p>
                            {m.isCore && (
                              <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                            )}
                            {m.isAddon && (
                              <Badge variant="warning" className="text-[10px] shrink-0">Addon</Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{m.description}</p>
                        </div>
                        <Switch
                          checked={m.enabled}
                          disabled={m.isCore}
                          onCheckedChange={(enabled) => toggleModule.mutate({ moduleKey: m.key, enabled })}
                        />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))
          )}
        </TabsContent>

        {/* USERS TAB */}
        <TabsContent value="users">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">Usuários vinculados a este tenant</p>
            <Button asChild size="sm">
              <Link to={`/users/new?tenantId=${id}`}>Novo Usuário</Link>
            </Button>
          </div>

          {tenantUsers.isLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">E-mail</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Perfil</th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(tenantUsers.data ?? []).map((u) => (
                    <tr key={u.id} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3 font-medium">{u.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                      <td className="px-4 py-3"><Badge variant="secondary">{ROLE_LABELS[u.role] ?? u.role}</Badge></td>
                      <td className="px-4 py-3">
                        <Badge variant={u.active ? 'success' : 'destructive'}>{u.active ? 'Ativo' : 'Inativo'}</Badge>
                      </td>
                    </tr>
                  ))}
                  {(tenantUsers.data ?? []).length === 0 && (
                    <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Nenhum usuário neste tenant</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
