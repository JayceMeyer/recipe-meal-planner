import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { RecipeSuggestions } from './RecipeSuggestions'
import type { RecipeMatchResult } from '@/utils/ingredientMatcher'
import type { Recipe } from '@/types/database'

const STORAGE_KEY = 'recipe-suggestions-visible'

// Mock localStorage for testing
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

function mockRecipe(id: string, title: string): Recipe {
  return {
    id,
    user_id: 'user-1',
    household_id: 'household-1',
    title,
    description: null,
    image_url: null,
    source_url: null,
    servings: 4,
    prep_time: 10,
    cook_time: 20,
    ingredients: [],
    steps: [],
    notes: null,
    rating: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

function mockResult(
  id: string,
  title: string,
  matched: number,
  total: number,
  missing: string[] = []
): RecipeMatchResult {
  return {
    recipe: mockRecipe(id, title),
    matchedIngredients: [],
    matchScore: matched / total,
    matchedCount: matched,
    totalIngredients: total,
    missingCount: missing.length,
    missingIngredients: missing.map((name) => ({ name, amount: '1' })),
  }
}

describe('RecipeSuggestions', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  it('renders nothing when no suggestions', () => {
    const { container } = render(
      <MemoryRouter>
        <RecipeSuggestions canMake={[]} almostReady={[]} />
      </MemoryRouter>
    )

    expect(container.firstChild).toBeNull()
  })

  it('renders loading state', () => {
    render(
      <MemoryRouter>
        <RecipeSuggestions canMake={[]} almostReady={[]} loading={true} />
      </MemoryRouter>
    )

    expect(document.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('renders "You can make" section with canMake recipes', () => {
    const canMake = [
      mockResult('r1', 'Chicken Salad', 3, 3),
      mockResult('r2', 'Pasta', 4, 4),
    ]

    render(
      <MemoryRouter>
        <RecipeSuggestions canMake={canMake} almostReady={[]} />
      </MemoryRouter>
    )

    expect(screen.getByText('You can make (2)')).toBeInTheDocument()
    expect(screen.getByText('Chicken Salad')).toBeInTheDocument()
    expect(screen.getByText('Pasta')).toBeInTheDocument()
  })

  it('renders "Almost ready" section with almostReady recipes', () => {
    const almostReady = [
      mockResult('r1', 'Stir Fry', 2, 3, ['soy sauce']),
      mockResult('r2', 'Curry', 3, 5, ['coconut milk', 'curry paste']),
    ]

    render(
      <MemoryRouter>
        <RecipeSuggestions canMake={[]} almostReady={almostReady} />
      </MemoryRouter>
    )

    expect(screen.getByText('Almost ready (2)')).toBeInTheDocument()
    expect(screen.getByText('Stir Fry')).toBeInTheDocument()
    expect(screen.getByText('Curry')).toBeInTheDocument()
  })

  it('shows missing ingredients as badges', () => {
    const almostReady = [mockResult('r1', 'Stir Fry', 2, 3, ['soy sauce'])]

    render(
      <MemoryRouter>
        <RecipeSuggestions canMake={[]} almostReady={almostReady} />
      </MemoryRouter>
    )

    expect(screen.getByText('soy sauce')).toBeInTheDocument()
  })

  it('toggles visibility when clicking header', () => {
    const canMake = [mockResult('r1', 'Chicken Salad', 3, 3)]

    render(
      <MemoryRouter>
        <RecipeSuggestions canMake={canMake} almostReady={[]} />
      </MemoryRouter>
    )

    // Should be visible by default
    expect(screen.getByText('Chicken Salad')).toBeInTheDocument()

    // Click to hide
    fireEvent.click(screen.getByText('Recipe Suggestions'))

    // Recipe should be hidden now
    expect(screen.queryByText('Chicken Salad')).not.toBeInTheDocument()

    // Click to show again
    fireEvent.click(screen.getByText('Recipe Suggestions'))

    // Recipe should be visible again
    expect(screen.getByText('Chicken Salad')).toBeInTheDocument()
  })

  it('persists visibility preference to localStorage', () => {
    const canMake = [mockResult('r1', 'Chicken Salad', 3, 3)]

    render(
      <MemoryRouter>
        <RecipeSuggestions canMake={canMake} almostReady={[]} />
      </MemoryRouter>
    )

    // Initially visible, localStorage should be 'true'
    expect(localStorage.getItem(STORAGE_KEY)).toBe('true')

    // Hide suggestions
    fireEvent.click(screen.getByText('Recipe Suggestions'))

    // localStorage should be 'false'
    expect(localStorage.getItem(STORAGE_KEY)).toBe('false')
  })

  it('reads initial visibility from localStorage', () => {
    localStorage.setItem(STORAGE_KEY, 'false')

    const canMake = [mockResult('r1', 'Chicken Salad', 3, 3)]

    render(
      <MemoryRouter>
        <RecipeSuggestions canMake={canMake} almostReady={[]} />
      </MemoryRouter>
    )

    // Should be hidden based on localStorage
    expect(screen.queryByText('Chicken Salad')).not.toBeInTheDocument()
  })

  it('calls onAddMissing when clicking add button', () => {
    const onAddMissing = vi.fn()
    const almostReady = [mockResult('r1', 'Stir Fry', 2, 3, ['soy sauce'])]

    render(
      <MemoryRouter>
        <RecipeSuggestions
          canMake={[]}
          almostReady={almostReady}
          onAddMissing={onAddMissing}
        />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByText('Add 1 to list'))

    expect(onAddMissing).toHaveBeenCalledTimes(1)
    expect(onAddMissing).toHaveBeenCalledWith(almostReady[0])
  })

  it('shows total count in header', () => {
    const canMake = [mockResult('r1', 'Recipe 1', 3, 3)]
    const almostReady = [
      mockResult('r2', 'Recipe 2', 2, 3, ['a']),
      mockResult('r3', 'Recipe 3', 2, 3, ['b']),
    ]

    render(
      <MemoryRouter>
        <RecipeSuggestions canMake={canMake} almostReady={almostReady} />
      </MemoryRouter>
    )

    expect(screen.getByText('(3)')).toBeInTheDocument()
  })

  it('links to recipe detail page', () => {
    const canMake = [mockResult('r1', 'Chicken Salad', 3, 3)]

    render(
      <MemoryRouter>
        <RecipeSuggestions canMake={canMake} almostReady={[]} />
      </MemoryRouter>
    )

    const link = screen.getByRole('link', { name: /chicken salad/i })
    expect(link).toHaveAttribute('href', '/recipes/r1')
  })
})
