import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useHousehold } from '@/contexts/HouseholdContext'
import type { PantryKit, PantryKitItem } from '@/types/database'

export interface KitWithItems extends PantryKit {
  items: PantryKitItem[]
}

interface UsePantryKitsResult {
  kits: KitWithItems[]
  loading: boolean
  error: string | null
  applyKit: (kitId: string, existingNames: Set<string>) => Promise<{ added: number; skipped: number } | null>
  saveAsKit: (name: string, description: string, items: { ingredient_name: string; category?: string | null; quantity?: string | null; unit?: string | null }[]) => Promise<PantryKit | null>
  refresh: () => Promise<void>
}

export function usePantryKits(): UsePantryKitsResult {
  const [kits, setKits] = useState<KitWithItems[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { household } = useHousehold()
  const isMounted = useRef(true)

  const fetchKits = useCallback(async () => {
    if (!user) {
      setKits([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data: kitData, error: kitError } = await supabase
      .from('pantry_kits')
      .select('*')
      .order('is_default', { ascending: false })
      .order('name')

    if (!isMounted.current) return

    if (kitError) {
      setError(kitError.message)
      setKits([])
      setLoading(false)
      return
    }

    const kitIds = (kitData ?? []).map((k) => k.id)
    if (kitIds.length === 0) {
      setKits([])
      setLoading(false)
      return
    }

    const { data: itemData, error: itemError } = await supabase
      .from('pantry_kit_items')
      .select('*')
      .in('kit_id', kitIds)
      .order('category')
      .order('ingredient_name')

    if (!isMounted.current) return

    if (itemError) {
      setError(itemError.message)
      setKits([])
      setLoading(false)
      return
    }

    const itemsByKit = new Map<string, PantryKitItem[]>()
    for (const item of itemData ?? []) {
      const existing = itemsByKit.get(item.kit_id) || []
      existing.push(item)
      itemsByKit.set(item.kit_id, existing)
    }

    const kitsWithItems: KitWithItems[] = (kitData ?? []).map((kit) => ({
      ...kit,
      items: itemsByKit.get(kit.id) || [],
    }))

    setKits(kitsWithItems)
    setLoading(false)
  }, [user])

  useEffect(() => {
    isMounted.current = true
    queueMicrotask(() => { fetchKits() })
    return () => { isMounted.current = false }
  }, [fetchKits])

  const applyKit = useCallback(
    async (kitId: string, existingNames: Set<string>): Promise<{ added: number; skipped: number } | null> => {
      if (!user || !household) return null

      const kit = kits.find((k) => k.id === kitId)
      if (!kit) return null

      const normalizedExisting = new Set(
        [...existingNames].map((n) => n.toLowerCase()),
      )
      const toAdd = kit.items.filter(
        (item) => !normalizedExisting.has(item.ingredient_name.toLowerCase()),
      )
      const skipped = kit.items.length - toAdd.length

      if (toAdd.length === 0) return { added: 0, skipped }

      const rows = toAdd.map((item) => ({
        user_id: user.id,
        household_id: household.id,
        ingredient_name: item.ingredient_name,
        quantity: item.quantity || null,
        unit: item.unit || null,
        category: item.category || null,
      }))

      const { error: insertError } = await supabase
        .from('pantry_items')
        .insert(rows)

      if (insertError) {
        setError(insertError.message)
        return null
      }

      return { added: toAdd.length, skipped }
    },
    [user, household, kits],
  )

  const saveAsKit = useCallback(
    async (
      name: string,
      description: string,
      items: { ingredient_name: string; category?: string | null; quantity?: string | null; unit?: string | null }[],
    ): Promise<PantryKit | null> => {
      if (!user || !household || items.length === 0) return null

      const { data: kit, error: kitError } = await supabase
        .from('pantry_kits')
        .insert({
          name,
          description,
          household_id: household.id,
          is_default: false,
        })
        .select()
        .single()

      if (kitError || !kit) {
        setError(kitError?.message ?? 'Failed to create kit')
        return null
      }

      const kitItems = items.map((item) => ({
        kit_id: kit.id,
        ingredient_name: item.ingredient_name,
        category: item.category || null,
        quantity: item.quantity || null,
        unit: item.unit || null,
      }))

      const { error: itemsError } = await supabase
        .from('pantry_kit_items')
        .insert(kitItems)

      if (itemsError) {
        setError(itemsError.message)
        return null
      }

      await fetchKits()
      return kit
    },
    [user, household, fetchKits],
  )

  return { kits, loading, error, applyKit, saveAsKit, refresh: fetchKits }
}
