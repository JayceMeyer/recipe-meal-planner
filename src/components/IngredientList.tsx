import { GripVertical, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Ingredient } from '@/types/database'

interface IngredientListProps {
  ingredients: Ingredient[]
  onAdd: () => void
  onUpdate: (index: number, ingredient: Ingredient) => void
  onRemove: (index: number) => void
  onMove: (fromIndex: number, toIndex: number) => void
}

export function IngredientList({
  ingredients,
  onAdd,
  onUpdate,
  onRemove,
  onMove,
}: IngredientListProps) {
  const handleDragStart = (e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('text/plain', index.toString())
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault()
    const fromIndex = parseInt(e.dataTransfer.getData('text/plain'), 10)
    if (fromIndex !== toIndex) {
      onMove(fromIndex, toIndex)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">Ingredients</label>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <Plus className="size-4" />
          Add
        </Button>
      </div>

      <div className="space-y-2">
        {ingredients.map((ingredient, index) => (
          <div
            key={index}
            className="flex items-center gap-2"
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
          >
            <button
              type="button"
              className="cursor-grab p-1 text-muted-foreground hover:text-foreground"
              aria-label="Drag to reorder"
            >
              <GripVertical className="size-4" />
            </button>

            <Input
              placeholder="Amount"
              value={ingredient.amount}
              onChange={(e) =>
                onUpdate(index, { ...ingredient, amount: e.target.value })
              }
              className="w-20"
              aria-label={`Ingredient ${index + 1} amount`}
            />

            <Input
              placeholder="Unit"
              value={ingredient.unit ?? ''}
              onChange={(e) =>
                onUpdate(index, { ...ingredient, unit: e.target.value || undefined })
              }
              className="w-20"
              aria-label={`Ingredient ${index + 1} unit`}
            />

            <Input
              placeholder="Ingredient name"
              value={ingredient.name}
              onChange={(e) =>
                onUpdate(index, { ...ingredient, name: e.target.value })
              }
              className="flex-1"
              aria-label={`Ingredient ${index + 1} name`}
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemove(index)}
              disabled={ingredients.length === 1}
              aria-label={`Remove ingredient ${index + 1}`}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
