import { parseAmount, formatAmount } from './fractions'
import type { Ingredient } from '@/types/database'

export interface GroceryIngredient {
  name: string
  quantity: string | null
  unit: string | null
}

/**
 * Canonical unit aliases — maps all variations to a single short form.
 * Units that are convertible to each other share a group (see UNIT_CONVERSIONS).
 */
const UNIT_ALIASES: Record<string, string> = {
  tablespoon: 'tbsp',
  tablespoons: 'tbsp',
  tbsps: 'tbsp',
  teaspoon: 'tsp',
  teaspoons: 'tsp',
  tsps: 'tsp',
  cup: 'cup',
  cups: 'cup',
  ounce: 'oz',
  ounces: 'oz',
  pound: 'lb',
  pounds: 'lb',
  lbs: 'lb',
  gram: 'g',
  grams: 'g',
  kilogram: 'kg',
  kilograms: 'kg',
  milliliter: 'ml',
  milliliters: 'ml',
  liter: 'l',
  liters: 'l',
  clove: 'clove',
  cloves: 'clove',
  sprig: 'sprig',
  sprigs: 'sprig',
  bunch: 'bunch',
  bunches: 'bunch',
  head: 'head',
  heads: 'head',
  stalk: 'stalk',
  stalks: 'stalk',
  slice: 'slice',
  slices: 'slice',
  piece: 'piece',
  pieces: 'piece',
  can: 'can',
  cans: 'can',
  pinch: 'pinch',
  pinches: 'pinch',
  dash: 'dash',
  dashes: 'dash',
  handful: 'handful',
  handfuls: 'handful',
  pint: 'pint',
  pints: 'pint',
  quart: 'quart',
  quarts: 'quart',
  gallon: 'gallon',
  gallons: 'gallon',
  stick: 'stick',
  sticks: 'stick',
}

/**
 * Conversion factors to a common base unit within a group.
 * group → { unit → multiplier to reach the base unit }
 * Base units: tsp (volume-small), cup (volume-large), g (weight-metric), lb (weight-imperial)
 */
const UNIT_CONVERSIONS: Record<string, Record<string, number>> = {
  'volume-small': {
    tsp: 1,
    tbsp: 3, // 1 tbsp = 3 tsp
  },
  'volume-large': {
    cup: 1,
    pint: 2,
    quart: 4,
    gallon: 16,
    l: 4.227, // ~4.227 cups per liter
    ml: 0.00423, // ~0.00423 cups per ml
  },
  'weight-metric': {
    g: 1,
    kg: 1000,
  },
  'weight-imperial': {
    oz: 1,
    lb: 16, // 1 lb = 16 oz
  },
}

/** Find the conversion group and factor for a canonical unit */
function findConversionGroup(
  canonicalUnit: string
): { group: string; factor: number } | null {
  for (const [group, units] of Object.entries(UNIT_CONVERSIONS)) {
    if (canonicalUnit in units) {
      return { group, factor: units[canonicalUnit] }
    }
  }
  return null
}

/** Preferred (display) unit for each conversion group — the most readable default */
const GROUP_PREFERRED_UNIT: Record<string, string> = {
  'volume-small': 'tsp',
  'volume-large': 'cup',
  'weight-metric': 'g',
  'weight-imperial': 'oz',
}

function normalizeUnit(unit: string | undefined | null): string | null {
  if (!unit) return null
  const normalized = unit.toLowerCase().trim()
  return UNIT_ALIASES[normalized] ?? normalized
}

/**
 * Descriptor words that should be stripped when comparing ingredient names.
 * These describe preparation, size, or freshness — not the ingredient itself.
 */
const DESCRIPTOR_PATTERNS = [
  /\b(fresh|dried|frozen|canned|chopped|diced|minced|sliced|crushed|grated|shredded|ground|peeled|deveined|boneless|skinless|trimmed|halved|quartered|torn|packed|loosely|thinly|finely|coarsely|roughly)\b/gi,
  /\b(large|medium|small|big|whole|half|extra|thin|thick)\b/gi,
  /\b(raw|cooked|uncooked|ripe|firm|soft)\b/gi,
  /\b(organic|low-sodium|unsalted|salted|sweetened|unsweetened|light|heavy)\b/gi,
]

/**
 * Words that look like ingredient names but are actually units/containers.
 * These get stripped so "2 cans diced tomatoes" normalizes to "tomato".
 */
const UNIT_LIKE_WORDS =
  /\b(clove|cloves|sprig|sprigs|bunch|bunches|head|heads|stalk|stalks|can|cans|piece|pieces|slice|slices|handful|handfuls|stick|sticks|pinch|pinches|dash|dashes|ear|ears|bulb|bulbs|knob|rib|ribs|strip|strips|leaf|leaves|link|links|filet|fillet|fillets|breast|breasts|thigh|thighs|drumstick|drumsticks|leg|legs)\b/gi

/**
 * Normalizes an ingredient name for merging comparison.
 * Strips descriptors, unit-like words, leading quantities, and depluralizes.
 */
