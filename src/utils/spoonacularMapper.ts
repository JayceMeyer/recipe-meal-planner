import type { SpoonacularRecipeDetail } from '@/types/spoonacular'
import type { RecipeInsert, Ingredient, Step } from '@/types/database'

export const CUISINES = [
  'Italian',
  'Mexican',
  'Asian',
  'Indian',
  'Mediterranean',
  'American',
  'Thai',
  'Japanese',
  'French',
  'Greek',
] as const

export const DIETS = [
  'Vegetarian',
  'Vegan',
  'Gluten Free',
  'Dairy Free',
  'Ketogenic',
  'Paleo',
] as const

function formatAmount(amount: number): string {
  if (amount === Math.floor(amount)) return String(amount)
  return amount.toFixed(2).replace(/\.?0+$/, '')
}

function mapIngredients(detail: SpoonacularRecipeDetail): Ingredient[] {
  return detail.extendedIngredients.map((ing) => ({
    name: ing.name,
    amount: formatAmount(ing.amount),
    unit: ing.unit || undefined,
  }))
}

function mapSteps(detail: SpoonacularRecipeDetail): Step[] {
  const instructions = detail.analyzedInstructions[0]
  if (!instructions?.steps?.length) {
    if (detail.instructions) {
      return detail.instructions
        .split(/\n+/)
        .filter((line) => line.trim())
        .map((line, i) => ({ order: i + 1, instruction: line.trim() }))
    }
    return []
  }

  return instructions.steps.map((step) => ({
    order: step.number,
    instruction: step.step,
  }))
}

function mapCuisines(detail: SpoonacularRecipeDetail): string[] {
  const knownCuisines = new Set(CUISINES.map((c) => c.toLowerCase()))
  return detail.cuisines
    .filter((c) => knownCuisines.has(c.toLowerCase()))
    .map((c) => {
      const match = CUISINES.find((k) => k.toLowerCase() === c.toLowerCase())
      return match ?? c
    })
}

export function mapSpoonacularToRecipe(
  detail: SpoonacularRecipeDetail,
  userId: string,
  householdId: string,
): RecipeInsert {
  return {
    user_id: userId,
    household_id: householdId,
    title: detail.title,
    description: detail.summary
      ? detail.summary.replace(/<[^>]*>/g, '').slice(0, 500)
      : null,
    image_url: detail.image || null,
    source_url: detail.sourceUrl || null,
    servings: detail.servings || null,
    prep_time: detail.preparationMinutes || null,
    cook_time: detail.cookingMinutes || (detail.readyInMinutes || null),
    ingredients: mapIngredients(detail),
    steps: mapSteps(detail),
    cuisine: mapCuisines(detail),
    notes: null,
  }
}
