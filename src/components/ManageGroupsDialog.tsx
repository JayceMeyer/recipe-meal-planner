import { useState } from 'react'
import { Edit2, Loader2, Plus, Settings, Trash2 } from 'lucide-react'
import { useGroups } from '@/hooks/useGroups'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import type { RecipeGroup } from '@/types/database'

interface ManageGroupsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ManageGroupsDialog({ open, onOpenChange }: ManageGroupsDialogProps) {
  const { groups, error, createGroup, updateGroup, deleteGroup } = useGroups()
  const [newGroupName, setNewGroupName] = useState('')
  const [creating, setCreating] = useState(false)
  const [editingGroup, setEditingGroup] = useState<RecipeGroup | null>(null)
  const [editName, setEditName] = useState('')
  const [deletingGroup, setDeletingGroup] = useState<RecipeGroup | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleCreate = async () => {
    if (!newGroupName.trim()) return
    setCreating(true)
    await createGroup(newGroupName.trim())
    setCreating(false)
    setNewGroupName('')
  }

  const handleEdit = async () => {
    if (!editingGroup || !editName.trim()) return
    const success = await updateGroup(editingGroup.id, editName.trim())
    if (success) {
      setEditingGroup(null)
      setEditName('')
    }
  }

  const handleDelete = async () => {
    if (!deletingGroup) return
    setDeleting(true)
    const success = await deleteGroup(deletingGroup.id)
    setDeleting(false)
    if (success) {
      setDeletingGroup(null)
    }
  }

  const openEdit = (group: RecipeGroup) => {
    setEditingGroup(group)
    setEditName(group.name)
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Manage Groups</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Input
                placeholder="New group name..."
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleCreate()
                  }
                }}
                disabled={creating}
              />
              <Button onClick={handleCreate} disabled={creating || !newGroupName.trim()} size="sm">
                {creating ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <>
                    <Plus className="size-4" />
                    Add
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {groups.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No groups yet. Create your first group above.
                </p>
              ) : (
                groups.map((group) => (
                  <div
                    key={group.id}
                    className="flex items-center justify-between p-2 rounded-lg border"
                  >
                    <span className="text-sm font-medium">{group.name}</span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => openEdit(group)}
                        aria-label={`Edit ${group.name}`}
                      >
                        <Edit2 className="size-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7"
                        onClick={() => setDeletingGroup(group)}
                        aria-label={`Delete ${group.name}`}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingGroup} onOpenChange={(o) => !o && setEditingGroup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Group name"
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
            <Button variant="outline" onClick={() => setEditingGroup(null)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={!editName.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingGroup} onOpenChange={(o) => !o && setDeletingGroup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{deletingGroup?.name}&rdquo;? Recipes in this
              group will not be deleted, but they will no longer be in this group.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingGroup(null)} disabled={deleting}>
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
    </>
  )
}

export function ManageGroupsButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center size-8 rounded-full text-muted-foreground hover:bg-muted/80 transition-colors"
        aria-label="Manage groups"
      >
        <Settings className="size-4" />
      </button>
      <ManageGroupsDialog open={open} onOpenChange={setOpen} />
    </>
  )
}
