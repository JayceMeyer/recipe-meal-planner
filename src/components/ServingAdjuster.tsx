import { Minus, Plus, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ServingAdjusterProps {
  currentServings: number
  originalServings: number
  onIncrement: () => void
  onDecrement: () => void
  onReset: () => void
  isModified: boolean
}

export function ServingAdjuster({
  currentServings,
  originalServings,
  onIncrement,
  onDecrement,
  onReset,
  isModified,
}: ServingAdjusterProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium">Servings:</span>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={onDecrement}
          disabled={currentServings <= 1}
          aria-label="Decrease servings"
        >
          <Minus className="size-4" />
        </Button>
        <span className="w-8 text-center font-medium">{currentServings}</span>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={onIncrement}
          aria-label="Increase servings"
        >
          <Plus className="size-4" />
        </Button>
      </div>
      {isModified && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="text-muted-foreground"
          aria-label="Reset to original servings"
        >
          <RotateCcw className="size-3" />
          <span className="text-xs">Reset to {originalServings}</span>
        </Button>
      )}
    </div>
  )
}
