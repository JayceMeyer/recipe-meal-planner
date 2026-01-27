import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { ServingAdjuster } from './ServingAdjuster'

describe('ServingAdjuster', () => {
  const defaultProps = {
    currentServings: 4,
    originalServings: 4,
    onIncrement: vi.fn(),
    onDecrement: vi.fn(),
    onReset: vi.fn(),
    isModified: false,
  }

  it('displays current serving count', () => {
    render(<ServingAdjuster {...defaultProps} />)

    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('displays label', () => {
    render(<ServingAdjuster {...defaultProps} />)

    expect(screen.getByText('Servings:')).toBeInTheDocument()
  })

  it('calls onIncrement when plus button clicked', async () => {
    const onIncrement = vi.fn()
    const user = userEvent.setup()

    render(<ServingAdjuster {...defaultProps} onIncrement={onIncrement} />)

    await user.click(screen.getByLabelText('Increase servings'))

    expect(onIncrement).toHaveBeenCalledTimes(1)
  })

  it('calls onDecrement when minus button clicked', async () => {
    const onDecrement = vi.fn()
    const user = userEvent.setup()

    render(<ServingAdjuster {...defaultProps} onDecrement={onDecrement} />)

    await user.click(screen.getByLabelText('Decrease servings'))

    expect(onDecrement).toHaveBeenCalledTimes(1)
  })

  it('disables minus button when currentServings is 1', () => {
    render(<ServingAdjuster {...defaultProps} currentServings={1} />)

    expect(screen.getByLabelText('Decrease servings')).toBeDisabled()
  })

  it('enables minus button when currentServings is greater than 1', () => {
    render(<ServingAdjuster {...defaultProps} currentServings={2} />)

    expect(screen.getByLabelText('Decrease servings')).not.toBeDisabled()
  })

  it('does not show reset button when not modified', () => {
    render(<ServingAdjuster {...defaultProps} isModified={false} />)

    expect(screen.queryByRole('button', { name: /reset/i })).not.toBeInTheDocument()
  })

  it('shows reset button when modified', () => {
    render(
      <ServingAdjuster
        {...defaultProps}
        currentServings={6}
        isModified={true}
      />
    )

    expect(screen.getByRole('button', { name: /reset to original/i })).toBeInTheDocument()
    expect(screen.getByText('Reset to 4')).toBeInTheDocument()
  })

  it('calls onReset when reset button clicked', async () => {
    const onReset = vi.fn()
    const user = userEvent.setup()

    render(
      <ServingAdjuster
        {...defaultProps}
        currentServings={6}
        isModified={true}
        onReset={onReset}
      />
    )

    await user.click(screen.getByRole('button', { name: /reset to original/i }))

    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('displays updated serving count after change', () => {
    render(<ServingAdjuster {...defaultProps} currentServings={8} />)

    expect(screen.getByText('8')).toBeInTheDocument()
  })
})
