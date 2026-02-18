import { useState, useCallback, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useHousehold } from '@/contexts/HouseholdContext'
import type { MealPlan, MealPlanEntry, MealType } from '@/types/database'

export interface MealPlanWithEntries extends MealPlan {
  entries: MealPlanEntry[]
}

interface UseMealPlanResult {
  plan: MealPlanWithEntries | null
  loading: boolean
  error: string | null
  createWeekPlan: (weekStart: string) => Promise<MealPlan | null>
  addEntry: (
    planId: string,
    recipeId: string,
    date: string,
    mealType: MealType
  ) => Promise<MealPlanEntry | null>
  removeEntry: (entryId: string) => Promise<boolean>
  moveEntry: (entryId: string, newDate: string, newMealType: MealType) => Promise<boolean>
  refresh: () => Promise<void>
}

function getWeekStart(date: Date): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

export function useMealPlan(weekStart?: string): UseMealPlanResult {
  const currentWeekStart = weekStart ?? getWeekStart(new Date())
  const [plan, setPlan] = useState<MealPlanWithEntries | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { household } = useHousehold()
  const isMounted = useRef(true)

  const fetchPlan = useCallback(async () => {
    if (!user || !household) {
      setPlan(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const { data: planData, error: planError } = await supabase
      .from('meal_plans')
      .select('*')
      .eq('household_id', household.id)
      .eq('week_start', currentWeekStart)
      .maybeSingle()

    if (!isMounted.current) return

    if (planError) {
      setError(planError.message)
      setPlan(null)
      setLoading(false)
      return
    }

    if (!planData) {
      setPlan(null)
      setLoading(false)
      return
    }

    const { data: entries, error: entriesError } = await supabase
      .from('meal_plan_entries')
      .select('*')
      .eq('plan_id', planData.id)
      .order('date', { ascending: true })

    if (!isMounted.current) return

    if (entriesError) {
      setError(entriesError.message)
      setPlan(null)
    } else {
      setPlan({ ...planData, entries: entries ?? [] })
    }

    setLoading(false)
  }, [user, household, currentWeekStart])

  useEffect(() => {
    isMounted.current = true

    const doFetch = async () => {
      if (!user || !household) {
        setPlan(null)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      const { data: planData, error: planError } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('household_id', household.id)
        .eq('week_start', currentWeekStart)
        .maybeSingle()

      if (!isMounted.current) return

      if (planError) {
        setError(planError.message)
        setPlan(null)
        setLoading(false)
        return
      }

      if (!planData) {
        setPlan(null)
        setLoading(false)
        return
      }

      const { data: entries, error: entriesError } = await supabase
        .from('meal_plan_entries')
        .select('*')
        .eq('plan_id', planData.id)
        .order('date', { ascending: true })

      if (!isMounted.current) return

      if (entriesError) {
        setError(entriesError.message)
        setPlan(null)
      } else {
        setPlan({ ...planData, entries: entries ?? [] })
      }

      setLoading(false)
    }

    doFetch()

    return () => {
      isMounted.current = false
    }
  }, [user, household, currentWeekStart])

  const createWeekPlan = useCallback(
    async (ws: string): Promise<MealPlan | null> => {
      if (!user || !household) return null

      const { data, error: createError } = await supabase
        .from('meal_plans')
        .insert({ household_id: household.id, user_id: user.id, week_start: ws })
        .select()
        .single()

      if (createError) {
        setError(createError.message)
        return null
      }

      if (ws === currentWeekStart) {
        setPlan({ ...data, entries: [] })
      }

      return data
    },
    [user, household, currentWeekStart]
  )

  const addEntry = useCallback(
    async (
      planId: string,
      recipeId: string,
      date: string,
      mealType: MealType
    ): Promise<MealPlanEntry | null> => {
      const { data, error: insertError } = await supabase
        .from('meal_plan_entries')
        .insert({ plan_id: planId, recipe_id: recipeId, date, meal_type: mealType })
        .select()
        .single()

      if (insertError) {
        setError(insertError.message)
        return null
      }

      setPlan((prev) => {
        if (!prev || prev.id !== planId) return prev
        return { ...prev, entries: [...prev.entries, data] }
      })

      return data
    },
    []
  )

  const removeEntry = useCallback(async (entryId: string): Promise<boolean> => {
    const { error: deleteError } = await supabase
      .from('meal_plan_entries')
      .delete()
      .eq('id', entryId)

    if (deleteError) {
      setError(deleteError.message)
      return false
    }

    setPlan((prev) => {
      if (!prev) return prev
      return { ...prev, entries: prev.entries.filter((e) => e.id !== entryId) }
    })

    return true
  }, [])

  const moveEntry = useCallback(
    async (entryId: string, newDate: string, newMealType: MealType): Promise<boolean> => {
      const { error: updateError } = await supabase
        .from('meal_plan_entries')
        .update({ date: newDate, meal_type: newMealType })
        .eq('id', entryId)

      if (updateError) {
        setError(updateError.message)
        return false
      }

      setPlan((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          entries: prev.entries.map((e) =>
            e.id === entryId ? { ...e, date: newDate, meal_type: newMealType } : e
          ),
        }
      })

      return true
    },
    []
  )

  return {
    plan,
    loading,
    error,
    createWeekPlan,
    addEntry,
    removeEntry,
    moveEntry,
    refresh: fetchPlan,
  }
}
