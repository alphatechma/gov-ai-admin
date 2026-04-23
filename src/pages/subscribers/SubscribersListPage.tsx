import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import type { PaginatedSubscribers, Plan } from '@/types'

type ActiveFilter = '' | 'true' | 'false'

export function SubscribersListPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [leadName, setLeadName] = useState('')
  const [leadEmail, setLeadEmail] = useState('')
  const [leadPhone, setLeadPhone] = useState('')
  const [planId, setPlanId] = useState('')
  const [active, setActive] = useState<ActiveFilter>('')
  const limit = 50

  const plans = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.get<Plan[]>('/plans').then((r) => r.data),
  })

  const { data, isLoading } = useQuery({
    queryKey: ['subscribers', page, leadName, leadEmail, leadPhone, planId, active],
    queryFn: () =>
      api
        .get<PaginatedSubscribers>('/subscribers', {
          params: {
            page,
            limit,
            leadName: leadName || undefined,
            leadEmail: leadEmail || undefined,
            leadPhone: leadPhone || undefined,
            planId: planId || undefined,
            active: active === '' ? undefined : active,
          },
        })
        .then((r) => r.data),
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/subscribers/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscribers'] })
      qc.invalidateQueries({ queryKey: ['leads'] })
    },
  })

  const resetPage = () => setPage(1)
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Assinantes</h1>
          <p className="text-sm text-muted-foreground">
            Gestão de assinantes dos planos contratados
          </p>
        </div>
        <Button asChild>
          <Link to="/subscribers/new">
            <Plus className="h-4 w-4" />
            Novo Assinante
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Nome</label>
          <Input
            placeholder="Filtrar por nome..."
            value={leadName}
            onChange={(e) => {
              setLeadName(e.target.value)
              resetPage()
            }}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">E-mail</label>
          <Input
            placeholder="Filtrar por e-mail..."
            value={leadEmail}
            onChange={(e) => {
              setLeadEmail(e.target.value)
              resetPage()
            }}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Telefone</label>
          <Input
            placeholder="Filtrar por telefone..."
            value={leadPhone}
            onChange={(e) => {
              setLeadPhone(e.target.value)
              resetPage()
            }}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Plano</label>
          <Select
            value={planId}
            onChange={(e) => {
              setPlanId(e.target.value)
              resetPage()
            }}
          >
            <option value="">Todos</option>
            {(plans.data ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <Select
            value={active}
            onChange={(e) => {
              setActive(e.target.value as ActiveFilter)
              resetPage()
            }}
          >
            <option value="">Todos</option>
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">E-mail</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Telefone</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Plano</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {(data?.data ?? []).map((a) => (
                <tr key={a.id} className="border-b hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">{a.lead?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.lead?.email ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{a.lead?.phone ?? '—'}</td>
                  <td className="px-4 py-3">{a.plan?.name ?? '—'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={a.active ? 'success' : 'secondary'}>
                      {a.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/subscribers/${a.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Excluir este assinante?')) remove.mutate(a.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {(data?.data ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum assinante encontrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {data && data.total > data.limit && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {data.page} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima
          </Button>
        </div>
      )}
    </div>
  )
}
