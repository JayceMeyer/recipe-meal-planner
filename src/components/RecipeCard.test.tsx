import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { RecipeCard } from './RecipeCard'
import type { Recipe } from '@/types/database'

const mockRecipe: Recipe = {
  id: 'recipe-123',
  user_id: 'user-123',
  title: 'Chocolate Chip Cookies',
  description: 'Delicious homemade cookies',
  image_url: 'https://example.com/cookies.jpg',
  source_url: 'https://example.com/recipe',
  servings: 24,
  prep_time: 15,
  cook_time: 12,
  ingredients: [{ name: 'flour', amount: '2 cups' }],
  steps: [{ order: 1, instruction: 'Mix ingredients' }],
  notes: null,
  rating: 5,
  created_at: '2026-01-27T00:00:00Z',
  updated_at: '2026-01-27T00:00:00Z',
}

describe('RecipeCard', () => {
  it('renders recipe title', () => {
    render(
      <MemoryRouter>
        <RecipeCard recipe={mockRecipe} />
      </MemoryRouter>
    )

    expect(screen.getByText('Chocolate Chip Cookies')).toBeInTheDocument()
  })

  it('renders recipe image', () => {
    render(
      <MemoryRouter>
        <RecipeCard recipe={mockRecipe} />
      </MemoryRouter>
    )

    const img = screen.getByAltText('Chocolate Chip Cookies')
    expect(img).toHaveAttribute('src', 'https://example.com/cookies.jpg')
  })

  it('renders total time', () => {
    render(
      <MemoryRouter>
        <RecipeCard recipe={mockRecipe} />
      </MemoryRouter>
    )

    expect(screen.getByText('27 min')).toBeInTheDocument()
  })

  it('renders rating', () => {
    render(
      <MemoryRouter>
        <RecipeCard recipe={mockRecipe} />
      </MemoryRouter>
    )

    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('renders servings', () => {
    render(
      <MemoryRouter>
        <RecipeCard recipe={mockRecipe} />
      </MemoryRouter>
    )

    expect(screen.getByText('24')).toBeInTheDocument()
  })

  it('links to recipe detail page', () => {
    render(
      <MemoryRouter>
        <RecipeCard recipe={mockRecipe} />
      </MemoryRouter>
    )

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/recipes/recipe-123')
  })

  it('renders placeholder when no image', () => {
    const recipeNoImage = { ...mockRecipe, image_url: null }

    render(
      <MemoryRouter>
        <RecipeCard recipe={recipeNoImage} />
      </MemoryRouter>
    )

    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('handles missing optional fields gracefully', () => {
    const minimalRecipe: Recipe = {
      ...mockRecipe,
      prep_time: null,
      cook_time: null,
      rating: null,
      servings: null,
    }

    render(
      <MemoryRouter>
        <RecipeCard recipe={minimalRecipe} />
      </MemoryRouter>
    )

    expect(screen.getByText('Chocolate Chip Cookies')).toBeInTheDocument()
    expect(screen.queryByText(/min/)).not.toBeInTheDocument()
  })
})
