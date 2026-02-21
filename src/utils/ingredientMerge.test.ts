import { describe, it, expect } from 'vitest'
import {
  normalizeIngredientName,
  mergeIngredients,
  ingredientToGroceryIngredient,
  ingredientsToGroceryIngredients,
  type GroceryIngredient,
} from './ingredientMerge'

describe('normalizeIngredientName', () => {
  it('lowercases and trims', () => {
    expect(normalizeIngredientName('  Garlic  ')).toBe('garlic')
    expect(normalizeIngredientName('ONION')).toBe('onion')
  })

  it('strips leading quantities', () => {
    expect(normalizeIngredientName('2 garlic')).toBe('garlic')
    expect(normalizeIngredientName('1/2 onion')).toBe('onion')
  })

  it('strips measurement units from name', () => {
    expect(normalizeIngredientName('cup flour')).toBe('flour')
    expect(normalizeIngredientName('tbsp olive oil')).toBe('olive oil')
    expect(normalizeIngredientName('ounces chicken')).toBe('chicken')
  })

  it('strips unit-like words', () => {
    expect(normalizeIngredientName('cloves garlic')).toBe('garlic')
    expect(normalizeIngredientName('sprigs thyme')).toBe('thyme')
    expect(normalizeIngredientName('head lettuce')).toBe('lettuce')
    expect(normalizeIngredientName('stalks celery')).toBe('celery')
    expect(normalizeIngredientName('cans diced tomatoes')).toBe('tomato')
  })

  it('strips descriptors like fresh, chopped, minced', () => {
    expect(normalizeIngredientName('fresh basil')).toBe('basil')
    expect(normalizeIngredientName('chopped onion')).toBe('onion')
    expect(normalizeIngredientName('minced garlic')).toBe('garlic')
    expect(normalizeIngredientName('frozen peas')).toBe('pea')
    expect(normalizeIngredientName('dried thyme')).toBe('thyme')
  })

  it('strips size descriptors', () => {
    expect(normalizeIngredientName('large egg')).toBe('egg')
    expect(normalizeIngredientName('medium onion')).toBe('onion')
    expect(normalizeIngredientName('small potato')).toBe('potato')
  })

  it('strips parenthetical content', () => {
    expect(normalizeIngredientName('chicken breast (about 1 lb)')).toBe('chicken')
    expect(normalizeIngredientName('tomatoes (14 oz can)')).toBe('tomato')
  })

  it('depluralizes common endings', () => {
    expect(normalizeIngredientName('tomatoes')).toBe('tomato')
    expect(normalizeIngredientName('berries')).toBe('berry')
    expect(normalizeIngredientName('potatoes')).toBe('potato')
    expect(normalizeIngredientName('carrots')).toBe('carrot')
  })

  it('does not over-depluralize edge cases', () => {
    expect(normalizeIngredientName('hummus')).toBe('hummus')
    expect(normalizeIngredientName('couscous')).toBe('couscous') // 'us' ending preserved
  })

  it('normalizes complex ingredient strings', () => {
    expect(normalizeIngredientName('2 large fresh boneless chicken breasts')).toBe('chicken')
    expect(normalizeIngredientName('1/2 cup finely chopped cilantro')).toBe('cilantro')
  })
})

