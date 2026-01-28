import type { Recipe, GroceryItem, Ingredient } from '@/types/database'

export interface IngredientMatch {
  recipeIngredient: Ingredient
  groceryItem: GroceryItem | null
  matchType: 'exact' | 'partial' | 'none'
}

export interface RecipeMatchResult {
  recipe: Recipe
  matchedIngredients: IngredientMatch[]
  matchScore: number
  matchedCount: number
  totalIngredients: number
  missingCount: number
  missingIngredients: Ingredient[]
}

/**
 * Normalizes an ingredient name for comparison
 * - Converts to lowercase
 * - Removes extra whitespace
 * - Removes common quantity words and measurements
 * - Removes pluralization (simple cases)
 */
export function normalizeIngredientName(name: string): string {
  let normalized = name.toLowerCase().trim()

  // Remove common measurements and quantity words
  const measurementPatterns = [
    /^\d+[\s/]*\d*\s*/,
    /\b(cup|cups|tbsp|tsp|tablespoon|tablespoons|teaspoon|teaspoons)\b/gi,
    /\b(oz|ounce|ounces|lb|lbs|pound|pounds|g|gram|grams|kg|ml|liter|liters)\b/gi,
    /\b(large|medium|small|big|whole|half|quarter)\b/gi,
    /\b(fresh|dried|frozen|canned|chopped|diced|minced|sliced)\b/gi,
  ]

  for (const pattern of measurementPatterns) {
    normalized = normalized.replace(pattern, ' ')
  }

  // Clean up whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim()

  // Simple depluralization (handles common cases)
  if (normalized.endsWith('ies')) {
    normalized = normalized.slice(0, -3) + 'y'
  } else if (normalized.endsWith('es') && !normalized.endsWith('ches') && !normalized.endsWith('shes')) {
    normalized = normalized.slice(0, -2)
  } else if (normalized.endsWith('s') && !normalized.endsWith('ss')) {
    normalized = normalized.slice(0, -1)
  }

  return normalized
}

/**
 * Extracts the core ingredient word (e.g., "chicken" from "chicken breast")
 */
export function extractCoreIngredient(name: string): string {
  const normalized = normalizeIngredientName(name)
  const words = normalized.split(' ')

  // Return first word as the core ingredient
  return words[0] || normalized
}

/**
 * Checks if two ingredient names match
 * Returns 'exact' if normalized names are equal
 * Returns 'partial' if one contains the other's core ingredient
 * Returns 'none' if no match
 */
export function matchIngredients(
  groceryName: string,
  recipeName: string
): 'exact' | 'partial' | 'none' {
  const normalizedGrocery = normalizeIngredientName(groceryName)
  const normalizedRecipe = normalizeIngredientName(recipeName)

  // Exact match after normalization
  if (normalizedGrocery === normalizedRecipe) {
    return 'exact'
  }

  // Check if one contains the other
  if (normalizedGrocery.includes(normalizedRecipe) || normalizedRecipe.includes(normalizedGrocery)) {
    return 'partial'
  }

  // Check core ingredients
  const coreGrocery = extractCoreIngredient(groceryName)
  const coreRecipe = extractCoreIngredient(recipeName)

  if (coreGrocery === coreRecipe) {
    return 'partial'
  }

  // Check if core ingredient appears in the other name
  if (normalizedGrocery.includes(coreRecipe) || normalizedRecipe.includes(coreGrocery)) {
    return 'partial'
  }

  return 'none'
}

/**
 * Finds the best matching grocery item for a recipe ingredient
 */
export function findBestMatch(
  recipeIngredient: Ingredient,
  groceryItems: GroceryItem[]
): IngredientMatch {
  let bestMatch: IngredientMatch = {
    recipeIngredient,
    groceryItem: null,
    matchType: 'none',
  }

  for (const item of groceryItems) {
    const matchType = matchIngredients(item.ingredient_name, recipeIngredient.name)

    if (matchType === 'exact') {
      return {
        recipeIngredient,
        groceryItem: item,
        matchType: 'exact',
      }
    }

    if (matchType === 'partial' && bestMatch.matchType === 'none') {
      bestMatch = {
        recipeIngredient,
        groceryItem: item,
        matchType: 'partial',
      }
    }
  }

  return bestMatch
}

