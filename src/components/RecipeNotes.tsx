import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { StarRating } from './StarRating'
import { useRecipeNotes } from '@/hooks/useRecipeNotes'

interface RecipeNotesProps {
  recipeId: string
  initialNotes: string | null
  initialRating: number | null
}

export function RecipeNotes({
  recipeId,
  initialNotes,
  initialRating,
}: RecipeNotesProps) {
  const [notes, setNotes] = useState(initialNotes ?? '')
  const [rating, setRating] = useState(initialRating)
  const { saving, error, saveNotes, saveRating } = useRecipeNotes(recipeId)

  const handleNotesChange = (newNotes: string) => {
    setNotes(newNotes)
    saveNotes(newNotes)
  }

  const handleRatingChange = (newRating: number) => {
    setRating(newRating)
    saveRating(newRating)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">My Rating</h2>
        <div className="flex items-center gap-2">
          <StarRating value={rating} onChange={handleRatingChange} size="lg" />
          {saving && (
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="recipe-notes" className="text-lg font-semibold">
            My Notes
          </label>
          {saving && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Loader2 className="size-3 animate-spin" />
              Saving...
            </span>
          )}
        </div>
        <textarea
          id="recipe-notes"
          value={notes}
          onChange={(e) => handleNotesChange(e.target.value)}
          placeholder="Add your personal notes, tips, or modifications..."
          className="w-full min-h-[120px] px-3 py-2 text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 resize-none"
        />
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    </div>
  )
}
