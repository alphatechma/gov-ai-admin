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
  maxUsers: number
  price: number
  billingCycle: string
  active: boolean
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
