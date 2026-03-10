import { useState, useMemo } from 'react'
import { Plus, X, Loader2, LayoutGrid } from 'lucide-react'
import { usePantryItems } from '@/hooks/usePantryItems'
import { BulkSelectPanel } from '@/components/BulkSelectPanel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { categorizeIngredient } from '@/utils/ingredientCategories'

interface BulkAddStepProps {
  onSkip: () => void
}

export function BulkAddStep({ onSkip }: BulkAddStepProps) {
  const { items, loading, error, addItem, addItems, deleteItem } = usePantryItems()
  const [inputValue, setInputValue] = useState('')
  const [adding, setAdding] = useState(false)

  const existingNames = useMemo(
    () => new Set(items.map((i) => i.ingredient_name.toLowerCase())),
    [items],
  )

  const handleAdd = async () => {
    const itemName = inputValue.trim()
    if (!itemName) return

    setAdding(true)
    await addItem(itemName)
    setAdding(false)
    setInputValue('')
  }

  const handleBulkAdd = async (names: string[]) => {
    await addItems(names.map((name) => ({ ingredient_name: name })))
  }

  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    const cat = (!item.category || item.category === 'Pantry')
      ? categorizeIngredient(item.ingredient_name)
      : item.category
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="text-center">
        <LayoutGrid className="mx-auto size-10 text-primary mb-2" />
        <h2 className="text-xl font-semibold">Browse & add items</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Select from common pantry items or type to add your own
        </p>
      </div>

      <BulkSelectPanel
        existingNames={existingNames}
        onAdd={handleBulkAdd}
      />

      <div className="flex gap-2">
        <Input
          placeholder="e.g. olive oil, chicken, rice..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleAdd()
            }
          }}
          disabled={adding}
        />
        <Button onClick={handleAdd} disabled={adding || !inputValue.trim()}>
          {adding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {loading && items.length === 0 && (
        <div className="flex justify-center py-4">
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {items.length > 0 && (
        <div className="space-y-4 rounded-lg border p-4">
          <p className="text-sm font-medium">
            Your pantry ({items.length} {items.length === 1 ? 'item' : 'items'})
          </p>
          {Object.entries(grouped).map(([category, categoryItems]) => (
            <div key={category}>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                {category}
              </p>
              <div className="flex flex-wrap gap-2">
                {categoryItems.map((item) => (
                  <span
                    key={item.id}
                    className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-3 py-1 text-sm"
                  >
                    {item.ingredient_name}
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="text-primary/60 hover:text-primary"
                    >
                      <X className="size-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {items.length === 0 && !loading && (
        <button
          onClick={onSkip}
          className="block mx-auto text-sm text-muted-foreground hover:text-foreground"
        >
          Skip for now
        </button>
      )}
    </div>
  )
}
