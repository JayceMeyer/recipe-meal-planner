import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Home, BookOpen, CalendarDays, UtensilsCrossed, Coins } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'

interface Stats {
  userCount: number
  householdCount: number
  recipeCount: number
  mealPlanCount: number
  ingredientCount: number
  totalCredits: number
}

interface CreditsByDay {
  date: string
  credits: number
}

interface CreditsByType {
  type: string
  total: number
}

export function AdminOverview() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [creditsByDay, setCreditsByDay] = useState<CreditsByDay[]>([])
  const [creditsByType, setCreditsByType] = useState<CreditsByType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      const [usersRes, householdsRes, recipesRes, mealPlansRes, ingredientsRes, creditsRes] =
        await Promise.all([
          supabase.from('user_roles').select('*', { count: 'exact', head: true }),
          supabase.from('households').select('*', { count: 'exact', head: true }),
          supabase.from('recipes').select('*', { count: 'exact', head: true }),
          supabase.from('meal_plans').select('*', { count: 'exact', head: true }),
          supabase.from('pantry_items').select('*', { count: 'exact', head: true }),
          supabase.from('household_credits').select('balance'),
        ])

      const totalCredits = (creditsRes.data ?? []).reduce(
        (sum: number, row: { balance: number }) => sum + row.balance,
        0,
      )

      setStats({
        userCount: usersRes.count ?? 0,
        householdCount: householdsRes.count ?? 0,
        recipeCount: recipesRes.count ?? 0,
        mealPlanCount: mealPlansRes.count ?? 0,
        ingredientCount: ingredientsRes.count ?? 0,
        totalCredits,
      })
    }

    async function fetchCreditCharts() {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const since = thirtyDaysAgo.toISOString()

      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('amount, type, created_at')
        .gte('created_at', since)
        .order('created_at', { ascending: true })

      if (transactions && transactions.length > 0) {
        // Aggregate by day
        const dayMap = new Map<string, number>()
        const typeMap = new Map<string, number>()

        for (const tx of transactions) {
          const day = tx.created_at.slice(0, 10)
          dayMap.set(day, (dayMap.get(day) ?? 0) + tx.amount)
          typeMap.set(tx.type, (typeMap.get(tx.type) ?? 0) + tx.amount)
        }

        const byDay: CreditsByDay[] = Array.from(dayMap.entries()).map(
          ([date, credits]) => ({ date, credits }),
        )
        setCreditsByDay(byDay)

        const byType: CreditsByType[] = Array.from(typeMap.entries()).map(
          ([type, total]) => ({ type, total }),
        )
        setCreditsByType(byType)
      }
    }

    Promise.all([fetchStats(), fetchCreditCharts()]).then(() => {
      setLoading(false)
    })
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
    { label: 'Total Ingredients', value: stats.ingredientCount, icon: UtensilsCrossed },
    { label: 'Credits in Circulation', value: stats.totalCredits.toLocaleString(), icon: Coins },
  ]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Credit Usage (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {creditsByDay.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No credit transactions in the last 30 days.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={creditsByDay}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value: string) => value.slice(5)}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="credits"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Credit Breakdown by Type</CardTitle>
          </CardHeader>
          <CardContent>
            {creditsByType.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No credit transactions to display.
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={creditsByType}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar
                    dataKey="total"
                    fill="hsl(var(--chart-2))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
