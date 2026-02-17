import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Loader2, UtensilsCrossed, Filter, X } from 'lucide-react'
import { useRecipes } from '@/hooks/useRecipes'
import { useGroups, useAllRecipeGroups } from '@/hooks/useGroups'
import { RecipeCard } from '@/components/RecipeCard'
import { ManageGroupsButton } from '@/components/ManageGroupsDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export function Recipes() {
  const [search, setSearch] = useState('')
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const { recipes, loading, error, refresh } = useRecipes()
  const { groups } = useGroups()
  const { recipeGroupMap } = useAllRecipeGroups()

  const filteredRecipes = useMemo(() => {
    let result = recipes

    // Filter by group if selected
    if (selectedGroupId) {
      result = result.filter((recipe) => {
        const recipeGroups = recipeGroupMap.get(recipe.id) ?? []
        return recipeGroups.includes(selectedGroupId)
      })
    }

    // Filter by search
    if (search.trim()) {
      const query = search.toLowerCase()
      result = result.filter((recipe) =>
        recipe.title.toLowerCase().includes(query)
      )
    }

    return result
  }, [recipes, search, selectedGroupId, recipeGroupMap])

  const getRecipeGroups = (recipeId: string) => {
    const groupIds = recipeGroupMap.get(recipeId) ?? []
    return groups.filter((g) => groupIds.includes(g.id))
  }

  const handleRefresh = async () => {
    await refresh()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container py-8">
        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md">
          {error}
        </div>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">My Recipes</h1>
        <Button asChild>
          <Link to="/recipes/add">
            <Plus className="size-4" />
            Add Recipe
          </Link>
        </Button>
      </div>

      {recipes.length > 0 && (
        <div className="space-y-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search recipes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          {groups.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="size-4 text-muted-foreground" />
              <ManageGroupsButton />
              <button
                type="button"
                onClick={() => setSelectedGroupId(null)}
                className={cn(
                  'inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                  selectedGroupId === null
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                All
              </button>
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setSelectedGroupId(group.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                    selectedGroupId === group.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {group.name}
                  {selectedGroupId === group.id && (
                    <X
                      className="size-3"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedGroupId(null)
                      }}
                    />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {recipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <UtensilsCrossed className="size-16 text-muted-foreground/40 mb-4" />
          <h2 className="text-xl font-medium mb-2">No recipes yet</h2>
          <p className="text-muted-foreground mb-6">
            Start by adding your first recipe from a URL
          </p>
          <Button asChild>
            <Link to="/recipes/add">
              <Plus className="size-4" />
              Add Your First Recipe
            </Link>
          </Button>
        </div>
      ) : filteredRecipes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="size-16 text-muted-foreground/40 mb-4" />
          <h2 className="text-xl font-medium mb-2">No recipes found</h2>
          <p className="text-muted-foreground">
            Try a different search term
          </p>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          onTouchEnd={handleRefresh}
        >
          {filteredRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} groups={getRecipeGroups(recipe.id)} />
          ))}
        </div>
      )}
    </div>
  )
}
