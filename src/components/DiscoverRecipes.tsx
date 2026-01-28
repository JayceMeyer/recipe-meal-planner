import { ExternalLink, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface DiscoverRecipesProps {
  ingredientCount?: number
}

export function DiscoverRecipes({ ingredientCount = 0 }: DiscoverRecipesProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Sparkles className="size-4" />
          Discover Recipes
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Discover New Recipes</DialogTitle>
          <DialogDescription>
            Find recipes from around the web based on your grocery list ingredients.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm font-medium mb-2">Coming Soon</p>
            <p className="text-sm text-muted-foreground">
              This feature will search for recipes using the Spoonacular API based on
              {ingredientCount > 0
                ? ` your ${ingredientCount} grocery list ingredients`
                : ' your grocery list ingredients'}
              .
            </p>
          </div>

          <div className="space-y-3 text-sm">
            <p className="font-medium">Planned features:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li>Search recipes by your available ingredients</li>
              <li>Filter by dietary restrictions</li>
              <li>View nutritional information</li>
              <li>Import recipes to your collection</li>
              <li>See cooking time and difficulty</li>
            </ul>
          </div>

          <div className="pt-2 border-t">
            <a
              href="https://spoonacular.com/food-api"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Learn about Spoonacular API
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
