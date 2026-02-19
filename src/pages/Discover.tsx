import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Search,
  Loader2,
  Clock,
  UtensilsCrossed,
  Sparkles,
  BookmarkPlus,
  Check,
  X,
  ChefHat,
} from 'lucide-react'
import { useRecipeDiscovery } from '@/hooks/useRecipeDiscovery'
import { usePantryItems } from '@/hooks/usePantryItems'
import { useAuth } from '@/contexts/AuthContext'
import { useHousehold } from '@/contexts/HouseholdContext'
import { mapSpoonacularToRecipe, CUISINES, DIETS } from '@/utils/spoonacularMapper'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { DiscoverResult } from '@/types/spoonacular'

type DiscoverMode = 'pantry' | 'search'

export function Discover() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { household } = useHousehold()
  const {
    results,
    totalResults,
    loading,
    error,
    search,
    searchByIngredients,
    loadMore,
    getDetail,
    reset,
  } = useRecipeDiscovery()

  const { items: pantryItems, loading: pantryLoading } = usePantryItems()

  const hasPantryItems = pantryItems.length > 0
  const [mode, setMode] = useState<DiscoverMode>('pantry')
  const [query, setQuery] = useState('')
  const [selectedCuisine, setSelectedCuisine] = useState('')
  const [selectedDiet, setSelectedDiet] = useState('')
  const [savingIds, setSavingIds] = useState<Set<number>>(new Set())
  const [savedIds, setSavedIds] = useState<Set<number>>(new Set())
  const [saveError, setSaveError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  const handleSearch = async (e: FormEvent) => {
    e.preventDefault()
    setSaveError(null)

    if (mode === 'pantry') {
      if (!hasPantryItems) return
      setHasSearched(true)
      const ingredients = pantryItems.map((i) => i.ingredient_name).join(',')
      await searchByIngredients(ingredients)
    } else {
      if (!query.trim() && !selectedCuisine && !selectedDiet) return
      setHasSearched(true)
      await search({
        query: query.trim(),
        cuisine: selectedCuisine,
        diet: selectedDiet,
      })
    }
  }

  const handleCuisineToggle = (cuisine: string) => {
    setSelectedCuisine((prev) => (prev === cuisine ? '' : cuisine))
  }

  const handleDietToggle = (diet: string) => {
    setSelectedDiet((prev) => (prev === diet ? '' : diet))
  }

  const handleClearFilters = () => {
    setSelectedCuisine('')
    setSelectedDiet('')
    setQuery('')
    setHasSearched(false)
    reset()
  }

  const handleModeSwitch = (newMode: DiscoverMode) => {
    if (newMode === mode) return
    setMode(newMode)
    setHasSearched(false)
    reset()
  }

  const PANTRY_CHIP_LIMIT = 15

  const handleSave = async (result: DiscoverResult) => {
    if (!user || !household || savingIds.has(result.id)) return

    setSavingIds((prev) => new Set(prev).add(result.id))
    setSaveError(null)

    try {
      const detail = await getDetail(result.id)
      if (!detail) {
        setSaveError('Failed to fetch recipe details')
        return
      }

      const recipeData = mapSpoonacularToRecipe(detail, user.id, household.id)
      const { data, error: insertError } = await supabase
        .from('recipes')
        .insert(recipeData)
        .select('id')
        .single()

      if (insertError) {
        setSaveError(insertError.message)
        return
      }

      setSavedIds((prev) => new Set(prev).add(result.id))

      setTimeout(() => navigate(`/recipes/${data.id}`), 600)
    } catch (err) {
      setSaveError((err as Error).message)
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev)
        next.delete(result.id)
        return next
      })
    }
  }

  const hasMore = results.length < totalResults

  return (
    <div className="container py-6">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="size-6 text-primary" />
        <h1 className="text-2xl font-bold">Discover Recipes</h1>
      </div>

      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => handleModeSwitch('pantry')}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors',
            mode === 'pantry'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80',
          )}
        >
          <ChefHat className="size-4" />
          Use My Pantry
        </button>
        <button
          type="button"
          onClick={() => handleModeSwitch('search')}
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors',
            mode === 'search'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80',
          )}
        >
          <Search className="size-4" />
          Search All
        </button>
      </div>

      <form onSubmit={handleSearch} className="space-y-4 mb-6">
        {mode === 'pantry' ? (
          <div className="space-y-3">
            {pantryLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Loading pantry items...
              </div>
            ) : !hasPantryItems ? (
              <div className="p-4 rounded-md bg-muted text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Add items to your pantry first to find matching recipes.
                </p>
                <Link to="/pantry" className="text-sm font-medium text-primary hover:underline">
                  Go to Pantry
                </Link>
              </div>
            ) : (
              <>
                <div className="flex flex-wrap gap-1.5">
                  {pantryItems.slice(0, PANTRY_CHIP_LIMIT).map((item) => (
                    <span
                      key={item.id}
                      className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground"
                    >
                      {item.ingredient_name}
                    </span>
                  ))}
                  {pantryItems.length > PANTRY_CHIP_LIMIT && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                      +{pantryItems.length - PANTRY_CHIP_LIMIT} more
                    </span>
                  )}
                </div>
                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                  {loading ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="size-4" />
                      Find recipes with my ingredients
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search for recipes..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : 'Search'}
              </Button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-2">Cuisine</p>
                <div className="flex flex-wrap gap-2">
                  {CUISINES.map((cuisine) => (
                    <button
                      key={cuisine}
                      type="button"
                      onClick={() => handleCuisineToggle(cuisine)}
                      className={cn(
                        'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                        selectedCuisine === cuisine
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80',
                      )}
                    >
                      {cuisine}
                      {selectedCuisine === cuisine && <X className="size-3" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Diet</p>
                <div className="flex flex-wrap gap-2">
                  {DIETS.map((diet) => (
                    <button
                      key={diet}
                      type="button"
                      onClick={() => handleDietToggle(diet)}
                      className={cn(
                        'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                        selectedDiet === diet
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80',
                      )}
                    >
                      {diet}
                      {selectedDiet === diet && <X className="size-3" />}
                    </button>
                  ))}
                </div>
              </div>

              {(selectedCuisine || selectedDiet) && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </>
        )}
      </form>

      {error && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md mb-6">
          {error}
        </div>
      )}

      {saveError && (
        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md mb-6">
          {saveError}
        </div>
      )}

      {!hasSearched && !loading && mode === 'search' && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Sparkles className="size-16 text-muted-foreground/40 mb-4" />
          <h2 className="text-xl font-medium mb-2">Find new recipes</h2>
          <p className="text-muted-foreground max-w-md">
            Search by name, filter by cuisine or diet, and save recipes you love to your collection.
          </p>
        </div>
      )}

      {!hasSearched && !loading && mode === 'pantry' && hasPantryItems && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ChefHat className="size-16 text-muted-foreground/40 mb-4" />
          <h2 className="text-xl font-medium mb-2">What can you make?</h2>
          <p className="text-muted-foreground max-w-md">
            Search using your {pantryItems.length} pantry item{pantryItems.length !== 1 ? 's' : ''} to find recipes you can cook right now.
          </p>
        </div>
      )}

      {hasSearched && !loading && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="size-16 text-muted-foreground/40 mb-4" />
          <h2 className="text-xl font-medium mb-2">No recipes found</h2>
          <p className="text-muted-foreground">
            Try different search terms or filters
          </p>
        </div>
      )}

      {results.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground mb-4">
            {totalResults} recipe{totalResults !== 1 ? 's' : ''} found
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {results.map((result) => (
              <DiscoverCard
                key={result.id}
                result={result}
                saving={savingIds.has(result.id)}
                saved={savedIds.has(result.id)}
                onSave={() => handleSave(result)}
              />
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-8">
              <Button variant="outline" onClick={loadMore} disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </>
      )}

      {loading && results.length === 0 && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  )
}

function DiscoverCard({
  result,
  saving,
  saved,
  onSave,
}: {
  result: DiscoverResult
  saving: boolean
  saved: boolean
  onSave: () => void
}) {
  return (
    <Card className="overflow-hidden">
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
        <h3 className="font-medium line-clamp-2">{result.title}</h3>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          {result.readyInMinutes != null && result.readyInMinutes > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" />
              {result.readyInMinutes} min
            </span>
          )}
          {result.servings != null && result.servings > 0 && (
            <span className="flex items-center gap-1">
              <UtensilsCrossed className="size-3.5" />
              {result.servings} servings
            </span>
          )}
          {result.usedIngredientCount != null && (
            <span className="text-green-600">
              {result.usedIngredientCount} matched
            </span>
          )}
          {result.missedIngredientCount != null && (
            <span className="text-orange-500">
              {result.missedIngredientCount} missing
            </span>
          )}
        </div>

        <Button
          size="sm"
          variant={saved ? 'outline' : 'default'}
          className="w-full"
          onClick={onSave}
          disabled={saving || saved}
        >
          {saved ? (
            <>
              <Check className="size-4" />
              Saved
            </>
          ) : saving ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <BookmarkPlus className="size-4" />
              Save to My Recipes
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
