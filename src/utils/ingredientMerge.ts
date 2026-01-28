import { parseAmount, formatAmount } from './fractions'
import type { Ingredient } from '@/types/database'

export interface GroceryIngredient {
  name: string
  quantity: string | null
  unit: string | null
}

function normalizeIngredientName(name: string): string {
  return name.toLowerCase().trim()
}

function normalizeUnit(unit: string | undefined | null): string | null {
  if (!unit) return null
  const normalized = unit.toLowerCase().trim()
  const unitMap: Record<string, string> = {
    tablespoon: 'tbsp',
    tablespoons: 'tbsp',
    tbsps: 'tbsp',
    teaspoon: 'tsp',
    teaspoons: 'tsp',
    tsps: 'tsp',
    cup: 'cup',
    cups: 'cup',
    ounce: 'oz',
    ounces: 'oz',
    pound: 'lb',
    pounds: 'lb',
    lbs: 'lb',
    gram: 'g',
    grams: 'g',
    kilogram: 'kg',
    kilograms: 'kg',
    milliliter: 'ml',
    milliliters: 'ml',
    liter: 'l',
    liters: 'l',
  }
  return unitMap[normalized] ?? normalized
}

function canMergeUnits(unit1: string | null, unit2: string | null): boolean {
  if (unit1 === unit2) return true
  if (!unit1 && !unit2) return true
  return false
}

export function mergeIngredients(
  existing: GroceryIngredient[],
  newIngredients: GroceryIngredient[]
): GroceryIngredient[] {
  const result = [...existing]

  for (const newItem of newIngredients) {
    const normalizedName = normalizeIngredientName(newItem.name)
    const normalizedUnit = normalizeUnit(newItem.unit)

    const existingIndex = result.findIndex((item) => {
      const itemNormalizedName = normalizeIngredientName(item.name)
      const itemNormalizedUnit = normalizeUnit(item.unit)
      return (
        itemNormalizedName === normalizedName && canMergeUnits(itemNormalizedUnit, normalizedUnit)
      )
    })

    if (existingIndex === -1) {
      result.push({
        name: newItem.name,
        quantity: newItem.quantity,
        unit: newItem.unit,
      })
    } else {
      const existingItem = result[existingIndex]
      const existingAmount = existingItem.quantity ? parseAmount(existingItem.quantity) : null
      const newAmount = newItem.quantity ? parseAmount(newItem.quantity) : null

      if (existingAmount !== null && newAmount !== null) {
        const combined = existingAmount + newAmount
        result[existingIndex] = {
          ...existingItem,
          quantity: formatAmount(combined),
        }
      } else if (newAmount !== null && existingAmount === null) {
        result[existingIndex] = {
          ...existingItem,
          quantity: newItem.quantity,
        }
      }
    }
  }

  return result
}

export function ingredientToGroceryIngredient(ingredient: Ingredient): GroceryIngredient {
  return {
    name: ingredient.name,
    quantity: ingredient.amount || null,
    unit: ingredient.unit || null,
  }
}

export function ingredientsToGroceryIngredients(ingredients: Ingredient[]): GroceryIngredient[] {
  return ingredients.map(ingredientToGroceryIngredient)
}
