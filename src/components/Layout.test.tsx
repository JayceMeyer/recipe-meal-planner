import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './Layout'

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { email: 'test@example.com' }, signOut: vi.fn() }),
}))

vi.mock('@/hooks/useUserRole', () => ({
  useUserRole: () => ({ role: 'user', isAdmin: false, isModerator: false, isAdminOrModerator: false, loading: false }),
}))

vi.mock('@/components/CreditBadge', () => ({
  CreditBadge: () => null,
}))

describe('Layout', () => {
  it('renders header, navigation, and outlet content', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<div>Home Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Recipe Planner')).toBeInTheDocument()
    expect(screen.getByText('Home Content')).toBeInTheDocument()
    expect(screen.getAllByText('Home').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Recipes').length).toBeGreaterThan(0)
  })

  it('renders different page content based on route', () => {
    render(
      <MemoryRouter initialEntries={['/recipes']}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<div>Home Content</div>} />
            <Route path="/recipes" element={<div>Recipes Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    )

    expect(screen.getByText('Recipes Content')).toBeInTheDocument()
    expect(screen.queryByText('Home Content')).not.toBeInTheDocument()
  })
})
