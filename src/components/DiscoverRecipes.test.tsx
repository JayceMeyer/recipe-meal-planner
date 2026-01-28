import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { DiscoverRecipes } from './DiscoverRecipes'

describe('DiscoverRecipes', () => {
  it('renders discover button', () => {
    render(<DiscoverRecipes />)

    expect(screen.getByRole('button', { name: /discover recipes/i })).toBeInTheDocument()
  })

  it('opens dialog when button is clicked', () => {
    render(<DiscoverRecipes />)

    fireEvent.click(screen.getByRole('button', { name: /discover recipes/i }))

    expect(screen.getByText('Discover New Recipes')).toBeInTheDocument()
    expect(screen.getByText('Coming Soon')).toBeInTheDocument()
  })

  it('displays coming soon message in dialog', () => {
    render(<DiscoverRecipes />)

    fireEvent.click(screen.getByRole('button', { name: /discover recipes/i }))

    expect(screen.getByText(/this feature will search for recipes/i)).toBeInTheDocument()
  })

  it('lists planned features', () => {
    render(<DiscoverRecipes />)

    fireEvent.click(screen.getByRole('button', { name: /discover recipes/i }))

    expect(screen.getByText(/search recipes by your available ingredients/i)).toBeInTheDocument()
    expect(screen.getByText(/import recipes to your collection/i)).toBeInTheDocument()
  })

  it('shows ingredient count when provided', () => {
    render(<DiscoverRecipes ingredientCount={5} />)

    fireEvent.click(screen.getByRole('button', { name: /discover recipes/i }))

    expect(screen.getByText(/your 5 grocery list ingredients/i)).toBeInTheDocument()
  })

  it('has link to Spoonacular API documentation', () => {
    render(<DiscoverRecipes />)

    fireEvent.click(screen.getByRole('button', { name: /discover recipes/i }))

    const link = screen.getByRole('link', { name: /learn about spoonacular api/i })
    expect(link).toHaveAttribute('href', 'https://spoonacular.com/food-api')
    expect(link).toHaveAttribute('target', '_blank')
  })
})
