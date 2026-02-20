import { Link } from 'react-router-dom'
import { Clock, Sparkles, Star, UtensilsCrossed } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { GroupBadge } from '@/components/GroupBadge'
import type { Recipe, RecipeGroup } from '@/types/database'

interface RecipeCardProps {
  recipe: Recipe
  groups?: RecipeGroup[]
}

export function RecipeCard({ recipe, groups = [] }: RecipeCardProps) {
  const totalTime = recipe.prep_time || recipe.cook_time
    ? (recipe.prep_time ?? 0) + (recipe.cook_time ?? 0)
    : null

  return (
    <Link to={`/recipes/${recipe.id}`}>
      <Card className="overflow-hidden hover:shadow-md transition-shadow h-full">
        <div className="aspect-video relative bg-muted">
          {recipe.image_url ? (
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <UtensilsCrossed className="size-12 text-muted-foreground/40" />
            </div>
          )}
        </div>
        <CardContent className="p-4">
          <div className="flex items-start gap-2 mb-2">
            <h3 className="font-medium line-clamp-2 flex-1">{recipe.title}</h3>
            {recipe.source === 'ai' && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 shrink-0">
                <Sparkles className="size-3" />
                AI
              </span>
            )}
          </div>
          {groups.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {groups.map((group) => (
                <GroupBadge key={group.id} name={group.name} />
              ))}
            </div>
          )}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {totalTime && (
              <div className="flex items-center gap-1">
                <Clock className="size-4" />
                <span>{totalTime} min</span>
              </div>
            )}
            {recipe.rating && (
              <div className="flex items-center gap-1">
                <Star className="size-4 fill-yellow-400 text-yellow-400" />
                <span>{recipe.rating}</span>
              </div>
            )}
            {recipe.servings && (
              <div className="flex items-center gap-1">
                <UtensilsCrossed className="size-4" />
                <span>{recipe.servings}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
