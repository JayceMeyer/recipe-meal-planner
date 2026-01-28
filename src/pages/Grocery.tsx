import { useState } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { useGroceryListsWithCounts } from '@/hooks/useGroceryLists'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { GroceryListCard } from '@/components/GroceryListCard'
import { CreateListDialog } from '@/components/CreateListDialog'
import type { GroceryList } from '@/types/database'

export function Grocery() {
  const {
    lists,
    loading,
    error,
    activeListId,
    setActiveListId,
    createList,
    updateList,
    deleteList,
  } = useGroceryListsWithCounts()

  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editingList, setEditingList] = useState<GroceryList | null>(null)
  const [editName, setEditName] = useState('')
  const [deletingList, setDeletingList] = useState<GroceryList | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleEdit = async () => {
    if (!editingList || !editName.trim()) return

    const success = await updateList(editingList.id, editName.trim())
    if (success) {
      setEditingList(null)
      setEditName('')
    }
  }

  const handleDelete = async () => {
    if (!deletingList) return

    setDeleting(true)
    const success = await deleteList(deletingList.id)
    setDeleting(false)
    if (success) {
      setDeletingList(null)
    }
  }

  const openEdit = (list: GroceryList) => {
    setEditingList(list)
    setEditName(list.name)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Grocery Lists</h1>
          <p className="text-muted-foreground">Manage your shopping lists</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="size-4" />
          New List
        </Button>
      </div>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>
      )}

      {lists.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No grocery lists yet.</p>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="size-4" />
            Create your first list
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {lists.map((list) => (
            <GroceryListCard
              key={list.id}
              list={list}
              isActive={list.id === activeListId}
              onSelect={() => setActiveListId(list.id === activeListId ? null : list.id)}
              onEdit={() => openEdit(list)}
              onDelete={() => setDeletingList(list)}
            />
          ))}
        </div>
      )}

      <CreateListDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={createList}
      />

      <Dialog open={!!editingList} onOpenChange={(open) => !open && setEditingList(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit List</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="List name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleEdit()
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingList(null)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={!editName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingList} onOpenChange={(open) => !open && setDeletingList(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete List</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingList?.name}"? All items in this list will
              be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingList(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
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
    </div>
  )
}
