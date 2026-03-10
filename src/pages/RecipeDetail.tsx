import { useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Book,
  Camera,
  Check,
  Clock,
  Edit,
  ExternalLink,
  ImagePlus,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { useRecipe } from '@/hooks/useRecipe'
import { useImageUpload } from '@/hooks/useImageUpload'
import { useHousehold } from '@/contexts/HouseholdContext'
import { useGroups, useRecipeGroups } from '@/hooks/useGroups'
import { useServingCalculator } from '@/hooks/useServingCalculator'
import { ServingAdjuster } from '@/components/ServingAdjuster'
import { RecipeNotes } from '@/components/RecipeNotes'
import { AddToGroceryList } from '@/components/AddToGroceryList'
import { GroupBadge } from '@/components/GroupBadge'
import { AddToMealPlan } from '@/components/AddToMealPlan'
import { GroupSelector } from '@/components/GroupSelector'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function RecipeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { recipe, loading, error, deleteRecipe, promoteRecipe } = useRecipe(id)
  const [promoting, setPromoting] = useState(false)
  const { groups } = useGroups()
  const { groupIds, setGroups: saveGroups } = useRecipeGroups(id)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showGroupEditor, setShowGroupEditor] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const { household } = useHousehold()
  const { uploadImage, isUploading } = useImageUpload()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)

  const recipeGroups = groups.filter((g) => groupIds.includes(g.id))

  const {
    currentServings,
    scaledIngredients,
    increment,
    decrement,
    reset,
    isModified,
  } = useServingCalculator(recipe?.servings ?? 0, recipe?.ingredients ?? [])

  const displayImageUrl = uploadedUrl ?? recipe?.image_url

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !recipe || !household) return

    const url = await uploadImage(recipe.id, household.id, file)
    if (url) setUploadedUrl(url)

    // Reset input so the same file can be re-selected
    e.target.value = ''
  }

  const handlePromote = async () => {
    setPromoting(true)
    await promoteRecipe()
    setPromoting(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    const success = await deleteRecipe()
    if (success) {
      navigate('/recipes')
    } else {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !recipe) {
    return (
      <div className="container py-8">
        <div className="p-4 text-sm text-destructive bg-destructive/10 rounded-md mb-4">
          {error || 'Recipe not found'}
        </div>
        <Button variant="outline" onClick={() => navigate('/recipes')}>
          <ArrowLeft className="size-4" />
          Back to Recipes
        </Button>
      </div>
    )
  }

  const totalTime =
    recipe.prep_time || recipe.cook_time
      ? (recipe.prep_time ?? 0) + (recipe.cook_time ?? 0)
      : null

  return (
    <div className="pb-8 overflow-x-hidden">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      {displayImageUrl ? (
        <div className="relative h-64 sm:h-80 group">
          <img
            src={displayImageUrl}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 left-4 bg-black/20 text-white hover:bg-black/40"
            onClick={() => navigate('/recipes')}
          >
            <ArrowLeft className="size-5" />
          </Button>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute top-4 right-4 bg-black/20 text-white hover:bg-black/40 rounded-md p-2 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
            aria-label="Change photo"
          >
            {isUploading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Camera className="size-5" />
            )}
          </button>
        </div>
      ) : (
        <div className="container pt-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate('/recipes')}>
              <ArrowLeft className="size-4" />
              Back
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ImagePlus className="size-4" />
              )}
              Add Photo
            </Button>
          </div>
        </div>
      )}

      <div className="container">
        <div className={displayImageUrl ? '-mt-16 relative' : 'mt-4'}>
          <div className={displayImageUrl ? 'bg-background rounded-t-xl p-6' : ''}>
            <div className="flex flex-col gap-3 mb-4">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{recipe.title}</h1>
                {recipe.source === 'ai' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    <Sparkles className="size-3" />
                    AI Generated
                  </span>
                )}
                {recipe.cookbooks && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                    <Book className="size-3" />
                    From: {recipe.cookbooks.title}
                    {recipe.cookbook_page_number && `, p. ${recipe.cookbook_page_number}`}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {recipe.source === 'ai' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePromote}
                    disabled={promoting}
                  >
                    {promoting ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Check className="size-4" />
                    )}
                    Save to Collection
                  </Button>
                )}
                <AddToMealPlan recipeId={recipe.id} />
                <Button variant="outline" size="icon" asChild>
                  <Link to={`/recipes/${recipe.id}/edit`}>
                    <Edit className="size-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
              {totalTime && (
                <div className="flex items-center gap-1">
                  <Clock className="size-4" />
                  <span>{totalTime} min</span>
                  {recipe.prep_time && recipe.cook_time && (
                    <span className="text-xs">
                      ({recipe.prep_time} prep + {recipe.cook_time} cook)
                    </span>
                  )}
                </div>
              )}
              {recipe.source_url && (
                <a
                  href={recipe.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <ExternalLink className="size-4" />
                  <span>Source</span>
                </a>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 mb-6">
              {recipeGroups.map((group) => (
                <GroupBadge key={group.id} name={group.name} />
              ))}
              <button
                type="button"
                onClick={() => setShowGroupEditor(true)}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
              >
                <Plus className="size-3" />
                {recipeGroups.length === 0 ? 'Add to group' : 'Edit'}
              </button>
            </div>

            {recipe.description && (
              <p className="text-muted-foreground mb-6">{recipe.description}</p>
            )}
          </div>

          <div className="space-y-8 mt-6">
            <section>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">Ingredients</h2>
                  <AddToGroceryList
                    recipeId={recipe.id}
                    ingredients={scaledIngredients}
                  />
                </div>
                {recipe.servings && (
                  <ServingAdjuster
                    currentServings={currentServings}
                    originalServings={recipe.servings}
                    onIncrement={increment}
                    onDecrement={decrement}
                    onReset={reset}
                    isModified={isModified}
                  />
                )}
              </div>
              <ul className="space-y-2">
                {scaledIngredients.map((ingredient, index) => (
                  <li key={index} className="flex items-center gap-3 group">
                    <span className="size-2 rounded-full bg-primary shrink-0" />
                    <span className="flex-1">
                      {ingredient.amount && `${ingredient.amount} `}
                      {ingredient.unit && `${ingredient.unit} `}
                      {ingredient.name}
                    </span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                      <AddToGroceryList
                        recipeId={recipe.id}
                        ingredients={scaledIngredients}
                        singleIngredient={ingredient}
                      />
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-4">Instructions</h2>
              <ol className="space-y-4">
                {recipe.steps.map((step) => (
                  <li key={step.order} className="flex gap-4">
                    <span className="flex items-center justify-center size-7 rounded-full bg-primary text-primary-foreground text-sm font-medium shrink-0">
                      {step.order}
                    </span>
                    <p className="pt-0.5 min-w-0 break-words">{step.instruction}</p>
                  </li>
                ))}
              </ol>
            </section>

            <section>
              <RecipeNotes
                recipeId={recipe.id}
                initialNotes={recipe.notes}
                initialRating={recipe.rating}
              />
            </section>
          </div>
        </div>
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Recipe</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{recipe.title}"? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <GroupEditorDialog
        open={showGroupEditor}
        onOpenChange={setShowGroupEditor}
        groups={groups}
        selectedIds={groupIds}
        onSelectionChange={saveGroups}
      />
    </div>
  )
}

function GroupEditorDialog({
  open,
  onOpenChange,
  groups,
  selectedIds,
  onSelectionChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  groups: ReturnType<typeof useGroups>['groups']
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => Promise<boolean>
}) {
  const { createGroup } = useGroups()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Groups</DialogTitle>
        </DialogHeader>
        <GroupSelector
          groups={groups}
          selectedIds={selectedIds}
          onSelectionChange={(newIds) => {
            onSelectionChange(newIds)
          }}
          onCreateGroup={createGroup}
        />
      </DialogContent>
    </Dialog>
  )
}
