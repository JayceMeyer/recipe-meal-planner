import { useState, useMemo } from 'react'
import { Bot, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAIMealPlan } from '@/hooks/useAIMealPlan'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import type { MealType } from '@/types/database'
import type { AIMealPlanConfig, ExistingMealSlot, PlannedMeal } from '@/types/aiMealPlan'
import { cn } from '@/lib/utils'

const MEAL_TYPE_OPTIONS: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
]

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

interface AIGenerateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  weekDates: string[]
  existingMeals: ExistingMealSlot[]
  onMealsGenerated: (meals: PlannedMeal[]) => void
}

export function AIGenerateDialog({
  open,
  onOpenChange,
  weekDates,
  existingMeals,
  onMealsGenerated,
}: AIGenerateDialogProps) {
  const { generating, progress, error, generatePlan } = useAIMealPlan()
  const { preferences } = useUserPreferences()
  const hasOpenRouterKey = !!preferences?.openrouter_api_key

  const [selectedDays, setSelectedDays] = useState<Set<number>>(() => new Set([0, 1, 2, 3, 4, 5, 6]))
  const [selectedMealTypes, setSelectedMealTypes] = useState<Set<MealType>>(
    () => new Set(['breakfast', 'lunch', 'dinner'])
  )
  const [preserveExisting, setPreserveExisting] = useState(true)

  const toggleDay = (index: number) => {
    setSelectedDays((prev) => {
      const next = new Set(prev)
      if (next.has(index)) {
        next.delete(index)
      } else {
        next.add(index)
      }
      return next
    })
  }

  const toggleMealType = (mt: MealType) => {
    setSelectedMealTypes((prev) => {
      const next = new Set(prev)
      if (next.has(mt)) {
        next.delete(mt)
      } else {
        next.add(mt)
      }
      return next
    })
  }

  const selectedDates = useMemo(
    () => weekDates.filter((_, i) => selectedDays.has(i)),
    [weekDates, selectedDays],
  )

  const handleGenerate = async () => {
    const config: AIMealPlanConfig = {
      days: selectedDates,
      mealTypes: Array.from(selectedMealTypes),
      preserveExisting,
      existingMeals: preserveExisting ? existingMeals : [],
    }

    const meals = await generatePlan(config)
    if (meals.length > 0) {
      onMealsGenerated(meals)
      onOpenChange(false)
    }
  }

  const totalSlots = selectedDates.length * selectedMealTypes.size

  if (!hasOpenRouterKey) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="size-5" />
              AI Meal Planning
            </DialogTitle>
            <DialogDescription>
              Add an OpenRouter API key in your Profile settings to enable AI meal plan generation.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={generating ? undefined : onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5" />
            Generate Meal Plan with AI
          </DialogTitle>
          <DialogDescription>
            AI will create meals based on your pantry items, prioritizing perishables.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div>
            <p className="text-sm font-medium mb-2">Days to fill</p>
            <div className="flex flex-wrap gap-2">
              {DAY_LABELS.map((label, i) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleDay(i)}
                  disabled={generating}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                    selectedDays.has(i)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Meal types</p>
            <div className="flex flex-wrap gap-2">
              {MEAL_TYPE_OPTIONS.map((mt) => (
                <button
                  key={mt.value}
                  type="button"
                  onClick={() => toggleMealType(mt.value)}
                  disabled={generating}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                    selectedMealTypes.has(mt.value)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80',
                  )}
                >
                  {mt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="preserve"
              checked={preserveExisting}
              onCheckedChange={(checked) => setPreserveExisting(checked === true)}
              disabled={generating}
            />
            <label htmlFor="preserve" className="text-sm">
              Keep existing meals (only fill empty slots)
            </label>
          </div>

          {generating && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {progress}
            </div>
          )}

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={generating}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={generating || totalSlots === 0}
          >
            {generating ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Generate {totalSlots} meals
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
