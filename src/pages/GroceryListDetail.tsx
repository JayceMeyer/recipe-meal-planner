import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ChevronDown, ChevronRight, Loader2, Plus } from 'lucide-react'
import { useGroceryLists } from '@/hooks/useGroceryLists'
import { useGroceryItems } from '@/hooks/useGroceryItems'
import { GroceryItem } from '@/components/GroceryItem'
import { ExportGroceryList } from '@/components/ExportGroceryList'
import { InstacartExport } from '@/components/InstacartExport'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { categorizeIngredient, getCategoryOrder, CATEGORIES } from '@/utils/ingredientCategories'
import type { GroceryItem as GroceryItemType } from '@/types/database'

interface GroupedItems {
  category: string
  items: GroceryItemType[]
}

export function GroceryListDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { lists, loading: listsLoading } = useGroceryLists()
  const { items, loading: itemsLoading, toggleChecked, updateItem, deleteItem, addItem } =
    useGroceryItems(id)

  const [newItemName, setNewItemName] = useState('')
  const [adding, setAdding] = useState(false)
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  const [showChecked, setShowChecked] = useState(true)

  const list = lists.find((l) => l.id === id)
  const loading = listsLoading || itemsLoading

  const { uncheckedGroups, checkedItems } = useMemo(() => {
    const unchecked = items.filter((item) => !item.checked)
    const checked = items.filter((item) => item.checked)

    const categoryMap = new Map<string, GroceryItemType[]>()

    for (const item of unchecked) {
      const category = item.category || categorizeIngredient(item.ingredient_name)
      const existing = categoryMap.get(category) || []
      categoryMap.set(category, [...existing, item])
    }

    const groups: GroupedItems[] = []
    for (const category of CATEGORIES) {
      const categoryItems = categoryMap.get(category)
      if (categoryItems && categoryItems.length > 0) {
        groups.push({ category, items: categoryItems })
      }
    }

    const otherItems = categoryMap.get('Other')
    if (otherItems && otherItems.length > 0) {
      groups.push({ category: 'Other', items: otherItems })
    }

    groups.sort((a, b) => getCategoryOrder(a.category) - getCategoryOrder(b.category))

    return { uncheckedGroups: groups, checkedItems: checked }
  }, [items])

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

  if (!list) {
    return (
      <div className="container py-8">
        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md mb-4">
          List not found
        </div>
        <Button variant="outline" onClick={() => navigate('/grocery')}>
          <ArrowLeft className="size-4" />
          Back to Lists
        </Button>
      </div>
    )
  }

  return (
    <div className="pb-8">
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="container py-4">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/grocery')}>
              <ArrowLeft className="size-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{list.name}</h1>
              <p className="text-sm text-muted-foreground">
                {items.length} {items.length === 1 ? 'item' : 'items'}
                {checkedItems.length > 0 && ` · ${checkedItems.length} checked`}
              </p>
            </div>
            <ExportGroceryList items={items} />
            <InstacartExport />
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
        </div>
      </div>

      <div className="container mt-4">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No items in this list yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Add items above or from a recipe.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {uncheckedGroups.map((group) => (
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
                      <GroceryItem
                        key={item.id}
                        item={item}
                        onToggle={() => toggleChecked(item.id)}
                        onDelete={() => deleteItem(item.id)}
                        onUpdate={(updates) => updateItem(item.id, updates)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}

            {checkedItems.length > 0 && (
              <div>
                <button
                  onClick={() => setShowChecked(!showChecked)}
                  className="flex items-center gap-2 w-full text-left py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  {showChecked ? (
                    <ChevronDown className="size-4" />
                  ) : (
                    <ChevronRight className="size-4" />
                  )}
                  Checked
                  <span className="text-xs">({checkedItems.length})</span>
                </button>

                {showChecked && (
                  <div className="border rounded-lg overflow-hidden opacity-60">
                    {checkedItems.map((item) => (
                      <GroceryItem
                        key={item.id}
                        item={item}
                        onToggle={() => toggleChecked(item.id)}
                        onDelete={() => deleteItem(item.id)}
                        onUpdate={(updates) => updateItem(item.id, updates)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
