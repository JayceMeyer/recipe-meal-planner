import { describe, it, expect } from 'vitest'
import { parseAmount, formatAmount, scaleAmount } from './fractions'

describe('parseAmount', () => {
  it('parses whole numbers', () => {
    expect(parseAmount('2')).toBe(2)
    expect(parseAmount('10')).toBe(10)
    expect(parseAmount('0')).toBe(0)
  })

  it('parses decimals', () => {
    expect(parseAmount('1.5')).toBe(1.5)
    expect(parseAmount('0.25')).toBe(0.25)
    expect(parseAmount('2.75')).toBe(2.75)
  })

  it('parses fractions', () => {
    expect(parseAmount('1/2')).toBe(0.5)
    expect(parseAmount('1/4')).toBe(0.25)
    expect(parseAmount('3/4')).toBe(0.75)
    expect(parseAmount('2/3')).toBeCloseTo(0.667, 2)
  })

  it('parses mixed numbers', () => {
    expect(parseAmount('1 1/2')).toBe(1.5)
    expect(parseAmount('2 1/4')).toBe(2.25)
    expect(parseAmount('3 3/4')).toBe(3.75)
  })

  it('parses unicode fractions', () => {
    expect(parseAmount('½')).toBe(0.5)
    expect(parseAmount('¼')).toBe(0.25)
    expect(parseAmount('¾')).toBe(0.75)
    expect(parseAmount('⅓')).toBeCloseTo(0.333, 2)
    expect(parseAmount('⅔')).toBeCloseTo(0.667, 2)
    expect(parseAmount('⅛')).toBe(0.125)
  })

  it('parses mixed numbers with unicode fractions', () => {
    expect(parseAmount('1½')).toBe(1.5)
    expect(parseAmount('2¼')).toBe(2.25)
    expect(parseAmount('1 ½')).toBe(1.5)
  })

  it('returns null for invalid input', () => {
    expect(parseAmount('')).toBe(null)
    expect(parseAmount('abc')).toBe(null)
    expect(parseAmount('to taste')).toBe(null)
  })

  it('handles whitespace', () => {
    expect(parseAmount('  2  ')).toBe(2)
    expect(parseAmount(' 1/2 ')).toBe(0.5)
  })
})

describe('formatAmount', () => {
  it('formats whole numbers', () => {
    expect(formatAmount(1)).toBe('1')
    expect(formatAmount(2)).toBe('2')
    expect(formatAmount(10)).toBe('10')
  })

  it('formats common fractions with unicode', () => {
    expect(formatAmount(0.5)).toBe('½')
    expect(formatAmount(0.25)).toBe('¼')
    expect(formatAmount(0.75)).toBe('¾')
  })

  it('formats thirds', () => {
    expect(formatAmount(1 / 3)).toBe('⅓')
    expect(formatAmount(2 / 3)).toBe('⅔')
  })

  it('formats mixed numbers', () => {
    expect(formatAmount(1.5)).toBe('1 ½')
    expect(formatAmount(2.25)).toBe('2 ¼')
    expect(formatAmount(3.75)).toBe('3 ¾')
  })

  it('formats small fractions', () => {
    expect(formatAmount(0.125)).toBe('⅛')
    expect(formatAmount(0.375)).toBe('⅜')
    expect(formatAmount(0.625)).toBe('⅝')
    expect(formatAmount(0.875)).toBe('⅞')
  })

  it('rounds unusual decimals', () => {
    const result = formatAmount(1.333)
    expect(result).toBe('1 ⅓')
  })

  it('handles zero', () => {
    expect(formatAmount(0)).toBe('0')
  })
})

describe('scaleAmount', () => {
  it('scales whole numbers', () => {
    expect(scaleAmount('2', 2)).toBe('4')
    expect(scaleAmount('3', 0.5)).toBe('1 ½')
  })

  it('scales fractions', () => {
    expect(scaleAmount('1/2', 2)).toBe('1')
    expect(scaleAmount('1/4', 4)).toBe('1')
    expect(scaleAmount('1/2', 0.5)).toBe('¼')
  })

  it('scales mixed numbers', () => {
    expect(scaleAmount('1 1/2', 2)).toBe('3')
    expect(scaleAmount('2 1/4', 2)).toBe('4 ½')
  })

  it('returns original for non-numeric amounts', () => {
    expect(scaleAmount('to taste', 2)).toBe('to taste')
    expect(scaleAmount('a pinch', 2)).toBe('a pinch')
  })

  it('handles ratio of 1', () => {
    expect(scaleAmount('2', 1)).toBe('2')
    expect(scaleAmount('1/2', 1)).toBe('½')
  })

  it('handles empty string', () => {
    expect(scaleAmount('', 2)).toBe('')
  })
})
