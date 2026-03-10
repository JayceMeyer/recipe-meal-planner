import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Loader2 } from 'lucide-react'

interface TypeDeleteConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  itemCount: number
  onConfirm: () => Promise<void>
  loading: boolean
}

export function TypeDeleteConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  itemCount,
  onConfirm,
  loading,
}: TypeDeleteConfirmDialogProps) {
  const [confirmText, setConfirmText] = useState('')
  const isConfirmed = confirmText === 'DELETE'

  const handleOpenChange = (next: boolean) => {
    if (!next) setConfirmText('')
    onOpenChange(next)
  }

  const handleConfirm = async () => {
    if (!isConfirmed || loading) return
    await onConfirm()
    setConfirmText('')
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <p className="text-sm font-medium text-destructive">
            This will permanently delete {itemCount} {itemCount === 1 ? 'item' : 'items'}.
          </p>
          <div>
            <label className="text-sm text-muted-foreground" htmlFor="delete-confirm">
              Type <span className="font-mono font-semibold">DELETE</span> to confirm
            </label>
            <Input
              id="delete-confirm"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="mt-1.5"
              disabled={loading}
              autoComplete="off"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={!isConfirmed || loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Delete {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
