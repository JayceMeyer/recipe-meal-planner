import { useState } from 'react'
import { Plus, X, Loader2, Package } from 'lucide-react'
import { usePantryItems } from '@/hooks/usePantryItems'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { categorizeIngredient } from '@/utils/ingredientCategories'

interface PantrySetupStepProps {
  onSkip: () => void
}

export function PantrySetupStep({ onSkip }: PantrySetupStepProps) {
  const { items, addItem, deleteItem } = usePantryItems()
  const [inputValue, setInputValue] = useState('')
  const [adding, setAdding] = useState(false)

  const handleAdd = async () => {
    const name = inputValue.trim()
    if (!name) return

    setAdding(true)
    await addItem(name)
    setAdding(false)
    setInputValue('')
  }

  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    const cat = item.category || categorizeIngredient(item.ingredient_name)
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(item)
    return acc
  }, {})

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Package className="mx-auto size-10 text-primary mb-2" />
        <h2 className="text-xl font-semibold">What's in your pantry?</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Add ingredients you already have at home
        </p>
      </div>

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

      {items.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? 'item' : 'items'} added
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
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm"
                  >
                    {item.ingredient_name}
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="text-muted-foreground hover:text-foreground"
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

      {items.length === 0 && (
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
