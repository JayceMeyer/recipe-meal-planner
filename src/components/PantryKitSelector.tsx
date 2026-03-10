import { useState } from 'react'
import { Check, ChevronDown, ChevronUp, Loader2, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { KitWithItems } from '@/hooks/usePantryKits'

interface PantryKitSelectorProps {
  kits: KitWithItems[]
  loading: boolean
  existingNames: Set<string>
  onApply: (kitId: string) => Promise<{ added: number; skipped: number } | null>
}

export function PantryKitSelector({ kits, loading, existingNames, onApply }: PantryKitSelectorProps) {
  const [expandedKit, setExpandedKit] = useState<string | null>(null)
  const [applyingKit, setApplyingKit] = useState<string | null>(null)
  const [appliedKits, setAppliedKits] = useState<Map<string, { added: number; skipped: number }>>(new Map())

  const handleApply = async (kitId: string) => {
    setApplyingKit(kitId)
    const result = await onApply(kitId)
    if (result) {
      setAppliedKits((prev) => new Map(prev).set(kitId, result))
    }
    setApplyingKit(null)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (kits.length === 0) return null

  const normalizedExisting = new Set([...existingNames].map((n) => n.toLowerCase()))

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Package className="size-4 text-muted-foreground" />
        <p className="text-sm font-medium">Starter Kits</p>
        <span className="text-xs text-muted-foreground">Add 20+ items in one click</span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {kits.map((kit) => {
          const applied = appliedKits.get(kit.id)
          const isExpanded = expandedKit === kit.id
          const newCount = kit.items.filter(
            (i) => !normalizedExisting.has(i.ingredient_name.toLowerCase()),
          ).length

          return (
            <div
              key={kit.id}
              className="rounded-lg border p-4 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{kit.name}</p>
                  {kit.description && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                      {kit.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    {kit.items.length} items
                    {newCount < kit.items.length && ` (${newCount} new)`}
                  </p>
                </div>

                {applied ? (
                  <div className="flex items-center gap-1 text-xs text-primary shrink-0">
                    <Check className="size-3.5" />
                    +{applied.added}
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApply(kit.id)}
                    disabled={applyingKit !== null || newCount === 0}
                    className="shrink-0"
                  >
                    {applyingKit === kit.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : newCount === 0 ? (
                      'All added'
                    ) : (
                      `Add ${newCount}`
                    )}
                  </Button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setExpandedKit(isExpanded ? null : kit.id)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                {isExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                {isExpanded ? 'Hide' : 'Preview'} items
              </button>

              {isExpanded && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {kit.items.map((item) => {
                    const alreadyHave = normalizedExisting.has(item.ingredient_name.toLowerCase())
                    return (
                      <span
                        key={item.id}
                        className={`text-xs rounded-full px-2 py-0.5 ${
                          alreadyHave
                            ? 'bg-muted text-muted-foreground line-through'
                            : 'bg-primary/10 text-primary'
                        }`}
                      >
                        {item.ingredient_name}
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
