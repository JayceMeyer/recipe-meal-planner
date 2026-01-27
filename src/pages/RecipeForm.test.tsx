import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { RecipeForm } from './RecipeForm'
import '@/test/mocks/supabase'
import type { Recipe } from '@/types/database'

const mockNavigate = vi.fn()

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

let mockHookState = {
  recipe: null as Recipe | null,
  loading: false,
  error: null as string | null,
  deleteRecipe: vi.fn(),
}

vi.mock('@/hooks/useRecipe', () => ({
  useRecipe: () => mockHookState,
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-123' } }),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      insert: () => ({
        select: () => ({
          single: () => Promise.resolve({ data: { id: 'new-recipe-id' }, error: null }),
        }),
      }),
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
  },
}))

function renderCreateMode() {
  return render(
    <MemoryRouter initialEntries={['/recipes/new']}>
      <Routes>
        <Route path="/recipes/new" element={<RecipeForm />} />
      </Routes>
    </MemoryRouter>
  )
}

function renderEditMode() {
  return render(
    <MemoryRouter initialEntries={['/recipes/recipe-123/edit']}>
      <Routes>
        <Route path="/recipes/:id/edit" element={<RecipeForm />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('RecipeForm - Create Mode', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHookState = {
      recipe: null,
      loading: false,
      error: null,
      deleteRecipe: vi.fn(),
    }
  })

  it('displays "New Recipe" title', () => {
    renderCreateMode()

    expect(screen.getByText('New Recipe')).toBeInTheDocument()
  })

  it('shows empty form fields', () => {
    renderCreateMode()

    expect(screen.getByLabelText(/title/i)).toHaveValue('')
  })

  it('disables submit when title is empty', () => {
    renderCreateMode()

    expect(screen.getByRole('button', { name: /create recipe/i })).toBeDisabled()
  })

  it('enables submit when title is provided', async () => {
    const user = userEvent.setup()
    renderCreateMode()

    await user.type(screen.getByLabelText(/title/i), 'My New Recipe')

    expect(screen.getByRole('button', { name: /create recipe/i })).not.toBeDisabled()
  })

  it('shows ingredient list with one empty ingredient', () => {
    renderCreateMode()

    expect(screen.getByText('Ingredients')).toBeInTheDocument()
    expect(screen.getAllByPlaceholderText('Ingredient name')).toHaveLength(1)
  })

  it('shows step list with one empty step', () => {
    renderCreateMode()

    expect(screen.getByText('Instructions')).toBeInTheDocument()
    expect(screen.getAllByPlaceholderText(/describe this step/i)).toHaveLength(1)
  })

  it('adds ingredient when Add button is clicked', async () => {
    const user = userEvent.setup()
    renderCreateMode()

    await user.click(screen.getByRole('button', { name: /^add$/i }))

    expect(screen.getAllByPlaceholderText('Ingredient name')).toHaveLength(2)
  })

  it('adds step when Add Step button is clicked', async () => {
    const user = userEvent.setup()
    renderCreateMode()

    await user.click(screen.getByRole('button', { name: /add step/i }))

    expect(screen.getAllByPlaceholderText(/describe this step/i)).toHaveLength(2)
  })

  it('navigates back when Cancel is clicked', async () => {
    const user = userEvent.setup()
    renderCreateMode()

    await user.click(screen.getByRole('button', { name: /cancel/i }))

    expect(mockNavigate).toHaveBeenCalledWith(-1)
  })

  it('submits form and navigates on success', async () => {
    const user = userEvent.setup()
    renderCreateMode()

    await user.type(screen.getByLabelText(/title/i), 'My New Recipe')
    await user.click(screen.getByRole('button', { name: /create recipe/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/recipes/new-recipe-id')
    })
  })
})

describe('RecipeForm - Edit Mode Loading', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHookState = {
      recipe: null,
      loading: true,
      error: null,
      deleteRecipe: vi.fn(),
    }
  })

  it('shows loading spinner', () => {
    renderEditMode()

    expect(document.querySelector('.animate-spin')).toBeInTheDocument()
  })
})

describe('RecipeForm - Edit Mode Error', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHookState = {
      recipe: null,
      loading: false,
      error: 'Recipe not found',
      deleteRecipe: vi.fn(),
    }
  })

  it('shows error message', () => {
    renderEditMode()

    expect(screen.getByText('Recipe not found')).toBeInTheDocument()
  })

  it('shows back button', () => {
    renderEditMode()

    expect(screen.getByRole('button', { name: /back to recipes/i })).toBeInTheDocument()
  })
})

describe('RecipeForm - Edit Mode With Recipe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockHookState = {
      recipe: mockRecipe,
      loading: false,
      error: null,
      deleteRecipe: vi.fn(),
    }
  })

  it('displays "Edit Recipe" title', () => {
    renderEditMode()

    expect(screen.getByText('Edit Recipe')).toBeInTheDocument()
  })

  it('populates form with existing recipe data', () => {
    renderEditMode()

    expect(screen.getByLabelText(/title/i)).toHaveValue('Existing Recipe')
    expect(screen.getByLabelText(/description/i)).toHaveValue('A test recipe')
    expect(screen.getByLabelText(/servings/i)).toHaveValue(4)
  })

  it('shows existing ingredients', () => {
    renderEditMode()

    expect(screen.getByDisplayValue('flour')).toBeInTheDocument()
    expect(screen.getByDisplayValue('sugar')).toBeInTheDocument()
  })

  it('shows existing steps', () => {
    renderEditMode()

    expect(screen.getByDisplayValue('Mix ingredients')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Bake')).toBeInTheDocument()
  })

  it('shows Save Changes button', () => {
    renderEditMode()

    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
  })
})
