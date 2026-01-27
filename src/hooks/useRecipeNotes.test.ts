import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useRecipeNotes } from './useRecipeNotes'

const mockEq = vi.fn(() => Promise.resolve({ error: null }))
const mockUpdate = vi.fn(() => ({
  eq: mockEq,
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      update: mockUpdate,
    }),
  },
}))

describe('useRecipeNotes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initializes with no saving state', () => {
    const { result } = renderHook(() => useRecipeNotes('recipe-123'))

    expect(result.current.saving).toBe(false)
    expect(result.current.error).toBe(null)
  })

  it('debounces notes save', () => {
    const { result } = renderHook(() => useRecipeNotes('recipe-123'))

    act(() => {
      result.current.saveNotes('Note 1')
      result.current.saveNotes('Note 2')
      result.current.saveNotes('Note 3')
    })

    // Should not have called yet
    expect(mockUpdate).not.toHaveBeenCalled()

    // Fast forward past debounce
    act(() => {
      vi.advanceTimersByTime(600)
    })

    // Now it should have been called once
    expect(mockUpdate).toHaveBeenCalledTimes(1)
  })

  it('saves rating immediately without debounce', () => {
    const { result } = renderHook(() => useRecipeNotes('recipe-123'))

    act(() => {
      result.current.saveRating(4)
    })

    expect(mockUpdate).toHaveBeenCalledTimes(1)
  })

  it('does not save when recipeId is undefined', () => {
    const { result } = renderHook(() => useRecipeNotes(undefined))

    act(() => {
      result.current.saveRating(5)
    })

    expect(mockUpdate).not.toHaveBeenCalled()
  })
})
