import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { RecipeGroup } from '@/types/database'

interface UseGroupsResult {
  groups: RecipeGroup[]
  loading: boolean
  error: string | null
  createGroup: (name: string) => Promise<RecipeGroup | null>
  updateGroup: (id: string, name: string) => Promise<boolean>
  deleteGroup: (id: string) => Promise<boolean>
  refresh: () => Promise<void>
}

export function useGroups(): UseGroupsResult {
  const [groups, setGroups] = useState<RecipeGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const isMounted = useRef(true)

  const fetchGroups = useCallback(async () => {
    if (!user) {
      setGroups([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('recipe_groups')
      .select('*')
      .eq('user_id', user.id)
      .order('name', { ascending: true })

    if (!isMounted.current) return

    if (fetchError) {
      setError(fetchError.message)
      setGroups([])
    } else {
      setGroups(data ?? [])
    }

    setLoading(false)
  }, [user])

  useEffect(() => {
    isMounted.current = true

    const doFetch = async () => {
      if (!user) {
        setGroups([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('recipe_groups')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true })

      if (!isMounted.current) return

      if (fetchError) {
        setError(fetchError.message)
        setGroups([])
      } else {
        setGroups(data ?? [])
      }

      setLoading(false)
    }

    doFetch()

    return () => {
      isMounted.current = false
    }
  }, [user])

  const createGroup = useCallback(
    async (name: string): Promise<RecipeGroup | null> => {
      if (!user) return null

      const { data, error: createError } = await supabase
        .from('recipe_groups')
        .insert({ user_id: user.id, name: name.trim() })
        .select()
        .single()

      if (createError) {
        setError(createError.message)
        return null
      }

      setGroups((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      return data
    },
    [user]
  )

  const updateGroup = useCallback(
    async (id: string, name: string): Promise<boolean> => {
      const { error: updateError } = await supabase
        .from('recipe_groups')
        .update({ name: name.trim() })
        .eq('id', id)

      if (updateError) {
        setError(updateError.message)
        return false
      }

      setGroups((prev) =>
        prev
          .map((g) => (g.id === id ? { ...g, name: name.trim() } : g))
          .sort((a, b) => a.name.localeCompare(b.name))
      )
      return true
    },
    []
  )

  const deleteGroup = useCallback(async (id: string): Promise<boolean> => {
    const { error: deleteError } = await supabase
      .from('recipe_groups')
      .delete()
      .eq('id', id)

    if (deleteError) {
      setError(deleteError.message)
      return false
    }

    setGroups((prev) => prev.filter((g) => g.id !== id))
    return true
  }, [])

  return {
    groups,
    loading,
    error,
    createGroup,
    updateGroup,
    deleteGroup,
    refresh: fetchGroups,
  }
}

interface UseRecipeGroupsResult {
  groupIds: string[]
  loading: boolean
  error: string | null
  addToGroup: (groupId: string) => Promise<boolean>
  removeFromGroup: (groupId: string) => Promise<boolean>
  setGroups: (groupIds: string[]) => Promise<boolean>
}

export function useRecipeGroups(recipeId: string | undefined): UseRecipeGroupsResult {
  const [groupIds, setGroupIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const doFetch = async () => {
      if (!recipeId) {
        setGroupIds([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('recipe_group_items')
        .select('group_id')
        .eq('recipe_id', recipeId)

      if (fetchError) {
        setError(fetchError.message)
        setGroupIds([])
      } else {
        setGroupIds(data?.map((item) => item.group_id) ?? [])
      }

      setLoading(false)
    }

    doFetch()
  }, [recipeId])

  const addToGroup = useCallback(
    async (groupId: string): Promise<boolean> => {
      if (!recipeId) return false

      const { error: insertError } = await supabase
        .from('recipe_group_items')
        .insert({ recipe_id: recipeId, group_id: groupId })

      if (insertError) {
        setError(insertError.message)
        return false
      }

      setGroupIds((prev) => [...prev, groupId])
      return true
    },
    [recipeId]
  )

  const removeFromGroup = useCallback(
    async (groupId: string): Promise<boolean> => {
      if (!recipeId) return false

      const { error: deleteError } = await supabase
        .from('recipe_group_items')
        .delete()
        .eq('recipe_id', recipeId)
        .eq('group_id', groupId)

      if (deleteError) {
        setError(deleteError.message)
        return false
      }

      setGroupIds((prev) => prev.filter((id) => id !== groupId))
      return true
    },
    [recipeId]
  )

  const setGroups = useCallback(
    async (newGroupIds: string[]): Promise<boolean> => {
      if (!recipeId) return false

      // Delete all existing assignments
      const { error: deleteError } = await supabase
        .from('recipe_group_items')
        .delete()
        .eq('recipe_id', recipeId)

      if (deleteError) {
        setError(deleteError.message)
        return false
      }

      // Insert new assignments
      if (newGroupIds.length > 0) {
        const { error: insertError } = await supabase
          .from('recipe_group_items')
          .insert(newGroupIds.map((groupId) => ({ recipe_id: recipeId, group_id: groupId })))

        if (insertError) {
          setError(insertError.message)
          return false
        }
      }

      setGroupIds(newGroupIds)
      return true
    },
    [recipeId]
  )

  return {
    groupIds,
    loading,
    error,
    addToGroup,
    removeFromGroup,
    setGroups,
  }
}

interface UseAllRecipeGroupsResult {
  recipeGroupMap: Map<string, string[]>
  loading: boolean
  error: string | null
}

export function useAllRecipeGroups(): UseAllRecipeGroupsResult {
  const [recipeGroupMap, setRecipeGroupMap] = useState<Map<string, string[]>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()

  useEffect(() => {
    const doFetch = async () => {
      if (!user) {
        setRecipeGroupMap(new Map())
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('recipe_group_items')
        .select('recipe_id, group_id')

      if (fetchError) {
        setError(fetchError.message)
        setRecipeGroupMap(new Map())
      } else {
        const map = new Map<string, string[]>()
        for (const item of data ?? []) {
          const existing = map.get(item.recipe_id) ?? []
          map.set(item.recipe_id, [...existing, item.group_id])
        }
        setRecipeGroupMap(map)
      }

      setLoading(false)
    }

    doFetch()
  }, [user])

  return {
    recipeGroupMap,
    loading,
    error,
  }
}
