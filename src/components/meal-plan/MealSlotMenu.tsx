import { MoreHorizontal, RefreshCw, BookOpen, PenLine, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface MealSlotMenuProps {
  onRegenerate: () => void
  onPickRecipe: () => void
  onCustomEntry: () => void
  onRemove: () => void
  compact?: boolean
}

export function MealSlotMenu({
  onRegenerate,
  onPickRecipe,
  onCustomEntry,
  onRemove,
  compact = false,
}: MealSlotMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={
            compact
              ? 'absolute -top-1 -right-1 size-4 rounded-full bg-muted flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity'
              : 'size-6 rounded flex items-center justify-center hover:bg-muted transition-colors'
          }
        >
          <MoreHorizontal className={compact ? 'size-3' : 'size-4'} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onRegenerate}>
          <RefreshCw className="size-4" />
          Regenerate with AI
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onPickRecipe}>
          <BookOpen className="size-4" />
          Pick from recipes
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onCustomEntry}>
          <PenLine className="size-4" />
          Custom entry
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={onRemove}>
          <Trash2 className="size-4" />
          Remove
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
