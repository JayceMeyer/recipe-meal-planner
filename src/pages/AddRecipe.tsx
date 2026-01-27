import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useScrapeRecipe } from '@/hooks/useScrapeRecipe'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import type { Ingredient, Step, RecipeInsert } from '@/types/database'

function parseServings(yields: string | null): number | null {
  if (!yields) return null
  const match = yields.match(/\d+/)
  return match ? parseInt(match[0], 10) : null
}

function parseIngredients(ingredients: string[]): Ingredient[] {
  return ingredients.map((ing) => ({
    name: ing,
    amount: '',
  }))
}

function parseSteps(instructions: string[]): Step[] {
  return instructions.map((instruction, index) => ({
    order: index + 1,
    instruction,
  }))
}

export function AddRecipe() {
  const [url, setUrl] = useState('')
  const [titleOverride, setTitleOverride] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const { user } = useAuth()
  const { scrape, recipe, loading, error, reset } = useScrapeRecipe()
  const navigate = useNavigate()

  const effectiveTitle = titleOverride ?? recipe?.title ?? ''

  const handleScrape = async (e: FormEvent) => {
    e.preventDefault()
    setSaveError(null)
    await scrape(url)
  }

  const handleSave = async () => {
    if (!recipe || !user) return

    setSaving(true)
    setSaveError(null)

    const recipeData: RecipeInsert = {
      user_id: user.id,
      title: effectiveTitle || recipe.title,
      image_url: recipe.image,
      source_url: url,
      servings: parseServings(recipe.yields),
      cook_time: recipe.total_time,
      ingredients: parseIngredients(recipe.ingredients),
      steps: parseSteps(recipe.instructions),
    }

    const { error: insertError } = await supabase
      .from('recipes')
      .insert(recipeData)

    if (insertError) {
      setSaveError(insertError.message)
      setSaving(false)
    } else {
      navigate('/recipes')
    }
  }

  const handleReset = () => {
    setUrl('')
    setTitleOverride(null)
    setSaveError(null)
    reset()
  }

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Add Recipe from URL</CardTitle>
          <CardDescription>
            Paste a recipe URL and we'll import it for you
          </CardDescription>
        </CardHeader>

        {!recipe ? (
          <form onSubmit={handleScrape}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label htmlFor="url" className="text-sm font-medium">
                  Recipe URL
                </label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com/recipe"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={loading || !url}>
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Importing...
                  </>
                ) : (
                  'Import Recipe'
                )}
              </Button>
            </CardFooter>
          </form>
        ) : (
          <>
            <CardContent className="space-y-6">
              {saveError && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {saveError}
                </div>
              )}

              {recipe.image && (
                <img
                  src={recipe.image}
                  alt={recipe.title}
                  className="w-full h-48 object-cover rounded-md"
                />
              )}

              <div className="space-y-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Title
                </label>
                <Input
                  id="title"
                  value={effectiveTitle}
                  onChange={(e) => setTitleOverride(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                {recipe.yields && (
                  <div>
                    <span className="font-medium">Servings:</span> {recipe.yields}
                  </div>
                )}
                {recipe.total_time && (
                  <div>
                    <span className="font-medium">Time:</span> {recipe.total_time} min
                  </div>
                )}
                <div>
                  <span className="font-medium">Source:</span> {recipe.host}
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2">Ingredients ({recipe.ingredients.length})</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {recipe.ingredients.slice(0, 5).map((ing, i) => (
                    <li key={i}>{ing}</li>
                  ))}
                  {recipe.ingredients.length > 5 && (
                    <li className="text-muted-foreground/60">
                      ...and {recipe.ingredients.length - 5} more
                    </li>
                  )}
                </ul>
              </div>

              <div>
                <h3 className="font-medium mb-2">Instructions ({recipe.instructions.length} steps)</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  {recipe.instructions.slice(0, 3).map((step, i) => (
                    <li key={i} className="truncate">{step}</li>
                  ))}
                  {recipe.instructions.length > 3 && (
                    <li className="text-muted-foreground/60">
                      ...and {recipe.instructions.length - 3} more steps
                    </li>
                  )}
                </ol>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Recipe'
                )}
              </Button>
              <Button variant="outline" onClick={handleReset} disabled={saving}>
                Try Another
              </Button>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  )
}
