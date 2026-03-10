import { render } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockSelect, mockFrom } = vi.hoisted(() => ({
  mockSelect: vi.fn(),
  mockFrom: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: (...args: unknown[]) => {
      mockFrom(...args)
      return {
        select: (...selArgs: unknown[]) => {
          mockSelect(...selArgs)
          return {
            gte: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
            order: vi.fn().mockResolvedValue({ data: [], error: null }),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }
        },
      }
    },
  },
}))

vi.mock('recharts', () => ({
  LineChart: ({ children }: { children: React.ReactNode }) => <div data-testid="line-chart">{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div data-testid="bar-chart">{children}</div>,
  Bar: () => null,
}))

import { AdminOverview } from './Overview'

describe('AdminOverview', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state initially', () => {
    render(<AdminOverview />)
    expect(
      document.querySelector('.animate-spin')
    ).toBeInTheDocument()
  })

  it('queries all expected tables', () => {
    render(<AdminOverview />)

    const calledTables = mockFrom.mock.calls.map(
      (call: unknown[]) => call[0]
    )
    expect(calledTables).toContain('user_roles')
    expect(calledTables).toContain('households')
    expect(calledTables).toContain('recipes')
    expect(calledTables).toContain('meal_plans')
    expect(calledTables).toContain('pantry_items')
    expect(calledTables).toContain('household_credits')
    expect(calledTables).toContain('credit_transactions')
  })
})
