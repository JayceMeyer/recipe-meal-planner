import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { BottomNav } from './BottomNav'

vi.mock('@/hooks/useUserRole', () => ({
  useUserRole: () => ({ role: 'user', isAdmin: false, isModerator: false, isAdminOrModerator: false, loading: false }),
}))

describe('BottomNav', () => {
  it('renders all navigation links', () => {
    render(
      <MemoryRouter>
        <BottomNav />
      </MemoryRouter>
    )

    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Recipes')).toBeInTheDocument()
    expect(screen.getByText('Grocery')).toBeInTheDocument()
    expect(screen.getByText('Profile')).toBeInTheDocument()
  })

  it('renders correct links', () => {
    render(
      <MemoryRouter>
        <BottomNav />
      </MemoryRouter>
    )

    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: /recipes/i })).toHaveAttribute('href', '/recipes')
    expect(screen.getByRole('link', { name: /grocery/i })).toHaveAttribute('href', '/grocery')
    expect(screen.getByRole('link', { name: /profile/i })).toHaveAttribute('href', '/profile')
  })

  it('highlights active link', () => {
    render(
      <MemoryRouter initialEntries={['/recipes']}>
        <BottomNav />
      </MemoryRouter>
    )

    const recipesLink = screen.getByRole('link', { name: /recipes/i })
    expect(recipesLink).toHaveClass('text-primary')
  })
})
