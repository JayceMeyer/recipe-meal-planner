import { useState, useCallback } from 'react'
import { CalendarDays, Check, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useMealPlan } from '@/hooks/useMealPlan'
import { toLocalDateString } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { MealType } from '@/types/database'

const MEAL_TYPES: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
]

function getWeekStart(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return toLocalDateString(d)
}

function getUpcomingDates(): { value: string; label: string }[] {
  const dates: { value: string; label: string }[] = []
  const today = new Date()
  for (let i = 0; i < 14; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const value = toLocalDateString(d)
    const label =
      i === 0
        ? 'Today'
        : i === 1
          ? 'Tomorrow'
          : d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
    dates.push({ value, label })
  }
  return dates
}

interface AddToMealPlanProps {
  recipeId: string
}

export function AddToMealPlan({ recipeId }: AddToMealPlanProps) {
  const [open, setOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedMealType, setSelectedMealType] = useState<MealType>('dinner')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const weekStart = selectedDate ? getWeekStart(new Date(selectedDate + 'T00:00:00')) : undefined
  const { plan, createWeekPlan, addEntry } = useMealPlan(weekStart)

  const dates = getUpcomingDates()

  const handleOpen = useCallback(() => {
    setSelectedDate(dates[0].value)
    setSelectedMealType('dinner')
    setSuccess(false)
    setOpen(true)
  }, [dates])

  const handleAdd = useCallback(async () => {
    if (!selectedDate || !weekStart) return

    setSaving(true)

    let currentPlan = plan
    if (!currentPlan) {
      const newPlan = await createWeekPlan(weekStart)
      if (!newPlan) {
        setSaving(false)
        return
      }
      currentPlan = { ...newPlan, entries: [] }
    }

    const entry = await addEntry(currentPlan.id, selectedDate, selectedMealType, { recipeId })
    setSaving(false)

    if (entry) {
      setSuccess(true)
    }
  }, [selectedDate, weekStart, plan, createWeekPlan, addEntry, recipeId, selectedMealType])

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleOpen}>
        <CalendarDays className="size-4" />
        Add to Meal Plan
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add to Meal Plan</DialogTitle>
          </DialogHeader>

          {success ? (
            <div className="flex flex-col items-center py-4 gap-3">
              <div className="size-10 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="size-5 text-green-600" />
              </div>
              <p className="text-sm text-muted-foreground">Added to meal plan</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setOpen(false)
                  navigate('/meal-plan')
                }}
              >
                View Meal Plan
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Date</label>
                  <select
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {dates.map((d) => (
                      <option key={d.value} value={d.value}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Meal</label>
                  <div className="grid grid-cols-2 gap-2">
                    {MEAL_TYPES.map((mt) => (
                      <button
                        key={mt.value}
                        type="button"
                        onClick={() => setSelectedMealType(mt.value)}
                        className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                          selectedMealType === mt.value
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-input hover:bg-accent'
                        }`}
                      >
                        {mt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAdd} disabled={saving || !selectedDate}>
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Adding...
                    </>
                  ) : (
                    'Add to Plan'
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
