import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Loader2, UtensilsCrossed, Sparkles, ChevronDown, ChevronRight } from 'lucide-react'
import { useRecipes } from '@/hooks/useRecipes'
import { useGroups, useAllRecipeGroups } from '@/hooks/useGroups'
import { RecipeCard } from '@/components/RecipeCard'
import { ManageGroupsButton } from '@/components/ManageGroupsDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Recipe, RecipeGroup } from '@/types/database'

interface RecipeSection {
  id: string
  name: string
  recipes: Recipe[]
}

export function Recipes() {
  const [search, setSearch] = useState('')
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const { recipes, loading, error } = useRecipes()
  const { groups } = useGroups()
  const { recipeGroupMap } = useAllRecipeGroups()

  const sections = useMemo(() => {
    const query = search.trim().toLowerCase()
    const filtered = query
      ? recipes.filter((r) => r.title.toLowerCase().includes(query))
      : recipes

    if (groups.length === 0) return [{ id: '__all', name: 'All Recipes', recipes: filtered }]

    const groupedRecipeIds = new Set<string>()
    const result: RecipeSection[] = []

    const ungrouped: Recipe[] = []
    for (const recipe of filtered) {
      const recipeGroups = recipeGroupMap.get(recipe.id) ?? []
      if (recipeGroups.length === 0) {
        ungrouped.push(recipe)
      }
    }
    if (ungrouped.length > 0) {
      result.push({ id: '__ungrouped', name: 'Ungrouped', recipes: ungrouped })
    }

    for (const group of groups) {
      const groupRecipes = filtered.filter((recipe) => {
        const recipeGroups = recipeGroupMap.get(recipe.id) ?? []
        if (recipeGroups.includes(group.id)) {
          groupedRecipeIds.add(recipe.id)
          return true
        }
        return false
      })
      if (groupRecipes.length > 0) {
        result.push({ id: group.id, name: group.name, recipes: groupRecipes })
      }
    }

    return result
  }, [recipes, search, groups, recipeGroupMap])

  const getRecipeGroups = (recipeId: string): RecipeGroup[] => {
    const groupIds = recipeGroupMap.get(recipeId) ?? []
    return groups.filter((g) => groupIds.includes(g.id))
  }

  const toggleSection = (id: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const totalFiltered = sections.reduce((sum, s) => sum + s.recipes.length, 0)

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
        <div className="flex items-center gap-2">
          <ManageGroupsButton />
          <Button variant="outline" asChild>
            <Link to="/discover">
              <Sparkles className="size-4" />
              Discover
            </Link>
          </Button>
          <Button asChild>
            <Link to="/recipes/add">
              <Plus className="size-4" />
              Add Recipe
            </Link>
          </Button>
        </div>
      </div>

      {recipes.length > 0 && (
        <div className="mb-6">
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
      ) : totalFiltered === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="size-16 text-muted-foreground/40 mb-4" />
          <h2 className="text-xl font-medium mb-2">No recipes found</h2>
          <p className="text-muted-foreground">
            Try a different search term
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {sections.map((section) => {
            const isCollapsed = collapsedSections.has(section.id)
            return (
              <div key={section.id}>
                <button
                  onClick={() => toggleSection(section.id)}
                  className="flex items-center gap-2 w-full text-left py-2 text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  {isCollapsed ? (
                    <ChevronRight className="size-4" />
                  ) : (
                    <ChevronDown className="size-4" />
                  )}
                  {section.name}
                  <span className="text-xs">({section.recipes.length})</span>
                </button>

                {!isCollapsed && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {section.recipes.map((recipe) => (
                      <RecipeCard key={recipe.id} recipe={recipe} groups={getRecipeGroups(recipe.id)} />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
