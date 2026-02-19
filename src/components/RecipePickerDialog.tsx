import { useState, useMemo } from 'react'
import { Search, UtensilsCrossed, Loader2, PenLine } from 'lucide-react'
import { useRecipes } from '@/hooks/useRecipes'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Recipe } from '@/types/database'

interface RecipePickerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (recipe: Recipe) => void
  onCustomMeal?: (text: string) => void
}

export function RecipePickerDialog({ open, onOpenChange, onSelect, onCustomMeal }: RecipePickerDialogProps) {
  const [search, setSearch] = useState('')
  const [customText, setCustomText] = useState('')
  const { recipes, loading } = useRecipes()

  const filtered = useMemo(() => {
    if (!search.trim()) return recipes
    const query = search.toLowerCase()
    return recipes.filter((r) => r.title.toLowerCase().includes(query))
  }, [recipes, search])

  const handleCustomSubmit = () => {
    if (!customText.trim() || !onCustomMeal) return
    onCustomMeal(customText.trim())
    onOpenChange(false)
    setCustomText('')
    setSearch('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add a Meal</DialogTitle>
        </DialogHeader>
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
        <div className="overflow-y-auto flex-1 -mx-6 px-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <UtensilsCrossed className="size-10 text-muted-foreground/40 mb-2" />
              <p className="text-sm text-muted-foreground">No recipes found</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filtered.map((recipe) => (
                <button
                  key={recipe.id}
                  type="button"
                  onClick={() => {
                    onSelect(recipe)
                    onOpenChange(false)
                    setSearch('')
                  }}
                  className="flex items-center gap-3 w-full rounded-lg p-2 text-left hover:bg-accent transition-colors"
                >
                  <div className="size-10 rounded bg-muted shrink-0 overflow-hidden">
                    {recipe.image_url ? (
                      <img
                        src={recipe.image_url}
                        alt=""
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="size-full flex items-center justify-center">
                        <UtensilsCrossed className="size-4 text-muted-foreground/40" />
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-medium line-clamp-1">{recipe.title}</span>
                </button>
              ))}
            </div>
          )}

          {onCustomMeal && (
            <>
              <div className="flex items-center gap-3 my-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">Or just type what you're making</span>
                <div className="h-px flex-1 bg-border" />
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <PenLine className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    placeholder="e.g. Leftover pizza"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleCustomSubmit()
                      }
                    }}
                    className="pl-10"
                  />
                </div>
                <Button onClick={handleCustomSubmit} disabled={!customText.trim()}>
                  Add
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
