export interface SpoonacularSearchResult {
  id: number
  title: string
  image: string
  imageType: string
  readyInMinutes?: number
  servings?: number
}

export interface SpoonacularSearchResponse {
  results: SpoonacularSearchResult[]
  offset: number
  number: number
  totalResults: number
}

export interface SpoonacularIngredientMatch {
  id: number
  name: string
  amount: number
  unit: string
  original: string
  image: string
}

export interface SpoonacularByIngredientsResult {
  id: number
  title: string
  image: string
  imageType: string
  usedIngredientCount: number
  missedIngredientCount: number
  missedIngredients: SpoonacularIngredientMatch[]
  usedIngredients: SpoonacularIngredientMatch[]
  likes: number
}

export interface SpoonacularExtendedIngredient {
  id: number
  name: string
  amount: number
  unit: string
  original: string
}

export interface SpoonacularAnalyzedStep {
  number: number
  step: string
  ingredients: { id: number; name: string; image: string }[]
}

export interface SpoonacularAnalyzedInstruction {
  name: string
  steps: SpoonacularAnalyzedStep[]
}

export interface SpoonacularRecipeDetail {
  id: number
  title: string
  image: string
  servings: number
  readyInMinutes: number
  preparationMinutes: number | null
  cookingMinutes: number | null
  sourceUrl: string
  sourceName: string
  cuisines: string[]
  dishTypes: string[]
  diets: string[]
  summary: string
  instructions: string
  analyzedInstructions: SpoonacularAnalyzedInstruction[]
  extendedIngredients: SpoonacularExtendedIngredient[]
}

export interface DiscoverSearchParams {
  query?: string
  cuisine?: string
  diet?: string
  ingredients?: string
  includeIngredients?: string
  offset?: number
  number?: number
}

export interface DiscoverResult {
  id: number
  title: string
  image: string
  readyInMinutes?: number
  servings?: number
  usedIngredientCount?: number
  missedIngredientCount?: number
}