export function normalizeIngredientName(name: string): string {
  let normalized = name.toLowerCase().trim()

  // Remove leading quantities (e.g., "2 cloves garlic" → "cloves garlic")
  normalized = normalized.replace(/^\d+[\s/]*\d*\s*/, '')

  // Remove measurement units that might appear in the name string
  normalized = normalized.replace(
    /\b(cup|cups|tbsp|tsp|tablespoon|tablespoons|teaspoon|teaspoons|oz|ounce|ounces|lb|lbs|pound|pounds|g|gram|grams|kg|ml|liter|liters|pint|pints|quart|quarts|gallon|gallons)\b/gi,
    ' '
  )

  // Remove unit-like words
  normalized = normalized.replace(UNIT_LIKE_WORDS, ' ')

  // Remove descriptors
  for (const pattern of DESCRIPTOR_PATTERNS) {
    normalized = normalized.replace(pattern, ' ')
  }

  // Remove parenthetical content like "(about 1 lb)" or "(14 oz)"
  normalized = normalized.replace(/\([^)]*\)/g, ' ')

  // Remove commas and other punctuation
  normalized = normalized.replace(/[,;]/g, ' ')

  // Clean up whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim()

  // Depluralize (simple common cases)
  if (normalized.endsWith('ies')) {
    normalized = normalized.slice(0, -3) + 'y'
  } else if (
    normalized.endsWith('ves') &&
    !normalized.endsWith('ives')
  ) {
    // halves → half (but not "chives")
    normalized = normalized.slice(0, -3) + 'f'
  } else if (
    normalized.endsWith('es') &&
    !normalized.endsWith('ches') &&
    !normalized.endsWith('shes') &&
    !normalized.endsWith('ses')
  ) {
    normalized = normalized.slice(0, -2)
  } else if (
    normalized.endsWith('s') &&
    !normalized.endsWith('ss') &&
    !normalized.endsWith('us')
  ) {
    normalized = normalized.slice(0, -1)
  }

  return normalized
}

/**
 * Tries to merge two quantities that share the same conversion group.
 * Returns the combined quantity and best unit, or null if not convertible.
 */
function tryConvertAndMerge(
  qty1: number,
  unit1: string,
  qty2: number,
  unit2: string
): { quantity: string; unit: string } | null {
  const conv1 = findConversionGroup(unit1)
  const conv2 = findConversionGroup(unit2)

  if (!conv1 || !conv2 || conv1.group !== conv2.group) return null

  // Convert both to the base unit of the group
  const baseTotal = qty1 * conv1.factor + qty2 * conv2.factor

  // Pick the best display unit — use the larger input's unit, or the group preferred
  const preferredUnit =
    qty1 * conv1.factor >= qty2 * conv2.factor ? unit1 : unit2
  const preferredConv = findConversionGroup(preferredUnit)!
  const displayQty = baseTotal / preferredConv.factor

  return {
    quantity: formatAmount(displayQty),
    unit: preferredUnit,
  }
}

/**
 * Builds a combined quantity string when units are incompatible.
 * e.g., "4 cloves + 1 tsp"
 */
function buildCombinedQuantity(
  qty1: string | null,
  unit1: string | null,
  qty2: string | null,
  unit2: string | null
): { quantity: string; unit: string | null } {
  const part1 = formatPart(qty1, unit1)
  const part2 = formatPart(qty2, unit2)

  if (!part1 && !part2) return { quantity: '', unit: null }
  if (!part1) return { quantity: qty2 ?? '', unit: unit2 }
  if (!part2) return { quantity: qty1 ?? '', unit: unit1 }

  return { quantity: `${part1} + ${part2}`, unit: null }
}

function formatPart(qty: string | null, unit: string | null): string {
  if (!qty && !unit) return ''
  if (!qty) return unit ?? ''
  if (!unit) return qty
  return `${qty} ${unit}`
}

/**
 * Picks the best display name from the names we've seen for this ingredient.
 * Prefers the shortest clean name (less noise) that still has real content.
 */
function pickDisplayName(names: string[]): string {
  if (names.length === 0) return ''
  if (names.length === 1) return names[0]

  // Sort by length (shorter = cleaner usually) and pick first
  const sorted = [...names].sort((a, b) => a.length - b.length)
  return sorted[0]
}

