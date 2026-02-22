import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { CalendarDays, UtensilsCrossed } from 'lucide-react'
import { useMealPlan } from '@/hooks/useMealPlan'
import { useRecipes } from '@/hooks/useRecipes'
import { toLocalDateString } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { MealType, Recipe } from '@/types/database'

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']

function getToday(): string {
  return toLocalDateString(new Date())
}

export function TodaysMeals() {
  const { plan, loading } = useMealPlan()
  const { recipes } = useRecipes()

  const recipeMap = useMemo(() => {
    const map = new Map<string, Recipe>()
    for (const r of recipes) {
      map.set(r.id, r)
    }
    return map
  }, [recipes])

  const today = getToday()

  const todaysEntries = useMemo(() => {
    if (!plan) return []
    return plan.entries
      .filter((e) => e.date === today)
      .sort((a, b) => MEAL_ORDER.indexOf(a.meal_type) - MEAL_ORDER.indexOf(b.meal_type))
  }, [plan, today])

  if (loading) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="size-5" />
            Today's Meals
          </CardTitle>
          <Link
            to="/meal-plan"
            className="text-xs text-primary hover:underline"
          >
            View Full Week
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {todaysEntries.length === 0 ? (
          <div className="text-center py-4">
            <UtensilsCrossed className="size-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No meals planned for today</p>
            <Link
              to="/meal-plan"
              className="text-xs text-primary hover:underline mt-1 inline-block"
            >
              Plan your meals
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {todaysEntries.map((entry) => {
              const recipe = entry.recipe_id ? recipeMap.get(entry.recipe_id) : null
              return (
                <div key={entry.id} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-muted-foreground w-16 shrink-0">
                    {MEAL_LABELS[entry.meal_type]}
                  </span>
                  {recipe ? (
                    <Link
                      to={`/recipes/${recipe.id}`}
                      className="flex items-center gap-2 min-w-0 hover:underline text-sm"
                    >
                      {recipe.image_url ? (
                        <img
                          src={recipe.image_url}
                          alt=""
                          className="size-6 rounded object-cover shrink-0"
                        />
                      ) : (
                        <UtensilsCrossed className="size-4 text-muted-foreground/40 shrink-0" />
                      )}
                      <span className="line-clamp-1">{recipe.title}</span>
                    </Link>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      {entry.notes || 'Meal'}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
