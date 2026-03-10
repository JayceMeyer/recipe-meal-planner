import { NavLink, Outlet } from 'react-router-dom'
import { LayoutDashboard, Users, Settings, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'

const adminNavItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Overview', end: true },
  { to: '/admin/users', icon: Users, label: 'Users' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
]

export function AdminLayout() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <NavLink
          to="/"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to app
        </NavLink>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      </div>

      <div className="flex gap-2 border-b">
        {adminNavItems.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </div>

      <Outlet />
    </div>
  )
}
