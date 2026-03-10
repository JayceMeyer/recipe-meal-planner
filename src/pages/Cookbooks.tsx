import { useState, type FormEvent } from 'react'
import { Book, Plus, Loader2, Search, Trash2 } from 'lucide-react'
import { lookupIsbn } from '@/lib/isbn'
import { useCookbooks } from '@/hooks/useCookbooks'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function Cookbooks() {
  const { cookbooks, loading, deleteCookbook, addCookbook } = useCookbooks()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    await deleteCookbook(deleteTarget.id)
    setDeleting(false)
    setDeleteTarget(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="container max-w-2xl py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cookbooks</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="size-4" />
          Add Cookbook
        </Button>
      </div>

      {cookbooks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Book className="size-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">No cookbooks yet</p>
            <p className="text-sm text-muted-foreground mb-4">
              Add your physical cookbooks to digitize recipes from them.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="size-4" />
              Add Your First Cookbook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {cookbooks.map((cookbook) => (
            <Card key={cookbook.id}>
              <CardContent className="flex items-center gap-4 py-4">
                {cookbook.cover_image_url ? (
                  <img
                    src={cookbook.cover_image_url}
                    alt={cookbook.title}
                    className="size-16 rounded object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="size-16 rounded bg-muted flex items-center justify-center flex-shrink-0">
                    <Book className="size-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{cookbook.title}</p>
                  {cookbook.author && (
                    <p className="text-sm text-muted-foreground truncate">{cookbook.author}</p>
                  )}
                  {cookbook.isbn && (
                    <p className="text-xs text-muted-foreground">ISBN: {cookbook.isbn}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeleteTarget({ id: cookbook.id, title: cookbook.title })}
                >
                  <Trash2 className="size-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddCookbookDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdded={addCookbook}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Cookbook</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &quot;{deleteTarget?.title}&quot;? Recipes linked to this
              cookbook will keep their data but lose the cookbook reference.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
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

function AddCookbookDialog({
  open,
  onOpenChange,
  onAdded,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdded: (data: {
    title: string
    author?: string | null
    isbn?: string | null
    cover_image_url?: string | null
  }) => Promise<unknown>
}) {
  const [isbn, setIsbn] = useState('')
  const [title, setTitle] = useState('')
  const [author, setAuthor] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [looking, setLooking] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const resetForm = () => {
    setIsbn('')
    setTitle('')
    setAuthor('')
    setCoverImageUrl('')
    setLooking(false)
    setSaving(false)
    setError(null)
  }

  const handleOpenChange = (next: boolean) => {
    if (!next) resetForm()
    onOpenChange(next)
  }

  const handleLookup = async () => {
    if (!isbn.trim()) return
    setLooking(true)
    setError(null)

    const result = await lookupIsbn(isbn.trim())
    if (result) {
      setTitle(result.title)
      setAuthor(result.author ?? '')
      setCoverImageUrl(result.coverImageUrl ?? '')
    } else {
      setError('No book found for this ISBN. You can enter the details manually.')
    }
    setLooking(false)
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setSaving(true)
    setError(null)

    const result = await onAdded({
      title: title.trim(),
      author: author.trim() || null,
      isbn: isbn.trim() || null,
      cover_image_url: coverImageUrl.trim() || null,
    })

    if (!result) {
      setError('Failed to add cookbook')
      setSaving(false)
      return
    }

    resetForm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Cookbook</DialogTitle>
          <DialogDescription>
            Enter an ISBN to auto-fill details, or type them manually.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="isbn" className="text-sm font-medium">ISBN</label>
            <div className="flex gap-2">
              <Input
                id="isbn"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="978-0-123456-78-9"
                disabled={looking}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleLookup}
                disabled={looking || !isbn.trim()}
              >
                {looking ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Search className="size-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Title <span className="text-destructive">*</span>
            </label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="The Joy of Cooking"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="author" className="text-sm font-medium">Author</label>
            <Input
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Author name"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="cover" className="text-sm font-medium">Cover Image URL</label>
            {coverImageUrl && (
              <img
                src={coverImageUrl}
                alt="Cover preview"
                className="w-24 h-32 object-cover rounded border"
              />
            )}
            <Input
              id="cover"
              type="url"
              value={coverImageUrl}
              onChange={(e) => setCoverImageUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !title.trim()}>
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Add Cookbook'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
