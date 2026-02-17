import { useMemo } from 'react'
import { useRecipes } from './useRecipes'
import { usePantryItems } from './usePantryItems'
import {
  getRecipeSuggestions,
  getAlmostMakeableRecipes,
  type RecipeMatchResult,
} from '@/utils/ingredientMatcher'
import type { GroceryItem } from '@/types/database'

interface UsePantrySuggestionsResult {
  canMake: RecipeMatchResult[]
  almostMakeable: RecipeMatchResult[]
  loading: boolean
}

export function usePantrySuggestions(): UsePantrySuggestionsResult {
  const { recipes, loading: recipesLoading } = useRecipes()
  const { items: pantryItems, loading: pantryLoading } = usePantryItems()

  const loading = recipesLoading || pantryLoading

  const asGroceryItems: GroceryItem[] = useMemo(() => {
    return pantryItems.map((item) => ({
      id: item.id,
      list_id: '',
      ingredient_name: item.ingredient_name,
      quantity: item.quantity,
      unit: item.unit,
      checked: false,
      source_recipe_id: null,
      category: item.category,
      created_at: item.created_at,
    }))
  }, [pantryItems])

  const canMake = useMemo(() => {
    if (loading) return []
    return getRecipeSuggestions(recipes, asGroceryItems).filter(
      (r) => r.missingCount === 0
    )
  }, [recipes, asGroceryItems, loading])

  const almostMakeable = useMemo(() => {
    if (loading) return []
    return getAlmostMakeableRecipes(recipes, asGroceryItems)
  }, [recipes, asGroceryItems, loading])

  return { canMake, almostMakeable, loading }
}
