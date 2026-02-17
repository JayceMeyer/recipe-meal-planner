import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Household, HouseholdMember } from '@/types/database'

interface HouseholdContextType {
  household: Household | null
  members: HouseholdMember[]
  loading: boolean
  isOwner: boolean
  refreshMembers: () => void
}

const HouseholdContext = createContext<HouseholdContextType | undefined>(undefined)

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [household, setHousehold] = useState<Household | null>(null)
  const [members, setMembers] = useState<HouseholdMember[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    const doFetch = async () => {
      if (!user) {
        setHousehold(null)
        setMembers([])
        setLoading(false)
        return
      }

      const { data: membership } = await supabase
        .from('household_members')
        .select('household_id, role')
        .eq('user_id', user.id)
        .limit(1)
        .single()

      if (cancelled) return

      if (!membership) {
        setLoading(false)
        return
      }

      const { data: householdData } = await supabase
        .from('households')
        .select('*')
        .eq('id', membership.household_id)
        .single()

      if (cancelled) return

      if (householdData) {
        setHousehold(householdData)
      }

      const { data: membersData } = await supabase
        .from('household_members')
        .select('*')
        .eq('household_id', membership.household_id)

      if (cancelled) return

      if (membersData) {
        setMembers(membersData)
      }

      setLoading(false)
    }

    doFetch()

    return () => { cancelled = true }
  }, [user, refreshKey])

  const isOwner = members.some(m => m.user_id === user?.id && m.role === 'owner')

  const refreshMembers = useCallback(() => {
    setRefreshKey(k => k + 1)
  }, [])

  return (
    <HouseholdContext.Provider value={{ household, members, loading, isOwner, refreshMembers }}>
      {children}
    </HouseholdContext.Provider>
  )
}

export function useHousehold() {
  const context = useContext(HouseholdContext)
  if (context === undefined) {
    throw new Error('useHousehold must be used within a HouseholdProvider')
  }
  return context
}
