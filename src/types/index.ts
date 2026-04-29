export const PoliticalProfile = {
  VEREADOR: 'VEREADOR',
  PREFEITO: 'PREFEITO',
  DEPUTADO_ESTADUAL: 'DEPUTADO_ESTADUAL',
  DEPUTADO_FEDERAL: 'DEPUTADO_FEDERAL',
  SENADOR: 'SENADOR',
  GOVERNADOR: 'GOVERNADOR',
  VICE_PREFEITO: 'VICE_PREFEITO',
  VICE_GOVERNADOR: 'VICE_GOVERNADOR',
  PRESIDENTE: 'PRESIDENTE',
} as const
export type PoliticalProfile = (typeof PoliticalProfile)[keyof typeof PoliticalProfile]

export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  TENANT_ADMIN: 'TENANT_ADMIN',
  MANAGER: 'MANAGER',
  ADVISOR: 'ADVISOR',
  LEADER: 'LEADER',
  VIEWER: 'VIEWER',
} as const
export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export const PROFILE_LABELS: Record<string, string> = {
  VEREADOR: 'Vereador(a)',
  PREFEITO: 'Prefeito(a)',
  DEPUTADO_ESTADUAL: 'Deputado(a) Estadual',
  DEPUTADO_FEDERAL: 'Deputado(a) Federal',
  SENADOR: 'Senador(a)',
  GOVERNADOR: 'Governador(a)',
  VICE_PREFEITO: 'Vice-Prefeito(a)',
  VICE_GOVERNADOR: 'Vice-Governador(a)',
  PRESIDENTE: 'Presidente',
}

export const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  TENANT_ADMIN: 'Admin do Tenant',
  MANAGER: 'Gerente',
  ADVISOR: 'Assessor',
  LEADER: 'Liderança',
  VIEWER: 'Visualizador',
}

export interface Tenant {
  id: string
  name: string
  slug: string
  politicalProfile: PoliticalProfile
  party: string | null
  state: string
  city: string | null
  logoUrl: string | null
  bannerUrl: string | null
  faviconUrl: string | null
  appName: string | null
  primaryColor: string | null
  primaryColorDark: string | null
  loginBgColor: string | null
  loginBgColorEnd: string | null
  active: boolean
  planId: string | null
  plan?: Plan
  modules?: TenantModule[]
  users?: User[]
  createdAt: string
  updatedAt: string
}

export interface User {
  id: string
  tenantId: string | null
  tenant?: Tenant
  name: string
  email: string
  role: UserRole
  phone: string | null
  cpf: string | null
  avatarUrl: string | null
  active: boolean
  lastLoginAt: string | null
  createdAt: string
  updatedAt: string
}

export interface Plan {
  id: string
  name: string
  description?: string | null
  maxUsers: number
  price: number
  billingCycle: string
  active: boolean
  modules?: string[]
  createdAt: string
  updatedAt: string
}

export interface SystemModule {
  id: string
  key: string
  name: string
  description: string
  category: string
  icon: string
  availableFor: PoliticalProfile[]
  isCore: boolean
  isAddon: boolean
}

export interface TenantModule {
  id: string
  tenantId: string
  moduleKey: string
  enabled: boolean
  activatedAt: string
  module?: SystemModule
}

export interface AvailableModule extends SystemModule {
  enabled: boolean
}

export interface LoginResponse {
  accessToken: string
  refreshToken: string
  user: User
}

export const LeadFunnelStatus = {
  NOVO: 'NOVO',
  INTERESSADO: 'INTERESSADO',
  NEGOCIANDO: 'NEGOCIANDO',
  FECHADO: 'FECHADO',
  PERDIDO: 'PERDIDO',
} as const
export type LeadFunnelStatus = (typeof LeadFunnelStatus)[keyof typeof LeadFunnelStatus]

export const LEAD_FUNNEL_STATUS_LABELS: Record<LeadFunnelStatus, string> = {
  NOVO: 'Novo',
  INTERESSADO: 'Interessado',
  NEGOCIANDO: 'Negociando',
  FECHADO: 'Fechado',
  PERDIDO: 'Perdido',
}

export interface Lead {
  id: string
  name: string
  email: string
  phone: string
  notes: string | null
  source: string | null
  funnelStatus: LeadFunnelStatus
  lastInteraction: string | null
  nextInteraction: string | null
  contactAttempts: number
  planId: string | null
  plan: { id: string; name: string } | null
  createdAt: string
  updatedAt: string
}

export interface PaginatedLeads {
  data: Lead[]
  total: number
  page: number
  limit: number
}

export interface Subscriber {
  id: string
  leadId: string
  planId: string
  userId: string | null
  active: boolean
  startDate: string
  endDate: string | null
  lead?: Lead
  plan?: Plan
  user?: User | null
  createdAt: string
  updatedAt: string
}

export interface PaginatedSubscribers {
  data: Subscriber[]
  total: number
  page: number
  limit: number
}

export const PaymentType = {
  ONE_TIME: 'ONE_TIME',
  RECURRING: 'RECURRING',
} as const
export type PaymentType = (typeof PaymentType)[keyof typeof PaymentType]

export const PAYMENT_TYPE_LABELS: Record<PaymentType, string> = {
  ONE_TIME: 'Pagamento único',
  RECURRING: 'Pagamento recorrente',
}

export const CheckoutStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
} as const
export type CheckoutStatus = (typeof CheckoutStatus)[keyof typeof CheckoutStatus]

export const CHECKOUT_STATUS_LABELS: Record<CheckoutStatus, string> = {
  PENDING: 'Aguardando pagamento',
  PAID: 'Pago',
  FAILED: 'Falhou',
  CANCELLED: 'Cancelado',
  EXPIRED: 'Expirado',
}

export interface PaymentLinkResponse {
  checkoutSessionId: string
  paymentType: PaymentType
  mpResourceType: 'PREFERENCE' | 'PREAPPROVAL'
  mpResourceId: string
  paymentUrl: string
  status: CheckoutStatus
  amounts: {
    adhesion: number
    plan: number
    firstCharge: number
    recurring: number | null
    currency: 'BRL'
  }
  lead: { id: string; name: string; email: string; phone: string }
  plan: { id: string; name: string; billingCycle: string }
  createdAt: string
}

export interface PaymentLinkListItem {
  checkoutSessionId: string
  paymentType: PaymentType
  mpResourceType: 'PREFERENCE' | 'PREAPPROVAL'
  paymentUrl: string
  status: CheckoutStatus
  mpStatus: string | null
  firstChargeAmount: number
  recurringAmount: number | null
  paidAt: string | null
  createdAt: string
  lead: { id: string; name: string; email: string; phone: string } | null
  plan: { id: string; name: string; billingCycle: string } | null
}
