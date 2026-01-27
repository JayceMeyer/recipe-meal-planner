import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Groups } from './Groups'
import type { RecipeGroup } from '@/types/database'

const mockGroups: RecipeGroup[] = [
  { id: 'group-1', name: 'Breakfast', user_id: 'user-1', created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'group-2', name: 'Dinner', user_id: 'user-1', created_at: '2024-01-01', updated_at: '2024-01-01' },
]

const mockCreateGroup = vi.fn()
const mockUpdateGroup = vi.fn()
const mockDeleteGroup = vi.fn()

vi.mock('@/hooks/useGroups', () => ({
  useGroups: () => ({
    groups: mockGroups,
    loading: false,
    error: null,
    createGroup: mockCreateGroup,
    updateGroup: mockUpdateGroup,
    deleteGroup: mockDeleteGroup,
  }),
}))

describe('Groups', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCreateGroup.mockResolvedValue({ id: 'group-3', name: 'Lunch' })
    mockUpdateGroup.mockResolvedValue(true)
    mockDeleteGroup.mockResolvedValue(true)
  })

  it('renders page title', () => {
    render(<Groups />)

    expect(screen.getByText('Recipe Groups')).toBeInTheDocument()
  })

  it('renders all groups', () => {
    render(<Groups />)

    expect(screen.getByText('Breakfast')).toBeInTheDocument()
    expect(screen.getByText('Dinner')).toBeInTheDocument()
  })

  it('renders create group input', () => {
    render(<Groups />)

    expect(screen.getByPlaceholderText('New group name...')).toBeInTheDocument()
  })

  it('creates a new group', async () => {
    render(<Groups />)

    const input = screen.getByPlaceholderText('New group name...')
    fireEvent.change(input, { target: { value: 'Lunch' } })
    fireEvent.click(screen.getByRole('button', { name: /add/i }))

    await vi.waitFor(() => {
      expect(mockCreateGroup).toHaveBeenCalledWith('Lunch')
    })
  })

  it('creates group on enter key', async () => {
    render(<Groups />)

    const input = screen.getByPlaceholderText('New group name...')
    fireEvent.change(input, { target: { value: 'Lunch' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await vi.waitFor(() => {
      expect(mockCreateGroup).toHaveBeenCalledWith('Lunch')
    })
  })

  it('opens edit dialog when clicking edit button', () => {
    render(<Groups />)

    fireEvent.click(screen.getByLabelText('Edit Breakfast'))

    expect(screen.getByText('Edit Group')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Breakfast')).toBeInTheDocument()
  })

  it('opens delete dialog when clicking delete button', () => {
    render(<Groups />)

    fireEvent.click(screen.getByLabelText('Delete Breakfast'))

    expect(screen.getByText('Delete Group')).toBeInTheDocument()
    expect(screen.getByText(/Are you sure you want to delete "Breakfast"/)).toBeInTheDocument()
  })

  it('calls updateGroup when saving edit', async () => {
    render(<Groups />)

    fireEvent.click(screen.getByLabelText('Edit Breakfast'))

    const input = screen.getByDisplayValue('Breakfast')
    fireEvent.change(input, { target: { value: 'Brunch' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    await vi.waitFor(() => {
      expect(mockUpdateGroup).toHaveBeenCalledWith('group-1', 'Brunch')
    })
  })

  it('calls deleteGroup when confirming delete', async () => {
    render(<Groups />)

    fireEvent.click(screen.getByLabelText('Delete Breakfast'))
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }))

    await vi.waitFor(() => {
      expect(mockDeleteGroup).toHaveBeenCalledWith('group-1')
    })
  })

  it('disables add button when input is empty', () => {
    render(<Groups />)

    const addButton = screen.getByRole('button', { name: /add/i })
    expect(addButton).toBeDisabled()
  })
})

