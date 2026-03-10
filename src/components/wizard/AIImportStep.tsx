import { useState, useMemo } from 'react'
import { FileText, Camera, Wand2 } from 'lucide-react'
import { usePantryItems } from '@/hooks/usePantryItems'
import { PantryTextImportModal } from '@/components/PantryTextImportModal'
import { PantryScanModal } from '@/components/PantryScanModal'


interface AIImportStepProps {
  onSkip: () => void
}

export function AIImportStep({ onSkip }: AIImportStepProps) {
  const { items, addItems } = usePantryItems()
  const [showTextImport, setShowTextImport] = useState(false)
  const [showScanImport, setShowScanImport] = useState(false)

  const existingNames = useMemo(
    () => new Set(items.map((i) => i.ingredient_name.toLowerCase())),
    [items],
  )

  const handleImport = async (importItems: { ingredient_name: string; quantity?: string; unit?: string }[]) => {
    await addItems(importItems.map((item) => ({
      ingredient_name: item.ingredient_name,
      quantity: item.quantity,
      unit: item.unit,
    })))
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Wand2 className="mx-auto size-10 text-primary mb-2" />
        <h2 className="text-xl font-semibold">Import with AI</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Quickly import items from text or photos
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => setShowTextImport(true)}
          className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-6 hover:border-primary/50 hover:bg-accent/50 transition-colors"
        >
          <FileText className="size-10 text-muted-foreground" />
          <div className="text-center">
            <p className="font-medium">Paste a List</p>
            <p className="text-sm text-muted-foreground mt-1">
              Paste a grocery list, recipe ingredients, or any text with food items
            </p>
          </div>
        </button>

        <button
          onClick={() => setShowScanImport(true)}
          className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-6 hover:border-primary/50 hover:bg-accent/50 transition-colors"
        >
          <Camera className="size-10 text-muted-foreground" />
          <div className="text-center">
            <p className="font-medium">Scan a Photo</p>
            <p className="text-sm text-muted-foreground mt-1">
              Take a photo of a receipt or your pantry shelf
            </p>
          </div>
        </button>
      </div>

      {items.length > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? 'item' : 'items'} in your pantry
        </p>
      )}

      <button
        onClick={onSkip}
        className="block mx-auto text-sm text-muted-foreground hover:text-foreground"
      >
        Skip this step
      </button>

      <PantryTextImportModal
        open={showTextImport}
        onOpenChange={setShowTextImport}
        existingNames={existingNames}
        onImport={handleImport}
      />

      <PantryScanModal
        open={showScanImport}
        onOpenChange={setShowScanImport}
        existingNames={existingNames}
        onImport={handleImport}
      />
    </div>
  )
}
