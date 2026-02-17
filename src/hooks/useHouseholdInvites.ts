import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useHousehold } from '@/contexts/HouseholdContext'
import type { HouseholdInvite } from '@/types/database'

interface UseHouseholdInvitesResult {
  invites: HouseholdInvite[]
  loading: boolean
  error: string | null
  createInvite: (email: string) => Promise<HouseholdInvite | null>
  cancelInvite: (id: string) => Promise<boolean>
  refresh: () => void
}

export function useHouseholdInvites(): UseHouseholdInvitesResult {
  const [invites, setInvites] = useState<HouseholdInvite[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { household } = useHousehold()
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    const doFetch = async () => {
      if (!household) {
        setInvites([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('household_invites')
        .select('*')
        .eq('household_id', household.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (cancelled) return

      if (fetchError) {
        setError(fetchError.message)
        setInvites([])
      } else {
        setInvites(data ?? [])
      }

      setLoading(false)
    }

    doFetch()

    return () => { cancelled = true }
  }, [household, refreshKey])

  const createInvite = useCallback(
    async (email: string): Promise<HouseholdInvite | null> => {
      if (!user || !household) return null

      setError(null)

      const { data, error: insertError } = await supabase
        .from('household_invites')
        .insert({
          household_id: household.id,
          invited_by: user.id,
          email: email.trim().toLowerCase(),
        })
        .select()
        .single()

      if (insertError) {
        setError(insertError.message)
        return null
      }

      setInvites(prev => [data, ...prev])
      return data
    },
    [user, household]
  )

  const cancelInvite = useCallback(async (id: string): Promise<boolean> => {
    const { error: deleteError } = await supabase
      .from('household_invites')
      .delete()
      .eq('id', id)

    if (deleteError) {
      setError(deleteError.message)
      return false
    }

    setInvites(prev => prev.filter(i => i.id !== id))
    return true
  }, [])

  const refresh = useCallback(() => {
    setRefreshKey(k => k + 1)
  }, [])

  return { invites, loading, error, createInvite, cancelInvite, refresh }
}
