import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { AppRole } from '@/types/database'

interface UseUserRoleResult {
  role: AppRole
  isAdmin: boolean
  isModerator: boolean
  isAdminOrModerator: boolean
  loading: boolean
}

export function useUserRole(): UseUserRoleResult {
  const [role, setRole] = useState<AppRole>('user')
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const isMounted = useRef(true)

  const fetchRole = useCallback(async () => {
    if (!user) {
      setRole('user')
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    if (!isMounted.current) return

    if (error) {
      setRole('user')
      setLoading(false)
      return
    }

    setRole(data?.role ?? 'user')
    setLoading(false)
  }, [user])

  useEffect(() => {
    isMounted.current = true
    queueMicrotask(() => { fetchRole() })
    return () => {
      isMounted.current = false
    }
  }, [fetchRole])

  return {
    role,
    isAdmin: role === 'admin',
    isModerator: role === 'moderator',
    isAdminOrModerator: role === 'admin' || role === 'moderator',
    loading,
  }
}
