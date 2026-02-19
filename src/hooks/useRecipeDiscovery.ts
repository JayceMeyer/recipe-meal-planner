import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useHousehold } from '@/contexts/HouseholdContext'
import type {
  SpoonacularSearchResponse,
  SpoonacularByIngredientsResult,
  SpoonacularRecipeDetail,
  DiscoverSearchParams,
  DiscoverResult,
} from '@/types/spoonacular'

interface UseRecipeDiscoveryResult {
  results: DiscoverResult[]
  totalResults: number
  loading: boolean
  error: string | null
  search: (params: DiscoverSearchParams) => Promise<void>
  searchByIngredients: (ingredients: string, number?: number) => Promise<void>
  getDetail: (id: number) => Promise<SpoonacularRecipeDetail | null>
  loadMore: () => Promise<void>
  reset: () => void
}

function computeIngredientMatches(
  recipeIngredients: { name: string }[],
  pantryNames: string[],
): { used: number; missed: number } {
  const pantryLower = pantryNames.map((n) => n.toLowerCase())
  let used = 0
  let missed = 0
  for (const ing of recipeIngredients) {
    const name = ing.name.toLowerCase()
    if (pantryLower.some((p) => name.includes(p) || p.includes(name))) {
      used++
    } else {
      missed++
    }
  }
  return { used, missed }
}

export function useRecipeDiscovery(): UseRecipeDiscoveryResult {
  const { household } = useHousehold()
  const [results, setResults] = useState<DiscoverResult[]>([])
  const [totalResults, setTotalResults] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastParams, setLastParams] = useState<DiscoverSearchParams | null>(null)
  const [offset, setOffset] = useState(0)

  const invokeFunction = useCallback(
    async (body: Record<string, unknown>) => {
      const { data, error: fnError } = await supabase.functions.invoke('spoonacular', {
        body: { ...body, householdId: household?.id },
      })

      if (fnError) throw new Error(fnError.message)
      if (data?.error) throw new Error(data.error)
      return data
    },
    [household],
  )

  const search = useCallback(
    async (params: DiscoverSearchParams) => {
      setLoading(true)
      setError(null)
      setLastParams(params)
      setOffset(0)

      const { pantryIngredients, ...apiParams } = params

      try {
        const data = (await invokeFunction({
          action: 'search',
          ...apiParams,
          offset: 0,
          number: params.number ?? 12,
        })) as SpoonacularSearchResponse

        const mapped: DiscoverResult[] = (data.results || []).map((r) => {
          const base: DiscoverResult = {
            id: r.id,
            title: r.title,
            image: r.image,
            readyInMinutes: r.readyInMinutes,
            servings: r.servings,
          }
          if (pantryIngredients?.length && r.extendedIngredients?.length) {
            const { used, missed } = computeIngredientMatches(
              r.extendedIngredients,
              pantryIngredients,
            )
            base.usedIngredientCount = used
            base.missedIngredientCount = missed
          }
          return base
        })

        setResults(mapped)
        setTotalResults(data.totalResults ?? 0)
        setOffset(data.number ?? mapped.length)
      } catch (err) {
        setError((err as Error).message)
        setResults([])
        setTotalResults(0)
      } finally {
        setLoading(false)
      }
    },
    [invokeFunction],
  )

  const searchByIngredients = useCallback(
    async (ingredients: string, number = 12) => {
      setLoading(true)
      setError(null)
      setLastParams({ ingredients })
      setOffset(0)

      try {
        const data = (await invokeFunction({
          action: 'searchByIngredients',
          ingredients,
          number,
        })) as SpoonacularByIngredientsResult[]

        const mapped: DiscoverResult[] = (data || []).map((r) => ({
          id: r.id,
          title: r.title,
          image: r.image,
          usedIngredientCount: r.usedIngredientCount,
          missedIngredientCount: r.missedIngredientCount,
        }))

        setResults(mapped)
        setTotalResults(mapped.length)
      } catch (err) {
        setError((err as Error).message)
        setResults([])
        setTotalResults(0)
      } finally {
        setLoading(false)
      }
    },
    [invokeFunction],
  )

  const loadMore = useCallback(async () => {
    if (!lastParams || loading) return

    setLoading(true)
    setError(null)

    const { pantryIngredients, ...apiParams } = lastParams

    try {
      const data = (await invokeFunction({
        action: 'search',
        ...apiParams,
        offset,
        number: lastParams.number ?? 12,
      })) as SpoonacularSearchResponse

      const mapped: DiscoverResult[] = (data.results || []).map((r) => {
        const base: DiscoverResult = {
          id: r.id,
          title: r.title,
          image: r.image,
          readyInMinutes: r.readyInMinutes,
          servings: r.servings,
        }
        if (pantryIngredients?.length && r.extendedIngredients?.length) {
          const { used, missed } = computeIngredientMatches(
            r.extendedIngredients,
            pantryIngredients,
          )
          base.usedIngredientCount = used
          base.missedIngredientCount = missed
        }
        return base
      })

      setResults((prev) => [...prev, ...mapped])
      setOffset((prev) => prev + (data.number ?? mapped.length))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [lastParams, offset, loading, invokeFunction])

  const getDetail = useCallback(
    async (id: number): Promise<SpoonacularRecipeDetail | null> => {
      try {
        const data = await invokeFunction({ action: 'detail', id })
        return data as SpoonacularRecipeDetail
      } catch (err) {
        setError((err as Error).message)
        return null
      }
    },
    [invokeFunction],
  )

  const reset = useCallback(() => {
    setResults([])
    setTotalResults(0)
    setError(null)
    setLastParams(null)
    setOffset(0)
  }, [])

  return {
    results,
    totalResults,
    loading,
    error,
    search,
    searchByIngredients,
    getDetail,
    loadMore,
    reset,
  }
}
