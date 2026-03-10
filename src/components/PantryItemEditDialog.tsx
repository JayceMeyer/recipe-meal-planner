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
  onSave: (updates: { ingredient_name?: string; quantity?: string; unit?: string; category?: string; is_staple?: boolean; staple_threshold?: string; staple_unit?: string }) => void
}

export function PantryItemEditDialog({ item, open, onOpenChange, onSave }: PantryItemEditDialogProps) {
  const [name, setName] = useState(item.ingredient_name)
  const [quantity, setQuantity] = useState(item.quantity || '')
  const [unit, setUnit] = useState(item.unit || '')
  const [category, setCategory] = useState(item.category || 'Other')
  const [isStaple, setIsStaple] = useState(item.is_staple)
  const [stapleThreshold, setStapleThreshold] = useState(item.staple_threshold || '')
  const [stapleUnit, setStapleUnit] = useState(item.staple_unit || '')

  const handleSave = () => {
    const updates: Record<string, string | boolean | undefined> = {}

    if (name !== item.ingredient_name) updates.ingredient_name = name
    if (quantity !== (item.quantity || '')) updates.quantity = quantity || undefined
    if (unit !== (item.unit || '')) updates.unit = unit || undefined
    if (category !== (item.category || 'Other')) updates.category = category
    if (isStaple !== item.is_staple) updates.is_staple = isStaple
    if (stapleThreshold !== (item.staple_threshold || '')) updates.staple_threshold = stapleThreshold || undefined
    if (stapleUnit !== (item.staple_unit || '')) updates.staple_unit = stapleUnit || undefined

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

          <div className="border-t pt-4 space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isStaple}
                onChange={(e) => setIsStaple(e.target.checked)}
                className="size-4 rounded border-input"
              />
              <div>
                <span className="text-sm font-medium">Always Stocked (Staple)</span>
                <p className="text-xs text-muted-foreground">
                  Staples are always considered available for recipe matching
                </p>
              </div>
            </label>

            {isStaple && (
              <div className="grid grid-cols-2 gap-3 pl-7">
                <div className="grid gap-1.5">
                  <label htmlFor="edit-threshold" className="text-xs text-muted-foreground">Restock below</label>
                  <Input
                    id="edit-threshold"
                    value={stapleThreshold}
                    onChange={(e) => setStapleThreshold(e.target.value)}
                    placeholder="e.g. 1"
                    className="h-8 text-sm"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label htmlFor="edit-staple-unit" className="text-xs text-muted-foreground">Unit</label>
                  <Input
                    id="edit-staple-unit"
                    value={stapleUnit}
                    onChange={(e) => setStapleUnit(e.target.value)}
                    placeholder="e.g. lb"
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            )}
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
