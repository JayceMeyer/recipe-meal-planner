import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BookOpen,
  Package,
  ShoppingCart,
  Sparkles,
  CalendarDays,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useHousehold } from '@/contexts/HouseholdContext'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface QuickCard {
  title: string
  icon: React.ReactNode
  href: string
  subtitle: string
  color: string
}

export function QuickAccessCards() {
  const { household } = useHousehold()
  const [recipeCount, setRecipeCount] = useState(0)
  const [pantryCount, setPantryCount] = useState(0)
  const [groceryCount, setGroceryCount] = useState(0)

  useEffect(() => {
    if (!household) return

    const fetchCounts = async () => {
      const [recipes, pantry, grocery] = await Promise.all([
        supabase
          .from('recipes')
          .select('id', { count: 'exact', head: true })
          .eq('household_id', household.id),
        supabase
          .from('pantry_items')
          .select('id', { count: 'exact', head: true })
          .eq('household_id', household.id),
        supabase
          .from('grocery_lists')
          .select('id', { count: 'exact', head: true })
          .eq('household_id', household.id),
      ])

      setRecipeCount(recipes.count ?? 0)
      setPantryCount(pantry.count ?? 0)
      setGroceryCount(grocery.count ?? 0)
    }

    fetchCounts()
  }, [household])

  const cards: QuickCard[] = [
    {
      title: 'My Recipes',
      icon: <BookOpen className="size-6" />,
      href: '/recipes',
      subtitle: `${recipeCount} recipe${recipeCount !== 1 ? 's' : ''}`,
      color: 'text-red-600',
    },
    {
      title: 'Pantry',
      icon: <Package className="size-6" />,
      href: '/pantry',
      subtitle: `${pantryCount} item${pantryCount !== 1 ? 's' : ''}`,
      color: 'text-emerald-600',
    },
    {
      title: 'Grocery Lists',
      icon: <ShoppingCart className="size-6" />,
      href: '/grocery',
      subtitle: `${groceryCount} list${groceryCount !== 1 ? 's' : ''}`,
      color: 'text-amber-600',
    },
    {
      title: 'Discover',
      icon: <Sparkles className="size-6" />,
      href: '/discover',
      subtitle: 'Find new recipes',
      color: 'text-violet-500',
    },
    {
      title: 'Meal Plan',
      icon: <CalendarDays className="size-6" />,
      href: '/meal-plan',
      subtitle: 'Plan your week',
      color: 'text-orange-600',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map((card) => (
        <Link key={card.title} to={card.href}>
          <Card className="hover:bg-accent/50 transition-colors h-full">
            <CardContent className="flex flex-col items-center text-center gap-2 py-4 px-3">
              <div className={cn(card.color)}>{card.icon}</div>
              <p className="font-medium text-sm">{card.title}</p>
              <p className="text-xs text-muted-foreground">{card.subtitle}</p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
