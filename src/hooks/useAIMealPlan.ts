import { useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { useHousehold } from '@/contexts/HouseholdContext'
import { usePantryItems } from '@/hooks/usePantryItems'
import { useRecipes } from '@/hooks/useRecipes'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import type { MealType } from '@/types/database'
import type { AIMealPlanConfig, PlannedMeal } from '@/types/aiMealPlan'
import {
  buildSystemPrompt,
  buildSingleSlotPrompt,
  buildPantryContext,
  buildSavedRecipesContext,
  buildUserPreferencesContext,
  handleToolCall,
  parsePlanMealCalls,
  TOOL_DEFINITIONS,
} from '@/lib/aiMealPlanning'

interface UseAIMealPlanResult {
  generating: boolean
  progress: string
  error: string | null
  generatePlan: (config: AIMealPlanConfig) => Promise<PlannedMeal[]>
  regenerateSlot: (date: string, mealType: MealType, existingMeals: PlannedMeal[]) => Promise<PlannedMeal | null>
}

export function useAIMealPlan(): UseAIMealPlanResult {
  const [generating, setGenerating] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuth()
  const { household } = useHousehold()
  const { items: pantryItems } = usePantryItems()
  const { recipes } = useRecipes()
  const { preferences } = useUserPreferences()

  const invokeOpenRouter = useCallback(
    async (messages: Array<{ role: string; content: string; tool_calls?: unknown; tool_call_id?: string }>, tools?: unknown[]) => {
      if (!household) throw new Error('No household')

      const { data, error: fnError } = await supabase.functions.invoke('openrouter', {
        body: {
          householdId: household.id,
          messages,
          tools,
        },
      })

      if (fnError) throw new Error(fnError.message)
      if (data?.error) throw new Error(data.error)
      return data
    },
    [household],
  )

  const runToolLoop = useCallback(
    async (systemPrompt: string): Promise<PlannedMeal[]> => {
      const pantryContext = buildPantryContext(pantryItems)
      const recipesContext = buildSavedRecipesContext(recipes)
      const prefsContext = preferences
        ? buildUserPreferencesContext(preferences)
        : { dietary_restrictions: [], cuisine_preferences: [] }

      const messages: Array<{ role: string; content: string; tool_calls?: unknown; tool_call_id?: string }> = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Please create the meal plan. Start by gathering context with the tools, then plan each meal.' },
      ]

      const allPlannedMeals: PlannedMeal[] = []
      let iterations = 0
      const maxIterations = 10

      while (iterations < maxIterations) {
        iterations++
        setProgress(`AI is planning meals (step ${iterations})...`)

        const response = await invokeOpenRouter(messages, TOOL_DEFINITIONS)
        const choice = response.choices?.[0]

        if (!choice) throw new Error('No response from AI model')

        const message = choice.message

        if (message.tool_calls && message.tool_calls.length > 0) {
          messages.push({
            role: 'assistant',
            content: message.content || '',
            tool_calls: message.tool_calls,
          })

          const planMealCalls = parsePlanMealCalls(message.tool_calls)
          allPlannedMeals.push(...planMealCalls)

          const contextToolCalls = message.tool_calls.filter(
            (tc: { function: { name: string } }) => tc.function.name !== 'plan_meal',
          )

          for (const tc of contextToolCalls) {
            const result = handleToolCall(tc.function.name, pantryContext, recipesContext, prefsContext)
            messages.push({
              role: 'tool' as const,
              content: result,
              tool_call_id: tc.id,
            })
          }

          for (const tc of message.tool_calls.filter(
            (tc: { function: { name: string } }) => tc.function.name === 'plan_meal',
          )) {
            messages.push({
              role: 'tool' as const,
              content: JSON.stringify({ success: true }),
              tool_call_id: tc.id,
            })
          }

          if (contextToolCalls.length === 0 && choice.finish_reason === 'stop') {
            break
          }
        } else {
          break
        }
      }

      return allPlannedMeals
    },
    [pantryItems, recipes, preferences, invokeOpenRouter],
  )

  const generatePlan = useCallback(
    async (config: AIMealPlanConfig): Promise<PlannedMeal[]> => {
      if (!user || !household) {
        setError('Not authenticated')
        return []
      }

      setGenerating(true)
      setError(null)
      setProgress('Preparing meal plan generation...')

      try {
        const systemPrompt = buildSystemPrompt(config)
        const meals = await runToolLoop(systemPrompt)
        setProgress('Meal plan generated!')
        return meals
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to generate meal plan'
        setError(message)
        return []
      } finally {
        setGenerating(false)
      }
    },
    [user, household, runToolLoop],
  )

  const regenerateSlot = useCallback(
    async (date: string, mealType: MealType, existingMeals: PlannedMeal[]): Promise<PlannedMeal | null> => {
      if (!user || !household) {
        setError('Not authenticated')
        return null
      }

      setGenerating(true)
      setError(null)
      setProgress('Generating replacement meal...')

      try {
        const systemPrompt = buildSingleSlotPrompt(date, mealType, existingMeals)
        const meals = await runToolLoop(systemPrompt)
        setProgress('Replacement meal generated!')
        return meals[0] ?? null
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to generate replacement meal'
        setError(message)
        return null
      } finally {
        setGenerating(false)
      }
    },
    [user, household, runToolLoop],
  )

  return {
    generating,
    progress,
    error,
    generatePlan,
    regenerateSlot,
  }
}
