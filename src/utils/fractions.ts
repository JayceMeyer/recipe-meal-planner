const COMMON_FRACTIONS: Record<string, number> = {
  '1/8': 0.125,
  '1/4': 0.25,
  '1/3': 0.333,
  '3/8': 0.375,
  '1/2': 0.5,
  '5/8': 0.625,
  '2/3': 0.667,
  '3/4': 0.75,
  '7/8': 0.875,
}

const FRACTION_TO_UNICODE: Record<string, string> = {
  '1/4': '¼',
  '1/2': '½',
  '3/4': '¾',
  '1/3': '⅓',
  '2/3': '⅔',
  '1/8': '⅛',
  '3/8': '⅜',
  '5/8': '⅝',
  '7/8': '⅞',
}

export function parseAmount(amount: string): number | null {
  if (!amount || !amount.trim()) return null

  const cleaned = amount.trim()

  const mixedMatch = cleaned.match(/^(\d+)\s+(\d+)\/(\d+)$/)
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1], 10)
    const numerator = parseInt(mixedMatch[2], 10)
    const denominator = parseInt(mixedMatch[3], 10)
    if (denominator === 0) return null
    return whole + numerator / denominator
  }

  const fractionMatch = cleaned.match(/^(\d+)\/(\d+)$/)
  if (fractionMatch) {
    const numerator = parseInt(fractionMatch[1], 10)
    const denominator = parseInt(fractionMatch[2], 10)
    if (denominator === 0) return null
    return numerator / denominator
  }

  for (const [unicode, fraction] of Object.entries(FRACTION_TO_UNICODE)) {
    if (cleaned.includes(fraction)) {
      const numericValue = COMMON_FRACTIONS[unicode]
      const wholeMatch = cleaned.match(/^(\d+)/)
      if (wholeMatch) {
        return parseInt(wholeMatch[1], 10) + numericValue
      }
      return numericValue
    }
  }

  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

export function formatAmount(value: number): string {
  if (value === 0) return '0'

  const whole = Math.floor(value)
  const decimal = value - whole

  if (decimal < 0.05) {
    return whole.toString()
  }

  let closestFraction = ''
  let closestDiff = Infinity

  for (const [fraction, fractionValue] of Object.entries(COMMON_FRACTIONS)) {
    const diff = Math.abs(decimal - fractionValue)
    if (diff < closestDiff && diff < 0.05) {
      closestDiff = diff
      closestFraction = FRACTION_TO_UNICODE[fraction] || fraction
    }
  }

  if (closestFraction) {
    return whole > 0 ? `${whole} ${closestFraction}` : closestFraction
  }

  const rounded = Math.round(value * 100) / 100
  if (rounded === Math.floor(rounded)) {
    return rounded.toString()
  }
  return rounded.toFixed(2).replace(/\.?0+$/, '')
}

export function scaleAmount(amount: string, ratio: number): string {
  const parsed = parseAmount(amount)
  if (parsed === null) return amount

  const scaled = parsed * ratio
  return formatAmount(scaled)
}
