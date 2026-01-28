import { useState } from 'react'
import { Check, Loader2, Plus, ShoppingCart } from 'lucide-react'
import { useGroceryLists } from '@/hooks/useGroceryLists'
import { useAddToGroceryList } from '@/hooks/useAddToGroceryList'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type { Ingredient } from '@/types/database'

interface AddToGroceryListProps {
  recipeId: string
  ingredients: Ingredient[]
  singleIngredient?: Ingredient
  variant?: 'button' | 'icon'
}

export function AddToGroceryList({
  recipeId,
  ingredients,
  singleIngredient,
  variant = 'button',
}: AddToGroceryListProps) {
  const { lists, loading: listsLoading, createList } = useGroceryLists()
  const { adding, addIngredient, addAllIngredients } = useAddToGroceryList()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [creating, setCreating] = useState(false)
  const [successListId, setSuccessListId] = useState<string | null>(null)

  const handleAddToList = async (listId: string) => {
    let success: boolean
    if (singleIngredient) {
      success = await addIngredient(listId, singleIngredient, recipeId)
    } else {
      success = await addAllIngredients(listId, ingredients, recipeId)
    }

    if (success) {
      setSuccessListId(listId)
      setTimeout(() => setSuccessListId(null), 2000)
    }
  }

  const handleCreateAndAdd = async () => {
    if (!newListName.trim()) return

    setCreating(true)
    const newList = await createList(newListName.trim())
    setCreating(false)

    if (newList) {
      setShowCreateDialog(false)
      setNewListName('')
      await handleAddToList(newList.id)
    }
  }

  const buttonContent = singleIngredient ? (
    <>
      <Plus className="size-4" />
      {variant === 'button' && 'Add'}
    </>
  ) : (
    <>
      <ShoppingCart className="size-4" />
      {variant === 'button' && 'Add to List'}
    </>
  )

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={singleIngredient ? 'ghost' : 'outline'}
            size={variant === 'icon' || singleIngredient ? 'icon' : 'default'}
            disabled={adding || listsLoading}
          >
            {adding ? <Loader2 className="size-4 animate-spin" /> : buttonContent}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {lists.length === 0 ? (
            <DropdownMenuItem disabled className="text-muted-foreground">
              No lists yet
            </DropdownMenuItem>
          ) : (
            lists.map((list) => (
              <DropdownMenuItem
                key={list.id}
                onClick={() => handleAddToList(list.id)}
                className="flex items-center justify-between"
              >
                <span>{list.name}</span>
                {successListId === list.id && <Check className="size-4 text-green-500" />}
              </DropdownMenuItem>
            ))
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setShowCreateDialog(true)}>
            <Plus className="size-4" />
            Create new list
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New List</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="List name..."
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleCreateAndAdd()
                }
              }}
              disabled={creating}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateAndAdd} disabled={creating || !newListName.trim()}>
              {creating ? (
                <>
                  <Loader2 className="animate-spin" />
                  Creating...
                </>
              ) : (
                'Create & Add'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
