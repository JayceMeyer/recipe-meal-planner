import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { Recipes } from './Recipes'
import '@/test/mocks/supabase'
import type { Recipe } from '@/types/database'

const mockRefresh = vi.fn()

const mockRecipes: Recipe[] = [
  {
    id: 'recipe-1',
    user_id: 'user-123',
    household_id: 'household-1',
    title: 'Chocolate Chip Cookies',
    description: null,
    image_url: 'https://example.com/cookies.jpg',
    source_url: null,
    servings: 24,
    prep_time: 15,
    cook_time: 12,
    ingredients: [],
    steps: [],
    notes: null,
    rating: 5,
    cuisine: [],
    created_at: '2026-01-27T00:00:00Z',
    updated_at: '2026-01-27T00:00:00Z',
  },
  {
    id: 'recipe-2',
    user_id: 'user-123',
    household_id: 'household-1',
    title: 'Banana Bread',
    description: null,
    image_url: null,
    source_url: null,
    servings: 8,
    prep_time: 10,
    cook_time: 60,
    ingredients: [],
    steps: [],
    notes: null,
    rating: 4,
    cuisine: [],
    created_at: '2026-01-26T00:00:00Z',
    updated_at: '2026-01-26T00:00:00Z',
  },
]

let mockHookState = {
  recipes: [] as Recipe[],
  loading: false,
  error: null as string | null,
  refresh: mockRefresh,
}

vi.mock('@/hooks/useRecipes', () => ({
  useRecipes: () => mockHookState,
}))

vi.mock('@/hooks/useGroups', () => ({
  useGroups: () => ({
    groups: [],
    loading: false,
    error: null,
    createGroup: vi.fn(),
    updateGroup: vi.fn(),
    deleteGroup: vi.fn(),
    refresh: vi.fn(),
  }),
  useAllRecipeGroups: () => ({
    recipeGroupMap: new Map(),
    loading: false,
    error: null,
  }),
}))

describe('Recipes - Loading State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHookState = {
      recipes: [],
      loading: true,
      error: null,
      refresh: mockRefresh,
    }
  })

  it('displays loading spinner', () => {
    render(
      <MemoryRouter>
        <Recipes />
      </MemoryRouter>
    )

    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })
})

describe('Recipes - Error State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHookState = {
      recipes: [],
      loading: false,
      error: 'Failed to load recipes',
      refresh: mockRefresh,
    }
  })

  it('displays error message', () => {
    render(
      <MemoryRouter>
        <Recipes />
      </MemoryRouter>
    )

    expect(screen.getByText('Failed to load recipes')).toBeInTheDocument()
  })
})

describe('Recipes - Empty State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHookState = {
      recipes: [],
      loading: false,
      error: null,
      refresh: mockRefresh,
    }
  })

  it('displays empty state message', () => {
    render(
      <MemoryRouter>
        <Recipes />
      </MemoryRouter>
    )

    expect(screen.getByText('No recipes yet')).toBeInTheDocument()
    expect(screen.getByText(/Start by adding your first recipe/)).toBeInTheDocument()
  })

  it('shows add recipe button in empty state', () => {
    render(
      <MemoryRouter>
        <Recipes />
      </MemoryRouter>
    )

    expect(screen.getByRole('link', { name: /add your first recipe/i })).toHaveAttribute(
      'href',
      '/recipes/add'
    )
  })

  it('does not show search bar when empty', () => {
    render(
      <MemoryRouter>
        <Recipes />
      </MemoryRouter>
    )

    expect(screen.queryByPlaceholderText(/search/i)).not.toBeInTheDocument()
  })
})

describe('Recipes - With Data', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHookState = {
      recipes: mockRecipes,
      loading: false,
      error: null,
      refresh: mockRefresh,
    }
  })

  it('displays recipe cards', () => {
    render(
      <MemoryRouter>
        <Recipes />
      </MemoryRouter>
    )

    expect(screen.getByText('Chocolate Chip Cookies')).toBeInTheDocument()
    expect(screen.getByText('Banana Bread')).toBeInTheDocument()
  })

  it('shows search bar', () => {
    render(
      <MemoryRouter>
        <Recipes />
      </MemoryRouter>
    )

    expect(screen.getByPlaceholderText(/search recipes/i)).toBeInTheDocument()
  })

  it('filters recipes by search term', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <Recipes />
      </MemoryRouter>
    )

    await user.type(screen.getByPlaceholderText(/search recipes/i), 'banana')

    expect(screen.getByText('Banana Bread')).toBeInTheDocument()
    expect(screen.queryByText('Chocolate Chip Cookies')).not.toBeInTheDocument()
  })

  it('shows no results message when search has no matches', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <Recipes />
      </MemoryRouter>
    )

    await user.type(screen.getByPlaceholderText(/search recipes/i), 'pizza')

    expect(screen.getByText('No recipes found')).toBeInTheDocument()
    expect(screen.getByText(/Try a different search term/)).toBeInTheDocument()
  })

  it('has add recipe button in header', () => {
    render(
      <MemoryRouter>
        <Recipes />
      </MemoryRouter>
    )

    expect(screen.getByRole('link', { name: /add recipe/i })).toHaveAttribute(
      'href',
      '/recipes/add'
    )
  })
})
