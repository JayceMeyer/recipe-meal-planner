import { useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  CalendarDays,
  Plus,
  X,
  UtensilsCrossed,
} from 'lucide-react'
import { useMealPlan } from '@/hooks/useMealPlan'
import { useRecipes } from '@/hooks/useRecipes'
import { RecipePickerDialog } from '@/components/RecipePickerDialog'
import { GenerateGroceryList } from '@/components/GenerateGroceryList'
import { Button } from '@/components/ui/button'
import type { MealType, Recipe } from '@/types/database'

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack']
const MEAL_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
}
const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getWeekStart(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

function getWeekDates(weekStart: string): string[] {
  const dates: string[] = []
  const start = new Date(weekStart + 'T00:00:00')
  for (let i = 0; i < 7; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    dates.push(d.toISOString().split('T')[0])
  }
  return dates
}

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  return d.getDate().toString()
}

function formatWeekRange(weekStart: string): string {
  const start = new Date(weekStart + 'T00:00:00')
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }
  return `${start.toLocaleDateString(undefined, opts)} - ${end.toLocaleDateString(undefined, opts)}`
}

function isCurrentWeek(weekStart: string): boolean {
  return weekStart === getWeekStart(new Date())
}

export function MealPlan() {
  const [weekStart, setWeekStart] = useState(() => getWeekStart(new Date()))
  const { plan, loading, error, createWeekPlan, addEntry, removeEntry } = useMealPlan(weekStart)
  const { recipes } = useRecipes()
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerTarget, setPickerTarget] = useState<{ date: string; mealType: MealType } | null>(
    null
  )

  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart])

  const recipeMap = useMemo(() => {
    const map = new Map<string, Recipe>()
    for (const r of recipes) {
      map.set(r.id, r)
    }
    return map
  }, [recipes])

  const navigateWeek = useCallback(
    (direction: number) => {
      const d = new Date(weekStart + 'T00:00:00')
      d.setDate(d.getDate() + direction * 7)
      setWeekStart(d.toISOString().split('T')[0])
    },
    [weekStart]
  )

  const handleSlotClick = useCallback(
    (date: string, mealType: MealType) => {
      setPickerTarget({ date, mealType })
      setPickerOpen(true)
    },
    []
  )

  const handleRecipeSelect = useCallback(
    async (recipe: Recipe) => {
      if (!pickerTarget) return

      let currentPlan = plan
      if (!currentPlan) {
        currentPlan = await createWeekPlan(weekStart).then((p) =>
          p ? { ...p, entries: [] } : null
        )
      }
      if (!currentPlan) return

      await addEntry(currentPlan.id, recipe.id, pickerTarget.date, pickerTarget.mealType)
      setPickerTarget(null)
    },
    [pickerTarget, plan, weekStart, createWeekPlan, addEntry]
  )

  const getEntries = useCallback(
    (date: string, mealType: MealType) => {
      if (!plan) return []
      return plan.entries.filter((e) => e.date === date && e.meal_type === mealType)
    },
    [plan]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Meal Plan</h1>
          {plan && plan.entries.length > 0 && <GenerateGroceryList plan={plan} />}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => navigateWeek(-1)}>
            <ChevronLeft className="size-4" />
          </Button>
          <button
            type="button"
            onClick={() => setWeekStart(getWeekStart(new Date()))}
            className="text-sm font-medium px-3 py-1.5 rounded-md hover:bg-accent transition-colors"
          >
            {isCurrentWeek(weekStart) ? 'This Week' : formatWeekRange(weekStart)}
          </button>
          <Button variant="outline" size="icon" onClick={() => navigateWeek(1)}>
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {!isCurrentWeek(weekStart) && (
        <p className="text-sm text-muted-foreground">{formatWeekRange(weekStart)}</p>
      )}

      {/* Desktop: full grid */}
      <div className="hidden md:block overflow-x-auto">
        <div className="grid grid-cols-[auto_repeat(7,1fr)] gap-px bg-border rounded-lg overflow-hidden min-w-[700px]">
          {/* Header row */}
          <div className="bg-background p-2" />
          {weekDates.map((date, i) => (
            <div
              key={date}
              className="bg-background p-2 text-center text-sm font-medium"
            >
              <div>{DAY_LABELS[i]}</div>
              <div className="text-muted-foreground">{formatDateShort(date)}</div>
            </div>
          ))}

          {/* Meal type rows */}
          {MEAL_TYPES.map((mealType) => (
            <>
              <div
                key={`label-${mealType}`}
                className="bg-background p-2 text-sm font-medium flex items-start pt-3"
              >
                {MEAL_LABELS[mealType]}
              </div>
              {weekDates.map((date) => {
                const entries = getEntries(date, mealType)
                return (
                  <div
                    key={`${date}-${mealType}`}
                    className="bg-background p-1.5 min-h-[80px]"
                  >
                    {entries.map((entry) => {
                      const recipe = entry.recipe_id ? recipeMap.get(entry.recipe_id) : null
                      return (
                        <div
                          key={entry.id}
                          className="group relative rounded bg-accent p-1.5 mb-1 text-xs"
                        >
                          {recipe ? (
                            <Link
                              to={`/recipes/${recipe.id}`}
                              className="flex items-center gap-1.5 hover:underline"
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
                              <span className="line-clamp-2">{recipe.title}</span>
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">{entry.notes || 'Meal'}</span>
                          )}
                          <button
                            type="button"
                            onClick={() => removeEntry(entry.id)}
                            className="absolute -top-1 -right-1 size-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      )
                    })}
                    <button
                      type="button"
                      onClick={() => handleSlotClick(date, mealType)}
                      className="flex items-center justify-center w-full rounded border border-dashed border-muted-foreground/20 p-1 text-muted-foreground/40 hover:border-primary/40 hover:text-primary/60 transition-colors"
                    >
                      <Plus className="size-3" />
                    </button>
                  </div>
                )
              })}
            </>
          ))}
        </div>
      </div>

      {/* Mobile: day-by-day list */}
      <div className="md:hidden space-y-4">
        {weekDates.map((date, i) => (
          <div key={date} className="rounded-lg border">
            <div className="p-3 border-b bg-muted/30">
              <span className="font-medium">{DAY_LABELS[i]}</span>
              <span className="text-muted-foreground ml-2 text-sm">
                {new Date(date + 'T00:00:00').toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="divide-y">
              {MEAL_TYPES.map((mealType) => {
                const entries = getEntries(date, mealType)
                return (
                  <div key={mealType} className="p-3">
                    <div className="text-xs font-medium text-muted-foreground uppercase mb-2">
                      {MEAL_LABELS[mealType]}
                    </div>
                    {entries.map((entry) => {
                      const recipe = entry.recipe_id ? recipeMap.get(entry.recipe_id) : null
                      return (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between gap-2 rounded bg-accent p-2 mb-1"
                        >
                          {recipe ? (
                            <Link
                              to={`/recipes/${recipe.id}`}
                              className="flex items-center gap-2 min-w-0 hover:underline"
                            >
                              {recipe.image_url ? (
                                <img
                                  src={recipe.image_url}
                                  alt=""
                                  className="size-8 rounded object-cover shrink-0"
                                />
                              ) : (
                                <UtensilsCrossed className="size-5 text-muted-foreground/40 shrink-0" />
                              )}
                              <span className="text-sm line-clamp-1">{recipe.title}</span>
                            </Link>
                          ) : (
                            <span className="text-sm text-muted-foreground">
                              {entry.notes || 'Meal'}
                            </span>
                          )}
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => removeEntry(entry.id)}
                          >
                            <X className="size-3" />
                          </Button>
                        </div>
                      )
                    })}
                    <button
                      type="button"
                      onClick={() => handleSlotClick(date, mealType)}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mt-1"
                    >
                      <Plus className="size-3" />
                      Add
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {!plan && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <CalendarDays className="size-12 text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground mb-1">No meals planned for this week</p>
          <p className="text-sm text-muted-foreground">
            Click any slot above to start planning
          </p>
        </div>
      )}

      <RecipePickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleRecipeSelect}
      />
    </div>
  )
}
