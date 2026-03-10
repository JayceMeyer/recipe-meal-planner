import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useHousehold } from '@/contexts/HouseholdContext'
import type { Cookbook } from '@/types/database'

interface UseCookbooksResult {
  cookbooks: Cookbook[]
  loading: boolean
  error: string | null
  addCookbook: (data: {
    title: string
    author?: string | null
    isbn?: string | null
    cover_image_url?: string | null
  }) => Promise<Cookbook | null>
  deleteCookbook: (id: string) => Promise<boolean>
  refresh: () => Promise<void>
}

export function useCookbooks(): UseCookbooksResult {
  const [cookbooks, setCookbooks] = useState<Cookbook[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { household } = useHousehold()
  const isMounted = useRef(true)

  const fetchCookbooks = useCallback(async () => {
    if (!household) {
      setCookbooks([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('cookbooks')
      .select('*')
      .eq('household_id', household.id)
      .order('created_at', { ascending: false })

    if (!isMounted.current) return

    if (fetchError) {
      setError(fetchError.message)
      setCookbooks([])
    } else {
      setCookbooks(data ?? [])
    }

    setLoading(false)
  }, [household])

  useEffect(() => {
    isMounted.current = true

    const doFetch = async () => {
      if (!household) {
        setCookbooks([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('cookbooks')
        .select('*')
        .eq('household_id', household.id)
        .order('created_at', { ascending: false })

      if (!isMounted.current) return

      if (fetchError) {
        setError(fetchError.message)
        setCookbooks([])
      } else {
        setCookbooks(data ?? [])
      }

      setLoading(false)
    }

    doFetch()

    return () => {
      isMounted.current = false
    }
  }, [household])

  const addCookbook = useCallback(
    async (data: {
      title: string
      author?: string | null
      isbn?: string | null
      cover_image_url?: string | null
    }): Promise<Cookbook | null> => {
      if (!household) return null

      const { data: created, error: insertError } = await supabase
        .from('cookbooks')
        .insert({
          household_id: household.id,
          title: data.title,
          author: data.author ?? null,
          isbn: data.isbn ?? null,
          cover_image_url: data.cover_image_url ?? null,
        })
        .select()
        .single()

      if (insertError) {
        setError(insertError.message)
        return null
      }

      setCookbooks((prev) => [created, ...prev])
      return created
    },
    [household],
  )

  const deleteCookbook = useCallback(async (id: string): Promise<boolean> => {
    const { error: deleteError } = await supabase
      .from('cookbooks')
      .delete()
      .eq('id', id)

    if (deleteError) {
      setError(deleteError.message)
      return false
    }

    setCookbooks((prev) => prev.filter((c) => c.id !== id))
    return true
  }, [])

  return {
    cookbooks,
    loading,
    error,
    addCookbook,
    deleteCookbook,
    refresh: fetchCookbooks,
  }
}
