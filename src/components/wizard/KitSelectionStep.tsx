import { useMemo } from 'react'
import { Package } from 'lucide-react'
import { usePantryItems } from '@/hooks/usePantryItems'
import { usePantryKits } from '@/hooks/usePantryKits'
import { PantryKitSelector } from '@/components/PantryKitSelector'

interface KitSelectionStepProps {
  onSkip: () => void
}

export function KitSelectionStep({ onSkip }: KitSelectionStepProps) {
  const { items, refresh } = usePantryItems()
  const { kits, loading: kitsLoading, applyKit } = usePantryKits()

  const existingNames = useMemo(
    () => new Set(items.map((i) => i.ingredient_name.toLowerCase())),
    [items],
  )

  const handleApplyKit = async (kitId: string) => {
    const result = await applyKit(kitId, existingNames)
    if (result && result.added > 0) {
      await refresh()
    }
    return result
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Package className="mx-auto size-10 text-primary mb-2" />
        <h2 className="text-xl font-semibold">Start with a kit</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Pick a starter kit to quickly add common ingredients
        </p>
      </div>

      <PantryKitSelector
        kits={kits}
        loading={kitsLoading}
        existingNames={existingNames}
        onApply={handleApplyKit}
      />

      {items.length > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? 'item' : 'items'} in your pantry
        </p>
      )}

      {items.length === 0 && (
        <button
          onClick={onSkip}
          className="block mx-auto text-sm text-muted-foreground hover:text-foreground"
        >
          Skip for now
        </button>
      )}
    </div>
  )
}
