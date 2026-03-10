import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { TypeDeleteConfirmDialog } from '@/components/TypeDeleteConfirmDialog'
import { useHousehold } from '@/contexts/HouseholdContext'
import { usePantryItems } from '@/hooks/usePantryItems'
import { useGroceryLists } from '@/hooks/useGroceryLists'
import { AlertTriangle, Trash2, CheckCircle2 } from 'lucide-react'

export function DataManagementSection() {
  const { isOwner } = useHousehold()
  const { items: pantryItems, deleteAllItems, error: pantryError } = usePantryItems()
  const { lists: groceryLists, deleteAllLists, error: groceryError } = useGroceryLists()

  const [pantryDialogOpen, setPantryDialogOpen] = useState(false)
  const [groceryDialogOpen, setGroceryDialogOpen] = useState(false)
  const [pantryDeleting, setPantryDeleting] = useState(false)
  const [groceryDeleting, setGroceryDeleting] = useState(false)
  const [pantrySuccess, setPantrySuccess] = useState(false)
  const [grocerySuccess, setGrocerySuccess] = useState(false)

  if (!isOwner) return null

  const handleDeletePantry = async () => {
    setPantryDeleting(true)
    const success = await deleteAllItems()
    setPantryDeleting(false)
    if (success) {
      setPantryDialogOpen(false)
      setPantrySuccess(true)
      setTimeout(() => setPantrySuccess(false), 5000)
    }
  }

  const handleDeleteGrocery = async () => {
    setGroceryDeleting(true)
    const success = await deleteAllLists()
    setGroceryDeleting(false)
    if (success) {
      setGroceryDialogOpen(false)
      setGrocerySuccess(true)
      setTimeout(() => setGrocerySuccess(false), 5000)
    }
  }

  return (
    <>
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Permanently delete household data. These actions cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {(pantrySuccess || grocerySuccess) && (
            <div className="flex items-center gap-2 rounded-lg bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400">
              <CheckCircle2 className="h-4 w-4" />
              {pantrySuccess && 'All pantry items deleted successfully.'}
              {grocerySuccess && 'All grocery lists deleted successfully.'}
            </div>
          )}

          <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <div>
              <p className="text-sm font-medium">Clean Out Pantry</p>
              <p className="text-xs text-muted-foreground">
                Delete all pantry items for this household
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setPantryDialogOpen(true)}
              disabled={pantryItems.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete{pantryItems.length > 0 && ` (${pantryItems.length})`}
            </Button>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <div>
              <p className="text-sm font-medium">Clear All Grocery Lists</p>
              <p className="text-xs text-muted-foreground">
                Delete all grocery lists and their items
              </p>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setGroceryDialogOpen(true)}
              disabled={groceryLists.length === 0}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              Delete{groceryLists.length > 0 && ` (${groceryLists.length})`}
            </Button>
          </div>
        </CardContent>
      </Card>

      <TypeDeleteConfirmDialog
        open={pantryDialogOpen}
        onOpenChange={setPantryDialogOpen}
        title="Clean Out Pantry"
        description="This will permanently delete all pantry items for your household. This action cannot be undone."
        itemCount={pantryItems.length}
        onConfirm={handleDeletePantry}
        loading={pantryDeleting}
        error={pantryError}
      />

      <TypeDeleteConfirmDialog
        open={groceryDialogOpen}
        onOpenChange={setGroceryDialogOpen}
        title="Clear All Grocery Lists"
        description="This will permanently delete all grocery lists and their items for your household. This action cannot be undone."
        itemCount={groceryLists.length}
        onConfirm={handleDeleteGrocery}
        loading={groceryDeleting}
        error={groceryError}
      />
    </>
  )
}
