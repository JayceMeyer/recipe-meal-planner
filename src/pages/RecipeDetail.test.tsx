import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { RecipeDetail } from './RecipeDetail'
import '@/test/mocks/supabase'
import type { Recipe } from '@/types/database'

const mockDeleteRecipe = vi.fn()
const mockNavigate = vi.fn()

const mockRecipe: Recipe = {
  id: 'recipe-123',
  user_id: 'user-123',
  household_id: 'household-1',
  title: 'Chocolate Chip Cookies',
  description: 'Delicious homemade cookies',
  image_url: 'https://example.com/cookies.jpg',
  source_url: 'https://example.com/recipe',
  servings: 24,
  prep_time: 15,
  cook_time: 12,
  ingredients: [
    { name: 'flour', amount: '2 cups', unit: undefined },
    { name: 'sugar', amount: '1 cup', unit: undefined },
  ],
  steps: [
    { order: 1, instruction: 'Mix dry ingredients' },
    { order: 2, instruction: 'Add wet ingredients' },
    { order: 3, instruction: 'Bake at 350F for 12 minutes' },
  ],
  notes: 'Best served warm',
  rating: 5,
  cuisine: [],
  created_at: '2026-01-27T00:00:00Z',
  updated_at: '2026-01-27T00:00:00Z',
}

let mockHookState = {
  recipe: null as Recipe | null,
  loading: false,
  error: null as string | null,
  deleteRecipe: mockDeleteRecipe,
}

vi.mock('@/hooks/useRecipe', () => ({
  useRecipe: () => mockHookState,
}))

vi.mock('@/hooks/useRecipeNotes', () => ({
  useRecipeNotes: () => ({
    saving: false,
    error: null,
    saveNotes: vi.fn(),
    saveRating: vi.fn(),
  }),
}))

vi.mock('@/components/AddToGroceryList', () => ({
  AddToGroceryList: () => null,
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

function renderWithRouter() {
  return render(
    <MemoryRouter initialEntries={['/recipes/recipe-123']}>
      <Routes>
        <Route path="/recipes/:id" element={<RecipeDetail />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('RecipeDetail - Loading State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHookState = {
      recipe: null,
      loading: true,
      error: null,
      deleteRecipe: mockDeleteRecipe,
    }
  })

  it('displays loading spinner', () => {
    renderWithRouter()
    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })
})

describe('RecipeDetail - Error State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHookState = {
      recipe: null,
      loading: false,
      error: 'Recipe not found',
      deleteRecipe: mockDeleteRecipe,
    }
  })

  it('displays error message', () => {
    renderWithRouter()
    expect(screen.getByText('Recipe not found')).toBeInTheDocument()
  })

  it('shows back button', () => {
    renderWithRouter()
    expect(screen.getByRole('button', { name: /back to recipes/i })).toBeInTheDocument()
  })
})

describe('RecipeDetail - With Recipe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDeleteRecipe.mockResolvedValue(true)
    mockHookState = {
      recipe: mockRecipe,
      loading: false,
      error: null,
      deleteRecipe: mockDeleteRecipe,
    }
  })

  it('displays recipe title', () => {
    renderWithRouter()
    expect(screen.getByText('Chocolate Chip Cookies')).toBeInTheDocument()
  })

  it('displays recipe image', () => {
    renderWithRouter()
    const img = screen.getByAltText('Chocolate Chip Cookies')
    expect(img).toHaveAttribute('src', 'https://example.com/cookies.jpg')
  })

  it('displays total time', () => {
    renderWithRouter()
    expect(screen.getByText('27 min')).toBeInTheDocument()
  })

  it('displays serving adjuster', () => {
    renderWithRouter()
    expect(screen.getByText('Servings:')).toBeInTheDocument()
    expect(screen.getByText('24')).toBeInTheDocument()
  })

  it('displays source link', () => {
    renderWithRouter()
    const sourceLink = screen.getByRole('link', { name: /source/i })
    expect(sourceLink).toHaveAttribute('href', 'https://example.com/recipe')
  })

  it('displays description', () => {
    renderWithRouter()
    expect(screen.getByText('Delicious homemade cookies')).toBeInTheDocument()
  })

  it('displays ingredients', () => {
    renderWithRouter()
    expect(screen.getByText(/2 cups.*flour/)).toBeInTheDocument()
    expect(screen.getByText(/1 cup.*sugar/)).toBeInTheDocument()
  })

  it('displays instructions', () => {
    renderWithRouter()
    expect(screen.getByText('Mix dry ingredients')).toBeInTheDocument()
    expect(screen.getByText('Add wet ingredients')).toBeInTheDocument()
    expect(screen.getByText('Bake at 350F for 12 minutes')).toBeInTheDocument()
  })

  it('displays notes', () => {
    renderWithRouter()
    expect(screen.getByText('Best served warm')).toBeInTheDocument()
  })

  it('has edit button linking to edit page', () => {
    renderWithRouter()
    const editLink = screen.getByRole('link', { name: '' })
    expect(editLink).toHaveAttribute('href', '/recipes/recipe-123/edit')
  })

  it('shows delete confirmation dialog', async () => {
    const user = userEvent.setup()
    renderWithRouter()

    await user.click(screen.getAllByRole('button')[1])

    expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument()
  })

  it('calls deleteRecipe and navigates on confirm', async () => {
    const user = userEvent.setup()
    renderWithRouter()

    await user.click(screen.getAllByRole('button')[1])
    await user.click(screen.getByRole('button', { name: /^delete$/i }))

    await waitFor(() => {
      expect(mockDeleteRecipe).toHaveBeenCalled()
      expect(mockNavigate).toHaveBeenCalledWith('/recipes')
    })
  })

  it('closes dialog on cancel', async () => {
    const user = userEvent.setup()
    renderWithRouter()

    await user.click(screen.getAllByRole('button')[1])
    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(screen.queryByText(/are you sure you want to delete/i)).not.toBeInTheDocument()
  })
})

describe('RecipeDetail - Without Optional Fields', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHookState = {
      recipe: {
        ...mockRecipe,
        image_url: null,
        description: null,
        source_url: null,
        notes: null,
        prep_time: null,
        cook_time: null,
      },
      loading: false,
      error: null,
      deleteRecipe: mockDeleteRecipe,
    }
  })

  it('handles missing image gracefully', () => {
    renderWithRouter()
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('handles missing time gracefully', () => {
    renderWithRouter()
    expect(screen.queryByText(/^\d+ min$/)).not.toBeInTheDocument()
  })

  it('handles missing source gracefully', () => {
    renderWithRouter()
    expect(screen.queryByRole('link', { name: /source/i })).not.toBeInTheDocument()
  })

  it('renders notes section', () => {
    renderWithRouter()
    expect(screen.getByText('My Notes')).toBeInTheDocument()
  })
})
