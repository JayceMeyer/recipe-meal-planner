import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Home, BookOpen, CalendarDays } from 'lucide-react'

interface Stats {
  userCount: number
  householdCount: number
  recipeCount: number
  mealPlanCount: number
}

export function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      const [usersRes, householdsRes, recipesRes, mealPlansRes] =
        await Promise.all([
          supabase.from('user_roles').select('*', { count: 'exact', head: true }),
          supabase.from('households').select('*', { count: 'exact', head: true }),
          supabase.from('recipes').select('*', { count: 'exact', head: true }),
          supabase.from('meal_plans').select('*', { count: 'exact', head: true }),
        ])

      setStats({
        userCount: usersRes.count ?? 0,
        householdCount: householdsRes.count ?? 0,
        recipeCount: recipesRes.count ?? 0,
        mealPlanCount: mealPlansRes.count ?? 0,
      })
      setLoading(false)
    }

    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!stats) return null

  const statCards = [
    { label: 'Total Users', value: stats.userCount, icon: Users },
    { label: 'Households', value: stats.householdCount, icon: Home },
    { label: 'Recipes', value: stats.recipeCount, icon: BookOpen },
    { label: 'Meal Plans', value: stats.mealPlanCount, icon: CalendarDays },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {label}
              </CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
