import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { RecipeNotes } from './RecipeNotes'

vi.mock('@/hooks/useRecipeNotes', () => ({
  useRecipeNotes: () => ({
    saving: false,
    error: null,
    saveNotes: vi.fn(),
    saveRating: vi.fn(),
  }),
}))

describe('RecipeNotes', () => {
  const defaultProps = {
    recipeId: 'recipe-123',
    initialNotes: '',
    initialRating: null,
  }

  it('renders rating section', () => {
    render(<RecipeNotes {...defaultProps} />)

    expect(screen.getByText('My Rating')).toBeInTheDocument()
  })

  it('renders notes section', () => {
    render(<RecipeNotes {...defaultProps} />)

    expect(screen.getByText('My Notes')).toBeInTheDocument()
  })

  it('displays existing notes', () => {
    render(<RecipeNotes {...defaultProps} initialNotes="These are my notes" />)

    expect(screen.getByDisplayValue('These are my notes')).toBeInTheDocument()
  })

  it('displays existing rating', () => {
    const { container } = render(<RecipeNotes {...defaultProps} initialRating={4} />)

    const filledStars = container.querySelectorAll('.fill-yellow-400')
    expect(filledStars).toHaveLength(4)
  })

  it('updates notes when typed', async () => {
    const user = userEvent.setup()

    render(<RecipeNotes {...defaultProps} />)

    await user.type(screen.getByLabelText('My Notes'), 'New note')

    expect(screen.getByDisplayValue('New note')).toBeInTheDocument()
  })

  it('updates rating when clicked', async () => {
    const user = userEvent.setup()

    const { container } = render(<RecipeNotes {...defaultProps} />)

    await user.click(screen.getByLabelText('Rate 5 stars'))

    const filledStars = container.querySelectorAll('.fill-yellow-400')
    expect(filledStars).toHaveLength(5)
  })

  it('has correct placeholder text', () => {
    render(<RecipeNotes {...defaultProps} />)

    expect(
      screen.getByPlaceholderText(/add your personal notes/i)
    ).toBeInTheDocument()
  })
})
