import { useMemo } from 'react'
import { useRecipes } from './useRecipes'
import { useGroceryItems } from './useGroceryItems'
import {
  getRecipeSuggestions,
  type RecipeMatchResult,
} from '@/utils/ingredientMatcher'

interface UseRecipeSuggestionsResult {
  suggestions: RecipeMatchResult[]
  loading: boolean
  error: string | null
}

/**
 * Hook that returns recipe suggestions based on a grocery list
 * Recipes are sorted by how well they match the grocery list items
 */
export function useRecipeSuggestions(
  listId: string | undefined
): UseRecipeSuggestionsResult {
  const { recipes, loading: recipesLoading, error: recipesError } = useRecipes()
  const { items, loading: itemsLoading, error: itemsError } = useGroceryItems(listId)

  const loading = recipesLoading || itemsLoading
  const error = recipesError || itemsError

  const suggestions = useMemo(() => {
    if (loading || error || !listId) {
      return []
    }

    return getRecipeSuggestions(recipes, items)
  }, [recipes, items, loading, error, listId])

  return {
    suggestions,
    loading,
    error,
  }
}

/**
 * Hook that returns recipe suggestions using provided data
 * Useful when recipes and items are already loaded elsewhere
 */
export function useRecipeSuggestionsFromData(
  recipes: Parameters<typeof getRecipeSuggestions>[0],
  groceryItems: Parameters<typeof getRecipeSuggestions>[1]
): RecipeMatchResult[] {
  return useMemo(() => {
    return getRecipeSuggestions(recipes, groceryItems)
  }, [recipes, groceryItems])
}
