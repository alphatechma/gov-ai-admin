import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2, Save, Trash2 } from 'lucide-react'
import type { Lead } from '@/types'
import { LeadFunnelStatus, LEAD_FUNNEL_STATUS_LABELS } from '@/types'

function toDateTimeInput(value: string | null): string {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function LeadFormPage() {
  const { id } = useParams()
  const isEdit = !!id && id !== 'new'
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
    source: '',
    funnelStatus: LeadFunnelStatus.NOVO as LeadFunnelStatus,
    lastInteraction: '',
    nextInteraction: '',
    contactAttempts: 0,
  })

  const lead = useQuery({
    queryKey: ['lead', id],
    queryFn: () => api.get<Lead>(`/leads/${id}`).then((r) => r.data),
    enabled: isEdit,
  })

  useEffect(() => {
    if (lead.data) {
      const l = lead.data
      setForm({
        name: l.name ?? '',
        email: l.email ?? '',
        phone: l.phone ?? '',
        notes: l.notes ?? '',
        source: l.source ?? '',
        funnelStatus: l.funnelStatus,
        lastInteraction: toDateTimeInput(l.lastInteraction),
        nextInteraction: toDateTimeInput(l.nextInteraction),
        contactAttempts: l.contactAttempts ?? 0,
      })
    }
  }, [lead.data])

  const save = useMutation({
    mutationFn: () => {
      const payload: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        funnelStatus: form.funnelStatus,
        contactAttempts: Number(form.contactAttempts) || 0,
        notes: form.notes || null,
        source: form.source || null,
        lastInteraction: form.lastInteraction
          ? new Date(form.lastInteraction).toISOString()
          : null,
        nextInteraction: form.nextInteraction
          ? new Date(form.nextInteraction).toISOString()
          : null,
      }
      return isEdit
        ? api.patch(`/leads/${id}`, payload)
        : api.post('/leads', payload)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] })
      navigate('/leads')
    },
  })

  const remove = useMutation({
    mutationFn: () => api.delete(`/leads/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] })
      navigate('/leads')
    },
  })

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) =>
    setForm((p) => ({ ...p, [key]: value }))

  if (isEdit && lead.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/leads')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">
            {isEdit ? 'Editar Lead' : 'Novo Lead'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {isEdit ? 'Atualize os dados do lead' : 'Cadastre um novo lead no funil'}
          </p>
        </div>
        {isEdit && (
          <Button
            variant="destructive"
            onClick={() => {
              if (confirm('Excluir este lead?')) remove.mutate()
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
        <Card>
          <CardHeader>
            <CardTitle>Dados do Lead</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome *</label>
              <Input
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">E-mail *</label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Telefone *</label>
              <Input
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="(00) 00000-0000"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Origem</label>
              <Input
                value={form.source}
                onChange={(e) => set('source', e.target.value)}
                placeholder="Ex: site, indicação, evento..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Status do funil</label>
              <Select
                value={form.funnelStatus}
                onChange={(e) =>
                  set('funnelStatus', e.target.value as LeadFunnelStatus)
                }
              >
                {Object.values(LeadFunnelStatus).map((s) => (
                  <option key={s} value={s}>
                    {LEAD_FUNNEL_STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tentativas de contato</label>
              <Input
                type="number"
                min={0}
                value={form.contactAttempts}
                onChange={(e) =>
                  set('contactAttempts', Number(e.target.value))
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Última interação</label>
              <Input
                type="datetime-local"
                value={form.lastInteraction}
                onChange={(e) => set('lastInteraction', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Próxima interação</label>
              <Input
                type="datetime-local"
                value={form.nextInteraction}
                onChange={(e) => set('nextInteraction', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Anotações sobre o lead..."
              className="min-h-[80px]"
            />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/leads')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isEdit ? 'Salvar' : 'Criar Lead'}
          </Button>
        </div>

        {save.isError && (
          <p className="text-sm text-destructive">Erro ao salvar. Verifique os dados.</p>
        )}
      </form>
    </div>
  )
}
