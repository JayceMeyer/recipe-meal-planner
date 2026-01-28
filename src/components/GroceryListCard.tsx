import { Link } from 'react-router-dom'
import { Check, Edit2, ShoppingCart, Trash2 } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { GroceryList } from '@/types/database'

interface GroceryListCardProps {
  list: GroceryList & { itemCount: number }
  isActive: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}

export function GroceryListCard({
  list,
  isActive,
  onSelect,
  onEdit,
  onDelete,
}: GroceryListCardProps) {
  return (
    <Link to={`/grocery/${list.id}`}>
      <Card
        className={cn(
          'overflow-hidden hover:shadow-md transition-shadow cursor-pointer',
          isActive && 'ring-2 ring-primary'
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-medium truncate">{list.name}</h3>
                {isActive && <Check className="size-4 text-primary shrink-0" />}
              </div>
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                <ShoppingCart className="size-4" />
                <span>
                  {list.itemCount} {list.itemCount === 1 ? 'item' : 'items'}
                </span>
              </div>
            </div>
            <div className="flex gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onSelect()
                }}
                aria-label={isActive ? 'Deselect as active' : 'Set as active'}
              >
                <Check className={cn('size-4', isActive ? 'text-primary' : 'text-muted-foreground')} />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onEdit()
                }}
                aria-label={`Edit ${list.name}`}
              >
                <Edit2 className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onDelete()
                }}
                aria-label={`Delete ${list.name}`}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
