import type { GroceryItem } from '@/types/database'
import { categorizeIngredient, getCategoryOrder } from './ingredientCategories'

export interface FormatOptions {
  includeChecked: boolean
  groupByCategory: boolean
}

const DEFAULT_OPTIONS: FormatOptions = {
  includeChecked: false,
  groupByCategory: true,
}

function formatItem(item: GroceryItem): string {
  const parts: string[] = []

  if (item.quantity) {
    parts.push(item.quantity)
  }

  if (item.unit) {
    parts.push(item.unit)
  }

  parts.push(item.ingredient_name)

  return `• ${parts.join(' ')}`
}

export function formatGroceryList(
  items: GroceryItem[],
  options: Partial<FormatOptions> = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options }

  const filteredItems = opts.includeChecked ? items : items.filter((item) => !item.checked)

  if (filteredItems.length === 0) {
    return ''
  }

  if (!opts.groupByCategory) {
    return filteredItems.map(formatItem).join('\n')
  }

  const categoryMap = new Map<string, GroceryItem[]>()

  for (const item of filteredItems) {
    const category = (!item.category || item.category === 'Pantry')
      ? categorizeIngredient(item.ingredient_name)
      : item.category
    const existing = categoryMap.get(category) || []
    categoryMap.set(category, [...existing, item])
  }

  const sortedCategories = [...categoryMap.keys()].sort(
    (a, b) => getCategoryOrder(a) - getCategoryOrder(b)
  )

  const sections: string[] = []

  for (const category of sortedCategories) {
    const categoryItems = categoryMap.get(category)
    if (!categoryItems || categoryItems.length === 0) continue

    const header = `${category}`
    const itemLines = categoryItems.map(formatItem)
    sections.push([header, ...itemLines].join('\n'))
  }

  return sections.join('\n\n')
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    try {
      document.execCommand('copy')
      document.body.removeChild(textArea)
      return true
    } catch {
      document.body.removeChild(textArea)
      return false
    }
  }
}
