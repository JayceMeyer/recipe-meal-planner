import { useState, useMemo } from 'react'
import { ChevronDown, ChevronRight, Loader2, Plus, Package, Search } from 'lucide-react'
import { usePantryItems } from '@/hooks/usePantryItems'
import { usePantrySuggestions } from '@/hooks/usePantrySuggestions'
import { PantryItem } from '@/components/PantryItem'
import { RecipeSuggestions } from '@/components/RecipeSuggestions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { categorizeIngredient, getCategoryOrder, CATEGORIES } from '@/utils/ingredientCategories'
import type { PantryItem as PantryItemType } from '@/types/database'

interface GroupedItems {
  category: string
  items: PantryItemType[]
}

export function Pantry() {
  const { items, loading, error, addItem, updateItem, deleteItem } = usePantryItems()
  const { canMake, almostMakeable, loading: suggestionsLoading } = usePantrySuggestions()

  const [newItemName, setNewItemName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [adding, setAdding] = useState(false)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())

  const groups = useMemo(() => {
    const categoryMap = new Map<string, PantryItemType[]>()

    for (const item of items) {
      const category = (!item.category || item.category === 'Pantry')
        ? categorizeIngredient(item.ingredient_name)
        : item.category
      const existing = categoryMap.get(category) || []
      categoryMap.set(category, [...existing, item])
    }

    const result: GroupedItems[] = []
    for (const category of CATEGORIES) {
      const categoryItems = categoryMap.get(category)
      if (categoryItems && categoryItems.length > 0) {
        result.push({ category, items: categoryItems })
      }
    }

    const otherItems = categoryMap.get('Other')
    if (otherItems && otherItems.length > 0 && !result.some((g) => g.category === 'Other')) {
      result.push({ category: 'Other', items: otherItems })
    }

    result.sort((a, b) => getCategoryOrder(a.category) - getCategoryOrder(b.category))

    return result
  }, [items])

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups
    const query = searchQuery.toLowerCase()
    return groups
      .map((group) => ({
        ...group,
        items: group.items.filter((item) =>
          item.ingredient_name.toLowerCase().includes(query),
        ),
      }))
      .filter((group) => group.items.length > 0)
  }, [groups, searchQuery])

  const handleAddItem = async () => {
    if (!newItemName.trim()) return

    setAdding(true)
    await addItem(newItemName.trim())
    setAdding(false)
    setNewItemName('')
  }

  const toggleCategory = (category: string) => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="pb-8">
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="container py-4">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex-1">
              <h1 className="text-xl font-bold">My Pantry</h1>
              <p className="text-sm text-muted-foreground">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="Add an item..."
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddItem()
                }
              }}
              disabled={adding}
            />
            <Button onClick={handleAddItem} disabled={adding || !newItemName.trim()}>
              {adding ? <Loader2 className="animate-spin" /> : <Plus className="size-4" />}
            </Button>
          </div>

          {items.length > 0 && (
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search pantry..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
        </div>
      </div>

      <div className="container mt-4">
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md mb-4">
            {error}
          </div>
        )}

        {items.length > 0 && (
          <RecipeSuggestions
            canMake={canMake}
            almostReady={almostMakeable}
            loading={suggestionsLoading}
          />
        )}

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Package className="size-16 text-muted-foreground/40 mb-4" />
            <h2 className="text-xl font-medium mb-2">Your pantry is empty</h2>
            <p className="text-muted-foreground">
              Add items above or they'll be added automatically from your grocery lists.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredGroups.map((group) => (
              <div key={group.category}>
                <button
                  onClick={() => toggleCategory(group.category)}
                  className="flex items-center gap-2 w-full text-left py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  {collapsedCategories.has(group.category) ? (
                    <ChevronRight className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                  {group.category}
                  <span className="text-xs">({group.items.length})</span>
                </button>

                {!collapsedCategories.has(group.category) && (
                  <div className="border rounded-lg overflow-hidden">
                    {group.items.map((item) => (
                      <PantryItem
                        key={item.id}
                        item={item}
                        onDelete={() => deleteItem(item.id)}
                        onUpdate={(updates) => updateItem(item.id, updates)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
