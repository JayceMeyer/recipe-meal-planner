import { useState } from 'react'
import { Check, ClipboardCopy, Loader2, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { formatGroceryList, copyToClipboard } from '@/utils/groceryListFormatter'
import { usePantryItems } from '@/hooks/usePantryItems'
import type { GroceryItem } from '@/types/database'

interface ExportGroceryListProps {
  items: GroceryItem[]
}

export function ExportGroceryList({ items }: ExportGroceryListProps) {
  const [copying, setCopying] = useState(false)
  const [copied, setCopied] = useState(false)
  const [addedToPantry, setAddedToPantry] = useState(false)
  const [includeChecked, setIncludeChecked] = useState(false)
  const { addItems } = usePantryItems()

  const handleExport = async () => {
    const text = formatGroceryList(items, { includeChecked })

    if (!text) {
      return
    }

    setCopying(true)
    const success = await copyToClipboard(text)
    setCopying(false)

    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleAddToPantry = async () => {
    const itemsToAdd = includeChecked ? items : items.filter((i) => !i.checked)
    if (itemsToAdd.length === 0) return

    const success = await addItems(
      itemsToAdd.map((i) => ({
        ingredient_name: i.ingredient_name,
        quantity: i.quantity || undefined,
        unit: i.unit || undefined,
      }))
    )

    if (success) {
      setAddedToPantry(true)
      setTimeout(() => setAddedToPantry(false), 2000)
    }
  }

  const uncheckedCount = items.filter((i) => !i.checked).length
  const checkedCount = items.filter((i) => i.checked).length

  if (items.length === 0) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={copying}>
          {copying ? (
            <Loader2 className="size-4 animate-spin" />
          ) : copied ? (
            <>
              <Check className="size-4 text-green-500" />
              Copied!
            </>
          ) : (
            <>
              <ClipboardCopy className="size-4" />
              Export
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-2 py-1.5">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={includeChecked}
              onCheckedChange={(checked) => setIncludeChecked(checked === true)}
            />
            <span>Include checked items</span>
          </label>
          <p className="text-xs text-muted-foreground mt-1">
            {uncheckedCount} unchecked{checkedCount > 0 && `, ${checkedCount} checked`}
          </p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleExport} disabled={copying}>
          <ClipboardCopy className="size-4" />
          Copy to clipboard
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleAddToPantry}>
          {addedToPantry ? (
            <>
              <Check className="size-4 text-green-500" />
              Added to pantry!
            </>
          ) : (
            <>
              <Package className="size-4" />
              Add to pantry
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
