import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useHousehold } from '@/contexts/HouseholdContext'
import { useUserPreferences } from '@/hooks/useUserPreferences'

interface CreditPack {
  id: string
  credits: number
  label: string
}

export const CREDIT_PACKS: CreditPack[] = [
  { id: 'pack_500', credits: 500, label: '500 credits' },
  { id: 'pack_1000', credits: 1000, label: '1,000 credits' },
  { id: 'pack_2500', credits: 2500, label: '2,500 credits' },
]

interface UseCreditsResult {
  balance: number | null
  loading: boolean
  error: string | null
  isByok: boolean
  purchaseCredits: (packId: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useCredits(): UseCreditsResult {
  const [balance, setBalance] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { household } = useHousehold()
  const { preferences } = useUserPreferences()
  const isMounted = useRef(true)

  const isByok = !!preferences?.openrouter_api_key

  const fetchBalance = useCallback(async () => {
    if (!household) {
      setBalance(null)
      setLoading(false)
      return
    }

    const { data, error: fetchError } = await supabase
      .from('household_credits')
      .select('balance')
      .eq('household_id', household.id)
      .single()

    if (!isMounted.current) return

    if (fetchError) {
      setError(fetchError.message)
      setBalance(null)
    } else {
      setBalance((data as { balance: number } | null)?.balance ?? 0)
    }

    setLoading(false)
  }, [household])

  useEffect(() => {
    isMounted.current = true
    queueMicrotask(() => { fetchBalance() })
    return () => {
      isMounted.current = false
    }
  }, [fetchBalance])

  const purchaseCredits = useCallback(
    async (packId: string) => {
      if (!household) {
        setError('No household selected')
        return
      }

      setError(null)

      const { data, error: fnError } = await supabase.functions.invoke('create-checkout', {
        body: { householdId: household.id, packId },
      })

      if (fnError) {
        setError(fnError.message)
        return
      }

      if (data?.error) {
        setError(data.error)
        return
      }

      if (data?.url) {
        window.location.href = data.url
      }
    },
    [household],
  )

  return { balance, loading, error, isByok, purchaseCredits, refresh: fetchBalance }
}
