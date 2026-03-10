import { NavLink } from 'react-router-dom'
import { Home, BookOpen, ShoppingCart, User, Package, Sparkles, CalendarDays, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useUserRole } from '@/hooks/useUserRole'

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/recipes', icon: BookOpen, label: 'Recipes' },
  { to: '/meal-plan', icon: CalendarDays, label: 'Meal Plan' },
  { to: '/discover', icon: Sparkles, label: 'Discover' },
  { to: '/pantry', icon: Package, label: 'Pantry' },
  { to: '/grocery', icon: ShoppingCart, label: 'Grocery' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export function SideNav() {
  const { isAdminOrModerator } = useUserRole()

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-background">
      <nav className="flex flex-col gap-1 p-4">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
                isActive && 'bg-accent text-accent-foreground'
              )
            }
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </NavLink>
        ))}
        {isAdminOrModerator && (
          <>
            <div className="my-2 border-t" />
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground',
                  isActive && 'bg-accent text-accent-foreground'
                )
              }
            >
              <Shield className="h-5 w-5" />
              <span>Admin</span>
            </NavLink>
          </>
        )}
      </nav>
    </aside>
  )
}
