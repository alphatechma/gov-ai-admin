import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Search, Eye } from 'lucide-react'
import type { Tenant } from '@/types'
import { PROFILE_LABELS } from '@/types'
import { formatDate } from '@/lib/utils'

export function TenantsListPage() {
  const [search, setSearch] = useState('')
  const { data, isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => api.get<Tenant[]>('/tenants').then((r) => r.data),
  })

  const filtered = (data ?? []).filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.slug.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tenants</h1>
          <p className="text-sm text-muted-foreground">Gerencie os perfis políticos da plataforma</p>
        </div>
        <Button asChild>
          <Link to="/tenants/new"><Plus className="h-4 w-4" />Novo Tenant</Link>
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar por nome ou slug..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Perfil</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estado</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Partido</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Criado em</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.slug}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary">{PROFILE_LABELS[t.politicalProfile] ?? t.politicalProfile}</Badge>
                  </td>
                  <td className="px-4 py-3">{t.state}{t.city ? ` / ${t.city}` : ''}</td>
                  <td className="px-4 py-3">{t.party ?? '-'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={t.active ? 'success' : 'destructive'}>{t.active ? 'Ativo' : 'Inativo'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(t.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/tenants/${t.id}`}><Eye className="h-4 w-4" /></Link>
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Nenhum tenant encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
