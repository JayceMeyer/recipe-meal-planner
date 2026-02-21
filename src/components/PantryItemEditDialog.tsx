import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CATEGORIES } from '@/utils/ingredientCategories'
import type { PantryItem } from '@/types/database'

interface PantryItemEditDialogProps {
  item: PantryItem
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (updates: { ingredient_name?: string; quantity?: string; unit?: string; category?: string }) => void
}

export function PantryItemEditDialog({ item, open, onOpenChange, onSave }: PantryItemEditDialogProps) {
  const [name, setName] = useState(item.ingredient_name)
  const [quantity, setQuantity] = useState(item.quantity || '')
  const [unit, setUnit] = useState(item.unit || '')
  const [category, setCategory] = useState(item.category || 'Other')

  const handleSave = () => {
    const updates: Record<string, string | undefined> = {}

    if (name !== item.ingredient_name) updates.ingredient_name = name
    if (quantity !== (item.quantity || '')) updates.quantity = quantity || undefined
    if (unit !== (item.unit || '')) updates.unit = unit || undefined
    if (category !== (item.category || 'Other')) updates.category = category

    if (Object.keys(updates).length > 0) {
      onSave(updates)
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-1.5">
            <label htmlFor="edit-name" className="text-sm font-medium">Name</label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ingredient name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <label htmlFor="edit-qty" className="text-sm font-medium">Quantity</label>
              <Input
                id="edit-qty"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 2"
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="edit-unit" className="text-sm font-medium">Unit</label>
              <Input
                id="edit-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. lbs"
              />
            </div>
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="edit-category" className="text-sm font-medium">Category</label>
            <select
              id="edit-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base md:text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim()}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
