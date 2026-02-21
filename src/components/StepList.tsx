import { GripVertical, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Step } from '@/types/database'

interface StepListProps {
  steps: Step[]
  onAdd: () => void
  onUpdate: (index: number, instruction: string) => void
  onRemove: (index: number) => void
  onMove: (fromIndex: number, toIndex: number) => void
}

export function StepList({
  steps,
  onAdd,
  onUpdate,
  onRemove,
  onMove,
}: StepListProps) {
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
        <label className="text-sm font-medium">Instructions</label>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <Plus className="size-4" />
          Add Step
        </Button>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <div
            key={index}
            className="flex items-start gap-2"
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
          >
            <button
              type="button"
              className="cursor-grab p-1 text-muted-foreground hover:text-foreground mt-2"
              aria-label="Drag to reorder"
            >
              <GripVertical className="size-4" />
            </button>

            <span className="flex items-center justify-center size-7 rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0 mt-1.5">
              {step.order}
            </span>

            <textarea
              placeholder="Describe this step..."
              value={step.instruction}
              onChange={(e) => onUpdate(index, e.target.value)}
              className="flex-1 min-h-[80px] px-3 py-2 text-base md:text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              aria-label={`Step ${step.order} instruction`}
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => onRemove(index)}
              disabled={steps.length === 1}
              className="mt-1.5"
              aria-label={`Remove step ${step.order}`}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}
