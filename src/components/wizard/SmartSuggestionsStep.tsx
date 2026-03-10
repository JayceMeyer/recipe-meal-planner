import { useMemo } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { usePantryItems } from '@/hooks/usePantryItems'
import { useCuisineSuggestions } from '@/hooks/useCuisineSuggestions'
import { SmartSuggestions } from '@/components/SmartSuggestions'

interface SmartSuggestionsStepProps {
  onSkip: () => void
}

export function SmartSuggestionsStep({ onSkip }: SmartSuggestionsStepProps) {
  const { items, addItems } = usePantryItems()
  const { suggestions, loading } = useCuisineSuggestions()

  const existingNames = useMemo(
    () => new Set(items.map((i) => i.ingredient_name.toLowerCase())),
    [items],
  )

  const handleBulkAdd = async (names: string[]) => {
    await addItems(names.map((name) => ({ ingredient_name: name })))
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">Loading suggestions based on your preferences...</p>
      </div>
    )
  }

  if (suggestions.length === 0) {
    return (
      <div className="space-y-6 text-center">
        <div>
          <Sparkles className="mx-auto size-10 text-primary mb-2" />
          <h2 className="text-xl font-semibold">Smart Suggestions</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Select some cuisine preferences first to get personalized suggestions.
          </p>
        </div>
        <button
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Skip this step
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Sparkles className="mx-auto size-10 text-primary mb-2" />
        <h2 className="text-xl font-semibold">Suggested for you</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Based on your cuisine preferences, here are ingredients you might have
        </p>
      </div>

      <SmartSuggestions
        suggestions={suggestions}
        loading={loading}
        existingNames={existingNames}
        onAdd={handleBulkAdd}
      />

      {items.length > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          {items.length} {items.length === 1 ? 'item' : 'items'} in your pantry
        </p>
      )}
    </div>
  )
}
