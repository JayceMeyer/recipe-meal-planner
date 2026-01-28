import { useState, useRef, useEffect } from 'react'
import { Check, Trash2, ExternalLink } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import type { GroceryItem as GroceryItemType } from '@/types/database'

interface GroceryItemProps {
  item: GroceryItemType
  onToggle: () => void
  onDelete: () => void
  onUpdate: (updates: { quantity?: string; unit?: string }) => void
}

export function GroceryItem({ item, onToggle, onDelete, onUpdate }: GroceryItemProps) {
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
          'flex items-center gap-3 p-3 bg-background border-b transition-transform',
          item.checked && 'bg-muted/50'
        )}
        style={{ transform: `translateX(-${swipeOffset}px)` }}
      >
        <Checkbox
          checked={item.checked}
          onCheckedChange={onToggle}
          className="shrink-0"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {isEditing ? (
              <div className="flex items-center gap-1">
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
                  className="w-16 h-7 text-sm"
                />
                <Button size="sm" variant="ghost" className="h-7 px-2" onClick={handleSave}>
                  <Check className="size-4" />
                </Button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className={cn(
                  'text-left hover:underline',
                  item.checked && 'line-through text-muted-foreground'
                )}
              >
                {item.quantity && <span className="font-medium">{item.quantity} </span>}
                {item.unit && <span>{item.unit} </span>}
                <span>{item.ingredient_name}</span>
              </button>
            )}
          </div>

          {item.source_recipe_id && (
            <Link
              to={`/recipes/${item.source_recipe_id}`}
              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 mt-1"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="size-3" />
              View recipe
            </Link>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={onDelete}
          className="shrink-0 opacity-0 group-hover:opacity-100 sm:opacity-100"
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  )
}
