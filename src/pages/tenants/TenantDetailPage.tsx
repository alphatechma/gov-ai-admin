import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
} from '@/components/ui/select'
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Shield,
  Puzzle,
  Users,
  Lock,
  Database,
  Loader2,
  AlertTriangle,
  Palette,
  Megaphone,
  Plus,
  Send,
  XCircle,
  Clock,
  Gauge,
  CheckCircle2,
  Timer,
} from 'lucide-react'
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

const MODULE_DATA_LABELS: Record<string, string> = {
  voters: 'Eleitores',
  leaders: 'Lideranças',
  visits: 'Visitas',
  'help-records': 'Atendimentos',
  tasks: 'Tarefas',
  agenda: 'Agenda',
  staff: 'Equipe',
  projects: 'Projetos de Lei',
  bills: 'Proposições',
  amendments: 'Emendas',
  'voting-records': 'Votações',
  'political-contacts': 'Rede Política',
  ceap: 'Cota Parlamentar',
  'executive-requests': 'Pedidos ao Executivo',
  chat: 'Chat',
  whatsapp: 'WhatsApp',
}

interface Broadcast {
  id: string
  title: string
  description?: string
  sent: number
  failed: number
  pending: number
  speed?: string
  successRate?: number
  estimatedTime?: string
  status: 'ACTIVE' | 'PAUSED' | 'FINISHED'
  createdAt: string
}

const BROADCAST_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Ativa',
  PAUSED: 'Pausada',
  FINISHED: 'Finalizada',
}

const BROADCAST_STATUS_VARIANTS: Record<string, 'success' | 'warning' | 'secondary'> = {
  ACTIVE: 'success',
  PAUSED: 'warning',
  FINISHED: 'secondary',
}

