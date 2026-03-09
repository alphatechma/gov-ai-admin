import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import type { Plan } from '@/types'
import { formatCurrency } from '@/lib/utils'

const EMPTY: Omit<Plan, 'id' | 'createdAt' | 'updatedAt'> = {
  name: '',
  maxUsers: 10,
  price: 0,
  billingCycle: 'MONTHLY',
  active: true,
}

export function PlansPage() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [form, setForm] = useState(EMPTY)

  const { data, isLoading } = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.get<Plan[]>('/plans').then((r) => r.data),
  })

  const save = useMutation({
    mutationFn: () =>
      editId
        ? api.patch(`/plans/${editId}`, form)
        : api.post('/plans', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plans'] })
      setOpen(false)
      setEditId(null)
      setForm(EMPTY)
    },
  })

  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/plans/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['plans'] }),
  })

  const openNew = () => { setForm(EMPTY); setEditId(null); setOpen(true) }
  const openEdit = (p: Plan) => {
    setForm({ name: p.name, maxUsers: p.maxUsers, price: p.price, billingCycle: p.billingCycle, active: p.active })
    setEditId(p.id)
    setOpen(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Planos</h1>
          <p className="text-sm text-muted-foreground">Gerencie os planos de assinatura</p>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4" />Novo Plano</Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}><CardContent className="p-6"><div className="h-32 animate-pulse rounded bg-muted" /></CardContent></Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {(data ?? []).map((p) => (
            <Card key={p.id} className={!p.active ? 'opacity-60' : ''}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-lg">{p.name}</CardTitle>
                <Badge variant={p.active ? 'success' : 'secondary'}>{p.active ? 'Ativo' : 'Inativo'}</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-3xl font-bold">{formatCurrency(p.price)}</p>
                  <p className="text-sm text-muted-foreground">
                    /{p.billingCycle === 'MONTHLY' ? 'mês' : 'ano'}
                  </p>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Máx. usuários</span>
                  <span className="font-medium">{p.maxUsers}</span>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(p)}>
                    <Pencil className="h-3 w-3" />Editar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => { if (confirm('Excluir este plano?')) remove.mutate(p.id) }}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {(data ?? []).length === 0 && (
            <p className="col-span-full text-center text-muted-foreground py-8">Nenhum plano cadastrado</p>
          )}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editId ? 'Editar Plano' : 'Novo Plano'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); save.mutate() }} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome *</label>
              <Input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Preço *</label>
                <Input type="number" min={0} step={0.01} value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Máx. Usuários *</label>
                <Input type="number" min={1} value={form.maxUsers} onChange={(e) => setForm((p) => ({ ...p, maxUsers: Number(e.target.value) }))} required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Ciclo de Cobrança</label>
              <Select value={form.billingCycle} onChange={(e) => setForm((p) => ({ ...p, billingCycle: e.target.value }))}>
                <option value="MONTHLY">Mensal</option>
                <option value="YEARLY">Anual</option>
              </Select>
            </div>
            {editId && (
              <div className="flex items-center gap-3">
                <Switch checked={form.active} onCheckedChange={(v) => setForm((p) => ({ ...p, active: v }))} />
                <label className="text-sm font-medium">{form.active ? 'Ativo' : 'Inativo'}</label>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {editId ? 'Salvar' : 'Criar'}
              </Button>
            </DialogFooter>
            {save.isError && <p className="text-sm text-destructive">Erro ao salvar.</p>}
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
