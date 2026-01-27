import { renderHook, act, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useGroups, useRecipeGroups, useAllRecipeGroups } from './useGroups'

const mockUser = { id: 'user-123' }

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser }),
}))

// Create a flexible mock that can handle different chain patterns
const createMockChain = (finalResult: unknown) => {
  const chain: Record<string, unknown> = {}
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'order', 'single']

  methods.forEach(method => {
    chain[method] = vi.fn(() => {
      // If this is a terminal method, return the result
      if (method === 'order' || method === 'single') {
        return Promise.resolve(finalResult)
      }
      // Otherwise, return the chain for more chaining
      return chain
    })
  })

  return chain
}

let mockChain: ReturnType<typeof createMockChain>

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => mockChain,
  },
}))

describe('useGroups', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockChain = createMockChain({
      data: [
        { id: 'group-1', name: 'Breakfast', user_id: 'user-123' },
        { id: 'group-2', name: 'Dinner', user_id: 'user-123' },
      ],
      error: null,
    })
  })

  it('returns initial loading state', () => {
    const { result } = renderHook(() => useGroups())

    expect(result.current.loading).toBe(true)
    expect(result.current.groups).toEqual([])
    expect(result.current.error).toBe(null)
  })

  it('fetches groups on mount', async () => {
    const { result } = renderHook(() => useGroups())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.groups).toHaveLength(2)
    expect(result.current.groups[0].name).toBe('Breakfast')
  })

  it('provides createGroup function', async () => {
    // Override the chain for insert
    mockChain.insert = vi.fn(() => ({
      select: () => ({
        single: () => Promise.resolve({
          data: { id: 'group-3', name: 'Lunch', user_id: 'user-123' },
          error: null,
        }),
      }),
    }))

    const { result } = renderHook(() => useGroups())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    let newGroup
    await act(async () => {
      newGroup = await result.current.createGroup('Lunch')
    })

    expect(newGroup).toEqual({ id: 'group-3', name: 'Lunch', user_id: 'user-123' })
    expect(mockChain.insert).toHaveBeenCalled()
  })

  it('provides updateGroup function', async () => {
    mockChain.update = vi.fn(() => ({
      eq: () => Promise.resolve({ error: null }),
    }))

    const { result } = renderHook(() => useGroups())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    let success
    await act(async () => {
      success = await result.current.updateGroup('group-1', 'Brunch')
    })

    expect(success).toBe(true)
    expect(mockChain.update).toHaveBeenCalled()
  })

  it('provides deleteGroup function', async () => {
    mockChain.delete = vi.fn(() => ({
      eq: () => Promise.resolve({ error: null }),
    }))

    const { result } = renderHook(() => useGroups())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    let success
    await act(async () => {
      success = await result.current.deleteGroup('group-1')
    })

    expect(success).toBe(true)
    expect(mockChain.delete).toHaveBeenCalled()
  })
})

describe('useRecipeGroups', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockChain = createMockChain({
      data: [{ group_id: 'group-1' }, { group_id: 'group-2' }],
      error: null,
    })
    // Override eq to return the result directly
    mockChain.eq = vi.fn(() => Promise.resolve({
      data: [{ group_id: 'group-1' }, { group_id: 'group-2' }],
      error: null,
    }))
  })

  it('returns initial loading state', () => {
    const { result } = renderHook(() => useRecipeGroups('recipe-123'))

    expect(result.current.loading).toBe(true)
    expect(result.current.groupIds).toEqual([])
  })

  it('returns empty when recipeId is undefined', async () => {
    const { result } = renderHook(() => useRecipeGroups(undefined))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.groupIds).toEqual([])
  })

  it('provides addToGroup function', async () => {
    mockChain.insert = vi.fn(() => Promise.resolve({ error: null }))

    const { result } = renderHook(() => useRecipeGroups('recipe-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    let success
    await act(async () => {
      success = await result.current.addToGroup('group-3')
    })

    expect(success).toBe(true)
    expect(mockChain.insert).toHaveBeenCalled()
  })

  it('provides removeFromGroup function', async () => {
    mockChain.delete = vi.fn(() => ({
      eq: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }))

    const { result } = renderHook(() => useRecipeGroups('recipe-123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    let success
    await act(async () => {
      success = await result.current.removeFromGroup('group-1')
    })

    expect(success).toBe(true)
    expect(mockChain.delete).toHaveBeenCalled()
  })
})

describe('useAllRecipeGroups', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockChain = createMockChain({
      data: [
        { recipe_id: 'recipe-1', group_id: 'group-1' },
        { recipe_id: 'recipe-1', group_id: 'group-2' },
        { recipe_id: 'recipe-2', group_id: 'group-1' },
      ],
      error: null,
    })
    // Override select to return the result directly
    mockChain.select = vi.fn(() => Promise.resolve({
      data: [
        { recipe_id: 'recipe-1', group_id: 'group-1' },
        { recipe_id: 'recipe-1', group_id: 'group-2' },
        { recipe_id: 'recipe-2', group_id: 'group-1' },
      ],
      error: null,
    }))
  })

  it('returns initial loading state', () => {
    const { result } = renderHook(() => useAllRecipeGroups())

    expect(result.current.loading).toBe(true)
    expect(result.current.recipeGroupMap.size).toBe(0)
  })

  it('builds recipe group map after fetch', async () => {
    const { result } = renderHook(() => useAllRecipeGroups())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.recipeGroupMap.size).toBe(2)
    expect(result.current.recipeGroupMap.get('recipe-1')).toEqual(['group-1', 'group-2'])
    expect(result.current.recipeGroupMap.get('recipe-2')).toEqual(['group-1'])
  })
})
