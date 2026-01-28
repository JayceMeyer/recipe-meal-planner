import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, Sparkles } from 'lucide-react'
import { SuggestionCard } from './SuggestionCard'
import type { RecipeMatchResult } from '@/utils/ingredientMatcher'

const STORAGE_KEY = 'recipe-suggestions-visible'

interface RecipeSuggestionsProps {
  canMake: RecipeMatchResult[]
  almostReady: RecipeMatchResult[]
  onAddMissing?: (result: RecipeMatchResult) => void
  loading?: boolean
}

export function RecipeSuggestions({
  canMake,
  almostReady,
  onAddMissing,
  loading = false,
}: RecipeSuggestionsProps) {
  const [isVisible, setIsVisible] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === null ? true : stored === 'true'
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(isVisible))
  }, [isVisible])

  const hasAnySuggestions = canMake.length > 0 || almostReady.length > 0

  if (loading) {
    return (
      <div className="py-4">
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-40 bg-muted rounded" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-32 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (!hasAnySuggestions) {
    return null
  }

  return (
    <div className="py-4">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="flex items-center gap-2 w-full text-left py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        {isVisible ? (
          <ChevronDown className="size-4" />
        ) : (
          <ChevronRight className="size-4" />
        )}
        <Sparkles className="size-4" />
        Recipe Suggestions
        <span className="text-xs">
          ({canMake.length + almostReady.length})
        </span>
      </button>

      {isVisible && (
        <div className="space-y-4 mt-2">
          {canMake.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-green-600 dark:text-green-400 mb-2">
                You can make ({canMake.length})
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {canMake.slice(0, 4).map((result) => (
                  <SuggestionCard
                    key={result.recipe.id}
                    result={result}
                    variant="can-make"
                  />
                ))}
              </div>
            </div>
          )}

          {almostReady.length > 0 && (
            <div>
              <h4 className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-2">
                Almost ready ({almostReady.length})
              </h4>
              <div className="grid grid-cols-2 gap-3">
                {almostReady.slice(0, 4).map((result) => (
                  <SuggestionCard
                    key={result.recipe.id}
                    result={result}
                    variant="almost-ready"
                    onAddMissing={onAddMissing}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
