import { useState } from 'react'
import { Check, Loader2, Plus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CuisineIngredientMapping } from '@/types/database'

interface SmartSuggestionsProps {
  suggestions: CuisineIngredientMapping[]
  loading: boolean
  existingNames: Set<string>
  onAdd: (names: string[]) => Promise<void>
}

export function SmartSuggestions({ suggestions, loading, existingNames, onAdd }: SmartSuggestionsProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [adding, setAdding] = useState(false)
  const [addedNames, setAddedNames] = useState<Set<string>>(new Set())

  const normalizedExisting = new Set([...existingNames].map((n) => n.toLowerCase()))

  const available = suggestions.filter(
    (s) => !normalizedExisting.has(s.ingredient_name.toLowerCase()) && !addedNames.has(s.ingredient_name.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-3">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading suggestions...</span>
      </div>
    )
  }

  if (available.length === 0 && addedNames.size === 0) return null

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

  const handleAdd = async () => {
    if (selected.size === 0) return
    setAdding(true)
    try {
      await onAdd([...selected])
      setAddedNames((prev) => {
        const next = new Set(prev)
        for (const name of selected) next.add(name.toLowerCase())
        return next
      })
      setSelected(new Set())
    } finally {
      setAdding(false)
    }
  }

  const cuisines = [...new Set(available.map((s) => s.cuisine))]

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Sparkles className="size-4 text-primary" />
        <p className="text-sm font-medium">Suggested for Your Kitchen</p>
      </div>

      {cuisines.length > 0 && (
        <div className="space-y-2">
          {cuisines.map((cuisine) => {
            const items = available.filter((s) => s.cuisine === cuisine)
            if (items.length === 0) return null
            return (
              <div key={cuisine}>
                <p className="text-xs text-muted-foreground mb-1.5">{cuisine}</p>
                <div className="flex flex-wrap gap-1.5">
                  {items.map((item) => {
                    const isSelected = selected.has(item.ingredient_name)
                    return (
                      <button
                        key={`${item.cuisine}-${item.ingredient_name}`}
                        type="button"
                        onClick={() => toggleItem(item.ingredient_name)}
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs transition-colors ${
                          isSelected
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-primary/10 text-primary hover:bg-primary/20'
                        }`}
                      >
                        {isSelected ? <Check className="size-3" /> : <Plus className="size-3" />}
                        {item.ingredient_name}
                        {item.tier === 1 && !isSelected && (
                          <span className="text-[10px] opacity-60">*</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {available.length > 0 && available.some((s) => s.tier === 1) && (
        <p className="text-[10px] text-muted-foreground">* Essential for this cuisine</p>
      )}

      {selected.size > 0 && (
        <Button size="sm" onClick={handleAdd} disabled={adding}>
          {adding ? (
            <Loader2 className="size-3.5 animate-spin" />
          ) : (
            <>
              <Plus className="size-3.5" />
              Add {selected.size} Suggested {selected.size === 1 ? 'Item' : 'Items'}
            </>
          )}
        </Button>
      )}
    </div>
  )
}
