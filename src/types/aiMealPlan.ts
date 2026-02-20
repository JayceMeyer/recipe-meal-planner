import type { MealType, Ingredient, Step } from './database'

export interface AIMealPlanConfig {
  days: string[]
  mealTypes: MealType[]
  preserveExisting: boolean
}

export interface PlannedMeal {
  date: string
  meal_type: MealType
  recipe_title: string
  description: string
  ingredients: Ingredient[]
  steps: Step[]
  servings: number
  prep_time: number
  cook_time: number
  cuisine: string[]
  source: 'saved' | 'generated'
  saved_recipe_id?: string
}

export interface AIMealPlanResult {
  meals: PlannedMeal[]
  reasoning: string
}

export interface PantryContext {
  high_perishability: PantryItemContext[]
  medium_perishability: PantryItemContext[]
  low_perishability: PantryItemContext[]
}

export interface PantryItemContext {
  ingredient_name: string
  quantity: string | null
  unit: string | null
  category: string | null
}

export interface SavedRecipeContext {
  id: string
  title: string
  ingredients: Ingredient[]
  cuisine: string[]
  servings: number | null
  prep_time: number | null
  cook_time: number | null
}

export interface UserPreferencesContext {
  dietary_restrictions: string[]
  cuisine_preferences: string[]
}

export const OPENROUTER_MODELS = [
  { id: 'anthropic/claude-sonnet-4-5', label: 'Claude Sonnet 4.5', description: 'Fast, great structured output' },
  { id: 'anthropic/claude-3.5-haiku', label: 'Claude 3.5 Haiku', description: 'Budget-friendly Claude' },
  { id: 'openai/gpt-4o', label: 'GPT-4o', description: 'Fast and popular' },
  { id: 'openai/gpt-4o-mini', label: 'GPT-4o Mini', description: 'Budget option' },
  { id: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash', description: 'Fast and affordable' },
] as const

export type OpenRouterModelId = (typeof OPENROUTER_MODELS)[number]['id']

export const DEFAULT_MODEL: OpenRouterModelId = 'anthropic/claude-sonnet-4-5'
