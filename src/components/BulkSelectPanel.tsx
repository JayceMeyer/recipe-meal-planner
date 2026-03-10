import { useState, useMemo } from 'react'
import { Check, ChevronDown, ChevronRight, Loader2, Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { categorizeIngredient, getCategoryOrder } from '@/utils/ingredientCategories'
import { COMMON_PANTRY_ITEMS } from '@/data/commonPantryItems'

interface BulkSelectPanelProps {
  existingNames: Set<string>
  onAdd: (names: string[]) => Promise<void>
}

interface CategoryGroup {
  category: string
  items: string[]
}

export function BulkSelectPanel({ existingNames, onAdd }: BulkSelectPanelProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState('')
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [adding, setAdding] = useState(false)

  const normalizedExisting = useMemo(
    () => new Set([...existingNames].map((n) => n.toLowerCase())),
    [existingNames],
  )

  const groups = useMemo(() => {
    const available = COMMON_PANTRY_ITEMS.filter(
      (name) => !normalizedExisting.has(name.toLowerCase()),
    )

    const categoryMap = new Map<string, string[]>()
    for (const name of available) {
      const cat = categorizeIngredient(name)
      const existing = categoryMap.get(cat) || []
      existing.push(name)
      categoryMap.set(cat, existing)
    }

    const result: CategoryGroup[] = [...categoryMap.entries()]
      .map(([category, items]) => ({ category, items }))
      .sort((a, b) => getCategoryOrder(a.category) - getCategoryOrder(b.category))

    return result
  }, [normalizedExisting])

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups
    const query = searchQuery.toLowerCase()
    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter((name) => name.toLowerCase().includes(query)),
      }))
      .filter((group) => group.items.length > 0)
  }, [groups, searchQuery])

  const toggleItem = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(name)) {
        next.delete(name)
      } else {
        next.add(name)
      }
      return next
    })
  }

  const toggleCategory = (_category: string, items: string[]) => {
    setSelected((prev) => {
      const next = new Set(prev)
      const allSelected = items.every((name) => next.has(name))
      if (allSelected) {
        for (const name of items) next.delete(name)
      } else {
        for (const name of items) next.add(name)
      }
      return next
    })
  }

  const toggleCollapse = (category: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(category)) {
        next.delete(category)
      } else {
        next.add(category)
      }
      return next
    })
  }

  const handleAdd = async () => {
    if (selected.size === 0) return
    setAdding(true)
    try {
      await onAdd([...selected])
      setSelected(new Set())
    } finally {
      setAdding(false)
    }
  }

  const totalAvailable = groups.reduce((sum, g) => sum + g.items.length, 0)

  if (totalAvailable === 0) return null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Browse Common Items</p>
        <span className="text-xs text-muted-foreground">{totalAvailable} available</span>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Filter items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-8 text-sm"
        />
      </div>

      <div className="max-h-64 overflow-y-auto rounded-lg border">
        {filteredGroups.map((group) => {
          const isCollapsed = collapsedCategories.has(group.category)
          const selectedInCategory = group.items.filter((n) => selected.has(n)).length
          const allSelected = selectedInCategory === group.items.length

          return (
            <div key={group.category}>
              <div className="sticky top-0 bg-muted/80 backdrop-blur-sm flex items-center gap-2 px-3 py-1.5 border-b">
                <button
                  type="button"
                  onClick={() => toggleCollapse(group.category)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {isCollapsed
                    ? <ChevronRight className="size-3.5" />
                    : <ChevronDown className="size-3.5" />}
                </button>
                <span className="text-xs font-medium flex-1">{group.category}</span>
                <button
                  type="button"
                  onClick={() => toggleCategory(group.category, group.items)}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  {allSelected ? 'Deselect All' : 'Select All'}
                </button>
                {selectedInCategory > 0 && (
                  <span className="text-xs text-primary">{selectedInCategory}</span>
                )}
              </div>

              {!isCollapsed && (
                <div className="flex flex-wrap gap-1.5 p-2">
                  {group.items.map((name) => {
                    const isSelected = selected.has(name)
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => toggleItem(name)}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs transition-colors ${
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80'
                        }`}
                      >
                        {isSelected && <Check className="size-3" />}
                        {name}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {selected.size > 0 && (
        <Button onClick={handleAdd} disabled={adding} className="w-full">
          {adding ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <>
              <Plus className="size-4" />
              Add {selected.size} {selected.size === 1 ? 'Item' : 'Items'}
            </>
          )}
        </Button>
      )}
    </div>
  )
}
