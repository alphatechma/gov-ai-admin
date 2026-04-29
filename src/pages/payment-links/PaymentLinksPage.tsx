import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Check,
  Copy,
  Link2,
  Loader2,
  MessageCircle,
  RefreshCw,
  Search,
  Send,
} from 'lucide-react'
import api from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  CHECKOUT_STATUS_LABELS,
  PAYMENT_TYPE_LABELS,
  PaymentType,
  type CheckoutStatus,
  type PaginatedLeads,
  type PaymentLinkListItem,
  type PaymentLinkResponse,
  type Plan,
} from '@/types'

const STATUS_VARIANTS: Record<
  CheckoutStatus,
  'default' | 'secondary' | 'success' | 'warning' | 'destructive'
> = {
  PENDING: 'warning',
  PAID: 'success',
  FAILED: 'destructive',
  CANCELLED: 'secondary',
  EXPIRED: 'secondary',
}

function whatsappUrl(phone: string, name: string, planName: string, link: string) {
  const digits = phone.replace(/\D/g, '')
  const firstName = (name ?? '').trim().split(/\s+/)[0] || 'tudo bem'
  const msg = `Olá, ${firstName}! Conforme conversamos, segue o link para contratação do plano ${planName}: ${link}`
  return `https://wa.me/${digits}?text=${encodeURIComponent(msg)}`
}