describe('mergeIngredients', () => {
  it('returns empty array for no inputs', () => {
    expect(mergeIngredients([], [])).toEqual([])
  })

  it('returns existing items when no new items', () => {
    const existing: GroceryIngredient[] = [
      { name: 'garlic', quantity: '3', unit: 'cloves' },
    ]
    const result = mergeIngredients(existing, [])
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('garlic')
    expect(result[0].quantity).toBe('3')
  })

  it('returns new items when no existing items', () => {
    const newItems: GroceryIngredient[] = [
      { name: 'garlic', quantity: '2', unit: 'cloves' },
    ]
    const result = mergeIngredients([], newItems)
    expect(result).toHaveLength(1)
    expect(result[0].quantity).toBe('2')
  })

  it('merges same ingredient with same unit by summing quantities', () => {
    const existing: GroceryIngredient[] = [
      { name: 'garlic', quantity: '3', unit: 'cloves' },
    ]
    const newItems: GroceryIngredient[] = [
      { name: 'garlic', quantity: '4', unit: 'cloves' },
    ]
    const result = mergeIngredients(existing, newItems)
    expect(result).toHaveLength(1)
    expect(result[0].quantity).toBe('7')
    expect(result[0].unit).toBe('cloves')
  })

  it('merges case-insensitive names', () => {
    const existing: GroceryIngredient[] = [
      { name: 'Garlic', quantity: '2', unit: 'cloves' },
    ]
    const newItems: GroceryIngredient[] = [
      { name: 'garlic', quantity: '3', unit: 'cloves' },
    ]
    const result = mergeIngredients(existing, newItems)
    expect(result).toHaveLength(1)
    expect(result[0].quantity).toBe('5')
  })

  it('merges items with descriptor differences (fresh garlic vs minced garlic)', () => {
    const existing: GroceryIngredient[] = [
      { name: 'fresh garlic', quantity: '3', unit: 'cloves' },
    ]
    const newItems: GroceryIngredient[] = [
      { name: 'minced garlic', quantity: '1', unit: 'tsp' },
    ]
    const result = mergeIngredients(existing, newItems)
    expect(result).toHaveLength(1)
    // Different units that can't convert → combined with "+"
    expect(result[0].quantity).toContain('+')
    expect(result[0].name).toBe('fresh garlic') // shorter name picked
  })

  it('merges plural vs singular (tomato vs tomatoes)', () => {
    const existing: GroceryIngredient[] = [
      { name: 'tomatoes', quantity: '2', unit: null },
    ]
    const newItems: GroceryIngredient[] = [
      { name: 'tomato', quantity: '3', unit: null },
    ]
    const result = mergeIngredients(existing, newItems)
    expect(result).toHaveLength(1)
    expect(result[0].quantity).toBe('5')
  })

  it('combines incompatible units with + format', () => {
    const existing: GroceryIngredient[] = [
      { name: 'garlic', quantity: '4', unit: 'cloves' },
    ]
    const newItems: GroceryIngredient[] = [
      { name: 'garlic', quantity: '1', unit: 'tsp' },
    ]
    const result = mergeIngredients(existing, newItems)
    expect(result).toHaveLength(1)
    expect(result[0].quantity).toBe('4 cloves + 1 tsp')
    expect(result[0].unit).toBeNull() // unit baked into combined string
  })

  it('converts compatible units (tsp + tbsp)', () => {
    const existing: GroceryIngredient[] = [
      { name: 'salt', quantity: '2', unit: 'tsp' },
    ]
    const newItems: GroceryIngredient[] = [
      { name: 'salt', quantity: '1', unit: 'tbsp' },
    ]
    const result = mergeIngredients(existing, newItems)
    expect(result).toHaveLength(1)
    // 2 tsp + 1 tbsp = 5 tsp total → converted to tbsp (larger unit): 5/3 = 1⅔ tbsp
    expect(result[0].quantity).toBe('1 ⅔')
    expect(result[0].unit).toBe('tbsp')
  })

  it('converts compatible units (oz + lb)', () => {
    const existing: GroceryIngredient[] = [
      { name: 'chicken breast', quantity: '8', unit: 'oz' },
    ]
    const newItems: GroceryIngredient[] = [
      { name: 'chicken breast', quantity: '1', unit: 'lb' },
    ]
    const result = mergeIngredients(existing, newItems)
    expect(result).toHaveLength(1)
    // 8 oz + 16 oz = 24 oz → 1.5 lb (uses lb since it's the larger)
    expect(result[0].quantity).toBe('1 ½')
    expect(result[0].unit).toBe('lb')
  })

  it('normalizes unit aliases before comparing (tablespoon vs tbsp)', () => {
    const existing: GroceryIngredient[] = [
      { name: 'olive oil', quantity: '2', unit: 'tablespoons' },
    ]
    const newItems: GroceryIngredient[] = [
      { name: 'olive oil', quantity: '1', unit: 'tbsp' },
    ]
    const result = mergeIngredients(existing, newItems)
    expect(result).toHaveLength(1)
    expect(result[0].quantity).toBe('3')
  })

  it('keeps different ingredients separate', () => {
    const existing: GroceryIngredient[] = [
      { name: 'garlic', quantity: '3', unit: 'cloves' },
    ]
    const newItems: GroceryIngredient[] = [
      { name: 'onion', quantity: '1', unit: null },
    ]
    const result = mergeIngredients(existing, newItems)
    expect(result).toHaveLength(2)
  })

  it('handles items with no quantity', () => {
    const existing: GroceryIngredient[] = [
      { name: 'salt', quantity: null, unit: null },
    ]
    const newItems: GroceryIngredient[] = [
      { name: 'salt', quantity: '1', unit: 'tsp' },
    ]
    const result = mergeIngredients(existing, newItems)
    expect(result).toHaveLength(1)
  })

  it('handles items with no unit', () => {
    const existing: GroceryIngredient[] = [
      { name: 'eggs', quantity: '2', unit: null },
    ]
    const newItems: GroceryIngredient[] = [
      { name: 'eggs', quantity: '4', unit: null },
    ]
    const result = mergeIngredients(existing, newItems)
    expect(result).toHaveLength(1)
    expect(result[0].quantity).toBe('6')
  })

  it('handles fraction quantities', () => {
    const existing: GroceryIngredient[] = [
      { name: 'butter', quantity: '1/2', unit: 'cup' },
    ]
    const newItems: GroceryIngredient[] = [
      { name: 'butter', quantity: '1/4', unit: 'cup' },
    ]
    const result = mergeIngredients(existing, newItems)
    expect(result).toHaveLength(1)
    expect(result[0].quantity).toBe('¾')
    expect(result[0].unit).toBe('cup')
  })

  it('merges multiple items across recipes (real-world scenario)', () => {
    const recipe1: GroceryIngredient[] = [
      { name: 'garlic', quantity: '3', unit: 'cloves' },
      { name: 'olive oil', quantity: '2', unit: 'tbsp' },
      { name: 'chicken breast', quantity: '1', unit: 'lb' },
    ]
    const recipe2: GroceryIngredient[] = [
      { name: 'garlic', quantity: '4', unit: 'cloves' },
      { name: 'olive oil', quantity: '1', unit: 'tbsp' },
      { name: 'onion', quantity: '1', unit: null },
    ]

    // Merge recipe1, then merge recipe2 into result (like GenerateGroceryList does)
    let merged = mergeIngredients([], recipe1)
    merged = mergeIngredients(merged, recipe2)

    expect(merged).toHaveLength(4)

    const garlic = merged.find((m) => normalizeIngredientName(m.name) === 'garlic')
    expect(garlic).toBeDefined()
    expect(garlic!.quantity).toBe('7')

    const oil = merged.find((m) => normalizeIngredientName(m.name) === 'olive oil')
    expect(oil).toBeDefined()
    expect(oil!.quantity).toBe('3')

    const chicken = merged.find(
      (m) => normalizeIngredientName(m.name) === 'chicken'
    )
    expect(chicken).toBeDefined()
    expect(chicken!.quantity).toBe('1')

    const onion = merged.find((m) => normalizeIngredientName(m.name) === 'onion')
    expect(onion).toBeDefined()
    expect(onion!.quantity).toBe('1')
  })

  it('handles 3+ recipes with same ingredient accumulating', () => {
    let merged: GroceryIngredient[] = []
    merged = mergeIngredients(merged, [{ name: 'garlic', quantity: '2', unit: 'cloves' }])
    merged = mergeIngredients(merged, [{ name: 'garlic', quantity: '3', unit: 'cloves' }])
    merged = mergeIngredients(merged, [{ name: 'garlic', quantity: '1', unit: 'cloves' }])

    expect(merged).toHaveLength(1)
    expect(merged[0].quantity).toBe('6')
  })
})

describe('ingredientToGroceryIngredient', () => {
  it('converts Ingredient to GroceryIngredient', () => {
    const result = ingredientToGroceryIngredient({
      name: 'garlic',
      amount: '3',
      unit: 'cloves',
    })
    expect(result).toEqual({
      name: 'garlic',
      quantity: '3',
      unit: 'cloves',
    })
  })

  it('handles missing unit and amount', () => {
    const result = ingredientToGroceryIngredient({
      name: 'salt',
      amount: '',
    })
    expect(result).toEqual({
      name: 'salt',
      quantity: null,
      unit: null,
    })
  })
})

describe('ingredientsToGroceryIngredients', () => {
  it('converts array of ingredients', () => {
    const result = ingredientsToGroceryIngredients([
      { name: 'garlic', amount: '3', unit: 'cloves' },
      { name: 'salt', amount: '1', unit: 'tsp' },
    ])
    expect(result).toHaveLength(2)
    expect(result[0].name).toBe('garlic')
    expect(result[1].name).toBe('salt')
  })
})