export function mergeIngredients(
  existing: GroceryIngredient[],
  newIngredients: GroceryIngredient[]
): GroceryIngredient[] {
  // Build a map keyed by normalized name for efficient lookup
  // Each entry tracks: display names seen, list of (quantity, canonicalUnit, rawUnit) parts
  const mergeMap = new Map<
    string,
    {
      displayNames: string[]
      parts: { quantity: string | null; canonicalUnit: string | null; rawUnit: string | null }[]
    }
  >()

  function addToMap(item: GroceryIngredient) {
    const normName = normalizeIngredientName(item.name)
    const canonicalUnit = normalizeUnit(item.unit)

    let entry = mergeMap.get(normName)
    if (!entry) {
      entry = { displayNames: [], parts: [] }
      mergeMap.set(normName, entry)
    }

    entry.displayNames.push(item.name)
    entry.parts.push({
      quantity: item.quantity,
      canonicalUnit,
      rawUnit: item.unit,
    })
  }

  for (const item of existing) addToMap(item)
  for (const item of newIngredients) addToMap(item)

  // Now collapse each entry's parts into a single GroceryIngredient
  const result: GroceryIngredient[] = []

  for (const [, entry] of mergeMap) {
    const displayName = pickDisplayName(entry.displayNames)

    if (entry.parts.length === 1) {
      const p = entry.parts[0]
      result.push({ name: displayName, quantity: p.quantity, unit: p.rawUnit })
      continue
    }

    // Group parts by canonical unit
    const unitGroups = new Map<string, { qty: number; rawUnit: string | null }[]>()
    const noQtyParts: { rawUnit: string | null }[] = []

    for (const part of entry.parts) {
      const parsedQty = part.quantity ? parseAmount(part.quantity) : null

      if (parsedQty === null) {
        noQtyParts.push({ rawUnit: part.rawUnit })
        continue
      }

      const key = part.canonicalUnit ?? '__none__'
      let group = unitGroups.get(key)
      if (!group) {
        group = []
        unitGroups.set(key, group)
      }
      group.push({ qty: parsedQty, rawUnit: part.rawUnit })
    }

    // Sum within each unit group
    const summedParts: { qty: number; canonicalUnit: string | null; rawUnit: string | null }[] = []
    for (const [key, group] of unitGroups) {
      const totalQty = group.reduce((sum, g) => sum + g.qty, 0)
      summedParts.push({
        qty: totalQty,
        canonicalUnit: key === '__none__' ? null : key,
        rawUnit: group[0].rawUnit,
      })
    }

    // Try to convert & merge compatible unit groups
    const merged = mergeCompatibleUnits(summedParts)

    if (merged.length === 0 && noQtyParts.length > 0) {
      // Only unit-less, quantity-less parts
      result.push({ name: displayName, quantity: null, unit: null })
    } else if (merged.length === 1 && noQtyParts.length === 0) {
      // Single merged result
      result.push({
        name: displayName,
        quantity: formatAmount(merged[0].qty),
        unit: merged[0].rawUnit,
      })
    } else {
      // Multiple incompatible groups — combine with "+"
      const combined = merged
        .map((m) => {
          const qtyStr = formatAmount(m.qty)
          return m.rawUnit ? `${qtyStr} ${m.rawUnit}` : qtyStr
        })
        .join(' + ')

      result.push({
        name: displayName,
        quantity: combined || null,
        unit: null, // unit is baked into the combined string
      })
    }
  }

  return result
}

/**
 * Attempts to merge summed unit groups that are convertible to each other.
 * Returns the reduced set of groups after merging compatible ones.
 */
function mergeCompatibleUnits(
  parts: { qty: number; canonicalUnit: string | null; rawUnit: string | null }[]
): { qty: number; canonicalUnit: string | null; rawUnit: string | null }[] {
  if (parts.length <= 1) return parts

  const result: { qty: number; canonicalUnit: string | null; rawUnit: string | null }[] = []
  const used = new Set<number>()

  for (let i = 0; i < parts.length; i++) {
    if (used.has(i)) continue

    let current = parts[i]
    for (let j = i + 1; j < parts.length; j++) {
      if (used.has(j)) continue

      const a = current
      const b = parts[j]

      // Both null units — just sum
      if (a.canonicalUnit === null && b.canonicalUnit === null) {
        current = { qty: a.qty + b.qty, canonicalUnit: null, rawUnit: null }
        used.add(j)
        continue
      }

      // Same canonical unit — just sum
      if (a.canonicalUnit && b.canonicalUnit && a.canonicalUnit === b.canonicalUnit) {
        current = { qty: a.qty + b.qty, canonicalUnit: a.canonicalUnit, rawUnit: a.rawUnit }
        used.add(j)
        continue
      }

      // Try conversion
      if (a.canonicalUnit && b.canonicalUnit) {
        const converted = tryConvertAndMerge(a.qty, a.canonicalUnit, b.qty, b.canonicalUnit)
        if (converted) {
          const parsedQty = parseAmount(converted.quantity)
          current = {
            qty: parsedQty ?? a.qty + b.qty,
            canonicalUnit: converted.unit,
            rawUnit: converted.unit,
          }
          used.add(j)
        }
      }
    }

    result.push(current)
  }

  return result
}

export function ingredientToGroceryIngredient(ingredient: Ingredient): GroceryIngredient {
  return {
    name: ingredient.name,
    quantity: ingredient.amount || null,
    unit: ingredient.unit || null,
  }
}

export function ingredientsToGroceryIngredients(ingredients: Ingredient[]): GroceryIngredient[] {
  return ingredients.map(ingredientToGroceryIngredient)
}
