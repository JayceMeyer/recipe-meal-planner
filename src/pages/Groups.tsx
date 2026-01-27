import { useState } from 'react'
import { Edit2, Loader2, Plus, Trash2 } from 'lucide-react'
import { useGroups } from '@/hooks/useGroups'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { RecipeGroup } from '@/types/database'

export function Groups() {
  const { groups, loading, error, createGroup, updateGroup, deleteGroup } = useGroups()
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container py-8">
      <Card>
        <CardHeader>
          <CardTitle>Recipe Groups</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
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
            <Button onClick={handleCreate} disabled={creating || !newGroupName.trim()}>
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

          <div className="space-y-2">
            {groups.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No groups yet. Create your first group above.
              </p>
            ) : (
              groups.map((group) => (
                <div
                  key={group.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <span className="font-medium">{group.name}</span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(group)}
                      aria-label={`Edit ${group.name}`}
                    >
                      <Edit2 className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeletingGroup(group)}
                      aria-label={`Delete ${group.name}`}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={!!editingGroup} onOpenChange={(open) => !open && setEditingGroup(null)}>
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingGroup} onOpenChange={(open) => !open && setDeletingGroup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Group</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingGroup?.name}"? Recipes in this group will
              not be deleted, but they will no longer be in this group.
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
    </div>
  )
}
