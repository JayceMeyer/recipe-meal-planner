import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockUpdate } = vi.hoisted(() => ({
  mockUpdate: vi.fn().mockReturnValue({
    eq: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        single: vi.fn().mockResolvedValue({
          data: {
            id: 1,
            ai_markup_percent: 20,
            signup_bonus_credits: 200,
            updated_by: 'user-1',
            updated_at: '2026-03-10T00:00:00Z',
          },
          error: null,
        }),
      }),
    }),
  }),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: 1,
              ai_markup_percent: 18,
              signup_bonus_credits: 100,
              updated_by: null,
              updated_at: '2026-03-10T00:00:00Z',
            },
            error: null,
          }),
        }),
      }),
      update: mockUpdate,
    }),
  },
}))

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'user-1' }, loading: false }),
}))

vi.mock('@/hooks/useUserRole', () => ({
  useUserRole: () => ({ isAdmin: true, isModerator: false, role: 'admin' }),
}))

import { AdminSettingsPage } from './SettingsPage'

describe('AdminSettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders both settings fields after loading', async () => {
    render(<AdminSettingsPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('AI Markup Percentage')).toBeInTheDocument()
    })

    expect(screen.getByLabelText('Signup Bonus Credits')).toBeInTheDocument()
  })

  it('initializes signup bonus from settings data', async () => {
    render(<AdminSettingsPage />)

    await waitFor(() => {
      const input = screen.getByLabelText('Signup Bonus Credits') as HTMLInputElement
      expect(input.value).toBe('100')
    })
  })

  it('enables save button when values change', async () => {
    const user = userEvent.setup()
    render(<AdminSettingsPage />)

    await waitFor(() => {
      expect(screen.getByLabelText('Signup Bonus Credits')).toBeInTheDocument()
    })

    const bonusInput = screen.getByLabelText('Signup Bonus Credits')
    await user.clear(bonusInput)
    await user.type(bonusInput, '200')

    const saveBtn = screen.getByRole('button', { name: /save/i })
    expect(saveBtn).not.toBeDisabled()
  })
})
