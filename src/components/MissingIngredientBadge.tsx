import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MissingIngredientBadgeProps {
  name: string
  onAdd?: () => void
  className?: string
}

export function MissingIngredientBadge({
  name,
  onAdd,
  className,
}: MissingIngredientBadgeProps) {
  if (onAdd) {
    return (
      <button
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onAdd()
        }}
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full',
          'bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors',
          'dark:bg-amber-900/30 dark:text-amber-200 dark:hover:bg-amber-900/50',
          className
        )}
      >
        <Plus className="size-3" />
        {name}
      </button>
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-xs rounded-full',
        'bg-amber-100 text-amber-800',
        'dark:bg-amber-900/30 dark:text-amber-200',
        className
      )}
    >
      {name}
    </span>
  )
}
