import { useMemo, useCallback } from 'react'
import { useRecipes } from './useRecipes'
import { useGroceryItems } from './useGroceryItems'
import { useAddToGroceryList } from './useAddToGroceryList'
import {
  getAlmostMakeableRecipes,
  type RecipeMatchResult,
  type AlmostMakeableOptions,
} from '@/utils/ingredientMatcher'
import type { Ingredient } from '@/types/database'

interface UseAlmostMakeableRecipesResult {
  almostMakeable: RecipeMatchResult[]
  loading: boolean
  error: string | null
  addMissingIngredients: (recipeResult: RecipeMatchResult) => Promise<boolean>
}

/**
 * Hook that returns recipes that are "almost makeable" with the current grocery list
 * These are recipes missing only 1-2 ingredients (configurable)
 */
export function useAlmostMakeableRecipes(
  listId: string | undefined,
  options: AlmostMakeableOptions = {}
): UseAlmostMakeableRecipesResult {
  const { recipes, loading: recipesLoading, error: recipesError } = useRecipes()
  const { items, loading: itemsLoading, error: itemsError } = useGroceryItems(listId)
  const { addIngredient } = useAddToGroceryList(listId)

  const loading = recipesLoading || itemsLoading
  const error = recipesError || itemsError

  const almostMakeable = useMemo(() => {
    if (loading || error || !listId) {
      return []
    }

    return getAlmostMakeableRecipes(recipes, items, options)
  }, [recipes, items, loading, error, listId, options])

  const addMissingIngredients = useCallback(
    async (recipeResult: RecipeMatchResult): Promise<boolean> => {
      if (!listId || recipeResult.missingIngredients.length === 0) {
        return false
      }

      try {
        for (const ingredient of recipeResult.missingIngredients) {
          await addIngredient(ingredient, recipeResult.recipe.id)
        }
        return true
      } catch {
        return false
      }
    },
    [listId, addIngredient]
  )

  return {
    almostMakeable,
    loading,
    error,
    addMissingIngredients,
  }
}

/**
 * Hook that returns almost-makeable recipes using provided data
 * Useful when recipes and items are already loaded elsewhere
 */
export function useAlmostMakeableRecipesFromData(
  recipes: Parameters<typeof getAlmostMakeableRecipes>[0],
  groceryItems: Parameters<typeof getAlmostMakeableRecipes>[1],
  options: AlmostMakeableOptions = {}
): RecipeMatchResult[] {
  return useMemo(() => {
    return getAlmostMakeableRecipes(recipes, groceryItems, options)
  }, [recipes, groceryItems, options])
}

/**
 * Helper to format missing ingredients as a readable string
 */
export function formatMissingIngredients(ingredients: Ingredient[]): string {
  if (ingredients.length === 0) return ''
  if (ingredients.length === 1) return ingredients[0].name
  if (ingredients.length === 2) return `${ingredients[0].name} and ${ingredients[1].name}`

  const last = ingredients[ingredients.length - 1]
  const rest = ingredients.slice(0, -1)
  return `${rest.map((i) => i.name).join(', ')}, and ${last.name}`
}
