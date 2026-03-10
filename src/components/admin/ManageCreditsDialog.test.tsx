import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockRpc = vi.fn().mockResolvedValue({ data: 150, error: null })

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { balance: 100 },
            error: null,
          }),
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [
                {
                  id: 'tx-1',
                  household_id: 'hh-1',
                  type: 'purchase',
                  amount: 500,
                  balance_after: 500,
                  description: 'Initial purchase',
                  metadata: {},
                  created_at: '2026-03-10T00:00:00Z',
                },
                {
                  id: 'tx-2',
                  household_id: 'hh-1',
                  type: 'usage',
                  amount: -50,
                  balance_after: 450,
                  description: 'Recipe generation',
                  metadata: {},
                  created_at: '2026-03-09T00:00:00Z',
                },
              ],
              error: null,
            }),
          }),
        }),
        order: vi.fn().mockReturnValue({
          limit: vi.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }),
      }),
    }),
    rpc: mockRpc,
  },
}))

import { ManageCreditsDialog } from './ManageCreditsDialog'

describe('ManageCreditsDialog', () => {
  const defaultProps = {
    open: true,
    onOpenChange: vi.fn(),
    householdId: 'hh-1',
    householdName: 'Test Household',
    onCreditsChanged: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders dialog with household name', async () => {
    render(<ManageCreditsDialog {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Manage Credits')).toBeInTheDocument()
    })
    expect(screen.getByText(/Test Household/)).toBeInTheDocument()
  })

  it('shows transaction history', async () => {
    render(<ManageCreditsDialog {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Initial purchase')).toBeInTheDocument()
    })
    expect(screen.getByText('Recipe generation')).toBeInTheDocument()
  })

  it('has add and deduct buttons', async () => {
    render(<ManageCreditsDialog {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByText('Add Credits')).toBeInTheDocument()
    })
    expect(screen.getByText('Deduct Credits')).toBeInTheDocument()
  })

  it('calls add_credits RPC when adding credits', async () => {
    const user = userEvent.setup()
    render(<ManageCreditsDialog {...defaultProps} />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Amount')).toBeInTheDocument()
    })

    await user.type(screen.getByPlaceholderText('Amount'), '50')
    await user.click(screen.getByText('Add Credits'))

    await waitFor(() => {
      expect(mockRpc).toHaveBeenCalledWith('add_credits', expect.objectContaining({
        p_household_id: 'hh-1',
        p_amount: 50,
      }))
    })
  })
})
