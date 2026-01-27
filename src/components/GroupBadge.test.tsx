import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { GroupBadge } from './GroupBadge'

describe('GroupBadge', () => {
  it('renders group name', () => {
    render(<GroupBadge name="Breakfast" />)

    expect(screen.getByText('Breakfast')).toBeInTheDocument()
  })

  it('renders as span when no onClick', () => {
    render(<GroupBadge name="Breakfast" />)

    const badge = screen.getByText('Breakfast')
    expect(badge.tagName).toBe('SPAN')
  })

  it('renders as button when onClick provided', () => {
    const onClick = vi.fn()
    render(<GroupBadge name="Breakfast" onClick={onClick} />)

    const badge = screen.getByRole('button')
    expect(badge).toBeInTheDocument()
    expect(badge).toHaveTextContent('Breakfast')
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<GroupBadge name="Breakfast" onClick={onClick} />)

    fireEvent.click(screen.getByRole('button'))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('applies custom className', () => {
    render(<GroupBadge name="Breakfast" className="custom-class" />)

    expect(screen.getByText('Breakfast')).toHaveClass('custom-class')
  })
})
