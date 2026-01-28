import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import type { GroceryItem } from '@/types/database'
import { categorizeIngredient } from '@/utils/ingredientCategories'

interface UseGroceryItemsResult {
  items: GroceryItem[]
  loading: boolean
  error: string | null
  toggleChecked: (id: string) => Promise<boolean>
  updateItem: (id: string, updates: { quantity?: string; unit?: string }) => Promise<boolean>
  deleteItem: (id: string) => Promise<boolean>
  addItem: (ingredientName: string, quantity?: string, unit?: string) => Promise<GroceryItem | null>
  refresh: () => Promise<void>
}

export function useGroceryItems(listId: string | undefined): UseGroceryItemsResult {
  const [items, setItems] = useState<GroceryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const isMounted = useRef(true)

  const fetchItems = useCallback(async () => {
    if (!listId) {
      setItems([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data, error: fetchError } = await supabase
      .from('grocery_items')
      .select('*')
      .eq('list_id', listId)
      .order('created_at', { ascending: true })

    if (!isMounted.current) return

    if (fetchError) {
      setError(fetchError.message)
      setItems([])
    } else {
      setItems(data ?? [])
    }

    setLoading(false)
  }, [listId])

  useEffect(() => {
    isMounted.current = true

    const doFetch = async () => {
      if (!listId) {
        setItems([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('grocery_items')
        .select('*')
        .eq('list_id', listId)
        .order('created_at', { ascending: true })

      if (!isMounted.current) return

      if (fetchError) {
        setError(fetchError.message)
        setItems([])
      } else {
        setItems(data ?? [])
      }

      setLoading(false)
    }

    doFetch()

    return () => {
      isMounted.current = false
    }
  }, [listId])

  const toggleChecked = useCallback(async (id: string): Promise<boolean> => {
    const item = items.find((i) => i.id === id)
    if (!item) return false

    const newChecked = !item.checked

    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked: newChecked } : i)))

    const { error: updateError } = await supabase
      .from('grocery_items')
      .update({ checked: newChecked })
      .eq('id', id)

    if (updateError) {
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked: !newChecked } : i)))
      setError(updateError.message)
      return false
    }

    return true
  }, [items])

  const updateItem = useCallback(
    async (id: string, updates: { quantity?: string; unit?: string }): Promise<boolean> => {
      const { error: updateError } = await supabase
        .from('grocery_items')
        .update(updates)
        .eq('id', id)

      if (updateError) {
        setError(updateError.message)
        return false
      }

      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...updates } : i)))
      return true
    },
    []
  )

  const deleteItem = useCallback(async (id: string): Promise<boolean> => {
    const { error: deleteError } = await supabase.from('grocery_items').delete().eq('id', id)

    if (deleteError) {
      setError(deleteError.message)
      return false
    }

    setItems((prev) => prev.filter((i) => i.id !== id))
    return true
  }, [])

  const addItem = useCallback(
    async (
      ingredientName: string,
      quantity?: string,
      unit?: string
    ): Promise<GroceryItem | null> => {
      if (!listId) return null

      const category = categorizeIngredient(ingredientName)

      const { data, error: insertError } = await supabase
        .from('grocery_items')
        .insert({
          list_id: listId,
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
    [listId]
  )

  return {
    items,
    loading,
    error,
    toggleChecked,
    updateItem,
    deleteItem,
    addItem,
    refresh: fetchItems,
  }
}
