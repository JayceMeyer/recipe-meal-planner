import { useState, useRef, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Loader2, Upload } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useHousehold } from '@/contexts/HouseholdContext'
import { useScrapeRecipe } from '@/hooks/useScrapeRecipe'
import { useParseRecipeText } from '@/hooks/useParseRecipeText'
import { useCookbooks } from '@/hooks/useCookbooks'
import { useGroups } from '@/hooks/useGroups'
import { supabase } from '@/lib/supabase'
import { resizeImage } from '@/utils/imageResize'
import { GroupSelector } from '@/components/GroupSelector'
import { InsufficientCreditsAlert } from '@/components/InsufficientCreditsAlert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import type { Ingredient, Step, RecipeInsert } from '@/types/database'
import type { ScrapedRecipe } from '@/lib/api'

function parseServings(yields: string | null): number | null {
  if (!yields) return null
  const match = yields.match(/\d+/)
  return match ? parseInt(match[0], 10) : null
}

const KNOWN_UNITS = new Set([
  'cup', 'cups', 'c',
  'tablespoon', 'tablespoons', 'tbsp', 'tbs',
  'teaspoon', 'teaspoons', 'tsp',
  'ounce', 'ounces', 'oz',
  'pound', 'pounds', 'lb', 'lbs',
  'gram', 'grams', 'g',
  'kilogram', 'kilograms', 'kg',
  'milliliter', 'milliliters', 'ml',
  'liter', 'liters', 'l',
  'quart', 'quarts', 'qt',
  'pint', 'pints', 'pt',
  'gallon', 'gallons', 'gal',
  'pinch', 'pinches',
  'dash', 'dashes',
  'clove', 'cloves',
  'can', 'cans',
  'package', 'packages', 'pkg',
  'bunch', 'bunches',
  'slice', 'slices',
  'piece', 'pieces',
  'stick', 'sticks',
  'head', 'heads',
  'sprig', 'sprigs',
  'handful', 'handfuls',
  'bag', 'bags',
  'jar', 'jars',
  'bottle', 'bottles',
])

const AMOUNT_PATTERN = /^(\d+\s+\d+\/\d+|\d+\/\d+|\d+\.?\d*\s*[½⅓⅔¼¾⅛⅜⅝⅞]|\d+\.?\d*|[½⅓⅔¼¾⅛⅜⅝⅞])\s*/

function parseIngredientString(raw: string): Ingredient {
  let remaining = raw.trim()
  let amount = ''
  let unit: string | undefined

  const amountMatch = remaining.match(AMOUNT_PATTERN)
  if (amountMatch) {
    amount = amountMatch[1].trim()
    remaining = remaining.slice(amountMatch[0].length).trim()
  }

  remaining = remaining.replace(/\(\d+[\s.]*(?:ounce|oz|gram|g|ml|liter|l)\)\s*/i, '').trim()

  if (amount) {
    const words = remaining.split(/\s+/)
    const candidate = words[0]?.toLowerCase().replace(/[.,]$/, '')
    if (candidate && KNOWN_UNITS.has(candidate)) {
      unit = words[0].replace(/[.,]$/, '')
      remaining = words.slice(1).join(' ').trim()
    }
  }

  remaining = remaining.replace(/^of\s+/i, '').replace(/^,\s*/, '').trim()

  return {
    name: remaining || raw.trim(),
    amount,
    unit,
  }
}

function parseIngredients(ingredients: string[]): Ingredient[] {
  return ingredients.map(parseIngredientString)
}

function parseSteps(instructions: string[]): Step[] {
  return instructions.map((instruction, index) => ({
    order: index + 1,
    instruction,
  }))
}

type ImportMode = 'url' | 'text' | 'cookbook'

