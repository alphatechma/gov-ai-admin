import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Shield, Save, Loader2, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Papéis editáveis (SUPER_ADMIN não aparece: tem bypass total). */
const ROLES: { value: string; label: string }[] = [
  { value: 'TENANT_ADMIN', label: 'Admin do Gabinete' },
  { value: 'MANAGER', label: 'Gerente' },
  { value: 'ADVISOR', label: 'Assessor' },
  { value: 'LEADER', label: 'Liderança' },
  { value: 'VIEWER', label: 'Visualizador' },
  { value: 'ATTENDANT', label: 'Atendente' },
  { value: 'RECEPTIONIST', label: 'Recepcionista' },
]

const ACTIONS: { key: string; label: string }[] = [
  { key: 'view', label: 'Ver' },
  { key: 'create', label: 'Criar' },
  { key: 'edit', label: 'Editar' },
  { key: 'delete', label: 'Deletar' },
]

const MODULE_NAMES: Record<string, string> = {
  dashboard: 'Dashboard',
  users: 'Usuários',
  voters: 'Eleitores',
  leaders: 'Lideranças',
  heatmap: 'Mapa de Calor',
  'election-analysis': 'Análise Eleitoral',
  visits: 'Visitas',
  'help-records': 'Atendimentos',
  staff: 'Equipe/RH',
  'executive-requests': 'Ofícios/Requerimentos',
  'cabinet-visits': 'Recepção (Gabinete)',
  tasks: 'Tarefas',
  agenda: 'Agenda/Compromissos',
  projects: 'Projetos de Lei',
  bills: 'Proposições',
  amendments: 'Emendas',
  'voting-records': 'Votações',
  ceap: 'CEAP',
  'political-contacts': 'Contatos Políticos',
  chat: 'Chat',
  whatsapp: 'WhatsApp',
  ai: 'Inteligência Artificial',
  reports: 'Relatórios',
}

const permKey = (module: string, action: string) => `${module}:${action}`

interface CatalogModule {
  module: string
  actions: { action: string; key: string; description: string }[]
}

export function RolePermissionsPage() {
  const qc = useQueryClient()
  const [selectedRole, setSelectedRole] = useState<string>('MANAGER')
  const [checked, setChecked] = useState<Set<string>>(new Set())

  const catalogQuery = useQuery({
    queryKey: ['permissions-catalog'],
    queryFn: () =>
      api.get<CatalogModule[]>('/permissions/catalog').then((r) => r.data),
  })

  const rolesQuery = useQuery({
    queryKey: ['role-permissions'],
    queryFn: () =>
      api
        .get<Record<string, string[]>>('/permissions/roles')
        .then((r) => r.data),
  })

  const roleDefaults = useMemo(
    () => new Set(rolesQuery.data?.[selectedRole] ?? []),
    [rolesQuery.data, selectedRole],
  )

  // Sincroniza o estado marcado quando muda o role ou chegam os dados.
  useEffect(() => {
    setChecked(new Set(rolesQuery.data?.[selectedRole] ?? []))
  }, [selectedRole, rolesQuery.data])

  const save = useMutation({
    mutationFn: (permissions: string[]) =>
      api.put(`/permissions/roles/${selectedRole}`, { permissions }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['role-permissions'] }),
  })

  const toggle = (module: string, action: string) => {
    const key = permKey(module, action)
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
        if (action === 'view') {
          for (const a of ACTIONS) next.delete(permKey(module, a.key))
        }
      } else {
        next.add(key)
        if (action !== 'view') next.add(permKey(module, 'view'))
      }
      return next
    })
  }

  const dirty = useMemo(() => {
    if (checked.size !== roleDefaults.size) return true
    for (const k of checked) if (!roleDefaults.has(k)) return true
    return false
  }, [checked, roleDefaults])

  const isLoading = catalogQuery.isLoading || rolesQuery.isLoading
  const modules = catalogQuery.data ?? []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Permissões por Papel</h1>
        <p className="text-sm text-muted-foreground">
          Defina o que cada papel enxerga e pode fazer por padrão. Vale para
          todos os gabinetes. Exceções individuais são feitas na config de cada
          gabinete (por usuário).
        </p>
      </div>

      {/* Seletor de papel */}
      <div className="flex flex-wrap gap-2">
        {ROLES.map((r) => (
          <button
            key={r.value}
            onClick={() => setSelectedRole(r.value)}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors',
              selectedRole === r.value
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-input hover:bg-muted',
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            {ROLES.find((r) => r.value === selectedRole)?.label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-9" />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Cabeçalho */}
              <div className="grid grid-cols-[1fr_repeat(4,4rem)] items-center gap-1 border-b pb-2 text-xs font-semibold text-muted-foreground">
                <span>Módulo</span>
                {ACTIONS.map((a) => (
                  <span key={a.key} className="text-center">
                    {a.label}
                  </span>
                ))}
              </div>

              <div className="divide-y">
                {modules.map((c) => {
                  const viewChecked = checked.has(permKey(c.module, 'view'))
                  return (
                    <div
                      key={c.module}
                      className="grid grid-cols-[1fr_repeat(4,4rem)] items-center gap-1 py-2"
                    >
                      <span className="truncate text-sm font-medium">
                        {MODULE_NAMES[c.module] || c.module}
                      </span>
                      {ACTIONS.map((a) => {
                        const has = c.actions.some((x) => x.action === a.key)
                        if (!has) return <span key={a.key} />
                        const key = permKey(c.module, a.key)
                        const disabled = a.key !== 'view' && !viewChecked
                        return (
                          <span
                            key={a.key}
                            className="flex items-center justify-center"
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-input accent-primary disabled:opacity-40"
                              checked={checked.has(key)}
                              disabled={disabled}
                              onChange={() => toggle(c.module, a.key)}
                            />
                          </span>
                        )
                      })}
                    </div>
                  )
                })}
              </div>

              <div className="flex items-center justify-between border-t pt-4">
                <span className="text-xs text-muted-foreground">
                  {checked.size} permissão(ões) marcada(s)
                  {dirty && ' · alterações não salvas'}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setChecked(
                        new Set(rolesQuery.data?.[selectedRole] ?? []),
                      )
                    }
                    disabled={!dirty || save.isPending}
                  >
                    <RotateCcw className="mr-1 h-4 w-4" />
                    Desfazer
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => save.mutate([...checked])}
                    disabled={!dirty || save.isPending}
                  >
                    {save.isPending ? (
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="mr-1 h-4 w-4" />
                    )}
                    Salvar
                  </Button>
                </div>
              </div>

              {save.isSuccess && !dirty && (
                <p className="text-right text-sm text-green-600">
                  Permissões do papel atualizadas!
                </p>
              )}
              {save.isError && (
                <p className="text-right text-sm text-destructive">
                  Erro ao salvar. Você precisa estar logado como SUPER_ADMIN.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
