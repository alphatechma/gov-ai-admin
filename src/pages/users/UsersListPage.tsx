import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Search, Pencil } from 'lucide-react'
import type { User, Tenant } from '@/types'
import { ROLE_LABELS } from '@/types'
import { formatDate } from '@/lib/utils'

export function UsersListPage() {
  const [search, setSearch] = useState('')
  const [tenantFilter, setTenantFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get<User[]>('/users').then((r) => r.data),
  })

  const tenants = useQuery({
    queryKey: ['tenants'],
    queryFn: () => api.get<Tenant[]>('/tenants').then((r) => r.data),
  })

  const filtered = (data ?? []).filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchTenant = !tenantFilter || u.tenantId === tenantFilter
    return matchSearch && matchTenant
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Usuários</h1>
          <p className="text-sm text-muted-foreground">Gerencie os usuários da plataforma</p>
        </div>
        <Button asChild><Link to="/users/new"><Plus className="h-4 w-4" />Novo Usuário</Link></Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou e-mail..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={tenantFilter} onChange={(e) => setTenantFilter(e.target.value)} className="w-full sm:w-64">
          <option value="">Todos os tenants</option>
          {(tenants.data ?? []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Nome</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">E-mail</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tenant</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Perfil</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Criado em</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u.id} className="border-b hover:bg-muted/50">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                  <td className="px-4 py-3">{u.tenant?.name ?? <span className="text-muted-foreground">—</span>}</td>
                  <td className="px-4 py-3"><Badge variant="secondary">{ROLE_LABELS[u.role] ?? u.role}</Badge></td>
                  <td className="px-4 py-3">
                    <Badge variant={u.active ? 'success' : 'destructive'}>{u.active ? 'Ativo' : 'Inativo'}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/users/${u.id}/edit`}><Pencil className="h-4 w-4" /></Link>
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">Nenhum usuário encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
