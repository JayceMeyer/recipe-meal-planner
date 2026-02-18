import { useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingCart, Loader2, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useHousehold } from '@/contexts/HouseholdContext'
import { useRecipes } from '@/hooks/useRecipes'
import {
  mergeIngredients,
  ingredientsToGroceryIngredients,
  type GroceryIngredient,
} from '@/utils/ingredientMerge'
import { categorizeIngredient } from '@/utils/ingredientCategories'
import { Button } from '@/components/ui/button'
import type { MealPlanWithEntries } from '@/hooks/useMealPlan'

interface GenerateGroceryListProps {
  plan: MealPlanWithEntries
}

export function GenerateGroceryList({ plan }: GenerateGroceryListProps) {
  const [generating, setGenerating] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { household } = useHousehold()
  const { recipes } = useRecipes()
  const navigate = useNavigate()

  const handleGenerate = useCallback(async () => {
    if (!user || !household) return

    setGenerating(true)
    setError(null)

    try {
      const recipeMap = new Map(recipes.map((r) => [r.id, r]))

      let allIngredients: GroceryIngredient[] = []
      const recipeIds = new Set<string>()

      for (const entry of plan.entries) {
        if (!entry.recipe_id) continue
        const recipe = recipeMap.get(entry.recipe_id)
        if (!recipe || recipe.ingredients.length === 0) continue
        recipeIds.add(recipe.id)
        const groceryIngredients = ingredientsToGroceryIngredients(recipe.ingredients)
        allIngredients = mergeIngredients(allIngredients, groceryIngredients)
      }

      if (allIngredients.length === 0) {
        setError('No ingredients found in planned recipes')
        setGenerating(false)
        return
      }

      const weekDate = new Date(plan.week_start + 'T00:00:00')
      const listName = `Meal Plan - ${weekDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`

      const { data: list, error: listError } = await supabase
        .from('grocery_lists')
        .insert({ user_id: user.id, household_id: household.id, name: listName })
        .select()
        .single()

      if (listError) throw new Error(listError.message)

      const items = allIngredients.map((ing) => ({
        list_id: list.id,
        ingredient_name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
        category: categorizeIngredient(ing.name),
        source_recipe_id: null as string | null,
      }))

      const { error: itemsError } = await supabase.from('grocery_items').insert(items)

      if (itemsError) throw new Error(itemsError.message)

      setSuccess(true)
      setGenerating(false)

      setTimeout(() => {
        navigate(`/grocery/${list.id}`)
      }, 1000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate grocery list')
      setGenerating(false)
    }
  }, [user, household, recipes, plan, navigate])

  if (success) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Check className="size-4 text-green-600" />
        Created! Redirecting...
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating}>
        {generating ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <ShoppingCart className="size-4" />
            Generate Grocery List
          </>
        )}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  )
}
