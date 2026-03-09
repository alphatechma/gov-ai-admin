import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { PoliticalProfile, PROFILE_LABELS } from '@/types'
import type { Tenant, Plan } from '@/types'

const STATES = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

export function TenantFormPage() {
  const { id } = useParams()
  const isEdit = !!id && id !== 'new'
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [form, setForm] = useState({
    name: '',
    slug: '',
    politicalProfile: PoliticalProfile.VEREADOR as string,
    party: '',
    state: '',
    city: '',
    logoUrl: '',
    planId: '',
    active: true,
  })

  const tenant = useQuery({
    queryKey: ['tenant', id],
    queryFn: () => api.get<Tenant>(`/tenants/${id}`).then((r) => r.data),
    enabled: isEdit,
  })

  const plans = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.get<Plan[]>('/plans').then((r) => r.data),
  })

  useEffect(() => {
    if (tenant.data) {
      setForm({
        name: tenant.data.name,
        slug: tenant.data.slug,
        politicalProfile: tenant.data.politicalProfile,
        party: tenant.data.party ?? '',
        state: tenant.data.state,
        city: tenant.data.city ?? '',
        logoUrl: tenant.data.logoUrl ?? '',
        planId: tenant.data.planId ?? '',
        active: tenant.data.active,
      })
    }
  }, [tenant.data])

  const save = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = {
        name: form.name,
        slug: form.slug,
        politicalProfile: form.politicalProfile,
        state: form.state,
      }
      if (form.party) payload.party = form.party
      if (form.city) payload.city = form.city
      if (form.logoUrl) payload.logoUrl = form.logoUrl
      if (form.planId) payload.planId = form.planId
      if (isEdit) payload.active = form.active
      return isEdit
        ? api.patch(`/tenants/${id}`, payload)
        : api.post('/tenants', payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenants'] })
      navigate('/tenants')
    },
  })

  const set = (key: string, value: string | boolean) => setForm((p) => ({ ...p, [key]: value }))

  const autoSlug = (name: string) => {
    set('name', name)
    if (!isEdit) {
      set('slug', name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/tenants')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{isEdit ? 'Editar Tenant' : 'Novo Tenant'}</h1>
          <p className="text-sm text-muted-foreground">{isEdit ? 'Atualize os dados do tenant' : 'Cadastre um novo perfil político'}</p>
        </div>
      </div>

      <form onSubmit={(e) => { e.preventDefault(); save.mutate() }} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Informações Básicas</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome *</label>
              <Input value={form.name} onChange={(e) => autoSlug(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Slug *</label>
              <Input value={form.slug} onChange={(e) => set('slug', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Perfil Político *</label>
              <Select value={form.politicalProfile} onChange={(e) => set('politicalProfile', e.target.value)}>
                {Object.entries(PROFILE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Partido</label>
              <Input value={form.party} onChange={(e) => set('party', e.target.value)} placeholder="Ex: PL, PT, MDB..." />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Estado *</label>
              <Select value={form.state} onChange={(e) => set('state', e.target.value)} required>
                <option value="">Selecione...</option>
                {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Cidade</label>
              <Input value={form.city} onChange={(e) => set('city', e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Plano & Status</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Plano</label>
              <Select value={form.planId} onChange={(e) => set('planId', e.target.value)}>
                <option value="">Sem plano</option>
                {(plans.data ?? []).map((p) => (
                  <option key={p.id} value={p.id}>{p.name} — R$ {p.price}/mês</option>
                ))}
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
          <Button variant="outline" type="button" onClick={() => navigate('/tenants')}>Cancelar</Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isEdit ? 'Salvar Alterações' : 'Criar Tenant'}
          </Button>
        </div>

        {save.isError && (
          <p className="text-sm text-destructive">
            Erro ao salvar. Verifique os dados e tente novamente.
          </p>
        )}
      </form>
    </div>
  )
}
