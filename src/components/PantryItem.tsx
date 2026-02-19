import { useState, useRef, useEffect } from 'react'
import { Check, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { PantryItem as PantryItemType } from '@/types/database'

interface PantryItemProps {
  item: PantryItemType
  onDelete: () => void
  onUpdate: (updates: { ingredient_name?: string; quantity?: string; unit?: string }) => void
}

export function PantryItem({ item, onDelete, onUpdate }: PantryItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editQuantity, setEditQuantity] = useState(item.quantity || '')
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [swipeOffset, setSwipeOffset] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleSave = () => {
    if (editQuantity !== (item.quantity || '')) {
      onUpdate({ quantity: editQuantity || undefined })
    }
    setIsEditing(false)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStart === null) return
    const diff = touchStart - e.touches[0].clientX
    if (diff > 0) {
      setSwipeOffset(Math.min(diff, 80))
    }
  }

  const handleTouchEnd = () => {
    if (swipeOffset > 60) {
      onDelete()
    }
    setSwipeOffset(0)
    setTouchStart(null)
  }

  return (
    <div
      className="relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-center bg-destructive text-destructive-foreground px-4"
        style={{ width: swipeOffset }}
      >
        <Trash2 className="size-5" />
      </div>

      <div
        className={cn(
          'flex items-center gap-3 p-3 bg-background border-b transition-transform'
        )}
        style={{ transform: `translateX(-${swipeOffset}px)` }}
      >
        <span className="flex-1 min-w-0 truncate">{item.ingredient_name}</span>

        {isEditing ? (
          <div className="flex items-center gap-1 shrink-0">
            <Input
              ref={inputRef}
              value={editQuantity}
              onChange={(e) => setEditQuantity(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
                if (e.key === 'Escape') {
                  setEditQuantity(item.quantity || '')
                  setIsEditing(false)
                }
              }}
              placeholder="Qty"
              className="w-20 h-7 text-sm"
            />
            <Button size="sm" variant="ghost" className="h-7 px-2" onClick={handleSave}>
              <Check className="size-4" />
            </Button>
          </div>
        ) : (
          <button
            onClick={() => { setEditQuantity(item.quantity || ''); setIsEditing(true) }}
            className="shrink-0 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {item.quantity || item.unit
              ? <span>{[item.quantity, item.unit].filter(Boolean).join(' ')}</span>
              : <span className="text-xs">+ qty</span>}
          </button>
        )}

        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="shrink-0 hidden sm:flex"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  )
}
