import { useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

interface UseRecipeNotesResult {
  saving: boolean
  error: string | null
  saveNotes: (notes: string) => void
  saveRating: (rating: number) => void
}

const DEBOUNCE_MS = 500

export function useRecipeNotes(recipeId: string | undefined): UseRecipeNotesResult {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingSaveRef = useRef<{ notes?: string | null; rating?: number | null } | null>(null)

  const saveToDatabase = useCallback(
    async (updates: { notes?: string | null; rating?: number | null }) => {
      if (!recipeId) return

      setSaving(true)
      setError(null)

      const { error: updateError } = await supabase
        .from('recipes')
        .update(updates)
        .eq('id', recipeId)

      setSaving(false)

      if (updateError) {
        setError(updateError.message)
      }
    },
    [recipeId]
  )

  const saveNotes = useCallback(
    (newNotes: string) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }

      pendingSaveRef.current = { ...pendingSaveRef.current, notes: newNotes || null }

      debounceTimerRef.current = setTimeout(() => {
        if (pendingSaveRef.current) {
          saveToDatabase(pendingSaveRef.current)
          pendingSaveRef.current = null
        }
      }, DEBOUNCE_MS)
    },
    [saveToDatabase]
  )

  const saveRating = useCallback(
    (newRating: number) => {
      saveToDatabase({ rating: newRating })
    },
    [saveToDatabase]
  )

  return {
    saving,
    error,
    saveNotes,
    saveRating,
  }
}
