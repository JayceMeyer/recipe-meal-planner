import { useState, useCallback } from 'react'
import { scrapeRecipe, type ScrapedRecipe } from '@/lib/api'

interface UseScrapeRecipeResult {
  scrape: (url: string) => Promise<void>
  recipe: ScrapedRecipe | null
  loading: boolean
  error: string | null
  reset: () => void
}

export function useScrapeRecipe(): UseScrapeRecipeResult {
  const [recipe, setRecipe] = useState<ScrapedRecipe | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const scrape = useCallback(async (url: string) => {
    setLoading(true)
    setError(null)
    setRecipe(null)

    try {
      const response = await scrapeRecipe(url)

      if (response.success && response.recipe) {
        setRecipe(response.recipe)
      } else {
        setError(response.error || 'Failed to scrape recipe')
      }
    } catch {
      setError('Unable to connect to scraper service')
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setRecipe(null)
    setError(null)
    setLoading(false)
  }, [])

  return { scrape, recipe, loading, error, reset }
}