export function PaymentLinksPage() {
  const qc = useQueryClient()

  const [leadSearch, setLeadSearch] = useState('')
  const [leadId, setLeadId] = useState('')
  const [planId, setPlanId] = useState('')
  const [paymentType, setPaymentType] = useState<PaymentType>(PaymentType.RECURRING)
  const [generated, setGenerated] = useState<PaymentLinkResponse | null>(null)
  const [copied, setCopied] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const leads = useQuery({
    queryKey: ['payment-links:leads', leadSearch],
    queryFn: () =>
      api
        .get<PaginatedLeads>('/leads', {
          params: {
            page: 1,
            limit: 50,
            name: leadSearch || undefined,
          },
        })
        .then((r) => r.data),
  })

  const plans = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.get<Plan[]>('/plans').then((r) => r.data),
  })

  const activePlans = useMemo(
    () => (plans.data ?? []).filter((p) => p.active),
    [plans.data],
  )

  const list = useQuery({
    queryKey: ['payment-links:list'],
    queryFn: () =>
      api
        .get<PaymentLinkListItem[]>('/checkout/admin/payment-links', {
          params: { limit: 50 },
        })
        .then((r) => r.data),
  })

  const selectedLead = useMemo(
    () => (leads.data?.data ?? []).find((l) => l.id === leadId) ?? null,
    [leads.data, leadId],
  )
  const selectedPlan = useMemo(
    () => activePlans.find((p) => p.id === planId) ?? null,
    [activePlans, planId],
  )

  const create = useMutation({
    mutationFn: () =>
      api
        .post<PaymentLinkResponse>('/checkout/admin/payment-links', {
          leadId,
          planId,
          paymentType,
        })
        .then((r) => r.data),
    onSuccess: (data) => {
      setGenerated(data)
      setCopied(false)
      setErrorMessage(null)
      qc.invalidateQueries({ queryKey: ['payment-links:list'] })
    },
    onError: (err: unknown) => {
      const e = err as { response?: { data?: { message?: string } } }
      setErrorMessage(
        e?.response?.data?.message ??
          'Não foi possível gerar o link de pagamento. Tente novamente.',
      )
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrorMessage(null)
    if (!leadId || !planId) return
    create.mutate()
  }

  async function handleCopy(url: string) {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  function resetSelection() {
    setGenerated(null)
    setLeadId('')
    setPlanId('')
    setPaymentType(PaymentType.RECURRING)
    setLeadSearch('')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Gerar Link de Pagamento</h1>
        <p className="text-sm text-muted-foreground">
          Selecione um lead, escolha o plano e o tipo de pagamento, e gere um
          link do Mercado Pago para enviar ao cliente.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Novo link de pagamento</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar lead</label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={leadSearch}
                    onChange={(e) => setLeadSearch(e.target.value)}
                    placeholder="Filtrar por nome..."
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Lead *</label>
                <Select
                  value={leadId}
                  onChange={(e) => setLeadId(e.target.value)}
                  required
                >
                  <option value="">
                    {leads.isLoading ? 'Carregando...' : 'Selecione um lead'}
                  </option>
                  {(leads.data?.data ?? []).map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} — {l.email}
                    </option>
                  ))}
                </Select>
                {selectedLead && (
                  <p className="text-xs text-muted-foreground">
                    Telefone: {selectedLead.phone}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Plano *</label>
                <Select
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                  required
                >
                  <option value="">
                    {plans.isLoading ? 'Carregando...' : 'Selecione um plano'}
                  </option>
                  {activePlans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {formatCurrency(p.price)} (
                      {p.billingCycle === 'MONTHLY' ? 'mensal' : 'anual'})
                    </option>
                  ))}
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Tipo de pagamento *</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(PAYMENT_TYPE_LABELS) as PaymentType[]).map(
                    (t) => (
                      <button
                        type="button"
                        key={t}
                        onClick={() => setPaymentType(t)}
                        className={
                          'rounded-md border px-3 py-2 text-sm font-medium transition-colors ' +
                          (paymentType === t
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-input bg-background text-foreground hover:bg-muted')
                        }
                      >
                        {PAYMENT_TYPE_LABELS[t]}
                      </button>
                    ),
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {paymentType === PaymentType.RECURRING
                    ? 'Cobrança mensal automática (Mercado Pago Preapproval).'
                    : 'Cobrança única (Mercado Pago Checkout Pro).'}
                </p>
              </div>

              {selectedPlan && (
                <div className="rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
                  Inclui taxa de adesão única + valor do plano. O cliente
                  receberá o e-mail de finalização de cadastro automaticamente
                  após o pagamento aprovado.
                </div>
              )}

              {errorMessage && (
                <p className="text-sm text-destructive">{errorMessage}</p>
              )}

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetSelection}
                >
                  Limpar
                </Button>
                <Button type="submit" disabled={create.isPending || !leadId || !planId}>
                  {create.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                  Gerar link de pagamento
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Link gerado</CardTitle>
          </CardHeader>
          <CardContent>
            {!generated ? (
              <p className="text-sm text-muted-foreground">
                Nenhum link gerado ainda. Preencha o formulário ao lado para
                criar um novo link de pagamento.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="rounded-md border bg-muted/40 p-3 text-sm">
                  <p>
                    <span className="font-medium">Lead:</span>{' '}
                    {generated.lead.name} ({generated.lead.email})
                  </p>
                  <p>
                    <span className="font-medium">Plano:</span>{' '}
                    {generated.plan.name}
                  </p>
                  <p>
                    <span className="font-medium">Tipo:</span>{' '}
                    {PAYMENT_TYPE_LABELS[generated.paymentType]}
                  </p>
                  <p>
                    <span className="font-medium">
                      {generated.paymentType === PaymentType.RECURRING
                        ? '1ª cobrança'
                        : 'Total a pagar'}
                      :
                    </span>{' '}
                    {formatCurrency(generated.amounts.firstCharge)}
                  </p>
                  {generated.amounts.recurring !== null && (
                    <p>
                      <span className="font-medium">A partir do 2º mês:</span>{' '}
                      {formatCurrency(generated.amounts.recurring)} / mês
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Link</label>
                  <div className="flex gap-2">
                    <Input
                      value={generated.paymentUrl}
                      readOnly
                      onFocus={(e) => e.currentTarget.select()}
                      className="font-mono text-xs"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleCopy(generated.paymentUrl)}
                    >
                      {copied ? (
                        <>
                          <Check className="h-4 w-4" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          Copiar
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button asChild variant="outline">
                    <a
                      href={generated.paymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Link2 className="h-4 w-4" />
                      Abrir
                    </a>
                  </Button>
                  {generated.lead.phone && (
                    <Button asChild>
                      <a
                        href={whatsappUrl(
                          generated.lead.phone,
                          generated.lead.name,
                          generated.plan.name,
                          generated.paymentUrl,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="h-4 w-4" />
                        Enviar pelo WhatsApp
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Histórico de links gerados</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => list.refetch()}
            disabled={list.isFetching}
          >
            {list.isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          {list.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Lead
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Plano
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Criado em
                    </th>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(list.data ?? []).map((item) => (
                    <tr key={item.checkoutSessionId} className="border-b hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {item.lead?.name ?? '—'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.lead?.email ?? '—'}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {item.plan?.name ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {PAYMENT_TYPE_LABELS[item.paymentType]}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANTS[item.status]}>
                          {CHECKOUT_STATUS_LABELS[item.status]}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopy(item.paymentUrl)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          {item.lead?.phone && item.plan && (
                            <Button variant="ghost" size="sm" asChild>
                              <a
                                href={whatsappUrl(
                                  item.lead.phone,
                                  item.lead.name,
                                  item.plan.name,
                                  item.paymentUrl,
                                )}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Send className="h-4 w-4" />
                              </a>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {(list.data ?? []).length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        Nenhum link gerado ainda
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
