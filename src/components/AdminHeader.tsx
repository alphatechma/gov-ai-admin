import { Menu, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuthStore } from '@/stores/authStore'
import { useNavigate } from 'react-router-dom'

export function AdminHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-4 lg:px-6">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
        <Menu className="h-5 w-5" />
      </Button>
      <div className="hidden lg:block" />
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">{user?.name}</span>
        <Badge>{user?.role}</Badge>
        <Button variant="ghost" size="icon" onClick={() => { logout(); navigate('/login') }} title="Sair">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  )
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
      {children}
    </span>
  )
}