export function AddRecipe() {
  const [mode, setMode] = useState<ImportMode>('url')
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const [titleOverride, setTitleOverride] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])

  const [selectedCookbookId, setSelectedCookbookId] = useState('')
  const [pageNumber, setPageNumber] = useState('')
  const [cookbookRecipe, setCookbookRecipe] = useState<ScrapedRecipe | null>(null)
  const [cookbookUploading, setCookbookUploading] = useState(false)
  const [cookbookScanning, setCookbookScanning] = useState(false)
  const [cookbookError, setCookbookError] = useState<string | null>(null)
  const [cookbookPreview, setCookbookPreview] = useState<string | null>(null)
  const cookbookFileRef = useRef<HTMLInputElement>(null)

  const { user } = useAuth()
  const { household } = useHousehold()
  const { scrape, recipe: scrapeRecipe, loading: scrapeLoading, error: scrapeError, reset: scrapeReset } = useScrapeRecipe()
  const { parse, recipe: parseRecipe, loading: parseLoading, error: parseError, insufficientCredits, reset: parseReset } = useParseRecipeText()
  const { cookbooks } = useCookbooks()
  const { groups, createGroup } = useGroups()
  const navigate = useNavigate()

  const recipe: ScrapedRecipe | null =
    mode === 'url' ? scrapeRecipe :
    mode === 'text' ? parseRecipe :
    cookbookRecipe

  const loading =
    mode === 'url' ? scrapeLoading :
    mode === 'text' ? parseLoading :
    cookbookUploading || cookbookScanning

  const error =
    mode === 'url' ? scrapeError :
    mode === 'text' ? parseError :
    cookbookError

  const effectiveTitle = titleOverride ?? recipe?.title ?? ''

  const handleScrape = async (e: FormEvent) => {
    e.preventDefault()
    setSaveError(null)
    await scrape(url)
  }

  const handleParse = async (e: FormEvent) => {
    e.preventDefault()
    setSaveError(null)
    await parse(text)
  }

  const handleCookbookPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !household) return

    setCookbookError(null)
    setCookbookUploading(true)

    try {
      const previewUrl = URL.createObjectURL(file)
      setCookbookPreview(previewUrl)

      const resized = await resizeImage(file)
      const fileName = `${household.id}/${crypto.randomUUID()}.webp`

      const { error: uploadError } = await supabase.storage
        .from('pantry-scans')
        .upload(fileName, resized, { contentType: 'image/webp' })

      if (uploadError) {
        setCookbookError(uploadError.message)
        setCookbookUploading(false)
        return
      }

      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('pantry-scans')
        .createSignedUrl(fileName, 300)

      if (signedUrlError || !signedUrlData?.signedUrl) {
        setCookbookError(signedUrlError?.message || 'Failed to create signed URL')
        setCookbookUploading(false)
        return
      }

      setCookbookUploading(false)
      setCookbookScanning(true)

      const { data, error: invokeError } = await supabase.functions.invoke('parse-cookbook-image', {
        body: {
          householdId: household.id,
          imageUrl: signedUrlData.signedUrl,
        },
      })

      setCookbookScanning(false)

      if (invokeError) {
        setCookbookError(invokeError.message)
        return
      }

      if (!data?.success) {
        setCookbookError(data?.error || 'Failed to parse cookbook page')
        return
      }

      setCookbookRecipe(data.recipe as ScrapedRecipe)

      supabase.storage.from('pantry-scans').remove([fileName]).catch(() => {})
    } catch (err) {
      setCookbookError((err as Error).message)
      setCookbookUploading(false)
      setCookbookScanning(false)
    }

    if (cookbookFileRef.current) cookbookFileRef.current.value = ''
  }

  const handleSave = async () => {
    if (!recipe || !user || !household) return

    setSaving(true)
    setSaveError(null)

    const recipeData: RecipeInsert = {
      user_id: user.id,
      household_id: household.id,
      title: effectiveTitle || recipe.title,
      image_url: recipe.image,
      source_url: mode === 'url' ? url : null,
      servings: parseServings(recipe.yields),
      cook_time: recipe.total_time,
      ingredients: parseIngredients(recipe.ingredients),
      steps: parseSteps(recipe.instructions),
      ...(mode === 'cookbook' && selectedCookbookId && { cookbook_id: selectedCookbookId }),
      ...(mode === 'cookbook' && pageNumber && { cookbook_page_number: parseInt(pageNumber, 10) }),
    }

    const { data, error: insertError } = await supabase
      .from('recipes')
      .insert(recipeData)
      .select('id')
      .single()

    if (insertError) {
      setSaveError(insertError.message)
      setSaving(false)
      return
    }

    if (selectedGroupIds.length > 0) {
      await supabase
        .from('recipe_group_items')
        .insert(selectedGroupIds.map((groupId) => ({ recipe_id: data.id, group_id: groupId })))
    }

    navigate('/recipes')
  }

  const handleReset = () => {
    setUrl('')
    setText('')
    setTitleOverride(null)
    setSaveError(null)
    setSelectedGroupIds([])
    scrapeReset()
    parseReset()
    setCookbookRecipe(null)
    setCookbookError(null)
    if (cookbookPreview) URL.revokeObjectURL(cookbookPreview)
    setCookbookPreview(null)
  }

  const handleModeSwitch = (newMode: ImportMode) => {
    if (newMode === mode) return
    handleReset()
    setMode(newMode)
  }

  const modeButton = (m: ImportMode, label: string) => (
    <button
      type="button"
      onClick={() => handleModeSwitch(m)}
      className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        mode === m
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <CardTitle>Add Recipe</CardTitle>
          <CardDescription>
            Import a recipe from a URL, text, or cookbook photo
          </CardDescription>
          <div className="flex gap-1 rounded-lg bg-muted p-1">
            {modeButton('url', 'From URL')}
            {modeButton('text', 'From Text')}
            {modeButton('cookbook', 'From Cookbook')}
          </div>
        </CardHeader>

        {!recipe ? (
          mode === 'url' ? (
            <form onSubmit={handleScrape} className="flex flex-col gap-6">
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
          ) : mode === 'text' ? (
            <form onSubmit={handleParse} className="flex flex-col gap-6">
              <CardContent className="space-y-4">
                {insufficientCredits ? (
                  <InsufficientCreditsAlert />
                ) : error && (
                  <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <label htmlFor="recipe-text" className="text-sm font-medium">
                    Recipe Text
                  </label>
                  <Textarea
                    id="recipe-text"
                    placeholder="Paste your recipe text here — from Instagram captions, messages, blog posts, etc."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    required
                    disabled={loading}
                    rows={8}
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={loading || !text.trim()}>
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" />
                      Parsing...
                    </>
                  ) : (
                    'Parse Recipe'
                  )}
                </Button>
              </CardFooter>
            </form>
          ) : (
            <div className="flex flex-col gap-6">
              <CardContent className="space-y-4">
                {error && (
                  <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <label htmlFor="cookbook-select" className="text-sm font-medium">
                    Cookbook
                  </label>
                  {cookbooks.length > 0 ? (
                    <select
                      id="cookbook-select"
                      value={selectedCookbookId}
                      onChange={(e) => setSelectedCookbookId(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      disabled={loading}
                    >
                      <option value="">Select a cookbook...</option>
                      {cookbooks.map((cb) => (
                        <option key={cb.id} value={cb.id}>
                          {cb.title}{cb.author ? ` — ${cb.author}` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No cookbooks yet.{' '}
                      <a href="/cookbooks" className="text-primary underline">Add one first</a>.
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="page-number" className="text-sm font-medium">
                    Page Number (optional)
                  </label>
                  <Input
                    id="page-number"
                    type="number"
                    min="1"
                    value={pageNumber}
                    onChange={(e) => setPageNumber(e.target.value)}
                    placeholder="42"
                    disabled={loading}
                  />
                </div>

                {cookbookPreview && (
                  <div className="rounded-lg overflow-hidden border">
                    <img src={cookbookPreview} alt="Cookbook page" className="w-full max-h-48 object-cover" />
                  </div>
                )}

                {loading ? (
                  <div className="flex flex-col items-center gap-2 py-8">
                    <Loader2 className="size-8 animate-spin text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {cookbookUploading ? 'Uploading photo...' : 'Reading recipe from photo...'}
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <input
                      ref={cookbookFileRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleCookbookPhoto}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="h-24 border-dashed"
                      onClick={() => cookbookFileRef.current?.click()}
                      disabled={!selectedCookbookId}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <Camera className="size-6 text-muted-foreground" />
                        <span className="text-sm">Take Photo of Recipe Page</span>
                      </div>
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!selectedCookbookId}
                      onClick={() => {
                        if (cookbookFileRef.current) {
                          cookbookFileRef.current.removeAttribute('capture')
                          cookbookFileRef.current.click()
                          cookbookFileRef.current.setAttribute('capture', 'environment')
                        }
                      }}
                    >
                      <Upload className="size-4" />
                      Upload Photo
                    </Button>
                  </div>
                )}
              </CardContent>
            </div>
          )
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

              <div>
                <h3 className="font-medium mb-2">Add to Groups (optional)</h3>
                <GroupSelector
                  groups={groups}
                  selectedIds={selectedGroupIds}
                  onSelectionChange={setSelectedGroupIds}
                  onCreateGroup={createGroup}
                />
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
