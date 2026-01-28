import { Link } from 'react-router-dom'
import { Clock, UtensilsCrossed, Check, ShoppingCart } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MissingIngredientBadge } from './MissingIngredientBadge'
import type { RecipeMatchResult } from '@/utils/ingredientMatcher'

interface SuggestionCardProps {
  result: RecipeMatchResult
  onAddMissing?: (result: RecipeMatchResult) => void
  variant?: 'can-make' | 'almost-ready'
}

export function SuggestionCard({
  result,
  onAddMissing,
  variant = 'can-make',
}: SuggestionCardProps) {
  const { recipe, missingIngredients, matchedCount, totalIngredients } = result
  const totalTime =
    recipe.prep_time || recipe.cook_time
      ? (recipe.prep_time ?? 0) + (recipe.cook_time ?? 0)
      : null

  const isCanMake = variant === 'can-make'

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <Link to={`/recipes/${recipe.id}`}>
        <div className="aspect-[16/9] relative bg-muted">
          {recipe.image_url ? (
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <UtensilsCrossed className="size-8 text-muted-foreground/40" />
            </div>
          )}
          {isCanMake && (
            <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
              <Check className="size-3" />
              Ready
            </div>
          )}
        </div>
      </Link>

      <CardContent className="p-3">
        <Link to={`/recipes/${recipe.id}`}>
          <h4 className="font-medium text-sm line-clamp-1 mb-1 hover:underline">
            {recipe.title}
          </h4>
        </Link>

        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
          {totalTime && (
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {totalTime}m
            </span>
          )}
          <span className="flex items-center gap-1">
            <Check className="size-3" />
            {matchedCount}/{totalIngredients}
          </span>
        </div>

        {!isCanMake && missingIngredients.length > 0 && (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1">
              {missingIngredients.slice(0, 3).map((ing) => (
                <MissingIngredientBadge key={ing.name} name={ing.name} />
              ))}
              {missingIngredients.length > 3 && (
                <span className="text-xs text-muted-foreground">
                  +{missingIngredients.length - 3} more
                </span>
              )}
            </div>
            {onAddMissing && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs h-7"
                onClick={(e) => {
                  e.preventDefault()
                  onAddMissing(result)
                }}
              >
                <ShoppingCart className="size-3 mr-1" />
                Add {missingIngredients.length} to list
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
