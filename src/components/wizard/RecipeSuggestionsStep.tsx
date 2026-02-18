import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Loader2,
  Clock,
  UtensilsCrossed,
  BookmarkPlus,
  Check,
  Sparkles,
  RefreshCw,
} from 'lucide-react'
import { useRecipeDiscovery } from '@/hooks/useRecipeDiscovery'
import { useUserPreferences } from '@/hooks/useUserPreferences'
import { usePantryItems } from '@/hooks/usePantryItems'
import { useAuth } from '@/contexts/AuthContext'
import { useHousehold } from '@/contexts/HouseholdContext'
import { mapSpoonacularToRecipe } from '@/utils/spoonacularMapper'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { DiscoverResult } from '@/types/spoonacular'

export function RecipeSuggestionsStep() {
  const { user } = useAuth()
  const { household } = useHousehold()
  const { preferences, loading: prefsLoading } = useUserPreferences()
  const { items: pantryItems, loading: pantryLoading } = usePantryItems()
  const { results, loading, error, search, getDetail } = useRecipeDiscovery()

  const [savingIds, setSavingIds] = useState<Set<number>>(new Set())
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set())
  const hasSearched = useRef(false)

  const doSearch = useCallback(() => {
    const cuisinePrefs = preferences?.cuisine_preferences ?? []
    const cuisine = cuisinePrefs[0] || ''
    const ingredients = pantryItems.slice(0, 5).map((i) => i.ingredient_name).join(',')

    if (ingredients) {
      search({ query: '', cuisine, ingredients, number: 9 })
    } else if (cuisine) {
      search({ query: cuisine, number: 9 })
    } else {
      search({ query: 'easy dinner', number: 9 })
    }
  }, [preferences, pantryItems, search])

  useEffect(() => {
    if (hasSearched.current) return
    if (prefsLoading || pantryLoading) return

    hasSearched.current = true
    doSearch()
  }, [prefsLoading, pantryLoading, doSearch])

  const handleRetry = () => {
    doSearch()
  }

  const handleSave = async (result: DiscoverResult) => {
    if (!user || !household || savingIds.has(result.id)) return

    setSavingIds((prev) => new Set(prev).add(result.id))

    try {
      const detail = await getDetail(result.id)
      if (!detail) return

      const recipeData = mapSpoonacularToRecipe(detail, user.id, household.id)
      await supabase.from('recipes').insert(recipeData)
      setSavedIds((prev) => new Set(prev).add(result.id))
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev)
        next.delete(result.id)
        return next
      })
    }
  }

  const dataLoading = prefsLoading || pantryLoading

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Sparkles className="mx-auto size-10 text-primary mb-2" />
        <h2 className="text-xl font-semibold">Recipes for you</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Based on your pantry and preferences. Save any that look good!
        </p>
        {savedIds.size > 0 && (
          <p className="text-sm text-primary font-medium mt-2">
            {savedIds.size} recipe{savedIds.size !== 1 ? 's' : ''} saved
          </p>
        )}
      </div>

      {(loading || dataLoading) && (
        <div className="flex flex-col items-center justify-center py-12 gap-2">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {dataLoading ? 'Loading your preferences...' : 'Finding recipes...'}
          </p>
        </div>
      )}

      {error && (
        <div className="text-center space-y-3">
          <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md">
            {error}
          </div>
          <Button variant="outline" size="sm" onClick={handleRetry}>
            <RefreshCw className="size-4 mr-1" />
            Try again
          </Button>
        </div>
      )}

      {!loading && !dataLoading && results.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((result) => (
            <Card key={result.id} className="overflow-hidden">
              <div className="aspect-video relative bg-muted">
                {result.image ? (
                  <img
                    src={result.image}
                    alt={result.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <UtensilsCrossed className="size-12 text-muted-foreground/40" />
                  </div>
                )}
              </div>
              <CardContent className="p-4 space-y-3">
                <h3 className="font-medium line-clamp-2 text-sm">{result.title}</h3>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {result.readyInMinutes != null && result.readyInMinutes > 0 && (
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {result.readyInMinutes} min
                    </span>
                  )}
                  {result.servings != null && result.servings > 0 && (
                    <span className="flex items-center gap-1">
                      <UtensilsCrossed className="size-3" />
                      {result.servings}
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  variant={savedIds.has(result.id) ? 'outline' : 'default'}
                  className="w-full"
                  onClick={() => handleSave(result)}
                  disabled={savingIds.has(result.id) || savedIds.has(result.id)}
                >
                  {savedIds.has(result.id) ? (
                    <><Check className="size-4" /> Saved</>
                  ) : savingIds.has(result.id) ? (
                    <><Loader2 className="size-4 animate-spin" /> Saving...</>
                  ) : (
                    <><BookmarkPlus className="size-4" /> Save</>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && !dataLoading && !error && results.length === 0 && hasSearched.current && (
        <div className="text-center py-8 space-y-3">
          <p className="text-muted-foreground">
            No suggestions found. Try different preferences or discover recipes later!
          </p>
          <Button variant="outline" size="sm" onClick={handleRetry}>
            <RefreshCw className="size-4 mr-1" />
            Try again
          </Button>
        </div>
      )}
    </div>
  )
}
