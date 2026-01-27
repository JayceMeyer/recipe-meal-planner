import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { StarRating } from './StarRating'

describe('StarRating', () => {
  it('renders 5 stars', () => {
    render(<StarRating value={0} />)

    const stars = screen.getAllByRole('button')
    expect(stars).toHaveLength(5)
  })

  it('displays correct number of filled stars', () => {
    const { container } = render(<StarRating value={3} />)

    const filledStars = container.querySelectorAll('.fill-yellow-400')
    expect(filledStars).toHaveLength(3)
  })

  it('calls onChange when star is clicked', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()

    render(<StarRating value={0} onChange={onChange} />)

    await user.click(screen.getByLabelText('Rate 4 stars'))

    expect(onChange).toHaveBeenCalledWith(4)
  })

  it('does not call onChange when readonly', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()

    render(<StarRating value={3} onChange={onChange} readonly />)

    await user.click(screen.getByLabelText('Rate 4 stars'))

    expect(onChange).not.toHaveBeenCalled()
  })

  it('shows hover preview', async () => {
    const user = userEvent.setup()
    const { container } = render(<StarRating value={1} onChange={vi.fn()} />)

    await user.hover(screen.getByLabelText('Rate 4 stars'))

    const filledStars = container.querySelectorAll('.fill-yellow-400')
    expect(filledStars).toHaveLength(4)
  })

  it('resets hover on mouse leave', async () => {
    const user = userEvent.setup()
    const { container } = render(<StarRating value={2} onChange={vi.fn()} />)

    const ratingGroup = screen.getByRole('group')
    await user.hover(screen.getByLabelText('Rate 5 stars'))
    await user.unhover(ratingGroup)

    const filledStars = container.querySelectorAll('.fill-yellow-400')
    expect(filledStars).toHaveLength(2)
  })

  it('has correct aria-label', () => {
    render(<StarRating value={3} />)

    expect(screen.getByRole('group')).toHaveAttribute(
      'aria-label',
      'Rating: 3 out of 5 stars'
    )
  })

  it('handles null value', () => {
    const { container } = render(<StarRating value={null} />)

    const filledStars = container.querySelectorAll('.fill-yellow-400')
    expect(filledStars).toHaveLength(0)
  })

  it('disables buttons when readonly', () => {
    render(<StarRating value={3} readonly />)

    const buttons = screen.getAllByRole('button')
    buttons.forEach((button) => {
      expect(button).toBeDisabled()
    })
  })
})
