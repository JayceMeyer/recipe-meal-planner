import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { StepList } from './StepList'
import type { Step } from '@/types/database'

const mockSteps: Step[] = [
  { order: 1, instruction: 'Mix ingredients' },
  { order: 2, instruction: 'Bake at 350F' },
]

describe('StepList', () => {
  const defaultProps = {
    steps: mockSteps,
    onAdd: vi.fn(),
    onUpdate: vi.fn(),
    onRemove: vi.fn(),
    onMove: vi.fn(),
  }

  it('renders all steps', () => {
    render(<StepList {...defaultProps} />)

    expect(screen.getByDisplayValue('Mix ingredients')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Bake at 350F')).toBeInTheDocument()
  })

  it('displays step numbers', () => {
    render(<StepList {...defaultProps} />)

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('calls onAdd when Add Step button is clicked', async () => {
    const onAdd = vi.fn()
    const user = userEvent.setup()

    render(<StepList {...defaultProps} onAdd={onAdd} />)

    await user.click(screen.getByRole('button', { name: /add step/i }))

    expect(onAdd).toHaveBeenCalledTimes(1)
  })

  it('calls onUpdate when step instruction is changed', async () => {
    const onUpdate = vi.fn()
    const user = userEvent.setup()

    render(<StepList {...defaultProps} onUpdate={onUpdate} />)

    const textarea = screen.getByDisplayValue('Mix ingredients')
    await user.clear(textarea)
    await user.type(textarea, 'Combine all dry ingredients')

    expect(onUpdate).toHaveBeenCalled()
  })

  it('calls onRemove when remove button is clicked', async () => {
    const onRemove = vi.fn()
    const user = userEvent.setup()

    render(<StepList {...defaultProps} onRemove={onRemove} />)

    const removeButtons = screen.getAllByRole('button', { name: /remove step/i })
    await user.click(removeButtons[0])

    expect(onRemove).toHaveBeenCalledWith(0)
  })

  it('disables remove button when only one step', () => {
    render(
      <StepList
        {...defaultProps}
        steps={[{ order: 1, instruction: 'Only step' }]}
      />
    )

    expect(screen.getByRole('button', { name: /remove step/i })).toBeDisabled()
  })

  it('renders drag handles for reordering', () => {
    render(<StepList {...defaultProps} />)

    expect(screen.getAllByRole('button', { name: /drag to reorder/i })).toHaveLength(2)
  })
})
