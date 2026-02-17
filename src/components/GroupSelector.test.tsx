import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { GroupSelector } from './GroupSelector'
import type { RecipeGroup } from '@/types/database'

const mockGroups: RecipeGroup[] = [
  { id: 'group-1', name: 'Breakfast', user_id: 'user-1', household_id: 'household-1', created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'group-2', name: 'Dinner', user_id: 'user-1', household_id: 'household-1', created_at: '2024-01-01', updated_at: '2024-01-01' },
  { id: 'group-3', name: 'Dessert', user_id: 'user-1', household_id: 'household-1', created_at: '2024-01-01', updated_at: '2024-01-01' },
]

describe('GroupSelector', () => {
  it('renders all groups', () => {
    render(
      <GroupSelector
        groups={mockGroups}
        selectedIds={[]}
        onSelectionChange={vi.fn()}
      />
    )

    expect(screen.getByText('Breakfast')).toBeInTheDocument()
    expect(screen.getByText('Dinner')).toBeInTheDocument()
    expect(screen.getByText('Dessert')).toBeInTheDocument()
  })

  it('shows selected state for selected groups', () => {
    render(
      <GroupSelector
        groups={mockGroups}
        selectedIds={['group-1', 'group-3']}
        onSelectionChange={vi.fn()}
      />
    )

    const breakfastBtn = screen.getByText('Breakfast').closest('button')
    const dessertBtn = screen.getByText('Dessert').closest('button')

    expect(breakfastBtn).toHaveClass('bg-primary')
    expect(dessertBtn).toHaveClass('bg-primary')
  })

  it('calls onSelectionChange when toggling group', () => {
    const onSelectionChange = vi.fn()
    render(
      <GroupSelector
        groups={mockGroups}
        selectedIds={['group-1']}
        onSelectionChange={onSelectionChange}
      />
    )

    // Add a new selection
    fireEvent.click(screen.getByText('Dinner'))
    expect(onSelectionChange).toHaveBeenCalledWith(['group-1', 'group-2'])

    // Remove existing selection
    fireEvent.click(screen.getByText('Breakfast'))
    expect(onSelectionChange).toHaveBeenCalledWith([])
  })

  it('shows empty message when no groups', () => {
    render(
      <GroupSelector
        groups={[]}
        selectedIds={[]}
        onSelectionChange={vi.fn()}
      />
    )

    expect(screen.getByText('No groups yet')).toBeInTheDocument()
  })

  it('shows create group input when onCreateGroup provided', () => {
    render(
      <GroupSelector
        groups={mockGroups}
        selectedIds={[]}
        onSelectionChange={vi.fn()}
        onCreateGroup={vi.fn()}
      />
    )

    expect(screen.getByPlaceholderText('New group name...')).toBeInTheDocument()
  })

  it('does not show create group input when onCreateGroup not provided', () => {
    render(
      <GroupSelector
        groups={mockGroups}
        selectedIds={[]}
        onSelectionChange={vi.fn()}
      />
    )

    expect(screen.queryByPlaceholderText('New group name...')).not.toBeInTheDocument()
  })

  it('creates group and selects it', async () => {
    const onCreateGroup = vi.fn().mockResolvedValue({
      id: 'group-4',
      name: 'Lunch',
      user_id: 'user-1',
      household_id: 'household-1',
      created_at: '2024-01-01',
      updated_at: '2024-01-01',
    })
    const onSelectionChange = vi.fn()

    render(
      <GroupSelector
        groups={mockGroups}
        selectedIds={['group-1']}
        onSelectionChange={onSelectionChange}
        onCreateGroup={onCreateGroup}
      />
    )

    const input = screen.getByPlaceholderText('New group name...')
    fireEvent.change(input, { target: { value: 'Lunch' } })
    fireEvent.keyDown(input, { key: 'Enter' })

    await vi.waitFor(() => {
      expect(onCreateGroup).toHaveBeenCalledWith('Lunch')
    })
  })

  it('disables buttons when loading', () => {
    render(
      <GroupSelector
        groups={mockGroups}
        selectedIds={[]}
        onSelectionChange={vi.fn()}
        loading={true}
      />
    )

    const buttons = screen.getAllByRole('button')
    buttons.forEach((button) => {
      expect(button).toBeDisabled()
    })
  })
})
