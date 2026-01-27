import { useState } from 'react'
import { Check, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { RecipeGroup } from '@/types/database'

interface GroupSelectorProps {
  groups: RecipeGroup[]
  selectedIds: string[]
  onSelectionChange: (groupIds: string[]) => void
  onCreateGroup?: (name: string) => Promise<RecipeGroup | null>
  loading?: boolean
}

export function GroupSelector({
  groups,
  selectedIds,
  onSelectionChange,
  onCreateGroup,
  loading = false,
}: GroupSelectorProps) {
  const [newGroupName, setNewGroupName] = useState('')
  const [creating, setCreating] = useState(false)

  const handleToggle = (groupId: string) => {
    if (selectedIds.includes(groupId)) {
      onSelectionChange(selectedIds.filter((id) => id !== groupId))
    } else {
      onSelectionChange([...selectedIds, groupId])
    }
  }

  const handleCreate = async () => {
    if (!onCreateGroup || !newGroupName.trim()) return

    setCreating(true)
    const newGroup = await onCreateGroup(newGroupName.trim())
    setCreating(false)

    if (newGroup) {
      setNewGroupName('')
      onSelectionChange([...selectedIds, newGroup.id])
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {groups.map((group) => {
          const isSelected = selectedIds.includes(group.id)
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => handleToggle(group.id)}
              disabled={loading}
              className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors',
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {isSelected && <Check className="size-3" />}
              {group.name}
            </button>
          )
        })}
        {groups.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground">No groups yet</p>
        )}
      </div>

      {onCreateGroup && (
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
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleCreate}
            disabled={creating || !newGroupName.trim()}
          >
            <Plus className="size-4" />
          </Button>
        </div>
      )}
    </div>
  )
}
