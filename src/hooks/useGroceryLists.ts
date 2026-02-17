import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useHousehold } from '@/contexts/HouseholdContext'
import type { GroceryList } from '@/types/database'

const ACTIVE_LIST_KEY = 'active-grocery-list-id'

interface UseGroceryListsResult {
  lists: GroceryList[]
  loading: boolean
  error: string | null
  activeListId: string | null
  setActiveListId: (id: string | null) => void
  createList: (name: string) => Promise<GroceryList | null>
  updateList: (id: string, name: string) => Promise<boolean>
  deleteList: (id: string) => Promise<boolean>
  refresh: () => Promise<void>
}

export function useGroceryLists(): UseGroceryListsResult {
  const [lists, setLists] = useState<GroceryList[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeListId, setActiveListIdState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(ACTIVE_LIST_KEY)
    }
    return null
  })
  const { user } = useAuth()
  const { household } = useHousehold()
  const isMounted = useRef(true)

  const setActiveListId = useCallback((id: string | null) => {
    setActiveListIdState(id)
    if (id) {
      localStorage.setItem(ACTIVE_LIST_KEY, id)
    } else {
      localStorage.removeItem(ACTIVE_LIST_KEY)
    }
  }, [])

  const fetchLists = useCallback(async () => {
    if (!user) {
      setLists([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('grocery_lists')
      .select('*')
      .order('created_at', { ascending: false })

    if (!isMounted.current) return

    if (fetchError) {
      setError(fetchError.message)
      setLists([])
    } else {
      setLists(data ?? [])
    }

    setLoading(false)
  }, [user])

  useEffect(() => {
    isMounted.current = true

    const doFetch = async () => {
      if (!user) {
        setLists([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('grocery_lists')
        .select('*')
        .order('created_at', { ascending: false })

      if (!isMounted.current) return

      if (fetchError) {
        setError(fetchError.message)
        setLists([])
      } else {
        setLists(data ?? [])
      }

      setLoading(false)
    }

    doFetch()

    return () => {
      isMounted.current = false
    }
  }, [user])

  const createList = useCallback(
    async (name: string): Promise<GroceryList | null> => {
      if (!user || !household) return null

      const { data, error: createError } = await supabase
        .from('grocery_lists')
        .insert({ user_id: user.id, household_id: household.id, name: name.trim() })
        .select()
        .single()

      if (createError) {
        setError(createError.message)
        return null
      }

      setLists((prev) => [data, ...prev])
      return data
    },
    [user, household]
  )

  const updateList = useCallback(async (id: string, name: string): Promise<boolean> => {
    const { error: updateError } = await supabase
      .from('grocery_lists')
      .update({ name: name.trim() })
      .eq('id', id)

    if (updateError) {
      setError(updateError.message)
      return false
    }

    setLists((prev) => prev.map((l) => (l.id === id ? { ...l, name: name.trim() } : l)))
    return true
  }, [])

  const deleteList = useCallback(
    async (id: string): Promise<boolean> => {
      const { error: deleteError } = await supabase.from('grocery_lists').delete().eq('id', id)

      if (deleteError) {
        setError(deleteError.message)
        return false
      }

      setLists((prev) => prev.filter((l) => l.id !== id))

      if (activeListId === id) {
        setActiveListId(null)
      }

      return true
    },
    [activeListId, setActiveListId]
  )

  return {
    lists,
    loading,
    error,
    activeListId,
    setActiveListId,
    createList,
    updateList,
    deleteList,
    refresh: fetchLists,
  }
}

interface GroceryListWithItemCount extends GroceryList {
  itemCount: number
}

interface UseGroceryListsWithCountsResult {
  lists: GroceryListWithItemCount[]
  loading: boolean
  error: string | null
  activeListId: string | null
  setActiveListId: (id: string | null) => void
  createList: (name: string) => Promise<GroceryList | null>
  updateList: (id: string, name: string) => Promise<boolean>
  deleteList: (id: string) => Promise<boolean>
  refresh: () => Promise<void>
}

export function useGroceryListsWithCounts(): UseGroceryListsWithCountsResult {
  const base = useGroceryLists()
  const [itemCounts, setItemCounts] = useState<Map<string, number>>(new Map())
  const [countsLoading, setCountsLoading] = useState(true)
  const { user } = useAuth()

  useEffect(() => {
    const fetchCounts = async () => {
      if (!user || base.lists.length === 0) {
        setItemCounts(new Map())
        setCountsLoading(false)
        return
      }

      setCountsLoading(true)

      const listIds = base.lists.map((l) => l.id)
      const { data, error: countError } = await supabase
        .from('grocery_items')
        .select('list_id')
        .in('list_id', listIds)

      if (countError) {
        setCountsLoading(false)
        return
      }

      const counts = new Map<string, number>()
      for (const item of data ?? []) {
        counts.set(item.list_id, (counts.get(item.list_id) ?? 0) + 1)
      }
      setItemCounts(counts)
      setCountsLoading(false)
    }

    fetchCounts()
  }, [user, base.lists])

  const listsWithCounts: GroceryListWithItemCount[] = base.lists.map((list) => ({
    ...list,
    itemCount: itemCounts.get(list.id) ?? 0,
  }))

  return {
    ...base,
    lists: listsWithCounts,
    loading: base.loading || countsLoading,
  }
}
