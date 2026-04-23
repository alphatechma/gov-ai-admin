import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2, Save, Trash2 } from 'lucide-react'
import type { Subscriber, PaginatedLeads, Plan } from '@/types'

function toDateTimeInput(value: string | null): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function SubscriberFormPage() {
  const { id } = useParams()
  const isEdit = !!id && id !== 'new'
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [form, setForm] = useState({
    leadId: '',
    leadName: '',
    leadEmail: '',
    leadPhone: '',
    planId: '',
    active: true,
    startDate: '',
    endDate: '',
  })

  const subscriber = useQuery({
    queryKey: ['subscriber', id],
    queryFn: () => api.get<Subscriber>(`/subscribers/${id}`).then((r) => r.data),
    enabled: isEdit,
  })

  // Leads disponíveis (os já convertidos em subscribers já são filtrados pelo backend).
  // Em edit mode, buscamos o subscriber separadamente para mostrar o lead atual mesmo que ele
  // não apareça na listagem de /leads.
  const leads = useQuery({
    queryKey: ['leads', 'form-select'],
    queryFn: () =>
      api
        .get<PaginatedLeads>('/leads', { params: { limit: 200 } })
        .then((r) => r.data),
    enabled: !isEdit,
  })

  const plans = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.get<Plan[]>('/plans').then((r) => r.data),
  })

  useEffect(() => {
    if (subscriber.data) {
      const a = subscriber.data
      setForm({
        leadId: a.leadId,
        leadName: a.lead?.name ?? '',
        leadEmail: a.lead?.email ?? '',
        leadPhone: a.lead?.phone ?? '',
        planId: a.planId,
        active: a.active,
        startDate: toDateTimeInput(a.startDate),
        endDate: toDateTimeInput(a.endDate),
      })
    }
  }, [subscriber.data])

  const save = useMutation({
    mutationFn: async () => {
      const payload: Record<string, unknown> = {
        planId: form.planId,
        active: form.active,
        startDate: form.startDate
          ? new Date(form.startDate).toISOString()
          : undefined,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      }
      if (!isEdit) {
        payload.leadId = form.leadId
        return api.post('/subscribers', payload)
      }
      await api.patch(`/leads/${form.leadId}`, {
        name: form.leadName,
        email: form.leadEmail,
        phone: form.leadPhone,
      })
      return api.patch(`/subscribers/${id}`, payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscribers'] })
      qc.invalidateQueries({ queryKey: ['subscriber', id] })
      qc.invalidateQueries({ queryKey: ['leads'] })
      navigate('/subscribers')
    },
  })

  const remove = useMutation({
    mutationFn: () => api.delete(`/subscribers/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['subscribers'] })
      qc.invalidateQueries({ queryKey: ['leads'] })
      navigate('/subscribers')
    },
  })

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [key]: value }))

  if (isEdit && subscriber.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/subscribers')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {isEdit ? 'Editar Assinante' : 'Novo Assinante'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEdit
              ? 'Atualize os dados da assinatura'
              : 'Cadastre um novo assinante vinculado a um lead e plano'}
          </p>
        </div>
        {isEdit && (
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm('Excluir este assinante?')) remove.mutate()
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          save.mutate()
        }}
        className="space-y-6"
      >
        {isEdit && (
          <Card>
            <CardHeader>
              <CardTitle>Dados do Lead</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nome *</label>
                <Input
                  value={form.leadName}
                  onChange={(e) => set('leadName', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">E-mail *</label>
                <Input
                  type="email"
                  value={form.leadEmail}
                  onChange={(e) => set('leadEmail', e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Telefone *</label>
                <Input
                  value={form.leadPhone}
                  onChange={(e) => set('leadPhone', e.target.value)}
                  placeholder="(00) 00000-0000"
                  required
                />
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Dados da Assinatura</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {!isEdit && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Lead *</label>
                <Select
                  value={form.leadId}
                  onChange={(e) => set('leadId', e.target.value)}
                  required
                >
                  <option value="">Selecione um lead...</option>
                  {(leads.data?.data ?? []).map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} - {l.email}
                    </option>
                  ))}
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Plano *</label>
              <Select
                value={form.planId}
                onChange={(e) => set('planId', e.target.value)}
                required
              >
                <option value="">Selecione um plano...</option>
                {(plans.data ?? []).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data de início *</label>
              <Input
                type="datetime-local"
                value={form.startDate}
                onChange={(e) => set('startDate', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Data de fim</label>
              <Input
                type="datetime-local"
                value={form.endDate}
                onChange={(e) => set('endDate', e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3 sm:col-span-2">
              <Switch
                id="active"
                checked={form.active}
                onCheckedChange={(v) => set('active', v)}
              />
              <label htmlFor="active" className="text-sm font-medium">
                Assinatura ativa
              </label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/subscribers')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isEdit ? 'Salvar' : 'Criar Assinante'}
          </Button>
        </div>

        {save.isError && (
          <p className="text-sm text-destructive">
            Erro ao salvar. Verifique os dados.
          </p>
        )}
      </form>
    </div>
  )
}
