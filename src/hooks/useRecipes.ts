import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Recipe } from '@/types/database'

interface UseRecipesResult {
  recipes: Recipe[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useRecipes(): UseRecipesResult {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const isMounted = useRef(true)

  const fetchRecipes = useCallback(async () => {
    if (!user) {
      setRecipes([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('recipes')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!isMounted.current) return

    if (fetchError) {
      setError(fetchError.message)
      setRecipes([])
    } else {
      setRecipes(data ?? [])
    }

    setLoading(false)
  }, [user])

  useEffect(() => {
    isMounted.current = true

    const doFetch = async () => {
      if (!user) {
        setRecipes([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (!isMounted.current) return

      if (fetchError) {
        setError(fetchError.message)
        setRecipes([])
      } else {
        setRecipes(data ?? [])
      }

      setLoading(false)
    }

    doFetch()

    return () => {
      isMounted.current = false
    }
  }, [user])

  return { recipes, loading, error, refresh: fetchRecipes }
}
