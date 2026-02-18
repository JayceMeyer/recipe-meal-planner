import { describe, it, expect } from 'vitest'
import {
  normalizeIngredientName,
  extractCoreIngredient,
  matchIngredients,
  findBestMatch,
  calculateMatchScore,
  matchRecipeToGroceryList,
  getRecipeSuggestions,
  getAlmostMakeableRecipes,
} from './ingredientMatcher'
import type { Recipe, GroceryItem, Ingredient } from '@/types/database'

// Helper to create mock grocery item
function mockGroceryItem(name: string, checked = false): GroceryItem {
  return {
    id: `item-${name}`,
    list_id: 'list-1',
    ingredient_name: name,
    quantity: null,
    unit: null,
    checked,
    source_recipe_id: null,
    category: null,
    created_at: new Date().toISOString(),
  }
}

// Helper to create mock recipe
function mockRecipe(id: string, title: string, ingredients: Ingredient[]): Recipe {
  return {
    id,
    user_id: 'user-1',
    household_id: 'household-1',
    title,
    description: null,
    image_url: null,
    source_url: null,
    servings: 4,
    prep_time: null,
    cook_time: null,
    ingredients,
    steps: [],
    notes: null,
    rating: null,
    cuisine: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

describe('normalizeIngredientName', () => {
  it('converts to lowercase', () => {
    expect(normalizeIngredientName('Chicken')).toBe('chicken')
    expect(normalizeIngredientName('ONION')).toBe('onion')
  })

  it('trims whitespace', () => {
    expect(normalizeIngredientName('  chicken  ')).toBe('chicken')
  })

  it('removes quantity numbers', () => {
    expect(normalizeIngredientName('2 cups flour')).toBe('flour')
    expect(normalizeIngredientName('1/2 onion')).toBe('onion')
  })

  it('removes measurement words', () => {
    expect(normalizeIngredientName('1 cup flour')).toBe('flour')
    expect(normalizeIngredientName('2 tablespoons butter')).toBe('butter')
    expect(normalizeIngredientName('1 teaspoon salt')).toBe('salt')
    expect(normalizeIngredientName('8 oz cream cheese')).toBe('cream cheese')
  })

  it('removes size descriptors', () => {
    expect(normalizeIngredientName('1 large onion')).toBe('onion')
    expect(normalizeIngredientName('2 medium carrots')).toBe('carrot')
    expect(normalizeIngredientName('small potato')).toBe('potato')
  })

  it('removes preparation words', () => {
    expect(normalizeIngredientName('chopped onion')).toBe('onion')
    expect(normalizeIngredientName('diced tomatoes')).toBe('tomato')
    expect(normalizeIngredientName('minced garlic')).toBe('garlic')
    expect(normalizeIngredientName('fresh basil')).toBe('basil')
  })

  it('handles simple pluralization', () => {
    expect(normalizeIngredientName('onions')).toBe('onion')
    expect(normalizeIngredientName('tomatoes')).toBe('tomato')
    expect(normalizeIngredientName('berries')).toBe('berry')
  })
})

describe('extractCoreIngredient', () => {
  it('extracts first word as core ingredient', () => {
    expect(extractCoreIngredient('chicken breast')).toBe('chicken')
    expect(extractCoreIngredient('ground beef')).toBe('ground')
    expect(extractCoreIngredient('olive oil')).toBe('olive')
  })

  it('works with single words', () => {
    expect(extractCoreIngredient('onion')).toBe('onion')
    expect(extractCoreIngredient('garlic')).toBe('garlic')
  })
})

describe('matchIngredients', () => {
  it('returns exact for identical normalized names', () => {
    expect(matchIngredients('onion', 'onion')).toBe('exact')
    expect(matchIngredients('Onion', 'onion')).toBe('exact')
    expect(matchIngredients('onions', 'onion')).toBe('exact')
  })

  it('returns partial when one contains the other', () => {
    expect(matchIngredients('chicken', 'chicken breast')).toBe('partial')
    expect(matchIngredients('chicken breast', 'chicken')).toBe('partial')
  })

  it('returns partial for core ingredient match', () => {
    expect(matchIngredients('chicken thighs', 'chicken breast')).toBe('partial')
  })

  it('returns none for no match', () => {
    expect(matchIngredients('onion', 'garlic')).toBe('none')
    expect(matchIngredients('chicken', 'beef')).toBe('none')
  })
})

describe('findBestMatch', () => {
  const groceryItems = [
    mockGroceryItem('chicken'),
    mockGroceryItem('onion'),
    mockGroceryItem('garlic'),
  ]

  it('finds exact match', () => {
    const ingredient: Ingredient = { name: 'onion', amount: '1' }
    const result = findBestMatch(ingredient, groceryItems)

    expect(result.matchType).toBe('exact')
    expect(result.groceryItem?.ingredient_name).toBe('onion')
  })

  it('finds partial match when no exact', () => {
    const ingredient: Ingredient = { name: 'chicken breast', amount: '2' }
    const result = findBestMatch(ingredient, groceryItems)

    expect(result.matchType).toBe('partial')
    expect(result.groceryItem?.ingredient_name).toBe('chicken')
  })

  it('returns none when no match', () => {
    const ingredient: Ingredient = { name: 'beef', amount: '1 lb' }
    const result = findBestMatch(ingredient, groceryItems)

    expect(result.matchType).toBe('none')
    expect(result.groceryItem).toBeNull()
  })

  it('prefers exact over partial', () => {
    const items = [
      mockGroceryItem('chicken breast'),
      mockGroceryItem('chicken'),
    ]
    const ingredient: Ingredient = { name: 'chicken breast', amount: '2' }
    const result = findBestMatch(ingredient, items)

    expect(result.matchType).toBe('exact')
    expect(result.groceryItem?.ingredient_name).toBe('chicken breast')
  })
})

describe('calculateMatchScore', () => {
  it('returns 0 for empty matches', () => {
    expect(calculateMatchScore([])).toBe(0)
  })

  it('returns 1 for all exact matches', () => {
    const matches = [
      { recipeIngredient: { name: 'a', amount: '1' }, groceryItem: mockGroceryItem('a'), matchType: 'exact' as const },
      { recipeIngredient: { name: 'b', amount: '1' }, groceryItem: mockGroceryItem('b'), matchType: 'exact' as const },
    ]
    expect(calculateMatchScore(matches)).toBe(1)
  })

  it('returns 0.7 for all partial matches', () => {
    const matches = [
      { recipeIngredient: { name: 'a', amount: '1' }, groceryItem: mockGroceryItem('a'), matchType: 'partial' as const },
      { recipeIngredient: { name: 'b', amount: '1' }, groceryItem: mockGroceryItem('b'), matchType: 'partial' as const },
    ]
    expect(calculateMatchScore(matches)).toBe(0.7)
  })

  it('returns 0 for no matches', () => {
    const matches = [
      { recipeIngredient: { name: 'a', amount: '1' }, groceryItem: null, matchType: 'none' as const },
      { recipeIngredient: { name: 'b', amount: '1' }, groceryItem: null, matchType: 'none' as const },
    ]
    expect(calculateMatchScore(matches)).toBe(0)
  })

  it('calculates weighted average correctly', () => {
    const matches = [
      { recipeIngredient: { name: 'a', amount: '1' }, groceryItem: mockGroceryItem('a'), matchType: 'exact' as const },
      { recipeIngredient: { name: 'b', amount: '1' }, groceryItem: mockGroceryItem('b'), matchType: 'partial' as const },
      { recipeIngredient: { name: 'c', amount: '1' }, groceryItem: null, matchType: 'none' as const },
    ]
    // (1 + 0.7 + 0) / 3 = 0.567
    expect(calculateMatchScore(matches)).toBeCloseTo(0.567, 2)
  })
})

describe('matchRecipeToGroceryList', () => {
  it('matches recipe ingredients against grocery items', () => {
    const recipe = mockRecipe('r1', 'Chicken Stir Fry', [
      { name: 'chicken', amount: '1 lb' },
      { name: 'onion', amount: '1' },
      { name: 'soy sauce', amount: '2 tbsp' },
    ])

    const groceryItems = [
      mockGroceryItem('chicken'),
      mockGroceryItem('onion'),
    ]

    const result = matchRecipeToGroceryList(recipe, groceryItems)

    expect(result.recipe.id).toBe('r1')
    expect(result.matchedCount).toBe(2)
    expect(result.totalIngredients).toBe(3)
    expect(result.matchScore).toBeCloseTo(0.67, 1) // (1 + 1 + 0) / 3 = 0.67
    expect(result.missingCount).toBe(1)
    expect(result.missingIngredients).toHaveLength(1)
    expect(result.missingIngredients[0].name).toBe('soy sauce')
  })

  it('ignores checked grocery items', () => {
    const recipe = mockRecipe('r1', 'Simple', [
      { name: 'chicken', amount: '1 lb' },
    ])

    const groceryItems = [
      mockGroceryItem('chicken', true), // checked
    ]

    const result = matchRecipeToGroceryList(recipe, groceryItems)

    expect(result.matchedCount).toBe(0)
  })

  it('handles recipe with no ingredients', () => {
    const recipe = mockRecipe('r1', 'Empty', [])

    const result = matchRecipeToGroceryList(recipe, [mockGroceryItem('chicken')])

    expect(result.matchedCount).toBe(0)
    expect(result.totalIngredients).toBe(0)
    expect(result.matchScore).toBe(0)
    expect(result.missingCount).toBe(0)
    expect(result.missingIngredients).toEqual([])
  })

  it('tracks missing ingredients correctly', () => {
    const recipe = mockRecipe('r1', 'Test Recipe', [
      { name: 'chicken', amount: '1 lb' },
      { name: 'salt', amount: '1 tsp' },
      { name: 'pepper', amount: '1 tsp' },
    ])

    const groceryItems = [mockGroceryItem('chicken')]

    const result = matchRecipeToGroceryList(recipe, groceryItems)

    expect(result.matchedCount).toBe(1)
    expect(result.missingCount).toBe(2)
    expect(result.missingIngredients.map((i) => i.name)).toEqual(['salt', 'pepper'])
  })
})

describe('getRecipeSuggestions', () => {
  const recipes = [
    mockRecipe('r1', 'Chicken Salad', [
      { name: 'chicken', amount: '1 lb' },
      { name: 'lettuce', amount: '1 head' },
      { name: 'tomato', amount: '2' },
    ]),
    mockRecipe('r2', 'Beef Stew', [
      { name: 'beef', amount: '2 lb' },
      { name: 'potato', amount: '3' },
      { name: 'carrot', amount: '2' },
    ]),
    mockRecipe('r3', 'Garlic Chicken', [
      { name: 'chicken', amount: '1 lb' },
      { name: 'garlic', amount: '4 cloves' },
    ]),
  ]

  it('returns empty array for empty grocery list', () => {
    const result = getRecipeSuggestions(recipes, [])
    expect(result).toEqual([])
  })

  it('returns empty array for empty recipe list', () => {
    const result = getRecipeSuggestions([], [mockGroceryItem('chicken')])
    expect(result).toEqual([])
  })

  it('sorts recipes by match score', () => {
    const groceryItems = [
      mockGroceryItem('chicken'),
      mockGroceryItem('garlic'),
    ]

    const result = getRecipeSuggestions(recipes, groceryItems)

    // r3 (Garlic Chicken) should be first - 2/2 ingredients match
    expect(result[0].recipe.id).toBe('r3')
    expect(result[0].matchScore).toBe(1) // 100% match

    // r1 (Chicken Salad) should be second - 1/3 ingredients match
    expect(result[1].recipe.id).toBe('r1')
  })

  it('filters out recipes with no matches', () => {
    const groceryItems = [
      mockGroceryItem('fish'),
    ]

    const result = getRecipeSuggestions(recipes, groceryItems)

    expect(result.length).toBe(0)
  })

  it('handles partial matches in sorting', () => {
    const groceryItems = [
      mockGroceryItem('chicken breast'), // partial match to chicken
    ]

    const result = getRecipeSuggestions(recipes, groceryItems)

    // Both r1 and r3 have chicken, should both appear
    expect(result.length).toBe(2)
  })

  it('uses matched count as secondary sort', () => {
    const recipes2 = [
      mockRecipe('r1', 'One Match', [
        { name: 'chicken', amount: '1 lb' },
      ]),
      mockRecipe('r2', 'Two Matches', [
        { name: 'chicken', amount: '1 lb' },
        { name: 'garlic', amount: '2 cloves' },
      ]),
    ]

    const groceryItems = [
      mockGroceryItem('chicken'),
      mockGroceryItem('garlic'),
    ]

    const result = getRecipeSuggestions(recipes2, groceryItems)

    // Both have 100% match score, but r2 has more matched ingredients
    expect(result[0].recipe.id).toBe('r2')
    expect(result[0].matchedCount).toBe(2)
    expect(result[1].recipe.id).toBe('r1')
    expect(result[1].matchedCount).toBe(1)
  })
})

describe('getAlmostMakeableRecipes', () => {
  const recipes = [
    mockRecipe('r1', 'Full Match', [
      { name: 'chicken', amount: '1 lb' },
      { name: 'garlic', amount: '2 cloves' },
    ]),
    mockRecipe('r2', 'Missing One', [
      { name: 'chicken', amount: '1 lb' },
      { name: 'garlic', amount: '2 cloves' },
      { name: 'soy sauce', amount: '2 tbsp' },
    ]),
    mockRecipe('r3', 'Missing Two', [
      { name: 'chicken', amount: '1 lb' },
      { name: 'garlic', amount: '2 cloves' },
      { name: 'soy sauce', amount: '2 tbsp' },
      { name: 'ginger', amount: '1 inch' },
    ]),
    mockRecipe('r4', 'Missing Three', [
      { name: 'chicken', amount: '1 lb' },
      { name: 'soy sauce', amount: '2 tbsp' },
      { name: 'ginger', amount: '1 inch' },
      { name: 'sesame oil', amount: '1 tbsp' },
    ]),
    mockRecipe('r5', 'No Match', [
      { name: 'beef', amount: '2 lb' },
      { name: 'onion', amount: '1' },
    ]),
  ]

  const groceryItems = [
    mockGroceryItem('chicken'),
    mockGroceryItem('garlic'),
  ]

  it('returns empty array for empty recipe list', () => {
    const result = getAlmostMakeableRecipes([], groceryItems)
    expect(result).toEqual([])
  })

  it('excludes fully matched recipes', () => {
    const result = getAlmostMakeableRecipes(recipes, groceryItems)

    // r1 has all ingredients - should NOT be included
    const hasFullMatch = result.some((r) => r.recipe.id === 'r1')
    expect(hasFullMatch).toBe(false)
  })

  it('includes recipes missing 1-2 ingredients by default', () => {
    const result = getAlmostMakeableRecipes(recipes, groceryItems)

    // r2 (missing 1) and r3 (missing 2) should be included
    expect(result.some((r) => r.recipe.id === 'r2')).toBe(true)
    expect(result.some((r) => r.recipe.id === 'r3')).toBe(true)
  })

  it('excludes recipes missing more than maxMissing', () => {
    const result = getAlmostMakeableRecipes(recipes, groceryItems, { maxMissing: 2 })

    // r4 (missing 3) should NOT be included
    expect(result.some((r) => r.recipe.id === 'r4')).toBe(false)
  })

  it('respects configurable maxMissing threshold', () => {
    // Only allow 1 missing ingredient
    const result1 = getAlmostMakeableRecipes(recipes, groceryItems, { maxMissing: 1 })
    expect(result1.some((r) => r.recipe.id === 'r2')).toBe(true)
    expect(result1.some((r) => r.recipe.id === 'r3')).toBe(false)

    // Allow up to 3 missing ingredients
    const result3 = getAlmostMakeableRecipes(recipes, groceryItems, { maxMissing: 3 })
    expect(result3.some((r) => r.recipe.id === 'r4')).toBe(true)
  })

  it('excludes recipes with no matches', () => {
    const result = getAlmostMakeableRecipes(recipes, groceryItems)

    // r5 has no matching ingredients
    expect(result.some((r) => r.recipe.id === 'r5')).toBe(false)
  })

  it('sorts by fewest missing ingredients first', () => {
    const result = getAlmostMakeableRecipes(recipes, groceryItems)

    // r2 (missing 1) should come before r3 (missing 2)
    const r2Index = result.findIndex((r) => r.recipe.id === 'r2')
    const r3Index = result.findIndex((r) => r.recipe.id === 'r3')

    expect(r2Index).toBeLessThan(r3Index)
  })

  it('provides accurate missing ingredient list', () => {
    const result = getAlmostMakeableRecipes(recipes, groceryItems)

    const r2Result = result.find((r) => r.recipe.id === 'r2')
    expect(r2Result?.missingIngredients).toHaveLength(1)
    expect(r2Result?.missingIngredients[0].name).toBe('soy sauce')

    const r3Result = result.find((r) => r.recipe.id === 'r3')
    expect(r3Result?.missingIngredients).toHaveLength(2)
    expect(r3Result?.missingIngredients.map((i) => i.name)).toContain('soy sauce')
    expect(r3Result?.missingIngredients.map((i) => i.name)).toContain('ginger')
  })

  it('handles empty grocery list', () => {
    const result = getAlmostMakeableRecipes(recipes, [])

    // No matches possible, but should not crash
    expect(result).toEqual([])
  })

  it('handles recipes with no ingredients', () => {
    const emptyRecipes = [mockRecipe('r0', 'Empty Recipe', [])]
    const result = getAlmostMakeableRecipes(emptyRecipes, groceryItems)

    expect(result).toEqual([])
  })

  it('uses match score as secondary sort for same missing count', () => {
    const sameCountRecipes = [
      mockRecipe('r1', 'Partial Match', [
        { name: 'chicken thighs', amount: '1 lb' }, // partial match to chicken
        { name: 'soy sauce', amount: '2 tbsp' },
      ]),
      mockRecipe('r2', 'Exact Match', [
        { name: 'chicken', amount: '1 lb' }, // exact match
        { name: 'soy sauce', amount: '2 tbsp' },
      ]),
    ]

    const result = getAlmostMakeableRecipes(sameCountRecipes, groceryItems)

    // Both missing 1, but r2 has higher score (exact vs partial)
    expect(result[0].recipe.id).toBe('r2')
    expect(result[1].recipe.id).toBe('r1')
  })
})