export function TenantDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [deletingModule, setDeletingModule] = useState<string | null>(null)

  // Broadcasts state
  const [showNewCampaign, setShowNewCampaign] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [editingBroadcast, setEditingBroadcast] = useState<Broadcast | null>(null)
  const [metricsForm, setMetricsForm] = useState({
    sent: 0, failed: 0, pending: 0,
    speed: '', successRate: '', estimatedTime: '', status: 'ACTIVE',
  })

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

  const dataCounts = useQuery({
    queryKey: ['tenant-data-counts', id],
    queryFn: () => api.get<Record<string, number>>(`/tenants/${id}/module-data-counts`).then((r) => r.data),
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

  const deleteModuleData = useMutation({
    mutationFn: (moduleKey: string) => api.delete(`/tenants/${id}/modules/${moduleKey}/data`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant-data-counts', id] })
      setDeletingModule(null)
    },
    onError: () => {
      setDeletingModule(null)
    },
  })

  const deleteTenant = useMutation({
    mutationFn: () => api.delete(`/tenants/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tenants'] }); navigate('/tenants') },
  })

  // Broadcasts queries & mutations
  const broadcasts = useQuery({
    queryKey: ['tenant-broadcasts', id],
    queryFn: () => api.get<Broadcast[]>(`/admin/tenants/${id}/broadcasts`).then((r) => r.data),
    enabled: !!id,
  })

  const createBroadcast = useMutation({
    mutationFn: (dto: { title: string; description?: string }) =>
      api.post(`/admin/tenants/${id}/broadcasts`, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant-broadcasts', id] })
      setShowNewCampaign(false)
      setNewTitle('')
      setNewDesc('')
    },
  })

  const updateBroadcast = useMutation({
    mutationFn: ({ broadcastId, dto }: { broadcastId: string; dto: object }) =>
      api.patch(`/admin/tenants/${id}/broadcasts/${broadcastId}`, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant-broadcasts', id] })
      setEditingBroadcast(null)
    },
  })

  const deleteBroadcast = useMutation({
    mutationFn: (broadcastId: string) =>
      api.delete(`/admin/tenants/${id}/broadcasts/${broadcastId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tenant-broadcasts', id] }),
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
          <TabsTrigger value="branding"><Palette className="h-4 w-4 mr-1" />Branding</TabsTrigger>
          <TabsTrigger value="broadcasts"><Megaphone className="h-4 w-4 mr-1" />Disparos</TabsTrigger>
          <TabsTrigger value="data"><Database className="h-4 w-4 mr-1" />Dados</TabsTrigger>
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

        {/* BRANDING TAB */}
        <TabsContent value="branding">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Nome do Sistema</CardTitle></CardHeader>
              <CardContent><p className="text-sm font-medium">{t.appName || 'GoverneAI (padrão)'}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Cor Primária</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {t.primaryColor ? (
                    <>
                      <div className="h-6 w-6 rounded border" style={{ backgroundColor: t.primaryColor }} />
                      <span className="text-sm font-mono">{t.primaryColor}</span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">Padrão</span>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Cor Primária Dark</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {t.primaryColorDark ? (
                    <>
                      <div className="h-6 w-6 rounded border" style={{ backgroundColor: t.primaryColorDark }} />
                      <span className="text-sm font-mono">{t.primaryColorDark}</span>
                    </>
                  ) : (
                    <span className="text-sm text-muted-foreground">Padrão</span>
                  )}
                </div>
              </CardContent>
            </Card>
            {t.logoUrl && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Logo</CardTitle></CardHeader>
                <CardContent>
                  <img src={t.logoUrl} alt="Logo" className="h-16 w-16 rounded-lg object-contain border bg-muted p-1" />
                </CardContent>
              </Card>
            )}
            {t.bannerUrl && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Banner</CardTitle></CardHeader>
                <CardContent>
                  <img src={t.bannerUrl} alt="Banner" className="h-16 w-32 rounded-lg object-cover border" />
                </CardContent>
              </Card>
            )}
            {(t.loginBgColor || t.loginBgColorEnd) && (
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Gradiente Login</CardTitle></CardHeader>
                <CardContent>
                  <div
                    className="h-16 w-32 rounded-lg"
                    style={{
                      background: `linear-gradient(to bottom, ${t.loginBgColor || '#0f3285'}, ${t.loginBgColorEnd || '#0a2460'})`,
                    }}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* DATA TAB */}
        <TabsContent value="data" className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">Atenção: esta ação é irreversível</p>
              <p className="text-sm text-amber-700">
                Ao excluir os dados de um módulo, todos os registros serão permanentemente removidos.
              </p>
            </div>
          </div>

          {dataCounts.isLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Object.entries(MODULE_DATA_LABELS).map(([moduleKey, label]) => {
                const count = dataCounts.data?.[moduleKey] ?? 0
                const isDeleting = deletingModule === moduleKey && deleteModuleData.isPending
                return (
                  <Card key={moduleKey}>
                    <CardContent className="flex items-center justify-between p-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{label}</p>
                        <p className="text-xs text-muted-foreground">
                          {count} {count === 1 ? 'registro' : 'registros'}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={count === 0 || isDeleting}
                        onClick={() => {
                          if (confirm(`Tem certeza que deseja excluir TODOS os dados de "${label}" deste tenant? Esta ação não pode ser desfeita.`)) {
                            setDeletingModule(moduleKey)
                            deleteModuleData.mutate(moduleKey)
                          }
                        }}
                      >
                        {isDeleting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                        Excluir
                      </Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* BROADCASTS TAB */}
        <TabsContent value="broadcasts" className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Gerencie campanhas de disparo e atualize as métricas manualmente.
            </p>
            <Button size="sm" onClick={() => setShowNewCampaign(true)}>
              <Plus className="h-4 w-4 mr-1" />Nova Campanha
            </Button>
          </div>

          {broadcasts.isLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
          ) : broadcasts.data?.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-10 text-center">
              <Megaphone className="h-10 w-10 text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Nenhuma campanha cadastrada</p>
              <p className="text-xs text-muted-foreground mt-1">Clique em "Nova Campanha" para começar.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {(broadcasts.data ?? []).map((b) => (
                <Card key={b.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base truncate">{b.title}</CardTitle>
                        {b.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{b.description}</p>
                        )}
                      </div>
                      <Badge variant={BROADCAST_STATUS_VARIANTS[b.status] ?? 'secondary'}>
                        {BROADCAST_STATUS_LABELS[b.status] ?? b.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-md bg-muted p-2">
                        <Send className="h-3.5 w-3.5 mx-auto mb-1 text-blue-500" />
                        <p className="text-xs text-muted-foreground">Enviadas</p>
                        <p className="font-semibold text-sm">{b.sent.toLocaleString()}</p>
                      </div>
                      <div className="rounded-md bg-muted p-2">
                        <XCircle className="h-3.5 w-3.5 mx-auto mb-1 text-red-500" />
                        <p className="text-xs text-muted-foreground">Falhas</p>
                        <p className="font-semibold text-sm">{b.failed.toLocaleString()}</p>
                      </div>
                      <div className="rounded-md bg-muted p-2">
                        <Clock className="h-3.5 w-3.5 mx-auto mb-1 text-amber-500" />
                        <p className="text-xs text-muted-foreground">Pendentes</p>
                        <p className="font-semibold text-sm">{b.pending.toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-md bg-muted p-2">
                        <Gauge className="h-3.5 w-3.5 mx-auto mb-1 text-purple-500" />
                        <p className="text-xs text-muted-foreground">Velocidade</p>
                        <p className="font-semibold text-xs">{b.speed || '—'}</p>
                      </div>
                      <div className="rounded-md bg-muted p-2">
                        <CheckCircle2 className="h-3.5 w-3.5 mx-auto mb-1 text-green-500" />
                        <p className="text-xs text-muted-foreground">Sucesso</p>
                        <p className="font-semibold text-sm">{b.successRate != null ? `${b.successRate}%` : '—'}</p>
                      </div>
                      <div className="rounded-md bg-muted p-2">
                        <Timer className="h-3.5 w-3.5 mx-auto mb-1 text-indigo-500" />
                        <p className="text-xs text-muted-foreground">Est.</p>
                        <p className="font-semibold text-xs">{b.estimatedTime || '—'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setEditingBroadcast(b)
                          setMetricsForm({
                            sent: b.sent,
                            failed: b.failed,
                            pending: b.pending,
                            speed: b.speed ?? '',
                            successRate: b.successRate != null ? String(b.successRate) : '',
                            estimatedTime: b.estimatedTime ?? '',
                            status: b.status,
                          })
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5 mr-1" />Editar Métricas
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm(`Excluir a campanha "${b.title}"?`)) {
                            deleteBroadcast.mutate(b.id)
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* DIALOG — Nova Campanha */}
        <Dialog open={showNewCampaign} onOpenChange={setShowNewCampaign}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova Campanha</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="camp-title">Título *</Label>
                <Input
                  id="camp-title"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Campanha Junho 2025"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="camp-desc">Descrição (opcional)</Label>
                <Textarea
                  id="camp-desc"
                  value={newDesc}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewDesc(e.target.value)}
                  placeholder="Descreva o objetivo desta campanha..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewCampaign(false)}>Cancelar</Button>
              <Button
                disabled={!newTitle.trim() || createBroadcast.isPending}
                onClick={() => createBroadcast.mutate({ title: newTitle.trim(), description: newDesc.trim() || undefined })}
              >
                {createBroadcast.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Criar Campanha
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* DIALOG — Editar Métricas */}
        <Dialog open={!!editingBroadcast} onOpenChange={(o) => { if (!o) setEditingBroadcast(null) }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Editar Métricas — {editingBroadcast?.title}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="m-sent">Enviadas</Label>
                <Input id="m-sent" type="number" min={0} value={metricsForm.sent}
                  onChange={(e) => setMetricsForm((f) => ({ ...f, sent: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-failed">Falhas</Label>
                <Input id="m-failed" type="number" min={0} value={metricsForm.failed}
                  onChange={(e) => setMetricsForm((f) => ({ ...f, failed: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-pending">Pendentes</Label>
                <Input id="m-pending" type="number" min={0} value={metricsForm.pending}
                  onChange={(e) => setMetricsForm((f) => ({ ...f, pending: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-speed">Velocidade</Label>
                <Input id="m-speed" placeholder="ex: 0.1 msg/min" value={metricsForm.speed}
                  onChange={(e) => setMetricsForm((f) => ({ ...f, speed: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-rate">Taxa de Sucesso (%)</Label>
                <Input id="m-rate" type="number" min={0} max={100} step={0.1} placeholder="ex: 87.5" value={metricsForm.successRate}
                  onChange={(e) => setMetricsForm((f) => ({ ...f, successRate: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="m-time">Tempo Estimado</Label>
                <Input id="m-time" placeholder="ex: 2h 30min" value={metricsForm.estimatedTime}
                  onChange={(e) => setMetricsForm((f) => ({ ...f, estimatedTime: e.target.value }))} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Status</Label>
                <Select
                  value={metricsForm.status}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setMetricsForm((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="ACTIVE">Ativa</option>
                  <option value="PAUSED">Pausada</option>
                  <option value="FINISHED">Finalizada</option>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingBroadcast(null)}>Cancelar</Button>
              <Button
                disabled={updateBroadcast.isPending}
                onClick={() => {
                  if (!editingBroadcast) return
                  updateBroadcast.mutate({
                    broadcastId: editingBroadcast.id,
                    dto: {
                      ...metricsForm,
                      successRate: metricsForm.successRate !== '' ? Number(metricsForm.successRate) : undefined,
                      speed: metricsForm.speed || undefined,
                      estimatedTime: metricsForm.estimatedTime || undefined,
                    },
                  })
                }}
              >
                {updateBroadcast.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar Métricas
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Tabs>
    </div>
  )
}
