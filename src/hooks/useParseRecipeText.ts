import { useState, useCallback } from 'react'
import { parseRecipeText, type ScrapedRecipe } from '@/lib/api'
import { supabase } from '@/lib/supabase'
import { useHousehold } from '@/contexts/HouseholdContext'

interface UseParseRecipeTextResult {
  parse: (text: string) => Promise<void>
  recipe: ScrapedRecipe | null
  loading: boolean
  error: string | null
  reset: () => void
}

export function useParseRecipeText(): UseParseRecipeTextResult {
  const [recipe, setRecipe] = useState<ScrapedRecipe | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { household } = useHousehold()

  const parse = useCallback(async (text: string) => {
    if (!household) {
      setError('No household selected')
      return
    }

    setLoading(true)
    setError(null)
    setRecipe(null)

    try {
      const response = await parseRecipeText(supabase, household.id, text)

      if (response.success && response.recipe) {
        setRecipe(response.recipe)
      } else {
        setError(response.error || 'Failed to parse recipe text')
      }
    } catch {
      setError('Unable to connect to recipe parser')
    } finally {
      setLoading(false)
    }
  }, [household])

  const reset = useCallback(() => {
    setRecipe(null)
    setError(null)
    setLoading(false)
  }, [])

  return { parse, recipe, loading, error, reset }
}
