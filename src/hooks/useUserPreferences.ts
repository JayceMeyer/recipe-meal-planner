import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useHousehold } from '@/contexts/HouseholdContext'
import type { UserPreferences } from '@/types/database'

interface UseUserPreferencesResult {
  preferences: UserPreferences | null
  loading: boolean
  error: string | null
  updatePreferences: (cuisines: string[], dietary: string[]) => Promise<boolean>
  markSetupComplete: () => Promise<boolean>
  resetSetup: () => Promise<boolean>
  refresh: () => Promise<void>
}

export function useUserPreferences(): UseUserPreferencesResult {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { household } = useHousehold()
  const isMounted = useRef(true)

  const fetchOrCreate = useCallback(async () => {
    if (!user || !household) {
      setPreferences(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', user.id)
      .eq('household_id', household.id)
      .maybeSingle()

    if (!isMounted.current) return

    if (fetchError) {
      setError(fetchError.message)
      setLoading(false)
      return
    }

    if (data) {
      setPreferences(data)
      setLoading(false)
      return
    }

    const { data: created, error: createError } = await supabase
      .from('user_preferences')
      .insert({
        user_id: user.id,
        household_id: household.id,
      })
      .select()
      .single()

    if (!isMounted.current) return

    if (createError) {
      setError(createError.message)
    } else {
      setPreferences(created)
    }

    setLoading(false)
  }, [user, household])

  useEffect(() => {
    isMounted.current = true
    fetchOrCreate()
    return () => {
      isMounted.current = false
    }
  }, [fetchOrCreate])

  const updatePreferences = useCallback(
    async (cuisines: string[], dietary: string[]): Promise<boolean> => {
      if (!preferences) return false

      const { data, error: updateError } = await supabase
        .from('user_preferences')
        .update({
          cuisine_preferences: cuisines,
          dietary_restrictions: dietary,
        })
        .eq('id', preferences.id)
        .select()
        .single()

      if (updateError) {
        setError(updateError.message)
        return false
      }

      setPreferences(data)
      return true
    },
    [preferences],
  )

  const markSetupComplete = useCallback(async (): Promise<boolean> => {
    if (!preferences) return false

    const { data, error: updateError } = await supabase
      .from('user_preferences')
      .update({
        setup_completed: true,
        setup_completed_at: new Date().toISOString(),
      })
      .eq('id', preferences.id)
      .select()
      .single()

    if (updateError) {
      setError(updateError.message)
      return false
    }

    setPreferences(data)
    return true
  }, [preferences])

  const resetSetup = useCallback(async (): Promise<boolean> => {
    if (!preferences) return false

    const { data, error: updateError } = await supabase
      .from('user_preferences')
      .update({
        setup_completed: false,
        setup_completed_at: null,
      })
      .eq('id', preferences.id)
      .select()
      .single()

    if (updateError) {
      setError(updateError.message)
      return false
    }

    setPreferences(data)
    return true
  }, [preferences])

  return {
    preferences,
    loading,
    error,
    updatePreferences,
    markSetupComplete,
    resetSetup,
    refresh: fetchOrCreate,
  }
}
