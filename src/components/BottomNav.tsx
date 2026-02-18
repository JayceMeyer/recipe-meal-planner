import { NavLink } from 'react-router-dom'
import { Home, BookOpen, ShoppingCart, User, Package, CalendarDays } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/recipes', icon: BookOpen, label: 'Recipes' },
  { to: '/meal-plan', icon: CalendarDays, label: 'Meal Plan' },
  { to: '/pantry', icon: Package, label: 'Pantry' },
  { to: '/grocery', icon: ShoppingCart, label: 'Grocery' },
  { to: '/profile', icon: User, label: 'Profile' },
]

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background md:hidden">
      <div className="flex items-center justify-around h-16">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center justify-center gap-1 w-full h-full text-muted-foreground transition-colors',
                isActive && 'text-primary'
              )
            }
          >
            <Icon className="h-5 w-5" />
            <span className="text-xs">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
