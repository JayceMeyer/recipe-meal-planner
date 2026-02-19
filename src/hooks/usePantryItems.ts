import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useHousehold } from '@/contexts/HouseholdContext'
import type { PantryItem } from '@/types/database'
import { categorizeIngredient } from '@/utils/ingredientCategories'

interface UsePantryItemsResult {
  items: PantryItem[]
  loading: boolean
  error: string | null
  addItem: (ingredientName: string, quantity?: string, unit?: string) => Promise<PantryItem | null>
  updateItem: (id: string, updates: { ingredient_name?: string; quantity?: string; unit?: string }) => Promise<boolean>
  deleteItem: (id: string) => Promise<boolean>
  addItems: (items: { ingredient_name: string; quantity?: string; unit?: string }[]) => Promise<boolean>
  refresh: () => Promise<void>
}

export function usePantryItems(): UsePantryItemsResult {
  const [items, setItems] = useState<PantryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { household } = useHousehold()
  const isMounted = useRef(true)

  const fetchItems = useCallback(async () => {
    if (!user) {
      setItems([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('pantry_items')
      .select('*')
      .order('category', { ascending: true })
      .order('ingredient_name', { ascending: true })

    if (!isMounted.current) return

    if (fetchError) {
      setError(fetchError.message)
      setItems([])
    } else {
      setItems(data ?? [])
    }

    setLoading(false)
  }, [user])

  useEffect(() => {
    isMounted.current = true
    queueMicrotask(() => { fetchItems() })
    return () => {
      isMounted.current = false
    }
  }, [fetchItems])

  const addItem = useCallback(
    async (ingredientName: string, quantity?: string, unit?: string): Promise<PantryItem | null> => {
      if (!user || !household) return null

      const category = categorizeIngredient(ingredientName)

      const { data, error: insertError } = await supabase
        .from('pantry_items')
        .insert({
          user_id: user.id,
          household_id: household.id,
          ingredient_name: ingredientName,
          quantity: quantity || null,
          unit: unit || null,
          category,
        })
        .select()
        .single()

      if (insertError) {
        setError(insertError.message)
        return null
      }

      setItems((prev) => [...prev, data])
      return data
    },
    [user, household]
  )

  const updateItem = useCallback(
    async (id: string, updates: { ingredient_name?: string; quantity?: string; unit?: string }): Promise<boolean> => {
      const updateData: Record<string, string | null | undefined> = { ...updates }

      if (updates.ingredient_name) {
        updateData.category = categorizeIngredient(updates.ingredient_name)
      }

      const { error: updateError } = await supabase
        .from('pantry_items')
        .update(updateData)
        .eq('id', id)

      if (updateError) {
        setError(updateError.message)
        return false
      }

      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, ...updateData } : i))
      )
      return true
    },
    []
  )

  const deleteItem = useCallback(async (id: string): Promise<boolean> => {
    const { error: deleteError } = await supabase
      .from('pantry_items')
      .delete()
      .eq('id', id)

    if (deleteError) {
      setError(deleteError.message)
      return false
    }

    setItems((prev) => prev.filter((i) => i.id !== id))
    return true
  }, [])

  const addItems = useCallback(
    async (newItems: { ingredient_name: string; quantity?: string; unit?: string }[]): Promise<boolean> => {
      if (!user || !household || newItems.length === 0) return false

      const rows = newItems.map((item) => ({
        user_id: user.id,
        household_id: household.id,
        ingredient_name: item.ingredient_name,
        quantity: item.quantity || null,
        unit: item.unit || null,
        category: categorizeIngredient(item.ingredient_name),
      }))

      const { data, error: insertError } = await supabase
        .from('pantry_items')
        .insert(rows)
        .select()

      if (insertError) {
        setError(insertError.message)
        return false
      }

      setItems((prev) => [...prev, ...(data ?? [])])
      return true
    },
    [user, household]
  )

  return {
    items,
    loading,
    error,
    addItem,
    updateItem,
    deleteItem,
    addItems,
    refresh: fetchItems,
  }
}
