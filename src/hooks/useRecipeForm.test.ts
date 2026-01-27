import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useRecipeForm } from './useRecipeForm'
import '@/test/mocks/supabase'
import type { Recipe } from '@/types/database'

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-123' } }),
}))

const mockSupabase = vi.hoisted(() => ({
  from: vi.fn(() => ({
    insert: vi.fn(() => ({
      select: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({ data: { id: 'new-recipe-id' }, error: null })),
      })),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => Promise.resolve({ error: null })),
    })),
  })),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: mockSupabase,
}))

const mockRecipe: Recipe = {
  id: 'recipe-123',
  user_id: 'user-123',
  title: 'Existing Recipe',
  description: 'A test recipe',
  image_url: 'https://example.com/image.jpg',
  source_url: 'https://example.com/recipe',
  servings: 4,
  prep_time: 15,
  cook_time: 30,
  ingredients: [
    { name: 'flour', amount: '2', unit: 'cups' },
    { name: 'sugar', amount: '1', unit: 'cup' },
  ],
  steps: [
    { order: 1, instruction: 'Mix ingredients' },
    { order: 2, instruction: 'Bake' },
  ],
  notes: 'Test notes',
  rating: 5,
  created_at: '2026-01-27T00:00:00Z',
  updated_at: '2026-01-27T00:00:00Z',
}

describe('useRecipeForm - Create Mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with empty form data', () => {
    const { result } = renderHook(() => useRecipeForm())

    expect(result.current.formData.title).toBe('')
    expect(result.current.formData.ingredients).toHaveLength(1)
    expect(result.current.formData.steps).toHaveLength(1)
  })

  it('is invalid when title is empty', () => {
    const { result } = renderHook(() => useRecipeForm())

    expect(result.current.isValid).toBe(false)
  })

  it('is valid when title is provided', () => {
    const { result } = renderHook(() => useRecipeForm())

    act(() => {
      result.current.updateField('title', 'My Recipe')
    })

    expect(result.current.isValid).toBe(true)
  })

  it('updates field values', () => {
    const { result } = renderHook(() => useRecipeForm())

    act(() => {
      result.current.updateField('title', 'New Title')
      result.current.updateField('description', 'New Description')
    })

    expect(result.current.formData.title).toBe('New Title')
    expect(result.current.formData.description).toBe('New Description')
  })
})

describe('useRecipeForm - Edit Mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with existing recipe data', () => {
    const { result } = renderHook(() => useRecipeForm(mockRecipe))

    expect(result.current.formData.title).toBe('Existing Recipe')
    expect(result.current.formData.description).toBe('A test recipe')
    expect(result.current.formData.servings).toBe('4')
    expect(result.current.formData.ingredients).toHaveLength(2)
    expect(result.current.formData.steps).toHaveLength(2)
  })

  it('is valid with existing title', () => {
    const { result } = renderHook(() => useRecipeForm(mockRecipe))

    expect(result.current.isValid).toBe(true)
  })
})

describe('useRecipeForm - Ingredient Management', () => {
  it('adds a new ingredient', () => {
    const { result } = renderHook(() => useRecipeForm())

    act(() => {
      result.current.addIngredient()
    })

    expect(result.current.formData.ingredients).toHaveLength(2)
  })

  it('updates an ingredient', () => {
    const { result } = renderHook(() => useRecipeForm())

    act(() => {
      result.current.updateIngredient(0, { name: 'flour', amount: '2', unit: 'cups' })
    })

    expect(result.current.formData.ingredients[0].name).toBe('flour')
    expect(result.current.formData.ingredients[0].amount).toBe('2')
  })

  it('removes an ingredient', () => {
    const { result } = renderHook(() => useRecipeForm())

    act(() => {
      result.current.addIngredient()
      result.current.updateIngredient(0, { name: 'flour', amount: '2', unit: 'cups' })
      result.current.updateIngredient(1, { name: 'sugar', amount: '1', unit: 'cup' })
    })

    expect(result.current.formData.ingredients).toHaveLength(2)

    act(() => {
      result.current.removeIngredient(0)
    })

    expect(result.current.formData.ingredients).toHaveLength(1)
    expect(result.current.formData.ingredients[0].name).toBe('sugar')
  })

  it('moves an ingredient', () => {
    const { result } = renderHook(() => useRecipeForm())

    act(() => {
      result.current.addIngredient()
      result.current.updateIngredient(0, { name: 'first', amount: '1', unit: '' })
      result.current.updateIngredient(1, { name: 'second', amount: '2', unit: '' })
    })

    act(() => {
      result.current.moveIngredient(0, 1)
    })

    expect(result.current.formData.ingredients[0].name).toBe('second')
    expect(result.current.formData.ingredients[1].name).toBe('first')
  })
})

describe('useRecipeForm - Step Management', () => {
  it('adds a new step', () => {
    const { result } = renderHook(() => useRecipeForm())

    act(() => {
      result.current.addStep()
    })

    expect(result.current.formData.steps).toHaveLength(2)
    expect(result.current.formData.steps[1].order).toBe(2)
  })

  it('updates a step', () => {
    const { result } = renderHook(() => useRecipeForm())

    act(() => {
      result.current.updateStep(0, 'Mix all ingredients together')
    })

    expect(result.current.formData.steps[0].instruction).toBe('Mix all ingredients together')
  })

  it('removes a step and renumbers', () => {
    const { result } = renderHook(() => useRecipeForm())

    act(() => {
      result.current.addStep()
      result.current.addStep()
      result.current.updateStep(0, 'Step 1')
      result.current.updateStep(1, 'Step 2')
      result.current.updateStep(2, 'Step 3')
    })

    act(() => {
      result.current.removeStep(1)
    })

    expect(result.current.formData.steps).toHaveLength(2)
    expect(result.current.formData.steps[0].order).toBe(1)
    expect(result.current.formData.steps[1].order).toBe(2)
    expect(result.current.formData.steps[1].instruction).toBe('Step 3')
  })

  it('moves a step and renumbers', () => {
    const { result } = renderHook(() => useRecipeForm())

    act(() => {
      result.current.addStep()
      result.current.updateStep(0, 'First')
      result.current.updateStep(1, 'Second')
    })

    act(() => {
      result.current.moveStep(0, 1)
    })

    expect(result.current.formData.steps[0].instruction).toBe('Second')
    expect(result.current.formData.steps[0].order).toBe(1)
    expect(result.current.formData.steps[1].instruction).toBe('First')
    expect(result.current.formData.steps[1].order).toBe(2)
  })
})
