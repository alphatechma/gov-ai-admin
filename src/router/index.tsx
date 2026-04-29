import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom'
import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { AdminSidebar } from '@/components/AdminSidebar'
import { AdminHeader } from '@/components/AdminHeader'

// Pages
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { TenantsListPage } from '@/pages/tenants/TenantsListPage'
import { TenantFormPage } from '@/pages/tenants/TenantFormPage'
import { TenantDetailPage } from '@/pages/tenants/TenantDetailPage'
import { UsersListPage } from '@/pages/users/UsersListPage'
import { UserFormPage } from '@/pages/users/UserFormPage'
import { ModulesPage } from '@/pages/modules/ModulesPage'
import { PlansPage } from '@/pages/plans/PlansPage'
import { ElectionsImportPage } from '@/pages/elections/ElectionsImportPage'
import { LeadsListPage } from '@/pages/leads/LeadsListPage'
import { LeadFormPage } from '@/pages/leads/LeadFormPage'
import { SubscribersListPage } from '@/pages/subscribers/SubscribersListPage'
import { SubscriberFormPage } from '@/pages/subscribers/SubscriberFormPage'
import { PaymentLinksPage } from '@/pages/payment-links/PaymentLinksPage'

function AuthGuard() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Outlet />
}

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <AuthGuard />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/tenants', element: <TenantsListPage /> },
          { path: '/tenants/new', element: <TenantFormPage /> },
          { path: '/tenants/:id', element: <TenantDetailPage /> },
          { path: '/tenants/:id/edit', element: <TenantFormPage /> },
          { path: '/users', element: <UsersListPage /> },
          { path: '/users/new', element: <UserFormPage /> },
          { path: '/users/:id/edit', element: <UserFormPage /> },
          { path: '/elections', element: <ElectionsImportPage /> },
          { path: '/modules', element: <ModulesPage /> },
          { path: '/plans', element: <PlansPage /> },
          { path: '/leads', element: <LeadsListPage /> },
          { path: '/leads/new', element: <LeadFormPage /> },
          { path: '/leads/:id/edit', element: <LeadFormPage /> },
          { path: '/payment-links', element: <PaymentLinksPage /> },
          { path: '/subscribers', element: <SubscribersListPage /> },
          { path: '/subscribers/new', element: <SubscriberFormPage /> },
          { path: '/subscribers/:id/edit', element: <SubscriberFormPage /> },
        ],
      },
    ],
  },
])