/**
 * Calculates match score for a recipe against grocery items
 * Score is weighted: exact matches count as 1, partial matches count as 0.7
 */
export function calculateMatchScore(matches: IngredientMatch[]): number {
  if (matches.length === 0) return 0

  const score = matches.reduce((total, match) => {
    if (match.matchType === 'exact') return total + 1
    if (match.matchType === 'partial') return total + 0.7
    return total
  }, 0)

  return score / matches.length
}

/**
 * Matches a recipe against grocery items and returns detailed match information
 */
export function matchRecipeToGroceryList(
  recipe: Recipe,
  groceryItems: GroceryItem[]
): RecipeMatchResult {
  const ingredients = recipe.ingredients || []

  if (ingredients.length === 0) {
    return {
      recipe,
      matchedIngredients: [],
      matchScore: 0,
      matchedCount: 0,
      totalIngredients: 0,
      missingCount: 0,
      missingIngredients: [],
    }
  }

  // Only consider unchecked items (items still on the list)
  const uncheckedItems = groceryItems.filter((item) => !item.checked)

  const matchedIngredients = ingredients.map((ingredient) =>
    findBestMatch(ingredient, uncheckedItems)
  )

  const matchedCount = matchedIngredients.filter((m) => m.matchType !== 'none').length
  const matchScore = calculateMatchScore(matchedIngredients)

  const missingIngredients = matchedIngredients
    .filter((m) => m.matchType === 'none')
    .map((m) => m.recipeIngredient)
  const missingCount = missingIngredients.length

  return {
    recipe,
    matchedIngredients,
    matchScore,
    matchedCount,
    totalIngredients: ingredients.length,
    missingCount,
    missingIngredients,
  }
}

/**
 * Gets recipe suggestions based on grocery list items
 * Returns recipes sorted by match score (highest first)
 */
export function getRecipeSuggestions(
  recipes: Recipe[],
  groceryItems: GroceryItem[]
): RecipeMatchResult[] {
  if (recipes.length === 0 || groceryItems.length === 0) {
    return []
  }

  const results = recipes.map((recipe) => matchRecipeToGroceryList(recipe, groceryItems))

  // Filter out recipes with no matches and sort by score
  return results
    .filter((result) => result.matchedCount > 0)
    .sort((a, b) => {
      // Primary sort by match score
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore
      }
      // Secondary sort by number of matched ingredients
      return b.matchedCount - a.matchedCount
    })
}

export interface AlmostMakeableOptions {
  maxMissing?: number
}

const DEFAULT_ALMOST_MAKEABLE_OPTIONS: AlmostMakeableOptions = {
  maxMissing: 2,
}

/**
 * Gets recipes that are "almost makeable" - missing only a few ingredients
 * Returns recipes sorted by fewest missing ingredients first
 */
export function getAlmostMakeableRecipes(
  recipes: Recipe[],
  groceryItems: GroceryItem[],
  options: AlmostMakeableOptions = {}
): RecipeMatchResult[] {
  const opts = { ...DEFAULT_ALMOST_MAKEABLE_OPTIONS, ...options }
  const maxMissing = opts.maxMissing ?? 2

  if (recipes.length === 0) {
    return []
  }

  const results = recipes.map((recipe) => matchRecipeToGroceryList(recipe, groceryItems))

  // Filter to recipes that:
  // 1. Have at least one ingredient
  // 2. Are missing 1 to maxMissing ingredients (not complete matches, not too many missing)
  // 3. Have at least one matched ingredient
  return results
    .filter((result) => {
      if (result.totalIngredients === 0) return false
      if (result.missingCount === 0) return false // Already fully matched
      if (result.missingCount > maxMissing) return false
      if (result.matchedCount === 0) return false // No matches at all
      return true
    })
    .sort((a, b) => {
      // Primary sort by fewest missing ingredients
      if (a.missingCount !== b.missingCount) {
        return a.missingCount - b.missingCount
      }
      // Secondary sort by match score
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore
      }
      // Tertiary sort by most matched ingredients
      return b.matchedCount - a.matchedCount
    })
}
