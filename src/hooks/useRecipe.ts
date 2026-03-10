import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { RecipeWithCookbook } from '@/types/database'

interface UseRecipeResult {
  recipe: RecipeWithCookbook | null
  loading: boolean
  error: string | null
  deleteRecipe: () => Promise<boolean>
  promoteRecipe: () => Promise<boolean>
}

export function useRecipe(id: string | undefined): UseRecipeResult {
  const [recipe, setRecipe] = useState<RecipeWithCookbook | null>(null)
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
        .select('*, cookbooks(title)')
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

    // Clean up stored image (fail silently)
    if (recipe?.household_id) {
      const path = `${recipe.household_id}/${id}.webp`
      await supabase.storage.from('recipe-images').remove([path]).catch(() => {})
    }

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

  const promoteRecipe = async (): Promise<boolean> => {
    if (!id) return false

    const { data, error: updateError } = await supabase
      .from('recipes')
      .update({ source: null })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      setError(updateError.message)
      return false
    }

    setRecipe(data)
    return true
  }

  return { recipe, loading, error, deleteRecipe, promoteRecipe }
}
