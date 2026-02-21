import { useState, useEffect, useRef, type FormEvent } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ImagePlus, Loader2, Trash2, X } from 'lucide-react'
import { useRecipe } from '@/hooks/useRecipe'
import { useRecipeForm } from '@/hooks/useRecipeForm'
import { useImageUpload } from '@/hooks/useImageUpload'
import { useHousehold } from '@/contexts/HouseholdContext'
import { useGroups, useRecipeGroups } from '@/hooks/useGroups'
import { GroupSelector } from '@/components/GroupSelector'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { IngredientList } from '@/components/IngredientList'
import { StepList } from '@/components/StepList'
import { CUISINES } from '@/utils/spoonacularMapper'
import { cn } from '@/lib/utils'

export function RecipeForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEditMode = Boolean(id)

  const { recipe, loading: loadingRecipe, error: loadError } = useRecipe(id)

  if (isEditMode && loadingRecipe) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (isEditMode && loadError) {
    return (
      <div className="container py-8">
        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md mb-4">
          {loadError}
        </div>
        <Button variant="outline" onClick={() => navigate('/recipes')}>
          <ArrowLeft className="size-4" />
          Back to Recipes
        </Button>
      </div>
    )
  }

  return <RecipeFormContent recipe={isEditMode ? recipe : undefined} />
}

function RecipeFormContent({ recipe }: { recipe?: ReturnType<typeof useRecipe>['recipe'] }) {
  const navigate = useNavigate()
  const isEditMode = Boolean(recipe)

  const {
    formData,
    updateField,
    addIngredient,
    updateIngredient,
    removeIngredient,
    moveIngredient,
    addStep,
    updateStep,
    removeStep,
    moveStep,
    save,
    saving,
    error,
    isValid,
  } = useRecipeForm(recipe ?? undefined)

  const { household } = useHousehold()
  const { uploadImage, isUploading } = useImageUpload()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const { groups, createGroup } = useGroups()
  const { groupIds: existingGroupIds, loading: groupsLoading, setGroups: saveGroupAssignments } = useRecipeGroups(recipe?.id)
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])

  useEffect(() => {
    if (isEditMode && !groupsLoading) {
      setSelectedGroupIds(existingGroupIds)
    }
  }, [isEditMode, groupsLoading, existingGroupIds])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show instant preview
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    if (isEditMode && recipe && household) {
      // Edit mode: upload immediately
      const url = await uploadImage(recipe.id, household.id, file)
      if (url) {
        updateField('image_url', url)
        URL.revokeObjectURL(objectUrl)
        setPreviewUrl(null)
      }
    } else {
      // Create mode: store file, upload after save
      setPendingFile(file)
    }

    e.target.value = ''
  }

  const handleClearImage = () => {
    updateField('image_url', '')
    setPreviewUrl(null)
    setPendingFile(null)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const savedId = await save()
    if (!savedId) return

    // Upload pending image for newly created recipes
    if (pendingFile && household) {
      await uploadImage(savedId, household.id, pendingFile)
    }

    if (isEditMode) {
      await saveGroupAssignments(selectedGroupIds)
    } else if (selectedGroupIds.length > 0) {
      const { supabase } = await import('@/lib/supabase')
      await supabase
        .from('recipe_group_items')
        .insert(selectedGroupIds.map((groupId) => ({ recipe_id: savedId, group_id: groupId })))
    }

    navigate(`/recipes/${savedId}`)
  }

  return (
    <div className="container max-w-2xl py-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="size-5" />
            </Button>
            <CardTitle>{isEditMode ? 'Edit Recipe' : 'New Recipe'}</CardTitle>
          </div>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="title" className="text-sm font-medium">
                Title <span className="text-destructive">*</span>
              </label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="Recipe name"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Brief description of the recipe"
                className="w-full min-h-[80px] px-3 py-2 text-base md:text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Image</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
              {(previewUrl || formData.image_url) ? (
                <div className="relative w-full aspect-video rounded-md overflow-hidden border border-input bg-muted">
                  <img
                    src={previewUrl || formData.image_url}
                    alt="Recipe preview"
                    className="w-full h-full object-cover"
                  />
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                      <Loader2 className="size-6 animate-spin text-white" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="size-8 bg-black/40 text-white hover:bg-black/60"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      <ImagePlus className="size-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="size-8 bg-black/40 text-white hover:bg-black/60"
                      onClick={handleClearImage}
                      disabled={isUploading}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full aspect-video rounded-md border-2 border-dashed border-input bg-muted/50 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:bg-muted/80 transition-colors"
                >
                  <ImagePlus className="size-8" />
                  <span className="text-sm">Upload a photo</span>
                </button>
              )}
              <Input
                id="image_url"
                type="url"
                value={formData.image_url}
                onChange={(e) => updateField('image_url', e.target.value)}
                placeholder="Or paste an image URL"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label htmlFor="servings" className="text-sm font-medium">
                  Servings
                </label>
                <Input
                  id="servings"
                  type="number"
                  min="1"
                  value={formData.servings}
                  onChange={(e) => updateField('servings', e.target.value)}
                  placeholder="4"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="prep_time" className="text-sm font-medium">
                  Prep (min)
                </label>
                <Input
                  id="prep_time"
                  type="number"
                  min="0"
                  value={formData.prep_time}
                  onChange={(e) => updateField('prep_time', e.target.value)}
                  placeholder="15"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="cook_time" className="text-sm font-medium">
                  Cook (min)
                </label>
                <Input
                  id="cook_time"
                  type="number"
                  min="0"
                  value={formData.cook_time}
                  onChange={(e) => updateField('cook_time', e.target.value)}
                  placeholder="30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="source_url" className="text-sm font-medium">
                Source URL
              </label>
              <Input
                id="source_url"
                type="url"
                value={formData.source_url}
                onChange={(e) => updateField('source_url', e.target.value)}
                placeholder="https://example.com/recipe"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cuisine</label>
              <div className="flex flex-wrap gap-2">
                {CUISINES.map((cuisine) => {
                  const selected = formData.cuisine.includes(cuisine)
                  return (
                    <button
                      key={cuisine}
                      type="button"
                      onClick={() => {
                        updateField(
                          'cuisine',
                          selected
                            ? formData.cuisine.filter((c) => c !== cuisine)
                            : [...formData.cuisine, cuisine],
                        )
                      }}
                      className={cn(
                        'inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                        selected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80',
                      )}
                    >
                      {cuisine}
                      {selected && <X className="size-3" />}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Groups</label>
              <GroupSelector
                groups={groups}
                selectedIds={selectedGroupIds}
                onSelectionChange={setSelectedGroupIds}
                onCreateGroup={createGroup}
              />
            </div>

            <IngredientList
              ingredients={formData.ingredients}
              onAdd={addIngredient}
              onUpdate={updateIngredient}
              onRemove={removeIngredient}
              onMove={moveIngredient}
            />

            <StepList
              steps={formData.steps}
              onAdd={addStep}
              onUpdate={updateStep}
              onRemove={removeStep}
              onMove={moveStep}
            />

            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium">
                Notes
              </label>
              <textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Tips, variations, or other notes..."
                className="w-full min-h-[100px] px-3 py-2 text-base md:text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
              />
            </div>
          </CardContent>

          <CardFooter className="flex gap-2">
            <Button type="submit" disabled={saving || !isValid}>
              {saving ? (
                <>
                  <Loader2 className="animate-spin" />
                  Saving...
                </>
              ) : isEditMode ? (
                'Save Changes'
              ) : (
                'Create Recipe'
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
              disabled={saving}
            >
              Cancel
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
