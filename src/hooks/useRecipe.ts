import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { Recipe } from '@/types/database'

interface UseRecipeResult {
  recipe: Recipe | null
  loading: boolean
  error: string | null
  deleteRecipe: () => Promise<boolean>
}

export function useRecipe(id: string | undefined): UseRecipeResult {
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isMounted = useRef(true)

  useEffect(() => {
    isMounted.current = true

    const fetchRecipe = async () => {
      if (!id) {
        setRecipe(null)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single()

      if (!isMounted.current) return

      if (fetchError) {
        setError(fetchError.message)
        setRecipe(null)
      } else {
        setRecipe(data)
      }

      setLoading(false)
    }

    fetchRecipe()

    return () => {
      isMounted.current = false
    }
  }, [id])

  const deleteRecipe = async (): Promise<boolean> => {
    if (!id) return false

    const { error: deleteError } = await supabase
      .from('recipes')
      .delete()
      .eq('id', id)

    if (deleteError) {
      setError(deleteError.message)
      return false
    }

    return true
  }

  return { recipe, loading, error, deleteRecipe }
}
