import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Loader2, Save, Trash2 } from 'lucide-react'
import { UserRole, ROLE_LABELS } from '@/types'
import type { User, Tenant } from '@/types'

export function UserFormPage() {
  const { id } = useParams()
  const [searchParams] = useSearchParams()
  const isEdit = !!id && id !== 'new'
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: UserRole.ADVISOR as string,
    tenantId: searchParams.get('tenantId') ?? '',
    phone: '',
    cpf: '',
    active: true,
  })

  const user = useQuery({
    queryKey: ['user', id],
    queryFn: () => api.get<User>(`/users/${id}`).then((r) => r.data),
    enabled: isEdit,
  })

  const tenants = useQuery({
    queryKey: ['tenants'],
    queryFn: () => api.get<Tenant[]>('/tenants').then((r) => r.data),
  })

  useEffect(() => {
    if (user.data) {
      setForm({
        name: user.data.name,
        email: user.data.email,
        password: '',
        role: user.data.role,
        tenantId: user.data.tenantId ?? '',
        phone: user.data.phone ?? '',
        cpf: user.data.cpf ?? '',
        active: user.data.active,
      })
    }
  }, [user.data])

  const save = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        role: form.role,
        tenantId: form.tenantId || null,
        phone: form.phone || null,
        cpf: form.cpf || null,
      }
      if (!isEdit) payload.password = form.password
      if (isEdit) payload.active = form.active
      return isEdit ? api.patch(`/users/${id}`, payload) : api.post('/users', payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      if (form.tenantId) qc.invalidateQueries({ queryKey: ['tenant-users', form.tenantId] })
      navigate('/users')
    },
  })

  const remove = useMutation({
    mutationFn: () => api.delete(`/users/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); navigate('/users') },
  })

  const set = (key: string, value: string | boolean) => setForm((p) => ({ ...p, [key]: value }))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/users')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{isEdit ? 'Editar Usuário' : 'Novo Usuário'}</h1>
          <p className="text-sm text-muted-foreground">{isEdit ? 'Atualize os dados do usuário' : 'Cadastre um novo usuário'}</p>
        </div>
        {isEdit && (
          <Button variant="destructive" onClick={() => { if (confirm('Excluir este usuário?')) remove.mutate() }}>
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <form onSubmit={(e) => { e.preventDefault(); save.mutate() }} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Dados Pessoais</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome *</label>
              <Input value={form.name} onChange={(e) => set('name', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">E-mail *</label>
              <Input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} required />
            </div>
            {!isEdit && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Senha *</label>
                <Input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} required minLength={6} />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Telefone</label>
              <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="(00) 00000-0000" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">CPF</label>
              <Input value={form.cpf} onChange={(e) => set('cpf', e.target.value)} placeholder="000.000.000-00" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Acesso & Permissões</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Tenant</label>
              <Select value={form.tenantId} onChange={(e) => set('tenantId', e.target.value)}>
                <option value="">Nenhum (Super Admin)</option>
                {(tenants.data ?? []).map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Perfil de Acesso *</label>
              <Select value={form.role} onChange={(e) => set('role', e.target.value)}>
                {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
            </div>
            {isEdit && (
              <div className="flex items-center gap-3">
                <Switch checked={form.active} onCheckedChange={(v) => set('active', v)} />
                <label className="text-sm font-medium">{form.active ? 'Ativo' : 'Inativo'}</label>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" onClick={() => navigate('/users')}>Cancelar</Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? 'Salvar' : 'Criar Usuário'}
          </Button>
        </div>

        {save.isError && <p className="text-sm text-destructive">Erro ao salvar. Verifique os dados.</p>}
      </form>
    </div>
  )
}
