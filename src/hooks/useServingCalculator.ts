import { useState, useMemo, useCallback, useEffect } from 'react'
import { scaleAmount } from '@/utils/fractions'
import type { Ingredient } from '@/types/database'

interface UseServingCalculatorResult {
  currentServings: number
  scaledIngredients: Ingredient[]
  increment: () => void
  decrement: () => void
  reset: () => void
  isModified: boolean
}

export function useServingCalculator(
  originalServings: number,
  ingredients: Ingredient[]
): UseServingCalculatorResult {
  const [currentServings, setCurrentServings] = useState(originalServings)

  useEffect(() => {
    setCurrentServings(originalServings)
  }, [originalServings])

  const ratio = originalServings > 0 ? currentServings / originalServings : 1

  const scaledIngredients = useMemo(() => {
    if (ratio === 1) return ingredients

    return ingredients.map((ingredient) => ({
      ...ingredient,
      amount: scaleAmount(ingredient.amount, ratio),
    }))
  }, [ingredients, ratio])

  const increment = useCallback(() => {
    setCurrentServings((prev) => prev + 1)
  }, [])

  const decrement = useCallback(() => {
    setCurrentServings((prev) => (prev > 1 ? prev - 1 : prev))
  }, [])

  const reset = useCallback(() => {
    setCurrentServings(originalServings)
  }, [originalServings])

  const isModified = currentServings !== originalServings

  return {
    currentServings,
    scaledIngredients,
    increment,
    decrement,
    reset,
    isModified,
  }
}
