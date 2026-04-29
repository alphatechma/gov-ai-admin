import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  LayoutDashboard,
  Building2,
  Users,
  Puzzle,
  CreditCard,
  Vote,
  UserCheck,
  UserCog,
  Link2,
  X,
  Shield,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Tenants', path: '/tenants', icon: Building2 },
  { label: 'Usuários', path: '/users', icon: Users },
  { label: 'Leads', path: '/leads', icon: UserCheck },
  { label: 'Pagamentos', path: '/payment-links', icon: Link2 },
  { label: 'Assinantes', path: '/subscribers', icon: UserCog },
  { label: 'Dados Eleitorais', path: '/elections', icon: Vote },
  { label: 'Módulos', path: '/modules', icon: Puzzle },
  { label: 'Planos', path: '/plans', icon: CreditCard },
]

interface Props { open: boolean; onClose: () => void }

export function AdminSidebar({ open, onClose }: Props) {
  const location = useLocation()

  return (
    <>
      {open && <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />}
      <aside className={cn(
        'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-sidebar transition-transform lg:static lg:translate-x-0',
        open ? 'translate-x-0' : '-translate-x-full',
      )}>
        <div className="flex h-16 items-center justify-between border-b px-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Shield className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold text-sidebar-foreground">Admin</span>
          </Link>
          <button onClick={onClose} className="lg:hidden text-sidebar-foreground cursor-pointer">
            <X className="h-5 w-5" />
          </button>
        </div>

        <ScrollArea className="flex-1 py-4">
          <nav className="space-y-1 px-3">
            {NAV_ITEMS.map((item) => {
              const isActive = item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-sidebar-accent text-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50',
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </ScrollArea>
      </aside>
    </>
  )
}
