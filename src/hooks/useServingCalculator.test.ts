import { renderHook, act } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { useServingCalculator } from './useServingCalculator'
import type { Ingredient } from '@/types/database'

const mockIngredients: Ingredient[] = [
  { name: 'flour', amount: '2', unit: 'cups' },
  { name: 'sugar', amount: '1', unit: 'cup' },
  { name: 'salt', amount: '1/2', unit: 'tsp' },
]

describe('useServingCalculator', () => {
  it('initializes with original servings', () => {
    const { result } = renderHook(() => useServingCalculator(4, mockIngredients))

    expect(result.current.currentServings).toBe(4)
    expect(result.current.isModified).toBe(false)
  })

  it('returns original ingredients when not modified', () => {
    const { result } = renderHook(() => useServingCalculator(4, mockIngredients))

    expect(result.current.scaledIngredients).toEqual(mockIngredients)
  })

  it('increments servings', () => {
    const { result } = renderHook(() => useServingCalculator(4, mockIngredients))

    act(() => {
      result.current.increment()
    })

    expect(result.current.currentServings).toBe(5)
    expect(result.current.isModified).toBe(true)
  })

  it('decrements servings', () => {
    const { result } = renderHook(() => useServingCalculator(4, mockIngredients))

    act(() => {
      result.current.decrement()
    })

    expect(result.current.currentServings).toBe(3)
    expect(result.current.isModified).toBe(true)
  })

  it('does not decrement below 1', () => {
    const { result } = renderHook(() => useServingCalculator(1, mockIngredients))

    act(() => {
      result.current.decrement()
    })

    expect(result.current.currentServings).toBe(1)
  })

  it('resets to original servings', () => {
    const { result } = renderHook(() => useServingCalculator(4, mockIngredients))

    act(() => {
      result.current.increment()
      result.current.increment()
    })

    expect(result.current.currentServings).toBe(6)

    act(() => {
      result.current.reset()
    })

    expect(result.current.currentServings).toBe(4)
    expect(result.current.isModified).toBe(false)
  })

  it('scales ingredients when servings increase', () => {
    const { result } = renderHook(() => useServingCalculator(4, mockIngredients))

    act(() => {
      result.current.increment()
      result.current.increment()
      result.current.increment()
      result.current.increment()
    })

    // 4 -> 8 servings = 2x ratio
    expect(result.current.currentServings).toBe(8)
    expect(result.current.scaledIngredients[0].amount).toBe('4') // 2 * 2 = 4
    expect(result.current.scaledIngredients[1].amount).toBe('2') // 1 * 2 = 2
    expect(result.current.scaledIngredients[2].amount).toBe('1') // 0.5 * 2 = 1
  })

  it('scales ingredients when servings decrease', () => {
    const { result } = renderHook(() => useServingCalculator(4, mockIngredients))

    act(() => {
      result.current.decrement()
      result.current.decrement()
    })

    // 4 -> 2 servings = 0.5x ratio
    expect(result.current.currentServings).toBe(2)
    expect(result.current.scaledIngredients[0].amount).toBe('1') // 2 * 0.5 = 1
    expect(result.current.scaledIngredients[1].amount).toBe('½') // 1 * 0.5 = 0.5
    expect(result.current.scaledIngredients[2].amount).toBe('¼') // 0.5 * 0.5 = 0.25
  })

  it('handles empty ingredients', () => {
    const { result } = renderHook(() => useServingCalculator(4, []))

    expect(result.current.scaledIngredients).toEqual([])

    act(() => {
      result.current.increment()
    })

    expect(result.current.scaledIngredients).toEqual([])
  })

  it('handles zero original servings', () => {
    const { result } = renderHook(() => useServingCalculator(0, mockIngredients))

    expect(result.current.currentServings).toBe(0)
    // Should return original ingredients when ratio would be invalid
    expect(result.current.scaledIngredients).toEqual(mockIngredients)
  })

  it('preserves ingredient name and unit', () => {
    const { result } = renderHook(() => useServingCalculator(4, mockIngredients))

    act(() => {
      result.current.increment()
    })

    expect(result.current.scaledIngredients[0].name).toBe('flour')
    expect(result.current.scaledIngredients[0].unit).toBe('cups')
  })

  it('handles ingredients without amounts', () => {
    const ingredientsWithoutAmount: Ingredient[] = [
      { name: 'salt', amount: 'to taste', unit: undefined },
    ]
    const { result } = renderHook(() => useServingCalculator(4, ingredientsWithoutAmount))

    act(() => {
      result.current.increment()
    })

    // Non-numeric amounts should be preserved
    expect(result.current.scaledIngredients[0].amount).toBe('to taste')
  })

  it('updates when original servings change', () => {
    const { result, rerender } = renderHook(
      ({ servings, ingredients }) => useServingCalculator(servings, ingredients),
      { initialProps: { servings: 4, ingredients: mockIngredients } }
    )

    expect(result.current.currentServings).toBe(4)

    rerender({ servings: 8, ingredients: mockIngredients })

    expect(result.current.currentServings).toBe(8)
    expect(result.current.isModified).toBe(false)
  })
})
