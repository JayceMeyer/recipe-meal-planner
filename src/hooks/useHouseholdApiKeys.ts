import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useHousehold } from '@/contexts/HouseholdContext'

interface UseHouseholdApiKeysResult {
  hasKey: boolean
  loading: boolean
  refresh: () => void
}

export function useHouseholdApiKeys(): UseHouseholdApiKeysResult {
  const { household, loading: householdLoading } = useHousehold()
  const [hasKey, setHasKey] = useState(false)
  const [loading, setLoading] = useState(true)
  const isMounted = useRef(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    isMounted.current = true

    const check = async () => {
      if (!household) {
        if (!householdLoading) setLoading(false)
        return
      }

      setLoading(true)

      const { count, error } = await supabase
        .from('user_preferences')
        .select('id', { count: 'exact', head: true })
        .eq('household_id', household.id)
        .not('spoonacular_api_key', 'is', null)

      if (!isMounted.current) return

      if (!error) {
        setHasKey((count ?? 0) > 0)
      }

      setLoading(false)
    }

    queueMicrotask(check)

    return () => {
      isMounted.current = false
    }
  }, [household, householdLoading, refreshKey])

  const refresh = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  return { hasKey, loading, refresh }
}
