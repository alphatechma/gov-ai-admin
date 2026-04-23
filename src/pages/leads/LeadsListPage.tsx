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
import type { PaginatedLeads } from '@/types'
import { LeadFunnelStatus, LEAD_FUNNEL_STATUS_LABELS } from '@/types'
import { formatDate } from '@/lib/utils'

const STATUS_VARIANTS: Record<
  LeadFunnelStatus,
  'default' | 'secondary' | 'success' | 'warning' | 'destructive'
> = {
  NOVO: 'secondary',
  INTERESSADO: 'default',
  NEGOCIANDO: 'warning',
  FECHADO: 'success',
  PERDIDO: 'destructive',
}

export function LeadsListPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [funnelStatus, setFunnelStatus] = useState<LeadFunnelStatus | ''>('')
  const limit = 50

  const { data, isLoading } = useQuery({
    queryKey: ['leads', page, name, email, phone, funnelStatus],
    queryFn: () =>
      api
        .get<PaginatedLeads>('/leads', {
          params: {
            page,
            limit,
            name: name || undefined,
            email: email || undefined,
            phone: phone || undefined,
            funnelStatus: funnelStatus || undefined,
          },
        })
        .then((r) => r.data),
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/leads/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  })

  const resetPage = () => setPage(1)
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leads</h1>
          <p className="text-sm text-muted-foreground">
            Gestão de leads do funil comercial
          </p>
        </div>
        <Button asChild>
          <Link to="/leads/new">
            <Plus className="h-4 w-4" />
            Novo Lead
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Nome</label>
          <Input
            placeholder="Filtrar por nome..."
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              resetPage()
            }}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">E-mail</label>
          <Input
            placeholder="Filtrar por e-mail..."
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              resetPage()
            }}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Telefone</label>
          <Input
            placeholder="Filtrar por telefone..."
            value={phone}
            onChange={(e) => {
              setPhone(e.target.value)
              resetPage()
            }}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">
            Status do funil
          </label>
          <Select
            value={funnelStatus}
            onChange={(e) => {
              setFunnelStatus(e.target.value as LeadFunnelStatus | '')
              resetPage()
            }}
          >
            <option value="">Todos</option>
            {Object.values(LeadFunnelStatus).map((s) => (
              <option key={s} value={s}>
                {LEAD_FUNNEL_STATUS_LABELS[s]}
              </option>
            ))}
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
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Origem</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Última interação</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Próxima interação</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tentativas</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {(data?.data ?? []).map((l) => (
                <tr key={l.id} className="border-b hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">{l.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.email}</td>
                  <td className="px-4 py-3 text-muted-foreground">{l.phone}</td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANTS[l.funnelStatus]}>
                      {LEAD_FUNNEL_STATUS_LABELS[l.funnelStatus]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{l.source ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {l.lastInteraction ? formatDate(l.lastInteraction) : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {l.nextInteraction ? formatDate(l.nextInteraction) : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{l.contactAttempts}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/leads/${l.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm('Excluir este lead?')) remove.mutate(l.id)
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
                  <td colSpan={9} className="px-4 py-8 text-center text-muted-foreground">
                    Nenhum lead encontrado
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
