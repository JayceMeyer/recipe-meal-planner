import { useState, useEffect } from 'react'
import {
  Loader2,
  Clock,
  UtensilsCrossed,
  BookmarkPlus,
  Check,
  Sparkles,
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
  const { preferences } = useUserPreferences()
  const { items: pantryItems } = usePantryItems()
  const { results, loading, error, search, getDetail } = useRecipeDiscovery()

  const [savingIds, setSavingIds] = useState<Set<number>>(new Set())
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set())
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    if (searched) return

    const cuisine = preferences?.cuisine_preferences?.[0] || ''
    const ingredients = pantryItems.slice(0, 5).map((i) => i.ingredient_name).join(',')

    if (ingredients) {
      setSearched(true)
      search({
        query: '',
        cuisine,
        ingredients,
        number: 9,
      })
    } else if (cuisine) {
      setSearched(true)
      search({ query: '', cuisine, number: 9 })
    } else {
      setSearched(true)
      search({ query: 'popular easy', number: 9 })
    }
  }, [preferences, pantryItems, search, searched])

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

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      )}

      {!loading && results.length > 0 && (
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

      {!loading && results.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <p>No suggestions available right now. You can discover recipes later!</p>
        </div>
      )}
    </div>
  )
}
