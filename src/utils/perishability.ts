import type { PantryItem } from '@/types/database'

export type PerishabilityTier = 'HIGH' | 'MEDIUM' | 'LOW'

const TIER_MAP: Record<string, PerishabilityTier> = {
  Produce: 'HIGH',
  Dairy: 'HIGH',
  Eggs: 'HIGH',
  Meat: 'HIGH',
  Seafood: 'HIGH',
  Bakery: 'HIGH',
  Frozen: 'MEDIUM',
  Beverages: 'MEDIUM',
}

const TIER_ORDER: Record<PerishabilityTier, number> = {
  HIGH: 0,
  MEDIUM: 1,
  LOW: 2,
}

export function getPerishabilityTier(category: string | null): PerishabilityTier {
  if (!category) return 'LOW'
  return TIER_MAP[category] ?? 'LOW'
}

export function sortByPerishability<T extends Pick<PantryItem, 'category'>>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => TIER_ORDER[getPerishabilityTier(a.category)] - TIER_ORDER[getPerishabilityTier(b.category)]
  )
}

export function getPerishableItems<T extends Pick<PantryItem, 'category'>>(items: T[]): T[] {
  return items.filter((item) => getPerishabilityTier(item.category) === 'HIGH')
}
