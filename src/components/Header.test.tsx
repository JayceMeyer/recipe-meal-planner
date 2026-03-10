import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import { Header } from './Header'

const mockSignOut = vi.fn()
const mockUseAuth = vi.fn()

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

vi.mock('@/components/CreditBadge', () => ({
  CreditBadge: () => null,
}))

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders app name and logo', () => {
    mockUseAuth.mockReturnValue({ user: null, signOut: mockSignOut })

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    )

    expect(screen.getByText('Recipe Planner')).toBeInTheDocument()
  })

  it('shows sign out button when user is authenticated', () => {
    mockUseAuth.mockReturnValue({ user: { email: 'test@example.com' }, signOut: mockSignOut })

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    )

    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('hides sign out button when user is not authenticated', () => {
    mockUseAuth.mockReturnValue({ user: null, signOut: mockSignOut })

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    )

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('calls signOut when sign out button is clicked', async () => {
    const user = userEvent.setup()
    mockUseAuth.mockReturnValue({ user: { email: 'test@example.com' }, signOut: mockSignOut })

    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>
    )

    await user.click(screen.getByRole('button'))
    expect(mockSignOut).toHaveBeenCalled()
  })
})
