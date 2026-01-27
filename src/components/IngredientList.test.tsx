import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { IngredientList } from './IngredientList'
import type { Ingredient } from '@/types/database'

const mockIngredients: Ingredient[] = [
  { name: 'flour', amount: '2', unit: 'cups' },
  { name: 'sugar', amount: '1', unit: 'cup' },
]

describe('IngredientList', () => {
  const defaultProps = {
    ingredients: mockIngredients,
    onAdd: vi.fn(),
    onUpdate: vi.fn(),
    onRemove: vi.fn(),
    onMove: vi.fn(),
  }

  it('renders all ingredients', () => {
    render(<IngredientList {...defaultProps} />)

    expect(screen.getByDisplayValue('flour')).toBeInTheDocument()
    expect(screen.getByDisplayValue('sugar')).toBeInTheDocument()
  })

  it('renders amount and unit fields', () => {
    render(<IngredientList {...defaultProps} />)

    expect(screen.getByDisplayValue('2')).toBeInTheDocument()
    expect(screen.getByDisplayValue('cups')).toBeInTheDocument()
  })

  it('calls onAdd when Add button is clicked', async () => {
    const onAdd = vi.fn()
    const user = userEvent.setup()

    render(<IngredientList {...defaultProps} onAdd={onAdd} />)

    await user.click(screen.getByRole('button', { name: /add/i }))

    expect(onAdd).toHaveBeenCalledTimes(1)
  })

  it('calls onUpdate when ingredient name is changed', async () => {
    const onUpdate = vi.fn()
    const user = userEvent.setup()

    render(<IngredientList {...defaultProps} onUpdate={onUpdate} />)

    const nameInput = screen.getByDisplayValue('flour')
    await user.clear(nameInput)
    await user.type(nameInput, 'bread flour')

    expect(onUpdate).toHaveBeenCalled()
  })

  it('calls onRemove when remove button is clicked', async () => {
    const onRemove = vi.fn()
    const user = userEvent.setup()

    render(<IngredientList {...defaultProps} onRemove={onRemove} />)

    const removeButtons = screen.getAllByRole('button', { name: /remove ingredient/i })
    await user.click(removeButtons[0])

    expect(onRemove).toHaveBeenCalledWith(0)
  })

  it('disables remove button when only one ingredient', () => {
    render(
      <IngredientList
        {...defaultProps}
        ingredients={[{ name: 'flour', amount: '2', unit: 'cups' }]}
      />
    )

    expect(screen.getByRole('button', { name: /remove ingredient/i })).toBeDisabled()
  })

  it('renders drag handles for reordering', () => {
    render(<IngredientList {...defaultProps} />)

    expect(screen.getAllByRole('button', { name: /drag to reorder/i })).toHaveLength(2)
  })
})
