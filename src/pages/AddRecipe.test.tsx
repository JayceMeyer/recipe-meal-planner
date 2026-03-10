import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { AddRecipe } from './AddRecipe'
import '@/test/mocks/supabase'

vi.mock('@/contexts/HouseholdContext', () => ({
  useHousehold: () => ({ household: { id: 'household-1', name: 'Test Kitchen' }, members: [], loading: false, isOwner: true }),
}))

const mockScrape = vi.fn()
const mockReset = vi.fn()
const mockNavigate = vi.fn()
const mockInsert = vi.fn()

const mockRecipe = {
  title: 'Test Recipe',
  image: 'https://example.com/image.jpg',
  ingredients: ['1 cup flour', '2 eggs', 'Salt to taste'],
  instructions: ['Mix ingredients', 'Bake at 350F', 'Let cool'],
  yields: '4 servings',
  total_time: 30,
  host: 'example.com',
}

let mockHookState = {
  scrape: mockScrape,
  recipe: null as typeof mockRecipe | null,
  loading: false,
  error: null as string | null,
  reset: mockReset,
}

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-123' },
  }),
}))

vi.mock('@/hooks/useScrapeRecipe', () => ({
  useScrapeRecipe: () => mockHookState,
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({
      insert: mockInsert,
    }),
  },
}))

describe('AddRecipe - URL Input Form', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInsert.mockResolvedValue({ error: null })
    mockHookState = {
      scrape: mockScrape,
      recipe: null,
      loading: false,
      error: null,
      reset: mockReset,
    }
  })

  it('renders URL input form', () => {
    render(
      <MemoryRouter>
        <AddRecipe />
      </MemoryRouter>
    )

    expect(screen.getByLabelText(/recipe url/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /import recipe/i })).toBeInTheDocument()
  })

  it('calls scrape when form is submitted', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <AddRecipe />
      </MemoryRouter>
    )

    await user.type(screen.getByLabelText(/recipe url/i), 'https://example.com/recipe')
    await user.click(screen.getByRole('button', { name: /import recipe/i }))

    expect(mockScrape).toHaveBeenCalledWith('https://example.com/recipe')
  })

  it('disables button when URL is empty', () => {
    render(
      <MemoryRouter>
        <AddRecipe />
      </MemoryRouter>
    )

    expect(screen.getByRole('button', { name: /import recipe/i })).toBeDisabled()
  })

  it('shows loading state while importing', () => {
    mockHookState.loading = true

    render(
      <MemoryRouter>
        <AddRecipe />
      </MemoryRouter>
    )

    expect(screen.getByRole('button', { name: /importing/i })).toBeDisabled()
  })

  it('displays error message on scrape failure', () => {
    mockHookState.error = 'This website is not supported'

    render(
      <MemoryRouter>
        <AddRecipe />
      </MemoryRouter>
    )

    expect(screen.getByText('This website is not supported')).toBeInTheDocument()
  })
})

describe('AddRecipe - Recipe Preview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockInsert.mockResolvedValue({ error: null })
    mockHookState = {
      scrape: mockScrape,
      recipe: mockRecipe,
      loading: false,
      error: null,
      reset: mockReset,
    }
  })

  it('displays recipe preview when scraped', () => {
    render(
      <MemoryRouter>
        <AddRecipe />
      </MemoryRouter>
    )

    expect(screen.getByDisplayValue('Test Recipe')).toBeInTheDocument()
    expect(screen.getByText(/4 servings/i)).toBeInTheDocument()
    expect(screen.getByText(/30 min/i)).toBeInTheDocument()
    expect(screen.getByText('1 cup flour')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save recipe/i })).toBeInTheDocument()
  })

  it('displays recipe image', () => {
    render(
      <MemoryRouter>
        <AddRecipe />
      </MemoryRouter>
    )

    const img = screen.getByAltText('Test Recipe')
    expect(img).toHaveAttribute('src', 'https://example.com/image.jpg')
  })

  it('saves recipe to database', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <AddRecipe />
      </MemoryRouter>
    )

    await user.click(screen.getByRole('button', { name: /save recipe/i }))

    await waitFor(() => {
      expect(mockInsert).toHaveBeenCalled()
    })
  })

  it('navigates to recipes on successful save', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <AddRecipe />
      </MemoryRouter>
    )

    await user.click(screen.getByRole('button', { name: /save recipe/i }))

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/recipes')
    })
  })

  it('allows editing title before save', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <AddRecipe />
      </MemoryRouter>
    )

    const titleInput = screen.getByLabelText(/title/i)
    await user.clear(titleInput)
    await user.type(titleInput, 'My Custom Title')

    expect(titleInput).toHaveValue('My Custom Title')
  })

  it('calls reset when clicking Try Another', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <AddRecipe />
      </MemoryRouter>
    )

    await user.click(screen.getByRole('button', { name: /try another/i }))

    expect(mockReset).toHaveBeenCalled()
  })

  it('displays save error message', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'Database error' } })
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <AddRecipe />
      </MemoryRouter>
    )

    await user.click(screen.getByRole('button', { name: /save recipe/i }))

    await waitFor(() => {
      expect(screen.getByText('Database error')).toBeInTheDocument()
    })
  })
})
